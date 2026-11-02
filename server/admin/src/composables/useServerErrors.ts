/**
 * Los errores por campo de un editor, vengan del servidor (400 con `errors: [{ path, message }]`) o de
 * la validación previa. Al llegar:
 * - cada campo con su mensaje (Field marca aria-invalid y lo liga con aria-describedby);
 * - la pestaña de cada campo con su marca;
 * - se abre la sección del primero, en el orden del formulario, y el foco va a ese campo;
 * - un resumen assertive («Hay 2 campos para revisar: Ciudad y Sitio»).
 * Un error se va cuando su campo cambia. `?campo=<ruta>` usa el mismo camino para llevar el foco.
 */
import type { FieldIssue } from '@shared/adminContracts'
import { computed, nextTick, shallowRef, watch, type Ref } from 'vue'
import { controlFor, orderOf, readPath, sectionOf } from '../features/collections/paths'
import type { AnyModel } from '../models/types'
import { fieldOf } from '../models/validate'
import { announce } from '../ui/announce'
import { collections } from '../features/collections/dict'

interface Tracked extends FieldIssue {
  /** El valor cuando llegó el error: si cambia, el error ya no aplica. */
  was: string
}

const snap = (value: unknown) => JSON.stringify(value ?? null)

/** Espera a que la sección nueva esté en pantalla (la pestaña monta su contenido al abrirse). */
async function settle(): Promise<void> {
  await nextTick()
  await new Promise(resolve => requestAnimationFrame(resolve))
}

export function useServerErrors(model: AnyModel, form: Ref<object>, go: (section: string) => Promise<void>) {
  const list = shallowRef<Tracked[]>([])

  const issues = computed<FieldIssue[]>(() => list.value.map(({ path, message }) => ({ path, message })))

  /** Mensaje de error de un campo (o de cualquier ruta debajo de él: `links` cubre `links[0].url`). */
  function messageFor(path: string): string | null {
    const found = list.value.find(i => i.path === path) ?? list.value.find(i => i.path.startsWith(`${path}.`) || i.path.startsWith(`${path}[`))
    return found?.message ?? null
  }

  /** Las secciones con algún error, para marcar su pestaña. */
  const sectionsWithErrors = computed(() => new Set(list.value.map(i => sectionOf(model, i.path)?.id).filter((id): id is string => !!id)))

  /** Lleva el foco al campo de `path`, abriendo antes su sección. true si lo encontró. */
  async function focusField(path: string): Promise<boolean> {
    const section = sectionOf(model, path)
    if (section) await go(section.id)
    for (let attempt = 0; attempt < 3; attempt++) {
      await settle()
      const control = controlFor(path)
      if (control) {
        control.focus()
        control.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
        return true
      }
    }
    return false
  }

  function labelOf(path: string): string {
    const name = path.split(/[.[]/).filter(part => part && part !== 'translations' && part !== 'en').at(-1) ?? path
    return fieldOf(model.schema, name)?.label ?? fieldOf(model.schema, path.split(/[.[]/)[0] ?? '')?.label ?? name
  }

  /** Muestra los errores, abre la sección del primero y lleva el foco ahí. */
  async function show(found: readonly FieldIssue[]): Promise<void> {
    const sorted = [...found].sort((a, b) => orderOf(model, a.path) - orderOf(model, b.path))
    list.value = sorted.map(i => ({ ...i, was: snap(readPath(form.value, i.path)) }))
    const first = sorted[0]
    if (!first) return
    announce(collections.errors.summary(sorted.map(i => labelOf(i.path))), 'assertive')
    await focusField(first.path)
  }

  function clear(): void {
    list.value = []
  }

  // Lo que se corrige deja de marcarse: el error se va cuando el valor del campo cambia.
  watch(form, (value) => {
    if (!list.value.length) return
    const kept = list.value.filter(i => snap(readPath(value, i.path)) === i.was)
    if (kept.length !== list.value.length) list.value = kept
  }, { deep: true })

  return { issues, messageFor, sectionsWithErrors, show, clear, focusField }
}

export type ServerErrors = ReturnType<typeof useServerErrors>
