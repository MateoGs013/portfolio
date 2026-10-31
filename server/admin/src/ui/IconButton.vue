<script setup lang="ts">
/**
 * Botón cuadrado con un icono del set cerrado. El nombre accesible es obligatorio (`label`) y también
 * se muestra como title al apuntar.
 */
import { controlBase, variantClass, type ButtonVariant } from './button'
import Icon from './Icon.vue'
import type { IconName } from './icons'

withDefaults(defineProps<{
  icon: IconName
  label: string
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  disabled?: boolean
  pressed?: boolean
}>(), { variant: 'ghost', size: 'md', disabled: false, pressed: undefined })

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <button
    type="button"
    :class="[controlBase, variantClass[variant], size === 'sm' ? 'size-7' : 'size-8']"
    :aria-label="label"
    :title="label"
    :aria-pressed="pressed"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <Icon :name="icon" :size="size === 'sm' ? 14 : 16" />
  </button>
</template>
