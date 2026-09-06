<script setup lang="ts">
// El control persistente para pasar de un mundo al otro. Son links, no
// botones: tiene que funcionar sin JS, y la posición viaja en la URL.
// Todavía sin animar: el pasaje (FLIP + cortina) es la Fase 6.
import { routeFor, truncate, worldLabel, worlds } from '~/lib/path'

const { world, path, query } = useMundo()

function to(w: (typeof worlds)[number]) {
  return routeFor(w, truncate(w, path.value), query.value)
}
</script>

<template>
  <nav class="pasaje" aria-label="Mundo">
    <NuxtLink
      v-for="w in worlds"
      :key="w"
      :to="to(w)"
      :class="w"
      :aria-current="w === world ? 'true' : undefined"
    >
      {{ worldLabel[w] }}
    </NuxtLink>
  </nav>
</template>

<style scoped>
.pasaje {
  position: fixed;
  z-index: 60;
  top: clamp(14px, 2.4vw, 26px);
  right: clamp(14px, 2.4vw, 30px);
  display: flex;
  border: 1px solid var(--pasaje-line);
  font-family: var(--font-text);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}
.pasaje a {
  padding: 10px 14px;
  text-decoration: none;
  color: var(--pasaje-off);
  transition: background var(--pasaje-dur), color var(--pasaje-dur);
}
.pasaje a[aria-current] {
  background: var(--pasaje-on-bg);
  color: var(--pasaje-on-fg);
}

/* Toma la temperatura del mundo activo. */
html[data-mundo="datos"] .pasaje {
  /* Dentro del riel superior de DATOS, alineado con su altura de 48px. */
  top: 8px;
  right: var(--d-frame);
  --pasaje-line: var(--d-ink);
  --pasaje-off: var(--d-dim);
  --pasaje-on-bg: var(--d-ink);
  --pasaje-on-fg: var(--d-paper);
  --pasaje-dur: var(--d-dur);
}
html[data-mundo="datos"] .pasaje a { padding: 8px 12px; }
html[data-mundo="diseno"] .pasaje {
  --pasaje-line: #4a4032;
  --pasaje-off: #7d7160;
  --pasaje-on-bg: var(--n-ember);
  --pasaje-on-fg: #fff;
  --pasaje-dur: var(--n-dur-ui);
}
</style>
