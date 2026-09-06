<script setup lang="ts">
// El scrubber del mundo DISEÑO: un `range` nativo (teclado y lector de
// pantalla gratis) con la línea y el cabezal de la película. Es el mismo
// instrumento en todas las secciones; lo que mueve lo decide cada una.
defineProps<{
  modelValue: number
  max?: number
  label: string
  valuetext?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: number], 'agarrar': [], 'soltar': [] }>()
</script>

<template>
  <input
    type="range"
    class="rango"
    min="0"
    :max="max ?? 1000"
    :value="modelValue"
    :aria-label="label"
    :aria-valuetext="valuetext"
    @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
    @pointerdown="emit('agarrar')"
    @pointerup="emit('soltar')"
    @keydown="emit('agarrar')"
  >
</template>

<style scoped>
.rango {
  -webkit-appearance: none;
  appearance: none;
  display: block;
  width: 100%;
  height: 22px;
  margin: 0;
  background: transparent;
  cursor: pointer;
}
.rango::-webkit-slider-runnable-track { height: 2px; background: var(--n-edge); }
.rango::-moz-range-track { height: 2px; background: var(--n-edge); }
.rango::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; margin-top: -5px; background: var(--n-ember); border: 0; border-radius: 0; }
.rango::-moz-range-thumb { width: 12px; height: 12px; background: var(--n-ember); border: 0; border-radius: 0; }
</style>
