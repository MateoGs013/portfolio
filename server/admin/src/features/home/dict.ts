/**
 * Textos del Inicio. Las frases de cada pendiente llegan armadas desde GET /pending (con los rótulos de
 * la base); acá van el resumen, los grupos de la bandeja, los estados y las vacantes.
 */
import type { PendingKind } from '@shared/adminContracts'
import type { StatusTone } from '../../ui/StatusDot.vue'

const count = (one: string, many: string) => (n: number) => (n === 1 ? one : many)

export type PendingGroupId = 'cv-pdf' | 'publicacion' | 'imagenes' | 'ingles' | 'metricas' | 'cv' | 'perfil'

/** Grupos de la bandeja, en orden: cada tipo de pendiente cae en uno. */
export const PENDING_GROUPS: readonly { id: PendingGroupId, label: string, tone: StatusTone, kinds: readonly PendingKind[] }[] = [
  { id: 'cv-pdf', label: 'PDF del CV', tone: 'sig', kinds: ['cv_pdf'] },
  { id: 'publicacion', label: 'Sin publicar', tone: 'neutral', kinds: ['hidden', 'scheduled', 'draft'] },
  { id: 'imagenes', label: 'Imágenes', tone: 'wip', kinds: ['no_cover', 'media_english'] },
  { id: 'ingles', label: 'Falta el inglés', tone: 'wip', kinds: ['english'] },
  { id: 'metricas', label: 'Métricas sin respaldo', tone: 'wip', kinds: ['metrics'] },
  { id: 'cv', label: 'CV', tone: 'wip', kinds: ['cv_bullets', 'cv_english'] },
  { id: 'perfil', label: 'Perfil', tone: 'wip', kinds: ['profile'] },
]

export const home = {
  title: 'Inicio',
  summary: {
    label: 'Resumen',
    projects: count('obra en el sitio', 'obras en el sitio'),
    articles: count('artículo publicado', 'artículos publicados'),
    experience: count('entrada de trayectoria', 'entradas de trayectoria'),
    cv: count('en el CV', 'en el CV'),
    jobs: count('vacante nueva compatible', 'vacantes nuevas compatibles'),
  },
  actions: {
    newProject: 'Nueva obra',
    pasteJob: 'Pegar una vacante',
  },
  pending: {
    title: 'Pendientes',
    label: (n: number) => (n === 1 ? '1 pendiente' : `${n} pendientes`),
    group: (label: string, n: number) => `${label}, ${n === 1 ? '1 pendiente' : `${n} pendientes`}`,
    go: 'Ir',
    emptyTitle: 'Nada pendiente',
    emptyText: 'Lo que el sitio muestra está completo: publicado, con portada, con fuente y en los dos idiomas. El PDF del CV coincide con la base.',
    loadError: 'No se pudieron calcular los pendientes.',
  },
  jobs: {
    title: 'Vacantes nuevas compatibles',
    row: (title: string, company: string) => (company ? `${title} en ${company}` : title),
    score: (verdict: string, score: number) => `${verdict} · ${score} %`,
    manual: 'Pegada a mano',
    more: (n: number) => (n === 1 ? 'Ver la otra en Vacantes' : `Ver las ${n} restantes en Vacantes`),
    sample: 'Son vacantes de muestra para probar el panel sin Eros: no se guarda ningún cambio.',
    erosTitle: 'Vacantes: sin respuesta de Eros',
    stale: (at: string | null) => (at ? `De la última lectura, del ${at}: puede haber cambiado.` : 'De la última lectura: puede haber cambiado.'),
    erosDown: 'No se pueden ver las vacantes nuevas ahora.',
    retry: 'Probar de nuevo',
  },
}
