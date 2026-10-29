<script setup lang="ts">
import ExplorerHeader from '../ExplorerHeader.vue'
import UiSegmentedSwitch from '~/components/ui/UiSegmentedSwitch.vue'
import { pad, type Folder } from '~/lib/explorer'

const props = defineProps<{
  folder: Folder
  uid: string
  modelValue: 'grid' | 'table' | 'timeline'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: 'grid' | 'table' | 'timeline'): void
}>()

const { isEs, tr } = usePortfolioLocale()

const viewOptions = computed(() => {
  const opts = [
    { value: 'grid', label: tr.value.collection.grid },
    { value: 'table', label: tr.value.collection.table },
  ]
  if (props.folder.head === 'experience') {
    opts.unshift({ value: 'timeline', label: tr.value.collection.timeline })
  }
  return opts
})

const currentView = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>

<template>
  <ExplorerHeader :id="uid" kind="folder" :badge="pad(folder.count)" :name="folder.head" :line="folder.line">
    <div class="folder-header-actions flex items-center gap-2.5 flex-wrap">
      <!-- Filtros Activos Facetados -->
      <template v-if="folder.facets.length">
        <NuxtLink
          v-for="f in folder.facets"
          :key="f.key"
          :to="f.remove"
          class="inline-flex items-center gap-2 h-7 px-2.5 rounded-md border border-sig/40 bg-sig/10 font-mono text-[11px] text-ink no-underline hover:border-sig transition-colors"
          :title="`quitar el filtro ${f.key}`"
        >
          <span>{{ f.key }}: <strong class="text-sig">{{ f.value }}</strong></span>
          <span class="text-dim" aria-hidden="true">×</span>
        </NuxtLink>
      </template>

      <!-- Selector de Vista Táctil (Bencho UI Segmented Switch) -->
      <UiSegmentedSwitch
        v-if="folder.items.length"
        v-model="currentView"
        :options="viewOptions"
        :aria-label="isEs ? 'Modo de visualización' : 'View mode'"
      />
    </div>
  </ExplorerHeader>
</template>
