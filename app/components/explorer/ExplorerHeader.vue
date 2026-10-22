<script setup lang="ts">
// La cabecera de lo que está abierto, igual en todos los niveles: el ícono
// (carpeta o archivo) con el dato dominante adentro, el nombre a escala de
// interfaz y la línea de tipo debajo. A la derecha, lo que acompaña: los
// filtros activos de una carpeta o los vecinos de un archivo.
import ExplorerBadge from './ExplorerBadge.vue'

defineProps<{
  /** Id del h1, para el aria-labelledby del panel. */
  id: string
  kind: 'folder' | 'file'
  badge: string
  name: string
  /** Partes de la línea de tipo, separadas por aire: `record`, `Project`, `updatedAt 2026-09-05`. */
  line: string[]
}>()
</script>

<template>
  <header class="cabecera grid grid-cols-[auto_minmax(0,1fr)] md:grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 sm:gap-x-3.5 gap-y-3 items-center pt-0.5 pb-5 border-b border-rule w-full min-w-0">
    <ExplorerBadge :kind="kind" :badge="badge" class="icono !w-10 sm:!w-11 !h-[44px] sm:!h-[48px] shrink-0" />
    <div class="quien min-w-0 flex flex-col justify-center">
      <h1 :id="id" class="titulo m-0 mb-1 font-sans text-[clamp(20px,2.4vw,28px)] font-semibold tracking-[-0.03em] leading-tight text-ink [overflow-wrap:anywhere] outline-none" tabindex="-1" data-anchor>{{ name }}</h1>
      <p class="linea flex flex-wrap items-center gap-x-2.5 gap-y-1 m-0 font-mono text-[11px] text-dim tabular-nums">
        <span v-for="(part, i) in line" :key="i">{{ part }}</span>
      </p>
    </div>
    <div v-if="$slots.default" class="lado flex items-center gap-2 flex-wrap col-span-full mt-2 justify-start md:col-span-1 md:mt-0 md:justify-end min-w-0">
      <slot />
    </div>
  </header>
</template>
