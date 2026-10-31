<script setup lang="ts" generic="T extends string | number">
/**
 * Lista de opciones nativa (teclado y lector de pantalla del sistema), con la misma línea que los
 * campos y una flecha propia. Las opciones llegan ya rotuladas: nunca se muestra el valor de un enum.
 */
import Icon from './Icon.vue'
import { ui } from './dict'
import { lineControl, lineState, useFieldControl, type SelectOption } from './field'

const props = withDefaults(defineProps<{
  options: SelectOption<T>[]
  /** Primera opción vacía («Elegí una opción»), para un valor que todavía no se eligió. */
  placeholder?: string | false
  disabled?: boolean
  id?: string
  invalid?: boolean
  required?: boolean
  describedBy?: string
}>(), { placeholder: ui.field.selectPlaceholder, disabled: false, invalid: undefined, required: undefined })

const model = defineModel<T | null>({ default: null })
const control = useFieldControl(props)

function onChange(event: Event): void {
  const index = (event.target as HTMLSelectElement).selectedIndex - (props.placeholder === false ? 0 : 1)
  model.value = index >= 0 ? (props.options[index]?.value ?? null) : null
}
</script>

<template>
  <span class="relative block">
    <select
      :id="control.id.value"
      :disabled="disabled"
      :required="control.required.value"
      :aria-invalid="control.invalid.value || undefined"
      :aria-describedby="control.describedBy.value"
      :class="[lineControl, lineState(control.invalid.value), 'h-10 appearance-none pr-7 text-field', model === null ? 'text-faint' : '']"
      @change="onChange"
    >
      <option v-if="placeholder !== false" value="" :selected="model === null" disabled>
        {{ placeholder }}
      </option>
      <option
        v-for="option in options"
        :key="String(option.value)"
        :value="String(option.value)"
        :selected="option.value === model"
        :disabled="option.disabled"
        class="bg-surface-2 text-ink"
      >
        {{ option.label }}
      </option>
    </select>
    <span class="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-faint">
      <Icon name="chevron-down" :size="16" />
    </span>
  </span>
</template>
