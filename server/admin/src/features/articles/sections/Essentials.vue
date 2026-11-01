<script setup lang="ts">
/**
 * Lo esencial de un artículo: título y bajada con su inglés al lado, la dirección (fija después de
 * crearlo), la obra de la que habla, las tecnologías (se crean acá si faltan), los minutos de lectura
 * con «Calcular» (palabras sobre 200) y la publicación original. Sin portada: el sitio no la usa.
 */
import { readingMinutes } from '@shared/markdown'
import { computed } from 'vue'
import { fieldOf } from '../../../models/validate'
import { options } from '../../../stores/meta'
import { announce } from '../../../ui/announce'
import Field from '../../../ui/Field.vue'
import type { SelectOption } from '../../../ui/field'
import Select from '../../../ui/Select.vue'
import Switch from '../../../ui/Switch.vue'
import TextInput from '../../../ui/TextInput.vue'
import BilingualField from '../../collections/BilingualField.vue'
import { useEditorContext } from '../../collections/context'
import InlineCreate from '../../collections/InlineCreate.vue'
import SchemaField from '../../collections/SchemaField.vue'
import SlugField from '../../collections/SlugField.vue'
import { articles } from '../dict'
import type { AdminArticle, ArticleForm } from '../model'

const props = defineProps<{
  record: AdminArticle | null
  slugEndpoint: string | null
}>()
const form = defineModel<ArticleForm>('form', { required: true })
const emit = defineEmits<{ slugChanged: [record: unknown] }>()

const t = articles.fields
const editor = useEditorContext()
const locked = computed(() => editor?.busy.value ?? false)
const max = (name: string) => fieldOf('Article', name)?.max ?? null
const preview = (slug: string) => `/articles/${slug}`

/** «Ninguna» es el 0 del select; en el formulario es null. Una obra oculta se nombra como tal. */
const NONE = 0
const projectOptions = computed<SelectOption<number>[]>(() => {
  const known = (options.value?.projects ?? []).map(p => ({ value: p.id, label: p.visible ? p.title : t.hiddenProject(p.title) }))
  const linked = props.record?.project
  const extra = linked && !known.some(o => o.value === linked.id) ? [{ value: linked.id, label: linked.title }] : []
  return [{ value: NONE, label: t.noProject }, ...known, ...extra]
})
const project = computed<number | null>({
  get: () => form.value.projectId ?? NONE,
  set: (value) => { form.value.projectId = value === NONE || value === null ? null : value },
})

const words = computed(() => form.value.content.split(/\s+/).filter(Boolean).length)
function calculate(): void {
  const minutes = readingMinutes(form.value.content)
  form.value.readingTimeMin = String(minutes)
  announce(t.calculated(minutes))
}

const quiet = 'rounded-control border-0 bg-transparent p-0 text-meta text-dim underline decoration-rule-strong underline-offset-4 transition-colors duration-120 ease-e hover:text-ink hover:decoration-ink disabled:cursor-not-allowed disabled:opacity-45'
</script>

<template>
  <div class="grid gap-8.5">
    <BilingualField
      v-model:es="form.title"
      v-model:en="form.translations.en.title"
      path="title"
      :label="fieldOf('Article', 'title')?.label ?? ''"
      :hint="fieldOf('Article', 'title')?.help"
      :max="max('title')"
      required
    />
    <SlugField
      v-model="form.slug"
      :source="form.title"
      :preview="preview"
      :endpoint="slugEndpoint"
      @changed="emit('slugChanged', $event)"
    />
    <BilingualField
      v-model:es="form.summary"
      v-model:en="form.translations.en.summary"
      path="summary"
      :label="fieldOf('Article', 'summary')?.label ?? ''"
      :hint="t.summaryHint"
      kind="prose"
      :rows="2"
      :max="max('summary')"
      required
    />
    <Field data-field="projectId" :label="t.project" :hint="t.projectHint" :error="editor?.messageFor('projectId') ?? null">
      <Select v-model="project" :options="projectOptions" :placeholder="false" :disabled="locked" />
    </Field>
    <InlineCreate v-model="form.techIds" kind="tech" multiple path="techIds" :label="t.techs" :hint="t.techsHint" />
    <Field
      data-field="readingTimeMin"
      class="max-w-[22rem]"
      :label="t.minutes"
      :hint="t.minutesHint(words)"
      :error="editor?.messageFor('readingTimeMin') ?? null"
    >
      <template #aux>
        <button type="button" :class="quiet" :disabled="locked || !form.content.trim()" @click="calculate">
          {{ t.calculate }}
        </button>
      </template>
      <TextInput v-model="form.readingTimeMin" type="number" inputmode="numeric" :readonly="locked" />
    </Field>
    <SchemaField v-model="form.canonicalUrl" model="Article" name="canonicalUrl" kind="url" :label="t.canonical" :hint="t.canonicalHint" />
    <div data-field="featured">
      <Switch v-model="form.featured" :label="t.featured" :hint="t.featuredHint" :disabled="locked" />
    </div>
  </div>
</template>
