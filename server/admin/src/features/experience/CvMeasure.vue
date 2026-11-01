<script setup lang="ts">
/**
 * Cuánto ocupa la hoja, con la cota dual del CV (.claude/rules/explorer.md): una página A4 con 248 a
 * 265 mm de contenido. Si pasa de una página o de 265 mm, el aviso dice qué hacer. Es una región
 * de estado: el lector lo anuncia cada vez que la hoja se vuelve a medir.
 */
import type { CvMeasure } from '@shared/hunterContracts'
import { computed } from 'vue'
import StatusDot, { type StatusTone } from '../../ui/StatusDot.vue'
import { experience as t } from './dict'

const props = defineProps<{ measure: Pick<CvMeasure, 'heightMm' | 'pages'> | null }>()

const MIN_MM = 248
const MAX_MM = 265

const long = computed(() => !!props.measure && (props.measure.pages > 1 || props.measure.heightMm > MAX_MM))
const mm = computed(() => Math.round(props.measure?.heightMm ?? 0))

const line = computed<{ tone: StatusTone, label: string }>(() => {
  if (!props.measure) return { tone: 'neutral', label: t.cv.measuring }
  if (long.value) return { tone: 'danger', label: t.cv.long }
  if (props.measure.heightMm < MIN_MM) return { tone: 'wip', label: t.cv.short(mm.value) }
  return { tone: 'ok', label: t.cv.fits(mm.value) }
})
</script>

<template>
  <div
    role="status"
    class="grid gap-1.5"
    :class="long ? 'rounded-control border border-danger/40 bg-danger/10 px-3.5 py-3' : ''"
    data-cv-measure
    :data-height-mm="measure?.heightMm"
    :data-pages="measure?.pages"
    :data-long="long || undefined"
  >
    <StatusDot :tone="line.tone" :label="line.label" strong />
    <p v-if="long && measure" class="m-0 pl-3.5 text-label text-dim">
      {{ t.cv.longDetail(mm, measure.pages) }}
    </p>
  </div>
</template>
