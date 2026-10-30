// Capturas del panel de Eros (eros.mateogs.tech), que requiere clave.
// Uso: node docs/rediseno/capturar-eros.mjs
// Abre una ventana visible: Mateo escribe la clave ahí mismo. El script nunca la lee ni la guarda;
// espera a que el panel cargue, recorre sus secciones, captura y cierra la sesión sin dejar nada en disco.
// Salida: docs/rediseno/capturas/eros/  (revisar antes de publicar: es un panel privado)
import { chromium } from '@playwright/test'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const URL = 'https://eros.mateogs.tech/'
const DIR = 'docs/rediseno/capturas/eros'
const FFMPEG = process.env.FFMPEG || 'ffmpeg'
const ffmpeg = args => spawnSync(FFMPEG, ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' })

await mkdir(DIR, { recursive: true })
const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'load' })
console.log('Escribí la clave en la ventana que se abrió y entrá al panel. Espero hasta 10 minutos.')
// El panel está listo cuando desaparece el campo de la clave
await page.locator('input[type=password]').waitFor({ state: 'detached', timeout: 10 * 60 * 1000 })
await page.waitForTimeout(4000)
console.log('Panel abierto. Capturando…')

const shot = async name => {
  const png = join(DIR, `${name}.png`)
  await page.screenshot({ path: png })
  ffmpeg(['-i', png, '-c:v', 'libwebp', '-quality', '84', png.replace('.png', '.webp')])
  console.log('  ✓', name)
}
await shot('hero')

// Secciones: botones de navegación visibles del panel (pestañas o barra lateral)
const tabs = await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, aside button, aside a, [role=tab]')]
  .filter(e => e.offsetParent && e.textContent.trim()).map(e => e.textContent.trim().replace(/\s+/g, ' ')).slice(0, 8))
console.log('Secciones:', tabs.join(' · ') || '(ninguna)')
for (const [i, label] of tabs.entries()) {
  await page.getByText(label, { exact: true }).first().click().catch(() => {})
  await page.waitForTimeout(2500)
  await shot(`seccion-${i + 1}`)
}

// Video corto: se recorre la vista principal desde arriba
await page.getByText(tabs[0] ?? '', { exact: true }).first().click().catch(() => {})
await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(1500)
const cdp = await ctx.newCDPSession(page)
const frames = []
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => { frames.push({ data, t: metadata.timestamp }); await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {}) })
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1920, maxHeight: 1200 })
await page.mouse.move(720, 450)
const start = Date.now()
let done = 0
while (Date.now() - start < 7000) {
  const t = (Date.now() - start) / 7000, target = 1800 * (0.5 - Math.cos(Math.PI * t) / 2)
  await page.mouse.wheel(0, target - done); done = target
  await page.waitForTimeout(16)
}
await page.waitForTimeout(800)
await cdp.send('Page.stopScreencast')
if (frames.length > 10) {
  const tmp = join(DIR, '.frames'); await mkdir(tmp, { recursive: true })
  let list = ''
  for (let i = 0; i < frames.length; i++) {
    const f = `f${String(i).padStart(5, '0')}.jpg`
    await writeFile(join(tmp, f), Buffer.from(frames[i].data, 'base64'))
    list += `file '${f}'\nduration ${(i < frames.length - 1 ? Math.max(0.001, frames[i + 1].t - frames[i].t) : 1 / 30).toFixed(4)}\n`
  }
  await writeFile(join(tmp, 'list.txt'), list)
  const input = ['-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt')], vf = 'fps=30,scale=1920:1200:flags=lanczos,format=yuv420p'
  ffmpeg([...input, '-vf', vf, '-c:v', 'libx264', '-crf', '24', '-maxrate', '3M', '-bufsize', '6M', '-preset', 'slow', '-movflags', '+faststart', '-an', join(DIR, 'scroll.mp4')])
  ffmpeg([...input, '-vf', vf, '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-row-mt', '1', '-an', join(DIR, 'scroll.webm')])
  ffmpeg(['-i', join(tmp, 'f00000.jpg'), '-vf', 'scale=1920:1200', '-c:v', 'libwebp', '-quality', '82', join(DIR, 'scroll-poster.webp')])
  await rm(tmp, { recursive: true, force: true })
  console.log(`  ✓ scroll (${frames.length} cuadros)`)
} else console.log('  · la vista principal no se desplaza: sin video')

// La sesión no se guarda: al cerrar el contexto se pierde todo
await ctx.close(); await browser.close()
console.log('Listo. Revisá las capturas antes de publicarlas: el panel puede mostrar datos privados.')
