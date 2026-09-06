<script setup lang="ts">
// Un valor en pantalla, en la tabla o en la hoja. Sabe a dónde lleva:
// record relacionado (azul), filtro (subrayado punteado), URL externa, o
// nada. NULL se muestra: una base de datos no esconde lo que falta.
import type { Cell } from './explorer'

defineProps<{
  cell: Cell
  /** Nombre del campo, para el título del filtro. */
  name?: string
  /** El link va en tinta y no en azul: es el nombre del record, no una relación. */
  plain?: boolean
}>()
</script>

<template>
  <span v-if="cell.items" class="items">
    <template v-for="(it, i) in cell.items" :key="i">
      <span v-if="i" class="sep" aria-hidden="true">·</span>
      <NuxtLink v-if="it.to" :to="it.to" class="rel">{{ it.label }}<span v-if="it.meta" class="im"> {{ it.meta }}</span></NuxtLink>
      <NuxtLink v-else-if="it.facet" :to="it.facet" class="facet" :title="`filtrar ${name ?? ''} = ${it.label}`">{{ it.label }}</NuxtLink>
      <a v-else-if="it.href" :href="it.href" rel="noopener" class="ext">{{ it.label }}<span v-if="it.meta" class="im"> {{ it.meta }}</span></a>
      <span v-else>{{ it.label }}</span>
    </template>
  </span>
  <NuxtLink v-else-if="cell.to" :to="cell.to" class="rel" :class="{ plain }">{{ cell.value }} <span aria-hidden="true">›</span></NuxtLink>
  <a v-else-if="cell.href" :href="cell.href" rel="noopener" class="ext">{{ cell.value }}</a>
  <NuxtLink v-else-if="cell.facet" :to="cell.facet" class="facet" :title="`filtrar ${name ?? ''} = ${cell.value}`">{{ cell.value }}</NuxtLink>
  <span v-else-if="cell.value === null" class="nul">NULL</span>
  <template v-else>{{ cell.value }}</template>
</template>

<style scoped>
.items { display: flex; flex-wrap: wrap; gap: 2px 7px; }
.sep { color: var(--d-faint); }
.im { margin-left: 5px; color: var(--d-dim); font-size: var(--d-fs-ui); }
a { color: var(--d-sig); text-decoration: none; }
a:hover { text-decoration: underline; }
.rel.plain { color: var(--d-ink); }
.facet { color: var(--d-ink); text-decoration: underline dotted var(--d-sig); text-underline-offset: 3px; }
.facet:hover { color: var(--d-sig); text-decoration-style: solid; }
.ext { text-decoration: underline; text-decoration-color: var(--d-rule); }
.nul { font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-dim); }
</style>
