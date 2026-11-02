<script setup lang="ts">
/**
 * El color de una pieza como muestra, con su valor editable (#rrggbb) y «Recalcular», que lo vuelve a
 * leer del archivo: el nuevo si hay uno en cola, si no el guardado (en un video, su póster).
 */
import { computed, ref } from 'vue'
import { announce } from '../../../ui/announce'
import Button from '../../../ui/Button.vue'
import Field from '../../../ui/Field.vue'
import TextInput from '../../../ui/TextInput.vue'
import { useEditorContext } from '../../collections/context'
import { useProject } from '../context'
import { mediaText } from './dict'
import { HEX } from './mediaForm'
import { useMediaQueue } from './mediaQueue'
import { safeTint } from './tint'

const props = defineProps<{ index: number, name: string, locked: boolean }>()

const t = mediaText.card
const { form, record } = useProject()
const item = computed(() => form.value.media[props.index]!)
const path = computed(() => `media[${props.index}].tint`)
const queue = useMediaQueue()
const editor = useEditorContext()
const working = ref(false)
const problem = ref('')

const swatch = computed(() => (HEX.test(item.value.tint.trim()) ? item.value.tint.trim() : null))

/** De dónde sale el color: el archivo en cola o lo guardado. Un video necesita su póster. */
const source = computed<Blob | string | null>(() => {
  const piece = item.value
  const saved = piece.id === null ? null : record.value?.media.find(m => m.id === piece.id) ?? null
  if (piece.kind === 'IMAGE') return (piece.upload.file ? queue.get(piece.key, 'file') : null) ?? saved?.src ?? null
  return (piece.upload.poster ? queue.get(piece.key, 'poster') : null) ?? saved?.poster ?? null
})

async function recalc(): Promise<void> {
  if (!source.value || working.value) return
  // La pieza, no su lugar: mientras se lee el archivo puede moverse en la lista.
  const piece = item.value
  working.value = true
  problem.value = ''
  const tint = await safeTint(source.value)
  working.value = false
  if (!tint) {
    problem.value = t.recalcFailed
    return
  }
  if (tint === piece.tint) announce(t.recalcSame)
  piece.tint = tint
}

const error = computed(() => problem.value || editor?.messageFor(path.value) || null)
const model = computed({
  get: () => item.value.tint,
  set: (value: string) => {
    item.value.tint = value.trim().toLowerCase()
  },
})
</script>

<template>
  <Field :data-field="path" :label="t.tint" :hint="source ? t.tintHint : t.recalcNoPoster" :error="error">
    <div class="flex items-center gap-3">
      <span
        class="size-6 shrink-0 rounded-kbd border border-rule-strong"
        :class="swatch ? '' : 'bg-surface'"
        :style="swatch ? { backgroundColor: swatch } : undefined"
        aria-hidden="true"
      />
      <TextInput v-model="model" mono :placeholder="t.tintNone" :readonly="locked" :maxlength="7" class="max-w-28" autocomplete="off" />
      <Button
        variant="ghost"
        :disabled="locked || !source"
        :loading="working"
        :loading-label="t.recalcFor(name)"
        :aria-label="t.recalcFor(name)"
        @click="recalc"
      >
        {{ t.recalc }}
      </Button>
    </div>
  </Field>
</template>
