<script setup lang="ts">
/**
 * Tendencias como pantalla: título en display con la cuenta (solo si Eros respondió), «Buscar
 * tendencias nuevas» (POST /radar/scan: el botón dice qué está pasando mientras Eros recorre las
 * fuentes y al terminar un aviso cuenta lo que encontró), filtros por estado (?filtro=) y filas
 * grandes. Sin Eros la lista dice por qué está vacía: nada inventado.
 */
import type { Trend } from '@shared/contentContracts'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { markTravel } from '../../shell/transition'
import { toast } from '../../stores/toasts'
import { announce } from '../../ui/announce'
import Button from '../../ui/Button.vue'
import EmptyState from '../../ui/EmptyState.vue'
import ErrorState from '../../ui/ErrorState.vue'
import Skeleton from '../../ui/Skeleton.vue'
import Spinner from '../../ui/Spinner.vue'
import ErosNotice from '../content/ErosNotice.vue'
import ListFilters from '../content/ListFilters.vue'
import { failureText } from '../hunter/adapter'
import { radarApi } from './api'
import { radar } from './dict'
import { DEFAULT_TREND_FILTER, isTrendFilter, TREND_FILTERS } from './model'
import { trends } from './store'
import TrendRows from './TrendRows.vue'

const LOCKED_ID = 'tendencias-bloqueadas'

const route = useRoute()
const router = useRouter()

const filter = computed(() => (isTrendFilter(route.query['filtro']) ? route.query['filtro'] : DEFAULT_TREND_FILTER))
watch(filter, (value) => {
  trends.lastFilter.value = value === DEFAULT_TREND_FILTER ? null : value
}, { immediate: true })

const all = trends.rows
const phase = trends.phase
const visible = computed(() => {
  const test = TREND_FILTERS.find(f => f.id === filter.value)?.test ?? (() => true)
  return all.value.filter(test)
})

const locked = computed(() => trends.offline.value || trends.isSample.value)

const active = computed<string | null>({
  get: () => trends.lastOpened.value,
  set: (value) => {
    trends.lastOpened.value = value
  },
})

function open(row: Trend, title?: HTMLElement | null): void {
  trends.lastOpened.value = row.id
  markTravel(title)
  void router.push(`/busqueda/tendencias/${encodeURIComponent(row.id)}`)
}

/* ── Buscar ────────────────────────────────────────────── */

const scanning = ref(false)

async function scan(): Promise<void> {
  if (scanning.value || locked.value) return
  scanning.value = true
  announce(radar.scan.started)
  try {
    const result = await radarApi.scan()
    toast(radar.scan.done(result.total_found, result.new_trends))
    await trends.load()
  }
  catch (err) {
    toast(failureText(err, radar.scan.failed), { tone: 'error' })
  }
  finally {
    scanning.value = false
  }
}

const emptyTitle = computed(() => (all.value.length ? radar.empty.none : radar.empty.title))
</script>

<template>
  <section class="px-4 pt-10 pb-20 md:px-10 md:pt-12 xl:px-16 xl:pt-14">
    <header class="flex max-w-[1080px] flex-wrap items-baseline gap-x-4 gap-y-5">
      <h1 class="m-0 animate-rise text-display">
        {{ radar.title }}
      </h1>
      <span v-if="phase === 'ready'" class="animate-rise text-title font-[420] text-faint tabular-nums stagger [--i:1]">{{ all.length }}</span>
      <div class="flex animate-rise flex-wrap items-center gap-2 stagger [--i:2] md:ml-auto">
        <Button
          variant="primary"
          :aria-busy="scanning || undefined"
          :aria-disabled="locked || scanning ? 'true' : undefined"
          :aria-describedby="locked ? LOCKED_ID : undefined"
          :class="locked ? 'aria-disabled:opacity-45' : ''"
          @click="scan"
        >
          <Spinner v-if="scanning" :live="false" show-label :label="radar.scan.running" />
          <template v-else>
            {{ radar.scan.action }}
          </template>
        </Button>
      </div>
    </header>
    <p class="mt-3.5 mb-0 max-w-[60ch] animate-rise text-lead text-dim stagger [--i:2]">
      {{ radar.lead }}
    </p>

    <ErosNotice
      class="mt-8"
      :offline="trends.offline.value"
      :sample="trends.isSample.value ? radar.sample : null"
      :title="radar.offline.title"
      :text="radar.offline.text"
      :described-id="LOCKED_ID"
      :retrying="trends.fetching.value"
      @retry="trends.load()"
    />

    <ListFilters
      v-if="all.length"
      class="mt-9 max-w-[1080px]"
      :filters="TREND_FILTERS"
      :rows="all"
      :active="filter"
      :fallback="DEFAULT_TREND_FILTER"
      :label="radar.filters.label"
    />

    <div class="mt-8 max-w-[1080px]" :aria-busy="scanning || undefined">
      <Skeleton v-if="phase === 'loading' || phase === 'idle'" :count="4" />
      <ErrorState
        v-else-if="phase === 'error'"
        :title="radar.loadFailed"
        :message="trends.error.value?.message ?? ''"
        :retrying="trends.fetching.value"
        @retry="trends.load()"
      />
      <EmptyState v-else-if="phase === 'offline'" :title="radar.empty.offlineTitle" :text="radar.empty.offlineText" />
      <EmptyState v-else-if="!visible.length" :title="emptyTitle" :text="all.length ? radar.empty.filtered : radar.empty.text" />
      <TrendRows v-else v-model:active="active" :trends="visible" @open="open" />
    </div>
  </section>
</template>
