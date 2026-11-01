/**
 * La sección abierta del editor vive en la ruta: en el parámetro `:seccion` si la ruta lo tiene
 * (#/obras/12/relato) y si no en `?seccion=`. Cambiarla no es otra pantalla: no pregunta ni transiciona.
 */
import { computed } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import type { AnyModel, ModelSection } from '../../models/types'

export function useSection(model: AnyModel) {
  const route = useRoute()
  const router = useRouter()
  const sections = computed<readonly ModelSection[]>(() => model.sections)

  const inParams = computed(() => route.matched.at(-1)?.path.includes(':seccion') ?? false)

  const current = computed<string>(() => {
    const raw = inParams.value ? route.params['seccion'] : route.query['seccion']
    const id = typeof raw === 'string' ? raw : ''
    return sections.value.some(s => s.id === id) ? id : (sections.value[0]?.id ?? '')
  })

  /** Abre la sección `id`. `query` suma o reemplaza parámetros (?campo=). */
  async function go(id: string, query: LocationQueryRaw = {}): Promise<void> {
    if (id === current.value && !Object.keys(query).length) return
    const first = sections.value[0]?.id
    const next = { ...route.query, ...query }
    if (inParams.value) {
      await router.replace({ params: { ...route.params, seccion: id === first ? '' : id }, query: next })
      return
    }
    await router.replace({ query: { ...next, seccion: id === first ? undefined : id } })
  }

  return { sections, current, go }
}
