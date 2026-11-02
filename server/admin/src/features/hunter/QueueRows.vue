<script setup lang="ts">
/**
 * Las filas de la cola: el puesto grande a la izquierda y a la derecha la empresa, el veredicto (un
 * solo punto con su palabra, del puntaje: Muy compatible, Compatible, Dudosa, Descartar) y el
 * porcentaje, para decidir sin abrir cada vacante. El estado del trabajo (postulada, descartada) va
 * como texto secundario; los filtros ya lo separan. Sin puntaje, la fila dice «Sin evaluar». En una búsqueda por afinidad, la afinidad
 * va aparte. Es un listbox: Tab entra, ↑↓ o j/k recorren y Enter abre.
 */
import type { HunterJob } from '@shared/hunterContracts'
import { computed, ref } from 'vue'
import Listbox from '../../ui/Listbox.vue'
import type { ListboxItem } from '../../ui/listbox'
import StatusDot from '../../ui/StatusDot.vue'
import { hunter } from './dict'
import { isManual, scoreOf, statusOf, verdictOf } from './model'

const props = defineProps<{
  jobs: readonly HunterJob[]
  /** Resultados de la búsqueda por afinidad: se muestra la afinidad de cada una. */
  semantic: boolean
}>()

const emit = defineEmits<{ open: [job: HunterJob, title: HTMLElement | null] }>()
const active = defineModel<string | null>('active', { default: null })

interface Row extends ListboxItem {
  key: string
  job: HunterJob
}

const rows = computed<Row[]>(() => props.jobs.map(job => ({ key: job.id, title: job.title, job })))

const root = ref<HTMLElement | null>(null)

function onActivate(row: Row): void {
  const title = root.value?.querySelector<HTMLElement>(`[data-title="${CSS.escape(row.key)}"]`) ?? null
  emit('open', row.job, title)
}

const company = (job: HunterJob) => [job.company, isManual(job) ? hunter.manualTag : null].filter(Boolean).join(' · ')
const verdict = (job: HunterJob) => {
  const score = scoreOf(job)
  return score === null ? { tone: 'neutral' as const, label: hunter.unscored } : verdictOf(score)
}
/** Solo lo que cambia qué hacer con ella: postulada o descartada. */
const workflow = (job: HunterJob) => (job.status === 'applied' || job.status === 'discarded' ? statusOf(job).label : null)
const affinity = (job: HunterJob) => (typeof job.semantic_score === 'number' ? hunter.affinity(Math.round(job.semantic_score)) : null)
</script>

<template>
  <div ref="root">
    <Listbox v-model:active="active" :items="rows" :label="hunter.listLabel" @activate="onActivate">
      <template #default="{ item }">
        <span
          class="w-fit max-w-full min-w-0 text-list text-ink transition-transform duration-700 ease-e wrap-break-word group-hover/row:translate-x-3.5"
          :data-title="item.key"
        >{{ item.title }}</span>
        <span class="flex flex-wrap items-baseline justify-start gap-x-4.5 gap-y-1 text-left text-body text-dim lg:justify-end lg:text-right">
          <span v-if="company(item.job)">{{ company(item.job) }}</span>
          <StatusDot :tone="verdict(item.job).tone" :label="verdict(item.job).label" />
          <span v-if="workflow(item.job)" class="text-faint">{{ workflow(item.job) }}</span>
          <span v-if="semantic && affinity(item.job)" class="text-dim">{{ affinity(item.job) }}</span>
          <span v-if="scoreOf(item.job) !== null" class="shrink-0 text-faint tabular-nums">{{ hunter.percent(scoreOf(item.job)!) }}</span>
        </span>
      </template>
    </Listbox>
  </div>
</template>
