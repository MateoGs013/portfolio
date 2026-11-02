<script setup lang="ts">
/**
 * El destinatario de la postulación: editable, con «Buscar correo» (POST /jobs/:id/find-email; sin
 * Eros solo devuelve el que trae el aviso, nunca uno adivinado) y «Guardar como contacto»
 * (PATCH /jobs/:id/contact-email) cuando cambia el de la vacante. Debajo dice de dónde salió la
 * dirección (del aviso, de la web de la empresa, adivinada o sin saber): una adivinada lleva su
 * marca y ninguna se presenta como verificada. Si se escribe otra a mano, la nota se va.
 */
import type { HunterJob } from '@shared/hunterContracts'
import { computed, ref } from 'vue'
import { toast } from '../../../stores/toasts'
import Button from '../../../ui/Button.vue'
import Field from '../../../ui/Field.vue'
import StatusDot from '../../../ui/StatusDot.vue'
import TextInput from '../../../ui/TextInput.vue'
import { failureText, hunterApi } from '../adapter'
import { job as t } from '../dictJob'
import { canChange, changeContact } from '../store'
import { workOf } from '../work'

const props = defineProps<{ job: HunterJob }>()
const to = defineModel<string>({ default: '' })

const work = workOf(props.job)
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const valid = computed(() => EMAIL.test(to.value.trim()))
const error = computed(() => (to.value.trim() && !valid.value ? t.apply.toInvalid : null))
const changed = computed(() => valid.value && to.value.trim().toLowerCase() !== (props.job.contact_email ?? '').toLowerCase())

/** De dónde salió la dirección que está escrita; null si se escribió a mano o no se sabe nada. */
const origin = computed(() => {
  const known = work.recipient
  return known && known.email === to.value.trim().toLowerCase() ? known.origin : null
})
const doubtful = computed(() => origin.value === 'guessed' || origin.value === 'unknown')

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
      work.recipient = found.origin ? { email: found.email.toLowerCase(), origin: found.origin } : null
      note.value = found.found ? t.apply.found(found.email) : t.apply.foundKept(found.email)
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
    <p v-if="origin" class="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-label text-dim" data-email-origin>
      <StatusDot v-if="doubtful" tone="wip" :label="t.apply.originMark[origin]" strong />
      <span>{{ t.apply.origin[origin] }}</span>
    </p>
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
