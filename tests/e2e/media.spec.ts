import { expect, test } from '@playwright/test'
import motion from '../../app/lib/dict/motion'
import { api, open, WORKS } from './support'

/**
 * Capturas y videos (versionados en public/media/projects/): el sitio los sirve desde su propio origen
 * (Nitro proxía /media/** a la API), con el tipo correcto y con rangos para el video, y el video de un
 * caso reproduce de verdad, solo al verse y con su botón de pausa.
 */
interface MediaRow { kind: 'IMAGE' | 'VIDEO', role: string, src: string, srcWebm: string | null, poster: string | null }

const TYPES: Record<string, RegExp> = { webp: /image\/webp/, png: /image\/png/, jpg: /image\/jpeg/, webm: /video\/webm/, mp4: /video\/mp4/ }

test('cada archivo de las seis obras responde desde el origen del sitio con su tipo', async ({ request, baseURL }) => {
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

test.describe('en el caso', () => {
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
