<script setup lang="ts">
/**
 * #/busqueda/tendencias[/:id]: el radar como pantalla o una tendencia. La lista se pide una vez al
 * entrar (y a lo sumo una vez por minuto) y queda para volver.
 */
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { trends } from './store'
import TrendDetail from './TrendDetail.vue'
import TrendList from './TrendList.vue'

const route = useRoute()
const id = computed(() => (typeof route.params['id'] === 'string' && route.params['id'] ? route.params['id'] : null))

onMounted(() => {
  void trends.load(false)
})
</script>

<template>
  <TrendDetail v-if="id" :id="id" :key="id" />
  <TrendList v-else />
</template>
