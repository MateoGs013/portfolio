/**
 * Contrato con Eros: cada respuesta que usa el admin pasa por su normalizador y sale con la forma de
 * server/src/shared/hunterContracts.ts, con los nombres unificados (`scanned`, `new_jobs`) y sin
 * depender de si Eros envuelve en `data`. Lo que no trae, va en null: nunca un valor inventado.
 */
import type { Locale } from '../../generated/prisma/enums.js'
import {
  isHunterJobStatus,
  type BatchEvaluation,
  type HunterJob,
  type HunterStats,
  type JobChange,
  type JobEvaluation,
  type JobInput,
  type MatchAnalysis,
  type MatchVerdict,
  type Pitch,
  type PurgeResult,
  type ScanResult,
  type SemanticResults,
  type VectorizeResult,
} from '../shared/hunterContracts.js'

export type * from '../shared/hunterContracts.js'

type Obj = Record<string, unknown>

const isObj = (value: unknown): value is Obj => typeof value === 'object' && value !== null && !Array.isArray(value)

/** El objeto de la respuesta, abriendo un envoltorio `data` si lo hay. */
export function unwrap(payload: unknown): Obj {
  if (!isObj(payload)) return {}
  return isObj(payload['data']) ? { ...payload, ...payload['data'] } : payload
}

export function text(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

export function count(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

export function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(text).filter((v): v is string => v !== null)
  if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean)
  return []
}

/** El primer valor numérico entre varias claves posibles. */
function first(obj: Obj, ...keys: string[]): number | null {
  for (const key of keys) {
    const n = count(obj[key])
    if (n !== null) return n
  }
  return null
}

// ─── Vacantes ───────────────────────────────────────────────────────────────

/** Eros puntuó sin Gemini, por palabras clave: `scored_by: 'heuristic'` en la vacante o en el análisis. */
function heuristic(...sources: unknown[]): boolean {
  return sources.some(src => isObj(src) && text(src['scored_by'])?.toLowerCase() === 'heuristic')
}

/** La afinidad llega como similitud (0–1) o como porcentaje: sale siempre en 0–100. */
function percent(score: number | null): number | null {
  if (score === null) return null
  return Math.round((score <= 1 ? score * 100 : score) * 10) / 10
}

export function normalizeJob(raw: unknown): HunterJob | null {
  if (!isObj(raw)) return null
  const id = text(raw['id']) ?? text(raw['external_id'])
  if (!id) return null
  const analysis = raw['match_analysis']
  const parsed = isObj(analysis) ? analysis : typeof analysis === 'string' ? safeJson(analysis) : null
  return {
    id,
    source: text(raw['source']) ?? 'eros',
    external_id: text(raw['external_id']) ?? id,
    title: text(raw['title']) ?? '',
    company: text(raw['company']) ?? '',
    url: text(raw['url']) ?? '',
    description: text(raw['description']) ?? '',
    tags: list(raw['tags']),
    salary: text(raw['salary']),
    country: text(raw['country']),
    is_remote: raw['is_remote'] === true || raw['is_remote'] === 1 || raw['is_remote'] === '1',
    published_at: text(raw['published_at']),
    found_at: text(raw['found_at']),
    status: isHunterJobStatus(raw['status']) ? raw['status'] : 'new',
    match_score: count(raw['match_score']),
    match_analysis: isObj(analysis) ? JSON.stringify(analysis) : text(analysis),
    connection_note: text(raw['connection_note']),
    hiring_manager_name: text(raw['hiring_manager_name']),
    hiring_manager_title: text(raw['hiring_manager_title']),
    contact_email: text(raw['contact_email']),
    pitch_draft: text(raw['pitch_draft']),
    semantic_score: percent(count(raw['semantic_score'])),
    estimated: heuristic(raw, parsed),
    _source: 'eros',
  }
}

/** Una lista de vacantes: el arreglo suelto o dentro de `data`, `jobs` o `results`. */
export function normalizeJobs(payload: unknown): HunterJob[] {
  const raw = Array.isArray(payload)
    ? payload
    : isObj(payload) ? [payload['data'], payload['jobs'], payload['results']].find(Array.isArray) ?? [] : []
  return raw.map(normalizeJob).filter((j): j is HunterJob => j !== null)
}

export function normalizeStats(payload: unknown): HunterStats {
  const o = unwrap(payload)
  return {
    total: first(o, 'total', 'total_jobs') ?? 0,
    high_match_count: first(o, 'high_match_count', 'high_match') ?? 0,
    pending_eval_count: first(o, 'pending_eval_count', 'pending') ?? 0,
    applied_count: first(o, 'applied_count', 'applied') ?? 0,
    discarded_count: first(o, 'discarded_count', 'discarded') ?? 0,
  }
}

export function normalizeScan(payload: unknown, vectorized: number | null): ScanResult {
  const o = unwrap(payload)
  return {
    scanned: first(o, 'scanned', 'scanned_count') ?? 0,
    new_jobs: first(o, 'new_jobs', 'new_jobs_count') ?? 0,
    evaluated_count: first(o, 'evaluated_count'),
    vectorized,
  }
}

const verdicts: readonly MatchVerdict[] = ['EXCELENTE_MATCH', 'BUEN_MATCH', 'REGULAR', 'DESCARTAR']
const verdictOf = (value: unknown): MatchVerdict | null => (verdicts as readonly unknown[]).includes(value) ? value as MatchVerdict : null

export function normalizeBatchEvaluation(payload: unknown): BatchEvaluation {
  const o = unwrap(payload)
  const evaluated = (Array.isArray(o['evaluated']) ? o['evaluated'] : []).flatMap((row) => {
    if (!isObj(row)) return []
    const id = text(row['id'])
    const score = count(row['score'])
    const verdict = verdictOf(row['verdict'])
    return id && score !== null && verdict ? [{ id, title: text(row['title']) ?? '', score, verdict }] : []
  })
  return { evaluated_count: first(o, 'evaluated_count') ?? evaluated.length, evaluated }
}

export function normalizeMatch(raw: unknown): MatchAnalysis | null {
  const o = isObj(raw) ? raw : typeof raw === 'string' ? safeJson(raw) : null
  if (!o) return null
  const score = count(o['score'])
  const verdict = verdictOf(o['verdict'])
  if (score === null || !verdict) return null
  return {
    score,
    verdict,
    summary: text(o['summary']) ?? '',
    pros: list(o['pros']),
    cons: list(o['cons']),
    missing_skills: list(o['missing_skills']),
    matching_projects: list(o['matching_projects']),
    salary_estimate: text(o['salary_estimate']),
    recruiter_note: text(o['recruiter_note']) ?? '',
    hiring_manager_name: text(o['hiring_manager_name']),
    hiring_manager_title: text(o['hiring_manager_title']),
    hiring_manager_url: text(o['hiring_manager_url']),
    estimated: heuristic(o),
  }
}

function safeJson(raw: string): Obj | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    return isObj(parsed) ? parsed : null
  }
  catch {
    return null
  }
}

// ─── La vacante que manda el admin ──────────────────────────────────────────

/**
 * `req.body.job` validado: título o descripción con texto. Sin eso no hay qué analizar y la ruta
 * responde 400 («Falta la descripción de la vacante»).
 */
export function jobFromBody(body: unknown): JobInput | null {
  const raw = isObj(body) ? body['job'] : null
  if (!isObj(raw)) return null
  const job: JobInput = {
    title: text(raw['title']) ?? '',
    company: text(raw['company']) ?? '',
    description: text(raw['description']) ?? '',
    tags: list(raw['tags']),
    url: text(raw['url']) ?? '',
    contact_email: text(raw['contact_email']),
  }
  return job.title || job.description ? job : null
}

/** El 400 de analizar, el mensaje y el CV cuando no hay vacante en el cuerpo ni en la muestra. */
export const missingJob = {
  error: 'Falta la descripción de la vacante.',
  code: 'invalid',
  errors: [{ path: 'job.description', message: 'Pegá la descripción de la vacante, o al menos su título.' }],
}

/** Una vacante pegada a mano: Eros no la conoce y nunca se le pregunta por ella. */
export const isManualJob = (id: string) => id.startsWith('manual-')

/** El 400 de lo que solo Eros hace (estado, borrar, contacto, enviar) pedido para una vacante manual-*. */
export const manualJobRefusal = {
  error: 'Una vacante pegada a mano vive solo en el admin: Eros no la conoce, así que esto se hace desde ahí.',
  code: 'invalid',
  errors: [],
}

// ─── Resto de las respuestas ────────────────────────────────────────────────

export function normalizeEvaluation(payload: unknown): JobEvaluation | null {
  const o = unwrap(payload)
  const job = normalizeJob(o['job']) ?? normalizeJob(o)
  if (!job) return null
  const match = normalizeMatch(o['match']) ?? normalizeMatch(job.match_analysis)
  // Eros marca la estimación en la vacante o en el análisis: las dos dicen lo mismo.
  const estimated = job.estimated || !!match?.estimated
  return { ok: true, job: { ...job, estimated }, match: match ? { ...match, estimated } : null }
}

/** El pitch de Eros en el idioma que decidió el servidor; null si no trae texto. */
export function normalizePitch(payload: unknown, lang: Locale): Pitch | null {
  const o = unwrap(isObj(payload) && isObj(payload['pitch']) ? payload['pitch'] : payload)
  const pitch: Pitch = {
    lang,
    subject: text(o['subject_or_hook']) ?? text(o['subject']) ?? '',
    elevator_pitch: text(o['elevator_pitch']) ?? '',
    cover_letter: text(o['cover_letter']) ?? '',
    connection_note: text(o['connection_note']) ?? '',
  }
  return pitch.subject || pitch.elevator_pitch || pitch.cover_letter ? pitch : null
}

/** Eros responde `{ ok, job_id, new_status }` (estado) o `{ ok, job_id, contact_email }` (contacto). */
export function normalizeJobChange(payload: unknown): JobChange {
  const o = unwrap(payload)
  const job = normalizeJob(o['job'])
  const status = o['new_status'] ?? o['status']
  return {
    ok: true,
    job,
    status: isHunterJobStatus(status) ? status : job?.status ?? null,
    contact_email: text(o['contact_email']) ?? job?.contact_email ?? null,
  }
}

export const normalizeSemantic = (payload: unknown): SemanticResults => ({ results: normalizeJobs(payload) })
export const normalizeVectorize = (payload: unknown): VectorizeResult => ({ vectorized_count: first(unwrap(payload), 'vectorized_count', 'vectorized') ?? 0 })
export const normalizePurge = (payload: unknown): PurgeResult => ({ purged_count: first(unwrap(payload), 'purged_count', 'purged') ?? 0 })
