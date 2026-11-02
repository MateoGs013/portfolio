/**
 * Los pedidos de Vacantes a /api/admin/hunter/*, con el contrato de @shared/hunterContracts. Todo lo
 * que necesita la vacante (analizar, el mensaje, la vista previa, el correo) la manda entera en el
 * cuerpo: así anda con Eros caído y con las vacantes pegadas a mano.
 */
import type {
  ApplyEmailResult,
  ApplyPreview,
  BatchEvaluation,
  FoundEmail,
  HunterJob,
  HunterJobStatus,
  HunterStats,
  JobChange,
  JobEvaluation,
  Pitch,
  PurgeResult,
  ScanResult,
  SemanticResults,
  VectorizeResult,
} from '@shared/hunterContracts'
import { api, type RequestOptions } from '../../api/client'
import { ApiError, NetworkError, RequestError, ServiceError } from '../../api/errors'
import { jobInput } from './model'

/**
 * De dónde salió lo que se muestra: Eros, el respaldo desde la base, la muestra de pruebas o una
 * estimación de Eros sin Gemini (`estimated`), que nunca se rotula como «de Eros».
 */
export type Origin = 'eros' | 'fallback' | 'demo' | 'estimate'

export function originOf(body: { _source?: string } | null | undefined): Origin {
  return body?._source === 'fallback' ? 'fallback' : body?._source === 'demo' ? 'demo' : 'eros'
}

const path = (id: string, rest = '') => `/hunter/jobs/${encodeURIComponent(id)}${rest}`

/**
 * Escanear y evaluar en lote: el servidor espera a Eros 180 s (195 s con la vectorización del escaneo)
 * y el cliente un poco más, para leer su respuesta honesta en lugar de cortar primero.
 */
const LONG_TASK_TIMEOUT_MS = 210_000

export const hunterApi = {
  jobs: (options?: RequestOptions) => api.get<HunterJob[]>('/hunter/jobs', options),
  stats: (options?: RequestOptions) => api.get<HunterStats>('/hunter/stats', options),
  scan: () => api.post<ScanResult>('/hunter/scan', undefined, { timeoutMs: LONG_TASK_TIMEOUT_MS }),
  vectorize: () => api.post<VectorizeResult>('/hunter/vectorize', {}),
  evaluatePending: () => api.post<BatchEvaluation>('/hunter/evaluate', {}, { timeoutMs: LONG_TASK_TIMEOUT_MS }),
  purge: () => api.post<PurgeResult>('/hunter/purge'),
  semantic: (query: string) => api.post<SemanticResults>('/hunter/search/semantic', { query, limit: 30 }),

  evaluate: (job: HunterJob) => api.post<JobEvaluation & { _source?: string }>(path(job.id, '/evaluate'), jobInput(job)),
  pitch: (job: HunterJob) => api.post<{ data: Pitch, _source?: string }>(path(job.id, '/pitch'), jobInput(job)),
  setStatus: (job: HunterJob, status: HunterJobStatus) => api.patch<JobChange>(path(job.id, '/status'), { status }),
  remove: (job: HunterJob) => api.delete<{ ok: true }>(path(job.id)),

  applyPreview: (job: HunterJob) => api.post<ApplyPreview & { _source?: string }>(path(job.id, '/apply-preview'), jobInput(job)),
  findEmail: (job: HunterJob) => api.post<FoundEmail & { _source?: string }>(path(job.id, '/find-email'), jobInput(job)),
  setContact: (job: HunterJob, email: string | null) => api.patch<JobChange>(path(job.id, '/contact-email'), { contact_email: email }),
  applyEmail: (job: HunterJob, mail: { to_email: string, subject: string, body: string }) =>
    api.post<ApplyEmailResult>(path(job.id, '/apply-email'), { ...mail, channel: 'n8n', confirmed: true }),
}

/** Eros no respondió (o rechazó la clave): la cola se lee de la sesión y las escrituras no corren. */
export function isErosDown(err: unknown): boolean {
  if (err instanceof ServiceError) return err.service === 'eros'
  if (err instanceof NetworkError) return true
  return err instanceof RequestError && (err.code === 'eros_unreachable' || err.code === 'eros_auth' || err.code === 'offline')
}

/**
 * Una tarea larga (escanear, evaluar en lote) se cortó por tiempo, pero puede seguir en Eros: no es
 * una caída y no se dice «no se hizo».
 */
export function isStillWorking(err: unknown): boolean {
  if (err instanceof RequestError) return err.code === 'eros_busy'
  return err instanceof NetworkError && err.timedOut
}

/** El motivo y lo que no pasó: «Eros no responde ahora… No se buscaron vacantes nuevas.» */
export function failureText(err: unknown, consequence: string): string {
  const reason = err instanceof ApiError ? err.message : ''
  return isErosDown(err) ? `${reason} ${consequence}`.trim() : reason || consequence
}
