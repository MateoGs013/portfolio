/**
 * Dónde viven las regiones vivas y los avisos. Con un <dialog> modal abierto todo lo que queda
 * afuera es inerte: el lector no lee las regiones y los avisos no se pueden tocar. Cada Dialog abierto
 * apila acá un punto de montaje propio, y Announcer y Toaster se teletransportan al de arriba.
 */
import { computed, shallowReactive } from 'vue'

const stack = shallowReactive<HTMLElement[]>([])

/** El punto de montaje del diálogo modal de más arriba, o el body si no hay ninguno abierto. */
export const layerTarget = computed<HTMLElement | 'body'>(() => stack[stack.length - 1] ?? 'body')

export function pushLayer(host: HTMLElement): void {
  if (!stack.includes(host)) stack.push(host)
}

export function popLayer(host: HTMLElement): void {
  const index = stack.indexOf(host)
  if (index !== -1) stack.splice(index, 1)
}

/** Dónde agregar algo temporal que tiene que seguir activo (el textarea de copiar, por ejemplo). */
export function activeLayerRoot(): HTMLElement {
  return stack[stack.length - 1] ?? document.body
}
