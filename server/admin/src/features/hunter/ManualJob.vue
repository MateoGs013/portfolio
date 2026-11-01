<script setup lang="ts">
/**
 * «Pegar una vacante»: la que encontraste por tu cuenta, con Eros arriba o caído. Se guarda en esta
 * pestaña como manual-<hash> y pasa por las mismas cuatro etapas; nunca se le pregunta a Eros por ella.
 * Lo único obligatorio es la descripción (o al menos el título): es lo que se analiza y lo que ordena
 * el CV.
 */
import type { HunterJob } from '@shared/hunterContracts'
import { computed, reactive, ref, watch } from 'vue'
import Button from '../../ui/Button.vue'
import Dialog from '../../ui/Dialog.vue'
import Field from '../../ui/Field.vue'
import TextArea from '../../ui/TextArea.vue'
import TextInput from '../../ui/TextInput.vue'
import { hunter } from './dict'
import { addManualJob } from './store'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ created: [job: HunterJob] }>()

const t = hunter.manual

const form = reactive({ title: '', company: '', description: '', contactEmail: '', url: '' })
const tried = ref(false)

watch(open, (value) => {
  if (!value) return
  Object.assign(form, { title: '', company: '', description: '', contactEmail: '', url: '' })
  tried.value = false
})

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const errors = computed(() => ({
  description: !form.description.trim() && !form.title.trim() ? t.missing : null,
  contactEmail: form.contactEmail.trim() && !EMAIL.test(form.contactEmail.trim()) ? t.badEmail : null,
  url: form.url.trim() && !/^https?:\/\//i.test(form.url.trim()) ? t.badUrl : null,
}))
const valid = computed(() => !Object.values(errors.value).some(Boolean))
const shown = (key: keyof typeof errors.value) => (tried.value ? errors.value[key] : null)

const dirty = computed(() => Object.values(form).some(value => value.trim()))

function submit(): void {
  tried.value = true
  if (!valid.value) {
    const first = (Object.keys(errors.value) as (keyof typeof errors.value)[]).find(key => errors.value[key])
    document.querySelector<HTMLElement>(`[data-manual="${first}"] :is(input, textarea)`)?.focus()
    return
  }
  const job = addManualJob(form)
  open.value = false
  emit('created', job)
}
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="t.title"
    :description="t.description"
    size="lg"
    :dismissible="!dirty"
    initial-focus="[data-manual='title'] input"
  >
    <form id="pegar-vacante" class="grid gap-8.5" novalidate @submit.prevent="submit">
      <div class="grid gap-8.5 sm:grid-cols-2">
        <Field :label="t.jobTitle" data-manual="title">
          <TextInput v-model="form.title" autocomplete="off" />
        </Field>
        <Field :label="t.company" data-manual="company">
          <TextInput v-model="form.company" autocomplete="organization" />
        </Field>
      </div>
      <Field :label="t.text" :hint="t.textHint" :error="shown('description')" data-manual="description">
        <TextArea v-model="form.description" :rows="6" :max-rows="14" />
      </Field>
      <div class="grid gap-8.5 sm:grid-cols-2">
        <Field :label="t.email" :error="shown('contactEmail')" data-manual="contactEmail">
          <template #aux>
            {{ t.optional }}
          </template>
          <TextInput v-model="form.contactEmail" type="email" mono autocomplete="off" inputmode="email" />
        </Field>
        <Field :label="t.url" :error="shown('url')" data-manual="url">
          <template #aux>
            {{ t.optional }}
          </template>
          <TextInput v-model="form.url" type="url" mono autocomplete="off" inputmode="url" />
        </Field>
      </div>
    </form>
    <template #footer>
      <Button variant="ghost" @click="open = false">
        {{ t.cancel }}
      </Button>
      <Button variant="primary" type="submit" form="pegar-vacante">
        {{ t.create }}
      </Button>
    </template>
  </Dialog>
</template>
