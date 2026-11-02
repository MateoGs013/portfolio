/**
 * Ids estables para ligar rótulo, ayuda y error (`for`, `aria-describedby`, `aria-controls`).
 * Dentro de un componente usa el useId de Vue; fuera de uno, un contador.
 */
import { getCurrentInstance, useId as vueUseId } from 'vue'

let counter = 0

export function useId(prefix = 'adm'): string {
  const raw = getCurrentInstance() ? vueUseId() : `n${++counter}`
  return `${prefix}-${raw.replace(/[^\w-]/g, '')}`
}
