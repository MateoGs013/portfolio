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
  /**
   * El puntaje es una estimación sin Gemini: Eros no pudo usar el modelo y lo calculó por palabras
   * clave (`scored_by: 'heuristic'`). Se rotula así, nunca como un análisis de Eros.
   */
  estimated: boolean
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
  /** Estimación sin Gemini (`scored_by: 'heuristic'` en Eros). */
  estimated: boolean
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

/**
 * De dónde salió el correo de contacto, para decirlo en pantalla: del aviso, de la web de la empresa
 * (Hunter.io), adivinado con el dominio de la empresa (`jobs@empresa.com`), o no se sabe (el contacto
 * guardado en la vacante que no figura en el aviso). Ninguno está verificado: un correo adivinado
 * se marca como tal y nunca como verificado.
 */
export const emailOrigins = ['posting', 'company_site', 'guessed', 'unknown'] as const
export type EmailOrigin = (typeof emailOrigins)[number]

/**
 * POST /jobs/:id/apply-preview. `email_origin` sale de `is_email_extracted` de Eros (o, sin Eros, de
 * si el aviso trae el correo): 'posting' si figura en el aviso, 'unknown' si no; null sin correo.
 * `contact_email_verified` de Eros no se lee: Eros lo calcula como lo contrario de `is_email_extracted`,
 * así que da «verificado» justo a los que no salen del aviso.
 */
export interface ApplyPreview {
  to_email: string | null
  contact_email: string | null
  subject: string
  body: string
  channel: string
  email_origin: EmailOrigin | null
}

/**
 * POST /jobs/:id/find-email. Eros responde `{ contact_email, source, found }`: `source` es su código
 * (description, hunter_io, domain_guessing, mx_inference; null si no encontró) y `origin` lo mismo en
 * las cuatro categorías de arriba. `found` es false cuando Eros no encontró uno nuevo (puede volver
 * el que ya tenía la vacante, con origen 'unknown').
 */
export interface FoundEmail {
  email: string | null
  found: boolean
  origin: EmailOrigin | null
  source: string | null
}

export interface ApplyEmailResult {
  ok: boolean
  dispatched_to: string | null
  provider: string | null
  applied_at: string | null
}

/**
 * PATCH /jobs/:id/status y /contact-email. Eros responde `{ ok, job_id, new_status }` o
 * `{ ok, job_id, contact_email }`, sin la vacante: `job` queda en null y el cambio va en su campo.
 */
export interface JobChange {
  ok: true
  job: HunterJob | null
  status: HunterJobStatus | null
  contact_email: string | null
}

/**
 * «Enviar desde Eros» está apagado: Eros adjunta su propio CV (escrito a mano en Eros, no el de la
 * base) y marca como verificados correos adivinados. Hasta que Eros adjunte el CV armado desde la
 * base, la postulación sale desde Gmail y se marca con «Ya la envié». Con true vuelven el botón y la
 * ruta POST /hunter/jobs/:id/apply-email (que hoy responde 409 `send_disabled`).
 */
export const EROS_SEND_ENABLED = false as boolean

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
