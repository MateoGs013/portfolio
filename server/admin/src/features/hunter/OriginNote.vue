<script setup lang="ts">
/**
 * De dónde salió lo que se ve: «Generado por Eros», «Armado desde la base, sin Eros», la muestra de
 * prueba o una estimación sin Gemini. Es una fuente, no una marca: texto chico con su punto, sin logo
 * ni color propio; solo lo que escribió Eros con el modelo lleva el punto encendido.
 */
import type { Origin } from './adapter'
import { job as t } from './dictJob'

defineProps<{ origin: Origin }>()
</script>

<template>
  <p class="m-0 inline-flex items-center gap-2 text-label text-faint" data-origin>
    <span class="size-1.5 shrink-0 rounded-full" :class="origin === 'eros' ? 'bg-ok' : 'bg-faint'" aria-hidden="true" />
    {{ t.origin[origin] }}
  </p>
</template>
