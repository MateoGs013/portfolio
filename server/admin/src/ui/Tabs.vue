<script setup lang="ts">
/**
 * Pestañas WAI-ARIA con activación manual: las flechas mueven el foco (Inicio y Fin van a los
 * extremos) y Enter o Espacio eligen. El subrayado en --sig viaja 300 ms entre pestañas; solo se
 * anima transform. Cada pestaña puede llevar una marca de error o de cambios sin guardar.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useId } from '../composables/useId'
import { ui } from './dict'

export interface TabItem {
  id: string
  label: string
  count?: number
  mark?: 'error' | 'changed'
}

const props = defineProps<{
  tabs: TabItem[]
  label: string
}>()

const model = defineModel<string>({ required: true })

const base = useId('tabs')
const tabId = (id: string) => `${base}-tab-${id}`
const panelId = (id: string) => `${base}-panel-${id}`

const list = ref<HTMLElement | null>(null)
const buttons = ref<HTMLButtonElement[]>([])
// Ref por función: el arreglo de refs de un v-for no garantiza el orden.
function setButton(el: unknown, index: number): void {
  if (el instanceof HTMLButtonElement) buttons.value[index] = el
}
const focusIndex = ref(Math.max(0, props.tabs.findIndex(t => t.id === model.value)))
const indicator = ref({ x: 0, w: 0, ready: false })

const activeIndex = computed(() => props.tabs.findIndex(t => t.id === model.value))

function place(): void {
  const el = buttons.value[activeIndex.value]
  if (!el || !list.value) return
  indicator.value = { x: el.offsetLeft, w: el.offsetWidth, ready: indicator.value.ready || indicator.value.w > 0 }
}

function focusTab(index: number): void {
  const count = props.tabs.length
  focusIndex.value = (index + count) % count
  buttons.value[focusIndex.value]?.focus()
}

function onKeydown(event: KeyboardEvent): void {
  const keys: Record<string, () => void> = {
    ArrowRight: () => focusTab(focusIndex.value + 1),
    ArrowLeft: () => focusTab(focusIndex.value - 1),
    Home: () => focusTab(0),
    End: () => focusTab(props.tabs.length - 1),
  }
  const action = keys[event.key]
  if (!action) return
  event.preventDefault()
  action()
}

function select(index: number): void {
  const tab = props.tabs[index]
  if (!tab) return
  focusIndex.value = index
  model.value = tab.id
}

let observer: ResizeObserver | null = null
onMounted(() => {
  place()
  observer = new ResizeObserver(place)
  if (list.value) observer.observe(list.value)
  // Con las fuentes cargadas cambia el ancho de los rótulos.
  void document.fonts?.ready.then(place)
})
onBeforeUnmount(() => observer?.disconnect())
watch([model, () => props.tabs], () => {
  focusIndex.value = Math.max(0, activeIndex.value)
  void nextTick(place)
}, { deep: true })

/** El subrayado mide 100 px y escala: así viaja solo con transform. */
const indicatorStyle = computed(() => ({
  transform: `translateX(${indicator.value.x}px) scaleX(${indicator.value.w / 100})`,
  opacity: indicator.value.w ? 1 : 0,
}))
</script>

<template>
  <div>
    <div
      ref="list"
      role="tablist"
      :aria-label="label"
      class="relative flex gap-7 overflow-x-auto border-b border-rule [scrollbar-width:none]"
      @keydown="onKeydown"
    >
      <button
        v-for="(tab, index) in tabs"
        :id="tabId(tab.id)"
        :key="tab.id"
        :ref="el => setButton(el, index)"
        type="button"
        role="tab"
        :aria-selected="tab.id === model"
        :aria-controls="panelId(tab.id)"
        :tabindex="index === focusIndex ? 0 : -1"
        class="relative inline-flex shrink-0 items-baseline gap-1.5 border-0 bg-transparent px-0 pt-2 pb-3 text-row font-[420] whitespace-nowrap transition-colors duration-120 ease-e hover:text-ink focus-visible:-outline-offset-2"
        :class="tab.id === model ? 'text-ink' : 'text-faint'"
        @click="select(index)"
      >
        {{ tab.label }}
        <span v-if="tab.count !== undefined" class="text-meta text-faint tabular-nums">{{ tab.count }}</span>
        <span
          v-if="tab.mark"
          class="size-1.5 self-center rounded-full"
          :class="tab.mark === 'error' ? 'bg-danger' : 'bg-wip'"
          aria-hidden="true"
        />
        <span v-if="tab.mark" class="sr-only">{{ tab.mark === 'error' ? ui.tabs.markError : ui.tabs.markChanged }}</span>
      </button>
      <span
        class="pointer-events-none absolute bottom-0 left-0 h-0.5 w-[100px] origin-left bg-sig"
        :class="indicator.ready ? 'transition-transform duration-300 ease-e' : ''"
        :style="indicatorStyle"
        aria-hidden="true"
      />
    </div>
    <div
      v-for="tab in tabs"
      v-show="tab.id === model"
      :id="panelId(tab.id)"
      :key="tab.id"
      role="tabpanel"
      :aria-labelledby="tabId(tab.id)"
      tabindex="0"
      class="focus-visible:outline-offset-4"
    >
      <slot v-if="tab.id === model" :tab="tab" />
    </div>
  </div>
</template>
