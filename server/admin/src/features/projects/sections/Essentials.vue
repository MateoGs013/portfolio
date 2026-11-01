<script setup lang="ts">
/**
 * Lo esencial de una obra: el título (con su inglés opcional, porque es un nombre propio), la
 * dirección fija, el rol con su inglés, el año, la empresa (que se crea acá si falta), la situación
 * con una línea que la explica, la destacada y dónde se ve en vivo.
 */
import { computed } from 'vue'
import { useId } from '../../../composables/useId'
import { enumOptions } from '../../../stores/meta'
import { fieldOf } from '../../../models/validate'
import type { SelectOption } from '../../../ui/field'
import Field from '../../../ui/Field.vue'
import RadioGroup from '../../../ui/RadioGroup.vue'
import Switch from '../../../ui/Switch.vue'
import TextInput from '../../../ui/TextInput.vue'
import BilingualField from '../../collections/BilingualField.vue'
import { useEditorContext } from '../../collections/context'
import InlineCreate from '../../collections/InlineCreate.vue'
import SchemaField from '../../collections/SchemaField.vue'
import SlugField from '../../collections/SlugField.vue'
import { useProject } from '../context'
import { projectsText } from '../dict'
import { projectModel } from '../model'
import type { AdminProject, ProjectStatus } from '../types'

const emit = defineEmits<{ slugChanged: [record: AdminProject] }>()

const t = projectsText.essentials
const linksId = useId('links')
const { form, record } = useProject()
const editor = useEditorContext()
const locked = computed(() => editor?.busy.value ?? false)

const statuses = computed<SelectOption<ProjectStatus>[]>(() => enumOptions('ProjectStatus').map(o => ({
  value: o.value as ProjectStatus,
  label: o.label,
  hint: t.statusHint[o.value],
})))
const status = computed<ProjectStatus | null>({
  get: () => form.value.status,
  set: (value) => {
    if (value) form.value.status = value
  },
})

const endpoint = computed(() => (record.value ? projectModel.slugEndpoint?.(record.value.id) ?? null : null))
const preview = (slug: string) => `/projects/${slug}`

</script>

<template>
  <div class="grid gap-8.5">
    <div class="grid items-start gap-x-10 gap-y-7 xl:grid-cols-2">
      <SchemaField v-model="form.title" model="Project" name="title" />
      <SchemaField
        v-model="form.translations.en.title"
        model="ProjectTranslation"
        name="title"
        path="translations.en.title"
        :label="t.titleEn"
        :hint="t.titleEnHint"
      />
    </div>

    <SlugField
      v-model="form.slug"
      :source="form.title"
      :preview="preview"
      :endpoint="endpoint"
      @changed="emit('slugChanged', $event as AdminProject)"
    />

    <BilingualField
      v-model:es="form.role"
      v-model:en="form.translations.en.role"
      path="role"
      :label="t.role"
      :hint="t.roleHint"
      :max="fieldOf('Project', 'role')?.max ?? null"
      required
    />

    <div class="grid items-start gap-x-10 gap-y-8.5 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <Field
        data-field="year"
        :label="t.year"
        :hint="t.yearHint"
        required
        :error="editor?.messageFor('year') ?? null"
      >
        <TextInput v-model="form.year" inputmode="numeric" autocomplete="off" :maxlength="4" :readonly="locked" />
      </Field>
      <InlineCreate v-model="form.orgId" kind="org" path="orgId" :label="t.org" :hint="t.orgHint" />
    </div>

    <Field data-field="status" :label="t.status" group required :error="editor?.messageFor('status') ?? null">
      <RadioGroup v-model="status" :options="statuses" :label="t.status" variant="list" :disabled="locked" />
    </Field>

    <div data-field="featured">
      <Switch v-model="form.featured" :label="t.featured" :hint="t.featuredHint" :disabled="locked" />
    </div>

    <section class="grid gap-7 border-t border-rule pt-8.5" :aria-labelledby="linksId">
      <div class="grid gap-1.5">
        <h2 :id="linksId" class="m-0 text-title">
          {{ t.links }}
        </h2>
        <p class="m-0 text-body text-dim">
          {{ t.linksText }}
        </p>
      </div>
      <div class="grid items-start gap-x-10 gap-y-7 xl:grid-cols-2">
        <SchemaField v-model="form.url" model="Project" name="url" kind="url" />
        <SchemaField v-model="form.repo" model="Project" name="repo" kind="url" />
      </div>
    </section>
  </div>
</template>
