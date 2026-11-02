<script setup lang="ts">
/**
 * El destinatario de la postulación: editable, con «Buscar correo» (POST /jobs/:id/find-email; sin
 * Eros solo devuelve el que trae el aviso, nunca uno adivinado) y «Guardar como contacto»
 * (PATCH /jobs/:id/contact-email) cuando cambia el de la vacante.
 */
import type { HunterJob } from '@shared/hunterContracts'
import { computed, ref } from 'vue'
import { toast } from '../../../stores/toasts'
import Button from '../../../ui/Button.vue'
import Field from '../../../ui/Field.vue'
import TextInput from '../../../ui/TextInput.vue'
import { failureText, hunterApi } from '../adapter'
import { job as t } from '../dictJob'
import { canChange, changeContact } from '../store'

const props = defineProps<{ job: HunterJob }>()
const to = defineModel<string>({ default: '' })

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const valid = computed(() => EMAIL.test(to.value.trim()))
const error = computed(() => (to.value.trim() && !valid.value ? t.apply.toInvalid : null))
const changed = computed(() => valid.value && to.value.trim().toLowerCase() !== (props.job.contact_email ?? '').toLowerCase())

const finding = ref(false)
const saving = ref(false)
const note = ref<string | null>(null)

async function find(): Promise<void> {
  if (finding.value) return
  finding.value = true
  note.value = null
  try {
    const found = await hunterApi.findEmail(props.job)
    if (found.email) {
      to.value = found.email
      note.value = [t.apply.found(found.email), found.confidence === null ? t.apply.foundJob : t.apply.foundEros(Math.round(found.confidence))].join(' ')
    }
    else note.value = t.apply.notFound
  }
  catch (err) {
    toast(failureText(err, t.apply.findFailed), { tone: 'error' })
  }
  finally {
    finding.value = false
  }
}

async function save(): Promise<void> {
  if (saving.value || !changed.value) return
  saving.value = true
  try {
    await changeContact(props.job, to.value.trim().toLowerCase())
    toast(t.apply.savedTo)
  }
  catch (err) {
    toast(failureText(err, t.apply.saveToFailed), { tone: 'error' })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="grid gap-3">
    <Field :label="t.apply.to" :hint="t.apply.toHint" :error="error">
      <TextInput v-model="to" type="email" mono autocomplete="off" inputmode="email" />
    </Field>
    <div class="flex flex-wrap items-center gap-2">
      <Button :loading="finding" :loading-label="t.apply.finding" @click="find">
        {{ t.apply.find }}
      </Button>
      <Button v-if="changed && canChange(job)" variant="ghost" :loading="saving" @click="save">
        {{ t.apply.saveTo }}
      </Button>
    </div>
    <p v-if="note" class="m-0 text-label text-faint" role="status">
      {{ note }}
    </p>
  </div>
</template>
