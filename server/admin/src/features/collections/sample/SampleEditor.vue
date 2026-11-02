<script setup lang="ts">
/**
 * Editor de la colección de prueba: una empresa real (PUT /orgs/:id) con su dirección fija, sus dos
 * secciones de datos y una tercera con los componentes compartidos. La publicación es simulada: las
 * empresas no se publican, pero el panel y su checklist son los que usan obras y artículos.
 */
import { computed, ref } from 'vue'
import { useEditor } from '../../../composables/useEditor'
import type { RecordStatus } from '../../../models/types'
import EditorFrame from '../EditorFrame.vue'
import PublishState from '../PublishState.vue'
import SchemaField from '../SchemaField.vue'
import SlugField from '../SlugField.vue'
import { sample } from './dict'
import { sampleModel, type SampleOrg } from './model'
import SampleParts from './SampleParts.vue'

const props = defineProps<{ id: number | 'nueva' }>()

const editor = useEditor({ model: sampleModel, id: () => props.id })
const { form, record } = editor

const published = ref(false)
const publishFrom = ref('')
const status = computed<RecordStatus>(() => (published.value
  ? { tone: 'ok', label: sample.publish.on }
  : { tone: 'neutral', label: sample.publish.off }))
const checklist = computed(() => sampleModel.checklist?.(form.value, record.value) ?? [])
const endpoint = computed(() => (record.value ? sampleModel.slugEndpoint?.(record.value.id) ?? null : null))
const preview = (slug: string) => sampleModel.slugPreview?.(slug) ?? slug

function onSlugChanged(next: unknown): void {
  editor.applyPatch(next as SampleOrg, ['slug'])
}
</script>

<template>
  <EditorFrame :editor="editor">
    <template #publish>
      <PublishState v-model:published="published" v-model:at="publishFrom" :status="status" :items="checklist" />
    </template>
    <template #default="{ section }">
      <div v-if="section === 'esencial'" class="grid gap-8.5">
        <SchemaField v-model="form.name" model="Org" name="name" />
        <SlugField
          v-model="form.slug"
          :source="form.name"
          :preview="preview"
          :endpoint="endpoint"
          @changed="onSlugChanged"
        />
      </div>
      <div v-else-if="section === 'ubicacion'" class="grid gap-8.5">
        <SchemaField v-model="form.url" model="Org" name="url" kind="url" />
        <SchemaField v-model="form.city" model="Org" name="city" />
      </div>
      <SampleParts v-else />
    </template>
  </EditorFrame>
</template>
