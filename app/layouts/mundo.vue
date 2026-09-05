<script setup lang="ts">
// Layout compartido por los dos mundos: el control de pasaje vive acá para
// que sobreviva al cambio de mundo sin remontarse.
</script>

<template>
  <div class="mundo">
    <PasajeControl />
    <slot />
  </div>
</template>

<style scoped>
.mundo { min-height: 100dvh; }
</style>
