<script setup lang="ts">
/**
 * Menú de acciones (patrón ARIA menu button): el botón abre con clic, Enter, Espacio o ↓ (foco en el
 * primero) y ↑ (en el último). Adentro, flechas, Inicio, Fin y tecleo; Enter elige; Esc cierra y
 * devuelve el foco al botón; Tab o un clic afuera cierran.
 */
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { useId } from '../composables/useId'
import { controlBase, variantClass } from './button'
import { ui } from './dict'
import Icon from './Icon.vue'
import type { IconName } from './icons'

export interface MenuItem {
  id: string
  label: string
  icon?: IconName
  danger?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  items: MenuItem[]
  /** Rótulo del botón: «Más acciones» si no se dice otro. */
  label?: string
  align?: 'start' | 'end'
}>(), { label: ui.actions.more, align: 'end' })

const emit = defineEmits<{ select: [id: string] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const entries = ref<HTMLButtonElement[]>([])
const menuId = useId('menu')

function setEntry(el: unknown, index: number): void {
  if (el instanceof HTMLButtonElement) entries.value[index] = el
}

const enabled = () => props.items.map((item, i) => (item.disabled ? -1 : i)).filter(i => i >= 0)

async function openMenu(focus: 'first' | 'last'): Promise<void> {
  open.value = true
  document.addEventListener('pointerdown', onOutside, true)
  await nextTick()
  const list = enabled()
  const index = focus === 'first' ? list[0] : list[list.length - 1]
  if (index !== undefined) entries.value[index]?.focus()
}

function close(returnFocus: boolean): void {
  if (!open.value) return
  open.value = false
  document.removeEventListener('pointerdown', onOutside, true)
  if (returnFocus) trigger.value?.focus()
}

function onOutside(event: PointerEvent): void {
  if (root.value && !root.value.contains(event.target as Node)) close(false)
}

function onTriggerKey(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    void openMenu(event.key === 'ArrowDown' ? 'first' : 'last')
  }
}

function toggle(): void {
  if (open.value) close(true)
  else void openMenu('first')
}

function moveFocus(from: number, step: 1 | -1 | 'home' | 'end'): void {
  const list = enabled()
  if (!list.length) return
  const pos = list.indexOf(from)
  const next = step === 'home' ? list[0] : step === 'end' ? list[list.length - 1] : list[(pos + step + list.length) % list.length]
  if (next !== undefined) entries.value[next]?.focus()
}

const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

function onMenuKey(event: KeyboardEvent, index: number): void {
  const map: Record<string, 1 | -1 | 'home' | 'end'> = { ArrowDown: 1, ArrowUp: -1, Home: 'home', End: 'end' }
  const step = map[event.key]
  if (step !== undefined) {
    event.preventDefault()
    return moveFocus(index, step)
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    return close(true)
  }
  if (event.key === 'Tab') return close(false)
  if (event.key.length === 1 && /\S/.test(event.key)) {
    const char = normalize(event.key)
    const list = enabled()
    const start = list.indexOf(index)
    for (let s = 1; s <= list.length; s++) {
      const i = list[(start + s) % list.length]!
      if (normalize(props.items[i]!.label).startsWith(char)) return entries.value[i]?.focus()
    }
  }
}

function choose(item: MenuItem): void {
  if (item.disabled) return
  close(true)
  emit('select', item.id)
}

onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside, true))
</script>

<template>
  <div ref="root" class="relative inline-flex">
    <button
      ref="trigger"
      type="button"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="open ? menuId : undefined"
      :class="[controlBase, variantClass.ghost, 'h-8 px-3']"
      @click="toggle"
      @keydown="onTriggerKey"
    >
      {{ label }}
      <Icon name="chevron-down" :size="14" class="transition-transform duration-200 ease-e" :class="open ? 'rotate-180' : ''" />
    </button>
    <div
      v-if="open"
      :id="menuId"
      role="menu"
      :aria-label="label"
      class="absolute top-full z-40 mt-1.5 grid min-w-52 animate-enter gap-px rounded-control border border-rule-strong bg-surface-2 p-1 shadow-dialog"
      :class="align === 'end' ? 'right-0' : 'left-0'"
    >
      <button
        v-for="(item, index) in items"
        :key="item.id"
        :ref="el => setEntry(el, index)"
        type="button"
        role="menuitem"
        tabindex="-1"
        :aria-disabled="item.disabled || undefined"
        class="flex h-8 w-full items-center gap-2.5 rounded-[4px] border-0 bg-transparent px-2.5 text-left text-body whitespace-nowrap transition-colors duration-120 ease-e hover:bg-surface focus-visible:bg-surface focus-visible:-outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-45"
        :class="item.danger ? 'text-danger' : 'text-ink'"
        @click="choose(item)"
        @keydown="onMenuKey($event, index)"
      >
        <Icon v-if="item.icon" :name="item.icon" :size="16" />
        {{ item.label }}
      </button>
    </div>
  </div>
</template>
