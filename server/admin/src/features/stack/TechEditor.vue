<script setup lang="ts">
/**
 * La ficha de una tecnología: nombre, dirección fija (filtra Obra con ?stack=…), categoría con su
 * rótulo de /meta, «Desde», el criterio en español e inglés y el color, que solo usa el registro R.
 * Debajo, dónde se usa. Eliminar, desde «Más acciones», muestra el impacto y ofrece ponerle otra
 * tecnología en su lugar a cada obra, experiencia y artículo.
 */
import { computed } from 'vue'
import { useEditor } from '../../composables/useEditor'
import { fieldOf } from '../../models/validate'
import { enumOptions } from '../../stores/meta'
import Field from '../../ui/Field.vue'
import type { SelectOption } from '../../ui/field'
import Select from '../../ui/Select.vue'
import TextInput from '../../ui/TextInput.vue'
import BilingualField from '../collections/BilingualField.vue'
import EditorFrame from '../collections/EditorFrame.vue'
import SchemaField from '../collections/SchemaField.vue'
import SlugField from '../collections/SlugField.vue'
import CatalogUsage from '../orgs/CatalogUsage.vue'
import ColorField from './ColorField.vue'
import { stack } from './dict'
import { techModel, type AdminTech } from './model'

const props = defineProps<{ id: number }>()

const editor = useEditor({ model: techModel, id: () => props.id })
const { form, record } = editor

const label = (name: string) => fieldOf('Tech', name)?.label ?? ''
const categories = computed<SelectOption<string>[]>(() => enumOptions('TechCategory').map(o => ({ value: o.value, label: o.label })))
const endpoint = computed(() => (record.value ? techModel.slugEndpoint?.(record.value.id) ?? null : null))
const preview = (slug: string) => techModel.slugPreview?.(slug) ?? slug
const noteMax = computed(() => fieldOf('Tech', 'note')?.max ?? null)
const busy = computed(() => editor.busy.value)
const thisYear = new Date().getFullYear()

function onSlugChanged(next: unknown): void {
  editor.applyPatch(next as AdminTech, ['slug'])
}
</script>

<template>
  <EditorFrame :editor="editor">
    <div class="grid gap-8.5">
      <SchemaField v-model="form.name" model="Tech" name="name" />
      <SlugField
        v-model="form.slug"
        :source="form.name"
        :preview="preview"
        :endpoint="endpoint"
        @changed="onSlugChanged"
      />
      <div class="grid items-start gap-8.5 sm:grid-cols-2 sm:gap-x-10">
        <Field
          data-field="category"
          :label="label('category')"
          :hint="fieldOf('Tech', 'category')?.help"
          :error="editor.errors.messageFor('category')"
          required
        >
          <Select v-model="form.category" :options="categories" :disabled="busy" />
        </Field>
        <Field
          data-field="since"
          :label="label('since')"
          :hint="stack.fields.sinceHint(thisYear)"
          :error="editor.errors.messageFor('since')"
          required
        >
          <TextInput v-model="form.since" inputmode="numeric" autocomplete="off" :readonly="busy" />
        </Field>
      </div>
      <BilingualField
        v-model:es="form.note"
        v-model:en="form.translations.en.note"
        path="note"
        :label="label('note')"
        :hint="stack.fields.noteHint"
        kind="prose"
        :rows="2"
        :max="noteMax"
      />
      <ColorField v-model="form.color" />
      <CatalogUsage v-if="record" :id="record.id" path="/techs" class="mt-4" />
    </div>
  </EditorFrame>
</template>
