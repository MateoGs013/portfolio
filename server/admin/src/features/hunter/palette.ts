/**
 * Vacantes en la paleta Ctrl/⌘K: la cola entera (también las pegadas a mano) reemplaza a la fuente
 * de vacantes del shell, y con una vacante abierta se suma «Generar CV para esta vacante». «Pegar una
 * vacante» ya la trae el shell (#/busqueda/vacantes?pegar=1) y la lee Index.vue.
 */
import type { Router } from 'vue-router'
import { registerPaletteSource, type PaletteItem } from '../../composables/usePalette'
import { hunter } from './dict'
import { placeOf, scoreOf } from './model'
import { allJobs, findJob, loadQueue } from './store'

function jobItems(): PaletteItem[] {
  return allJobs.value.map((job) => {
    const score = scoreOf(job)
    return {
      id: job.id,
      label: job.company ? `${job.title} · ${job.company}` : job.title,
      hint: score === null ? hunter.status[job.status] : job.estimated ? hunter.estimated(score) : hunter.percent(score),
      keywords: [placeOf(job), ...job.tags].join(' '),
      to: `/busqueda/vacantes/${encodeURIComponent(job.id)}/analisis`,
    }
  })
}

function actionItems(router: Router): PaletteItem[] {
  const route = router.currentRoute.value
  const id = route.name === 'vacantes' && typeof route.params['id'] === 'string' ? route.params['id'] : ''
  const job = id ? findJob(id) : null
  if (!job) return []
  return [{
    id: 'generate-cv',
    label: hunter.actions.generateCv,
    hint: job.title,
    keywords: 'curriculum harvard ats adaptar',
    to: { path: `/busqueda/vacantes/${encodeURIComponent(job.id)}/cv`, query: { adaptar: '1' } },
  }]
}

/**
 * Se registra cada vez que se entra a Vacantes y no se quita al salir: la cola sigue sirviendo a la
 * paleta desde cualquier pantalla (si se la quitara, se iría también la del shell que reemplazó).
 */
export function registerHunterPalette(router: Router): void {
  registerPaletteSource({ id: 'jobs', group: 'jobs', items: jobItems, refresh: () => void loadQueue(false) })
  registerPaletteSource({ id: 'hunter-actions', group: 'actions', items: () => actionItems(router) })
}
