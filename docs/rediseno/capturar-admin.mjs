// Capturas del admin nuevo (/admin-next) para revisar la ola: cada vista a 1440 y 390 px y un video del
// recorrido (una obra completa, de «Nueva obra» a publicada, y el CV de una vacante pegada). Corre sobre
// una copia de la base con la muestra de vacantes, sin tocar nada real:
//
//   pnpm build:admin
//   node scripts/admin-run.mjs --demo -- node docs/rediseno/capturar-admin.mjs
//
// admin-run deja ADMIN_API_URL y PW_ADMIN_TOKEN (la clave de la corrida, que nunca se imprime) y borra la
// copia al terminar. La obra del recorrido se elimina con sus archivos. En las capturas los correos que no
// son de ejemplo se reemplazan por uno ficticio; la hoja del CV (un iframe aislado) queda tal cual, porque
// es el CV público del sitio. Las vacantes son la muestra ficticia (Ejemplo…) y una pegada de example.com.
//
// Salida: docs/rediseno/capturas/admin-nuevo/<vista>-1440.png, <vista>-390.png, recorrido.webm y, si hay
// ffmpeg (FFMPEG lo cambia), recorrido.mp4. Esa carpeta no se versiona (.gitignore: docs/rediseno/capturas/).
import { spawnSync } from 'node:child_process'
import { mkdir, readFile, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium, request as http } from '@playwright/test'
import { allViews, PASTED_ES } from '../../tests/e2e/admin-support.ts'

const BASE = process.env.ADMIN_API_URL
const TOKEN = process.env.PW_ADMIN_TOKEN
if (!BASE || !TOKEN) {
  console.error('Correr con: node scripts/admin-run.mjs --demo -- node docs/rediseno/capturar-admin.mjs')
  process.exit(2)
}
const ADMIN = `${BASE}/admin-next/`
const DIR = 'docs/rediseno/capturas/admin-nuevo'
const FFMPEG = process.env.FFMPEG || 'ffmpeg'
const WIDTHS = [{ width: 1440, height: 900, scale: 1 }, { width: 390, height: 844, scale: 2 }]
const IMAGES = ['hero.webp', 'proyecto.webp', 'movil-hero.webp'].map(f => join('public/media/projects/argpiscinas', f))

const slug = name => name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Correos reales fuera de las capturas: en el texto y en los campos (sin tocar el formulario). */
function anonymize(page) {
  return page.evaluate(() => {
    const mail = /\b[\w.+-]+@(?!example\.com\b)[\w-]+(\.[\w-]+)+\b/g
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const swap = text => text.replace(mail, 'contacto@ejemplo.com')
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (swap(n.nodeValue) !== n.nodeValue) n.nodeValue = swap(n.nodeValue)
    }
    for (const input of document.querySelectorAll('input, textarea')) {
      if (swap(input.value) !== input.value) input.value = swap(input.value)
    }
  })
}

async function settle(page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter(a => a.effect?.getComputedTiming().endTime !== Infinity)
    .map(a => a.finished.catch(() => null))))
  await page.mouse.move(0, 0)
}

async function signedIn(context) {
  await context.addInitScript(key => sessionStorage.setItem('adm-token', key), TOKEN)
  const page = await context.newPage()
  await page.goto(`${ADMIN}#/inicio`)
  await page.locator('#main h1').waitFor()
  return page
}

async function screens(browser, views) {
  for (const { width, height, scale } of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale })
    const page = await signedIn(context)
    for (const view of views) {
      // Una carga nueva por vista: con solo el hash, la anterior sigue a la vista durante la transición.
      await page.goto('about:blank')
      await page.goto(`${ADMIN}${view.hash}`)
      await page.locator('#main h1').waitFor()
      await settle(page)
      await anonymize(page)
      await page.screenshot({ path: join(DIR, `${slug(view.name)}-${width}.png`) })
    }
    console.log(`  ${views.length} vistas a ${width} px`)
    await context.close()
  }
}

const pause = (page, ms = 700) => page.waitForTimeout(ms)
const type = async (locator, text) => {
  await locator.click()
  await locator.pressSequentially(text, { delay: 18 })
}

/** La obra del invariante 4, como la cargaría una persona, con pausas para que se lea. */
async function projectTour(page, title) {
  const field = label => page.getByLabel(label, { exact: true })
  const tab = name => page.getByRole('tablist', { name: 'Secciones del registro' }).getByRole('tab', { name })
  await page.goto(`${ADMIN}#/obras`)
  await settle(page)
  await pause(page)
  await page.locator('#main').getByRole('button', { name: 'Nueva obra' }).click()
  await type(field('Título'), title)
  await type(field('Rol · Español'), 'Diseño y desarrollo')
  await tab(/^Relato/).click()
  await type(field('Síntesis · Español'), 'Un sitio para una casa de comidas, de la carta a las reservas.')
  await type(field('Reto · Español'), 'La carta vivía en un PDF que nadie actualizaba.')
  await type(field('Resultado · Español'), 'La carta se actualiza desde un panel y las reservas llegan ordenadas.')
  await page.getByRole('button', { name: 'Agregar paso' }).click()
  await type(field('Título del paso · Español'), 'La carta primero')
  await type(field('Qué hiciste · Español'), 'Se armó la carta como datos y no como imagen.')
  await tab(/^Datos/).click()
  const techs = page.getByRole('combobox', { name: 'Tecnologías de la obra' })
  for (const tech of ['Vue', 'GSAP', 'Vite']) {
    await type(techs, tech)
    await pause(page, 250)
    await page.keyboard.press('Enter')
  }
  await tab(/^Imágenes/).click()
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Elegir archivos' }).click()
  await (await chooser).setFiles(await Promise.all(IMAGES.map(async f => ({ name: f.split(/[\\/]/).pop(), mimeType: 'image/webp', buffer: await readFile(f) }))))
  const alts = ['Inicio del sitio con su titular', 'Página de una obra', 'El inicio en un teléfono']
  for (const [i, alt] of alts.entries()) await type(field('Texto alternativo · Español').nth(i), alt)
  await page.locator('#main').getByRole('button', { name: /^Oculta/ }).click()
  await pause(page)
  await page.getByRole('switch', { name: /Mostrar en el sitio/ }).click()
  await pause(page)
  await page.getByRole('button', { name: 'Publicar igual' }).click()
  await pause(page)
  await page.locator('#main').getByRole('button', { name: /^Guardar/ }).click()
  await page.locator('#main footer').getByText(/^Guardado/).first().waitFor({ timeout: 20000 })
  await pause(page, 1500)
}

/** Pegar una vacante, analizarla y adaptar el CV hasta ver la hoja medida. */
async function jobTour(page) {
  await page.goto(`${ADMIN}#/busqueda/vacantes`)
  await settle(page)
  await pause(page)
  await page.getByRole('button', { name: /^Pegar una vacante/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Pegar una vacante' })
  await type(dialog.getByLabel('Puesto'), PASTED_ES.title)
  await type(dialog.getByLabel('Empresa'), PASTED_ES.company)
  await dialog.getByLabel('Descripción del aviso').fill(PASTED_ES.description)
  await type(dialog.getByLabel('Correo de contacto'), PASTED_ES.email)
  await dialog.getByRole('button', { name: 'Agregar a la cola' }).click()
  await page.getByRole('button', { name: 'Analizar la vacante' }).click()
  await pause(page, 1500)
  await page.getByRole('navigation', { name: 'Etapas de la vacante' }).getByRole('link', { name: 'CV' }).click()
  await page.getByRole('button', { name: 'Adaptar CV' }).click()
  await page.locator('[data-cv-measure][data-height-mm]').waitFor({ timeout: 20000 })
  await pause(page, 2500)
}

async function tour(browser) {
  const videos = join(DIR, '.video')
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: videos, size: { width: 1440, height: 900 } } })
  const page = await signedIn(context)
  const title = `Casa Nómade ${Date.now().toString(36)}`
  try {
    await projectTour(page, title)
    await jobTour(page)
  }
  finally {
    const video = page.video()
    await context.close()
    if (video) await rename(await video.path(), join(DIR, 'recorrido.webm'))
    await rm(videos, { recursive: true, force: true })
    await removeProject(title)
  }
  const mp4 = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', join(DIR, 'recorrido.webm'), '-c:v', 'libx264', '-crf', '23', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', join(DIR, 'recorrido.mp4')], { stdio: 'inherit' })
  console.log(`  recorrido.webm${mp4.status === 0 ? ' y recorrido.mp4' : ' (sin ffmpeg: solo webm)'}`)
}

const api = await http.newContext({ baseURL: BASE, extraHTTPHeaders: { Authorization: `Bearer ${TOKEN}` } })

async function removeProject(title) {
  const rows = await (await api.get('/api/admin/projects')).json()
  const found = rows.find(p => p.title === title)
  if (found) await api.delete(`/api/admin/projects/${found.id}`)
}

await rm(DIR, { recursive: true, force: true })
await mkdir(DIR, { recursive: true })
const browser = await chromium.launch()
try {
  const views = await allViews(api)
  await screens(browser, views)
  await tour(browser)
  console.log(`Listo: ${DIR}`)
}
finally {
  await browser.close()
  await api.dispose()
}
