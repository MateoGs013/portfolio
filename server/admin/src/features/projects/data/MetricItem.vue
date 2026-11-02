<script setup lang="ts">
/**
 * Una métrica: qué se mide (del catálogo, con su rótulo en los dos idiomas, u «Otra cifra» con clave y
 * rótulo propio en español e inglés), un número con su unidad o una lista, la fuente y el día de la
 * medición. Subir y Bajar la mueven: el orden es el del caso.
 *
 * Cerrada es una fila de la tabla (qué se mide, valor con unidad, fuente y fecha); abierta, su
 * formulario. Quedan abiertas solas las nuevas y las que tienen un error.
 */
import { computed, ref } from 'vue'
import { enumOptions, label } from '../../../stores/meta'
import Button from '../../../ui/Button.vue'
import Field from '../../../ui/Field.vue'
import type { SelectOption } from '../../../ui/field'
import IconButton from '../../../ui/IconButton.vue'
import RadioGroup from '../../../ui/RadioGroup.vue'
import Select from '../../../ui/Select.vue'
import TextArea from '../../../ui/TextArea.vue'
import TextInput from '../../../ui/TextInput.vue'
import BilingualField from '../../collections/BilingualField.vue'
import { useEditorContext } from '../../collections/context'
import { useProject } from '../context'
import type { MetricForm } from '../types'
import { dataText } from './dict'
import { inCatalog, LABEL_MAX } from './metricForm'
import { keyDescription, keyOptions, knownLabel, metricTitle, OTHER, unitFor } from './metricKeys'

const props = withDefaults(defineProps<{ index: number, total: number, locked: boolean, open?: boolean, closable?: boolean }>(), { open: true, closable: false })
defineEmits<{ up: [], down: [], remove: [], open: [], close: [] }>()

const t = dataText.metrics
const { form } = useProject()
const editor = useEditorContext()
const metric = computed(() => form.value.metrics[props.index]!)
const base = computed(() => `metrics[${props.index}]`)
const n = computed(() => props.index + 1)
const errorOf = (field: string) => editor?.messageFor(`${base.value}.${field}`) ?? null

const DAY = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const title = computed(() => metricTitle(metric.value.key, metric.value.label) || t.untitled)
const valueText = computed(() => {
  const m = metric.value
  if (m.kind === 'items') return m.items.split('\n').map(i => i.trim()).filter(Boolean).join(', ')
  if (!m.value.trim()) return ''
  return [m.value.trim(), m.unit ? label('MetricUnit', m.unit) : ''].filter(Boolean).join(' ')
})
const dateText = computed(() => {
  const at = metric.value.measuredAt
  return /^\d{4}-\d{2}-\d{2}$/.test(at) ? DAY.format(new Date(`${at}T00:00:00Z`)) : ''
})

/** Elegida «Otra cifra» sin escribir todavía la clave. */
const writingKey = ref(false)
const listed = (key: string) => keyOptions.value.some(o => o.value === key && o.value !== OTHER)
const custom = computed(() => writingKey.value || (!!metric.value.key && !inCatalog(metric.value.key)))

const choice = computed<string | null>({
  get: () => {
    const key = metric.value.key
    if (!key) return writingKey.value ? OTHER : null
    return listed(key) ? key : OTHER
  },
  set: (value) => {
    if (!value) return
    const m = metric.value
    if (value === OTHER) {
      writingKey.value = true
      if (listed(m.key)) m.key = ''
      return
    }
    writingKey.value = false
    m.key = value
    if (!inCatalog(value) && !m.label.trim()) m.label = knownLabel(value) ?? ''
    if (m.kind === 'value' && m.unit === null) m.unit = unitFor(value)
  },
})

const keyHint = computed(() => (metric.value.key && inCatalog(metric.value.key) ? keyDescription(metric.value.key) : null) ?? t.keyHint)

const kinds: SelectOption<MetricForm['kind']>[] = [
  { value: 'value', label: t.kinds.value },
  { value: 'items', label: t.kinds.items },
]
const kind = computed<MetricForm['kind'] | null>({
  get: () => metric.value.kind,
  set: (value) => {
    if (value) metric.value.kind = value
  },
})

const NO_UNIT = ''
const units = computed<SelectOption<string>[]>(() => [{ value: NO_UNIT, label: t.noUnit }, ...enumOptions('MetricUnit')])
const unit = computed<string | null>({
  get: () => metric.value.unit ?? NO_UNIT,
  set: (value) => {
    metric.value.unit = value ? value : null
  },
})
</script>

<template>
  <div v-if="!open" class="flex min-w-0 items-center gap-3 py-1.5">
    <button
      type="button"
      class="grid min-w-0 flex-1 gap-x-4 gap-y-0.5 rounded-control border-0 bg-transparent px-1 py-1.5 text-left text-body text-dim transition-colors duration-120 ease-e hover:text-ink sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.7fr)]"
      aria-expanded="false"
      data-move="open"
      @click="$emit('open')"
    >
      <span class="sr-only">{{ t.edit }}</span>
      <span class="truncate text-ink">{{ title }}</span>
      <span class="truncate tabular-nums">{{ valueText }}</span>
      <span class="truncate" :class="metric.source.trim() ? '' : 'text-faint'">{{ metric.source.trim() || t.noSource }}</span>
      <span class="truncate tabular-nums" :class="dateText ? '' : 'text-faint'">{{ dateText || t.noDate }}</span>
    </button>
    <div class="flex items-center gap-1">
      <IconButton icon="arrow-up" size="sm" :label="t.up(n)" data-move="up" :disabled="locked || index === 0" @click="$emit('up')" />
      <IconButton icon="arrow-down" size="sm" :label="t.down(n)" data-move="down" :disabled="locked || index === total - 1" @click="$emit('down')" />
      <IconButton icon="trash" size="sm" :label="t.remove(n)" data-move="remove" :disabled="locked" @click="$emit('remove')" />
    </div>
  </div>
  <div v-else class="grid gap-6 pt-5 pb-7">
    <div class="flex items-center gap-3">
      <h3 class="m-0 min-w-0 truncate text-row text-ink">
        {{ title }}
      </h3>
      <div class="ml-auto flex items-center gap-1">
        <IconButton icon="arrow-up" size="sm" :label="t.up(n)" data-move="up" :disabled="locked || index === 0" @click="$emit('up')" />
        <IconButton icon="arrow-down" size="sm" :label="t.down(n)" data-move="down" :disabled="locked || index === total - 1" @click="$emit('down')" />
        <IconButton icon="trash" size="sm" :label="t.remove(n)" data-move="remove" :disabled="locked" @click="$emit('remove')" />
        <Button v-if="closable" variant="ghost" class="ml-2" :aria-label="t.closeFor(t.metric(n))" aria-expanded="true" data-move="close" @click="$emit('close')">
          {{ t.close }}
        </Button>
      </div>
    </div>

    <Field :data-field="custom ? undefined : `${base}.key`" :label="t.key" :hint="custom ? undefined : keyHint" :error="custom ? null : errorOf('key')" required>
      <Select v-model="choice" :options="keyOptions" :disabled="locked" />
    </Field>

    <template v-if="custom">
      <Field :data-field="`${base}.key`" :label="t.customKey" :hint="t.customKeyHint" :error="errorOf('key')" required class="max-w-[28rem]">
        <TextInput v-model="metric.key" mono autocomplete="off" :maxlength="48" :readonly="locked" />
      </Field>
      <BilingualField
        v-model:es="metric.label"
        v-model:en="metric.translations.en.label"
        :path="`${base}.label`"
        :en-path="`${base}.translations.en.label`"
        :label="t.label"
        :hint="t.labelHint"
        :max="LABEL_MAX"
        :readonly="locked"
        required
      />
    </template>

    <Field :label="t.kind" group>
      <RadioGroup v-model="kind" :options="kinds" :label="t.kind" :disabled="locked" />
    </Field>

    <div v-if="metric.kind === 'value'" class="grid items-start gap-x-8 gap-y-6 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
      <Field :data-field="`${base}.value`" :label="t.value" :hint="t.valueHint" :error="errorOf('value')" required>
        <TextInput v-model="metric.value" inputmode="decimal" autocomplete="off" :readonly="locked" class="tabular-nums" />
      </Field>
      <Field :data-field="`${base}.unit`" :label="t.unit" :error="errorOf('unit')">
        <Select v-model="unit" :options="units" :placeholder="false" :disabled="locked" />
      </Field>
    </div>
    <Field v-else :data-field="`${base}.items`" :label="t.items" :hint="t.itemsHint" :error="errorOf('items')" required>
      <TextArea v-model="metric.items" :rows="3" :prose="false" :readonly="locked" />
    </Field>

    <div class="grid items-start gap-x-8 gap-y-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)]">
      <Field :data-field="`${base}.source`" :label="t.source" :hint="t.sourceHint" :error="errorOf('source')">
        <TextInput v-model="metric.source" :placeholder="t.noSource" :maxlength="200" :readonly="locked" />
      </Field>
      <Field :data-field="`${base}.measuredAt`" :label="t.measuredAt" :error="errorOf('measuredAt')">
        <TextInput v-model="metric.measuredAt" type="date" :readonly="locked" />
      </Field>
    </div>
  </div>
</template>
