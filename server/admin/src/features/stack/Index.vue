<script setup lang="ts">
/**
 * #/tecnologias[/:id]: sin id, la lista agrupada por categoría; con id, la ficha de la tecnología.
 * Se crean desde la lista (TechCreate) o en línea desde una obra, una experiencia o un artículo.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import StackList from './StackList.vue'
import TechEditor from './TechEditor.vue'

const route = useRoute()
const id = computed(() => {
  const n = Number(route.params['id'])
  return Number.isInteger(n) && n > 0 ? n : null
})
</script>

<template>
  <TechEditor v-if="id !== null" :id="id" />
  <StackList v-else />
</template>
