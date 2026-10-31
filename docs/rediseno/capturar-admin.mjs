// Capturas de la consola /admin del portafolio (CMS y Job Hunter de Eros), sin tocar nada real.
// Uso, desde la raíz del repo:  node docs/rediseno/capturar-admin.mjs
// Levanta la API en un puerto propio con: una clave de prueba generada en el momento (nunca se imprime),
// una base inexistente y Eros desconectado. Así la consola usa sus datos de ejemplo internos y no lee
// ni escribe la base real ni el agente real. Al terminar apaga el servidor.
// Salida: docs/rediseno/capturas/eros/admin-*.{png,webp} y admin-recorrido.{mp4,webm}
import { chromium } from '@playwright/test'
import { spawn, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'

const PORT = 3901
const BASE = `http://localhost:${PORT}`
const DIR = 'docs/rediseno/capturas/eros'
const FFMPEG = process.env.FFMPEG || 'ffmpeg'
const TOKEN = randomBytes(24).toString('hex')
const ffmpeg = args => spawnSync(FFMPEG, ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' })

// Las variables de entorno ganan sobre el .env: nada de lo real llega a este servidor
const server = spawn(process.execPath, ['--import', 'tsx', 'server/src/index.ts'], {
  env: {
    ...process.env, NODE_ENV: 'development', PORT: String(PORT), ADMIN_TOKEN: TOKEN,
    DATABASE_URL: 'postgresql://offline:offline@127.0.0.1:1/offline',
    HUNTER_API_URL: 'http://127.0.0.1:9', EROS_API_KEY: 'offline',
  },
  stdio: 'ignore',
})
const stop = () => {
  try { server.kill() }
  catch { /* ya estaba apagado */ }
}
process.on('exit', stop)

async function waitUp() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${BASE}/admin/`)).ok) return }
    catch { /* todavía arrancando */ }
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error('la API no arrancó en 30 s')
}

const SECTIONS = [
  ['dashboard', 'Panel Principal'],
  ['hunter', 'Job Hunter (Eros)'],
  ['contenido', 'Contenido Omnicanal'],
  ['radar', 'TrendRadar (Eros)'],
  ['proyectos', 'Proyectos'],
]

try {
  await waitUp()
  await mkdir(DIR, { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  // Los datos de ejemplo de Job Hunter nombran empresas, personas y correos reales o verosímiles: en la
  // captura se reemplazan por ficticios y se oculta el aviso de modo local. El código no se toca.
  await ctx.addInitScript(() => {
    const swaps = [
      ['Confidential Startup SaaS Company', 'Halcyon SaaS'], ['Bjak Financial Technologies', 'Lumen Fintech'],
      ['Kruger NearShore LLC', 'Andes Nearshore'], ['Vortice Labs', 'Prism Studio'], ['EPAM Systems', 'Meridian Digital'],
      ['EPAM', 'Meridian'], ['Jobgether', 'Northwind Labs'],
      ['Sarah Chen', 'Ana Ruiz'], ['Carlos Mendoza', 'Lucía Prieto'], ['Valeria Rossi', 'Tomás Vidal'],
    ]
    const mail = /\b[\w.+-]+@(?!gmail\.com)[\w-]+(\.[\w-]+)+\b/g
    setInterval(() => {
      const walk = document.createTreeWalker(document.body ?? document.documentElement, NodeFilter.SHOW_TEXT)
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        let t = n.nodeValue
        for (const [a, b] of swaps) if (t.includes(a)) t = t.split(a).join(b)
        t = t.replace(mail, 'talento@empresa.example')
        if (t !== n.nodeValue) n.nodeValue = t
      }
      // La barra entera del aviso: el contenedor más bajo que lo contiene (los de afuera miden más)
      for (const el of document.querySelectorAll('body *')) {
        if (el.style.display === 'none' || !/SNAPSHOT LOCAL|datos locales de contingencia/.test(el.textContent)) continue
        if (el.textContent.length < 300 && el.getBoundingClientRect().height < 80) el.style.display = 'none'
      }
    }, 150)
  })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/admin/`, { waitUntil: 'load' })
  await page.getByPlaceholder('Ingresá la clave de acceso...').fill(TOKEN)
  await page.keyboard.press('Enter')
  await page.getByText('Panel Principal').first().waitFor({ timeout: 15000 })
  await page.waitForTimeout(2500)

  const shot = async name => {
    const png = join(DIR, `admin-${name}.png`)
    await page.screenshot({ path: png })
    ffmpeg(['-i', png, '-c:v', 'libwebp', '-quality', '84', png.replace('.png', '.webp')])
    console.log('  ✓', name)
  }
  const go = async label => { await page.getByRole('button', { name: label }).first().click(); await page.waitForTimeout(2800) }

  for (const [name, label] of SECTIONS) { await go(label); await shot(name) }
  // El editor de un proyecto abierto, con sus pestañas
  const first = page.locator('main button, main [role=button], main li').filter({ hasText: /Rúcula|Piscinas|Ynara|Barberpole/ }).first()
  if (await first.count()) { await first.click(); await page.waitForTimeout(2000); await shot('editor') }
  // La paleta de comandos
  await page.keyboard.press('Control+k'); await page.waitForTimeout(1200); await shot('paleta'); await page.keyboard.press('Escape')

  // Recorrido en video: las secciones de Eros una tras otra
  await go('Panel Principal')
  const cdp = await ctx.newCDPSession(page)
  const frames = []
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => { frames.push({ data, t: metadata.timestamp }); await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {}) })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1920, maxHeight: 1200 })
  for (const label of ['Job Hunter (Eros)', 'Contenido Omnicanal', 'TrendRadar (Eros)', 'Panel Principal']) {
    await page.getByRole('button', { name: label }).first().hover(); await page.waitForTimeout(400)
    await page.getByRole('button', { name: label }).first().click(); await page.waitForTimeout(2200)
  }
  await cdp.send('Page.stopScreencast')
  const tmp = join(DIR, '.frames-admin'); await mkdir(tmp, { recursive: true })
  let list = ''
  for (let i = 0; i < frames.length; i++) {
    const f = `f${String(i).padStart(5, '0')}.jpg`
    await writeFile(join(tmp, f), Buffer.from(frames[i].data, 'base64'))
    list += `file '${f}'\nduration ${(i < frames.length - 1 ? Math.max(0.001, frames[i + 1].t - frames[i].t) : 1 / 30).toFixed(4)}\n`
  }
  list += `file 'f${String(frames.length - 1).padStart(5, '0')}.jpg'\n`
  await writeFile(join(tmp, 'list.txt'), list)
  const input = ['-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt')], vf = 'fps=30,scale=1920:1200:flags=lanczos,format=yuv420p'
  ffmpeg([...input, '-vf', vf, '-c:v', 'libx264', '-crf', '24', '-maxrate', '3M', '-bufsize', '6M', '-preset', 'slow', '-movflags', '+faststart', '-an', join(DIR, 'admin-recorrido.mp4')])
  ffmpeg([...input, '-vf', vf, '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-row-mt', '1', '-an', join(DIR, 'admin-recorrido.webm')])
  ffmpeg(['-i', join(tmp, 'f00000.jpg'), '-vf', 'scale=1920:1200', '-c:v', 'libwebp', '-quality', '82', join(DIR, 'admin-recorrido-poster.webp')])
  await rm(tmp, { recursive: true, force: true })
  console.log(`  ✓ recorrido (${frames.length} cuadros)`)
  await browser.close()
} finally {
  stop()
}
