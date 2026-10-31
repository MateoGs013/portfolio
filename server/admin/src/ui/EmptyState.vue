<script setup lang="ts">
/**
 * Una lista o una vista sin nada todavía: qué falta, para qué sirve y la acción que lo resuelve
 * («Nueva obra»). Va alineado a la izquierda, con el aire de la pantalla.
 */
import { ui } from './dict'

withDefaults(defineProps<{
  title?: string
  text?: string
}>(), { title: ui.states.emptyTitle })
</script>

<template>
  <div class="grid max-w-[60ch] gap-3 border-t border-rule py-10">
    <h2 class="m-0 text-title">
      {{ title }}
    </h2>
    <p v-if="text" class="m-0 text-lead text-dim">
      {{ text }}
    </p>
    <div v-if="$slots.default" class="mt-3 flex flex-wrap gap-2">
      <slot />
    </div>
  </div>
</template>
