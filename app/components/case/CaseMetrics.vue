<script setup lang="ts">
/**
 * Métricas de la obra (filas Metric en su `order`): la cifra con su unidad en el idioma de la página
 * (RollNumber: el SSR trae el valor final y cuenta al entrar en pantalla) o la lista, y debajo su
 * rótulo del diccionario. Cada una se asoma con lo que mide y, si la base los tiene, el origen y la
 * fecha de medición. Sin línea de telemetría fija.
 */
import type { Metric } from '~/lib/api'
import { metricDescription, metricLabel, metricValue } from '~/lib/format'
import type { PeekLine } from './CasePeek.vue'

defineProps<{ metrics: Metric[] }>()

const { t, lang } = useLocale()

const dateLocale = { es: 'es-AR', en: 'en-US' } as const

function day(value: string) {
  return new Intl.DateTimeFormat(dateLocale[lang.value], { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

/** Una cifra corta va en el tamaño de los números (hero); una con unidad larga, un paso abajo, sin cortarse. */
const size = (m: Metric) => ((metricValue(m, lang.value)?.length ?? 0) > 6 ? 'text-xl' : 'text-hero')

function peekLines(m: Metric): PeekLine[] {
  const lines: PeekLine[] = []
  const desc = metricDescription(m, lang.value)
  if (desc) lines.push({ text: desc })
  if (m.source) lines.push({ text: t('case.source', { source: m.source }) })
  if (m.measuredAt) lines.push({ text: t('case.measuredAt', { date: day(m.measuredAt) }) })
  return lines
}
</script>

<template>
  <RecordField v-slot="{ fv }" collection="projects" k="metrics" :value="metrics">
    <ul class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))] gap-x-6 gap-y-8">
      <CasePeekTrigger
        v-for="m in metrics"
        :key="m.key"
        as="li"
        data-peek-group
        class="relative flex flex-col gap-2 border-t border-rule pt-4"
        button-class="absolute top-3 right-0"
        :heading="metricLabel(m, lang)"
        :lines="peekLines(m)"
        :label="t('case.peek.open', { name: metricLabel(m, lang) })"
      >
        <span v-if="m.value !== null" :class="[fv, size(m)]" class="block pe-7 font-title whitespace-nowrap tabular-nums">
          <RollNumber :value="m.value" :unit="m.unit" />
        </span>
        <span v-else :class="fv" class="block pe-7 text-l font-title">{{ metricValue(m, lang) }}</span>
        <span class="text-xs text-dim">{{ metricLabel(m, lang) }}</span>
      </CasePeekTrigger>
    </ul>
  </RecordField>
</template>
