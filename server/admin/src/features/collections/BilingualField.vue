<script setup lang="ts">
/**
 * Un texto con su inglés, en una sola columna a todo el ancho del editor: el español arriba y el
 * inglés debajo, pegado a su par (nunca dos columnas angostas que corten la línea). El inglés ofrece
 * «Copiar del español» y avisa «Falta el inglés» cuando hay español escrito y el registro ya se
 * guardó una vez: en uno nuevo no se marca mientras se llena el español. Cada lado es un Field con su ruta (`data-field`), así los errores del
 * servidor (`summary`, `translations.en.summary`) y ?campo= caen en el lado que corresponde.
 */
import { computed } from 'vue'
import Field from '../../ui/Field.vue'
import TextArea from '../../ui/TextArea.vue'
import TextInput from '../../ui/TextInput.vue'
import { announce } from '../../ui/announce'
import { useEditorContext } from './context'
import { collections } from './dict'

const props = withDefaults(defineProps<{
  label: string
  hint?: string
  /** Ruta del español en el payload (`summary`); el inglés es `translations.en.<path>` si no se dice otra. */
  path: string
  enPath?: string
  kind?: 'text' | 'prose'
  rows?: number
  max?: number | null
  required?: boolean
  readonly?: boolean
}>(), { kind: 'text', rows: 3, max: null, required: false, readonly: false })

const es = defineModel<string>('es', { default: '' })
const en = defineModel<string>('en', { default: '' })

const t = collections.bilingual
const editor = useEditorContext()
const locked = computed(() => props.readonly || (editor?.busy.value ?? false))
const englishPath = computed(() => props.enPath ?? `translations.en.${props.path}`)
const missing = computed(() => !(editor?.isNew.value ?? false) && !!es.value.trim() && !en.value.trim())
const counter = (text: string) => (props.max ? { count: text.length, max: props.max } : {})

function copy(): void {
  en.value = es.value
  announce(t.copied)
}
</script>

<template>
  <div class="grid gap-3.5">
    <Field
      :data-field="path"
      :label="`${label} · ${t.es}`"
      :hint="hint"
      :required="required"
      :error="editor?.messageFor(path) ?? null"
      v-bind="counter(es)"
    >
      <TextArea v-if="kind === 'prose'" v-model="es" :rows="rows" :readonly="locked" lang="es" />
      <TextInput v-else v-model="es" :readonly="locked" lang="es" />
    </Field>
    <Field
      :data-field="englishPath"
      :label="`${label} · ${t.en}`"
      :error="editor?.messageFor(englishPath) ?? null"
      v-bind="counter(en)"
    >
      <template #aux>
        <span v-if="missing" class="inline-flex items-center gap-1.5 text-wip">
          <span class="size-1.5 rounded-full bg-wip" aria-hidden="true" />
          {{ t.missing }}
        </span>
        <button
          v-if="es.trim() && en !== es"
          type="button"
          class="rounded-control border-0 bg-transparent p-0 text-meta text-dim underline decoration-rule-strong underline-offset-4 transition-colors duration-120 ease-e hover:text-ink hover:decoration-ink disabled:cursor-not-allowed disabled:opacity-45"
          :disabled="locked"
          @click="copy"
        >
          {{ t.copy }}
        </button>
      </template>
      <TextArea v-if="kind === 'prose'" v-model="en" :rows="rows" :readonly="locked" lang="en" />
      <TextInput v-else v-model="en" :readonly="locked" lang="en" />
    </Field>
  </div>
</template>
