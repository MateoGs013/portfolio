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
 *
 * Junto a los PDF escribe server/src/snapshot/cv-stamp.json: el sha256 del JSON estable de
 * GET /api/cv?lang=es y ?lang=en (lo que dicen los PDF) y la fecha. El Inicio del admin compone el mismo
 * CV desde la base (server/src/admin/cvStamp.ts) y avisa cuando ya no coincide. Los PDF y el sello se
 * commitean juntos.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = resolve(root, 'public')
const base = (process.env.CV_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
const langs = ['es', 'en']
export const STAMP_FILE = resolve(root, 'server/src/snapshot/cv-stamp.json')

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

/** JSON con las claves en orden: la misma cuenta que stableJson de server/src/admin/cvStamp.ts. */
export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stableJson(value[k])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export const cvHash = data => createHash('sha256').update(stableJson(data)).digest('hex')

/** Los hashes del CV que sirve `origin` en cada idioma: { es, en }. `origin` es el sitio o la API. */
export async function cvHashes(origin = base) {
  const entries = await Promise.all(langs.map(async (lang) => {
    const res = await fetch(`${origin.replace(/\/+$/, '')}/api/cv?lang=${lang}`)
    if (!res.ok) throw new Error(`GET /api/cv?lang=${lang} respondió ${res.status}`)
    const { data, meta } = await res.json()
    // Un CV del respaldo no es el de la base: el sello quedaría contra otra cosa.
    if (meta?.source !== 'db') throw new Error(`GET /api/cv?lang=${lang} no salió de la base (source ${meta?.source})`)
    return [lang, cvHash(data)]
  }))
  return Object.fromEntries(entries)
}

/** Escribe el sello con la fecha de ahora. */
export async function writeStamp(hashes, file = STAMP_FILE) {
  const stamp = { at: new Date().toISOString(), es: hashes.es, en: hashes.en }
  await writeFile(file, `${JSON.stringify(stamp, null, 2)}\n`)
  return stamp
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
  // El sello es del CV que se va a imprimir: se toma antes y se confirma después de renderizar.
  const hashes = await cvHashes()
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

  const after = await cvHashes()
  if (langs.some(lang => after[lang] !== hashes[lang])) {
    console.error('cv-pdf: el CV cambió en la base mientras se generaban los PDF; no se escribió ningún PDF.')
    process.exit(1)
  }

  for (const r of results) {
    const { href, file } = targets[r.lang]
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, r.pdf)
    console.log(`escrito public${href} (${(r.pdf.length / 1024).toFixed(0)} KB)`)
  }
  const stamp = await writeStamp(hashes)
  console.log(`sello server/src/snapshot/cv-stamp.json (${stamp.at}): commitealo con los PDF`)
}

// Las pruebas del admin importan cvHashes y writeStamp: main corre solo como script.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((err) => {
    console.error(`cv-pdf: ${err.message}`)
    process.exit(1)
  })
}
