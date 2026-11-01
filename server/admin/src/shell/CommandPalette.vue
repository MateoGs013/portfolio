<script setup lang="ts">
/**
 * La paleta «Ir a» (Ctrl/⌘K): un combobox ARIA sobre un diálogo modal. El campo tiene el foco todo el
 * tiempo; ↑↓ (o Inicio y Fin) mueven la opción activa (aria-activedescendant), Enter la abre y Esc
 * cierra y devuelve el foco a quien la abrió. Busca secciones, acciones y registros sin acentos.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { closePalette, paletteOpen, paletteOptionId, usePaletteResults } from '../composables/usePalette'
import { useId } from '../composables/useId'
import { announce } from '../ui/announce'
import Dialog from '../ui/Dialog.vue'
import Icon from '../ui/Icon.vue'
import Kbd from '../ui/Kbd.vue'
import { shell } from './dict'
import { focusView } from './title'
import PaletteList from './PaletteList.vue'

const router = useRouter()
const query = ref('')
const active = ref(0)
const listId = useId('palette')
const sections = usePaletteResults(() => query.value)
const flat = computed(() => sections.value.flatMap(section => section.entries))

const open = computed({
  get: () => paletteOpen.value,
  set: (value: boolean) => {
    if (!value) closePalette()
  },
})

watch(paletteOpen, (isOpen) => {
  if (!isOpen) return
  query.value = ''
  active.value = 0
})

// Escribir vuelve al primer resultado y dice cuántos hay (no en cada tecla: al quedarse quieto).
let quiet: ReturnType<typeof setTimeout> | undefined
watch(query, (value) => {
  active.value = 0
  clearTimeout(quiet)
  quiet = setTimeout(() => {
    if (!paletteOpen.value) return
    announce(flat.value.length ? shell.palette.count(flat.value.length) : shell.palette.empty(value.trim()))
  }, 450)
})

onBeforeUnmount(() => clearTimeout(quiet))
watch(paletteOpen, (isOpen) => {
  if (!isOpen) clearTimeout(quiet)
})

function move(to: number): void {
  const last = flat.value.length - 1
  if (last < 0) return
  active.value = Math.max(0, Math.min(last, to))
}

/**
 * Al navegar, el foco tiene que terminar en el h1 de la vista nueva y no en quien abrió la paleta (el
 * diálogo lo devuelve ahí al cerrarse): se pide otra vez después de que cierra.
 */
let navigated = false

async function pick(index = active.value): Promise<void> {
  const entry = flat.value[index]
  if (!entry) return
  closePalette()
  if (entry.run) return entry.run()
  if (!entry.to) return
  navigated = true
  await router.push(entry.to)
}

function onClosed(): void {
  if (navigated) void focusView()
  navigated = false
}

function onKeydown(event: KeyboardEvent): void {
  const keys: Record<string, () => void> = {
    ArrowDown: () => move(active.value + 1),
    ArrowUp: () => move(active.value - 1),
    PageDown: () => move(active.value + 8),
    PageUp: () => move(active.value - 8),
    Enter: () => void pick(),
  }
  // Inicio y Fin quedan para el texto mientras se escribe; sin texto recorren la lista.
  if (!query.value) Object.assign(keys, { Home: () => move(0), End: () => move(flat.value.length - 1) })
  const action = keys[event.key]
  if (!action || event.isComposing) return
  event.preventDefault()
  action()
}

const activeId = computed(() => (flat.value[active.value] ? paletteOptionId(listId, active.value) : undefined))
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="shell.palette.title"
    :close-button="false"
    initial-focus="[role='combobox']"
    class="mt-[14vh] [&]:w-[min(620px,calc(100vw-32px))] [&>div>header]:sr-only [&_[data-dialog-body]]:p-0"
    @close="onClosed"
  >
    <div class="flex items-center gap-3 border-b border-rule px-4.5">
      <Icon name="search" :size="16" class="text-faint" />
      <input
        v-model="query"
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-autocomplete="list"
        :aria-controls="listId"
        :aria-activedescendant="activeId"
        :aria-label="shell.palette.title"
        :placeholder="shell.palette.placeholder"
        autocomplete="off"
        spellcheck="false"
        class="h-12.5 min-w-0 flex-1 border-0 bg-transparent p-0 text-field text-ink outline-none placeholder:text-faint focus-visible:outline-none"
        @keydown="onKeydown"
      >
    </div>
    <PaletteList :id="listId" :sections="sections" :active="active" @hover="active = $event" @pick="pick" />
    <p v-if="!flat.length" class="m-0 px-4.5 pt-1 pb-5 text-body text-dim">
      {{ shell.palette.empty(query.trim()) }}
    </p>
    <div class="flex flex-wrap gap-x-4 gap-y-1 border-t border-rule px-4 py-2.5 text-meta text-faint" aria-hidden="true">
      <span class="inline-flex items-center gap-1.5"><Kbd keys="up" /><Kbd keys="down" /> {{ shell.palette.move }}</span>
      <span class="inline-flex items-center gap-1.5"><Kbd keys="enter" /> {{ shell.palette.open }}</span>
      <span class="inline-flex items-center gap-1.5"><Kbd keys="esc" /> {{ shell.palette.close }}</span>
    </div>
  </Dialog>
</template>
