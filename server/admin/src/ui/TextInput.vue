<script setup lang="ts">
/**
 * Campo de una línea, sin caja: 16 px sobre una línea de 1 px. `mono` para slug, URL o clave (13 px).
 * Dentro de un Field toma su id, su ayuda y su estado de error.
 */
import { ref } from 'vue'
import { lineControl, lineState, useFieldControl } from './field'
import { monoClass } from './Mono.vue'

const props = withDefaults(defineProps<{
  type?: 'text' | 'email' | 'url' | 'search' | 'number' | 'password' | 'date' | 'tel'
  placeholder?: string
  mono?: boolean
  disabled?: boolean
  readonly?: boolean
  maxlength?: number
  autocomplete?: string
  inputmode?: 'text' | 'numeric' | 'decimal' | 'email' | 'url' | 'search' | 'tel'
  id?: string
  invalid?: boolean
  required?: boolean
  describedBy?: string
}>(), { type: 'text', mono: false, disabled: false, readonly: false, invalid: undefined, required: undefined })

const model = defineModel<string>({ default: '' })
const control = useFieldControl(props)
const input = ref<HTMLInputElement | null>(null)

defineExpose({ focus: () => input.value?.focus(), select: () => input.value?.select() })
</script>

<template>
  <input
    :id="control.id.value"
    ref="input"
    v-model="model"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :maxlength="maxlength"
    :autocomplete="autocomplete"
    :inputmode="inputmode"
    :required="control.required.value"
    :aria-invalid="control.invalid.value || undefined"
    :aria-describedby="control.describedBy.value"
    :spellcheck="mono ? false : undefined"
    :class="[lineControl, lineState(control.invalid.value), mono ? `${monoClass.label} h-10` : 'h-10 text-field']"
  >
</template>
