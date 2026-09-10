<script setup lang="ts">
// La cabecera de lo que está abierto, igual en todos los niveles: el ícono
// (carpeta o archivo) con el dato dominante adentro, el nombre a escala de
// interfaz y la línea de tipo debajo. A la derecha, lo que acompaña: los
// filtros activos de una carpeta o los vecinos de un archivo.
import DatosIcono from './DatosIcono.vue'

defineProps<{
  /** Id del h1, para el aria-labelledby del panel. */
  id: string
  kind: 'folder' | 'file'
  badge: string
  name: string
  /** Partes de la línea de tipo, separadas por aire: `record`, `Project`, `updatedAt 2026-09-05`. */
  line: string[]
}>()
</script>

<template>
  <header class="cabecera">
    <DatosIcono :kind="kind" :badge="badge" class="icono" />
    <div class="quien">
      <h1 :id="id" class="titulo" tabindex="-1" data-anchor>{{ name }}</h1>
      <p class="linea"><span v-for="(part, i) in line" :key="i">{{ part }}</span></p>
    </div>
    <div v-if="$slots.default" class="lado">
      <slot />
    </div>
  </header>
</template>

<style scoped>
.cabecera {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px 20px;
  align-items: center;
  padding: 2px 0 18px;
  border-bottom: 1px solid var(--d-rule);
  width: 100%;
}
.icono { width: 48px; height: 54px; flex-shrink: 0; }
.quien { min-width: 0; }
.titulo {
  margin: 0 0 4px;
  font-family: var(--font-text);
  font-size: clamp(20px, 2.2vw, 28px);
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.2;
  overflow-wrap: anywhere;
  outline: none;
}
.linea {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-dim);
  font-variant-numeric: tabular-nums;
}
.lado {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .cabecera { grid-template-columns: auto minmax(0, 1fr); }
  .lado { grid-column: 1 / -1; margin-top: 10px; justify-content: flex-start; }
}
</style>
