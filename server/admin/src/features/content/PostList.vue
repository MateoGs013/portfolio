<script setup lang="ts">
/**
 * Publicaciones como pantalla (dirección elegida): título en display con la cuenta (solo si Eros
 * respondió: sin Eros no hay un cero que mostrar), «Generar una publicación» a la derecha, filtros
 * por estado (?filtro=) y filas grandes que entran escalonadas. Elegir una fila lleva su título
 * viajando al encabezado del registro. Sin Eros, la lista dice por qué está vacía: nada inventado.
 */
import type { ContentPost } from '@shared/contentContracts'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onShortcut } from '../../composables/useShortcuts'
import { markTravel } from '../../shell/transition'
import { toast } from '../../stores/toasts'
import Button from '../../ui/Button.vue'
import EmptyState from '../../ui/EmptyState.vue'
import ErrorState from '../../ui/ErrorState.vue'
import Skeleton from '../../ui/Skeleton.vue'
import { contentApi } from './api'
import { content } from './dict'
import ErosNotice from './ErosNotice.vue'
import GenerateDialog from './GenerateDialog.vue'
import ListFilters from './ListFilters.vue'
import { DEFAULT_POST_FILTER, isPostFilter, POST_FILTERS } from './model'
import PostRows from './PostRows.vue'
import { posts } from './store'

const LOCKED_ID = 'publicaciones-bloqueadas'

const route = useRoute()
const router = useRouter()

const filter = computed(() => (isPostFilter(route.query['filtro']) ? route.query['filtro'] : DEFAULT_POST_FILTER))
watch(filter, (value) => {
  posts.lastFilter.value = value === DEFAULT_POST_FILTER ? null : value
}, { immediate: true })

const all = posts.rows
const phase = posts.phase
const visible = computed(() => {
  const test = POST_FILTERS.find(f => f.id === filter.value)?.test ?? (() => true)
  return all.value.filter(test)
})

/** Generar necesita a Eros de verdad: sin él, o con la muestra, el botón dice por qué no. */
const locked = computed(() => posts.offline.value || posts.isSample.value)

const active = computed<string | null>({
  get: () => posts.lastOpened.value,
  set: (value) => {
    posts.lastOpened.value = value
  },
})

function open(post: ContentPost, title?: HTMLElement | null): void {
  posts.lastOpened.value = post.id
  markTravel(title)
  void router.push(`/busqueda/publicaciones/${encodeURIComponent(post.id)}`)
}

/* ── Generar ───────────────────────────────────────────── */

const generateOpen = ref(false)

function startGenerate(): void {
  if (!locked.value) generateOpen.value = true
}

async function generate(...args: Parameters<typeof contentApi.generate>): Promise<ContentPost | null> {
  const { post } = await contentApi.generate(...args)
  // Entra a la lista ya: es la que Eros acaba de escribir (la próxima lectura de la lista la trae igual).
  if (post) posts.upsert(post)
  return post
}

function onCreated(post: ContentPost | null): void {
  if (post) open(post)
}

// La paleta llega con ?generar=1: se abre el formulario y la dirección queda limpia.
watch(() => route.query['generar'], (value) => {
  if (value !== '1') return
  const { generar: _drop, ...rest } = route.query
  void router.replace({ path: route.path, query: rest })
  void posts.load(false).then(() => {
    if (locked.value) toast(posts.isSample.value ? content.sampleGenerate : content.offline.locked, { tone: 'info' })
    else startGenerate()
  })
}, { immediate: true })

onShortcut('new', startGenerate)

const emptyTitle = computed(() => (all.value.length ? content.empty.none : content.empty.title))
</script>

<template>
  <section class="px-4 pt-10 pb-20 md:px-10 md:pt-12 xl:px-16 xl:pt-14">
    <header class="flex max-w-[1080px] flex-wrap items-baseline gap-x-4 gap-y-5">
      <h1 class="m-0 animate-rise text-display">
        {{ content.title }}
      </h1>
      <span v-if="phase === 'ready'" class="animate-rise text-title font-[420] text-faint tabular-nums stagger [--i:1]">{{ all.length }}</span>
      <div class="flex animate-rise flex-wrap items-center gap-2 stagger [--i:2] md:ml-auto">
        <Button
          variant="primary"
          shortcut="n"
          :aria-disabled="locked ? 'true' : undefined"
          :aria-describedby="locked ? LOCKED_ID : undefined"
          :class="locked ? 'aria-disabled:opacity-45' : ''"
          @click="startGenerate"
        >
          {{ content.generate }}
        </Button>
      </div>
    </header>
    <p class="mt-3.5 mb-0 max-w-[60ch] animate-rise text-lead text-dim stagger [--i:2]">
      {{ content.lead }}
    </p>

    <ErosNotice
      class="mt-8"
      :offline="posts.offline.value"
      :sample="posts.isSample.value ? content.sample : null"
      :title="content.offline.title"
      :text="content.offline.text"
      :described-id="LOCKED_ID"
      :retrying="posts.fetching.value"
      @retry="posts.load()"
    />

    <ListFilters
      v-if="all.length"
      class="mt-9 max-w-[1080px]"
      :filters="POST_FILTERS"
      :rows="all"
      :active="filter"
      :fallback="DEFAULT_POST_FILTER"
      :label="content.filters.label"
    />

    <div class="mt-8 max-w-[1080px]">
      <Skeleton v-if="phase === 'loading' || phase === 'idle'" :count="4" />
      <ErrorState
        v-else-if="phase === 'error'"
        :title="content.loadFailed"
        :message="posts.error.value?.message ?? ''"
        :retrying="posts.fetching.value"
        @retry="posts.load()"
      />
      <EmptyState v-else-if="phase === 'offline'" :title="content.empty.offlineTitle" :text="content.empty.offlineText" />
      <EmptyState v-else-if="!visible.length" :title="emptyTitle" :text="all.length ? content.empty.filtered : content.empty.text">
        <Button v-if="!all.length && !locked" variant="secondary" @click="startGenerate">
          {{ content.generate }}
        </Button>
      </EmptyState>
      <PostRows v-else v-model:active="active" :posts="visible" @open="open" />
    </div>

    <GenerateDialog v-model:open="generateOpen" :run="generate" @created="onCreated" />
  </section>
</template>
