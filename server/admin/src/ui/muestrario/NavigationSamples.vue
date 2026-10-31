<script setup lang="ts">
/** Pestañas con marcas y la lista como pantalla (filas grandes) y densa, sobre las obras de la base. */
import { ref } from 'vue'
import { ui } from '../dict'
import EmptyState from '../EmptyState.vue'
import ErrorState from '../ErrorState.vue'
import Listbox from '../Listbox.vue'
import Skeleton from '../Skeleton.vue'
import Tabs from '../Tabs.vue'
import { toast } from '../../stores/toasts'
import Sample from './Sample.vue'
import type { SampleProject } from './useSampleProjects'

defineProps<{
  projects: SampleProject[]
  loading: boolean
  error: string
}>()

defineEmits<{ retry: [] }>()

const t = ui.muestrario
const s = t.sample

const section = ref('essentials')
const tabs = [
  { id: 'essentials', label: s.essentials },
  { id: 'story', label: s.story, mark: 'changed' as const },
  { id: 'images', label: s.images, mark: 'error' as const },
  { id: 'data', label: s.data },
]
const activeRow = ref<string | number | null>(null)
const activeCompact = ref<string | number | null>(null)

function open(item: SampleProject): void {
  toast(`${s.viewSite}: ${item.title}`, { tone: 'info' })
}
</script>

<template>
  <Sample :title="t.tabs.title" :text="t.tabs.text">
    <Tabs v-model="section" :tabs="tabs" :label="s.section">
      <template #default="{ tab }">
        <p class="m-0 pt-6 text-body text-dim">
          {{ tab.label }}
        </p>
      </template>
    </Tabs>
  </Sample>

  <Sample :title="t.listbox.title" :text="t.listbox.text">
    <Skeleton v-if="loading" variant="rows" :count="4" />
    <ErrorState v-else-if="error" :message="error" @retry="$emit('retry')" />
    <EmptyState v-else-if="!projects.length" />
    <Listbox
      v-else
      v-model:active="activeRow"
      :items="projects"
      :label="t.listbox.title"
      @activate="open"
    />
  </Sample>

  <Sample :title="t.compact.title" :text="t.compact.text">
    <div class="max-w-[340px] overflow-hidden rounded-control border border-rule bg-panel">
      <Listbox
        v-if="projects.length"
        v-model:active="activeCompact"
        :items="projects"
        :label="t.compact.title"
        variant="compact"
        @activate="open"
      />
      <Skeleton v-else variant="text" :count="3" class="p-4" />
    </div>
  </Sample>
</template>
