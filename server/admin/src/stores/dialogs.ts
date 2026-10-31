/**
 * Confirmaciones con promesa, en lugar de window.confirm: `await requestConfirm({...})` devuelve true
 * si se confirmó. Una sola a la vez; las que llegan mientras hay una abierta esperan su turno.
 * ConfirmHost.vue (montado en App) las muestra con ConfirmDialog.
 */
import { shallowReactive, readonly } from 'vue'

export interface ConfirmRequest {
  title: string
  message?: string
  /** Lo que se ve afectado, una línea por elemento («2 obras usan esta tecnología»). */
  impact?: string[]
  confirmLabel: string
  cancelLabel?: string
  /** Destructivo: el botón va en rojo, Cancelar va primero y el foco empieza ahí. */
  destructive?: boolean
}

interface Pending extends ConfirmRequest {
  id: number
  resolve: (answer: boolean) => void
}

const state = shallowReactive({ current: null as Pending | null })
const queue: Pending[] = []
let nextId = 0

export const confirmState = readonly(state)

function showNext(): void {
  state.current = queue.shift() ?? null
}

export function requestConfirm(request: ConfirmRequest): Promise<boolean> {
  return new Promise((resolve) => {
    queue.push({ ...request, id: ++nextId, resolve })
    if (!state.current) showNext()
  })
}

/** La respuesta del diálogo abierto (Esc y Cancelar cuentan como no). */
export function settleConfirm(answer: boolean): void {
  const current = state.current
  if (!current) return
  current.resolve(answer)
  showNext()
}
