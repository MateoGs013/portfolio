<script setup lang="ts">
// El umbral: pantalla partida, el visitante elige. Es el nivel cero, no una
// pantalla aparte. Cada mitad tiene la temperatura de su mundo: la costura
// entre las dos es la tesis sin palabras. Sin animación todavía.
// `/` redirige al mundo recordado (middleware); `/umbral` lo muestra siempre.
definePageMeta({ layout: false, alias: ['/umbral'] })

useHead({ htmlAttrs: { 'data-mundo': 'umbral' }, title: 'Mateo Sonzogni' })
usePreloadFonts('umbral')
</script>

<template>
  <main class="umbral">
    <h1 class="nombre">Mateo Sonzogni</h1>

    <NuxtLink to="/datos" class="mitad datos">
      <span class="tag">01 · consultar</span>
      <span class="texto">
        <span class="mundo">DATOS</span>
        <span class="que">Explorador de columnas. Denso, frío, navegable entero con el teclado.</span>
      </span>
    </NuxtLink>

    <NuxtLink to="/diseno" class="mitad diseno">
      <span class="tag">02 · mirar</span>
      <span class="texto">
        <span class="mundo">DISEÑO</span>
        <span class="que">Cada sección con su propia forma. Las piezas se construyen solas.</span>
      </span>
    </NuxtLink>
  </main>
</template>

<style>
html[data-mundo="umbral"] { background: var(--n-bg); color-scheme: dark; }
</style>

<style scoped>
.umbral {
  position: relative;
  display: flex;
  min-height: 100dvh;
}
.mitad {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(20px, 3.4vw, 46px);
  text-decoration: none;
  transition: background 400ms;
}
.tag {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
.texto { display: block; }
.mundo {
  display: block;
  font-size: clamp(34px, 6vw, 72px);
  line-height: 0.9;
  letter-spacing: -0.035em;
}
.que {
  display: block;
  margin-top: 14px;
  max-width: 32ch;
  font-size: 12px;
  line-height: 1.6;
}

.datos {
  background: var(--d-paper);
  color: var(--d-ink);
}
.datos:hover { background: var(--d-hover); }
.datos .tag, .datos .que { color: var(--d-dim); }
.datos .mundo { font-family: var(--font-text); font-weight: 700; }
.datos:focus-visible { outline: 2px solid var(--d-sig); outline-offset: -6px; }

.diseno {
  background: var(--n-bg);
  color: var(--n-paper);
}
.diseno:hover { background: #141009; }
.diseno .tag { color: var(--n-faint); }
.diseno .que { color: var(--n-dim); }
.diseno .mundo {
  font-family: var(--font-display);
  font-weight: 620;
  font-variation-settings: 'opsz' 90, 'SOFT' 0, 'WONK' 1;
}
.diseno:focus-visible { outline: 2px solid var(--n-ember); outline-offset: -6px; }

/* El nombre cruza la costura: blanco en diferencia queda negro sobre papel
   y claro sobre la película, sin dos versiones. Va al centro de la costura,
   donde no compite con los rótulos ni con los nombres de los mundos. */
.nombre {
  position: absolute;
  z-index: 1;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  font-family: var(--font-text);
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  white-space: nowrap;
  color: #fff;
  mix-blend-mode: difference;
  pointer-events: none;
}

@media (max-width: 900px) {
  .umbral { flex-direction: column; }
  /* Apilado, la costura es horizontal y ahí viven los textos: el nombre sube
     al ángulo libre, arriba a la derecha. */
  .nombre {
    left: auto;
    right: clamp(20px, 3.4vw, 46px);
    top: clamp(20px, 3.4vw, 46px);
    transform: none;
  }
}
</style>
