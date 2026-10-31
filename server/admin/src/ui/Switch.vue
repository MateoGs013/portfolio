<script setup lang="ts">
/**
 * Interruptor de dos estados (role=switch): «Mostrar en el sitio», «Búsqueda por afinidad». El rótulo
 * es parte del botón, así se puede tocar todo. El estado se lee en aria-checked, no en el color.
 */
import { useId } from '../composables/useId'

withDefaults(defineProps<{
  label: string
  /** Una línea que explica qué cambia al prenderlo. */
  hint?: string
  disabled?: boolean
}>(), { disabled: false })

const model = defineModel<boolean>({ default: false })
const hintId = useId('sw')
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    :aria-describedby="hint ? hintId : undefined"
    :disabled="disabled"
    class="group inline-flex items-start gap-3 rounded-control border-0 bg-transparent p-0 text-left text-body text-ink disabled:cursor-not-allowed disabled:opacity-45"
    @click="model = !model"
  >
    <span
      class="relative mt-px h-4.5 w-7.5 shrink-0 rounded-full border transition-colors duration-200 ease-e"
      :class="model ? 'border-sig/50 bg-sig/25' : 'border-rule-strong bg-surface-2 group-hover:border-rule-hover'"
      aria-hidden="true"
    >
      <span
        class="absolute top-0.5 left-0.5 size-3 rounded-full transition-[transform,background-color] duration-200 ease-e"
        :class="model ? 'translate-x-3 bg-sig' : 'bg-dim'"
      />
    </span>
    <span class="grid gap-0.5">
      <span>{{ label }}</span>
      <span v-if="hint" :id="hintId" class="text-label text-faint">{{ hint }}</span>
    </span>
  </button>
</template>
