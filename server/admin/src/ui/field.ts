/**
 * Lo que Field le pasa al control que envuelve: el id para el `for` del rótulo, los ids de ayuda y
 * error para aria-describedby, y si está inválido u obligatorio. Un control fuera de un Field
 * funciona igual con sus propios props.
 */
import { computed, inject, type ComputedRef, type InjectionKey } from 'vue'
import { useId } from '../composables/useId'

export interface FieldContext {
  inputId: string
  describedBy: ComputedRef<string | undefined>
  invalid: ComputedRef<boolean>
  required: ComputedRef<boolean>
}

export const fieldKey: InjectionKey<FieldContext> = Symbol('field')

/** Una opción ya rotulada (Select, RadioGroup): nunca se muestra el valor de un enum. */
export interface SelectOption<V> {
  value: V
  label: string
  disabled?: boolean
  /** Ayuda corta debajo del rótulo (RadioGroup). */
  hint?: string
}

export interface ControlProps {
  id?: string
  invalid?: boolean
  required?: boolean
  describedBy?: string
}

/** Para TextInput, TextArea y Select: toma lo del Field si hay uno y si no, lo de sus props. */
export function useFieldControl(props: ControlProps) {
  const field = inject(fieldKey, null)
  const ownId = useId('ctl')
  return {
    id: computed(() => props.id ?? field?.inputId ?? ownId),
    describedBy: computed(() => props.describedBy ?? field?.describedBy.value),
    invalid: computed(() => props.invalid ?? field?.invalid.value ?? false),
    required: computed(() => props.required ?? field?.required.value ?? false),
  }
}

/**
 * Los controles livianos de la dirección elegida: sin caja, texto de 16 px sobre una línea de 1 px que
 * se enciende en --ink con el foco (en --danger si hay error). Los campos de texto no llevan el anillo
 * global: como en la demo aprobada, el foco se marca con la línea a 2 px en --ink (ver
 * docs/decisiones.md, «Foco y línea de los campos»). Botones, filas y pestañas sí lo llevan.
 */
export const lineControl = 'w-full min-w-0 border-0 border-b bg-transparent px-0 text-ink transition-colors duration-120 ease-e placeholder:text-faint focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:text-faint read-only:text-dim'

export function lineState(invalid: boolean): string {
  // Con el foco la línea pasa a 2 px (borde más sombra), para que se vea también sin anillo.
  return invalid
    ? 'border-danger focus:border-danger focus:shadow-[0_1px_0_var(--danger)]'
    : 'border-rule-strong hover:border-rule-hover focus:border-ink focus:shadow-[0_1px_0_var(--ink)]'
}
