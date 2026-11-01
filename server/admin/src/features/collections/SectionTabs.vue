<script setup lang="ts">
/**
 * Las secciones del editor atadas a la ruta (:seccion o ?seccion=): pestañas WAI-ARIA de activación
 * manual (las flechas recorren, Enter o Espacio abren) con la marca de error o de cambios sin guardar.
 * En el celular, una lista de opciones nativa con las mismas marcas en palabras. El contenido de la
 * sección abierta llega por el slot y se monta una sola vez.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useId } from '../../composables/useId'
import type { ModelSection } from '../../models/types'
import type { SelectOption } from '../../ui/field'
import Select from '../../ui/Select.vue'
import Tabs, { type TabItem } from '../../ui/Tabs.vue'
import { ui } from '../../ui/dict'
import { collections } from './dict'

const props = defineProps<{
  sections: readonly ModelSection[]
  current: string
  errors: ReadonlySet<string>
  changed: ReadonlySet<string>
  /** Cifras al lado de cada rótulo, por id de sección. */
  counts?: Readonly<Record<string, number>>
}>()

const emit = defineEmits<{ go: [id: string] }>()

const wide = ref(true)
const query = matchMedia('(min-width: 768px)')
wide.value = query.matches
const onChange = (event: MediaQueryListEvent) => (wide.value = event.matches)
query.addEventListener('change', onChange)
onBeforeUnmount(() => query.removeEventListener('change', onChange))

const tabs = computed<TabItem[]>(() => props.sections.map(s => ({
  id: s.id,
  label: s.label,
  count: props.counts?.[s.id],
  mark: props.errors.has(s.id) ? 'error' : props.changed.has(s.id) ? 'changed' : undefined,
})))

const options = computed<SelectOption<string>[]>(() => tabs.value.map(tab => ({
  value: tab.id,
  label: tab.label + (tab.mark === 'error' ? ui.tabs.markError : tab.mark === 'changed' ? ui.tabs.markChanged : ''),
})))

const model = computed({
  get: () => props.current,
  set: (id: string) => emit('go', id),
})

const selectModel = computed<string | null>({
  get: () => props.current,
  set: (id) => {
    if (id) emit('go', id)
  },
})

const selectId = useId('section')
const panelId = `${selectId}-panel`
</script>

<template>
  <Tabs v-if="wide && sections.length > 1" v-model="model" :tabs="tabs" :label="collections.editor.sections">
    <slot />
  </Tabs>
  <div v-else-if="sections.length > 1" class="grid">
    <div class="grid gap-2">
      <label :for="selectId" class="text-label text-dim">{{ collections.editor.section }}</label>
      <Select :id="selectId" v-model="selectModel" :options="options" :placeholder="false" />
    </div>
    <div :id="panelId" role="region" :aria-label="tabs.find(t => t.id === current)?.label">
      <slot />
    </div>
  </div>
  <slot v-else />
</template>
