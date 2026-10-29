<script setup lang="ts">
import { pad, type Folder } from '~/lib/explorer'
import { fallbackProjects } from '~/lib/fallbackData'
import ExplorerCollectionHeader from './ExplorerCollectionHeader.vue'
import ExplorerCollectionFilters from './ExplorerCollectionFilters.vue'
import ExplorerCollectionTimeline from './ExplorerCollectionTimeline.vue'
import ExplorerCollectionGrid from './ExplorerCollectionGrid.vue'
import ExplorerCollectionTable from './ExplorerCollectionTable.vue'

const props = defineProps<{
  folder: Folder
  uid: string
}>()

const route = useRoute()
const { isEs } = usePortfolioLocale()
const { isHyperfocus } = useHyperfocus()

const viewMode = ref<'grid' | 'table' | 'timeline'>(
  isHyperfocus.value ? 'table' : (props.folder.head === 'experience' ? 'timeline' : 'grid'),
)

watch(() => props.folder.head, (head) => {
  if (isHyperfocus.value) {
    viewMode.value = 'table'
  }
  else if (head === 'experience') {
    viewMode.value = 'timeline'
  }
  else {
    viewMode.value = 'grid'
  }
})

watch(isHyperfocus, (val) => {
  if (val) {
    viewMode.value = 'table'
  }
  else if (props.folder.head === 'experience') {
    viewMode.value = 'timeline'
  }
  else {
    viewMode.value = 'grid'
  }
}, { immediate: true })

// Filtros de categoría para /stack
const activeCategoryFilter = computed(() => {
  const c = route.query.category
  return typeof c === 'string' ? c.toUpperCase() : null
})

const stackCategoryCounts = computed(() => {
  const items = props.folder.items || []
  return {
    all: items.length,
    framework: items.filter(i => i.category?.toUpperCase() === 'FRAMEWORK').length,
    backend: items.filter(i => i.category?.toUpperCase() === 'BACKEND').length,
    data: items.filter(i => i.category?.toUpperCase() === 'DATA').length,
    tooling: items.filter(i => i.category?.toUpperCase() === 'TOOLING').length,
    motion: items.filter(i => i.category?.toUpperCase() === 'MOTION').length,
  }
})

const activeStatusFilter = computed(() => {
  const s = route.query.status
  return typeof s === 'string' ? s : null
})
const hasStatusFilter = computed(() => !!activeStatusFilter.value)
const isStatusLive = computed(() => activeStatusFilter.value === 'LIVE')
const isStatusWip = computed(() => activeStatusFilter.value === 'WIP')

const projectCounts = computed(() => {
  const baseline = fallbackProjects
  const all = baseline.length
  const live = baseline.filter(p => p.status === 'LIVE').length
  const wip = baseline.filter(p => p.status === 'WIP').length
  return {
    all: pad(all),
    live: pad(live),
    wip: pad(wip),
  }
})
</script>

<template>
  <div class="collection-view w-full">
    <!-- Cabecera de Carpeta con Facets & Selector de Vista -->
    <ExplorerCollectionHeader
      v-model="viewMode"
      :folder="folder"
      :uid="uid"
    />

    <!-- Filtros de Proyectos / Stack -->
    <ExplorerCollectionFilters
      :head="folder.head"
      :project-counts="projectCounts"
      :stack-category-counts="stackCategoryCounts"
      :has-status-filter="hasStatusFilter"
      :is-status-live="isStatusLive"
      :is-status-wip="isStatusWip"
      :active-category-filter="activeCategoryFilter"
    />

    <!-- 1. Vista de Cronología Técnica (Timeline) para Experiencia -->
    <ExplorerCollectionTimeline
      v-if="viewMode === 'timeline' && folder.head === 'experience'"
      :items="folder.items"
      :experience="folder.experience"
      :projects="folder.projects"
    />

    <!-- 2. Vista de Cuadrícula (Especializada por Colección) -->
    <ExplorerCollectionGrid
      v-else-if="viewMode === 'grid'"
      :head="folder.head"
      :items="folder.items"
      :experience="folder.experience"
    />

    <!-- 3. Vista de Tabla Técnica Compacta -->
    <ExplorerCollectionTable
      v-else-if="viewMode === 'table'"
      :items="folder.items"
      :head="folder.head"
    />

    <!-- Mensaje si no hay registros -->
    <p v-if="!folder.items.length" class="vacio my-6 font-mono text-[11px] text-dim text-center">
      {{ isEs ? '00 registros encontrados para este filtro' : '00 records found for this filter' }}
    </p>
  </div>
</template>
