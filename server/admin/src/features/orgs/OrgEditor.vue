<script setup lang="ts">
/**
 * La ficha de una empresa: nombre, dirección fija (cambia solo con «Cambiar dirección»), sitio (sin
 * protocolo se completa con https:// al salir del campo) y ciudad, que el CV usa como lugar de sus
 * experiencias. Debajo, dónde se usa. Eliminar, desde «Más acciones», muestra el impacto y ofrece
 * pasarle a otra empresa lo que la nombra.
 */
import { computed } from 'vue'
import { useEditor } from '../../composables/useEditor'
import EditorFrame from '../collections/EditorFrame.vue'
import SchemaField from '../collections/SchemaField.vue'
import SlugField from '../collections/SlugField.vue'
import CatalogUsage from './CatalogUsage.vue'
import { orgs, withHttps } from './dict'
import { orgModel, type AdminOrg } from './model'

const props = defineProps<{ id: number }>()

const editor = useEditor({ model: orgModel, id: () => props.id })
const { form, record } = editor

const endpoint = computed(() => (record.value ? orgModel.slugEndpoint?.(record.value.id) ?? null : null))
const preview = (slug: string) => orgModel.slugPreview?.(slug) ?? slug

function onSlugChanged(next: unknown): void {
  editor.applyPatch(next as AdminOrg, ['slug'])
}

function completeUrl(): void {
  const full = withHttps(form.value.url)
  if (full !== form.value.url) form.value.url = full
}
</script>

<template>
  <EditorFrame :editor="editor">
    <div class="grid gap-8.5">
      <SchemaField v-model="form.name" model="Org" name="name" />
      <SlugField
        v-model="form.slug"
        :source="form.name"
        :preview="preview"
        :endpoint="endpoint"
        @changed="onSlugChanged"
      />
      <div class="grid items-start gap-8.5 lg:grid-cols-2 lg:gap-x-10" @focusout="completeUrl">
        <SchemaField v-model="form.url" model="Org" name="url" kind="url" :hint="orgs.fields.urlHint" />
        <SchemaField v-model="form.city" model="Org" name="city" :hint="orgs.fields.cityHint" />
      </div>
      <CatalogUsage v-if="record" :id="record.id" path="/orgs" class="mt-4" />
    </div>
  </EditorFrame>
</template>
