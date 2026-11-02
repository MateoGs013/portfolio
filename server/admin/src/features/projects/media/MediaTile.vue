<script setup lang="ts">
/**
 * Una pieza en la grilla de Imágenes, cerrada: la vista previa, qué es (Portada · Escritorio), su
 * peso y medidas, y el texto alternativo en dos líneas. Abrirla despliega su formulario (MediaCard)
 * a todo el ancho de la grilla. El asa se arrastra con el mouse; con el teclado se ordena desde la
 * pieza abierta (Subir y Bajar).
 */
import { computed } from 'vue'
import Icon from '../../../ui/Icon.vue'
import StatusDot from '../../../ui/StatusDot.vue'
import { useProject } from '../context'
import { mediaText } from './dict'
import { sizeLabel } from './files'
import { pieceHeading, pieceName } from './mediaForm'
import { useMediaQueue } from './mediaQueue'
import MediaThumb from './MediaThumb.vue'

const props = defineProps<{
  index: number
  handle: Record<string, unknown>
}>()

defineEmits<{ open: [] }>()

const t = mediaText
const { form, record } = useProject()
const queue = useMediaQueue()
const item = computed(() => form.value.media[props.index]!)
const name = computed(() => pieceName(form.value.media, item.value))
const heading = computed(() => pieceHeading(item.value))
const saved = computed(() => (item.value.id === null ? null : record.value?.media.find(m => m.id === item.value.id) ?? null))
const failed = computed(() => queue.states.value[item.value.key]?.phase === 'error')

const facts = computed(() => {
  const row = saved.value
  if (!row) return ''
  return [sizeLabel(row.bytes), row.width && row.height ? `${row.width}×${row.height}` : ''].filter(Boolean).join(' · ')
})
const tint = computed(() => (item.value.tint.trim() ? { backgroundColor: item.value.tint.trim() } : null))
</script>

<template>
  <article class="group relative grid gap-2.5" :data-media-key="item.key" :aria-label="name">
    <button
      type="button"
      class="grid gap-2.5 rounded-media border-0 bg-transparent p-0 text-left text-ink transition-opacity duration-200 ease-e hover:opacity-90"
      aria-expanded="false"
      data-move="open"
      @click="$emit('open')"
    >
      <!-- El nombre accesible sale del contenido («Editar Portada · Escritorio…»): sin aria-label que no coincida con lo visible. -->
      <span class="sr-only">{{ t.tile.edit }}</span>
      <MediaThumb :item="item" />
      <span class="grid gap-1 px-0.5">
        <span class="flex min-w-0 items-center gap-2">
          <span class="truncate text-body font-[520]">{{ heading }}</span>
          <span v-if="tint" class="size-2.5 shrink-0 rounded-full" :style="tint" aria-hidden="true" />
        </span>
        <span v-if="facts" class="text-meta text-faint tabular-nums">{{ facts }}</span>
        <span v-if="item.alt.trim()" class="line-clamp-2 text-label text-dim">{{ item.alt }}</span>
        <span v-else class="text-label text-wip">{{ t.tile.noAlt }}</span>
      </span>
    </button>
    <StatusDot v-if="failed" tone="danger" :label="t.queue.failed" />
    <span
      v-bind="handle"
      class="absolute top-2 right-2 grid size-7 cursor-grab place-items-center rounded-control bg-bg/80 text-faint opacity-0 transition-opacity duration-120 ease-e group-hover:opacity-100 hover:text-ink active:cursor-grabbing"
      :title="t.card.drag(name)"
      aria-hidden="true"
    >
      <Icon name="drag" :size="16" />
    </span>
  </article>
</template>
