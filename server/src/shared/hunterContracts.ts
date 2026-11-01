/**
 * Contrato de /api/admin/hunter/* que comparten el servidor y el admin (el admin lo importa con
 * `import type`). Es la forma que responde el servidor, venga de Eros (normalizada en
 * server/src/admin/erosContract.ts) o del respaldo desde la base.
 */
import type { Locale, TechCategory } from '../../generated/prisma/enums.js'

/** De dónde salió una respuesta: Eros, el respaldo desde la base o la muestra de pruebas (EROS_DEMO). */
export type HunterSource = 'eros' | 'fallback' | 'demo'

export const hunterJobStatuses = ['new', 'evaluated', 'saved', 'applied', 'discarded'] as const
export type HunterJobStatus = (typeof hunterJobStatuses)[number]

export function isHunterJobStatus(value: unknown): value is HunterJobStatus {
  return typeof value === 'string' && (hunterJobStatuses as readonly string[]).includes(value)
}

/** Lo que el admin manda de una vacante para analizarla, escribir el mensaje o adaptar el CV sin Eros. */
export interface JobInput {
  title: string
  company: string
  description: string
  tags: string[]
  url: string
  contact_email: string | null
}

/** Una vacante de la cola. `match_analysis` es el MatchAnalysis serializado (o null sin evaluar). */
export interface HunterJob {
  id: string
  source: string
  external_id: string
  title: string
  company: string
  url: string
  description: string
  tags: string[]
  salary: string | null
  country: string | null
  is_remote: boolean
  published_at: string | null
  found_at: string | null
  status: HunterJobStatus
  match_score: number | null
  match_analysis: string | null
  connection_note: string | null
  hiring_manager_name: string | null
  hiring_manager_title: string | null
  contact_email: string | null
  pitch_draft: string | null
  /** Afinidad de la búsqueda por afinidad (0–100); null fuera de esa búsqueda. */
  semantic_score: number | null
  _source?: HunterSource
  /** Solo en la muestra de EROS_DEMO. */
  demo?: true
}

export type MatchVerdict = 'EXCELENTE_MATCH' | 'BUEN_MATCH' | 'REGULAR' | 'DESCARTAR'

export interface MatchAnalysis {
  score: number
  verdict: MatchVerdict
  summary: string
  pros: string[]
  cons: string[]
  missing_skills: string[]
  matching_projects: string[]
  salary_estimate: string | null
  recruiter_note: string
  hiring_manager_name: string | null
  hiring_manager_title: string | null
  hiring_manager_url: string | null
}

export interface HunterStats {
  total: number
  high_match_count: number
  pending_eval_count: number
  applied_count: number
  discarded_count: number
}

/** POST /hunter/scan. `vectorized` es lo que indexó la vectorización que corre al terminar (null si falló). */
export interface ScanResult {
  scanned: number
  new_jobs: number
  evaluated_count: number | null
  vectorized: number | null
}

export interface BatchEvaluation {
  evaluated_count: number
  evaluated: { id: string, title: string, score: number, verdict: MatchVerdict }[]
}

/** POST /hunter/jobs/:id/evaluate. */
export interface JobEvaluation {
  ok: true
  job: HunterJob
  match: MatchAnalysis | null
}

/** POST /hunter/jobs/:id/pitch → { data: Pitch }. El idioma lo decide el servidor. */
export interface Pitch {
  lang: Locale
  subject: string
  elevator_pitch: string
  cover_letter: string
  connection_note: string
}

export interface ApplyPreview {
  to_email: string | null
  contact_email: string | null
  subject: string
  body: string
  channel: string
}

/** POST /jobs/:id/find-email. `confidence` es la de Eros (0–100); sin Eros, null. */
export interface FoundEmail {
  email: string | null
  domain: string | null
  confidence: number | null
  sources: string[]
}

export interface ApplyEmailResult {
  ok: boolean
  dispatched_to: string | null
  provider: string | null
  applied_at: string | null
}

export interface JobChange {
  ok: true
  job: HunterJob | null
}

export interface SemanticResults {
  results: HunterJob[]
}

export interface VectorizeResult { vectorized_count: number }
export interface PurgeResult { purged_count: number }

// ─── CV ─────────────────────────────────────────────────────────────────────

export interface AdminCvEntry {
  title: string
  role: string
  period: string
  location: string
  bullets: string[]
}

export interface AdminCvEducation {
  degree: string
  institution: string | null
  period: string
  location: string | null
  details: string | null
}

/** El CV adaptado: siempre compuesto desde la base (GET /api/cv); Eros solo aporta el orden. */
export interface AdminCv {
  lang: Locale
  name: string | null
  title: string | null
  location: string | null
  email: string | null
  portfolio: string | null
  github: string | null
  linkedin: string | null
  summary: string | null
  /** Rótulo de categoría → tecnologías, en el orden de la adaptación. */
  skills: Record<string, string[]>
  experience: AdminCvEntry[]
  education: AdminCvEducation[]
  languages: string[]
  methodologies: string | null
}

/** Una pista de Eros que no se pudo llevar a la base y quedó fuera del CV. */
export interface CvDiscard {
  kind: 'category' | 'tech' | 'entry' | 'bullet'
  value: string
}

/** Qué tomó el CV de las pistas: categorías y entradas en su orden, viñetas emparejadas y lo descartado. */
/**
 * Qué se hizo con el resumen que propuso Eros. 'ok': se puede aceptar. El resto no entra al CV
 * aunque se pida, porque correría la hoja fuera de la cota dual (248-265 mm, una página A4) o
 * estaría en otro idioma: 'too_long', 'too_short', 'other_lang'. null: Eros no propuso ninguno.
 */
export type ProposalVerdict = 'ok' | 'too_long' | 'too_short' | 'other_lang'

export interface CvAdaptation {
  categories: TechCategory[]
  entries: string[]
  bullets: number
  discarded: CvDiscard[]
  proposal: ProposalVerdict | null
}

/**
 * POST /hunter/cv/:id. `summaryProposal` es el resumen que propone Eros (null sin Eros): el CV lleva
 * el de la base salvo que el pedido traiga `useSummaryProposal: true`.
 */
export interface TailoredCv {
  data: AdminCv
  summaryProposal: string | null
  usesSummaryProposal: boolean
  _adaptation: CvAdaptation
  _source: HunterSource
}

/** El 409 de /cv/:id/html y /cv/:id/txt cuando la API ya no tiene el CV de esa vacante. */
export const CV_EXPIRED = 'cv_expired'

/** Lo que /cv-base/html?measure=1 manda a la ventana que lo contiene. */
export interface CvMeasure {
  type: 'cv-measure'
  heightMm: number
  pages: number
}
