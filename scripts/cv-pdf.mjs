#!/usr/bin/env node
/**
 * Genera los PDF del CV Harvard ATS desde el sitio local (F6, .claude/rules/explorer.md «cota dual»).
 *
 *   pnpm build && pnpm start          # con la API arriba
 *   node scripts/cv-pdf.mjs           # CV_BASE_URL o PLAYWRIGHT_BASE_URL; por defecto http://localhost:3000
 *
 * Abre /about?cv=ats en cada idioma, emula impresión y mide la hoja (.cv-harvard): una sola página A4,
 * alto entre 248 y 265 mm y la escala ATS (nombre 19–21 pt, secciones 11–11,5 pt, cuerpo 9,2–9,5 pt).
 * Solo si los dos idiomas pasan escribe los PDF, en la ruta que publica contact.cv de cada idioma
 * (nada de nombres escritos acá). Si algo falla no toca public/ y termina en 1.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = resolve(root, 'public')
const base = (process.env.CV_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
const langs = ['es', 'en']

const MM_PER_PX = 25.4 / 96
const PT_PER_PX = 72 / 96
/** A4 menos el margen único de print.css (10,5 mm arriba y abajo, 12 mm a los lados). */
const PRINTABLE = { width: 210 - 24, height: 297 - 21 }
const HEIGHT_MM = [248, 265]
const SCALE_PT = { name: [19, 21], section: [11, 11.5], body: [9.2, 9.5] }

/** La ruta del PDF publicado en `lang`, validada: siempre un .pdf dentro de public/cv/. */
async function pdfPath(lang) {
  const res = await fetch(`${base}/api/docs/contact?lang=${lang}`)
  if (!res.ok) throw new Error(`GET /api/docs/contact?lang=${lang} respondió ${res.status}`)
  const { data } = await res.json()
  const href = data.fields.find(field => field.name === 'cv')?.value
  if (typeof href !== 'string' || !/^\/cv\/[\w.-]+\.pdf$/.test(href)) {
    throw new Error(`contact.cv en ${lang} no es un PDF de /cv/: ${JSON.stringify(href)}`)
  }
  const file = resolve(publicDir, `.${href}`)
  if (!file.startsWith(publicDir + sep)) throw new Error(`contact.cv sale de public/: ${href}`)
  return { href, file }
}

const within = (value, [min, max]) => value >= min - 0.01 && value <= max + 0.01

async function render(browser, lang) {
  const width = Math.round(PRINTABLE.width / MM_PER_PX)
  const height = Math.round(PRINTABLE.height / MM_PER_PX)
  const page = await browser.newPage({ viewport: { width, height } })
  try {
    await page.goto(`${base}/about?cv=ats${lang === 'en' ? '&lang=en' : ''}`, { waitUntil: 'networkidle' })
    const htmlLang = await page.locator('html').getAttribute('lang')
    if (htmlLang !== lang) throw new Error(`<html lang> es ${htmlLang}, se esperaba ${lang}`)

    await page.emulateMedia({ media: 'print' })
    const sheet = page.locator('.cv-harvard')
    if ((await sheet.count()) !== 1) throw new Error(`se esperaba una sola hoja .cv-harvard y hay ${await sheet.count()}`)
    await page.evaluate(() => document.fonts.ready)

    const measure = await sheet.evaluate((el) => {
      const size = node => (node ? Number.parseFloat(getComputedStyle(node).fontSize) : Number.NaN)
      return {
        height: el.getBoundingClientRect().height,
        name: size(el.querySelector('header > :first-child')),
        section: size(el.querySelector('section > :first-child')),
        body: size(el.querySelector('section li')),
      }
    })

    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } })
    const pages = pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)?.length ?? 0

    const result = {
      lang,
      pages,
      heightMm: measure.height * MM_PER_PX,
      namePt: measure.name * PT_PER_PX,
      sectionPt: measure.section * PT_PER_PX,
      bodyPt: measure.body * PT_PER_PX,
    }
    const problems = [
      pages !== 1 && `${pages} páginas`,
      !within(result.heightMm, HEIGHT_MM) && `alto ${result.heightMm.toFixed(1)} mm fuera de ${HEIGHT_MM.join('–')} mm`,
      !within(result.namePt, SCALE_PT.name) && `nombre ${result.namePt.toFixed(2)} pt`,
      !within(result.sectionPt, SCALE_PT.section) && `sección ${result.sectionPt.toFixed(2)} pt`,
      !within(result.bodyPt, SCALE_PT.body) && `cuerpo ${result.bodyPt.toFixed(2)} pt`,
    ].filter(Boolean)
    return { ...result, pdf, problems }
  }
  finally {
    await page.close()
  }
}

async function main() {
  const targets = Object.fromEntries(await Promise.all(langs.map(async lang => [lang, await pdfPath(lang)])))
  // Sin contact.cv traducido, la API devuelve el de ES también en EN: el render EN pisaría el PDF ES.
  if (targets.es.file === targets.en.file) {
    console.error(`cv-pdf: contact.cv apunta al mismo archivo en es y en (${targets.es.href}); no se escribió ningún PDF.`)
    process.exit(1)
  }
  const browser = await chromium.launch()
  let results
  try {
    results = []
    for (const lang of langs) results.push(await render(browser, lang))
  }
  finally {
    await browser.close()
  }

  for (const r of results) {
    const status = r.problems.length ? `FALLA: ${r.problems.join(', ')}` : 'ok'
    console.log(`${r.lang.toUpperCase()}  ${r.pages} pág · ${r.heightMm.toFixed(1)} mm · nombre ${r.namePt.toFixed(1)} pt · sección ${r.sectionPt.toFixed(1)} pt · cuerpo ${r.bodyPt.toFixed(1)} pt  ${status}`)
  }
  if (results.some(r => r.problems.length)) {
    console.error('cv-pdf: la hoja no cumple la cota dual; no se escribió ningún PDF.')
    process.exit(1)
  }

  for (const r of results) {
    const { href, file } = targets[r.lang]
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, r.pdf)
    console.log(`escrito public${href} (${(r.pdf.length / 1024).toFixed(0)} KB)`)
  }
}

main().catch((err) => {
  console.error(`cv-pdf: ${err.message}`)
  process.exit(1)
})
