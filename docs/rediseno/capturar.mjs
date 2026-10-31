// Capturas y videos de las obras en producción para el portafolio.
// Uso, desde la raíz del repo:  node docs/rediseno/capturar.mjs [la-rucula|argpiscinas|barberpole]
// Salida: docs/rediseno/capturas/<obra>/  (PNG originales, WebP livianos, MP4 + WebM + póster de cada video)
// Requiere ffmpeg en el PATH (o la variable FFMPEG) y los navegadores de Playwright instalados.
import { chromium, devices } from '@playwright/test'
import { mkdir, writeFile, rm, readdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const OUT = 'docs/rediseno/capturas'
const FFMPEG = process.env.FFMPEG || 'ffmpeg'

// Lo que cada obra muestra mejor, solo lo público: ni paneles con login ni formularios enviados.
const SITES = {
  'la-rucula': {
    base: 'https://laruculagastrobar.es',
    intro: 9000, // el sitio abre con una ilustración animada antes del inicio
    shots: [
      { name: 'hero', path: '/', wait: 9500 },
      { name: 'menu', path: '/menu', wait: 4500 },
      { name: 'carta', path: '/menu', then: 'a[href="/menu/carta"]', wait: 4000 },
      { name: 'atardeceres', path: '/atardeceres', wait: 4500 },
    ],
    mobile: [
      { name: 'movil-carta', path: '/menu', then: 'a[href="/menu/carta"]', wait: 4000 },
      { name: 'movil-hero', path: '/', wait: 9500 },
    ],
    videos: [
      { name: 'intro', path: '/', drive: async page => page.waitForTimeout(8500) },
      { name: 'scroll', path: '/', before: 9500, drive: page => glide(page, 2.6, 9000) },
    ],
  },
  argpiscinas: {
    base: 'https://www.argpiscinas.es',
    hide: 'a[href*="wa.me"],a[href*="whatsapp"],[aria-label*="whatsapp" i],[class*="whatsapp" i]{visibility:hidden!important}',
    // El sitio abre una promo de temporada a los ~7 s y traba el scroll mientras está abierta. Al cerrarla
    // guarda esta marca; arrancar con ella es entrar como alguien que ya la cerró.
    storage: { 'argp.promo.otono-invierno-26-27': () => JSON.stringify({ tipo: 'cerrado', veces: 1, visitasRestantes: 3, hasta: Date.now() + 7 * 864e5 }) },
    // La burbuja "¿Tienes dudas?" aparece a los segundos y en cada página: se oculta mientras dure la visita,
    // para que la captura muestre el sitio y no el chat.
    watch: () => setInterval(() => {
      for (const el of document.querySelectorAll('body *')) {
        if (el.style.visibility === 'hidden') continue
        const r = el.getBoundingClientRect()
        if (r.width && r.width < 420 && getComputedStyle(el).position === 'fixed' && /Tienes dudas/i.test(el.textContent)) el.style.visibility = 'hidden'
      }
    }, 250),
    shots: [
      { name: 'hero', path: '/', wait: 3500 },
      { name: 'proyectos', path: '/proyectos', wait: 7000, scroll: 520 },
      { name: 'proyecto', path: '/proyectos/rehabilitacion-con-lamina-armada-touch-tropical', wait: 5000 },
      { name: 'blog', path: '/blog', wait: 7000, scroll: 480 },
    ],
    mobile: [{ name: 'movil-hero', path: '/', wait: 3500 }],
    videos: [
      { name: 'scroll', path: '/', before: 3000, drive: page => glide(page, 3, 9500) },
      {
        name: 'idiomas', path: '/', before: 2500,
        drive: async page => {
          // El mismo inicio en los tres idiomas, sin perder la página
          for (const lang of ['/en', '/de', '/']) {
            await page.locator(`header a[href="${lang === '/' ? '/' : lang}"]`).first().click().catch(() => page.goto(page.url().replace(/\/(en|de)?$/, lang)))
            await page.waitForTimeout(2800)
          }
        },
      },
    ],
  },
  barberpole: {
    base: 'https://turnos.mateogs.tech',
    shots: [
      { name: 'hero', path: '/', wait: 4000 },
      { name: 'portal', path: '/simple', wait: 4500 },
      { name: 'claro', path: '/', wait: 3000, then: 'button:has-text("Modo claro")', after: 1500 },
    ],
    mobile: [
      { name: 'movil-hero', path: '/', wait: 4000 },
      { name: 'movil-portal', path: '/simple', wait: 4500 },
    ],
    // El portal de reservas no se desplaza: se muestra con capturas, no con video
    videos: [{ name: 'scroll', path: '/', before: 3500, drive: page => glide(page, 2.4, 9000) }],
  },
}

const ffmpeg = args => {
  const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' })
  if (r.status !== 0) throw new Error('ffmpeg falló: ' + args.join(' '))
}
const webp = (png, quality = 84) => ffmpeg(['-i', png, '-c:v', 'libwebp', '-quality', String(quality), png.replace(/\.png$/, '.webp')])

// Scroll de persona: ruedita en pasos chicos con aceleración y frenado, así Lenis y GSAP responden como en la vida real.
// Se rige por el reloj y no por la cantidad de pasos: cada paso tarda lo que tarda, el recorrido dura lo pedido.
async function glide(page, screens, ms) {
  const vh = page.viewportSize().height
  const total = screens * vh
  const ease = t => 0.5 - Math.cos(Math.PI * t) / 2
  await page.mouse.move(page.viewportSize().width / 2, vh / 2)
  const start = Date.now()
  let done = 0
  while (done < total - 0.5) {
    const t = Math.min(1, (Date.now() - start) / ms)
    const target = total * ease(t)
    if (target > done) { await page.mouse.wheel(0, target - done); done = target }
    if (t >= 1) break
    await page.waitForTimeout(16)
  }
  await page.waitForTimeout(700)
}

async function open(ctx, site, item) {
  const page = await ctx.newPage()
  if (site.storage) {
    const entries = Object.entries(site.storage).map(([k, v]) => [k, v()])
    await page.addInitScript(({ origin, entries }) => {
      if (location.origin === origin) for (const [k, v] of entries) localStorage.setItem(k, v)
    }, { origin: new URL(site.base).origin, entries })
  }
  if (site.watch) await page.addInitScript(site.watch)
  if (site.hide) await page.addInitScript(css => {
    addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = css; document.head.append(s) })
  }, site.hide)
  await page.goto(site.base + item.path, { waitUntil: 'load', timeout: 60000 })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(item.wait ?? item.before ?? 2500)
  if (site.setup) await site.setup(page)
  if (item.then) {
    await page.locator(item.then).first().click()
    await page.waitForTimeout(item.after ?? item.wait ?? 3000)
  }
  // Algunas páginas cargan su contenido más abajo del encabezado: se baja con la ruedita, como una persona
  if (item.scroll) {
    await page.mouse.move(page.viewportSize().width / 2, page.viewportSize().height / 2)
    await page.mouse.wheel(0, item.scroll)
    await page.waitForTimeout(2200)
  }
  return page
}

async function shoot(ctx, site, item, dir) {
  const page = await open(ctx, site, item)
  const png = join(dir, `${item.name}.png`)
  await page.screenshot({ path: png })
  webp(png)
  await page.close()
  console.log('  ✓', item.name)
}

// Video: los cuadros reales del navegador (screencast), con su tiempo, recompuestos a 30 fps
async function record(ctx, site, item, dir) {
  const page = await open(ctx, site, { ...item, wait: 0 })
  const tmp = join(dir, `.frames-${item.name}`)
  await rm(tmp, { recursive: true, force: true }); await mkdir(tmp, { recursive: true })
  const cdp = await ctx.newCDPSession(page)
  const frames = []
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    frames.push({ data, t: metadata.timestamp })
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  // El intro se graba desde el primer cuadro; el resto, después de esperar a que la página se acomode
  if (item.name !== 'intro') await page.waitForTimeout(item.before ?? 2500)
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 })
  await item.drive(page)
  await cdp.send('Page.stopScreencast')
  await page.close()

  let list = ''
  for (let i = 0; i < frames.length; i++) {
    const file = `f${String(i).padStart(5, '0')}.jpg`
    await writeFile(join(tmp, file), Buffer.from(frames[i].data, 'base64'))
    const d = i < frames.length - 1 ? Math.max(0.001, frames[i + 1].t - frames[i].t) : 1 / 30
    list += `file '${file}'\nduration ${d.toFixed(4)}\n`
  }
  list += `file 'f${String(frames.length - 1).padStart(5, '0')}.jpg'\n`
  await writeFile(join(tmp, 'list.txt'), list)
  const base = join(dir, item.name)
  const input = ['-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt')]
  const vf = 'fps=30,scale=1920:1200:flags=lanczos,format=yuv420p'
  // Tope de bitrate: un scroll con mucho detalle no puede pasar de ~4 MB, es un video de fondo
  ffmpeg([...input, '-vf', vf, '-c:v', 'libx264', '-crf', '24', '-maxrate', '3M', '-bufsize', '6M', '-preset', 'slow', '-movflags', '+faststart', '-an', `${base}.mp4`])
  ffmpeg([...input, '-vf', vf, '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-row-mt', '1', '-an', `${base}.webm`])
  ffmpeg(['-i', join(tmp, 'f00000.jpg'), '-vf', 'scale=1920:1200', '-c:v', 'libwebp', '-quality', '82', `${base}-poster.webp`])
  await rm(tmp, { recursive: true, force: true })
  console.log(`  ✓ ${item.name} (${frames.length} cuadros, ${(frames.at(-1).t - frames[0].t).toFixed(1)} s)`)
}

// Índice de lo que hay en disco, para que el prototipo use cada pieza sin adivinar nombres
async function manifest() {
  const index = {}
  for (const slug of (await readdir(OUT).catch(() => [])).filter(d => !d.startsWith('.') && !d.includes('.'))) {
    const files = await readdir(join(OUT, slug)).catch(() => [])
    if (!files.length) continue
    index[slug] = {
      shots: files.filter(f => f.endsWith('.webp') && !f.endsWith('-poster.webp')).map(f => f.replace('.webp', '')),
      videos: files.filter(f => f.endsWith('.mp4')).map(f => f.replace('.mp4', '')),
    }
  }
  await writeFile(join(OUT, 'manifest.js'), `// Generado por capturar.mjs\nwindow.CAPTURAS = ${JSON.stringify(index, null, 1)};\n`)
  console.log('manifest:', Object.keys(index).join(', '))
}

const only = process.argv[2]
if (only === '--manifest') { await manifest(); process.exit(0) }
const browser = await chromium.launch()
for (const [slug, site] of Object.entries(SITES)) {
  if (only && only !== slug) continue
  const dir = join(OUT, slug)
  await mkdir(dir, { recursive: true })
  console.log(slug)
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  for (const s of site.shots) await shoot(desk, site, s, dir).catch(e => console.log('  ✗', s.name, e.message))
  await desk.close()
  const phone = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
  for (const s of site.mobile) await shoot(phone, site, s, dir).catch(e => console.log('  ✗', s.name, e.message))
  await phone.close()
  // Los videos se graban a 1920 × 1200: la misma escena de 1440 × 900 con densidad 4/3
  for (const v of site.videos) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 / 3 })
    await record(ctx, site, v, dir).catch(e => console.log('  ✗', v.name, e.message))
    await ctx.close()
  }
}
await browser.close()
await manifest()
