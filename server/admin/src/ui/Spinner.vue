<script setup lang="ts">
/**
 * Indicador de espera. Con movimiento reducido no gira: se lee la palabra. El texto siempre está
 * para el lector de pantalla.
 */
import { ui } from './dict'

withDefaults(defineProps<{
  label?: string
  /** Mostrar la palabra al lado del círculo también con movimiento. */
  showLabel?: boolean
  /** Región viva propia. Apagala dentro de un control que ya anuncia la espera (aria-busy). */
  live?: boolean
}>(), { label: ui.states.loading, showLabel: false, live: true })
</script>

<template>
  <span class="inline-flex items-center gap-2 text-label" :role="live ? 'status' : undefined">
    <svg
      class="size-3.5 shrink-0 animate-spin motion-reduce:hidden"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.5" />
      <path d="M14.25 8A6.25 6.25 0 0 0 8 1.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    </svg>
    <span :class="showLabel ? '' : 'sr-only motion-reduce:not-sr-only'">{{ label }}</span>
  </span>
</template>
