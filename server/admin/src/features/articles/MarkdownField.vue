<script setup lang="ts">
/**
 * El texto de un artículo en un idioma: Markdown en un textarea de prosa que crece y, debajo del
 * rótulo, «Escribir» y «Vista previa» (botones con aria-pressed) con las palabras. La vista previa es el render del
 * sitio (ArticlePreview). El inglés suma «Copiar del español» y «Falta el inglés», como BilingualField.
 * Un error del campo o ?campo= vuelven a «Escribir»: el foco tiene que caer en el textarea.
 */
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEditorContext } from '../collections/context'
import { collections } from '../collections/dict'
import { announce } from '../../ui/announce'
import Field from '../../ui/Field.vue'
import TextArea from '../../ui/TextArea.vue'
import ArticlePreview from './ArticlePreview.vue'
import { articles } from './dict'

const props = withDefaults(defineProps<{
  label: string
  hint?: string
  /** Ruta en el payload: `content` o `translations.en.content`. */
  path: string
  lang: 'es' | 'en'
  /** El español, para «Copiar del español» y «Falta el inglés» (solo en el inglés). */
  source?: string | null
  max?: number | null
  required?: boolean
}>(), { source: null, max: null, required: false })

const value = defineModel<string>({ default: '' })

const t = articles.text
const editor = useEditorContext()
const route = useRoute()
const locked = computed(() => editor?.busy.value ?? false)
const error = computed(() => editor?.messageFor(props.path) ?? null)
const mode = ref<'write' | 'preview'>('write')

watch(() => !!error.value || route.query['campo'] === props.path, (wanted) => {
  if (wanted) mode.value = 'write'
}, { immediate: true })

const words = computed(() => value.value.split(/\s+/).filter(Boolean).length)
const missing = computed(() => props.source !== null && !!props.source.trim() && !value.value.trim())
const canCopy = computed(() => props.source !== null && !!props.source.trim() && value.value !== props.source)
const counter = computed(() => (props.max ? { count: value.value.length, max: props.max } : {}))

function copy(): void {
  if (props.source === null) return
  value.value = props.source
  announce(collections.bilingual.copied)
}

const toggle = 'inline-flex items-baseline border-0 border-b border-transparent bg-transparent px-0 pb-0.5 text-label text-faint transition-colors duration-120 ease-e hover:text-ink aria-pressed:border-ink aria-pressed:text-ink'
const quiet = 'rounded-control border-0 bg-transparent p-0 text-meta text-dim underline decoration-rule-strong underline-offset-4 transition-colors duration-120 ease-e hover:text-ink hover:decoration-ink disabled:cursor-not-allowed disabled:opacity-45'
</script>

<template>
  <div :data-field="path" class="min-w-0">
    <Field :label="label" :hint="hint" :required="required" :error="error" v-bind="counter">
      <template #aux>
        <span v-if="missing" class="inline-flex items-center gap-1.5 text-wip">
          <span class="size-1.5 rounded-full bg-wip" aria-hidden="true" />
          {{ collections.bilingual.missing }}
        </span>
        <button v-if="canCopy && mode === 'write'" type="button" :class="quiet" :disabled="locked" @click="copy">
          {{ collections.bilingual.copy }}
        </button>
      </template>
      <div class="mt-1 flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <div role="group" :aria-label="t.modes(label)" class="flex gap-5">
          <button type="button" :aria-pressed="mode === 'write'" :class="toggle" @click="mode = 'write'">
            {{ t.write }}
          </button>
          <button type="button" :aria-pressed="mode === 'preview'" :class="toggle" @click="mode = 'preview'">
            {{ t.preview }}
          </button>
        </div>
        <span class="ml-auto text-meta text-faint tabular-nums">{{ t.words(words) }}</span>
      </div>
      <TextArea v-if="mode === 'write'" v-model="value" :rows="12" :max-rows="32" :readonly="locked" :lang="lang" spellcheck="true" />
      <section
        v-else
        :aria-label="t.previewOf(label)"
        class="min-h-40 min-w-0 animate-enter border-0 border-b border-rule-strong pt-3 pb-8"
      >
        <ArticlePreview :source="value" :lang="lang" />
      </section>
    </Field>
  </div>
</template>
