<script setup lang="ts">
/**
 * El marco del admin con sesión. Una cosa por pantalla (dirección elegida en la demo):
 * - desde 768 px, la columna de 220 px (cabecera, navegación y sesión) y la pantalla al lado, que
 *   tiene su propio scroll;
 * - en el celular, la barra de 52 px arriba con la paleta y el menú, y la pantalla debajo (la lista o
 *   el registro, de a uno: maestro y detalle).
 * El primer Tab es «Saltar al editor». Acá viven la paleta, el sondeo del estado y /meta.
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { closePalette, paletteOpen, togglePalette } from '../composables/usePalette'
import { onShortcut } from '../composables/useShortcuts'
import { enableMeta } from '../stores/meta'
import { watchStatus } from '../stores/status'
import CommandPalette from './CommandPalette.vue'
import { shell } from './dict'
import Header from './Header.vue'
import MobileMenu from './MobileMenu.vue'
import Nav from './Nav.vue'
import { registerShellSources } from './paletteSources'
import SessionLinks from './SessionLinks.vue'

const route = useRoute()
const router = useRouter()
const main = ref<HTMLElement | null>(null)
const menuOpen = ref(false)

/** La paleta no se abre encima de otro diálogo (una confirmación, la reautenticación). */
function palette(): void {
  if (!paletteOpen.value && document.querySelector('dialog[open]')) return
  menuOpen.value = false
  togglePalette()
}

onShortcut('palette', palette)

let stopStatus: (() => void) | null = null
let removeSources: (() => void) | null = null
onMounted(() => {
  enableMeta(true)
  stopStatus = watchStatus()
  removeSources = registerShellSources(router)
})
onBeforeUnmount(() => {
  stopStatus?.()
  removeSources?.()
  enableMeta(false)
  closePalette()
})

// Cada pantalla arranca desde arriba: el scroll es de la zona principal, no de la ventana.
watch(() => route.path, () => main.value?.scrollTo({ top: 0 }))

function skipToMain(): void {
  const el = main.value
  if (!el) return
  const target = el.querySelector<HTMLElement>('h1') ?? el
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus()
}
</script>

<template>
  <div class="grid h-dvh grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[220px_minmax(0,1fr)] md:grid-rows-1">
    <a
      href="#main"
      class="fixed top-3 left-3 z-60 -translate-y-20 rounded-control border border-rule-strong bg-surface-2 px-3 py-1.5 text-body text-ink no-underline shadow-dialog transition-transform duration-200 ease-e focus-visible:translate-y-0"
      @click.prevent="skipToMain"
    >{{ shell.header.skip }}</a>

    <div class="hidden min-h-0 flex-col overflow-y-auto border-r border-rule bg-bg px-2.5 pt-4 pb-3 md:flex">
      <Header variant="side" @palette="palette" />
      <Nav class="mt-3.5" />
      <div class="mt-auto border-t border-rule px-2.5 pt-3">
        <SessionLinks />
      </div>
    </div>

    <Header variant="bar" class="md:hidden" @palette="palette" @menu="menuOpen = true" />

    <main id="main" ref="main" tabindex="-1" class="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto focus:outline-none">
      <slot />
    </main>

    <MobileMenu v-model:open="menuOpen" />
    <CommandPalette />
  </div>
</template>
