<script setup lang="ts">
/**
 * Una tendencia ocupa la pantalla sola: «← Tendencias», la fuente con la fecha real y la afinidad,
 * el título en display (el que viajó desde la fila), la nota original y, como único primario,
 * «Crear publicación desde esta tendencia» (POST /radar/trends/:id/generate, solo con Eros). Debajo,
 * el resumen, el ángulo que propone Eros, los temas y la publicación que ya salió de ella.
 */
import type { ContentPost, GenerateRequest } from '@shared/contentContracts'
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useRecordTitle } from '../../shell/title'
import { TRAVEL_NAME } from '../../shell/transition'
import Button from '../../ui/Button.vue'
import { ui } from '../../ui/dict'
import ErrorState from '../../ui/ErrorState.vue'
import Icon from '../../ui/Icon.vue'
import Mono from '../../ui/Mono.vue'
import Skeleton from '../../ui/Skeleton.vue'
import StatusDot from '../../ui/StatusDot.vue'
import GenerateDialog from '../content/GenerateDialog.vue'
import { isSampleRow } from '../content/erosList'
import { longDay } from '../content/model'
import { useErosRecord } from '../content/useErosRecord'
import { radarApi } from './api'
import { radar, trend as t } from './dict'
import { originalOf, relevanceOf, sourceOf, trendStatusOf, trendTitle } from './model'
import { postFromTrend, trends } from './store'
import TrendMenu from './TrendMenu.vue'

const props = defineProps<{ id: string }>()

const LOCKED_ID = 'tendencia-bloqueada'
const router = useRouter()

const { record, phase, error, reload } = useErosRecord(() => props.id, trends, id => radarApi.trend(id))

useRecordTitle(() => (record.value ? trendTitle(record.value) : null))

const back = computed(() => ({ path: '/busqueda/tendencias', query: trends.lastFilter.value ? { filtro: trends.lastFilter.value } : {} }))

const context = computed(() => {
  const row = record.value
  if (!row) return ''
  const day = longDay(row.detected_at)
  return [sourceOf(row), day ? t.detected(day) : null, relevanceOf(row)].filter(Boolean).join(' · ')
})

const locked = computed(() => {
  if (!record.value) return null
  if (isSampleRow(record.value)) return t.locked.sample
  return trends.offline.value || phase.value === 'offline' ? t.locked.offline : null
})

const createOpen = ref(false)

function startCreate(): void {
  if (!locked.value) createOpen.value = true
}

function run(request: GenerateRequest): Promise<ContentPost | null> {
  if (!record.value) return Promise.resolve(null)
  const { topic: _topic, ...rest } = request
  return postFromTrend(record.value, rest)
}

function onCreated(post: ContentPost | null): void {
  if (post) void router.push(`/busqueda/publicaciones/${encodeURIComponent(post.id)}`)
}
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

    <template v-if="record">
      <header class="grid max-w-[1080px] gap-4">
        <p v-if="context" class="m-0 animate-rise text-body text-dim">
          {{ context }}
        </p>
        <div class="flex flex-wrap items-end gap-x-8 gap-y-5">
          <h1
            class="m-0 min-w-0 flex-1 basis-[min(100%,560px)] animate-rise text-heading text-balance wrap-break-word"
            :style="{ viewTransitionName: TRAVEL_NAME }"
          >
            {{ trendTitle(record) }}
          </h1>
          <div class="flex flex-wrap items-center gap-x-5 gap-y-3 pb-1">
            <StatusDot :tone="trendStatusOf(record).tone" :label="trendStatusOf(record).label" strong />
            <div class="flex flex-wrap items-center gap-2">
              <Button v-if="originalOf(record)" variant="ghost" :href="originalOf(record)!" external>
                {{ t.original }}
              </Button>
              <Button
                variant="primary"
                :aria-disabled="locked ? 'true' : undefined"
                :aria-describedby="locked ? LOCKED_ID : undefined"
                :class="locked ? 'aria-disabled:opacity-45' : ''"
                @click="startCreate"
              >
                {{ t.create }}
              </Button>
              <TrendMenu :trend="record" />
            </div>
          </div>
        </div>
      </header>
      <p v-if="locked" :id="LOCKED_ID" class="mt-4 mb-0 max-w-[68ch] text-label text-faint">
        {{ locked }}
      </p>

      <div class="mt-11 grid max-w-[1080px] gap-11 border-t border-rule pt-9 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div class="grid content-start gap-9">
          <section class="grid animate-rise gap-3">
            <h2 class="m-0 text-label font-[420] text-dim">
              {{ t.summary }}
            </h2>
            <p class="m-0 max-w-[68ch] text-prose" :class="record.summary ? 'text-ink' : 'text-faint'">
              {{ record.summary ?? t.noSummary }}
            </p>
          </section>
          <section v-if="record.engineering_angle" class="grid animate-rise gap-3 stagger [--i:1]">
            <h2 class="m-0 text-label font-[420] text-dim">
              {{ t.angle }}
            </h2>
            <p class="m-0 max-w-[68ch] text-prose text-ink">
              {{ record.engineering_angle }}
            </p>
          </section>
        </div>
        <aside class="grid animate-rise content-start gap-8 stagger [--i:2] lg:border-l lg:border-rule lg:pl-6">
          <section v-if="record.tags.length" class="grid gap-3">
            <h2 class="m-0 text-label font-[420] text-dim">
              {{ t.tags }}
            </h2>
            <ul class="m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-dim">
              <li v-for="tag in record.tags" :key="tag">
                <Mono size="label">{{ tag }}</Mono>
              </li>
            </ul>
          </section>
          <section class="grid gap-3">
            <h2 class="m-0 text-label font-[420] text-dim">
              {{ t.post.heading }}
            </h2>
            <p class="m-0 text-body text-dim">
              {{ record.post_id ? t.post.linked : t.post.none }}
            </p>
            <div v-if="record.post_id">
              <Button variant="secondary" icon="arrow-right" :href="`#/busqueda/publicaciones/${encodeURIComponent(record.post_id)}`">
                {{ t.post.open }}
              </Button>
            </div>
          </section>
        </aside>
      </div>
      <GenerateDialog v-model:open="createOpen" :trend-title="trendTitle(record)" :run="run" @created="onCreated" />
    </template>

    <template v-else-if="phase === 'loading'">
      <h1 class="m-0 text-heading text-faint">
        {{ radar.title }}
      </h1>
      <div class="mt-10 max-w-[720px]">
        <Skeleton variant="text" :count="5" />
      </div>
    </template>

    <template v-else-if="phase === 'error'">
      <h1 class="m-0 text-heading">
        {{ t.notFound.title }}
      </h1>
      <ErrorState class="mt-8" :message="error?.message ?? ''" @retry="reload" />
    </template>

    <template v-else>
      <h1 class="m-0 text-heading">
        {{ t.notFound.title }}
      </h1>
      <div class="mt-8 grid max-w-[60ch] gap-5 border-t border-rule pt-8">
        <p class="m-0 text-lead text-dim">
          {{ phase === 'offline' ? t.notFound.offline : t.notFound.text }}
        </p>
        <div class="flex flex-wrap gap-2">
          <Button v-if="phase === 'offline'" @click="reload">
            {{ ui.actions.retry }}
          </Button>
          <Button :href="`#${back.path}`" :variant="phase === 'offline' ? 'ghost' : 'secondary'">
            {{ t.notFound.back }}
          </Button>
        </div>
      </div>
    </template>
  </section>
</template>
