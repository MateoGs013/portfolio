<script setup lang="ts">
/**
 * Etapa CV (invariante 6): «Adaptar CV» hace POST /hunter/cv/:id con la vacante y muestra la hoja
 * real armada desde la base, medida contra la cota dual (una página A4, 248–265 mm de contenido).
 * Al terminar, el foco va al encabezado de la etapa. El resumen dirigido de Eros es una propuesta
 * aparte; aceptarla o volver al de la base rearma el CV sin volver a preguntarle a Eros.
 * Con ?adaptar=1 (la paleta: «Generar CV para esta vacante») adapta solo al entrar.
 */
import type { HunterJob } from '@shared/hunterContracts'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { announce } from '../../../ui/announce'
import { toast } from '../../../stores/toasts'
import Button from '../../../ui/Button.vue'
import Skeleton from '../../../ui/Skeleton.vue'
import StatusDot, { type StatusTone } from '../../../ui/StatusDot.vue'
import { failureText, originOf } from '../adapter'
import { generateCv, sheetUrl, type CvRequest } from '../cvClient'
import { job as t } from '../dictJob'
import { isManual, isSample } from '../model'
import OriginNote from '../OriginNote.vue'
import { workOf } from '../work'
import CvFrame from './CvFrame.vue'
import CvSummary from './CvSummary.vue'
import CvTools from './CvTools.vue'
import StageHead from './StageHead.vue'

const props = defineProps<{ job: HunterJob }>()

const route = useRoute()
const router = useRouter()
const work = workOf(props.job)
const pending = ref(false)
const head = ref<InstanceType<typeof StageHead> | null>(null)

const request = computed<CvRequest>(() => ({ useSummaryProposal: work.cv?.usesSummaryProposal ?? false }))

async function adapt(options: { useSummaryProposal?: boolean, regenerate?: boolean } = {}): Promise<void> {
  if (pending.value) return
  pending.value = true
  const req: CvRequest = { useSummaryProposal: options.useSummaryProposal ?? request.value.useSummaryProposal, regenerate: options.regenerate }
  try {
    const tailored = await generateCv(props.job, req)
    if (!tailored.usesSummaryProposal) work.baseSummary = tailored.data.summary
    work.measure = null
    work.sheetUrl = await sheetUrl(props.job, { useSummaryProposal: tailored.usesSummaryProposal }, 'measure')
    work.cv = tailored
    if (options.useSummaryProposal !== undefined) toast(tailored.usesSummaryProposal ? t.cv.proposalUsed : t.cv.baseUsed)
    else announce(t.cv.done)
    head.value?.focus()
  }
  catch (err) {
    toast(failureText(err, t.cv.failed), { tone: 'error' })
  }
  finally {
    pending.value = false
  }
}

onMounted(() => {
  if (route.query['adaptar'] !== '1') return
  const { adaptar: _drop, ...rest } = route.query
  void router.replace({ path: route.path, query: rest })
  void adapt()
})

const origin = computed(() => (isSample(props.job) ? 'demo' as const : originOf(work.cv)))
const canRegenerate = computed(() => !isManual(props.job) && !isSample(props.job))

const adaptation = computed(() => {
  const cv = work.cv
  if (!cv || cv._source !== 'eros') return t.cv.noEros
  const a = cv._adaptation
  const line = t.cv.adaptation(a.categories.length, a.entries.length, a.bullets)
  return a.discarded.length ? `${line} ${t.cv.discarded(a.discarded.length)}` : line
})

const measureLine = computed<{ tone: StatusTone, label: string }>(() => {
  const m = work.measure
  if (!m) return { tone: 'neutral', label: t.cv.measuring }
  const mm = Math.round(m.heightMm)
  if (m.pages > 1 || m.heightMm > 265) return { tone: 'danger', label: t.cv.long(mm, m.pages) }
  if (m.heightMm < 248) return { tone: 'wip', label: t.cv.short(mm) }
  return { tone: 'ok', label: t.cv.fits(mm) }
})
</script>

<template>
  <div class="grid gap-11">
    <StageHead ref="head" :heading="t.cv.heading" :intro="t.cv.intro">
      <Button v-if="!work.cv" variant="primary" :loading="pending" :loading-label="t.cv.running" @click="adapt()">
        {{ t.cv.run }}
      </Button>
      <Button v-else-if="canRegenerate" variant="ghost" :loading="pending" :loading-label="t.cv.running" @click="adapt({ regenerate: true })">
        {{ t.cv.regenerate }}
      </Button>
    </StageHead>

    <div v-if="work.cv && work.sheetUrl" class="grid animate-enter items-start gap-10 border-t border-rule pt-7 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div class="min-w-0 rounded-dialog bg-surface p-4 sm:p-7" :aria-busy="pending || undefined">
        <CvFrame :key="work.sheetUrl" :url="work.sheetUrl" :title="t.cv.sheet" @measure="work.measure = $event" />
      </div>
      <aside class="grid content-start gap-7 lg:sticky lg:top-6 lg:border-l lg:border-rule lg:pl-6">
        <div class="grid gap-2">
          <p
            class="m-0"
            data-cv-measure
            :data-height-mm="work.measure?.heightMm"
            :data-pages="work.measure?.pages"
            role="status"
          >
            <StatusDot :tone="measureLine.tone" :label="measureLine.label" strong />
          </p>
          <OriginNote :origin="origin" />
          <p class="m-0 text-label text-faint">
            {{ adaptation }}
          </p>
        </div>
        <CvTools :job="job" :request="request" :url="work.sheetUrl" />
        <CvSummary :tailored="work.cv" :base-summary="work.baseSummary" :company="job.company" :pending="pending" @use="adapt({ useSummaryProposal: $event })" />
      </aside>
    </div>
    <Skeleton v-else-if="pending" variant="text" :count="6" />
    <p v-else class="m-0 border-t border-rule pt-7 text-body text-faint">
      {{ t.cv.empty }}
    </p>
  </div>
</template>
