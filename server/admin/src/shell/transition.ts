/**
 * El paso entre pantallas con View Transitions: la vista se funde en 200 ms y el título que lleva
 * `view-transition-name: record-title` viaja de la fila al encabezado del editor (0,7 s, --e; ver
 * styles/admin.css). Cambiar de pestaña dentro del mismo registro no es otra pantalla: no transiciona.
 * Sin soporte o con movimiento reducido, se cambia sin animar.
 */
import { nextTick } from 'vue'
import type { RouteLocationNormalized, Router } from 'vue-router'

export const TRAVEL_NAME = 'record-title'

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** La misma pantalla: misma ruta y mismo registro (cambia solo la pestaña o la consulta). */
export function sameScreen(to: RouteLocationNormalized, from: RouteLocationNormalized): boolean {
  return to.name === from.name && String(to.params['id'] ?? '') === String(from.params['id'] ?? '')
}

/**
 * Marca el elemento que viaja al encabezado (el título de la fila tocada). Se llama justo antes de
 * navegar; al terminar la transición el nombre se quita para que no choque con el del editor.
 */
export function markTravel(el: HTMLElement | null | undefined): void {
  if (!el) return
  el.style.viewTransitionName = TRAVEL_NAME
  setTimeout(() => {
    el.style.viewTransitionName = ''
  }, 1000)
}

export function installViewTransitions(router: Router): void {
  let finish: (() => void) | null = null

  const settle = () => {
    const done = finish
    finish = null
    if (done) void nextTick().then(done)
  }

  router.beforeResolve((to, from) => {
    if (!from.matched.length || sameScreen(to, from) || reduced() || !document.startViewTransition) return
    // El navegador toma la foto de la pantalla actual y recién ahí deja seguir a la navegación.
    return new Promise<void>((resolve) => {
      document.startViewTransition(() => new Promise<void>((done) => {
        finish = done
        resolve()
      }))
    })
  })

  router.afterEach(settle)
  router.onError(settle)
}
