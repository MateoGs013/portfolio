<script setup lang="ts" generic="T extends ListboxItem">
/**
 * Lista de registros con roving tabindex: un solo Tab entra, ↑↓ (o j/k) se mueven, Inicio y Fin van
 * a los extremos, tipear salta al primero que empieza así y Enter abre. El elegido lleva aria-selected.
 *
 * `rows` es la lista como pantalla de la dirección elegida: filas grandes que entran escalonadas
 * (45 ms) y, al apuntar una, las hermanas bajan a .28 y la apuntada se corre 14 px, como el sitio.
 * `compact` es la versión densa para paneles y popovers.
 */
import { computed, ref, watch } from 'vue'
import type { ListboxItem } from './listbox'
import StatusDot from './StatusDot.vue'

const props = withDefaults(defineProps<{
  items: T[]
  label: string
  variant?: 'rows' | 'compact'
}>(), { variant: 'rows' })

const emit = defineEmits<{ activate: [item: T] }>()
const active = defineModel<T['key'] | null>('active', { default: null })

const options = ref<HTMLElement[]>([])
function setOption(el: unknown, index: number): void {
  if (el instanceof HTMLElement) options.value[index] = el
}

const activeIndex = computed(() => {
  const i = props.items.findIndex(item => item.key === active.value)
  return i >= 0 ? i : 0
})

watch(() => props.items, (items) => {
  if (active.value !== null && !items.some(item => item.key === active.value)) active.value = items[0]?.key ?? null
})

function moveTo(index: number): void {
  const item = props.items[index]
  if (!item) return
  active.value = item.key
  options.value[index]?.focus()
  options.value[index]?.scrollIntoView({ block: 'nearest' })
}

const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
let typed = ''
let typedAt = 0

/** Tecleo: las letras que llegan en menos de medio segundo forman un prefijo. */
function typeahead(char: string): void {
  const now = Date.now()
  typed = now - typedAt > 500 ? char : typed + char
  typedAt = now
  const query = normalize(typed)
  const count = props.items.length
  const start = typed.length === 1 ? activeIndex.value + 1 : activeIndex.value
  for (let step = 0; step < count; step++) {
    const index = (start + step) % count
    if (normalize(props.items[index]!.title).startsWith(query)) return moveTo(index)
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const last = props.items.length - 1
  const moves: Record<string, number> = {
    ArrowDown: Math.min(last, activeIndex.value + 1),
    j: Math.min(last, activeIndex.value + 1),
    ArrowUp: Math.max(0, activeIndex.value - 1),
    k: Math.max(0, activeIndex.value - 1),
    Home: 0,
    End: last,
  }
  const target = moves[event.key]
  if (target !== undefined) {
    event.preventDefault()
    return moveTo(target)
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    const item = props.items[activeIndex.value]
    if (item) emit('activate', item)
    return
  }
  if (event.key.length === 1 && /\S/.test(event.key)) typeahead(event.key)
}

function onClick(item: T, index: number): void {
  active.value = item.key
  options.value[index]?.focus()
  emit('activate', item)
}

const rows = computed(() => props.variant === 'rows')
</script>

<template>
  <ul
    role="listbox"
    :aria-label="label"
    class="m-0 list-none p-0"
    :class="rows ? 'group/rows border-t border-rule' : ''"
    @keydown="onKeydown"
  >
    <li
      v-for="(item, index) in items"
      :key="item.key"
      :ref="el => setOption(el, index)"
      role="option"
      :aria-selected="index === activeIndex"
      :tabindex="index === activeIndex ? 0 : -1"
      :data-key="item.key"
      :style="rows ? { '--i': Math.min(index, 12) } : undefined"
      :class="rows
        ? 'group/row grid animate-rise grid-cols-1 items-baseline gap-2 border-b border-rule pt-5 pb-5.5 stagger transition-opacity duration-500 ease-e group-hover/rows:not-hover:opacity-28 group-hover/rows:focus-visible:opacity-100 focus-visible:outline-offset-[-2px] lg:grid-cols-[minmax(18ch,1fr)_auto] lg:gap-6'
        : 'grid gap-1 border-b border-rule px-4 pt-2.75 pb-3 transition-colors duration-120 ease-e hover:bg-surface aria-selected:bg-surface-2 focus-visible:-outline-offset-2'"
      @click="onClick(item, index)"
    >
      <slot :item="item" :index="index" :active="index === activeIndex">
        <span
          class="min-w-0"
          :class="rows
            ? 'w-fit max-w-full text-list text-ink transition-transform duration-700 ease-e group-hover/row:translate-x-3.5'
            : 'truncate text-row text-ink'"
          :data-title="item.key"
        >{{ item.title }}</span>
        <span
          class="flex items-baseline gap-x-4.5 gap-y-1"
          :class="rows
            ? 'flex-wrap justify-start text-left text-body text-dim lg:justify-end lg:text-right'
            : 'min-w-0 text-label text-faint [&>span:not(:last-child)]:truncate'"
        >
          <StatusDot v-if="item.status" :tone="item.status.tone" :label="item.status.label" />
          <span v-if="item.meta">{{ item.meta }}</span>
          <span v-if="item.aside" class="shrink-0 text-faint tabular-nums" :class="rows ? '' : 'ml-auto'">{{ item.aside }}</span>
        </span>
      </slot>
    </li>
  </ul>
</template>
