<script setup lang="ts">
/**
 * #/muestrario/coleccion[/:id|nueva[/:seccion]], solo con `pnpm dev:admin`: el marco de colecciones
 * entero sobre las empresas de la base. Sin id, la lista; con id, el editor; con `nueva`, el alta.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Explorer from '../Explorer.vue'
import { sample } from './dict'
import { sampleModel } from './model'
import SampleEditor from './SampleEditor.vue'

const route = useRoute()

const id = computed<number | 'nueva' | null>(() => {
  const raw = route.params['id']
  if (raw === 'nueva') return 'nueva'
  const n = Number(raw)
  return typeof raw === 'string' && raw && Number.isInteger(n) ? n : null
})
</script>

<template>
  <SampleEditor v-if="id !== null" :id="id" />
  <Explorer v-else :model="sampleModel" :lead="sample.lead" />
</template>
