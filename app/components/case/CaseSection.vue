<script setup lang="ts">
/**
 * Un bloque del caso a dos columnas: el rótulo fijo a la izquierda (sticky a 5 rem del borde mientras
 * su texto avanza, solo desde 768 px) y el cuerpo a la derecha. El rótulo va en sans, minúscula de
 * oración y `--dim`, y sale del diccionario. En Hiperfoco el bloque es una sola columna y el rótulo
 * deja de ser fijo; en registro desaparece y quedan las filas de sus campos.
 */
defineProps<{
  /** Rótulo del diccionario: Encargo, Proceso, Resultado, Métricas, Enlaces… */
  label: string
}>()
</script>

<template>
  <section class="grid gap-y-5 px-pad md:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] md:gap-x-[clamp(2rem,5vw,6rem)] md:focus-mode:grid-cols-1 record:block">
    <h2 class="ed-only text-s font-medium text-dim md:sticky md:top-20 md:self-start md:focus-mode:static">
      {{ label }}
    </h2>
    <div class="flex min-w-0 flex-col gap-[clamp(2.5rem,8vh,5rem)] record:contents">
      <slot />
    </div>
  </section>
</template>
