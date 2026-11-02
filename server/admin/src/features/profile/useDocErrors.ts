/**
 * Los errores por campo de un documento de Perfil, vengan del servidor o de la revisión previa: cada
 * campo con su mensaje, un resumen assertive con los rótulos humanos («Hay 2 campos para revisar:
 * Email y PDF en inglés») y el foco en el primero, en el orden en que aparecen en la pantalla.
 * Un error se va cuando su campo cambia. Hace lo de useServerErrors sin secciones ni adminSchema: los
 * rótulos salen del esquema del documento.
 */
import type { AdminDoc, FieldIssue } from '@shared/adminContracts'
import { computed, nextTick, shallowRef, watch, type Ref, type ShallowRef } from 'vue'
import { collections } from '../collections/dict'
import { controlFor, readPath } from '../collections/paths'
import { announce } from '../../ui/announce'
import { profile } from './dict'
import { formPath, readableName, type DocForm } from './model'

interface Tracked extends FieldIssue {
  was: string
}

const snap = (value: unknown) => JSON.stringify(value ?? null)

async function settle(): Promise<void> {
  await nextTick()
  await new Promise(resolve => requestAnimationFrame(resolve))
}

/** El lugar del campo en la pantalla: los que no tienen control van al final, en su orden. */
function screenOrder(issues: readonly FieldIssue[]): FieldIssue[] {
  const placed = issues.map((issue, index) => ({ issue, index, el: controlFor(issue.path) }))
  return placed.sort((a, b) => {
    if (a.el && b.el && a.el !== b.el) return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    if (a.el && !b.el) return -1
    if (!a.el && b.el) return 1
    return a.index - b.index
  }).map(p => p.issue)
}

export function useDocErrors(form: Ref<DocForm>, doc: ShallowRef<AdminDoc | null>) {
  const list = shallowRef<Tracked[]>([])
  const issues = computed<FieldIssue[]>(() => list.value.map(({ path, message }) => ({ path, message })))

  function messageFor(path: string): string | null {
    const found = list.value.find(i => i.path === path) ?? list.value.find(i => i.path.startsWith(`${path}.`))
    return found?.message ?? null
  }

  /** El rótulo humano de una ruta del formulario, para el resumen que se anuncia. */
  function labelOf(path: string): string {
    const english = path.endsWith('.en')
    const free = /^free\[(\d+)\]/.exec(path)
    if (free) {
      const block = form.value.free[Number(free[1])]
      const name = readableName(block?.name ?? '') || profile.free.untitled
      return path.endsWith('.name') ? `${profile.free.name} de ${name}` : english ? `${name} (${profile.english})` : name
    }
    const name = /^fields\.([^.[]+)/.exec(path)?.[1] ?? ''
    const block = doc.value?.schema.find(b => b.name === name)
    if (!block) return profile.otherGroup
    if (block.type === 'localizedPath') return english ? profile.cv.en : profile.cv.es
    return english ? `${block.label} (${profile.english})` : block.label
  }

  async function focusField(raw: string): Promise<boolean> {
    const path = formPath(raw, form.value)
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

  async function show(found: readonly FieldIssue[]): Promise<void> {
    const mapped = found.map(i => ({ ...i, path: formPath(i.path, form.value) }))
    const sorted = screenOrder(mapped)
    list.value = sorted.map(i => ({ ...i, was: snap(readPath(form.value, i.path)) }))
    const first = sorted[0]
    if (!first) return
    announce(collections.errors.summary(sorted.map(i => labelOf(i.path))), 'assertive')
    await focusField(first.path)
  }

  function clear(): void {
    list.value = []
  }

  watch(form, (value) => {
    if (!list.value.length) return
    const kept = list.value.filter(i => snap(readPath(value, i.path)) === i.was)
    if (kept.length !== list.value.length) list.value = kept
  }, { deep: true })

  return { issues, messageFor, show, clear, focusField }
}

export type DocErrors = ReturnType<typeof useDocErrors>
