/**
 * Textos de Tendencias (Búsqueda laboral): notas de terceros que encuentra el radar de Eros. Español
 * claro, minúscula de oración; los estados y las fuentes con los rótulos de @shared/contentContracts.
 */
import { trendSourceLabels } from '@shared/contentContracts'
import { plural } from '../content/dict'

/** «Hacker News, Dev.to, GitHub y blogs técnicos»: las fuentes del radar, en una frase. */
const sources = Object.values(trendSourceLabels)
const last = sources.at(-1) ?? ''
const sourceList = `${sources.slice(0, -1).join(', ')} y ${last.charAt(0).toLowerCase()}${last.slice(1)}`

export const radar = {
  title: 'Tendencias',
  lead: 'Notas de terceros que encuentra el radar de Eros. Cada una puede volverse una publicación tuya.',
  listLabel: 'Tendencias del radar',
  filters: {
    label: 'Filtrar tendencias',
    all: 'Todas',
    discovered: 'Nuevas',
    generated: 'Con publicación',
    discarded: 'Descartadas',
  },
  sample: 'Muestra de prueba: estas tendencias no vienen de ninguna fuente y no se pueden cambiar.',
  offline: {
    title: 'Eros no responde',
    text: 'Las tendencias las encuentra el radar de Eros: hasta que responda no hay ninguna para mostrar ni se pueden buscar nuevas.',
  },
  empty: {
    title: 'El radar no tiene tendencias',
    text: `Buscá tendencias nuevas: Eros recorre ${sourceList}.`,
    none: 'Nada para mostrar',
    filtered: 'Ninguna tendencia coincide con este filtro.',
    offlineTitle: 'Sin Eros no hay tendencias para mostrar',
    offlineText: 'Cuando Eros vuelva a responder aparecen acá, con su fuente y la fecha en que las detectó.',
  },
  loadFailed: 'No se pudieron cargar las tendencias',
  untitled: 'Tendencia sin título',
  relevance: (n: number) => `afinidad ${n} %`,
  scan: {
    action: 'Buscar tendencias nuevas',
    running: 'Eros está recorriendo las fuentes…',
    started: 'Eros está recorriendo las fuentes. Puede tardar un minuto.',
    done: (found: number, added: number) => added
      ? `Eros revisó ${plural(found, 'nota', 'notas')} y sumó ${plural(added, 'tendencia nueva', 'tendencias nuevas')}.`
      : `Eros revisó ${plural(found, 'nota', 'notas')}; no hay tendencias nuevas.`,
    failed: 'No se buscaron tendencias nuevas.',
  },
} as const

export const trend = {
  back: 'Tendencias',
  detected: (day: string) => `Detectada el ${day}`,
  original: 'Abrir la nota',
  summary: 'De qué se trata',
  noSummary: 'Eros no trajo un resumen de esta nota.',
  angle: 'Cómo contarla desde tu trabajo',
  tags: 'Temas',
  post: {
    heading: 'Publicación',
    linked: 'Eros ya escribió una publicación desde esta tendencia.',
    open: 'Ver la publicación',
    none: 'Todavía no hay una publicación desde esta tendencia.',
  },
  create: 'Crear publicación desde esta tendencia',
  locked: {
    sample: 'Es una muestra: se puede leer, pero no cambiar ni volverla publicación.',
    offline: 'Eros no responde: se puede leer, pero no cambiar ni volverla publicación.',
  },
  status: {
    discard: 'Descartar',
    restore: 'Recuperar la tendencia',
    done: (label: string) => `La tendencia quedó en «${label}».`,
    failed: 'El estado no cambió.',
  },
  notFound: {
    title: 'No encontramos esta tendencia',
    text: 'Puede que Eros la haya quitado del radar. Volvé a la lista para ver las que hay.',
    offline: 'Eros no responde, así que no se puede leer esta tendencia ahora. Probá de nuevo en un momento.',
    back: 'Volver a Tendencias',
  },
} as const
