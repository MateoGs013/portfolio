import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { ADMIN } from './admin-support'
import { removeEmptyFolder, removeFiles, sql } from '../admin/datos'

/**
 * admin-run: --web
 *
 * Perfil (U4): Sobre mí y Contacto como formularios con rótulos humanos, sobre una copia de la base.
 * Email igual en los dos idiomas, el PDF del CV con un archivo por idioma, el retrato con su subida y
 * su descripción en inglés (y el sitio que la muestra), un bloque fijo que falta y se crea al
 * guardarlo, bloques libres, la guarda de cambios sin guardar, accesibilidad y capturas.
 *
 *   node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-perfil.spec.ts
 *   node scripts/admin-run.mjs --web -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-perfil.spec.ts
 *
 * Con --web (lo que hace pnpm test:e2e por la línea de arriba) también abre /about?lang=en en el
 * sitio compilado contra esta API. Las capturas quedan en test-results/ de cada prueba.
 */
const token = process.env.PW_ADMIN_TOKEN!
const web = process.env.ADMIN_WEB_URL ?? ''
const mod = process.platform === 'darwin' ? 'Meta' : 'Control'

interface PublicField { name: string, value: string | string[] }
interface Envelope { data: { fields: PublicField[] } }
interface AdminField { name: string, type: string, value: string | string[], en?: string | string[] }
interface AdminDoc { fields: AdminField[], missing: string[] }

const uploaded = new Set<string>()
test.afterAll(() => {
  removeFiles(uploaded)
  removeEmptyFolder('_perfil')
})

async function signedIn(page: Page, hash: string): Promise<void> {
  await page.addInitScript(key => sessionStorage.setItem('adm-token', key), token)
  await page.goto(`${ADMIN}${hash}`)
  await expect(page.locator('#main h1')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Guardar' })).toBeVisible()
}

async function publicValue(page: Page, key: string, lang: string, name: string): Promise<string | string[] | undefined> {
  const res = await page.request.get(`/api/docs/${key}?lang=${lang}`)
  expect(res.ok()).toBe(true)
  return ((await res.json()) as Envelope).data.fields.find(f => f.name === name)?.value
}

async function adminDoc(page: Page, key: string): Promise<AdminDoc> {
  const res = await page.request.get(`/api/admin/docs/${key}`, { headers: { Authorization: `Bearer ${token}` } })
  expect(res.ok()).toBe(true)
  return await res.json() as AdminDoc
}

async function save(page: Page, saved: string): Promise<void> {
  await expect(saveState(page)).toHaveText(/Cambios sin guardar|No se pudo guardar/)
  await page.keyboard.press(`${mod}+s`)
  await expect(saveState(page)).toHaveText(/Guardado/)
  await expect(page.getByRole('listitem').filter({ hasText: saved }).first()).toBeVisible()
}

/** Lo que anuncia el pie («Sin cambios», «Guardado recién»). */
const saveState = (page: Page) => page.locator('#main footer [role="status"]')

async function noSeriousAxe(page: Page): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter(a => a.effect?.getComputedTiming().endTime !== Infinity)
    .map(a => a.finished.catch(() => null))))
  const { violations } = await new AxeBuilder({ page }).analyze()
  const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([])
}

/** Captura la pantalla entera: #main es el que scrollea, así que el alto se estira un momento. */
async function capture(page: Page, info: TestInfo, name: string): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations().map(a => a.finished.catch(() => null))))
  const size = page.viewportSize()!
  const tall = await page.evaluate(() => document.getElementById('main')?.scrollHeight ?? 0)
  await page.setViewportSize({ width: size.width, height: Math.max(size.height, tall + 120) })
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true })
  await page.setViewportSize(size)
}

/** Una foto real (la arma el navegador) para que la vista previa se vea como en uso. */
async function photo(page: Page): Promise<Buffer> {
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 500
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'rgb(46, 46, 52)'
    ctx.fillRect(0, 0, 400, 500)
    ctx.fillStyle = 'rgb(120, 120, 128)'
    ctx.beginPath()
    ctx.arc(200, 190, 90, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(70, 320, 260, 180)
    return canvas.toDataURL('image/png').split(',')[1]!
  })
  return Buffer.from(data, 'base64')
}

test.describe('formularios', () => {
  test('rótulos humanos, sin nombres técnicos ni tipos, sin crear ni borrar', async ({ page }, info) => {
    await signedIn(page, '#/perfil/sobre-mi')
    await expect(page.locator('#main h1')).toHaveText('Sobre mí')
    await expect(page).toHaveTitle('Sobre mí · Perfil · Admin')
    const nav = page.getByRole('navigation', { name: 'Documentos del perfil' })
    await expect(nav.getByRole('link', { name: 'Sobre mí' })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByLabel('Nombre visible · Español')).toHaveValue(/\S/)
    await expect(page.getByLabel('Filosofía de trabajo · Inglés')).toHaveValue(/\S/)
    await expect(page.getByLabel('Idiomas · Español')).toHaveValue(/\n/)
    await expect(page.getByRole('button', { name: 'Cambiar retrato' })).toBeVisible()
    for (const name of [/^Nuevo/, /Duplicar/, /Eliminar/]) await expect(page.getByRole('button', { name })).toHaveCount(0)

    const words = async () => await page.locator('#main').innerText()
    for (const technical of [/display_name/, /engineering_philosophy/, /\bstring\b/, /\btext\b/, /\bmarkdown\b/]) {
      expect(await words()).not.toMatch(technical)
    }
    await noSeriousAxe(page)
    await capture(page, info, 'sobre-mi-1440')

    await nav.getByRole('link', { name: 'Contacto' }).click()
    await expect(page.locator('#main h1')).toHaveText('Contacto')
    await expect(page).toHaveTitle('Contacto · Perfil · Admin')
    await expect(nav.getByRole('link', { name: 'Contacto' })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByLabel('Email', { exact: true })).toHaveValue(/@/)
    await expect(page.locator('[data-field="fields.email.value"]')).toContainText('Igual en los dos idiomas')
    await expect(page.getByLabel('PDF en español')).toHaveValue(/^\/cv\/CV-ES-/)
    await expect(page.getByLabel('PDF en inglés')).toHaveValue(/^\/cv\/CV-EN-/)
    await expect(page.getByText('pnpm cv:pdf')).toBeVisible()
    expect(await words()).not.toMatch(/\bstring\b|\btext\b|\bmarkdown\b|localizedPath|time_zone/)
    await noSeriousAxe(page)
    await capture(page, info, 'contacto-1440')

    await page.setViewportSize({ width: 390, height: 844 })
    await signedIn(page, '#/perfil/sobre-mi')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
    await noSeriousAxe(page)
    await capture(page, info, 'sobre-mi-390')
    await signedIn(page, '#/perfil/contacto')
    await noSeriousAxe(page)
    await capture(page, info, 'contacto-390')
  })

  test('el email es uno solo y el PDF del CV cambia solo en su idioma', async ({ page }, info) => {
    await signedIn(page, '#/perfil/contacto')
    const before = { es: await publicValue(page, 'contact', 'es', 'cv'), en: await publicValue(page, 'contact', 'en', 'cv') }
    expect(before.en).toMatch(/^\/cv\/CV-EN-/)

    await page.getByLabel('Email', { exact: true }).fill('perfil@ejemplo.com')
    await save(page, 'Contacto guardado')
    expect(await publicValue(page, 'contact', 'en', 'email')).toBe('perfil@ejemplo.com')
    expect(await publicValue(page, 'contact', 'es', 'email')).toBe('perfil@ejemplo.com')
    expect(await publicValue(page, 'contact', 'en', 'cv')).toBe(before.en)

    const english = page.getByLabel('PDF en inglés')
    await english.fill('/cv/CV-EN.docx')
    await english.blur()
    await expect(page.locator('[data-field="fields.cv.en"]')).toContainText('tiene que ser un archivo de /cv/')
    await page.keyboard.press(`${mod}+s`)
    await expect(page.getByRole('region', { name: 'Hay un campo para revisar' })).toBeVisible()
    await expect(english).toBeFocused()
    await expect(english).toHaveAttribute('aria-invalid', 'true')
    await capture(page, info, 'cv-error')

    await english.fill('/cv/CV-EN-Perfil.pdf')
    await save(page, 'Contacto guardado')
    expect(await publicValue(page, 'contact', 'en', 'cv')).toBe('/cv/CV-EN-Perfil.pdf')
    expect(await publicValue(page, 'contact', 'es', 'cv')).toBe(before.es)
  })

  test('un bloque fijo que falta se muestra vacío y se crea al guardarlo', async ({ page }, info) => {
    await sql(`UPDATE "Doc" SET fields = (SELECT jsonb_agg(f) FROM jsonb_array_elements(fields::jsonb) f WHERE f->>'name' <> 'response_time') WHERE key = 'contact'`)
    await signedIn(page, '#/perfil/contacto?campo=fields.response_time.value')
    const field = page.locator('[data-field="fields.response_time"]')
    await expect(field).toContainText('Falta completar')
    const spanish = page.getByLabel('Tiempo de respuesta · Español')
    await expect(spanish).toHaveValue('')
    await expect(spanish).toBeFocused()
    await capture(page, info, 'falta-completar')

    await spanish.fill('Respondo en el día')
    await page.getByLabel('Tiempo de respuesta · Inglés').fill('I reply the same day')
    await save(page, 'Contacto guardado')
    await expect(field).not.toContainText('Falta completar')
    expect((await adminDoc(page, 'contact')).missing).toEqual([])
    expect(await publicValue(page, 'contact', 'en', 'response_time')).toBe('I reply the same day')
  })
})

test.describe('retrato y bloques libres', () => {
  test('subir un retrato lo cambia en los dos idiomas, con su descripción en inglés', async ({ page }, info) => {
    await signedIn(page, '#/perfil/sobre-mi')
    const previous = await publicValue(page, 'about', 'en', 'portrait')
    await page.locator('input[type="file"]').setInputFiles({ name: 'retrato.png', mimeType: 'image/png', buffer: await photo(page) })
    await expect(page.getByRole('listitem').filter({ hasText: 'Retrato cambiado' })).toBeVisible()

    const src = String(await publicValue(page, 'about', 'en', 'portrait'))
    uploaded.add(src)
    expect(src).not.toBe(previous)
    expect(src).toMatch(/^\/media\/projects\/_perfil\/retrato-[a-z0-9]+\.png$/)
    expect(await publicValue(page, 'about', 'es', 'portrait')).toBe(src)
    const preview = page.locator(`img[src="${src}"]`)
    await expect(preview).toBeVisible()
    expect(await preview.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBe(400)
    await expect(saveState(page)).toHaveText('Sin cambios')

    await page.getByLabel('Descripción del retrato · Inglés').fill('Mateo Sonzogni, new portrait')
    await save(page, 'Sobre mí guardado')
    expect(await publicValue(page, 'about', 'en', 'portrait_alt')).toBe('Mateo Sonzogni, new portrait')
    expect(await publicValue(page, 'about', 'en', 'portrait')).toBe(src)
    await capture(page, info, 'retrato-nuevo')

    if (web) {
      await page.goto(`${web}/about?lang=en`)
      const portrait = page.locator(`img[src="${src}"]`)
      await expect(portrait).toHaveAttribute('alt', 'Mateo Sonzogni, new portrait')
      await portrait.scrollIntoViewIfNeeded()
      await expect.poll(() => portrait.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBe(400)
      await capture(page, info, 'sitio-about-en')
    }
  })

  test('un bloque libre se agrega con su nombre, se guarda y se quita', async ({ page }, info) => {
    await signedIn(page, '#/perfil/sobre-mi')
    await page.getByRole('button', { name: 'Agregar bloque' }).click()
    const name = page.getByLabel('Nombre', { exact: true })
    await expect(name).toBeFocused()
    await name.fill('Horario de atención')
    await name.blur()
    await expect(name).toHaveValue('horario_de_atencion')
    await page.getByLabel('Tipo').selectOption({ label: 'Lista, uno por renglón' })
    await page.getByLabel('Horario de atencion · Español').fill('Lunes a viernes\nSábados por la mañana')
    await page.getByLabel('Horario de atencion · Inglés').fill('Monday to Friday\nSaturday mornings')
    await capture(page, info, 'bloque-libre')
    await save(page, 'Sobre mí guardado')

    const saved = (await adminDoc(page, 'about')).fields.find(f => f.name === 'horario_de_atencion')
    expect(saved).toMatchObject({ type: 'list', value: ['Lunes a viernes', 'Sábados por la mañana'], en: ['Monday to Friday', 'Saturday mornings'] })

    await page.getByRole('button', { name: 'Quitar Horario de atencion' }).click()
    await expect(page.getByLabel('Nombre', { exact: true })).toHaveCount(0)
    await save(page, 'Sobre mí guardado')
    expect((await adminDoc(page, 'about')).fields.some(f => f.name === 'horario_de_atencion')).toBe(false)
  })

  test('cambiar de documento con cambios sin guardar pregunta, y Descartar los devuelve', async ({ page }) => {
    await signedIn(page, '#/perfil/sobre-mi')
    const role = page.getByLabel('Rol · Español')
    const original = await role.inputValue()
    await role.fill(`${original} y algo más`)
    await expect(saveState(page)).toHaveText('Cambios sin guardar')

    await page.getByRole('navigation', { name: 'Documentos del perfil' }).getByRole('link', { name: 'Contacto' }).click()
    const dialog = page.getByRole('dialog', { name: 'Tenés cambios sin guardar' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Seguir editando' }).click()
    await expect(page.locator('#main h1')).toHaveText('Sobre mí')

    await page.getByRole('button', { name: 'Descartar' }).click()
    await expect(role).toHaveValue(original)
    await expect(saveState(page)).toHaveText('Sin cambios')
  })
})
