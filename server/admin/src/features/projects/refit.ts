/**
 * Los textos largos de una sección que se abre desde otra pestaña se montan mientras el panel todavía
 * está oculto (Tabs lo muestra con v-show en el mismo pase), así que TextArea mide su alto en cero y
 * queda aplastado hasta que se escribe. Con el panel ya visible, un `input` sin cambios hace que cada
 * uno vuelva a medirse (TextArea se ajusta en @input; v-model no cambia nada).
 */
import { nextTick, onMounted, type Ref } from 'vue'

export function useRefitTextareas(root: Ref<HTMLElement | null>): () => Promise<void> {
  async function refit(): Promise<void> {
    await nextTick()
    await new Promise(resolve => requestAnimationFrame(resolve))
    root.value?.querySelectorAll('textarea').forEach(area => area.dispatchEvent(new Event('input')))
  }
  onMounted(() => void refit())
  return refit
}
