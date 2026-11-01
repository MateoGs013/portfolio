<script setup lang="ts">
/**
 * Un campo de texto armado con el esquema de /meta: rótulo, ayuda («dónde aparece»), obligatorio y
 * tope salen de shared/adminSchema.ts, el error de su ruta en el editor y el solo-lectura de su
 * guardado. Lleva `data-field` con la ruta, así los errores y ?campo= lo encuentran.
 */
import type { ModelName } from '@shared/adminSchema'
import { computed } from 'vue'
import { fieldOf } from '../../models/validate'
import Field from '../../ui/Field.vue'
import TextArea from '../../ui/TextArea.vue'
import TextInput from '../../ui/TextInput.vue'
import { useEditorContext } from './context'

const props = withDefaults(defineProps<{
  model: ModelName
  /** Nombre del campo en el esquema; también es su ruta en el payload si no se dice otra. */
  name: string
  path?: string
  kind?: 'text' | 'prose' | 'url' | 'email'
  rows?: number
  /** Otro rótulo o ayuda que el del esquema, cuando el contexto lo pide. */
  label?: string
  hint?: string
}>(), { kind: 'text', rows: 3 })

const value = defineModel<string>({ default: '' })

const editor = useEditorContext()
const descriptor = computed(() => fieldOf(props.model, props.name))
const fieldPath = computed(() => props.path ?? props.name)
const mono = computed(() => props.kind === 'url' || props.kind === 'email')
/** El contador solo en textos con un tope que se alcanza escribiendo (no en una URL de 2048). */
const max = computed(() => {
  const top = descriptor.value?.max
  return top && top <= 600 && !mono.value ? top : undefined
})
</script>

<template>
  <Field
    :data-field="fieldPath"
    :label="label ?? descriptor?.label ?? name"
    :hint="hint ?? descriptor?.help"
    :required="descriptor?.required ?? false"
    :error="editor?.messageFor(fieldPath) ?? null"
    :count="max ? value.length : undefined"
    :max="max"
  >
    <TextArea v-if="kind === 'prose'" v-model="value" :rows="rows" :readonly="editor?.busy.value ?? false" />
    <TextInput
      v-else
      v-model="value"
      :type="kind === 'text' ? 'text' : kind"
      :mono="mono"
      :readonly="editor?.busy.value ?? false"
      :autocomplete="mono ? 'off' : undefined"
    />
  </Field>
</template>
