<script setup lang="ts">
// Layout compartido por los dos mundos: el control de pasaje vive acá para
// que sobreviva al cambio de mundo sin remontarse.
</script>

<template>
  <div class="mundo">
    <a class="saltar" href="#contenido">saltar al contenido</a>
    <slot />
    <PasajeControl />
  </div>
</template>

<style scoped>
.mundo { min-height: 100dvh; }
/* Solo se ve al recibir foco: primer Tab de la página. */
.saltar {
  position: fixed;
  z-index: 80;
  top: 8px;
  left: 8px;
  padding: 8px 12px;
  background: var(--d-ink);
  color: var(--d-paper);
  font-family: var(--font-text);
  font-size: 13px;
  text-decoration: none;
  transform: translateY(-200%);
}
.saltar:focus-visible { transform: none; outline: 2px solid var(--d-sig); outline-offset: 2px; }
html[data-mundo="diseno"] .saltar { background: var(--n-paper); color: var(--n-ink); }
html[data-mundo="diseno"] .saltar:focus-visible { outline-color: var(--n-ember); }
</style>
