<script setup lang="ts">
/**
 * De dónde salió lo que se ve: «Generado por Eros» o «Armado desde la base, sin Eros» (o la muestra
 * de prueba). Es una fuente, no una marca: texto chico con su punto, sin logo ni color propio.
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
