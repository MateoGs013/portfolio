<script setup lang="ts">
// Layout por defecto del portafolio técnico Mateo Sonzogni
</script>

<template>
  <div class="portafolio-layout">
    <a class="saltar" href="#contenido">saltar al contenido</a>
    <slot />
  </div>
</template>

<style scoped>
.portafolio-layout {
  min-height: 100dvh;
}

.saltar {
  position: fixed;
  z-index: 999;
  top: 8px;
  left: 8px;
  padding: 8px 14px;
  background: var(--d-ink);
  color: var(--d-paper);
  font-family: var(--font-text);
  font-size: 13px;
  text-decoration: none;
  border-radius: 4px;
  transform: translateY(-200%);
  transition: transform 0.15s ease;
}

.saltar:focus-visible {
  transform: none;
  outline: 2px solid var(--d-sig);
  outline-offset: 2px;
}
</style>
