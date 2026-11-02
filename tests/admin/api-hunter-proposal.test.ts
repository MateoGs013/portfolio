/**
 * El resumen que propone Eros (H0, invariante 6): solo entra al CV si deja la hoja en la cota dual y
 * está en el idioma del CV. La parte con red necesita el Eros simulado.
 *
 * admin-run: --eros-mock
 *
 *   node scripts/admin-run.mjs --eros-mock -- pnpm tsx --test tests/admin/api-hunter-proposal.test.ts
 */
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { chromium } from '@playwright/test'
import type { TailoredCv } from '../../server/src/shared/hunterContracts.js'
import { judgeProposal } from '../../server/src/admin/cvProposal.js'
import { ok } from './api.js'

const base = process.env['ADMIN_API_URL']!
const eros = process.env['HUNTER_API_URL'] ?? ''
const online = /^http:\/\/127\.0\.0\.1:\d+$/.test(eros) && !eros.endsWith(':9')

const MM_PER_PX = 25.4 / 96
const PRINTABLE = { width: 210 - 24, height: 297 - 21 }
const BOUNDS = { min: 248, max: 265 }

const job = (title: string, description: string) => ({ job: { title, company: 'Ejemplo', description, tags: [], url: '', contact_email: '' } })
const frontend = job('Desarrollador Frontend', 'Vue 3 y Nuxt')
const backend = job('Backend Developer', 'Node.js, Express and PostgreSQL')

describe('la propuesta de resumen, sin red', () => {
  test('largo y idioma', () => {
    const own = 'Desarrollo con criterio de diseño y foco en el producto entero, de la idea a producción.'
    assert.equal(judgeProposal('Desarrollo con foco en el producto entero y en la experiencia, de la idea a producción.', own, 'es'), 'ok')
    assert.equal(judgeProposal(`${own} ${own}`, own, 'es'), 'too_long')
    assert.equal(judgeProposal('Desarrollo de la web.', own, 'es'), 'too_short')
    assert.equal(judgeProposal('I build products with design judgment and a focus on the whole thing, from idea to production.', own, 'es'), 'other_lang')
  })
})

if (online) {
  describe('con el Eros simulado', () => {
    test('en otro idioma no entra aunque se pida', async () => {
      const reply = await ok<TailoredCv>('POST', '/hunter/cv/eros-mock-backend', { ...job('Desarrollador Backend', 'Node.js y PostgreSQL'), useSummaryProposal: true })
      assert.equal(reply.data.lang, 'es')
      assert.equal(reply._adaptation.proposal, 'other_lang')
      assert.equal(reply.usesSummaryProposal, false)
      assert.notEqual(reply.data.summary, reply.summaryProposal)
    })

    test('volver al resumen de la base no le vuelve a preguntar a Eros', async () => {
      await ok<TailoredCv>('POST', '/hunter/cv/eros-mock-frontend', { ...frontend, useSummaryProposal: true })
      await fetch(`${eros}/__requests`, { method: 'DELETE' })
      const back = await ok<TailoredCv>('POST', '/hunter/cv/eros-mock-frontend', frontend)
      assert.equal(back.usesSummaryProposal, false)
      assert.equal(back._source, 'eros')
      const asked = (await (await fetch(`${eros}/__requests`)).json()) as unknown[]
      assert.equal(asked.length, 0)
    })

    test('aceptada, la hoja es una página A4 de 248 a 265 mm en ES y EN', async () => {
      const browser = await chromium.launch()
      try {
        const page = await browser.newPage({ viewport: { width: Math.round(PRINTABLE.width / MM_PER_PX), height: Math.round(PRINTABLE.height / MM_PER_PX) } })
        for (const [id, body, lang] of [['eros-mock-frontend', frontend, 'es'], ['eros-mock-backend', backend, 'en']] as const) {
          const reply = await ok<TailoredCv>('POST', `/hunter/cv/${id}`, { ...body, useSummaryProposal: true })
          assert.equal(reply.data.lang, lang)
          assert.equal(reply._adaptation.proposal, 'ok', `${id}: la propuesta de prueba tiene que ser aceptable`)
          assert.equal(reply.usesSummaryProposal, true)
          const { ticket } = await ok<{ ticket: string }>('POST', `/hunter/cv/${id}/ticket`)
          const sheet = `/api/admin/hunter/cv/${id}/html?ticket=${encodeURIComponent(ticket)}`
          // Impresa: una sola página y el alto de lo que se imprime.
          await page.goto(`${base}${sheet}`, { waitUntil: 'networkidle' })
          await page.emulateMedia({ media: 'print' })
          const heightMm = await page.locator('main').evaluate(el => el.getBoundingClientRect().height) * MM_PER_PX
          const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true })
          await page.emulateMedia({ media: 'screen' })
          assert.equal(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)?.length ?? 0, 1, `${id}: páginas`)
          assert.ok(heightMm >= BOUNDS.min && heightMm <= BOUNDS.max, `${id} (${lang}): ${heightMm.toFixed(1)} mm`)
          // Con measure=1 en un iframe aislado, la hoja dice lo mismo: así la mide el admin antes de imprimir.
          await page.goto(`${base}/admin/`, { waitUntil: 'domcontentloaded' })
          const measure = await page.evaluate(url => new Promise<{ heightMm: number, pages: number }>((done) => {
            addEventListener('message', (event) => {
              if (event.data?.type === 'cv-measure') done(event.data)
            })
            const frame = document.createElement('iframe')
            frame.setAttribute('sandbox', 'allow-scripts')
            frame.src = url
            document.body.append(frame)
          }), `${sheet}&measure=1`)
          assert.equal(measure.pages, 1, `${id}: measure=1, páginas`)
          assert.ok(Math.abs(measure.heightMm - heightMm) < 1, `${id}: measure=1 da ${measure.heightMm} mm y la impresión ${heightMm.toFixed(1)} mm`)
        }
      }
      finally {
        await browser.close()
      }
    })
  })
}
