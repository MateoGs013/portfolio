<script setup lang="ts">
/**
 * Los resultados de la paleta: un listbox con grupos y un resaltado que viaja 300 ms (solo transform)
 * hasta la opción activa. El foco se queda en el campo (aria-activedescendant); el puntero también
 * mueve el resaltado y el clic elige.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { paletteOptionId, type PaletteEntry, type PaletteSection } from '../composables/usePalette'
import { shell } from './dict'

const props = defineProps<{
  id: string
  sections: PaletteSection[]
  active: number
}>()

const emit = defineEmits<{ hover: [index: number], pick: [index: number] }>()

const list = ref<HTMLElement | null>(null)
const highlight = ref({ y: 0, h: 0, travel: false })

interface IndexedSection {
  group: PaletteSection['group']
  entries: { entry: PaletteEntry, index: number }[]
}

/** Cada entrada con su posición en la lista plana, que es la que recorren las flechas. */
const indexed = computed<IndexedSection[]>(() => {
  let index = 0
  return props.sections.map(section => ({
    group: section.group,
    entries: section.entries.map(entry => ({ entry, index: index++ })),
  }))
})

function place(travel: boolean): void {
  const el = list.value?.querySelector<HTMLElement>(`#${CSS.escape(paletteOptionId(props.id, props.active))}`)
  if (!el) {
    highlight.value = { y: 0, h: 0, travel: false }
    return
  }
  highlight.value = { y: el.offsetTop, h: el.offsetHeight, travel: travel && highlight.value.h > 0 }
  el.scrollIntoView({ block: 'nearest' })
}

// Al cambiar los resultados el resaltado salta sin viajar; al moverse, viaja.
watch(() => props.sections, () => void nextTick(() => place(false)), { immediate: true, flush: 'post' })
watch(() => props.active, () => void nextTick(() => place(true)))

const highlightStyle = computed(() => ({ transform: `translateY(${highlight.value.y}px)`, height: `${highlight.value.h}px`, opacity: highlight.value.h ? 1 : 0 }))
const groupLabel = (group: PaletteSection['group']) => shell.palette.groups[group]
</script>

<template>
  <div :id="id" ref="list" role="listbox" :aria-label="shell.palette.results" class="relative max-h-[min(380px,52dvh)] overflow-y-auto overscroll-contain p-1.5">
    <span
      class="pointer-events-none absolute inset-x-1.5 top-0 z-0 rounded-control bg-rule shadow-[inset_2px_0_0_var(--sig)]"
      :class="highlight.travel ? 'transition-transform duration-300 ease-e' : ''"
      :style="highlightStyle"
      aria-hidden="true"
    />
    <div v-for="section in indexed" :key="section.group" role="group" :aria-labelledby="`${id}-${section.group}`">
      <div :id="`${id}-${section.group}`" class="px-3 pt-2.5 pb-1 text-meta text-faint">
        {{ groupLabel(section.group) }}
      </div>
      <div
        v-for="{ entry, index } in section.entries"
        :id="paletteOptionId(id, index)"
        :key="entry.key"
        role="option"
        :aria-selected="index === active"
        class="relative z-1 flex h-9 cursor-pointer items-center gap-2.5 rounded-control px-3 text-body transition-colors duration-120 ease-e"
        :class="index === active ? 'text-ink' : 'text-dim'"
        @pointermove="index !== active && emit('hover', index)"
        @click="emit('pick', index)"
      >
        <span class="min-w-0 truncate">{{ entry.label }}</span>
        <span v-if="entry.hint" class="ml-auto shrink-0 pl-3 text-meta" :class="index === active ? 'text-dim' : 'text-faint'">{{ entry.hint }}</span>
      </div>
    </div>
  </div>
</template>
