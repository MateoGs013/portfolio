/**
 * Los datos del Muestrario salen de la base, por la API pública: las obras visibles. Así las listas y
 * el diálogo de impacto muestran contenido real y los estados de carga y error son los de verdad.
 */
import { ref, shallowRef } from 'vue'
import { NetworkError, RequestError, isAbort, messageOf } from '../../api/errors'
import type { ListboxItem } from '../listbox'

interface PublicProjectRow {
  slug: string
  title: string
  role: string | null
  summary: string
  year: number | null
  org: { name: string } | null
  techs: { slug: string }[]
  metrics: { key: string }[]
  _count: { media: number, steps: number }
}

export interface SampleProject extends ListboxItem {
  media: number
  steps: number
  techs: number
  metricKey: string | null
  summary: string
}

export function useSampleProjects() {
  const items = shallowRef<SampleProject[]>([])
  const loading = ref(false)
  const error = ref('')

  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      const res = await fetch('/api/projects', { headers: { Accept: 'application/json' } }).catch(() => {
        throw new NetworkError(false)
      })
      if (!res.ok) throw new RequestError(res.status, null)
      const body = await res.json() as { data: PublicProjectRow[] }
      items.value = body.data.map(p => ({
        key: p.slug,
        title: p.title,
        meta: [p.org?.name, p.role].filter(Boolean).join(' · '),
        aside: p.year ? String(p.year) : undefined,
        media: p._count.media,
        steps: p._count.steps,
        techs: p.techs.length,
        metricKey: p.metrics[0]?.key ?? null,
        summary: p.summary,
      }))
    }
    catch (err) {
      if (!isAbort(err)) error.value = messageOf(err)
    }
    finally {
      loading.value = false
    }
  }

  return { items, loading, error, load }
}
