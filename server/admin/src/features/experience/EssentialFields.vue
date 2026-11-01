<script setup lang="ts">
/**
 * Lo esencial de una entrada: tipo, empresa o institución (se crea sin salir), cargo con su inglés,
 * la dirección (automática solo mientras es nueva), el período con «Actual» y la ubicación.
 */
import { computed } from 'vue'
import { enumOptions } from '../../stores/meta'
import Field from '../../ui/Field.vue'
import type { SelectOption } from '../../ui/field'
import Select from '../../ui/Select.vue'
import Switch from '../../ui/Switch.vue'
import TextInput from '../../ui/TextInput.vue'
import { fieldOf } from '../../models/validate'
import BilingualField from '../collections/BilingualField.vue'
import { useEditorContext } from '../collections/context'
import InlineCreate from '../collections/InlineCreate.vue'
import SlugField from '../collections/SlugField.vue'
import { experience as t } from './dict'
import { experienceModel, type ExperienceForm } from './model'
import type { Experience } from './record'

const props = defineProps<{ record: Experience | null }>()
const form = defineModel<ExperienceForm>('form', { required: true })
const emit = defineEmits<{ slugChanged: [record: unknown] }>()

const editor = useEditorContext()
const locked = computed(() => editor?.busy.value ?? false)

const kinds = computed<SelectOption<string>[]>(() => enumOptions('ExperienceKind').map(o => ({ value: o.value, label: o.label })))
const kind = computed({
  get: () => form.value.kind,
  set: (value: string | null) => {
    if (value) form.value.kind = value
  },
})

const today = () => new Date().toLocaleDateString('sv-SE')
/** «Actual» es el «Hasta» vacío: apagarlo propone hoy, que se corrige en el campo. */
const current = computed({
  get: () => !form.value.endedAt,
  set: (on: boolean) => {
    form.value.endedAt = on ? '' : today()
  },
})

const source = computed(() => experienceModel.formTitle(form.value))
const endpoint = computed(() => (props.record ? experienceModel.slugEndpoint?.(props.record.id) ?? null : null))
const preview = (slug: string) => experienceModel.slugPreview?.(slug) ?? slug
const max = (name: string) => fieldOf('Experience', name)?.max ?? null
</script>

<template>
  <div class="grid gap-8.5">
    <div class="grid items-start gap-x-10 gap-y-8.5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      <Field data-field="kind" :label="t.fields.kind" :hint="fieldOf('Experience', 'kind')?.help" :error="editor?.messageFor('kind') ?? null">
        <Select v-model="kind" :options="kinds" :placeholder="false" :disabled="locked" />
      </Field>
      <InlineCreate v-model="form.orgId" kind="org" path="orgId" :label="t.fields.org" :hint="t.fields.orgHint" />
    </div>

    <BilingualField
      v-model:es="form.role"
      v-model:en="form.translations.en.role"
      path="role"
      :label="t.fields.role"
      :hint="fieldOf('Experience', 'role')?.help"
      :max="max('role')"
      required
    />

    <SlugField
      v-model="form.slug"
      :source="source"
      :preview="preview"
      :endpoint="endpoint"
      @changed="emit('slugChanged', $event)"
    />

    <div class="grid items-start gap-x-10 gap-y-8.5 sm:grid-cols-2">
      <Field data-field="startedAt" :label="t.fields.startedAt" :hint="fieldOf('Experience', 'startedAt')?.help" :error="editor?.messageFor('startedAt') ?? null" required>
        <TextInput v-model="form.startedAt" type="date" :readonly="locked" />
      </Field>
      <div class="grid gap-3.5">
        <Field data-field="endedAt" :label="t.fields.endedAt" :error="editor?.messageFor('endedAt') ?? null">
          <TextInput v-if="current" :model-value="t.current" readonly />
          <TextInput v-else v-model="form.endedAt" type="date" :readonly="locked" />
        </Field>
        <Switch v-model="current" :label="t.fields.current" :hint="t.fields.currentHint" :disabled="locked" />
      </div>
    </div>

    <BilingualField
      v-model:es="form.location"
      v-model:en="form.translations.en.location"
      path="location"
      :label="t.fields.location"
      :hint="t.fields.locationHint"
      :max="max('location')"
    />
  </div>
</template>
