<script setup lang="ts">
/**
 * Los archivos de una pieza: «Reemplazar archivo» (del mismo tipo: conserva la fila, su inglés y los
 * pasos que la muestran), la versión WebM de un video MP4 y el póster de un video. Todo queda en cola
 * hasta Guardar, con su nombre y «Deshacer». Una imagen nueva recalcula su color.
 */
import { computed, ref } from 'vue'
import { toast } from '../../../stores/toasts'
import { announce } from '../../../ui/announce'
import Button from '../../../ui/Button.vue'
import { useProject } from '../context'
import { mediaText } from './dict'
import { ACCEPT_IMAGE, ACCEPT_VIDEO, fileProblem, viewportOf } from './files'
import { useMediaQueue, type Slot } from './mediaQueue'
import { safeTint } from './tint'

const props = defineProps<{ index: number, name: string, locked: boolean }>()

const t = mediaText.card
const { form, record } = useProject()
const queue = useMediaQueue()
const item = computed(() => form.value.media[props.index]!)
const saved = computed(() => (item.value.id === null ? null : record.value?.media.find(m => m.id === item.value.id) ?? null))
const isVideo = computed(() => item.value.kind === 'VIDEO')

/** El video principal es MP4 (el nuevo en cola o el guardado): solo así lleva una versión WebM. */
const isMp4 = computed(() => {
  if (!isVideo.value) return false
  const fresh = item.value.upload.file ? queue.get(item.value.key, 'file') : null
  return fresh ? fresh.type === 'video/mp4' : !!saved.value?.src.endsWith('.mp4')
})

const fileInput = ref<HTMLInputElement | null>(null)
const webmInput = ref<HTMLInputElement | null>(null)
const posterInput = ref<HTMLInputElement | null>(null)

function pick(slot: Slot): void {
  if (props.locked) return
  const input = slot === 'file' ? fileInput : slot === 'webm' ? webmInput : posterInput
  input.value?.click()
}

async function refresh(file: File): Promise<void> {
  const piece = item.value
  const [viewport, tint] = await Promise.all([viewportOf(file), safeTint(file)])
  piece.viewport = viewport
  if (tint) piece.tint = tint
}

function onPicked(slot: Slot, event: Event): void {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return
  const want = slot === 'file' ? item.value.kind : slot
  const problem = fileProblem(file, want)
  if (problem) {
    toast(problem, { tone: 'error' })
    return
  }
  // Un WebM como video principal no lleva otra versión WebM.
  if (slot === 'file' && file.type === 'video/webm' && item.value.upload.webm) undo('webm')
  queue.put(item.value.key, slot, file)
  item.value.upload[slot] = file.name
  if (slot === 'file' && item.value.kind === 'IMAGE') void refresh(file)
  if (slot === 'poster') void safeTint(file).then((tint) => {
    if (tint) item.value.tint = tint
  })
  announce(slot === 'file' ? t.replacing(file.name) : slot === 'webm' ? t.webmQueued(file.name) : t.posterQueued(file.name))
}

function undo(slot: Slot): void {
  queue.take(item.value.key, slot)
  item.value.upload[slot] = null
  if (slot === 'file' && saved.value) item.value.tint = saved.value.tint ?? ''
}

/** Lo que espera en cola para esta pieza ya guardada (una nueva muestra su archivo en la tarjeta). */
const queued = computed(() => {
  const { upload } = item.value
  const list: { slot: Slot, text: string }[] = []
  if (upload.file && item.value.id !== null) list.push({ slot: 'file', text: t.replacing(upload.file) })
  if (upload.webm) list.push({ slot: 'webm', text: t.webmQueued(upload.webm) })
  if (upload.poster) list.push({ slot: 'poster', text: t.posterQueued(upload.poster) })
  return list
})

const hasPoster = computed(() => !!item.value.upload.poster || !!saved.value?.poster)
const hasWebm = computed(() => !!item.value.upload.webm || !!saved.value?.srcWebm)
</script>

<template>
  <div class="grid gap-3">
    <input ref="fileInput" type="file" hidden :accept="isVideo ? ACCEPT_VIDEO : ACCEPT_IMAGE" @change="onPicked('file', $event)">
    <input ref="webmInput" type="file" hidden accept="video/webm" @change="onPicked('webm', $event)">
    <input ref="posterInput" type="file" hidden :accept="ACCEPT_IMAGE" @change="onPicked('poster', $event)">

    <div class="flex flex-wrap items-center gap-x-1 gap-y-2">
      <Button variant="ghost" icon="upload" :disabled="locked" :title="t.replaceHint" @click="pick('file')">
        {{ t.replace }}
      </Button>
      <Button v-if="isMp4" variant="ghost" :disabled="locked" @click="pick('webm')">
        {{ hasWebm ? t.webmChange : t.webm }}
      </Button>
      <Button v-if="isVideo" variant="ghost" :disabled="locked" :title="t.posterHint" @click="pick('poster')">
        {{ hasPoster ? t.posterChange : t.poster }}
      </Button>
    </div>

    <ul v-if="queued.length" class="m-0 grid list-none gap-1.5 p-0" :aria-label="name">
      <li v-for="entry in queued" :key="entry.slot" class="flex flex-wrap items-baseline gap-x-3 text-label text-dim">
        <span class="min-w-0 wrap-break-word">{{ entry.text }}</span>
        <button
          type="button"
          class="rounded-control border-0 bg-transparent p-0 text-label text-ink underline decoration-rule-strong underline-offset-4 transition-colors duration-120 ease-e hover:decoration-ink disabled:opacity-45"
          :disabled="locked"
          @click="undo(entry.slot)"
        >
          {{ t.undo }}
        </button>
      </li>
    </ul>
  </div>
</template>
