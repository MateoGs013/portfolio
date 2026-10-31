<script setup lang="ts">
/** Campos livianos (texto, dirección, prosa) y elecciones (interruptor, opciones y lista nativa). */
import { ref } from 'vue'
import { ui } from '../dict'
import Field from '../Field.vue'
import RadioGroup from '../RadioGroup.vue'
import Select from '../Select.vue'
import Switch from '../Switch.vue'
import TextArea from '../TextArea.vue'
import TextInput from '../TextInput.vue'
import Sample from './Sample.vue'
import type { SampleProject } from './useSampleProjects'

const props = defineProps<{ projects: SampleProject[] }>()

const t = ui.muestrario
const s = t.sample
const SUMMARY_MAX = 160

const first = props.projects[0]
const title = ref(first?.title ?? '')
const empty = ref('')
const slug = ref(String(first?.key ?? ''))
const summary = ref(first?.summary ?? '')
const visible = ref(true)
const hidden = ref(false)
const lang = ref<'es' | 'en' | null>('es')
const role = ref<'cover' | 'gallery' | null>('cover')
const project = ref<string | null>(first ? String(first.key) : null)
const none = ref<string | null>(null)

const langOptions = [{ value: 'es' as const, label: s.spanish }, { value: 'en' as const, label: s.english }]
const roleOptions = [
  { value: 'cover' as const, label: s.cover, hint: s.coverHint },
  { value: 'gallery' as const, label: s.gallery, hint: s.galleryHint },
]
const projectOptions = props.projects.map(p => ({ value: String(p.key), label: p.title }))
</script>

<template>
  <Sample :title="t.fields.title" :text="t.fields.text">
    <div class="grid gap-x-16 gap-y-8.5 lg:grid-cols-2">
      <Field :label="s.title" :hint="s.titleHint" required>
        <TextInput v-model="title" />
      </Field>
      <Field :label="`${s.title} · ${t.state.error}`" :error="s.titleError" required>
        <TextInput v-model="empty" />
      </Field>
      <Field :label="s.slug" :hint="s.slugHint">
        <TextInput v-model="slug" mono />
      </Field>
      <Field :label="`${s.slug} · ${t.state.disabled}`">
        <TextInput v-model="slug" mono disabled />
      </Field>
      <Field :label="s.summary" :hint="s.summaryHint" :count="summary.length" :max="SUMMARY_MAX" class="lg:col-span-2">
        <TextArea v-model="summary" :rows="2" />
      </Field>
      <Field :label="`${s.summary} · ${t.state.empty}`" :hint="s.summaryHint" class="lg:col-span-2">
        <TextArea v-model="empty" :rows="2" />
      </Field>
    </div>
  </Sample>

  <Sample :title="t.choices.title" :text="t.choices.text">
    <div class="grid gap-x-16 gap-y-8.5 lg:grid-cols-2">
      <div class="grid content-start gap-5">
        <Switch v-model="visible" :label="s.showOnSite" :hint="s.showOnSiteHint" />
        <Switch v-model="hidden" :label="`${s.showOnSite} · ${t.state.off}`" />
        <Switch :model-value="true" :label="`${s.showOnSite} · ${t.state.disabled}`" disabled />
      </div>
      <div class="grid content-start gap-6">
        <RadioGroup v-model="lang" :options="langOptions" :label="s.language" />
        <RadioGroup v-model="lang" :options="langOptions" :label="s.language" variant="underline" />
        <Field :label="s.mediaRole" group>
          <RadioGroup v-model="role" :options="roleOptions" :label="s.mediaRole" variant="list" />
        </Field>
      </div>
      <Field :label="t.listbox.title">
        <Select v-model="project" :options="projectOptions" />
      </Field>
      <Field :label="`${t.listbox.title} · ${t.state.empty}`" :error="s.chooseError" required>
        <Select v-model="none" :options="projectOptions" />
      </Field>
    </div>
  </Sample>
</template>
