<script setup lang="ts" generic="T extends string | number">
/**
 * Elegir una entre pocas opciones con radios nativos (las flechas ya los recorren).
 * - `pills`: segmentos sobre una base (Español · Inglés, Portada · Galería).
 * - `underline`: filtros de una lista, texto con una línea debajo del elegido, como el sitio.
 * - `list`: una opción por renglón con su ayuda, para decisiones que piden explicación.
 */
import { useId } from '../composables/useId'
import type { SelectOption } from './field'

withDefaults(defineProps<{
  options: SelectOption<T>[]
  /** Nombre del grupo para el lector de pantalla (si no hay un Field con rótulo alrededor). */
  label: string
  variant?: 'pills' | 'underline' | 'list'
  disabled?: boolean
}>(), { variant: 'pills', disabled: false })

const model = defineModel<T | null>({ default: null })
const name = useId('radio')
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    :class="{
      'inline-flex w-fit gap-0.5 rounded-[7px] bg-surface p-0.5': variant === 'pills',
      'flex flex-wrap gap-x-5 gap-y-2': variant === 'underline',
      'grid gap-1': variant === 'list',
    }"
  >
    <label
      v-for="option in options"
      :key="String(option.value)"
      class="relative"
      :class="option.disabled || disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'"
    >
      <input
        v-model="model"
        type="radio"
        class="peer sr-only"
        :name="name"
        :value="option.value"
        :disabled="option.disabled || disabled"
      >
      <span
        v-if="variant === 'pills'"
        class="flex h-6.5 items-center rounded-[5px] px-2.5 text-label whitespace-nowrap text-faint transition-colors duration-120 ease-e peer-checked:bg-surface-2 peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sig-text hover:text-ink"
      >{{ option.label }}</span>
      <span
        v-else-if="variant === 'underline'"
        class="block border-b border-transparent pb-1 text-body text-faint transition-colors duration-120 ease-e peer-checked:border-ink peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sig-text hover:text-ink"
      >{{ option.label }}</span>
      <span
        v-else
        class="flex items-start gap-3 rounded-control px-2 py-2.5 transition-colors duration-120 ease-e peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sig-text hover:bg-surface"
      >
        <span
          class="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border transition-colors duration-120 ease-e"
          :class="model === option.value ? 'border-sig' : 'border-rule-strong'"
          aria-hidden="true"
        >
          <span
            class="size-2 rounded-full bg-sig transition-transform duration-200 ease-e"
            :class="model === option.value ? 'scale-100' : 'scale-0'"
          />
        </span>
        <span class="grid gap-0.5">
          <span class="text-body text-ink">{{ option.label }}</span>
          <span v-if="option.hint" class="text-label text-faint">{{ option.hint }}</span>
        </span>
      </span>
    </label>
  </div>
</template>
