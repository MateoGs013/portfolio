<script setup lang="ts">
/**
 * La cola como pantalla (dirección elegida): título en display, las acciones a la derecha, el resumen
 * de GET /hunter/stats, filtros de texto, la búsqueda y filas grandes que entran escalonadas. Elegir
 * una fila lleva su título viajando al encabezado de la vacante. La fila marcada sigue al filtro: si
 * la última abierta no está en lo que se ve, queda marcada la primera.
 */
import type { HunterJob } from '@shared/hunterContracts'
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onShortcut } from '../../composables/useShortcuts'
import { markTravel } from '../../shell/transition'
import { toast } from '../../stores/toasts'
import EmptyState from '../../ui/EmptyState.vue'
import ErrorState from '../../ui/ErrorState.vue'
import Skeleton from '../../ui/Skeleton.vue'
import { failureText, hunterApi } from './adapter'
import { hunter } from './dict'
import ManualJob from './ManualJob.vue'
import { DEFAULT_FILTER, filterTest, isQueueFilter, matchesText } from './model'
import QueueActions from './QueueActions.vue'
import QueueFilters from './QueueFilters.vue'
import QueueNotice from './QueueNotice.vue'
import QueueRows from './QueueRows.vue'
import QueueSearch from './QueueSearch.vue'
import { allJobs, isSampleQueue, lastFilter, lastOpened, loadQueue, offline, queueError, queuePhase, queueStats } from './store'

const route = useRoute()
const router = useRouter()

const filter = computed(() => (isQueueFilter(route.query['filtro']) ? route.query['filtro'] : DEFAULT_FILTER))
watch(filter, (value) => {
  lastFilter.value = value
}, { immediate: true })

const query = ref('')
const affinity = ref(false)
const semantic = shallowRef<{ query: string, results: HunterJob[] } | null>(null)
const searching = ref(false)

watch(affinity, (on) => {
  if (!on) semantic.value = null
})

async function runSemantic(): Promise<void> {
  const q = query.value.trim()
  if (!q || searching.value) return
  searching.value = true
  try {
    const { results } = await hunterApi.semantic(q)
    semantic.value = { query: q, results }
  }
  catch (err) {
    toast(failureText(err, hunter.search.failed), { tone: 'error' })
  }
  finally {
    searching.value = false
  }
}

const visible = computed<HunterJob[]>(() => {
  const test = filterTest(filter.value)
  if (semantic.value) return semantic.value.results.filter(test)
  return allJobs.value.filter(test).filter(job => matchesText(job, query.value))
})

const locked = computed(() => (offline.value ? hunter.offline.readOnly : isSampleQueue.value ? hunter.sample : null))

const stats = computed(() => {
  const s = queueStats.value
  return s ? hunter.summary({ total: s.total, high: s.high_match_count, pending: s.pending_eval_count, applied: s.applied_count }) : null
})

const emptyTitle = computed(() => (allJobs.value.length || semantic.value ? hunter.empty.none : hunter.empty.title))
const emptyText = computed(() => {
  if (semantic.value) return hunter.empty.search(semantic.value.query)
  if (query.value.trim()) return hunter.empty.search(query.value.trim())
  return allJobs.value.length ? hunter.empty.filtered : hunter.empty.text
})

/** La fila marcada: la última que se abrió (la lista la cambia por la primera si no está a la vista). */
const active = computed<string | null>({
  get: () => lastOpened.value,
  set: (value) => {
    lastOpened.value = value
  },
})

/* ── Abrir ─────────────────────────────────────────────── */

const pasteOpen = ref(false)

function open(job: HunterJob, title?: HTMLElement | null): void {
  lastOpened.value = job.id
  markTravel(title)
  void router.push(`/busqueda/vacantes/${encodeURIComponent(job.id)}/analisis`)
}

function onCreated(job: HunterJob): void {
  toast(hunter.manual.added)
  open(job)
}

// La paleta y el inicio llegan con ?pegar=1: se abre el formulario y la dirección queda limpia.
watch(() => route.query['pegar'], (value) => {
  if (value !== '1') return
  pasteOpen.value = true
  const { pegar: _drop, ...rest } = route.query
  void router.replace({ path: route.path, query: rest })
}, { immediate: true })

const search = ref<InstanceType<typeof QueueSearch> | null>(null)
onShortcut('new', () => {
  pasteOpen.value = true
})
onShortcut('search', () => void nextTick(() => search.value?.focus()))
</script>

<template>
  <section class="px-4 pt-10 pb-20 md:px-10 md:pt-12 xl:px-16 xl:pt-14">
    <header class="flex max-w-[1080px] flex-wrap items-baseline gap-x-4 gap-y-5">
      <h1 class="m-0 animate-rise text-display">
        {{ hunter.title }}
      </h1>
      <span v-if="queuePhase !== 'loading'" class="animate-rise text-title font-[420] text-faint tabular-nums stagger [--i:1]">{{ allJobs.length }}</span>
      <QueueActions class="animate-rise stagger [--i:2] md:ml-auto" :locked="locked" @paste="pasteOpen = true" />
    </header>
    <p class="mt-3.5 mb-0 max-w-[72ch] animate-rise text-lead text-dim stagger [--i:2]">
      {{ hunter.lead }}
      <span v-if="stats" class="text-body text-faint tabular-nums">{{ stats }}</span>
    </p>

    <QueueNotice class="mt-4 max-w-[1080px]" :locked="locked" @retry="loadQueue()" />

    <div class="mt-7 grid max-w-[1080px] gap-4">
      <div class="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <QueueFilters :jobs="semantic ? semantic.results : allJobs" :active="filter" />
        <QueueSearch
          ref="search"
          v-model:query="query"
          v-model:affinity="affinity"
          :offline="offline || isSampleQueue"
          :pending="searching"
          :showing-results="!!semantic"
          @search="runSemantic"
          @clear="affinity = false"
        />
      </div>
      <p v-if="semantic" class="m-0 text-body text-dim" role="status">
        {{ hunter.search.results(semantic.results.length, semantic.query) }}
      </p>
    </div>

    <div class="mt-6 max-w-[1080px]">
      <Skeleton v-if="queuePhase === 'loading' || queuePhase === 'idle'" :count="5" />
      <ErrorState
        v-else-if="queuePhase === 'error'"
        :title="hunter.loadFailed"
        :message="queueError?.message ?? ''"
        @retry="loadQueue()"
      />
      <EmptyState v-else-if="!visible.length" :title="emptyTitle" :text="emptyText" />
      <QueueRows v-else v-model:active="active" :jobs="visible" :semantic="!!semantic" @open="open" />
    </div>

    <ManualJob v-model:open="pasteOpen" @created="onCreated" />
  </section>
</template>
