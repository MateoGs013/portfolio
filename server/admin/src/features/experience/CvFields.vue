<script setup lang="ts">
/**
 * La sección CV de una entrada: si entra a la hoja y en qué puesto, sus viñetas con el inglés en la
 * misma posición, las obras ligadas y las tecnologías (se crean sin salir del formulario).
 */
import InlineCreate from '../collections/InlineCreate.vue'
import CvPlace from './CvPlace.vue'
import { experience as t } from './dict'
import Highlights from './Highlights.vue'
import type { ExperienceForm } from './model'
import ProjectPicker from './ProjectPicker.vue'
import type { Experience } from './record'

defineProps<{ record: Experience | null }>()
const form = defineModel<ExperienceForm>('form', { required: true })
const emit = defineEmits<{ cvChanged: [record: Experience] }>()
</script>

<template>
  <div class="grid gap-11">
    <CvPlace :record="record" :kind="form.kind" @changed="emit('cvChanged', $event)" />
    <Highlights v-model:es="form.highlights" v-model:en="form.translations.en.highlights" />
    <div class="grid gap-8.5 border-t border-rule pt-8.5">
      <ProjectPicker v-model="form.projectIds" :linked="record?.projects ?? []" />
      <InlineCreate v-model="form.techIds" kind="tech" multiple path="techIds" :label="t.fields.techs" :hint="t.fields.techsHint" />
    </div>
  </div>
</template>
