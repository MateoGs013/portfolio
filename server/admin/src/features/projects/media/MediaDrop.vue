<script setup lang="ts">
/**
 * Sumar imágenes o videos a la obra: soltándolos en la zona o con «Elegir archivos» (varios a la
 * vez). Cada uno entra como tarjeta pendiente con su vista previa, el color calculado y la pantalla
 * leída del archivo; la primera de cada tipo queda como portada. Nada sube hasta Guardar, y una obra
 * nueva puede sumarlas antes de existir.
 *
 * Lleva `data-field="media"`: la checklist de publicación y los errores de la sección llegan acá.
 */
import { computed, nextTick, ref } from 'vue'
import { toast } from '../../../stores/toasts'
import { announce } from '../../../ui/announce'
import Button from '../../../ui/Button.vue'
import { useEditorContext } from '../../collections/context'
import { useProject } from '../context'
import type { MediaForm } from '../types'
import { mediaText } from './dict'
import { ACCEPT_ALL, fileProblem, kindOfFile, viewportOf } from './files'
import { coversFirst, hasCover } from './mediaForm'
import { useMediaQueue } from './mediaQueue'
import { safeTint } from './tint'

const t = mediaText.drop
const { form } = useProject()
const queue = useMediaQueue()
const editor = useEditorContext()
const locked = computed(() => queue.running.value || (editor?.busy.value ?? false))
const input = ref<HTMLInputElement | null>(null)
const over = ref(false)
let depth = 0

function choose(): void {
  if (!locked.value) input.value?.click()
}

/** Lo que se calcula del archivo llega después: se aplica a la pieza si sigue en la lista. */
async function readFile(key: string, file: File): Promise<void> {
  const [viewport, tint] = await Promise.all([viewportOf(file), kindOfFile(file) === 'IMAGE' ? safeTint(file) : null])
  const item = form.value.media.find(m => m.key === key)
  if (!item) return
  item.viewport = viewport
  if (tint && !item.tint) item.tint = tint
}

function pieceFor(file: File): MediaForm {
  const kind = kindOfFile(file)!
  const key = queue.newKey()
  queue.put(key, 'file', file)
  return {
    key,
    id: null,
    kind,
    role: hasCover(form.value.media, kind) ? 'GALLERY' : 'COVER',
    viewport: 'DESKTOP',
    alt: '',
    caption: '',
    tint: '',
    upload: { file: file.name, webm: null, poster: null },
    translations: { en: { alt: '', caption: '' } },
  }
}

async function add(files: readonly File[]): Promise<void> {
  if (locked.value || !files.length) return
  const problems = files.map(f => fileProblem(f, 'any')).filter((p): p is string => p !== null)
  const accepted = files.filter(f => fileProblem(f, 'any') === null)
  const added: MediaForm[] = []
  for (const file of accepted) {
    const piece = pieceFor(file)
    form.value.media.push(piece)
    coversFirst(form.value.media)
    added.push(piece)
    void readFile(piece.key, file)
  }
  if (problems.length) toast(`${t.rejected(problems.length)} ${problems.join(' ')}`, { tone: 'error' })
  if (!added.length) return
  announce(t.added(added.length))
  await nextTick()
  document.querySelector<HTMLElement>(`[data-media-key="${added[0]!.key}"] [data-field$=".alt"] input`)?.focus()
}

function onPicked(event: Event): void {
  const target = event.target as HTMLInputElement
  void add([...(target.files ?? [])])
  target.value = ''
}

const hasFiles = (event: DragEvent) => [...(event.dataTransfer?.types ?? [])].includes('Files')

function onEnter(event: DragEvent): void {
  if (!hasFiles(event)) return
  depth++
  over.value = !locked.value
}

function onOver(event: DragEvent): void {
  if (!hasFiles(event)) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = locked.value ? 'none' : 'copy'
}

function onLeave(event: DragEvent): void {
  if (!hasFiles(event)) return
  depth = Math.max(0, depth - 1)
  if (!depth) over.value = false
}

function onDrop(event: DragEvent): void {
  if (!hasFiles(event)) return
  event.preventDefault()
  depth = 0
  over.value = false
  void add([...(event.dataTransfer?.files ?? [])])
}
</script>

<template>
  <div>
    <input ref="input" type="file" multiple :accept="ACCEPT_ALL" hidden @change="onPicked">
    <div
      data-field="media"
      class="grid justify-items-start gap-4 rounded-dialog border border-dashed px-6 py-7 transition-colors duration-200 ease-e md:grid-cols-[1fr_auto] md:items-center"
      :class="over ? 'border-ink bg-surface' : 'border-rule-strong'"
      @dragenter="onEnter"
      @dragover="onOver"
      @dragleave="onLeave"
      @drop="onDrop"
    >
      <div class="grid gap-1">
        <p class="m-0 text-row text-ink">
          {{ over ? t.over : t.title }}
        </p>
        <p class="m-0 max-w-[52ch] text-label text-faint">
          {{ locked ? t.locked : t.text }}
        </p>
      </div>
      <Button icon="upload" :disabled="locked" @click="choose">
        {{ t.choose }}
      </Button>
    </div>
  </div>
</template>
