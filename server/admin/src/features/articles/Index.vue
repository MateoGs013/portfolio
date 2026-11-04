<script setup lang="ts">
/**
 * #/articulos, #/articulos/nuevo y #/articulos/:id: la lista como pantalla (filas grandes, filtros
 * Publicados, Borradores y Falta inglés) o el editor de uno, solo en la pantalla. En la lista,
 * «Pedir un artículo a Eros» (también desde la paleta: #/articulos?pedir=1, que se limpia sola) y la
 * línea del horario de los lunes con el último pedido.
 */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { summary } from '../../stores/meta'
import Button from '../../ui/Button.vue'
import Explorer from '../collections/Explorer.vue'
import ArticleEditor from './ArticleEditor.vue'
import AskDialog from './AskDialog.vue'
import { articles, asked } from './dict'
import { articleModel } from './model'
import RunsLine from './RunsLine.vue'

const route = useRoute()
const router = useRouter()

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

const askOpen = ref(false)

watch(() => route.query['pedir'], (value) => {
  if (value !== '1' || id.value !== null) return
  askOpen.value = true
  const { pedir: _pedir, ...rest } = route.query
  void router.replace({ query: rest })
}, { immediate: true })
</script>

<template>
  <ArticleEditor v-if="id !== null" :id="id" />
  <template v-else>
    <Explorer :model="articleModel" :lead="lead">
      <template #actions>
        <Button variant="secondary" @click="askOpen = true">
          {{ asked.action }}
        </Button>
      </template>
      <template #intro>
        <RunsLine />
      </template>
    </Explorer>
    <AskDialog v-model:open="askOpen" />
  </template>
</template>
