<script setup lang="ts">
/**
 * El menú del celular: la misma navegación (NAV) y los enlaces de sesión en un diálogo. Elegir una
 * sección lo cierra.
 */
import Dialog from '../ui/Dialog.vue'
import { shell } from './dict'
import Nav from './Nav.vue'
import SessionLinks from './SessionLinks.vue'

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <Dialog v-model:open="open" :title="shell.header.menuTitle" size="sm" initial-focus="[aria-current='page']">
    <Nav @navigate="open = false" />
    <div class="mt-5 border-t border-rule px-2.5 pt-3">
      <SessionLinks @navigate="open = false" />
    </div>
  </Dialog>
</template>
