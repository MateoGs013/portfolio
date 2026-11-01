<script setup lang="ts">
/**
 * Etapa Postular: destinatario, la vista previa del correo (POST /jobs/:id/apply-preview con la
 * vacante; si ya escribiste el mensaje, ese es el cuerpo) y tres salidas:
 * - «Abrir en Gmail», el primario: abre el borrador y no marca nada.
 * - «Enviar desde Eros» (POST /jobs/:id/apply-email), con confirmación que muestra destinatario y
 *   asunto. Sin Eros, con una vacante pegada o con la muestra queda apagado y dice por qué.
 * - «Ya la envié» (PATCH status applied): la única forma de marcarla como postulada a mano.
 */
import type { HunterJob } from '@shared/hunterContracts'
import { computed, onMounted, ref } from 'vue'
import { requestConfirm } from '../../../stores/dialogs'
import { adminStatus } from '../../../stores/status'
import { toast } from '../../../stores/toasts'
import Button from '../../../ui/Button.vue'
import Field from '../../../ui/Field.vue'
import Spinner from '../../../ui/Spinner.vue'
import TextArea from '../../../ui/TextArea.vue'
import TextInput from '../../../ui/TextInput.vue'
import { failureText, hunterApi, originOf } from '../adapter'
import { job as t } from '../dictJob'
import { isManual, isSample } from '../model'
import OriginNote from '../OriginNote.vue'
import { canChange, changeStatus, offline, replaceJob } from '../store'
import { workOf } from '../work'
import ApplyRecipient from './ApplyRecipient.vue'
import StageHead from './StageHead.vue'

const props = defineProps<{ job: HunterJob }>()

const work = workOf(props.job)
const loading = ref(false)
const loadFailed = ref<string | null>(null)

/** El cuerpo: el mensaje de la etapa anterior si existe; si no, el de la vista previa. */
function bodyFrom(previewBody: string): string {
  const pitch = work.pitch
  if (!pitch) return previewBody
  return [pitch.elevator_pitch, pitch.cover_letter].filter(Boolean).join('\n\n') || previewBody
}

async function loadPreview(): Promise<void> {
  loading.value = true
  loadFailed.value = null
  try {
    const preview = await hunterApi.applyPreview(props.job)
    work.preview = preview
    work.previewOrigin = isSample(props.job) ? 'demo' : originOf(preview)
    work.mail = {
      to: props.job.contact_email ?? preview.to_email ?? preview.contact_email ?? '',
      subject: work.pitch?.subject || preview.subject,
      body: bodyFrom(preview.body),
    }
  }
  catch (err) {
    loadFailed.value = failureText(err, t.apply.previewFailed)
    work.mail ??= { to: props.job.contact_email ?? '', subject: work.pitch?.subject ?? '', body: bodyFrom('') }
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!work.mail) void loadPreview()
})

const mail = computed(() => work.mail)
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const validTo = computed(() => !!mail.value && EMAIL.test(mail.value.to.trim()))

const gmailUrl = computed(() => {
  const m = mail.value
  if (!m || !validTo.value) return undefined
  const params = new URLSearchParams({ view: 'cm', fs: '1', to: m.to.trim(), su: m.subject, body: m.body })
  return `https://mail.google.com/mail/?${params.toString()}`
})

const applied = computed(() => props.job.status === 'applied')

const sendBlocked = computed<string | null>(() => {
  if (isManual(props.job)) return t.apply.sendManual
  if (isSample(props.job)) return t.apply.sendSample
  if (offline.value || (adminStatus.value && adminStatus.value.eros.state !== 'ok')) return t.apply.sendNoEros
  return null
})

const sending = ref(false)
async function send(): Promise<void> {
  const m = mail.value
  if (sending.value || sendBlocked.value || !validTo.value || !m) return
  const ok = await requestConfirm({
    title: t.apply.sendTitle,
    message: t.apply.sendMessage,
    impact: [`${t.apply.to}: ${m.to.trim()}`, `${t.apply.subject}: ${m.subject}`],
    confirmLabel: t.apply.sendConfirm,
  })
  if (!ok) return
  sending.value = true
  try {
    const result = await hunterApi.applyEmail(props.job, { to_email: m.to.trim(), subject: m.subject, body: m.body })
    // Eros puede responder 200 sin haber despachado nada: entonces la vacante no se marca postulada.
    if (!result.ok) {
      toast(`${t.apply.sendFailed} ${t.apply.notDispatched}`, { tone: 'error' })
      return
    }
    replaceJob({ ...props.job, status: 'applied' })
    toast(t.apply.sent(result.dispatched_to ?? m.to.trim()))
  }
  catch (err) {
    toast(failureText(err, t.apply.sendFailed), { tone: 'error' })
  }
  finally {
    sending.value = false
  }
}

const marking = ref(false)
async function markApplied(): Promise<void> {
  if (marking.value || applied.value || !canChange(props.job)) return
  marking.value = true
  try {
    await changeStatus(props.job, 'applied')
    toast(t.apply.marked)
  }
  catch (err) {
    toast(failureText(err, t.apply.markFailed), { tone: 'error' })
  }
  finally {
    marking.value = false
  }
}
</script>

<template>
  <div class="grid gap-11">
    <StageHead :heading="t.apply.heading" :intro="t.apply.intro" />

    <div class="grid max-w-[720px] gap-8.5 border-t border-rule pt-7">
      <p v-if="loading" class="m-0 text-body text-dim">
        <Spinner :label="t.apply.previewLoading" show-label />
      </p>
      <template v-else-if="mail">
        <OriginNote v-if="work.previewOrigin" :origin="work.previewOrigin" />
        <p v-if="loadFailed" class="m-0 text-body text-dim" role="status">
          {{ loadFailed }}
        </p>
        <ApplyRecipient v-model="mail.to" :job="job" />
        <Field :label="t.apply.subject">
          <TextInput v-model="mail.subject" />
        </Field>
        <Field :label="t.apply.body">
          <TextArea v-model="mail.body" :rows="8" />
        </Field>

        <div class="grid gap-3 border-t border-rule pt-7">
          <div class="flex flex-wrap items-center gap-2">
            <Button variant="primary" :href="gmailUrl" external :disabled="!gmailUrl" :aria-describedby="gmailUrl ? undefined : 'postular-motivo'">
              {{ t.apply.gmail }}
            </Button>
            <Button
              :loading="sending"
              :loading-label="t.apply.send"
              :aria-disabled="sendBlocked || !validTo || sending ? 'true' : undefined"
              :aria-describedby="sendBlocked ? 'enviar-motivo' : !validTo ? 'postular-motivo' : undefined"
              :class="sendBlocked || !validTo ? 'opacity-45' : ''"
              @click="send"
            >
              {{ t.apply.send }}
            </Button>
            <Button
              variant="ghost"
              :loading="marking"
              :disabled="applied"
              :aria-disabled="!applied && !canChange(job) ? 'true' : undefined"
              :aria-describedby="!applied && !canChange(job) ? 'marcar-motivo' : undefined"
              :class="!applied && !canChange(job) ? 'opacity-45' : ''"
              @click="markApplied"
            >
              {{ t.apply.done }}
            </Button>
          </div>
          <p v-if="!gmailUrl" id="postular-motivo" class="m-0 text-label text-faint">
            {{ t.apply.toMissing }}
          </p>
          <p v-if="sendBlocked" id="enviar-motivo" class="m-0 text-label text-faint">
            {{ sendBlocked }}
          </p>
          <p v-if="!applied && !canChange(job)" id="marcar-motivo" class="m-0 text-label text-faint">
            {{ t.apply.markLocked }}
          </p>
          <p v-if="applied" class="m-0 text-label text-faint">
            {{ t.apply.applied }}
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
