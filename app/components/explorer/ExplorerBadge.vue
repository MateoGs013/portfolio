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
  <span
    class="icono relative flex items-center justify-center w-[92px] h-[80px]"
    :class="kind"
    aria-hidden="true"
  >
    <svg
      v-if="kind === 'folder'"
      viewBox="0 0 72 56"
      class="block max-w-full max-h-full w-full h-auto fill-paper stroke-ink stroke-[1.5] [stroke-linejoin:round]"
    >
      <path d="M1.5 6.5h22l6 7h41v41h-69z" />
      <path d="M1.5 19.5h69" />
    </svg>
    <svg
      v-else
      viewBox="0 0 52 64"
      class="block max-w-full max-h-full h-full w-auto fill-paper stroke-ink stroke-[1.5] [stroke-linejoin:round]"
    >
      <path d="M1.5 1.5h33l16 16v45h-49z" />
      <path d="M34.5 1.5v16h16" />
    </svg>
    <span
      class="badge absolute inset-x-0 font-mono text-[12px] text-dim text-center tabular-nums"
      :class="kind === 'folder' ? 'bottom-[17%]' : 'bottom-[15%]'"
    >
      {{ badge }}
    </span>
  </span>
</template>
