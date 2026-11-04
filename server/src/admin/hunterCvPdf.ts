/**
 * El PDF del CV de una vacante, para «Enviar desde Eros»: la misma hoja de la etapa CV
 * (`renderCvHtml(entry.cv)`, del caché) impresa por un Chromium sin cabeza (puppeteer-core).
 * Antes de imprimir se mide como en `scripts/cv-pdf.mjs`: medios de impresión, ancho imprimible de A4
 * y el alto de `main`. Fuera de la cota dual (248–265 mm) o con más de una página no hay PDF y no se
 * envía nada (invariante 6). La hoja no lleva scripts y el navegador no sale a la red: todo pedido
 * que no sea la página misma se corta.
 *
 * El Chromium sale de `CHROMIUM_PATH` (en la imagen de la API, `/usr/bin/chromium` con las fuentes
 * Liberation, métricamente iguales a Times New Roman). Fuera de producción, sin esa variable, se usa
 * el de Playwright que ya instala `pnpm test:e2e`. Un PDF a la vez: cada uno abre y cierra su navegador.
 */
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'
import type { AdminCv } from '../shared/hunterContracts.js'
import { renderCvHtml } from './hunterCvHtml.js'

/** La cota dual del CV Harvard ATS (.claude/rules/explorer.md). */
export const CV_HEIGHT_MM = { min: 248, max: 265 } as const

const MM_PER_PX = 25.4 / 96
/** A4 menos los márgenes del @page de la hoja: 12 mm a los lados y 10,5 mm arriba y abajo. */
const PRINTABLE_MM = { width: 210 - 24, height: 297 - 21 }
const RENDER_TIMEOUT_MS = 20_000

export interface CvPdf {
  pdf: Buffer
  sha256: string
  heightMm: number
  pages: number
}

/** Por qué no hay PDF: sin Chromium (503) o la hoja fuera de la cota (422). */
export class CvPdfError extends Error {
  constructor(
    readonly reason: 'unavailable' | 'out_of_bounds',
    message: string,
    readonly heightMm: number | null = null,
    readonly pages: number | null = null,
  ) {
    super(message)
  }
}

/** El ejecutable de Chromium: CHROMIUM_PATH, o fuera de producción el de Playwright. null si no hay. */
async function chromiumPath(): Promise<string | null> {
  const configured = process.env['CHROMIUM_PATH']?.trim()
  if (configured) return existsSync(configured) ? configured : null
  if (process.env['NODE_ENV'] === 'production') return null
  try {
    const { chromium } = await import('@playwright/test')
    const path = chromium.executablePath()
    return existsSync(path) ? path : null
  }
  catch {
    return null
  }
}

/** Cuántas páginas tiene el PDF: los objetos `/Type /Page` (sin contar `/Pages`). */
export function pdfPages(pdf: Buffer): number {
  return pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)?.length ?? 0
}

/** «El CV mide 271 mm…»: lo que dice la etapa Postular cuando la hoja no entra en la cota. */
function outOfBounds(heightMm: number, pages: number): CvPdfError {
  const mm = Math.round(heightMm)
  const what = pages > 1
    ? `El CV ocupa ${pages} páginas (${mm} mm)`
    : mm > CV_HEIGHT_MM.max ? `El CV mide ${mm} mm, más que los ${CV_HEIGHT_MM.max} mm de una página A4` : `El CV mide ${mm} mm, menos que los ${CV_HEIGHT_MM.min} mm de la hoja`
  return new CvPdfError('out_of_bounds', `${what}: ajustalo en la etapa CV antes de enviarlo. No se envió nada.`, heightMm, pages)
}

let queue: Promise<unknown> = Promise.resolve()

/** Corre de a uno: dos envíos al mismo tiempo no abren dos navegadores. */
function serial<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.catch(() => undefined)
  return run
}

async function render(cv: AdminCv, target: string | undefined): Promise<CvPdf> {
  const executablePath = await chromiumPath()
  if (!executablePath) throw new CvPdfError('unavailable', 'La API no tiene con qué armar el PDF del CV (falta Chromium). No se envió nada.')

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    // En el contenedor corre sin usuario con privilegios; la página es propia, sin scripts ni red.
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
    timeout: RENDER_TIMEOUT_MS,
  }).catch((err: unknown) => {
    throw new CvPdfError('unavailable', `No arrancó el navegador que arma el PDF del CV (${err instanceof Error ? err.message.slice(0, 120) : 'error'}). No se envió nada.`)
  })
  try {
    const page = await browser.newPage()
    page.setDefaultTimeout(RENDER_TIMEOUT_MS)
    await page.setRequestInterception(true)
    // La hoja llega con setContent: cualquier otro pedido (una imagen, una fuente remota) no sale.
    page.on('request', (req) => {
      if (req.isInterceptResolutionHandled()) return
      if (req.url().startsWith('data:')) void req.continue()
      else void req.abort()
    })
    await page.setViewport({ width: Math.round(PRINTABLE_MM.width / MM_PER_PX), height: Math.round(PRINTABLE_MM.height / MM_PER_PX) })
    await page.emulateMediaType('print')
    await page.setContent(renderCvHtml(cv, { target }), { waitUntil: 'load' })
    // Como texto: el servidor no tiene los tipos del DOM.
    await page.evaluate('document.fonts.ready.then(() => 0)')
    const heightPx = Number(await page.evaluate('document.querySelector("main")?.getBoundingClientRect().height ?? 0'))
    const heightMm = Math.round(heightPx * MM_PER_PX * 10) / 10

    const pdf = Buffer.from(await page.pdf({ preferCSSPageSize: true, printBackground: true }))
    const pages = pdfPages(pdf)
    if (pages !== 1 || heightMm < CV_HEIGHT_MM.min || heightMm > CV_HEIGHT_MM.max) throw outOfBounds(heightMm, pages)
    return { pdf, sha256: createHash('sha256').update(pdf).digest('hex'), heightMm, pages }
  }
  finally {
    await browser.close().catch(() => undefined)
  }
}

/** El PDF de una página A4 del CV, medido; CvPdfError si no hay Chromium o la hoja no entra en la cota. */
export function renderCvPdf(cv: AdminCv, target?: string): Promise<CvPdf> {
  return serial(() => render(cv, target))
}
