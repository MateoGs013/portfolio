<script setup lang="ts">
/**
 * Rótulo, control, ayuda, error y contador ligados entre sí: el rótulo apunta al control (for), y la
 * ayuda y el error entran en aria-describedby. El error reemplaza a la ayuda y marca aria-invalid.
 */
import { computed, provide } from 'vue'
import { useId } from '../composables/useId'
import { ui } from './dict'
import { fieldKey } from './field'

const props = withDefaults(defineProps<{
  label: string
  hint?: string
  error?: string | null
  required?: boolean
  /** Con `max`, muestra «12 de 80» y avisa cuando se pasa. */
  count?: number
  max?: number
  /** Fieldset en lugar de label: para un grupo (RadioGroup, varias casillas). */
  group?: boolean
}>(), { error: null, required: false, group: false })

const inputId = useId('fld')
const hintId = `${inputId}-hint`
const errorId = `${inputId}-error`
const counterId = `${inputId}-count`

const hasCounter = computed(() => props.max !== undefined && props.count !== undefined)
const over = computed(() => (hasCounter.value ? Math.max(0, props.count! - props.max!) : 0))

const describedBy = computed(() => {
  const ids = [props.error ? errorId : props.hint ? hintId : null, hasCounter.value ? counterId : null]
  return ids.filter(Boolean).join(' ') || undefined
})

provide(fieldKey, {
  inputId,
  describedBy,
  invalid: computed(() => !!props.error || over.value > 0),
  required: computed(() => props.required),
})
</script>

<template>
  <component
    :is="group ? 'fieldset' : 'div'"
    class="m-0 grid min-w-0 gap-2 border-0 p-0"
    :aria-describedby="group ? describedBy : undefined"
  >
    <!-- En un grupo la fila entera es el legend, primer hijo del fieldset. -->
    <component :is="group ? 'legend' : 'div'" class="flex min-h-5 w-full items-baseline gap-2.5 p-0">
      <component
        :is="group ? 'span' : 'label'"
        :for="group ? undefined : inputId"
        class="text-label text-dim"
      >
        {{ label }}
      </component>
      <span v-if="required" class="text-meta text-faint">{{ ui.field.required }}</span>
      <span class="ml-auto flex items-baseline gap-3 text-meta text-faint">
        <slot name="aux" />
        <span
          v-if="hasCounter"
          :id="counterId"
          class="tabular-nums"
          :class="over ? 'text-danger' : ''"
        >{{ over ? ui.field.over(over) : ui.field.counter(count!, max!) }}</span>
      </span>
    </component>
    <slot :id="inputId" :described-by="describedBy" />
    <p v-if="error" :id="errorId" class="m-0 text-label text-danger">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="m-0 text-label text-faint">
      {{ hint }}
    </p>
  </component>
</template>
