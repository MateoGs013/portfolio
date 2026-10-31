<script setup lang="ts">
/** Un estado dentro de un bloque del Muestrario, con su nombre arriba («Reposo», «Cargando»). */
defineProps<{ label: string }>()
</script>

<template>
  <div class="grid content-start gap-3">
    <span class="text-meta text-faint">{{ label }}</span>
    <div class="flex flex-wrap items-center gap-3">
      <slot />
    </div>
  </div>
</template>
