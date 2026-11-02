<script setup lang="ts">
/**
 * Las entradas de la experiencia del CV, en su orden. Cada una tiene un asa: con el mouse se arrastra
 * la fila; con el teclado, el foco en el asa y ↑ ↓ (Inicio y Fin a los extremos). El lector anuncia el
 * puesto nuevo y el foco sigue en el asa de la entrada que se movió. El nombre lleva a su editor.
 */
import { nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useId } from '../../composables/useId'
import { enumLabel } from '../../models/labels'
import { announce } from '../../ui/announce'
import Icon from '../../ui/Icon.vue'
import IconButton from '../../ui/IconButton.vue'
import { experience as t, periodText } from './dict'
import { experienceModel } from './model'
import { titleOf, type Experience } from './record'

const props = defineProps<{ entries: Experience[], disabled?: boolean }>()
const emit = defineEmits<{ move: [from: number, to: number], remove: [id: number] }>()

const list = ref<HTMLElement | null>(null)
const helpId = useId('orden')
const dragging = ref<number | null>(null)

async function moveTo(from: number, to: number): Promise<void> {
  const entry = props.entries[from]
  if (!entry || to < 0 || to >= props.entries.length || to === from) return
  emit('move', from, to)
  await nextTick()
  list.value?.querySelector<HTMLElement>(`[data-handle="${entry.id}"]`)?.focus()
  announce(t.cv.moved(titleOf(entry), to + 1, props.entries.length))
}

function onKeydown(event: KeyboardEvent, index: number): void {
  const last = props.entries.length - 1
  const targets: Record<string, number> = { ArrowUp: index - 1, ArrowDown: index + 1, Home: 0, End: last }
  const to = targets[event.key]
  if (to === undefined || event.altKey || event.ctrlKey || event.metaKey) return
  event.preventDefault()
  void moveTo(index, to)
}

function remove(entry: Experience, index: number): void {
  emit('remove', entry.id)
  announce(t.cv.removed(titleOf(entry)))
  void nextTick(() => {
    const handles = list.value?.querySelectorAll<HTMLElement>('[data-handle]')
    handles?.[Math.min(index, handles.length - 1)]?.focus()
  })
}

/* ── Arrastrar con el mouse: la lista se reordena mientras pasa por encima ── */

function onDragStart(event: DragEvent, id: number): void {
  dragging.value = id
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(id))
  }
}

function onDragEnter(index: number): void {
  if (dragging.value === null) return
  const from = props.entries.findIndex(e => e.id === dragging.value)
  if (from >= 0 && from !== index) emit('move', from, index)
}

function onDragEnd(): void {
  const entry = props.entries.find(e => e.id === dragging.value)
  dragging.value = null
  if (entry) announce(t.cv.moved(titleOf(entry), props.entries.indexOf(entry) + 1, props.entries.length))
}

const meta = (e: Experience) => [enumLabel('ExperienceKind', e.kind), periodText(e.startedAt, e.endedAt)].filter(Boolean).join(' · ')
</script>

<template>
  <div class="grid gap-3">
    <ol v-if="entries.length" ref="list" class="m-0 grid list-none border-t border-rule p-0" data-cv-order>
      <li
        v-for="(entry, index) in entries"
        :key="entry.id"
        :draggable="!disabled"
        :data-entry="entry.slug"
        class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 border-b border-rule py-2.5 transition-opacity duration-200 ease-e"
        :class="dragging === entry.id ? 'opacity-40' : ''"
        @dragstart="onDragStart($event, entry.id)"
        @dragenter.prevent="onDragEnter(index)"
        @dragover.prevent
        @drop.prevent
        @dragend="onDragEnd"
      >
        <button
          type="button"
          :data-handle="entry.id"
          :aria-label="t.cv.handle(titleOf(entry), index + 1, entries.length)"
          :aria-describedby="helpId"
          aria-keyshortcuts="ArrowUp ArrowDown Home End"
          :disabled="disabled"
          class="grid size-8 cursor-grab place-items-center rounded-control border-0 bg-transparent text-faint transition-colors duration-120 ease-e hover:bg-surface hover:text-ink active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-45"
          @keydown="onKeydown($event, index)"
        >
          <Icon name="drag" :size="16" />
        </button>
        <span class="grid min-w-0 gap-0.5">
          <RouterLink
            :to="experienceModel.routes.record(entry.id)"
            class="truncate rounded-control text-row text-ink no-underline transition-colors duration-120 ease-e hover:text-dim"
          >{{ titleOf(entry) }}</RouterLink>
          <span class="truncate text-label text-faint">{{ meta(entry) }}</span>
        </span>
        <IconButton icon="close" size="sm" :label="t.cv.remove(titleOf(entry))" :disabled="disabled" @click="remove(entry, index)" />
      </li>
    </ol>
    <p v-else class="m-0 border-y border-rule py-4 text-body text-faint">
      {{ t.cv.emptyOrder }}
    </p>
    <p :id="helpId" class="m-0 text-label text-faint">
      {{ t.cv.orderHelp }}
    </p>
  </div>
</template>
