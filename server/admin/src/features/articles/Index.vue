<script setup lang="ts">
/**
 * #/articulos, #/articulos/nuevo y #/articulos/:id: la lista como pantalla (filas grandes, filtros
 * Publicados, Borradores y Falta inglés) o el editor de uno, solo en la pantalla.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { summary } from '../../stores/meta'
import Explorer from '../collections/Explorer.vue'
import ArticleEditor from './ArticleEditor.vue'
import { articles } from './dict'
import { articleModel } from './model'

const route = useRoute()

const id = computed<number | 'nueva' | null>(() => {
  if (route.name === 'articulo-nuevo') return 'nueva'
  if (route.name !== 'articulo') return null
  const n = Number(route.params['id'])
  return Number.isInteger(n) && n > 0 ? n : null
})

const lead = computed(() => {
  const counts = summary.value?.articles
  return counts ? articles.lead(counts.published, counts.draft) : undefined
})
</script>

<template>
  <ArticleEditor v-if="id !== null" :id="id" />
  <Explorer v-else :model="articleModel" :lead="lead" />
</template>
