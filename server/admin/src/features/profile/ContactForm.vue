<script setup lang="ts">
/**
 * Contacto: los bloques fijos del esquema en sus grupos (email y perfiles iguales en los dos idiomas,
 * el PDF del CV con un archivo por idioma, la disponibilidad traducida) y los bloques libres al final.
 */
import DocGroups from './DocGroups.vue'
import FreeBlocks from './FreeBlocks.vue'
import { profile } from './dict'
import type { DocEditor } from './useDocEditor'

defineProps<{ editor: DocEditor }>()
</script>

<template>
  <div class="grid gap-16">
    <DocGroups :editor="editor" :groups="profile.docs.contact.groups" />
    <FreeBlocks :model-value="editor.form.value.free" @update:model-value="editor.setFree($event)" />
  </div>
</template>
