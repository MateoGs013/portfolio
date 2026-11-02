/**
 * La cola de vacantes, una sola copia para Vacantes y la paleta:
 * - GET /hunter/jobs y /stats. Si Eros no responde, la última cola de la sesión en solo lectura, con
 *   la hora de la última sincronización; nunca se guardan filas de la muestra.
 * - las vacantes pegadas a mano, que viven en la sesión y pasan por las mismas etapas.
 * - el estado y el borrado: en Eros para las suyas, acá para las pegadas.
 * Vive a nivel de módulo: salir de Vacantes y volver no vuelve a pedir nada si la cola es reciente.
 */
import type { HunterJob, HunterJobStatus, HunterStats } from '@shared/hunterContracts'
import { computed, readonly, ref, shallowRef, watch } from 'vue'
import { ApiError, isAbort, messageOf } from '../../api/errors'
import { setNavPending } from '../../shell/nav'
import { hunterApi, isErosDown } from './adapter'
import { manualJob, readManual, readQueue, writeManual, writeQueue, type ManualInput } from './cache'
import { byPriority, COMPATIBLE_SCORE, DEFAULT_FILTER, isManual, isSample, scoreOf, type QueueFilter } from './model'

export type QueuePhase = 'idle' | 'loading' | 'ready' | 'offline' | 'error'

const FRESH_MS = 60_000

const remote = shallowRef<HunterJob[]>([])
const manual = shallowRef<HunterJob[]>(readManual())
const phase = ref<QueuePhase>('idle')
const loadError = shallowRef<ApiError | null>(null)
const syncedAt = ref<string | null>(null)
const stats = shallowRef<HunterStats | null>(null)
let loadedAt = 0
let inflight: Promise<void> | null = null
const fetching = ref(false)

export const queuePhase = readonly(phase)
/** Hay un pedido de la cola en curso (también al reintentar en solo lectura). */
export const queueFetching = readonly(fetching)
export const queueError = readonly(loadError)
export const queueStats = readonly(stats)
/** Hora de la última respuesta buena de Eros (la de la caché, si se está en solo lectura). */
export const lastSync = readonly(syncedAt)

/** La cola entera: las pegadas primero y después las de Eros, por compatibilidad. */
export const allJobs = computed<HunterJob[]>(() => {
  const ids = new Set(manual.value.map(job => job.id))
  return [...manual.value, ...remote.value.filter(job => !ids.has(job.id))].sort(byPriority)
})

/** La cola salió de la muestra ficticia (EROS_DEMO). */
export const isSampleQueue = computed(() => remote.value.some(isSample))
export const offline = computed(() => phase.value === 'offline')

/** Lo último que se eligió en la lista, para volver a ella con la misma vacante marcada. */
export const lastOpened = ref<string | null>(null)
export const lastFilter = ref<QueueFilter>(DEFAULT_FILTER)

export function findJob(id: string): HunterJob | null {
  return allJobs.value.find(job => job.id === id) ?? null
}

/** Se puede cambiar (estado, borrar, contacto): las pegadas siempre; las de Eros, con Eros arriba. */
export function canChange(job: HunterJob): boolean {
  if (isManual(job)) return true
  return !isSample(job) && phase.value !== 'offline'
}

async function fetchQueue(): Promise<void> {
  try {
    const [jobs, numbers] = await Promise.all([hunterApi.jobs(), hunterApi.stats().catch(() => null)])
    remote.value = Array.isArray(jobs) ? jobs : []
    stats.value = numbers
    loadError.value = null
    loadedAt = Date.now()
    const at = new Date().toISOString()
    if (writeQueue(remote.value, at)) syncedAt.value = at
    phase.value = 'ready'
  }
  catch (err) {
    if (isAbort(err)) return
    if (isErosDown(err)) {
      const cached = readQueue()
      remote.value = cached?.jobs ?? []
      syncedAt.value = cached?.at ?? null
      stats.value = null
      loadError.value = err instanceof ApiError ? err : null
      loadedAt = Date.now()
      phase.value = 'offline'
      return
    }
    loadError.value = err instanceof ApiError ? err : new ApiError(0, null, messageOf(err))
    phase.value = 'error'
  }
}

/** Pide la cola; con `force: false` no repite si la última es de hace menos de un minuto. */
export function loadQueue(force = true): Promise<void> {
  if (inflight) return inflight
  if (!force && phase.value !== 'idle' && phase.value !== 'error' && Date.now() - loadedAt < FRESH_MS) return Promise.resolve()
  if (phase.value === 'idle' || phase.value === 'error') phase.value = 'loading'
  fetching.value = true
  inflight = fetchQueue().finally(() => {
    inflight = null
    fetching.value = false
  })
  return inflight
}

/* ── Cambios ───────────────────────────────────────────── */

function saveManual(list: HunterJob[]): void {
  manual.value = list
  writeManual(list)
}

/** Reemplaza una vacante con lo que respondió el servidor (o lo que cambió acá). */
export function replaceJob(job: HunterJob): void {
  if (isManual(job)) {
    saveManual(manual.value.map(x => (x.id === job.id ? job : x)))
    return
  }
  remote.value = remote.value.map(x => (x.id === job.id ? { ...x, ...job } : x))
  if (phase.value === 'ready') writeQueue(remote.value)
}

/** Pega una vacante: si ya estaba (mismo título, empresa y texto) devuelve la que había. */
export function addManualJob(input: ManualInput): HunterJob {
  const job = manualJob(input)
  const existing = manual.value.find(x => x.id === job.id)
  if (existing) return existing
  saveManual([job, ...manual.value])
  return job
}

export async function changeStatus(job: HunterJob, status: HunterJobStatus): Promise<HunterJob> {
  if (isManual(job)) {
    const next = { ...job, status }
    replaceJob(next)
    return next
  }
  const result = await hunterApi.setStatus(job, status)
  const next = { ...job, ...(result.job ?? {}), status: result.status ?? result.job?.status ?? status }
  replaceJob(next)
  return next
}

export async function changeContact(job: HunterJob, email: string | null): Promise<HunterJob> {
  if (isManual(job)) {
    const next = { ...job, contact_email: email }
    replaceJob(next)
    return next
  }
  const result = await hunterApi.setContact(job, email)
  const next = { ...job, ...(result.job ?? {}), contact_email: result.contact_email ?? result.job?.contact_email ?? email }
  replaceJob(next)
  return next
}

export async function deleteJob(job: HunterJob): Promise<void> {
  if (isManual(job)) {
    saveManual(manual.value.filter(x => x.id !== job.id))
    return
  }
  await hunterApi.remove(job)
  remote.value = remote.value.filter(x => x.id !== job.id)
  if (phase.value === 'ready') writeQueue(remote.value)
}

/** Las nuevas y compatibles suman al contador de Búsqueda laboral en la navegación. */
watch(allJobs, (jobs) => {
  setNavPending('busqueda', jobs.filter(job => job.status === 'new' && (scoreOf(job) ?? 0) >= COMPATIBLE_SCORE).length)
}, { immediate: true })
