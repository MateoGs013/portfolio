/**
 * Lo que Vacantes guarda en sessionStorage (dura lo que dura la pestaña):
 * - la última cola que respondió Eros, para mostrarla en solo lectura si Eros se cae. Nunca guarda
 *   filas de la muestra ni del respaldo: solo lo que de verdad está en Eros.
 * - las vacantes pegadas a mano (manual-<hash>), que no existen en ningún otro lado.
 * Sin sessionStorage (modo privado estricto) todo sigue andando en memoria.
 */
import type { HunterJob, HunterJobStatus } from '@shared/hunterContracts'
import { isSample } from './model'

const QUEUE_KEY = 'adm-hunter-queue'
const MANUAL_KEY = 'adm-hunter-manual'

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : null
  }
  catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  }
  catch {
    // Sin almacenamiento: queda en memoria hasta recargar.
  }
}

export interface CachedQueue {
  /** ISO de la última respuesta buena de Eros. */
  at: string
  jobs: HunterJob[]
}

const isJob = (value: unknown): value is HunterJob =>
  !!value && typeof value === 'object' && typeof (value as HunterJob).id === 'string' && typeof (value as HunterJob).title === 'string'

export function readQueue(): CachedQueue | null {
  const cached = read<CachedQueue>(QUEUE_KEY)
  if (!cached || typeof cached.at !== 'string' || !Array.isArray(cached.jobs)) return null
  return { at: cached.at, jobs: cached.jobs.filter(isJob).filter(job => !isSample(job) && job._source !== 'fallback') }
}

/** Guarda la cola de Eros; si la respuesta era la muestra o el respaldo, no guarda nada. */
export function writeQueue(jobs: readonly HunterJob[], at = new Date().toISOString()): boolean {
  if (jobs.some(job => isSample(job) || job._source === 'fallback')) return false
  write(QUEUE_KEY, { at, jobs })
  return true
}

export function readManual(): HunterJob[] {
  const list = read<unknown[]>(MANUAL_KEY)
  return Array.isArray(list) ? list.filter(isJob).filter(job => job.id.startsWith('manual-')) : []
}

export function writeManual(jobs: readonly HunterJob[]): void {
  write(MANUAL_KEY, jobs)
}

/** Un hash corto y estable del texto: la misma vacante pegada dos veces es la misma. */
function hash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

export interface ManualInput {
  title: string
  company: string
  description: string
  contactEmail: string
  url: string
}

/** Una vacante local con la forma de las de Eros, para que pase por las mismas etapas. */
export function manualJob(input: ManualInput, now = new Date()): HunterJob {
  const title = input.title.trim()
  const company = input.company.trim()
  const description = input.description.trim()
  const status: HunterJobStatus = 'new'
  return {
    id: `manual-${hash(`${title}\n${company}\n${description}`)}`,
    source: 'manual',
    external_id: '',
    title,
    company,
    url: input.url.trim(),
    description,
    tags: [],
    salary: null,
    country: null,
    is_remote: /\bremot[eo]\b/i.test(description),
    published_at: null,
    found_at: now.toISOString(),
    status,
    match_score: null,
    match_analysis: null,
    connection_note: null,
    hiring_manager_name: null,
    hiring_manager_title: null,
    contact_email: input.contactEmail.trim() || null,
    pitch_draft: null,
    semantic_score: null,
    estimated: false,
  }
}
