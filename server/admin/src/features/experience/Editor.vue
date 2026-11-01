<script setup lang="ts">
/**
 * Una entrada de trayectoria, una cosa por pantalla: «← Trayectoria», el nombre en display (viaja
 * desde la fila) y tres secciones. Lo esencial dice qué fue y cuándo; Relato, lo que se lee en Sobre
 * mí; CV, si entra a la hoja y con qué viñetas. Todo texto que se lee en el sitio lleva su inglés al
 * lado. La dirección queda fija al guardar y cambia solo con «Cambiar dirección».
 */
import { computed } from 'vue'
import { useEditor } from '../../composables/useEditor'
import { fieldOf } from '../../models/validate'
import BilingualField from '../collections/BilingualField.vue'
import EditorFrame from '../collections/EditorFrame.vue'
import CvFields from './CvFields.vue'
import { experience as t } from './dict'
import EssentialFields from './EssentialFields.vue'
import { experienceModel } from './model'
import type { Experience } from './record'

const props = defineProps<{ id: number | 'nueva' }>()

const editor = useEditor({ model: experienceModel, id: () => props.id })
const { form, record } = editor

const counts = computed(() => ({ cv: form.value.highlights.filter(h => h.trim()).length }))
const max = (name: string) => fieldOf('Experience', name)?.max ?? null

/** La dirección o el puesto en el CV cambiaron en el servidor: lo demás de lo escrito se conserva. */
function onSlugChanged(next: unknown): void {
  editor.applyPatch(next as Experience, ['slug'])
}

function onCvChanged(next: Experience): void {
  editor.applyPatch(next, [])
}
</script>

<template>
  <EditorFrame :editor="editor" :counts="counts">
    <template #default="{ section }">
      <EssentialFields
        v-if="section === 'esencial'"
        v-model:form="form"
        :record="record"
        @slug-changed="onSlugChanged"
      />
      <div v-else-if="section === 'relato'" class="grid gap-8.5">
        <BilingualField
          v-model:es="form.summary"
          v-model:en="form.translations.en.summary"
          path="summary"
          :label="t.fields.summary"
          :hint="t.fields.summaryHint"
          kind="prose"
          :rows="3"
          :max="max('summary')"
          required
        />
        <BilingualField
          v-model:es="form.story"
          v-model:en="form.translations.en.story"
          path="story"
          :label="t.fields.story"
          :hint="t.fields.storyHint"
          kind="prose"
          :rows="7"
          :max="max('story')"
        />
      </div>
      <CvFields v-else v-model:form="form" :record="record" @cv-changed="onCvChanged" />
    </template>
  </EditorFrame>
</template>
