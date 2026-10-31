/**
 * El candidato de los respaldos del admin (Job Hunter, contenido y radar) sale de la base, por el
 * mismo camino que la API pública: base, última respuesta buena o content.json. Ningún dato del
 * candidato se escribe a mano en server/src/admin.
 */
import type { CvDocument } from '../content/cv.js'
import type { Lang } from '../content/lang.js'
import { resolve } from '../content/snapshot.js'
import { cvDocument } from '../routes/cv.js'
import { docDetail } from '../routes/docs.js'
import { projectList } from '../routes/projects.js'

/** Una obra visible con los nombres de sus tecnologías. */
export interface Work {
  title: string
  techs: string[]
}

export interface HunterProfile {
  cv: CvDocument
  works: Work[]
}

/** Firma pública: nombre corto, sitio y usuario de GitHub, de los docs about y contact. */
export interface Signature {
  name: string | null
  website: string | null
  /** El host del sitio, sin protocolo (`example.com`). */
  site: string | null
  /** El usuario de GitHub, sin arroba. */
  handle: string | null
}

export async function loadCv(lang: Lang): Promise<CvDocument> {
  const { data } = await resolve(cvDocument, null, lang)
  if (!data) throw new Error('No se pudo componer el CV desde la base ni desde el snapshot')
  return data
}

export async function loadProfile(lang: Lang): Promise<HunterProfile> {
  const [cv, projects] = await Promise.all([loadCv(lang), resolve(projectList, {}, lang)])
  const works = (projects.data ?? []).map(p => ({ title: p.title, techs: p.techs.map(t => t.name) }))
  return { cv, works }
}

async function docValues(key: 'about' | 'contact'): Promise<Map<string, string>> {
  const { data } = await resolve(docDetail, key, 'es')
  const values = new Map<string, string>()
  for (const field of data?.fields ?? []) {
    const value = Array.isArray(field.value) ? field.value.join(', ') : field.value
    if (value.trim()) values.set(field.name, value.trim())
  }
  return values
}

function host(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).host.replace(/^www\./, '')
  }
  catch {
    return null
  }
}

function lastSegment(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).pathname.split('/').filter(Boolean).at(-1) ?? null
  }
  catch {
    return null
  }
}

export async function loadSignature(): Promise<Signature> {
  const [about, contact] = await Promise.all([docValues('about'), docValues('contact')])
  const website = contact.get('website') ?? null
  return {
    name: about.get('display_name') ?? about.get('name') ?? null,
    website,
    site: host(website),
    handle: lastSegment(contact.get('github') ?? null),
  }
}

/** Nombre de archivo del CV: («Ana Pérez», 'Harvard_ATS') → «CV_Ana_Perez_Harvard_ATS». */
export function cvFileName(name: string | null, ...suffix: string[]): string {
  const stem = (name ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return ['CV', stem, ...suffix].filter(Boolean).join('_')
}
