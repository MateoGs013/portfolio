/**
 * El CV Harvard ATS de una vacante: se compone en el servidor desde la base (Eros solo aporta el
 * orden) y queda en su caché una hora. De ahí salen la hoja, la impresión y el texto plano.
 *
 * Si la caché ya no lo tiene (la API se reinició o pasó la hora), la hoja y el texto responden 409
 * cv_expired: acá se vuelve a hacer POST /cv con la misma vacante y se repite el pedido una vez, sin
 * pedirle nada a quien está usando el panel. El CV rearmado reemplaza al de la etapa (work.cv): si
 * Eros cambió entre tanto, el resumen y la nota de adaptación dicen lo que la hoja nueva usa.
 */
import type { HunterJob, TailoredCv } from '@shared/hunterContracts'
import { api } from '../../api/client'
import { RequestError } from '../../api/errors'
import { jobInput } from './model'
import { workOf } from './work'

const CV_EXPIRED = 'cv_expired'

export interface CvRequest {
  /** El resumen que propuso Eros en lugar del de la base (solo si la propuesta es usable). */
  useSummaryProposal: boolean
  /** Preguntarle a Eros de nuevo en lugar de reusar las pistas que ya dio para esta vacante. */
  regenerate?: boolean
}

const base = (id: string) => `/hunter/cv/${encodeURIComponent(id)}`

export function generateCv(job: HunterJob, request: CvRequest): Promise<TailoredCv> {
  return api.post<TailoredCv>(base(job.id), {
    ...jobInput(job),
    useSummaryProposal: request.useSummaryProposal,
    ...(request.regenerate ? { regenerate: true } : {}),
  })
}

export function isCvExpired(err: unknown): boolean {
  return err instanceof RequestError && err.status === 409 && (err.code === CV_EXPIRED || err.code === null)
}

/** Lo que la etapa muestra del CV pasa a ser el rearmado: la hoja y su resumen no se contradicen. */
function adopt(job: HunterJob, tailored: TailoredCv): void {
  const work = workOf(job)
  if (!tailored.usesSummaryProposal) work.baseSummary = tailored.data.summary
  work.cv = tailored
}

/** Corre `read`; ante un 409 rearma el CV con la misma vacante, lo adopta y lo corre una vez más. */
async function withCv<T>(job: HunterJob, request: CvRequest, read: () => Promise<T>): Promise<T> {
  try {
    return await read()
  }
  catch (err) {
    if (!isCvExpired(err)) throw err
    adopt(job, await generateCv(job, { useSummaryProposal: request.useSummaryProposal }))
    return read()
  }
}

async function ticket(id: string): Promise<string> {
  const { ticket: value } = await api.post<{ ticket: string }>(`${base(id)}/ticket`)
  return value
}

/**
 * La dirección de la hoja con ticket (el iframe y la ventana de impresión no llevan la clave). Antes
 * se comprueba que la caché la tenga: así un 409 se resuelve acá y no aparece en la ventana.
 */
export async function sheetUrl(job: HunterJob, request: CvRequest, mode: 'measure' | 'print'): Promise<string> {
  await withCv(job, request, () => api.get<string>(`${base(job.id)}/html`))
  const params = new URLSearchParams({ ticket: await ticket(job.id) })
  if (mode === 'measure') params.set('measure', '1')
  else params.set('auto_print', 'true')
  return `/api/admin${base(job.id)}/html?${params.toString()}`
}

/** El mismo CV en texto plano para un formulario ATS, tal cual lo arma el servidor. */
export async function cvText(job: HunterJob, request: CvRequest): Promise<string> {
  const text = await withCv(job, request, () => api.get<string>(`${base(job.id)}/txt`))
  return typeof text === 'string' ? text : String(text ?? '')
}
