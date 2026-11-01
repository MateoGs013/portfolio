<script setup lang="ts">
/**
 * #/obras: la lista como pantalla (filtros, búsqueda y filas grandes), o el orden del sitio con
 * ?vista=orden. #/obras/nueva y #/obras/:id[/:seccion]: el editor de la obra.
 */
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { focusView } from '../../shell/title'
import Button from '../../ui/Button.vue'
import { summary } from '../../stores/meta'
import Explorer from '../collections/Explorer.vue'
import { projectsText } from './dict'
import { projectModel } from './model'
import ProjectEditor from './ProjectEditor.vue'
import ProjectOrder from './ProjectOrder.vue'

const route = useRoute()
const router = useRouter()

const id = computed<number | 'nueva' | null>(() => {
  if (route.name === 'obra-nueva') return 'nueva'
  if (route.name !== 'obra') return null
  const n = Number(route.params['id'])
  return Number.isInteger(n) ? n : null
})

const ordering = computed(() => route.name === 'obras' && route.query['vista'] === 'orden')
const orderHref = computed(() => router.resolve({ name: 'obras', query: { vista: 'orden' } }).href)
// Lista y orden son la misma ruta: el router no mueve el foco, lo hace esta vista.
watch(ordering, () => void focusView())

const lead = computed(() => {
  const counts = summary.value?.projects
  if (!counts) return undefined
  return projectsText.lead(counts.visible, counts.visible + counts.hidden + counts.scheduled)
})
</script>

<template>
  <ProjectEditor v-if="id !== null" :id="id" />
  <ProjectOrder v-else-if="ordering" />
  <Explorer v-else :model="projectModel" :lead="lead">
    <template #actions>
      <Button :href="orderHref">
        {{ projectsText.order }}
      </Button>
    </template>
  </Explorer>
</template>
