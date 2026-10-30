<script setup lang="ts">
// Título de página (Obra, Sobre mí, Artículos): el par `page-title` de la palabra del menú, con el
// conteo en superíndice de cifras tabulares. El h1 recibe el foco al llegar a la página.
defineProps<{
  title: string
  /** Cantidad de registros de la página (por ejemplo, las obras visibles). */
  count?: number | null
  /** Cómo se lee el conteo («6 obras»): sin él, el lector lee solo la cifra. */
  countLabel?: string
}>()
</script>

<template>
  <h1 tabindex="-1" class="-ms-[0.045em] text-display-page text-ink">
    <span data-vt="page-title">{{ title }}</span><template v-if="count != null">
      <sup :aria-hidden="countLabel ? 'true' : undefined" class="ms-[0.2em] align-super text-[0.2em] font-[450] tracking-normal text-dim tabular-nums">{{ count }}</sup>
      <span v-if="countLabel" class="sr-only">, {{ countLabel }}</span>
    </template>
  </h1>
</template>
