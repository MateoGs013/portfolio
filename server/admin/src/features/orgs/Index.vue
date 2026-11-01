<script setup lang="ts">
/**
 * #/empresas[/:id]: sin id, la lista como pantalla; con id, la ficha de la empresa. Las empresas se
 * crean desde la lista (OrgList) o en línea desde una obra o una experiencia.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import OrgEditor from './OrgEditor.vue'
import OrgList from './OrgList.vue'

const route = useRoute()
const id = computed(() => {
  const n = Number(route.params['id'])
  return Number.isInteger(n) && n > 0 ? n : null
})
</script>

<template>
  <OrgEditor v-if="id !== null" :id="id" />
  <OrgList v-else />
</template>
