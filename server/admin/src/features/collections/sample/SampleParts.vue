<script setup lang="ts">
/**
 * La sección «Componentes» de la muestra: InlineCreate de tecnologías (elegir y crear en la base) y un
 * campo bilingüe. Lo elegido y lo escrito acá no viaja en el guardado de la empresa.
 */
import { ref } from 'vue'
import { fieldOf } from '../../../models/validate'
import BilingualField from '../BilingualField.vue'
import InlineCreate from '../InlineCreate.vue'
import { sample } from './dict'

const techs = ref<number[]>([])
const noteEs = ref('')
const noteEn = ref('')
const t = sample.parts
</script>

<template>
  <div class="grid gap-8.5">
    <div class="grid gap-2">
      <h2 class="m-0 text-title">
        {{ t.title }}
      </h2>
      <p class="m-0 max-w-[60ch] text-body text-dim">
        {{ t.text }}
      </p>
    </div>
    <InlineCreate v-model="techs" kind="tech" multiple path="muestra.techs" :label="t.techs" :hint="t.techsHint" />
    <BilingualField
      v-model:es="noteEs"
      v-model:en="noteEn"
      path="muestra.note"
      :label="t.note"
      :hint="t.noteHint"
      kind="prose"
      :rows="2"
      :max="fieldOf('Tech', 'note')?.max ?? null"
    />
  </div>
</template>
