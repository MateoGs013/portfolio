<script setup lang="ts">
/**
 * #/busqueda/vacantes[/:id[/:etapa]]: la cola como pantalla o una vacante por etapas. Sin etapa en la
 * dirección, la vacante abre en Análisis (y la dirección lo dice). La cola se pide una vez y queda
 * para la paleta y para volver.
 */
import { computed, nextTick, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import JobDetail from './JobDetail.vue'
import { isStage } from './model'
import { registerHunterPalette } from './palette'
import Queue from './Queue.vue'
import { loadQueue } from './store'

const route = useRoute()
const router = useRouter()

const id = computed(() => (typeof route.params['id'] === 'string' && route.params['id'] ? route.params['id'] : null))
const stage = computed(() => (isStage(route.params['etapa']) ? route.params['etapa'] : null))

watch([id, stage], ([current, step]) => {
  if (current && !step) void router.replace({ path: `/busqueda/vacantes/${encodeURIComponent(current)}/analisis`, query: route.query })
}, { immediate: true })

onMounted(() => {
  // Después del shell: en la primera carga el shell se monta después que esta vista y registra su
  // propia fuente de vacantes, que esta reemplaza.
  void nextTick().then(() => registerHunterPalette(router))
  void loadQueue(false)
})
</script>

<template>
  <JobDetail v-if="id" :id="id" :stage="stage ?? 'analisis'" />
  <Queue v-else />
</template>
