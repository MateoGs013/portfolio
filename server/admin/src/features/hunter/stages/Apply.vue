<script setup lang="ts">
/**
 * Etapa Postular: destinatario (con de dónde salió), la vista previa del correo (POST
 * /jobs/:id/apply-preview con la vacante; si ya escribiste el mensaje, ese es el cuerpo) y las salidas:
 * - «Abrir en Gmail», el primario: abre el borrador y no marca nada.
 * - «Enviar desde Eros» (POST /jobs/:id/apply-email), visible solo con EROS_SEND_ENABLED=on en la
 *   API (`erosSend` de /status). La API imprime el PDF del CV de la etapa CV y Eros lo adjunta tal
 *   cual; la confirmación nombra destinatario, asunto y adjunto (y se apaga sin Eros, con una pegada
 *   o con la muestra). Si la API ya no tiene el CV (409 cv_expired) se rearma y se pide revisarlo
 *   antes de enviar. Si un envío se cortó sin saber si salió, ofrece «Ya salió» o reintentar.
 * - «Ya la envié» (PATCH status applied): la única forma de marcarla como postulada a mano.
 */
import type { HunterJob } from '@shared/hunterContracts'
import { computed, onMounted, ref } from 'vue'
import { RequestError } from '../../../api/errors'
import { requestConfirm } from '../../../stores/dialogs'
import { adminStatus } from '../../../stores/status'
import { toast } from '../../../stores/toasts'
import Button from '../../../ui/Button.vue'
import Field from '../../../ui/Field.vue'
import Spinner from '../../../ui/Spinner.vue'
import StatusDot from '../../../ui/StatusDot.vue'
import TextArea from '../../../ui/TextArea.vue'
import TextInput from '../../../ui/TextInput.vue'
import { failureText, hunterApi, originOf } from '../adapter'
import { isCvExpired, refreshCv } from '../cvClient'
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
    const to = props.job.contact_email ?? preview.to_email ?? preview.contact_email ?? ''
    work.mail = {
      to,
      subject: work.pitch?.subject || preview.subject,
      body: bodyFrom(preview.body),
    }
    if (to && preview.email_origin) work.recipient = { email: to.toLowerCase(), origin: preview.email_origin }
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

/** «Enviar desde Eros» encendido en la API (EROS_SEND_ENABLED=on, llega por /status). */
const sendEnabled = computed(() => adminStatus.value?.erosSend === true)

/** Un envío se cortó y no se sabe si salió: el texto del servidor, hasta que se resuelva. */
const unknownOutcome = ref<string | null>(null)

const attachmentLine = computed(() => {
  const m = work.measure
  const what = m && m.pages === 1 ? t.apply.attachmentMeasured(Math.round(m.heightMm)) : t.apply.attachmentUnmeasured
  return `${t.apply.attachment}: ${what}`
})

const sending = ref(false)
async function send(retry = false): Promise<void> {
  const m = mail.value
  if (!sendEnabled.value || sending.value || sendBlocked.value || !validTo.value || !m) return
  const ok = await requestConfirm(retry
    ? {
        title: t.apply.retryTitle,
        message: t.apply.retryMessage,
        impact: [`${t.apply.to}: ${m.to.trim()}`, attachmentLine.value],
        confirmLabel: t.apply.retryConfirm,
        destructive: true,
      }
    : {
        title: t.apply.sendTitle,
        message: t.apply.sendMessage,
        impact: [`${t.apply.to}: ${m.to.trim()}`, `${t.apply.subject}: ${m.subject}`, attachmentLine.value],
        confirmLabel: t.apply.sendConfirm,
      })
  if (!ok) return
  sending.value = true
  try {
    const result = await hunterApi.applyEmail(props.job, { to_email: m.to.trim(), subject: m.subject, body: m.body, force_retry: retry })
    // Eros puede responder 200 sin haber despachado nada: entonces la vacante no se marca postulada.
    if (!result.ok) {
      toast(`${t.apply.sendFailed} ${t.apply.notDispatched}`, { tone: 'error' })
      return
    }
    unknownOutcome.value = null
    replaceJob({ ...props.job, status: 'applied' })
    const to = result.dispatched_to ?? m.to.trim()
    toast(result.cv ? t.apply.sentWith(to, result.cv.filename) : t.apply.sent(to))
    if (result.warning) toast(result.warning, { tone: 'error' })
  }
  catch (err) {
    if (isCvExpired(err)) {
      // El CV rearmado se revisa en la etapa CV antes de mandarlo: no se envía solo.
      try {
        await refreshCv(props.job)
        toast(t.apply.cvRefreshed, { tone: 'error' })
      }
      catch (again) {
        toast(failureText(again, t.apply.sendFailed), { tone: 'error' })
      }
      return
    }
    if (err instanceof RequestError && err.code === 'send_outcome_unknown') {
      unknownOutcome.value = err.message
      return
    }
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
    unknownOutcome.value = null
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

        <section v-if="sendEnabled && unknownOutcome && !applied" class="grid gap-3 border-t border-rule pt-7" role="alert" aria-labelledby="envio-incierto">
          <h3 id="envio-incierto" class="m-0 flex items-center gap-2 text-body font-semibold text-ink">
            <StatusDot tone="wip" :label="t.apply.unknownTitle" strong />
          </h3>
          <p class="m-0 text-body text-dim">
            {{ unknownOutcome }} {{ t.apply.unknownHint }}
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <Button variant="primary" :loading="marking" :disabled="!canChange(job)" @click="markApplied">
              {{ t.apply.unknownSent }}
            </Button>
            <Button :loading="sending" :loading-label="t.apply.unknownRetry" :disabled="!!sendBlocked" @click="send(true)">
              {{ t.apply.unknownRetry }}
            </Button>
          </div>
        </section>

        <div class="grid gap-3 border-t border-rule pt-7">
          <div class="flex flex-wrap items-center gap-2">
            <Button variant="primary" :href="gmailUrl" external :disabled="!gmailUrl" :aria-describedby="gmailUrl ? undefined : 'postular-motivo'">
              {{ t.apply.gmail }}
            </Button>
            <Button
              v-if="sendEnabled && !unknownOutcome"
              :loading="sending"
              :loading-label="t.apply.send"
              :aria-disabled="sendBlocked || !validTo || sending ? 'true' : undefined"
              :aria-describedby="sendBlocked ? 'enviar-motivo' : !validTo ? 'postular-motivo' : undefined"
              :class="sendBlocked || !validTo ? 'opacity-45' : ''"
              @click="send()"
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
          <p v-if="sendEnabled && sendBlocked" id="enviar-motivo" class="m-0 text-label text-faint">
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
