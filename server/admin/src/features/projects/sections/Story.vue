<script setup lang="ts">
/**
 * El relato del caso: la síntesis (la tarjeta y la vista rápida), el reto que lo abre, el resultado que
 * lo cierra y los pasos del proceso, cada texto con su inglés al lado.
 */
import { fieldOf } from '../../../models/validate'
import BilingualField from '../../collections/BilingualField.vue'
import { useProject } from '../context'
import { projectsText } from '../dict'
import Steps from './Steps.vue'

const t = projectsText.story
const { form } = useProject()
</script>

<template>
  <div class="grid gap-8.5">
    <BilingualField
      v-model:es="form.summary"
      v-model:en="form.translations.en.summary"
      path="summary"
      :label="t.summary"
      :hint="t.summaryHint"
      kind="prose"
      :rows="2"
      :max="fieldOf('Project', 'summary')?.max ?? null"
      required
    />
    <BilingualField
      v-model:es="form.brief"
      v-model:en="form.translations.en.brief"
      path="brief"
      :label="t.brief"
      :hint="t.briefHint"
      kind="prose"
      :rows="5"
    />
    <BilingualField
      v-model:es="form.outcome"
      v-model:en="form.translations.en.outcome"
      path="outcome"
      :label="t.outcome"
      :hint="t.outcomeHint"
      kind="prose"
      :rows="4"
    />
    <Steps />
  </div>
</template>
