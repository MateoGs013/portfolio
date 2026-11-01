import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import type { HunterJob, JobInput, TailoredCv } from '../../server/src/shared/hunterContracts'
import { api } from './support'

/**
 * Consola /admin (invariante 6): el generador del Job Hunter analiza una vacante, adapta el CV Harvard
 * ATS, lo previsualiza, lo imprime en una página A4 y lo copia en texto plano. Corre sin Eros (la API
 * de la prueba apunta HUNTER_API_URL a un puerto cerrado) y con EROS_DEMO=1: la cola es la muestra
 * ficticia y todo el CV sale de la base. El token es el de esta corrida (playwright.config.ts) y nunca
 * se imprime.
 */
const token = process.env.PW_ADMIN_TOKEN!
const auth = { Authorization: `Bearer ${token}` }

interface Evaluation { ok: boolean, job: HunterJob, match: { score: number, verdict: string } }
const VERDICTS = ['EXCELENTE_MATCH', 'BUEN_MATCH', 'REGULAR', 'DESCARTAR']

const MM_PER_PX = 25.4 / 96
/** A4 menos el @page de la hoja del Job Hunter (10,5 mm arriba y abajo, 12 mm a los lados). */
const PRINTABLE = { width: 210 - 24, height: 297 - 21 }
const BOUNDS = { min: 248, max: 265 }

const inputOf = (job: HunterJob): { job: JobInput } => ({
  job: { title: job.title, company: job.company, description: job.description, tags: job.tags, url: job.url, contact_email: job.contact_email },
})

const pasted = {
  id: 'manual-e2e-pegada',
  body: { job: { title: 'Desarrollador Full Stack', company: 'Ejemplo Pegado', description: 'Buscamos experiencia con Node.js, Vue 3 y PostgreSQL.', tags: [], url: '', contact_email: null } },
}

async function demoJobs(request: APIRequestContext): Promise<HunterJob[]> {
  const res = await request.get('/api/admin/hunter/jobs', { headers: auth })
  expect(res.status()).toBe(200)
  const jobs = await res.json() as HunterJob[]
  expect(jobs.length).toBeGreaterThan(0)
  expect(jobs.every(j => j.demo === true && j._source === 'demo')).toBe(true)
  return jobs
}

async function buildCv(request: APIRequestContext, id: string, body: unknown): Promise<TailoredCv> {
  const res = await request.post(`/api/admin/hunter/cv/${id}`, { headers: auth, data: body })
  expect(res.status()).toBe(200)
  return res.json() as Promise<TailoredCv>
}

async function sheetUrl(request: APIRequestContext, id: string): Promise<string> {
  const res = await request.post(`/api/admin/hunter/cv/${id}/ticket`, { headers: auth })
  const { ticket } = await res.json() as { ticket: string }
  return `/api/admin/hunter/cv/${id}/html?ticket=${encodeURIComponent(ticket)}`
}

async function login(page: Page) {
  await page.goto('/admin', { waitUntil: 'networkidle' })
  await page.locator('form input[type="password"]').fill(token)
  await page.locator('form button[type="submit"]').click()
  await expect(page.locator('aside button', { hasText: 'Job Hunter' })).toBeVisible({ timeout: 15000 })
}

async function openJob(page: Page, job: HunterJob) {
  await login(page)
  await page.locator('aside button', { hasText: 'Job Hunter' }).click()
  await page.getByText(job.title, { exact: true }).first().click()
}

test.describe('sin token', () => {
  test('la API del admin responde 401 y la consola pide la clave', async ({ page, request }) => {
    expect((await request.get('/api/admin/projects')).status()).toBe(401)
    expect((await request.get('/api/admin/hunter/jobs', { headers: { Authorization: 'Bearer otra-cosa' } })).status()).toBe(401)
    expect((await request.get('/api/admin/meta', { headers: { Authorization: 'Bearer dev-token' } })).status()).toBe(401)
    await page.goto('/admin', { waitUntil: 'networkidle' })
    await expect(page.locator('form input[type="password"]')).toBeVisible()
  })
})

test.describe('Job Hunter', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('analiza, adapta, previsualiza, imprime en A4 y copia el CV en texto plano', async ({ page, context, request }) => {
    const job = (await demoJobs(request))[0]!

    // Analizar: la evaluación de la vacante (respaldo contra la base, sin Eros), con la vacante en el cuerpo.
    const evaluated = await request.post(`/api/admin/hunter/jobs/${job.id}/evaluate`, { headers: auth, data: inputOf(job) })
    expect(evaluated.status()).toBe(200)
    const { match } = await evaluated.json() as Evaluation
    expect(match.score).toBeGreaterThanOrEqual(0)
    expect(match.score).toBeLessThanOrEqual(100)
    expect(VERDICTS).toContain(match.verdict)
    expect((await demoJobs(request)).find(j => j.id === job.id)?.match_score).toBe(match.score)

    const cv = await api<{ header: { name: string }, experience: { title: string }[] }>(request, '/cv')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await openJob(page, job)

    // La consola muestra el análisis: puntaje y veredicto de la vacante.
    await expect(page.getByText(`${match.score}% Match IA`)).toBeVisible()
    await expect(page.getByText(match.verdict, { exact: true }).first()).toBeVisible()

    // Adaptar y previsualizar.
    await page.getByRole('button', { name: 'Generar CV Harvard ATS' }).first().click()
    await expect(page.getByText('CV Harvard ATS Adaptado · Formato A4')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(cv.header.name).first()).toBeVisible()

    // Copiar en texto plano: el que arma la API desde la misma caché, sin marcado.
    await page.getByRole('button', { name: 'Copiar ATS' }).click()
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText()), { timeout: 5000 }).toContain(cv.header.name)
    const text = await page.evaluate(() => navigator.clipboard.readText())
    expect(text).toContain(cv.experience[0]!.title)
    expect(text).not.toMatch(/<[a-z][^>]*>/i)

    // Imprimir en A4: abre la hoja con un ticket firmado y entra en una página.
    const [sheet] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: 'Imprimir en A4' }).click(),
    ])
    await sheet.waitForLoadState('networkidle')
    expect(sheet.url()).toMatch(new RegExp(`/api/admin/hunter/cv/${job.id}/html\\?ticket=[^&]+&auto_print=true$`))
    await expect(sheet.getByText(cv.header.name).first()).toBeVisible()
    await sheet.emulateMedia({ media: 'print' })
    const pdf = await sheet.pdf({ preferCSSPageSize: true, printBackground: true })
    expect(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)?.length ?? 0).toBe(1)
    // El ticket vale solo para esa vacante: con otro id no abre nada.
    expect((await request.get(sheet.url().replace(`/cv/${job.id}/`, '/cv/otra-vacante/'))).status()).toBe(401)
  })

  test('sin CV en la caché responde 409 y la consola lo vuelve a generar sola', async ({ page, request }) => {
    const job = (await demoJobs(request))[1]!
    const missing = await request.get(`/api/admin/hunter/cv/${job.id}/html`, { headers: auth })
    expect(missing.status()).toBe(409)
    expect((await missing.json() as { code: string }).code).toBe('cv_expired')

    const cv = await api<{ header: { name: string } }>(request, '/cv')
    await openJob(page, job)
    await page.getByRole('button', { name: 'Generar CV Harvard ATS' }).first().click()
    await expect(page.getByText('CV Harvard ATS Adaptado · Formato A4')).toBeVisible({ timeout: 15000 })

    // La API se reinició entre generar e imprimir: el primer pedido de la hoja vuelve con 409.
    let answered409 = false
    await page.route(`**/api/admin/hunter/cv/${job.id}/html`, async (route) => {
      if (answered409) return route.continue()
      answered409 = true
      await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'Generá el CV de nuevo', code: 'cv_expired', errors: [] }) })
    })
    const regenerated = page.waitForRequest(req => req.method() === 'POST' && req.url().endsWith(`/api/admin/hunter/cv/${job.id}`))
    const [sheet] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: 'Imprimir en A4' }).click(),
    ])
    await regenerated
    await sheet.waitForLoadState('networkidle')
    expect(answered409).toBe(true)
    await expect(sheet.getByText(cv.header.name).first()).toBeVisible()
  })
})

test.describe('la hoja del CV', () => {
  test.use({ viewport: { width: Math.round(PRINTABLE.width / MM_PER_PX), height: Math.round(PRINTABLE.height / MM_PER_PX) } })

  test(`7 vacantes (ES, EN y una pegada): una página A4 de ${BOUNDS.min} a ${BOUNDS.max} mm`, async ({ page, request }, info) => {
    const cases = [
      ...(await demoJobs(request)).map(job => ({ id: job.id, body: inputOf(job) })),
      pasted,
    ]
    expect(cases).toHaveLength(7)
    const langs: string[] = []

    for (const { id, body } of cases) {
      const { data } = await buildCv(request, id, body)
      langs.push(data.lang)
      await page.goto(await sheetUrl(request, id), { waitUntil: 'networkidle' })
      await expect(page.locator('html')).toHaveAttribute('lang', data.lang)
      await page.emulateMedia({ media: 'print' })
      const heightMm = await page.locator('main').evaluate(el => el.getBoundingClientRect().height) * MM_PER_PX
      const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true })
      await page.emulateMedia({ media: 'screen' })
      await info.attach(`cv-${id}-${data.lang}.pdf`, { body: pdf, contentType: 'application/pdf' })

      expect(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)?.length ?? 0, `${id}: páginas`).toBe(1)
      expect(heightMm, `${id} (${data.lang}): alto en mm`).toBeGreaterThanOrEqual(BOUNDS.min)
      expect(heightMm, `${id} (${data.lang}): alto en mm`).toBeLessThanOrEqual(BOUNDS.max)
    }
    expect(langs.filter(l => l === 'es').length).toBeGreaterThanOrEqual(3)
    expect(langs.filter(l => l === 'en').length).toBeGreaterThanOrEqual(3)
  })

  test('el CV base mide lo mismo y se lo cuenta al iframe que lo contiene', async ({ page, request }) => {
    const { ticket } = await (await request.post('/api/admin/hunter/cv-base/ticket', { headers: auth })).json() as { ticket: string }
    for (const lang of ['es', 'en'] as const) {
      const src = `/api/admin/hunter/cv-base/html?lang=${lang}&measure=1&ticket=${encodeURIComponent(ticket)}`
      await page.goto('/admin', { waitUntil: 'domcontentloaded' })
      const measure = await page.evaluate(url => new Promise<{ heightMm: number, pages: number }>((done) => {
        addEventListener('message', (event) => {
          if (event.data?.type === 'cv-measure') done(event.data)
        })
        const frame = document.createElement('iframe')
        frame.setAttribute('sandbox', 'allow-scripts')
        frame.src = url
        document.body.append(frame)
      }), src)
      expect(measure.pages, lang).toBe(1)
      expect(measure.heightMm, lang).toBeGreaterThanOrEqual(BOUNDS.min)
      expect(measure.heightMm, lang).toBeLessThanOrEqual(BOUNDS.max)
    }
  })
})
