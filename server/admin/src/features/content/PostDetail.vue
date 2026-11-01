<script setup lang="ts">
/**
 * Una publicación ocupa la pantalla sola: «← Publicaciones» (con el filtro de donde se vino), el
 * encabezado con sus acciones y los cuatro formatos como pestañas (LinkedIn, Hilo, Dev.to y
 * Carrusel). La pestaña elegida queda en la dirección (?formato=), así recargar deja el mismo lugar.
 * Se lee la copia de la lista enseguida y Eros la pone al día (GET /content/posts/:id).
 */
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useRecordTitle } from '../../shell/title'
import Button from '../../ui/Button.vue'
import { ui } from '../../ui/dict'
import ErrorState from '../../ui/ErrorState.vue'
import Icon from '../../ui/Icon.vue'
import Skeleton from '../../ui/Skeleton.vue'
import Tabs, { type TabItem } from '../../ui/Tabs.vue'
import { contentApi } from './api'
import { content, post as t } from './dict'
import { isSampleRow } from './erosList'
import FormatCarousel from './formats/FormatCarousel.vue'
import FormatText from './formats/FormatText.vue'
import { DEFAULT_FORMAT, isPostFormat, postTitle, type PostFormat } from './model'
import PostHead from './PostHead.vue'
import { posts } from './store'
import { useErosRecord } from './useErosRecord'

const props = defineProps<{ id: string }>()

const LOCKED_ID = 'publicacion-bloqueada'
const route = useRoute()
const router = useRouter()

const { record, phase, error, reload } = useErosRecord(() => props.id, posts, id => contentApi.post(id))

useRecordTitle(() => (record.value ? postTitle(record.value) : null))

const back = computed(() => ({ path: '/busqueda/publicaciones', query: posts.lastFilter.value ? { filtro: posts.lastFilter.value } : {} }))

const locked = computed(() => {
  if (!record.value) return null
  if (isSampleRow(record.value)) return t.locked.sample
  return posts.offline.value || phase.value === 'offline' ? t.locked.offline : null
})

const tabs = computed<TabItem[]>(() => {
  const p = record.value
  return [
    { id: 'linkedin', label: t.formats.linkedin },
    { id: 'hilo', label: t.formats.thread, count: p?.twitter_thread.length || undefined },
    { id: 'devto', label: t.formats.devto },
    { id: 'carrusel', label: t.formats.carousel, count: p?.carousel_slides.length || undefined },
  ]
})

const format = computed<string>({
  get: () => (isPostFormat(route.query['formato']) ? route.query['formato'] : DEFAULT_FORMAT),
  set: (value) => {
    const next = value as PostFormat
    void router.replace({ path: route.path, query: { ...route.query, formato: next === DEFAULT_FORMAT ? undefined : next } })
  },
})
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
      <PostHead :post="record" :locked="locked" :locked-id="LOCKED_ID" />
      <p v-if="locked" :id="LOCKED_ID" class="mt-4 mb-0 max-w-[68ch] text-label text-faint">
        {{ locked }}
      </p>
      <p class="mt-3 mb-0 inline-flex items-center gap-2 text-label text-faint" data-origin>
        <span class="size-1.5 shrink-0 rounded-full" :class="isSampleRow(record) ? 'bg-faint' : 'bg-ok'" aria-hidden="true" />
        {{ isSampleRow(record) ? content.origin.demo : content.origin.eros }}
      </p>

      <Tabs v-model="format" class="mt-9 max-w-[1080px]" :tabs="tabs" :label="t.formats.label">
        <template #default="{ tab }">
          <FormatCarousel v-if="tab.id === 'carrusel'" :key="record.id" :post="record" />
          <FormatText v-else :post="record" :format="tab.id === 'hilo' ? 'hilo' : tab.id === 'devto' ? 'devto' : 'linkedin'" />
        </template>
      </Tabs>
    </template>

    <template v-else-if="phase === 'loading'">
      <h1 class="m-0 text-heading text-faint">
        {{ content.title }}
      </h1>
      <div class="mt-10 max-w-[720px]">
        <Skeleton variant="text" :count="6" />
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
