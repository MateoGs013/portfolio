/**
 * El título de la pestaña y el foco al cambiar de vista. La pestaña dice el registro, la sección y
 * «Admin» («La Rúcula Gastrobar · Obras · Admin»): la sección la pone el router (meta.section) y el
 * registro la vista que lo muestra, con useRecordTitle.
 */
import { getCurrentScope, nextTick, onScopeDispose, ref, toValue, watch, watchEffect, type MaybeRefOrGetter } from 'vue'
import { ui } from '../ui/dict'

const section = ref('')
const record = ref<string | null>(null)
let owner: symbol | null = null

watchEffect(() => {
  document.title = [record.value, section.value, ui.app.title].filter(Boolean).join(' · ')
})

export function setSectionTitle(title: string): void {
  section.value = title
}

/** El nombre del registro que muestra la vista, mientras dure. Se borra al desmontarla. */
export function useRecordTitle(title: MaybeRefOrGetter<string | null | undefined>): void {
  const me = Symbol('record-title')
  watch(() => toValue(title), (value) => {
    owner = me
    record.value = value || null
  }, { immediate: true })
  if (getCurrentScope()) {
    onScopeDispose(() => {
      // La vista siguiente pudo haber puesto el suyo antes de que esta se desmonte.
      if (owner === me) record.value = null
    })
  }
}

/**
 * El foco va al h1 de la vista nueva (o a la zona principal, si la vista todavía no lo tiene). Así el
 * lector anuncia dónde se llegó y el próximo Tab sigue desde ahí.
 */
export async function focusView(): Promise<void> {
  await nextTick()
  await new Promise(resolve => requestAnimationFrame(resolve))
  const main = document.getElementById('main')
  const heading = main?.querySelector<HTMLElement>('h1') ?? main
  if (!heading) return
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
  heading.focus({ preventScroll: true })
}
