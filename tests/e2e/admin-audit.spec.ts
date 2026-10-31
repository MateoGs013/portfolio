import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { api } from './support'

/**
 * Consola /admin (invariante 6): el generador del Job Hunter analiza una vacante, adapta el CV Harvard
 * ATS, lo previsualiza, lo imprime en una página A4 y lo copia en texto plano. Corre sin Eros (la API
 * de la prueba apunta HUNTER_API_URL a un puerto cerrado): todo sale del respaldo desde la base. El
 * token es el de esta corrida (playwright.config.ts) y nunca se imprime.
 */
const token = process.env.PW_ADMIN_TOKEN!
const auth = { Authorization: `Bearer ${token}` }

interface Job { id: string, title: string, company: string, match_score: number | null }
interface Evaluation { ok: boolean, job: Job, match: { score: number, verdict: string } }
const VERDICTS = ['EXCELENTE_MATCH', 'BUEN_MATCH', 'REGULAR', 'DESCARTAR']

async function firstJob(request: APIRequestContext) {
  const res = await request.get('/api/admin/hunter/jobs', { headers: auth })
  expect(res.status()).toBe(200)
  const jobs = await res.json() as Job[]
  expect(jobs.length).toBeGreaterThan(0)
  return jobs[0]!
}

async function login(page: Page) {
  await page.goto('/admin', { waitUntil: 'networkidle' })
  await page.locator('form input[type="password"]').fill(token)
  await page.locator('form button[type="submit"]').click()
  await expect(page.locator('aside button', { hasText: 'Job Hunter' })).toBeVisible({ timeout: 15000 })
}

test.describe('sin token', () => {
  test('la API del admin responde 401 y la consola pide la clave', async ({ page, request }) => {
    expect((await request.get('/api/admin/projects')).status()).toBe(401)
    expect((await request.get('/api/admin/hunter/jobs', { headers: { Authorization: 'Bearer otra-cosa' } })).status()).toBe(401)
    await page.goto('/admin', { waitUntil: 'networkidle' })
    await expect(page.locator('form input[type="password"]')).toBeVisible()
  })
})

test.describe('Job Hunter', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('analiza, adapta, previsualiza, imprime en A4 y copia el CV en texto plano', async ({ page, context, request }) => {
    const job = await firstJob(request)

    // Analizar: la evaluación de la vacante (respaldo heurístico contra la base, sin Eros).
    const evaluated = await request.post(`/api/admin/hunter/jobs/${job.id}/evaluate`, { headers: auth })
    expect(evaluated.status()).toBe(200)
    const { match } = await evaluated.json() as Evaluation
    expect(match.score).toBeGreaterThanOrEqual(0)
    expect(match.score).toBeLessThanOrEqual(100)
    expect(VERDICTS).toContain(match.verdict)
    const listed = (await (await request.get('/api/admin/hunter/jobs', { headers: auth })).json() as Job[]).find(j => j.id === job.id)
    expect(listed?.match_score).toBe(match.score)

    const cv = await api<{ header: { name: string }, experience: { title: string }[] }>(request, '/cv')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await login(page)

    await page.locator('aside button', { hasText: 'Job Hunter' }).click()
    await page.getByText(job.title, { exact: true }).first().click()

    // La consola muestra el análisis: puntaje y veredicto de la vacante.
    await expect(page.getByText(`${match.score}% Match IA`)).toBeVisible()
    await expect(page.getByText(match.verdict, { exact: true }).first()).toBeVisible()

    // Adaptar y previsualizar.
    await page.getByRole('button', { name: 'Generar CV Harvard ATS' }).first().click()
    await expect(page.getByText('CV Harvard ATS Adaptado · Formato A4')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(cv.header.name).first()).toBeVisible()

    // Copiar en texto plano: el nombre y la experiencia de la base, sin marcado.
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
})
