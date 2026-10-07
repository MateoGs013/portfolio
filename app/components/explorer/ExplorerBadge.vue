<script setup lang="ts">
// El ícono del explorador: una carpeta o un archivo, en trazo de tinta, con
// el dato dominante adentro (el conteo de una tabla, el año de un record).
// Es el mismo dibujo en la grilla y en la cabecera; el tamaño lo pone quien lo usa.
defineProps<{
  kind: 'folder' | 'file'
  badge: string
}>()
</script>

<template>
  <span class="icono" :class="kind" aria-hidden="true">
    <svg v-if="kind === 'folder'" viewBox="0 0 72 56">
      <path d="M1.5 6.5h22l6 7h41v41h-69z" />
      <path d="M1.5 19.5h69" />
    </svg>
    <svg v-else viewBox="0 0 52 64">
      <path d="M1.5 1.5h33l16 16v45h-49z" />
      <path d="M34.5 1.5v16h16" />
    </svg>
    <span class="badge">{{ badge }}</span>
  </span>
</template>

<style scoped>
.icono {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 92px;
  height: 80px;
}
svg {
  display: block;
  max-width: 100%;
  max-height: 100%;
  fill: var(--d-paper);
  stroke: var(--d-ink);
  stroke-width: 1.5;
  stroke-linejoin: round;
}
.folder svg { width: 100%; height: auto; }
.file svg { height: 100%; width: auto; }
.badge {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 15%;
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-dim);
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.folder .badge { bottom: 17%; }
</style>
