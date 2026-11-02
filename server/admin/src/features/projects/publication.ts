/**
 * La publicación de una obra sale de `publishedAt`, con la regla de la API pública
 * (server/src/content/visibility.ts): null es oculta, una fecha pasada es publicada y una futura,
 * programada. El panel de publicación edita la fecha como día (YYYY-MM-DD) y la guarda en ISO.
 */
import type { RecordStatus } from '../../models/types'
import { projectsText } from './dict'

export type Publication = 'published' | 'scheduled' | 'hidden'

export function publicationOf(at: string | null, now = Date.now()): Publication {
  if (!at) return 'hidden'
  const time = Date.parse(at)
  if (Number.isNaN(time)) return 'hidden'
  return time <= now ? 'published' : 'scheduled'
}

const TONES = { published: 'ok', scheduled: 'wip', hidden: 'neutral' } as const

export function publicationStatus(at: string | null): RecordStatus {
  const state = publicationOf(at)
  return { tone: TONES[state], label: projectsText.publication[state] }
}

const two = (n: number) => String(n).padStart(2, '0')

/** El día local de una fecha ISO, como lo pide un campo de fecha. */
export function dayOf(at: string | null): string {
  if (!at) return ''
  const date = new Date(at)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`
}

/**
 * La fecha de publicación para un día elegido. Vacío es «apenas guardás»: se conserva la fecha ya
 * cumplida que tenía o se toma ahora. El mismo día que la guardada conserva la hora guardada (así
 * abrir y cerrar el panel no deja cambios).
 */
export function publishedAtFor(day: string, saved: string | null): string {
  if (saved && dayOf(saved) === day) return saved
  if (!day) return saved && publicationOf(saved) === 'published' ? saved : new Date().toISOString()
  const [y, m, d] = day.split('-').map(Number)
  if (!y || !m || !d) return saved ?? new Date().toISOString()
  return new Date(y, m - 1, d).toISOString()
}
