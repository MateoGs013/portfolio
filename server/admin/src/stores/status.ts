/**
 * Estado real de la base y de Eros (GET /api/admin/status), para la cabecera. Se pide cada 30 s y al
 * volver a la pestaña. La cabecera muestra algo solo si anda mal: `problem` es null cuando todo responde.
 */
import type { AdminStatus } from '@shared/adminContracts'
import { computed, readonly, ref, shallowRef } from 'vue'
import { api } from '../api/client'
import { isAbort, NetworkError, ServiceError } from '../api/errors'
import { shell } from '../shell/dict'

export const STATUS_INTERVAL_MS = 30_000

type Failure = 'offline' | 'admin' | null

const current = shallowRef<AdminStatus | null>(null)
const failure = ref<Failure>(null)
let controller: AbortController | null = null
let timer: ReturnType<typeof setInterval> | undefined

export const adminStatus = readonly(current)

export async function refreshStatus(): Promise<void> {
  controller?.abort()
  const own = new AbortController()
  controller = own
  try {
    current.value = await api.get<AdminStatus>('/status', { signal: own.signal })
    failure.value = null
  }
  catch (err) {
    if (isAbort(err)) return
    // Sin respuesta, o el panel apagado: la última lectura buena ya no dice nada.
    if (err instanceof NetworkError) failure.value = 'offline'
    else if (err instanceof ServiceError && err.service === 'admin') failure.value = 'admin'
    // Un 401 lo atiende la sesión; otro error deja la lectura anterior.
  }
  finally {
    if (controller === own) controller = null
  }
}

function onVisible(): void {
  if (document.visibilityState === 'visible') void refreshStatus()
}

/** Empieza a sondear (el shell montado, con sesión). Devuelve cómo apagarlo. */
export function watchStatus(): () => void {
  void refreshStatus()
  clearInterval(timer)
  timer = setInterval(() => void refreshStatus(), STATUS_INTERVAL_MS)
  addEventListener('focus', onVisible)
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    clearInterval(timer)
    controller?.abort()
    current.value = null
    failure.value = null
    removeEventListener('focus', onVisible)
    document.removeEventListener('visibilitychange', onVisible)
  }
}

/** Lo más grave primero: sin servidor, sin base, el panel apagado, después Eros. */
export const statusProblem = computed<string | null>(() => {
  if (failure.value === 'offline') return shell.status.offline
  if (failure.value === 'admin') return shell.status.admin
  const status = current.value
  if (!status) return null
  if (!status.db.ok) return shell.status.db
  const eros = status.eros.state
  if (eros === 'down') return shell.status.erosDown
  if (eros === 'cooldown') return shell.status.erosCooldown
  if (eros === 'unconfigured') return shell.status.erosUnconfigured
  return null
})
