/**
 * Piezas del editor que no dependen del guardado (useEditor las arma):
 * - las secciones con algo distinto de lo guardado, para la marca de su pestaña;
 * - ?campo=<ruta>: abre la sección del campo y le lleva el foco, una vez por registro y valor.
 */
import { computed, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { readPath } from '../features/collections/paths'
import type { AnyModel } from '../models/types'

export function useChangedSections(model: AnyModel, form: Ref<object>, base: Ref<string>, dirty: Ref<boolean>) {
  return computed(() => {
    if (!dirty.value) return new Set<string>()
    const saved: unknown = JSON.parse(base.value)
    const differs = (path: string) => JSON.stringify(readPath(form.value, path) ?? null) !== JSON.stringify(readPath(saved, path) ?? null)
    return new Set(model.sections.filter(s => s.fields.some(differs)).map(s => s.id))
  })
}

export function useCampoFocus(key: Ref<string | null>, ready: Ref<boolean>, focusField: (path: string) => Promise<boolean>): void {
  const route = useRoute()
  let last = ''
  watch([() => route.query['campo'], ready], ([campo, isReady]) => {
    const path = typeof campo === 'string' ? campo : ''
    const mark = `${key.value}|${path}`
    if (!path) last = ''
    if (!path || !isReady || mark === last) return
    last = mark
    void focusField(path)
  }, { immediate: true })
}
