<script setup lang="ts">
/** Un bloque del Muestrario: el nombre del componente, para qué sirve y sus estados uno al lado del otro. */
defineProps<{
  title: string
  text?: string
}>()
</script>

<template>
  <section class="grid gap-6 border-t border-rule pt-8 pb-14">
    <header class="grid max-w-[64ch] gap-1.5">
      <h2 class="m-0 text-title">
        {{ title }}
      </h2>
      <p v-if="text" class="m-0 text-body text-dim">
        {{ text }}
      </p>
    </header>
    <slot />
  </section>
</template>
