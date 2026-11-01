/**
 * Lo que se lee de una vacante sin pedir nada: su estado y su veredicto en palabras, el análisis y el
 * mensaje guardados, la vacante para el cuerpo de cada pedido y los filtros de la cola. Todo puro.
 */
import type { HunterJob, HunterJobStatus, JobInput, MatchAnalysis, Pitch } from '@shared/hunterContracts'
import type { StatusTone } from '../../ui/StatusDot.vue'
import { hunter } from './dict'

export type Stage = 'analisis' | 'mensaje' | 'cv' | 'postular'
export const STAGES: readonly Stage[] = ['analisis', 'mensaje', 'cv', 'postular']

export function isStage(value: unknown): value is Stage {
  return typeof value === 'string' && (STAGES as readonly string[]).includes(value)
}

/** Una vacante pegada a mano: vive en esta sesión y nunca va a Eros. */
export const isManual = (job: Pick<HunterJob, 'id'>) => job.id.startsWith('manual-')
/** La muestra ficticia de EROS_DEMO: se puede analizar y adaptar, no cambiar. */
export const isSample = (job: Pick<HunterJob, 'demo' | '_source'>) => job.demo === true || job._source === 'demo'

const STATUS_TONE: Record<HunterJobStatus, StatusTone> = {
  new: 'sig',
  evaluated: 'neutral',
  saved: 'wip',
  applied: 'ok',
  discarded: 'neutral',
}

/** El único estado visible de una vacante: punto y palabra. */
export function statusOf(job: Pick<HunterJob, 'status'>): { tone: StatusTone, label: string } {
  return { tone: STATUS_TONE[job.status], label: hunter.status[job.status] }
}

export type VerdictKey = keyof typeof hunter.verdict

/**
 * El veredicto en palabras sale del puntaje, con los mismos cortes que el respaldo del servidor
 * (hunterHeuristics.ts): 82, 65 y 45. Así Eros y la base se leen igual.
 */
export function verdictOf(score: number): { key: VerdictKey, label: string, tone: StatusTone } {
  const key: VerdictKey = score >= 82 ? 'great' : score >= 65 ? 'good' : score >= 45 ? 'doubtful' : 'discard'
  const tone: StatusTone = key === 'discard' ? 'neutral' : key === 'doubtful' ? 'wip' : 'ok'
  return { key, label: hunter.verdict[key], tone }
}

export const COMPATIBLE_SCORE = 65

export function scoreOf(job: Pick<HunterJob, 'match_score'>): number | null {
  return typeof job.match_score === 'number' ? Math.round(job.match_score) : null
}

function parse(raw: unknown): Record<string, unknown> | null {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>
  if (typeof raw !== 'string' || !raw.trim()) return null
  try {
    const value: unknown = JSON.parse(raw)
    return value && typeof value === 'object' ? value as Record<string, unknown> : null
  }
  catch {
    return null
  }
}

const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [])
const text = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null)

/** El análisis guardado en la vacante (match_analysis serializado), o null si no tiene. */
export function analysisOf(job: HunterJob): MatchAnalysis | null {
  const raw = parse(job.match_analysis)
  if (!raw || typeof raw['score'] !== 'number') return null
  return {
    score: raw['score'],
    verdict: raw['verdict'] as MatchAnalysis['verdict'],
    summary: text(raw['summary']) ?? '',
    pros: strings(raw['pros']),
    cons: strings(raw['cons']),
    missing_skills: strings(raw['missing_skills']),
    matching_projects: strings(raw['matching_projects']),
    salary_estimate: text(raw['salary_estimate']),
    recruiter_note: text(raw['recruiter_note']) ?? '',
    hiring_manager_name: text(raw['hiring_manager_name']),
    hiring_manager_title: text(raw['hiring_manager_title']),
    hiring_manager_url: text(raw['hiring_manager_url']),
  }
}

/** El borrador del mensaje que Eros dejó en la vacante (pitch_draft), si trae algo usable. */
export function pitchDraftOf(job: HunterJob): Omit<Pitch, 'lang'> | null {
  const raw = parse(job.pitch_draft)
  if (!raw) return null
  const pitch = {
    subject: text(raw['subject']) ?? text(raw['subject_or_hook']) ?? '',
    elevator_pitch: text(raw['elevator_pitch']) ?? '',
    cover_letter: text(raw['cover_letter']) ?? '',
    connection_note: text(raw['connection_note']) ?? job.connection_note ?? '',
  }
  return pitch.elevator_pitch || pitch.cover_letter ? pitch : null
}

/** La vacante tal como la piden analizar, el mensaje y el CV en el cuerpo: { job }. */
export function jobInput(job: HunterJob): { job: JobInput } {
  return {
    job: {
      title: job.title,
      company: job.company,
      description: job.description,
      tags: job.tags,
      url: job.url,
      contact_email: job.contact_email,
    },
  }
}

/** «Remoto · Argentina · Get on Board». */
export function placeOf(job: HunterJob): string {
  const portal = isManual(job) ? hunter.manualTag : isSample(job) ? hunter.sampleTag : job.source
  return [job.is_remote ? hunter.remote : null, job.country, portal].filter(Boolean).join(' · ')
}

/* ── Filtros de la cola ─────────────────────────────────── */

export type QueueFilter = 'revisar' | 'compatibles' | 'postuladas' | 'descartadas' | 'todas'

export const QUEUE_FILTERS: readonly { id: QueueFilter, label: string, test: (job: HunterJob) => boolean }[] = [
  { id: 'revisar', label: hunter.filters.review, test: j => j.status === 'new' || j.status === 'evaluated' || j.status === 'saved' },
  {
    id: 'compatibles',
    label: hunter.filters.compatible,
    test: j => (scoreOf(j) ?? 0) >= COMPATIBLE_SCORE && j.status !== 'discarded' && j.status !== 'applied',
  },
  { id: 'postuladas', label: hunter.filters.applied, test: j => j.status === 'applied' },
  { id: 'descartadas', label: hunter.filters.discarded, test: j => j.status === 'discarded' },
  { id: 'todas', label: hunter.filters.all, test: () => true },
]

export const DEFAULT_FILTER: QueueFilter = 'revisar'

export function isQueueFilter(value: unknown): value is QueueFilter {
  return QUEUE_FILTERS.some(f => f.id === value)
}

export function filterTest(id: QueueFilter): (job: HunterJob) => boolean {
  return (QUEUE_FILTERS.find(f => f.id === id) ?? QUEUE_FILTERS[0]!).test
}

const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Búsqueda de texto en la cola: todas las palabras en título, empresa, etiquetas o portal. */
export function matchesText(job: HunterJob, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const haystack = normalize([job.title, job.company, job.source, job.country ?? '', ...job.tags].join(' '))
  return words.every(word => haystack.includes(word))
}

/** Más compatibles primero; sin evaluar, por fecha; las pegadas a mano arriba de todo. */
export function byPriority(a: HunterJob, b: HunterJob): number {
  const manual = Number(isManual(b)) - Number(isManual(a))
  if (manual) return manual
  const score = (scoreOf(b) ?? -1) - (scoreOf(a) ?? -1)
  if (score) return score
  return (b.found_at ?? '').localeCompare(a.found_at ?? '')
}
