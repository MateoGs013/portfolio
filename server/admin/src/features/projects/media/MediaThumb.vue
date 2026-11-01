<script setup lang="ts">
/**
 * La vista previa de una pieza: el archivo en cola (blob:) si hay uno, si no lo guardado (la imagen,
 * o el póster de un video; un video sin póster se muestra quieto en su primer cuadro). Las capturas
 * de celular se ven enteras, sin recortar. Encima, cómo va la subida mientras se guarda. Si el archivo
 * ya no está en el servidor (un despliegue sin volumen lo pierde), lo dice en lugar de un hueco.
 */
import { computed, ref } from 'vue'
import Spinner from '../../../ui/Spinner.vue'
import { useProject } from '../context'
import type { MediaForm } from '../types'
import { mediaText } from './dict'
import { useMediaQueue } from './mediaQueue'

const props = defineProps<{ item: MediaForm }>()

const t = mediaText
const { record } = useProject()
const queue = useMediaQueue()

const saved = computed(() => (props.item.id === null ? null : record.value?.media.find(m => m.id === props.item.id) ?? null))
const state = computed(() => queue.states.value[props.item.key] ?? null)

/** Lo que se muestra: imagen (src) o video quieto (video), del archivo nuevo o de lo guardado. */
const view = computed<{ image: string | null, video: string | null }>(() => {
  const key = props.item.key
  const fresh = props.item.upload.file ? queue.preview(key, 'file') : null
  const poster = (props.item.upload.poster ? queue.preview(key, 'poster') : null) ?? saved.value?.poster ?? null
  if (props.item.kind === 'IMAGE') return { image: fresh ?? saved.value?.src ?? null, video: null }
  if (fresh) return { image: null, video: fresh }
  return poster ? { image: poster, video: null } : { image: null, video: saved.value?.src ?? null }
})

/** La dirección que no cargó: si cambia (un archivo nuevo en cola), se vuelve a intentar. */
const broken = ref<string | null>(null)
const shown = computed(() => view.value.image ?? view.value.video)
const missing = computed(() => !!shown.value && broken.value === shown.value)

const mobile = computed(() => props.item.viewport === 'MOBILE')
const fit = computed(() => (mobile.value ? 'object-contain' : 'object-cover'))
</script>

<template>
  <div class="relative aspect-[16/10] w-full overflow-hidden rounded-media bg-surface">
    <span v-if="missing" class="grid size-full place-items-center px-4 text-center text-label text-faint">{{ t.card.missingFile }}</span>
    <img
      v-else-if="view.image"
      :src="view.image"
      alt=""
      loading="lazy"
      decoding="async"
      class="block size-full"
      :class="fit"
      @error="broken = view.image"
    >
    <video
      v-else-if="view.video"
      :src="view.video"
      muted
      playsinline
      preload="metadata"
      class="block size-full"
      :class="fit"
      aria-hidden="true"
      tabindex="-1"
      @error="broken = view.video"
    />
    <span v-else class="grid size-full place-items-center text-label text-faint">{{ t.card.noPreview }}</span>

    <span
      v-if="item.kind === 'VIDEO'"
      class="absolute bottom-2 left-2 rounded-kbd bg-bg/80 px-1.5 py-0.5 text-meta text-ink"
    >{{ t.card.video }}</span>

    <span
      v-if="state && state.phase !== 'error'"
      class="absolute inset-0 grid animate-enter place-items-center bg-bg/70 text-ink"
    >
      <Spinner
        v-if="state.phase === 'uploading'"
        :live="false"
        :label="t.queue.uploading"
        show-label
      />
      <span v-else class="text-label">{{ state.phase === 'done' ? t.queue.done : t.queue.waiting }}</span>
    </span>
  </div>
</template>
