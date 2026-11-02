<script setup lang="ts">
/**
 * Una vacante ocupa la pantalla sola: «← Vacantes» (con el filtro de donde se vino), el puesto en
 * display (el título que viajó desde la fila), empresa y lugar, el estado, el aviso original y Más
 * acciones. Debajo, las cuatro etapas como direcciones (#/busqueda/vacantes/:id/:etapa) y la etapa
 * elegida, con un solo primario cada una.
 */
import { computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useRecordTitle } from '../../shell/title'
import { TRAVEL_NAME } from '../../shell/transition'
import Button from '../../ui/Button.vue'
import Icon from '../../ui/Icon.vue'
import Skeleton from '../../ui/Skeleton.vue'
import StatusDot from '../../ui/StatusDot.vue'
import { hunter } from './dict'
import { job as t } from './dictJob'
import JobMenu from './JobMenu.vue'
import { DEFAULT_FILTER, placeOf, scoreOf, statusOf, type Stage } from './model'
import StageNav from './StageNav.vue'
import Analysis from './stages/Analysis.vue'
import Apply from './stages/Apply.vue'
import Cv from './stages/Cv.vue'
import Message from './stages/Message.vue'
import { canChange, findJob, lastFilter, lastOpened, queuePhase } from './store'
import { headingClass } from '../../ui/heading'

const props = defineProps<{
  id: string
  stage: Stage
}>()

const job = computed(() => findJob(props.id))
const waiting = computed(() => !job.value && (queuePhase.value === 'idle' || queuePhase.value === 'loading'))

watch(() => props.id, (id) => {
  lastOpened.value = id
}, { immediate: true })

useRecordTitle(() => job.value?.title ?? null)

const back = computed(() => ({ path: '/busqueda/vacantes', query: lastFilter.value === DEFAULT_FILTER ? {} : { filtro: lastFilter.value } }))
const score = computed(() => (job.value ? scoreOf(job.value) : null))
const original = computed(() => (job.value?.url && /^https?:\/\//i.test(job.value.url) ? job.value.url : null))
</script>

<template>
  <section class="px-4 pt-10 pb-20 md:px-10 md:pt-12 xl:px-16 xl:pt-14">
    <RouterLink
      :to="back"
      class="mb-3.5 inline-flex items-center gap-2 rounded-control text-row font-[420] text-faint no-underline transition-colors duration-120 ease-e hover:text-ink"
    >
      <Icon name="arrow-left" :size="14" />
      {{ t.back }}
    </RouterLink>

    <template v-if="job">
      <header class="grid max-w-[1080px] gap-4">
        <p class="m-0 animate-rise text-body text-dim">
          {{ [job.company, placeOf(job)].filter(Boolean).join(' · ') }}
        </p>
        <div class="flex flex-wrap items-start gap-x-8 gap-y-5">
          <h1
            class="m-0 min-w-0 flex-1 basis-[min(100%,560px)] animate-rise text-balance wrap-break-word"
            :class="headingClass(job.title)"
            :title="job.title.length > 40 ? job.title : undefined"
            :style="{ viewTransitionName: TRAVEL_NAME }"
          >
            {{ job.title }}
          </h1>
          <div class="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
            <StatusDot :tone="statusOf(job).tone" :label="statusOf(job).label" strong />
            <span v-if="score !== null" class="text-body text-dim tabular-nums">{{ job.estimated ? hunter.estimated(score) : hunter.percent(score) }}</span>
            <Button v-if="original" variant="ghost" :href="original" external>
              {{ t.original }}
            </Button>
            <JobMenu :job="job" />
          </div>
        </div>
      </header>

      <p v-if="!canChange(job)" class="mt-4 mb-0 max-w-[68ch] text-label text-faint">
        {{ t.menu.readOnly }}
      </p>

      <StageNav class="mt-9 max-w-[1080px]" :job-id="job.id" :stage="stage" />

      <div class="mt-10 max-w-[1080px]">
        <Analysis v-if="stage === 'analisis'" :key="`a-${job.id}`" :job="job" />
        <Message v-else-if="stage === 'mensaje'" :key="`m-${job.id}`" :job="job" />
        <Cv v-else-if="stage === 'cv'" :key="`c-${job.id}`" :job="job" />
        <Apply v-else :key="`p-${job.id}`" :job="job" />
      </div>
    </template>

    <template v-else-if="waiting">
      <h1 class="m-0 text-heading text-faint">
        {{ hunter.title }}
      </h1>
      <div class="mt-10 max-w-[720px]">
        <Skeleton variant="form" :count="4" />
      </div>
    </template>

    <template v-else>
      <h1 class="m-0 text-heading">
        {{ t.notFound.title }}
      </h1>
      <div class="mt-8 grid max-w-[60ch] gap-5 border-t border-rule pt-8">
        <p class="m-0 text-lead text-dim">
          {{ t.notFound.text }}
        </p>
        <div>
          <Button :href="`#${back.path}`">
            {{ t.notFound.back }}
          </Button>
        </div>
      </div>
    </template>
  </section>
</template>
