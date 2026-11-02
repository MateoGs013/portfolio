<script setup lang="ts">
/**
 * Encabezado de una etapa: su nombre (h2, enfocable para llevar el foco ahí después de una acción
 * larga), una línea que explica qué pasa en ella y sus acciones, con un solo primario.
 */
import { ref } from 'vue'

defineProps<{
  heading: string
  intro: string
}>()

const title = ref<HTMLElement | null>(null)

defineExpose({ focus: () => title.value?.focus() })
</script>

<template>
  <div class="grid gap-5">
    <div class="grid max-w-[68ch] gap-2">
      <h2 ref="title" tabindex="-1" class="m-0 animate-rise text-title" data-stage-heading>
        {{ heading }}
      </h2>
      <p class="m-0 animate-rise text-body text-dim stagger [--i:1]">
        {{ intro }}
      </p>
    </div>
    <div v-if="$slots.default" class="flex animate-rise flex-wrap items-center gap-2 stagger [--i:2]">
      <slot />
    </div>
  </div>
</template>
