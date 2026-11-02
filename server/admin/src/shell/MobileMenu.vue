<script setup lang="ts">
/**
 * El menú del celular: la misma navegación (NAV) y los enlaces de sesión en un diálogo. Elegir una
 * sección lo cierra. Mientras sale, el resto de la página sigue inerte y el diálogo devuelve el foco
 * al botón «Menú»: por eso, si se navegó, el foco se pide otra vez para el h1 al terminar de cerrar.
 */
import Dialog from '../ui/Dialog.vue'
import { shell } from './dict'
import Nav from './Nav.vue'
import SessionLinks from './SessionLinks.vue'
import { focusView } from './title'

const open = defineModel<boolean>('open', { default: false })

let navigated = false
function onNavigate(): void {
  navigated = true
  open.value = false
}
function onClosed(): void {
  if (navigated) void focusView()
  navigated = false
}
</script>

<template>
  <Dialog v-model:open="open" :title="shell.header.menuTitle" size="sm" initial-focus="[aria-current='page']" @close="onClosed">
    <Nav @navigate="onNavigate" />
    <div class="mt-5 border-t border-rule px-2.5 pt-3">
      <SessionLinks @navigate="open = false" />
    </div>
  </Dialog>
</template>
