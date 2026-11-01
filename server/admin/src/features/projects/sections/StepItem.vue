<script setup lang="ts">
/**
 * Un paso del proceso: título y texto con su inglés, y la imagen de la obra que lo acompaña (si la
 * obra ya tiene imágenes). El asa se arrastra con el mouse; Subir y Bajar son el camino del teclado.
 */
import { computed } from 'vue'
import Field from '../../../ui/Field.vue'
import type { SelectOption } from '../../../ui/field'
import Icon from '../../../ui/Icon.vue'
import IconButton from '../../../ui/IconButton.vue'
import Select from '../../../ui/Select.vue'
import BilingualField from '../../collections/BilingualField.vue'
import { useEditorContext } from '../../collections/context'
import { useProject } from '../context'
import { projectsText } from '../dict'

const props = defineProps<{
  index: number
  total: number
  media: SelectOption<number>[]
  /** Lo que hace arrastrable al asa (useDragSort.handle). */
  handle: Record<string, unknown>
}>()

defineEmits<{ up: [], down: [], remove: [] }>()

const t = projectsText.steps
const { form } = useProject()
const editor = useEditorContext()
const locked = computed(() => editor?.busy.value ?? false)
const step = computed(() => form.value.steps[props.index]!)
const n = computed(() => props.index + 1)
const base = computed(() => `steps[${props.index}]`)

/** 0 es «Sin imagen»: la lista nativa no deja volver a una opción vacía deshabilitada. */
const NONE = 0
const mediaOptions = computed<SelectOption<number>[]>(() => [{ value: NONE, label: t.noMedia }, ...props.media])
const mediaChoice = computed<number | null>({
  get: () => step.value.mediaId ?? NONE,
  set: (value) => {
    step.value.mediaId = value ? value : null
  },
})
</script>

<template>
  <div class="grid gap-6 pt-5 pb-7">
    <div class="flex items-center gap-3">
      <span
        v-bind="handle"
        class="grid size-7 cursor-grab place-items-center rounded-control text-faint transition-colors duration-120 ease-e hover:bg-surface hover:text-ink active:cursor-grabbing"
        :title="t.drag(n)"
        aria-hidden="true"
      >
        <Icon name="drag" :size="16" />
      </span>
      <h3 class="m-0 text-row text-ink">
        {{ t.step(n) }}
      </h3>
      <div class="ml-auto flex items-center gap-1">
        <IconButton icon="arrow-up" size="sm" :label="t.up(n)" data-move="up" :disabled="locked || index === 0" @click="$emit('up')" />
        <IconButton icon="arrow-down" size="sm" :label="t.down(n)" data-move="down" :disabled="locked || index === total - 1" @click="$emit('down')" />
        <IconButton icon="trash" size="sm" :label="t.remove(n)" data-move="remove" :disabled="locked" @click="$emit('remove')" />
      </div>
    </div>

    <BilingualField
      v-model:es="step.title"
      v-model:en="step.translations.en.title"
      :path="`${base}.title`"
      :en-path="`${base}.translations.en.title`"
      :label="t.stepTitle"
      :hint="t.stepTitleHint"
      required
    />
    <BilingualField
      v-model:es="step.body"
      v-model:en="step.translations.en.body"
      :path="`${base}.body`"
      :en-path="`${base}.translations.en.body`"
      :label="t.body"
      :hint="t.bodyHint"
      kind="prose"
      :rows="3"
      required
    />
    <Field
      v-if="media.length"
      :data-field="`${base}.mediaId`"
      :label="t.media"
      :hint="t.mediaHint"
      :error="editor?.messageFor(`${base}.mediaId`) ?? null"
      class="max-w-[28rem]"
    >
      <Select v-model="mediaChoice" :options="mediaOptions" :placeholder="false" :disabled="locked" />
    </Field>
    <p v-else class="m-0 text-label text-faint">
      {{ t.noMediaYet }}
    </p>
  </div>
</template>
