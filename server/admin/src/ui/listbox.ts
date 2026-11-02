import type { StatusTone } from './StatusDot.vue'

/** Una fila de Listbox: el título es lo que se lee y lo que busca el tecleo. */
export interface ListboxItem {
  key: string | number
  title: string
  /** Línea de contexto («Cliente · 2025»). */
  meta?: string
  /** Cifra o dato al margen («86 %», «hace 2 días»). */
  aside?: string
  status?: { tone: StatusTone, label: string }
}
