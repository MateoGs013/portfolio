<script setup lang="ts">
/**
 * Una pieza de la obra: vista previa, uso (portada o galería, una portada por tipo), pantalla
 * (escritorio o celular), texto alternativo y pie con su inglés, color y archivos. El asa se arrastra
 * con el mouse; Subir y Bajar son el camino del teclado y se mueven dentro de su grupo.
 */
import { computed, ref } from 'vue'
import { enumOptions } from '../../../stores/meta'
import { announce } from '../../../ui/announce'
import Field from '../../../ui/Field.vue'
import type { SelectOption } from '../../../ui/field'
import Icon from '../../../ui/Icon.vue'
import IconButton from '../../../ui/IconButton.vue'
import RadioGroup from '../../../ui/RadioGroup.vue'
import StatusDot from '../../../ui/StatusDot.vue'
import BilingualField from '../../collections/BilingualField.vue'
import { useProject } from '../context'
import type { MediaRole, MediaViewport } from '../types'
import { mediaText } from './dict'
import { sizeLabel } from './files'
import MediaFiles from './MediaFiles.vue'
import { makeCover, makeGallery, pieceName } from './mediaForm'
import { useMediaQueue } from './mediaQueue'
import MediaThumb from './MediaThumb.vue'
import MediaTint from './MediaTint.vue'

const props = defineProps<{
  index: number
  canUp: boolean
  canDown: boolean
  locked: boolean
  /** Lo que hace arrastrable al asa (useDragSort.handle). */
  handle: Record<string, unknown>
}>()

defineEmits<{ up: [], down: [], remove: [] }>()

const t = mediaText.card
const { form, record } = useProject()
const queue = useMediaQueue()
const item = computed(() => form.value.media[props.index]!)
const base = computed(() => `media[${props.index}]`)
const name = computed(() => pieceName(form.value.media, item.value))
const saved = computed(() => (item.value.id === null ? null : record.value?.media.find(m => m.id === item.value.id) ?? null))
const state = computed(() => queue.states.value[item.value.key] ?? null)

const roles = computed(() => enumOptions('MediaRole') as SelectOption<MediaRole>[])
const viewports = computed(() => enumOptions('MediaViewport') as SelectOption<MediaViewport>[])

const role = computed<MediaRole | null>({
  get: () => item.value.role,
  set: (next) => {
    const piece = item.value
    if (!next || next === piece.role) return
    if (next === 'GALLERY') return makeGallery(form.value.media, piece)
    const previous = makeCover(form.value.media, piece)
    announce([t.cover(name.value), previous ? t.demoted(pieceName(form.value.media, previous)) : ''].filter(Boolean).join(' '))
  },
})
const viewport = computed<MediaViewport | null>({
  get: () => item.value.viewport,
  set: (next) => {
    if (next) item.value.viewport = next
  },
})

const captionOpen = ref(false)
const showCaption = computed(() => captionOpen.value || !!item.value.caption || !!item.value.translations.en.caption)

/** «Celular · 1,2 MB · 1440×900», o el nombre del archivo nuevo. */
const facts = computed(() => {
  if (item.value.id === null) return item.value.upload.file ?? ''
  const row = saved.value
  if (!row) return ''
  return [sizeLabel(row.bytes), row.width && row.height ? `${row.width}×${row.height}` : '', row.srcWebm ? t.hasWebm : ''].filter(Boolean).join(' · ')
})
</script>

<template>
  <article class="grid gap-6 pt-6 pb-9" :data-media-key="item.key" :aria-labelledby="`${item.key}-title`">
    <div class="flex items-center gap-3">
      <span
        v-bind="handle"
        class="grid size-7 cursor-grab place-items-center rounded-control text-faint transition-colors duration-120 ease-e hover:bg-surface hover:text-ink active:cursor-grabbing"
        :title="t.drag(name)"
        aria-hidden="true"
      >
        <Icon name="drag" :size="16" />
      </span>
      <h3 :id="`${item.key}-title`" class="m-0 text-row text-ink">
        {{ name }}
      </h3>
      <StatusDot v-if="state?.phase === 'error'" tone="danger" :label="mediaText.queue.failed" />
      <StatusDot v-else-if="item.id === null" tone="wip" :label="t.newPiece" />
      <div class="ml-auto flex items-center gap-1">
        <IconButton icon="arrow-up" size="sm" :label="t.up(name)" data-move="up" :disabled="locked || !canUp" @click="$emit('up')" />
        <IconButton icon="arrow-down" size="sm" :label="t.down(name)" data-move="down" :disabled="locked || !canDown" @click="$emit('down')" />
        <IconButton icon="trash" size="sm" :label="t.removeFor(name)" data-move="remove" :disabled="locked" @click="$emit('remove')" />
      </div>
    </div>

    <p v-if="state?.phase === 'error'" class="m-0 text-label text-danger" role="alert">
      {{ state.message }}
    </p>

    <div class="grid items-start gap-x-8 gap-y-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <div class="grid gap-2">
        <MediaThumb :item="item" />
        <p v-if="facts" class="m-0 text-label wrap-break-word text-faint tabular-nums">
          {{ facts }}
        </p>
      </div>

      <div class="grid min-w-0 gap-6">
        <div class="flex flex-wrap gap-x-8 gap-y-5">
          <Field :label="t.role" group :data-field="`${base}.role`">
            <RadioGroup v-model="role" :options="roles" :label="t.role" :disabled="locked" />
          </Field>
          <Field :label="t.viewport" group :data-field="`${base}.viewport`">
            <RadioGroup v-model="viewport" :options="viewports" :label="t.viewport" :disabled="locked" />
          </Field>
        </div>
        <MediaTint :index="index" :name="name" :locked="locked" />
        <MediaFiles :index="index" :name="name" :locked="locked" />
      </div>
    </div>

    <BilingualField
      v-model:es="item.alt"
      v-model:en="item.translations.en.alt"
      :path="`${base}.alt`"
      :en-path="`${base}.translations.en.alt`"
      :label="t.alt"
      :hint="t.altHint"
      :readonly="locked"
      required
    />

    <BilingualField
      v-if="showCaption"
      v-model:es="item.caption"
      v-model:en="item.translations.en.caption"
      :path="`${base}.caption`"
      :en-path="`${base}.translations.en.caption`"
      :label="t.caption"
      :hint="t.captionHint"
      :readonly="locked"
    />
    <div v-else>
      <button
        type="button"
        class="rounded-control border-0 bg-transparent p-0 text-label text-dim underline decoration-rule-strong underline-offset-4 transition-colors duration-120 ease-e hover:text-ink hover:decoration-ink disabled:opacity-45"
        :disabled="locked"
        @click="captionOpen = true"
      >
        {{ t.showCaption }}
      </button>
    </div>
  </article>
</template>
