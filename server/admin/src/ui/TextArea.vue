<script setup lang="ts">
/**
 * Texto largo, sin caja. `prose` (por defecto) es el relato: 17/1,6 con medida de lectura de 68ch.
 * Crece con el contenido desde `rows` hasta `maxRows`; después scrollea.
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { lineControl, lineState, useFieldControl } from './field'

const props = withDefaults(defineProps<{
  rows?: number
  maxRows?: number
  prose?: boolean
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  maxlength?: number
  id?: string
  invalid?: boolean
  required?: boolean
  describedBy?: string
}>(), { rows: 3, maxRows: 18, prose: true, disabled: false, readonly: false, invalid: undefined, required: undefined })

const model = defineModel<string>({ default: '' })
const control = useFieldControl(props)
const area = ref<HTMLTextAreaElement | null>(null)

/** Ajusta el alto al contenido. Va por CSSOM (style.height): la CSP no admite estilos en línea. */
function fit(): void {
  const el = area.value
  if (!el) return
  const styles = getComputedStyle(el)
  const line = Number.parseFloat(styles.lineHeight) || 24
  const padding = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom)
  el.style.height = 'auto'
  const max = line * props.maxRows + padding
  el.style.height = `${Math.min(el.scrollHeight + 1, max)}px`
  el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden'
}

/*
 * Montado en un panel oculto (Tabs con v-show, una vista previa) mide cero: al hacerse visible o
 * cambiar de ancho vuelve a medirse. Solo reacciona al ancho, así el propio ajuste de alto no lo dispara.
 */
let observer: ResizeObserver | null = null
let width = -1
onMounted(() => {
  fit()
  if (typeof ResizeObserver === 'undefined' || !area.value) return
  observer = new ResizeObserver((entries) => {
    const next = Math.round(entries[0]?.contentRect.width ?? 0)
    if (next === width) return
    width = next
    if (next > 0) fit()
  })
  observer.observe(area.value)
})
onBeforeUnmount(() => observer?.disconnect())
watch(model, () => nextTick(fit))

defineExpose({ focus: () => area.value?.focus() })
</script>

<template>
  <textarea
    :id="control.id.value"
    ref="area"
    v-model="model"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :maxlength="maxlength"
    :required="control.required.value"
    :aria-invalid="control.invalid.value || undefined"
    :aria-describedby="control.describedBy.value"
    :class="[lineControl, lineState(control.invalid.value), 'block resize-none py-2', prose ? 'max-w-[68ch] text-prose' : 'text-field']"
    @input="fit"
  />
</template>
