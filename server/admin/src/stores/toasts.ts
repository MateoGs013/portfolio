/**
 * Avisos al pie. Los que confirman algo se van solos a los 4 s; los errores se quedan hasta que se
 * cierran, porque traen lo que hay que hacer. Cada aviso también se lee en la región aria-live.
 */
import { reactive, readonly } from 'vue'
import { announce } from '../ui/announce'

export type ToastTone = 'ok' | 'info' | 'error'

export interface ToastAction {
  label: string
  run: () => void
}

export interface Toast {
  id: number
  message: string
  tone: ToastTone
  action?: ToastAction
}

export interface ToastOptions {
  tone?: ToastTone
  action?: ToastAction
  /** Milisegundos hasta cerrarse. Los errores no se cierran solos salvo que se pida. */
  duration?: number
}

const AUTO_CLOSE_MS = 4000
const MAX_VISIBLE = 3

const state = reactive({ items: [] as Toast[] })
const timers = new Map<number, ReturnType<typeof setTimeout>>()
let nextId = 0

export const toasts = readonly(state)

export function dismissToast(id: number): void {
  clearTimeout(timers.get(id))
  timers.delete(id)
  const index = state.items.findIndex(t => t.id === id)
  if (index >= 0) state.items.splice(index, 1)
}

export function toast(message: string, options: ToastOptions = {}): number {
  const tone = options.tone ?? 'ok'
  const id = ++nextId
  state.items.push({ id, message, tone, action: options.action })
  while (state.items.length > MAX_VISIBLE) dismissToast(state.items[0]!.id)
  announce(message, tone === 'error' ? 'assertive' : 'polite')
  const duration = options.duration ?? (tone === 'error' ? 0 : AUTO_CLOSE_MS)
  if (duration > 0) timers.set(id, setTimeout(() => dismissToast(id), duration))
  return id
}

/** Pausa el cierre mientras el puntero o el foco están sobre el aviso, y lo retoma después. */
export function holdToast(id: number, hold: boolean): void {
  const item = state.items.find(t => t.id === id)
  if (!item || item.tone === 'error') return
  clearTimeout(timers.get(id))
  if (!hold) timers.set(id, setTimeout(() => dismissToast(id), AUTO_CLOSE_MS))
}
