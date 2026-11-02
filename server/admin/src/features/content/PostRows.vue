<script setup lang="ts">
/**
 * Las filas de Publicaciones: el título grande a la izquierda y a la derecha el enfoque, la obra de
 * la base, el estado (un punto con su palabra) y la fecha. Es un listbox: Tab entra, ↑↓ o j/k
 * recorren y Enter abre; el título de la fila elegida viaja al encabezado del registro.
 */
import type { ContentPost } from '@shared/contentContracts'
import { computed, ref } from 'vue'
import { options } from '../../stores/meta'
import Listbox from '../../ui/Listbox.vue'
import type { ListboxItem } from '../../ui/listbox'
import StatusDot from '../../ui/StatusDot.vue'
import { content } from './dict'
import { pillarOf, postStatusOf, postTitle, projectOf, shortDay } from './model'

const props = defineProps<{ posts: readonly ContentPost[] }>()

const emit = defineEmits<{ open: [post: ContentPost, title: HTMLElement | null] }>()
const active = defineModel<string | null>('active', { default: null })

interface Row extends ListboxItem {
  key: string
  post: ContentPost
  context: string
  day: string | null
}

const rows = computed<Row[]>(() => props.posts.map(post => ({
  key: post.id,
  title: postTitle(post),
  post,
  context: [pillarOf(post), projectOf(post.project_slug, options.value?.projects)?.title].filter(Boolean).join(' · '),
  day: shortDay(post.created_at ?? post.updated_at),
})))

const root = ref<HTMLElement | null>(null)

function onActivate(row: Row): void {
  const title = root.value?.querySelector<HTMLElement>(`[data-title="${CSS.escape(row.key)}"]`) ?? null
  emit('open', row.post, title)
}
</script>

<template>
  <div ref="root">
    <Listbox v-model:active="active" :items="rows" :label="content.listLabel" @activate="onActivate">
      <template #default="{ item }">
        <span
          class="w-fit max-w-full min-w-0 text-list text-ink transition-transform duration-700 ease-e wrap-break-word group-hover/row:translate-x-3.5"
          :data-title="item.key"
        >{{ item.title }}</span>
        <span class="flex flex-wrap items-baseline justify-start gap-x-4.5 gap-y-1 text-left text-body text-dim lg:justify-end lg:text-right">
          <span v-if="item.context">{{ item.context }}</span>
          <StatusDot :tone="postStatusOf(item.post).tone" :label="postStatusOf(item.post).label" />
          <span v-if="item.day" class="shrink-0 text-faint tabular-nums">{{ item.day }}</span>
        </span>
      </template>
    </Listbox>
  </div>
</template>
