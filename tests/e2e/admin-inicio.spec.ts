import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import type { HunterJob } from '../../server/src/shared/hunterContracts'
import { cvHashes, STAMP_FILE, writeStamp } from '../../scripts/cv-pdf.mjs'
import { sql } from '../admin/datos'

/**
 * Inicio (U5): la bandeja de pendientes calculada desde la base, sobre una copia. Las cifras del
 * resumen contra meta.count de la API pública; el inglés del resultado de una obra visible en NULL da
 * una fila que con Enter abre Relato con el foco en ese campo; cambiar una viñeta del CV hace aparecer
 * «El PDF del CV no coincide con la base» y recalcular el sello contra la copia la saca. Todas las
 * filas son enlaces que Tab alcanza, axe sin violaciones serias ni críticas y capturas a 1440 y 390 px.
 *
 *   pnpm build:admin
 *   node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-inicio.spec.ts
 *   node scripts/admin-run.mjs --demo -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-inicio.spec.ts
 *
 * Sin Eros (admin-run lo apunta a 127.0.0.1:9) el Inicio muestra la línea de Eros con el motivo; con
 * --demo, las vacantes nuevas compatibles de la muestra. El sello (server/src/snapshot/cv-stamp.json)
 * se recalcula contra la copia y se restaura al terminar.
 */
const token = process.env.PW_ADMIN_TOKEN!
const api = process.env.ADMIN_API_URL!
const ADMIN = '/admin-next/'
const auth = { Authorization: `Bearer ${token}` }
const STALE = 'El PDF del CV no coincide con la base'

interface Envelope { meta: { count: number } }
interface Untranslated { collection: string, id: number | string, fields: string[] }
type Job = HunterJob

async function signedIn(page: Page, hash = '#/inicio'): Promise<void> {
  await page.addInitScript(key => sessionStorage.setItem('adm-token', key), token)
  await page.goto(`${ADMIN}${hash}`)
  await expect(page.locator('#main h1')).toBeVisible()
}

/** Espera a que la bandeja termine de cargar (la cifra al lado de «Pendientes»). */
async function inbox(page: Page): Promise<void> {
  await expect(page.locator('#main h2').filter({ hasText: 'Pendientes' }).locator('span')).toHaveText(/^\d+$/)
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter(a => a.effect?.getComputedTiming().endTime !== Infinity)
    .map(a => a.finished.catch(() => null))))
}

async function noSeriousAxe(page: Page): Promise<void> {
  await settle(page)
  const { violations } = await new AxeBuilder({ page }).analyze()
  const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([])
}

async function capture(page: Page, info: TestInfo, name: string): Promise<void> {
  await settle(page)
  const size = page.viewportSize()!
  const tall = await page.evaluate(() => document.getElementById('main')?.scrollHeight ?? 0)
  await page.setViewportSize({ width: size.width, height: Math.max(size.height, tall + 120) })
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true })
  await page.setViewportSize(size)
}

async function count(page: Page, path: string): Promise<number> {
  const res = await page.request.get(path)
  expect(res.ok(), `GET ${path}`).toBe(true)
  return ((await res.json()) as Envelope).meta.count
}

const figure = (page: Page, id: string) => page.locator(`[data-figure="${id}"] > span`).first()

test.describe('Inicio', () => {
  test('las cifras del resumen coinciden con la API pública', async ({ page }) => {
    await signedIn(page)
    await expect(figure(page, 'projects')).toHaveText(String(await count(page, '/api/projects')))
    await expect(figure(page, 'articles')).toHaveText(String(await count(page, '/api/articles')))
    await expect(figure(page, 'experience')).toHaveText(String(await count(page, '/api/experience')))
    // Sin ceros a la izquierda: ninguna cifra empieza con 0 salvo el cero mismo.
    for (const text of await page.locator('[data-figure] > span:first-child').allTextContents()) expect(text).toMatch(/^(0|[1-9]\d*)$/)
  })

  test('el inglés del resultado en NULL da una fila que abre Relato con el foco en ese campo', async ({ page }) => {
    const meta = await (await page.request.get('/api/admin/meta', { headers: auth })).json() as { untranslated: Untranslated[] }
    const pending = new Set(meta.untranslated.filter(r => r.collection === 'projects').map(r => Number(r.id)))
    const { rows } = await sql(`SELECT p.id, p.title, t.outcome FROM "Project" p JOIN "ProjectTranslation" t ON t."projectId" = p.id AND t.locale = 'en'
      WHERE p."publishedAt" <= now() AND coalesce(p.outcome, '') <> '' AND coalesce(t.outcome, '') <> '' ORDER BY p."sortOrder"`)
    const target = (rows as { id: number, title: string, outcome: string }[]).find(r => !pending.has(r.id))
    expect(target, 'La copia no tiene una obra visible con todo el inglés cargado.').toBeTruthy()
    const { id, title, outcome } = target!
    await sql(`UPDATE "ProjectTranslation" SET outcome = NULL WHERE "projectId" = $1 AND locale = 'en'`, [id])
    try {
      await signedIn(page)
      await inbox(page)
      const row = page.locator('#main [data-group="ingles"] a').filter({ hasText: `Falta el inglés en ${title}` })
      await expect(row).toHaveCount(1)
      await expect(row).toContainText('Resultado')
      await row.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(new RegExp(`#/obras/${id}/relato\\?campo=translations\\.en\\.outcome$`))
      await expect(page.locator('[data-field="translations.en.outcome"] textarea')).toBeFocused()
    }
    finally {
      await sql(`UPDATE "ProjectTranslation" SET outcome = $2 WHERE "projectId" = $1 AND locale = 'en'`, [id, outcome])
    }
  })

  test('una viñeta cambiada avisa que el PDF del CV no coincide, y el sello recalculado lo saca', async ({ page }) => {
    const saved = existsSync(STAMP_FILE) ? readFileSync(STAMP_FILE, 'utf8') : null
    const { rows } = await sql(`SELECT id, highlights FROM "Experience" WHERE "cvOrder" IS NOT NULL AND kind <> 'EDUCATION' AND cardinality(highlights) > 0 ORDER BY "cvOrder" LIMIT 1`)
    const entry = rows[0] as { id: number, highlights: string[] } | undefined
    expect(entry, 'La copia no tiene experiencias en el CV con viñetas.').toBeTruthy()
    const { id, highlights } = entry!
    try {
      await writeStamp(await cvHashes(api))
      await signedIn(page)
      await inbox(page)
      await expect(page.getByText(STALE)).toHaveCount(0)

      await sql(`UPDATE "Experience" SET highlights = $2 WHERE id = $1`, [id, [`${highlights[0]} (cambio de prueba)`, ...highlights.slice(1)]])
      await page.reload()
      await inbox(page)
      const row = page.locator('#main [data-group="cv-pdf"] a')
      await expect(row).toContainText(STALE)
      await expect(row).toContainText('Regenerá los PDF con pnpm cv:pdf y commitealos')
      await expect(row).toContainText('en español')
      await expect(row).toHaveAttribute('href', /#\/trayectoria\/cv$/)

      await writeStamp(await cvHashes(api))
      await page.reload()
      await inbox(page)
      await expect(page.getByText(STALE)).toHaveCount(0)
    }
    finally {
      await sql(`UPDATE "Experience" SET highlights = $2 WHERE id = $1`, [id, highlights])
      if (saved === null) rmSync(STAMP_FILE, { force: true })
      else writeFileSync(STAMP_FILE, saved)
    }
  })

  test('cada fila es un enlace que Tab alcanza y lleva a su campo', async ({ page }) => {
    await signedIn(page)
    await inbox(page)
    const rows = page.locator('#main [data-group] a')
    const hrefs = await rows.evaluateAll(links => links.map(a => a.getAttribute('href')))
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) expect(href).toMatch(/^#\//)

    await page.locator('#main h1').focus()
    const reached = new Set<string>()
    for (let i = 0; i < hrefs.length + 40 && reached.size < hrefs.length; i++) {
      await page.keyboard.press('Tab')
      const href = await page.evaluate(() => document.activeElement?.closest('[data-group] a')?.getAttribute('href') ?? null)
      if (href) reached.add(href)
    }
    expect([...reached].sort()).toEqual([...new Set(hrefs as string[])].sort())

    // Una obra oculta lleva a su publicación, que se abre sola con ?campo=publishedAt.
    const hidden = page.locator('#main [data-kind="hidden"] a').first()
    if (await hidden.count()) {
      await hidden.click()
      await expect(page).toHaveURL(/campo=publishedAt$/)
      await expect(page.locator('[data-field="publishedAt"]')).toBeVisible()
    }
  })

  test('Eros: la línea con el motivo si no responde, o la cifra de nuevas compatibles; y los dos accesos', async ({ page }) => {
    const jobs = await page.request.get('/api/admin/hunter/jobs', { headers: auth })
    await signedIn(page)
    const eros = page.locator('#main [data-group="eros"]')
    if (jobs.ok()) {
      // Con --demo la muestra no trae puntajes: nada nuevo y compatible, ni la línea de Eros.
      const fresh = ((await jobs.json()) as Job[]).filter(j => j.status === 'new' && (j.match_score ?? 0) >= 65)
      await expect(figure(page, 'jobs')).toHaveText(String(fresh.length))
      await expect(page.locator('#main [data-group="vacantes"] a')).toHaveCount(Math.min(fresh.length, 5))
      await expect(eros).toHaveCount(0)
    }
    else {
      await expect(eros).toContainText('No se pueden ver las vacantes nuevas ahora')
      await expect(eros.getByRole('button', { name: 'Probar de nuevo' })).toBeVisible()
      await expect(page.locator('[data-figure="jobs"]')).toHaveCount(0)
    }

    await page.getByRole('link', { name: /^Nueva obra/ }).click()
    await expect(page).toHaveURL(/#\/obras\/nueva$/)
    await page.goBack()
    await expect(page.locator('#main h1')).toHaveText('Inicio')
    await page.keyboard.press('n')
    await expect(page).toHaveURL(/#\/obras\/nueva$/)
    await page.goto(`${ADMIN}#/inicio`)
    await expect(page.locator('#main h1')).toHaveText('Inicio')
    await page.getByRole('link', { name: 'Pegar una vacante' }).click()
    await expect(page).toHaveURL(/#\/busqueda\/vacantes/)
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('las vacantes nuevas compatibles: cinco filas a su análisis y el resto en Vacantes', async ({ page }, info) => {
    const job = (n: number, score: number | null, status: Job['status'] = 'new'): Job => ({
      id: `eros-inicio-${n}`, source: 'linkedin', external_id: String(n), title: `Puesto ${n}`, company: `Empresa ${n}`, url: 'https://example.com',
      description: 'Vacante de prueba.', tags: [], salary: null, country: null, is_remote: true, published_at: null, found_at: null, status,
      match_score: score, match_analysis: null, connection_note: null, hiring_manager_name: null, hiring_manager_title: null,
      contact_email: null, pitch_draft: null, semantic_score: null,
    })
    const queue = [job(1, 90), job(2, 84), job(3, 78), job(4, 70), job(5, 66), job(6, 65), job(7, 40), job(8, 95, 'applied')]
    const stats = { total: queue.length, high_match_count: 3, pending_eval_count: 0, applied_count: 1, discarded_count: 0 }
    await page.route('**/api/admin/hunter/jobs', route => route.fulfill({ json: queue, headers: { 'X-Eros-Source': 'eros' } }))
    await page.route('**/api/admin/hunter/stats', route => route.fulfill({ json: stats, headers: { 'X-Eros-Source': 'eros' } }))
    await signedIn(page)
    const block = page.locator('#main [data-group="vacantes"]')
    await expect(block.getByRole('heading', { name: /Vacantes nuevas compatibles/ })).toBeVisible()
    await expect(block.locator('li a')).toHaveCount(5)
    await expect(block.locator('li a').first()).toContainText('Puesto 1 en Empresa 1')
    await expect(block.locator('li a').first()).toContainText('Muy compatible · 90 %')
    await expect(block.locator('li a').first()).toHaveAttribute('href', /#\/busqueda\/vacantes\/eros-inicio-1\/analisis$/)
    await expect(figure(page, 'jobs')).toHaveText('6')
    await noSeriousAxe(page)
    await capture(page, info, 'inicio-vacantes-1440')
    await block.getByRole('link', { name: 'Ver la otra en Vacantes' }).click()
    await expect(page).toHaveURL(/#\/busqueda\/vacantes\?filtro=compatibles$/)
  })

  test('nada pendiente y error: los estados de la bandeja', async ({ page }) => {
    await page.route('**/api/admin/pending', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
    await signedIn(page)
    await expect(page.getByRole('heading', { name: 'Nada pendiente' })).toBeVisible()
    await page.unroute('**/api/admin/pending')

    await page.route('**/api/admin/pending', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'No hay conexión con la base de datos. Probá de nuevo en unos segundos.', code: 'db_unavailable', errors: [] }) }))
    await page.reload()
    await expect(page.getByRole('alert').filter({ hasText: 'No se pudieron calcular los pendientes.' })).toBeVisible()
    await page.unroute('**/api/admin/pending')
    await page.getByRole('alert').getByRole('button', { name: 'Reintentar' }).click()
    await inbox(page)
  })

  for (const width of [1440, 390]) {
    test(`axe y captura a ${width} px`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 900 })
      await signedIn(page)
      await inbox(page)
      // La cola de Eros responde (o no) después de la bandeja: se espera a que el bloque se resuelva.
      await expect(page.locator('#main [data-group="eros"], [data-figure="jobs"]').first()).toBeVisible()
      await noSeriousAxe(page)
      const overflow = await page.evaluate(() => {
        const main = document.getElementById('main')
        return Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, main ? main.scrollWidth - main.clientWidth : 0)
      })
      expect(overflow).toBeLessThanOrEqual(0)
      await capture(page, info, `inicio-${width}`)
    })
  }
})
