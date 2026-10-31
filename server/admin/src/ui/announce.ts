/**
 * Lo que se le dice al lector de pantalla. Las dos regiones (Announcer.vue) se montan al arrancar y
 * quedan vacías: un mensaje nuevo reemplaza al anterior y se repite aunque sea igual.
 */
import { reactive, readonly } from 'vue'

export type Politeness = 'polite' | 'assertive'

const state = reactive({ polite: '', assertive: '' })

export const announcements = readonly(state)

export function announce(message: string, politeness: Politeness = 'polite'): void {
  // Vaciar antes de escribir hace que el lector lea dos avisos iguales seguidos.
  state[politeness] = ''
  requestAnimationFrame(() => {
    state[politeness] = message
  })
}
