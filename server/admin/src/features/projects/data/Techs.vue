<script setup lang="ts">
/**
 * Las tecnologías de la obra, con búsqueda; la que falta se crea sin salir (InlineCreate pide nombre,
 * categoría y año). Lleva `data-field="techIds"`: la checklist y los errores llegan acá.
 */
import InlineCreate from '../../collections/InlineCreate.vue'
import { useProject } from '../context'
import { dataText } from './dict'

const t = dataText.techs
const { form } = useProject()
</script>

<template>
  <section class="grid gap-6" aria-labelledby="tecnologias-titulo">
    <h2 id="tecnologias-titulo" class="m-0 text-title">
      {{ t.title }}
    </h2>
    <InlineCreate v-model="form.techIds" kind="tech" multiple path="techIds" :label="t.label" :hint="t.hint" />
  </section>
</template>
