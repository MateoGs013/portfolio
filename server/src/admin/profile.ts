/**
 * El candidato de los respaldos del admin (Job Hunter) sale de la base, por el
 * mismo camino que la API pública: base, última respuesta buena o content.json. Ningún dato del
 * candidato se escribe a mano en server/src/admin.
 */
import type { CvDocument } from '../content/cv.js'
import type { Lang } from '../content/lang.js'
import { resolve } from '../content/snapshot.js'
import { cvDocument } from '../routes/cv.js'
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

/** Nombre de archivo del CV: («Ana Pérez», 'Harvard_ATS') → «CV_Ana_Perez_Harvard_ATS». */
export function cvFileName(name: string | null, ...suffix: string[]): string {
  const stem = (name ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return ['CV', stem, ...suffix].filter(Boolean).join('_')
}
