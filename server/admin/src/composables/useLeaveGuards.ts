/**
 * Guarda de cambios sin guardar. Cada editor registra la suya mientras está montado; el router la
 * consulta en beforeEach (también Atrás y Adelante) y el shell antes de Salir. Si alguna tiene cambios
 * que la navegación perdería, se pregunta una sola vez. Cerrar o recargar la pestaña lo frena el
 * navegador con su propio aviso.
 */
import { getCurrentScope, onScopeDispose } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import { shell } from '../shell/dict'
import { requestConfirm } from '../stores/dialogs'

export interface LeaveGuard {
  /** ¿Hay algo que se perdería? */
  dirty: () => boolean
  /**
   * La navegación no sale del editor (otra pestaña del mismo registro, un filtro): no hace falta
   * preguntar. Sin `to` (Salir, cerrar la pestaña) siempre se sale.
   */
  keeps?: (to: RouteLocationNormalized) => boolean
}

const guards = new Set<LeaveGuard>()

function onBeforeUnload(event: BeforeUnloadEvent): void {
  if (![...guards].some(guard => guard.dirty())) return
  event.preventDefault()
  // Safari y Chromium viejos solo preguntan si además hay returnValue.
  event.returnValue = ''
}

/** Registra una guarda mientras dure el componente que la pide. Devuelve cómo quitarla antes. */
export function useLeaveGuard(guard: LeaveGuard): () => void {
  if (!guards.size) addEventListener('beforeunload', onBeforeUnload)
  guards.add(guard)
  const remove = () => {
    guards.delete(guard)
    if (!guards.size) removeEventListener('beforeunload', onBeforeUnload)
  }
  if (getCurrentScope()) onScopeDispose(remove)
  return remove
}

/** ¿Hay cambios que se perderían yendo a `to` (o saliendo del panel, sin `to`)? */
export function wouldLose(to?: RouteLocationNormalized): boolean {
  return [...guards].some(guard => guard.dirty() && !(to && guard.keeps?.(to)))
}

/** true si se puede seguir: no había nada que perder o se eligió salir sin guardar. */
export async function confirmLeave(to?: RouteLocationNormalized): Promise<boolean> {
  if (!wouldLose(to)) return true
  return requestConfirm({
    title: shell.leave.title,
    message: shell.leave.message,
    confirmLabel: shell.leave.confirm,
    cancelLabel: shell.leave.cancel,
    destructive: true,
  })
}
