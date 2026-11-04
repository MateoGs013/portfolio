import { expect, test, type Page } from '@playwright/test'
import { ADMIN, auth, erosUrl, noSeriousAxe, shot, signedIn } from './admin-support'

/**
 * «Enviar desde Eros» encendido (EROS_SEND_ENABLED=on) contra el Eros simulado, que valida el `cv`
 * como Eros y no envía nada: la confirmación nombra el adjunto (el CV de la etapa CV, con su medida),
 * Eros recibe ese PDF, un envío cortado ofrece «Ya salió» o reintentar con confirmación, y un CV que la
 * API ya no tiene se rearma y se pide revisarlo sin enviarse solo. Apagado, el botón no está
 * (admin-vacantes.spec.ts). Nunca el Eros real ni un correo real.
 *
 *   node scripts/admin-run.mjs --eros-mock --send -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-enviar-eros.spec.ts
 *
 * admin-run: --eros-mock --send
 */
const JOB = 'eros-mock-frontend'
const stage = (page: Page, name: string) => page.getByRole('navigation', { name: 'Etapas de la vacante' }).getByRole('link', { name })
const toasts = (page: Page) => page.getByRole('region', { name: 'Avisos' })

interface Sent { path: string, body: { force_retry?: boolean, cv?: { sha256: string, filename: string, height_mm: number } } }
async function sentToEros(): Promise<Sent[]> {
  const all = await (await fetch(`${erosUrl}/__requests`)).json() as (Sent & { method: string })[]
  return all.filter(r => r.method === 'POST' && r.path.endsWith('/apply-email'))
}
const mock = (path: string, method: string, body?: unknown) => fetch(`${erosUrl}${path}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) })

/** CV adaptado en su etapa y medido; después Postular con el destinatario escrito a mano. */
async function readyToSend(page: Page): Promise<number> {
  await signedIn(page, `#/busqueda/vacantes/${JOB}/cv`)
  await page.getByRole('button', { name: 'Adaptar CV' }).click()
  const measure = page.locator('[data-cv-measure][data-height-mm]')
  await expect(measure).toBeVisible({ timeout: 20000 })
  const mm = Math.round(Number(await measure.getAttribute('data-height-mm')))
  await stage(page, 'Postular').click()
  const to = page.getByRole('textbox', { name: 'Destinatario' })
  await expect(to).not.toHaveValue('')
  await to.fill('rrhh@example.com')
  return mm
}

test.beforeEach(async () => {
  test.skip(!erosUrl || /:9\/?$/.test(erosUrl), 'necesita --eros-mock')
  await mock('/__envio', 'DELETE')
  await mock('/__requests', 'DELETE')
})

test('la confirmación nombra el adjunto y Eros recibe el PDF de la etapa CV', async ({ page }, info) => {
  const mm = await readyToSend(page)
  await page.getByRole('button', { name: 'Enviar desde Eros' }).click()
  const dialog = page.getByRole('alertdialog').or(page.getByRole('dialog', { name: 'Enviar la postulación' }))
  await expect(dialog).toContainText('rrhh@example.com')
  await expect(dialog).toContainText(`Adjunto: el CV de la etapa CV, ${mm} mm en una página A4`)
  await noSeriousAxe(page)
  await shot(page, info, 'enviar-confirmacion-1440')
  await dialog.getByRole('button', { name: 'Enviar', exact: true }).click()

  await expect(toasts(page)).toContainText(/Postulación enviada a rrhh@example\.com con CV_[A-Za-z0-9_]+_Harvard_ATS\.pdf\./)
  await expect(page.locator('#main header').getByText('Postulada')).toBeVisible()
  const [sent, ...rest] = await sentToEros()
  expect(rest).toEqual([])
  expect(sent?.body.cv?.filename).toMatch(/_Harvard_ATS\.pdf$/)
  expect(Math.round(sent!.body.cv!.height_mm)).toBe(mm)
  expect(sent?.body.force_retry).toBe(false)
})

test('un envío cortado ofrece «Ya salió» o reintentar, y reintentar pide confirmación', async ({ page }, info) => {
  await readyToSend(page)
  await mock('/__envio', 'PUT', { modo: 'cortado' })
  await page.getByRole('button', { name: 'Enviar desde Eros' }).click()
  await page.getByRole('button', { name: 'Enviar', exact: true }).click()

  const alert = page.getByRole('alert').filter({ hasText: 'No se sabe si la postulación salió' })
  await expect(alert).toContainText('puede que haya salido')
  await expect(alert).toContainText('Buscala en tu correo enviado')
  await expect(page.getByRole('button', { name: 'Enviar desde Eros' })).toHaveCount(0)
  await expect(page.locator('#main header').getByText('Postulada')).toHaveCount(0)
  await noSeriousAxe(page)
  await shot(page, info, 'enviar-incierto-1440')

  await mock('/__envio', 'PUT', { modo: 'ok' })
  await mock('/__requests', 'DELETE')
  await alert.getByRole('button', { name: 'No salió, reintentar' }).click()
  const confirm = page.getByRole('alertdialog').or(page.getByRole('dialog', { name: 'Reintentar el envío' }))
  await expect(confirm).toContainText('la empresa la recibe dos veces')
  await confirm.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.locator('#main header').getByText('Postulada')).toBeVisible()
  await expect(alert).toHaveCount(0)
  const [sent] = await sentToEros()
  expect(sent?.body.force_retry).toBe(true)
})

test('«Ya salió» la marca como postulada sin volver a enviar', async ({ page }) => {
  await readyToSend(page)
  await mock('/__envio', 'PUT', { modo: 'cortado' })
  await page.getByRole('button', { name: 'Enviar desde Eros' }).click()
  await page.getByRole('button', { name: 'Enviar', exact: true }).click()
  const alert = page.getByRole('alert').filter({ hasText: 'No se sabe si la postulación salió' })
  await expect(alert).toBeVisible()
  await mock('/__requests', 'DELETE')
  await alert.getByRole('button', { name: 'Ya salió' }).click()
  await expect(page.locator('#main header').getByText('Postulada')).toBeVisible()
  expect(await sentToEros()).toEqual([])
})

test('si la API ya no tiene el CV, lo rearma y pide revisarlo: no se envía solo', async ({ page, request }) => {
  await readyToSend(page)
  let rebuilt = 0
  page.on('request', (req) => {
    if (req.method() === 'POST' && /\/hunter\/cv\/eros-mock-frontend$/.test(req.url())) rebuilt += 1
  })
  await page.route('**/api/admin/hunter/jobs/*/apply-email', route => route.fulfill({ status: 409, json: { error: 'Generá el CV de nuevo: la API ya no tiene el de esta vacante.', code: 'cv_expired', errors: [] } }))
  await page.getByRole('button', { name: 'Enviar desde Eros' }).click()
  await page.getByRole('button', { name: 'Enviar', exact: true }).click()
  await expect(toasts(page)).toContainText('Revisalo en la etapa CV y enviá de nuevo: no se envió nada.')
  expect(rebuilt).toBe(1)
  await expect(page.locator('#main header').getByText('Postulada')).toHaveCount(0)
  expect(await sentToEros()).toEqual([])
  // La API tiene el CV rearmado: la hoja de la etapa CV es la que se enviaría.
  expect((await request.get(`/api/admin/hunter/cv/${JOB}/txt`, { headers: auth })).status()).toBe(200)
  await page.goto(`${ADMIN}#/busqueda/vacantes/${JOB}/cv`)
  await expect(page.locator('[data-cv-measure][data-height-mm]')).toBeVisible({ timeout: 20000 })
})
