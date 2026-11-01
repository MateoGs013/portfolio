/**
 * El sello del PDF del CV del sitio: scripts/cv-pdf.mjs guarda en server/src/snapshot/cv-stamp.json el
 * sha256 del JSON estable de GET /api/cv en cada idioma al escribir los PDF. Acá se compone el mismo
 * CvDocument desde la base y se compara: si cambió, el PDF publicado ya no dice lo mismo que la base.
 *
 * La cuenta tiene que ser idéntica a la del script (stableJson y cvHash de scripts/cv-pdf.mjs): el
 * `data` de la envoltura pasa por JSON, así que acá también.
 */
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from '../content/snapshot.js'
import type { Lang } from '../content/lang.js'
import { cvDocument } from '../routes/cv.js'
import type { CvStamp } from '../shared/adminContracts.js'

export const CV_STAMP_FILE = fileURLToPath(new URL('../snapshot/cv-stamp.json', import.meta.url))

const LANGS: readonly Lang[] = ['es', 'en']

/** JSON con las claves de cada objeto en orden: el mismo documento da siempre el mismo texto. */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value !== null && typeof value === 'object') {
    const entries = Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stableJson((value as Record<string, unknown>)[k])}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}

export function cvHash(data: unknown): string {
  return createHash('sha256').update(stableJson(JSON.parse(JSON.stringify(data)))).digest('hex')
}

/** El sello guardado, o null si no hay archivo o no tiene la forma esperada. */
export async function readCvStamp(file = CV_STAMP_FILE): Promise<CvStamp | null> {
  try {
    const raw: unknown = JSON.parse(await readFile(file, 'utf8'))
    if (typeof raw !== 'object' || raw === null) return null
    const { at, es, en } = raw as Record<string, unknown>
    return typeof at === 'string' && typeof es === 'string' && typeof en === 'string' ? { at, es, en } : null
  }
  catch {
    return null
  }
}

export interface CvDrift {
  stamp: CvStamp | null
  /** Los idiomas cuyo CV de la base ya no coincide con el sello (los dos si no hay sello). */
  changed: Lang[]
}

/** Compone el CV desde la base (nunca desde un respaldo) y lo compara con el sello. */
export async function cvDrift(): Promise<CvDrift> {
  const [stamp, ...hashes] = await Promise.all([
    readCvStamp(),
    ...LANGS.map(async lang => cvHash((await resolve(cvDocument, null, lang, 'db')).data)),
  ])
  const changed = LANGS.filter((lang, i) => !stamp || stamp[lang] !== hashes[i])
  return { stamp, changed }
}
