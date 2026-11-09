import { expect, test, type Page } from '@playwright/test'
import motion from '../../app/lib/dict/motion'
import { api, open, WORKS } from './support'

/**
 * Capturas y videos (versionados en public/media/projects/): el sitio los sirve desde su propio origen
 * (Nitro proxía /media/** a la API), con el tipo correcto y con rangos para el video, y el video de un
 * caso reproduce de verdad, solo al verse y con su botón de pausa.
 */
interface MediaRow { kind: 'IMAGE' | 'VIDEO', role: string, src: string, srcWebm: string | null, poster: string | null }

const TYPES: Record<string, RegExp> = { webp: /image\/webp/, png: /image\/png/, jpg: /image\/jpeg/, webm: /video\/webm/, mp4: /video\/mp4/ }

test('cada archivo de las obras publicadas responde desde el origen del sitio con su tipo', async ({ request, baseURL }) => {
  const files = new Set<string>()
  for (const slug of WORKS) {
    const project = await api<{ media: MediaRow[], steps: { media: MediaRow | null }[] }>(request, `/projects/${slug}`)
    for (const m of [...project.media, ...project.steps.flatMap(s => (s.media ? [s.media] : []))]) {
      for (const src of [m.src, m.srcWebm, m.poster]) if (src) files.add(src)
    }
  }
  expect(files.size).toBeGreaterThan(WORKS.length)
  for (const src of files) {
    expect(src, src).toMatch(/^\/media\//)
    const res = await request.head(new URL(src, baseURL).toString())
    expect(res.status(), src).toBe(200)
    const ext = src.split('.').pop()!
    expect(res.headers()['content-type'], src).toMatch(TYPES[ext] ?? /./)
  }
})

test('el video admite pedidos por rango (para buscar y reanudar)', async ({ request }) => {
  const project = await api<{ media: MediaRow[] }>(request, '/projects/la-rucula')
  const video = project.media.find(m => m.kind === 'VIDEO' && m.srcWebm)!
  const res = await request.get(video.srcWebm!, { headers: { range: 'bytes=0-1023' } })
  expect(res.status()).toBe(206)
  expect(res.headers()['content-range']).toMatch(/^bytes 0-1023\/\d+$/)
  expect((await res.body()).length).toBe(1024)
})

/** La caja de cada imagen o video de `scope` contra la del marco que la recorta (más de 1: se sale y se recorta). */
async function shown(page: Page, scope: string) {
  return page.locator(scope).evaluateAll(els => els.map((el) => {
    const r = el.getBoundingClientRect()
    let frame = el.parentElement
    while (frame && !['hidden', 'clip'].includes(getComputedStyle(frame).overflow)) frame = frame.parentElement
    const f = (frame ?? el).getBoundingClientRect()
    return { src: (el as HTMLImageElement).currentSrc || el.getAttribute('src'), w: r.width / f.width, h: r.height / f.height }
  }))
}

test.describe('las capturas se ven enteras', () => {
  // Una caja más grande que el marco con object-cover agranda la captura y la recorta por los cuatro lados.
  for (const [path, scope] of [['/projects/la-rucula', '[data-vt="cover"] :is(img, video), figure :is(img, video)'], ['/projects', '[data-card] :is(img, video)']] as const) {
    test(`ninguna se agranda dentro de su marco en ${path}`, async ({ page }) => {
      await open(page, path)
      const boxes = await shown(page, scope)
      expect(boxes.length).toBeGreaterThan(0)
      for (const box of boxes) expect(Math.max(box.w, box.h), box.src ?? '').toBeLessThanOrEqual(1.005)
    })
  }
})

test.describe('en el caso', () => {
  test('la portada en video arranca al cargar, aunque asome menos de un tercio', async ({ page }) => {
    await open(page, '/projects/la-rucula')
    const cover = page.locator('[data-vt="cover"] video').first()
    await expect.poll(() => cover.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 8000 }).toBeGreaterThan(0)
  })

  test('la portada en video arranca sola al verse y su botón la pausa', async ({ page }) => {
    await open(page, '/projects/la-rucula')
    const cover = page.locator('[data-vt="cover"] video').first()
    await cover.evaluate(v => v.scrollIntoView({ block: 'center' }))
    await expect.poll(() => cover.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 8000 }).toBeGreaterThan(0)
    expect(await cover.evaluate((v: HTMLVideoElement) => ({ muted: v.muted, inline: v.playsInline, src: v.currentSrc }))).toEqual({
      muted: true, inline: true, src: expect.stringMatching(/\/media\/projects\/la-rucula\/.+\.webm$/),
    })

    const button = page.locator('[data-vt="cover"] button[data-chrome]')
    await expect(button).toHaveAttribute('aria-label', motion['motion.pause'].es)
    await button.click()
    await expect(button).toHaveAttribute('aria-label', motion['motion.play'].es)
    expect(await cover.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true)
  })

  test('si el WebM no se puede decodificar, la portada sigue con el MP4', async ({ page }) => {
    // El contenedor llega entero y los cuadros, rotos: el navegador da error de decodificación (como
    // un VP9 de rango completo en Chromium para Windows) y no prueba solo la fuente siguiente.
    await page.route('**/*.webm', async (route) => {
      const res = await route.fetch({ headers: { ...route.request().headers(), range: '' } })
      const body = Buffer.from(await res.body())
      body.fill(0xA5, 4096, Math.min(body.length, 65536))
      await route.fulfill({ status: 200, body, headers: { 'content-type': 'video/webm' } })
    })
    await open(page, '/projects/la-rucula')
    const cover = page.locator('[data-vt="cover"] video').first()
    await cover.evaluate(v => v.scrollIntoView({ block: 'center' }))
    await expect.poll(() => cover.evaluate((v: HTMLVideoElement) => v.currentSrc), { timeout: 8000 }).toMatch(/\.mp4$/)
    await expect.poll(() => cover.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 8000 }).toBeGreaterThan(0)
  })

  test('un video de la galería no se descarga hasta que se ve y entonces reproduce', async ({ page }) => {
    await open(page, '/projects/la-rucula')
    // El índice, no el atributo: al arrancar, el video pasa a preload="auto".
    const index = await page.locator('video').evaluateAll(vs => vs.findIndex(v => v.getAttribute('preload') === 'none'))
    expect(index).toBeGreaterThan(-1)
    const gallery = page.locator('video').nth(index)
    expect(await gallery.evaluate((v: HTMLVideoElement) => v.readyState)).toBe(0)
    await gallery.evaluate(v => v.scrollIntoView({ block: 'center' }))
    await expect.poll(() => gallery.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 8000 }).toBeGreaterThan(0)
  })
})
