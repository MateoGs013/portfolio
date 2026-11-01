/**
 * Las vacantes nuevas y compatibles de la cola de Vacantes (features/hunter/store.ts): estado nueva y
 * puntaje desde 65, la misma cuenta que el contador de Búsqueda laboral en la navegación.
 */
import type { HunterJob } from '@shared/hunterContracts'
import { computed } from 'vue'
import { COMPATIBLE_SCORE, scoreOf } from '../hunter/model'
import { allJobs, queuePhase } from '../hunter/store'

export interface FreshJob { job: HunterJob, score: number }

export const freshJobs = computed<FreshJob[]>(() => allJobs.value
  .map(job => ({ job, score: scoreOf(job) ?? 0 }))
  .filter(({ job, score }) => job.status === 'new' && score >= COMPATIBLE_SCORE))

/** La cifra del resumen: solo cuando Eros respondió (sin Eros no se sabe cuántas hay). */
export const freshCount = computed(() => (queuePhase.value === 'ready' ? freshJobs.value.length : null))

/** Eros no respondió al pedir la cola. */
export const erosDown = computed(() => queuePhase.value === 'offline' || queuePhase.value === 'error')
