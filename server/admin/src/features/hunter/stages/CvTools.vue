<script setup lang="ts">
/**
 * Lo que se hace con la hoja armada:
 * - «Imprimir o guardar como PDF»: la ventana se abre en el mismo gesto (si no, el navegador la
 *   bloquea) y recibe la dirección de la hoja con auto_print cuando está lista. Si el navegador la
 *   bloqueó igual, queda el enlace «Abrir para imprimir».
 * - «Copiar texto plano»: el /txt del servidor, el mismo CV para un formulario ATS. Si el
 *   portapapeles no deja, el texto aparece seleccionado para copiarlo a mano.
 * - «Ampliar»: la hoja en un diálogo grande.
 */
import type { HunterJob } from '@shared/hunterContracts'
import { nextTick, ref } from 'vue'
import { useClipboard } from '../../../composables/useClipboard'
import { announce } from '../../../ui/announce'
import { toast } from '../../../stores/toasts'
import Button from '../../../ui/Button.vue'
import Dialog from '../../../ui/Dialog.vue'
import Field from '../../../ui/Field.vue'
import TextArea from '../../../ui/TextArea.vue'
import { failureText } from '../adapter'
import { cvText, sheetUrl, type CvRequest } from '../cvClient'
import { job as t } from '../dictJob'
import CvFrame from './CvFrame.vue'

const props = defineProps<{
  job: HunterJob
  request: CvRequest
  url: string
}>()

/* ── Imprimir ──────────────────────────────────────────── */

const printing = ref(false)
const printLink = ref<string | null>(null)

async function print(): Promise<void> {
  if (printing.value) return
  printLink.value = null
  // En el gesto: después de un await el navegador ya no la deja abrir.
  const win = window.open('', '_blank')
  printing.value = true
  try {
    const url = await sheetUrl(props.job, props.request, 'print')
    if (win && !win.closed) {
      win.opener = null
      win.location.href = url
    }
    else {
      printLink.value = url
      announce(`${t.cv.printBlocked} ${t.cv.printLink}.`)
    }
  }
  catch (err) {
    win?.close()
    toast(failureText(err, t.cv.failed), { tone: 'error' })
  }
  finally {
    printing.value = false
  }
}

/* ── Texto plano ───────────────────────────────────────── */

const { copy, copied } = useClipboard()
const copying = ref(false)
const fallback = ref<string | null>(null)
const fallbackBox = ref<HTMLElement | null>(null)

async function copyPlain(): Promise<void> {
  if (copying.value) return
  copying.value = true
  fallback.value = null
  try {
    const text = await cvText(props.job, props.request)
    if (await copy(text) === 'ok') {
      toast(t.cv.copiedText, { tone: 'info', duration: 2000 })
      return
    }
    fallback.value = text
    await nextTick()
    const area = fallbackBox.value?.querySelector('textarea')
    area?.focus()
    area?.select()
    announce(t.cv.copyFailed, 'assertive')
  }
  catch (err) {
    toast(failureText(err, t.cv.failed), { tone: 'error' })
  }
  finally {
    copying.value = false
  }
}

/* ── Ampliar ───────────────────────────────────────────── */

const expanded = ref(false)
</script>

<template>
  <div class="grid gap-4">
    <div class="flex flex-wrap gap-2">
      <Button variant="primary" :loading="printing" :loading-label="t.cv.print" @click="print">
        {{ t.cv.print }}
      </Button>
      <Button icon="copy" :loading="copying" :loading-label="t.cv.copyText" @click="copyPlain">
        {{ copied ? t.cv.copiedText : t.cv.copyText }}
      </Button>
      <Button variant="ghost" @click="expanded = true">
        {{ t.cv.expand }}
      </Button>
    </div>
    <p class="m-0 text-label text-faint">
      {{ t.cv.printHint }}
    </p>
    <p v-if="printLink" class="m-0 flex flex-wrap items-baseline gap-x-2 text-body text-dim" role="status">
      {{ t.cv.printBlocked }}
      <a :href="printLink" target="_blank" rel="noopener noreferrer" class="text-ink underline decoration-1 underline-offset-4">{{ t.cv.printLink }}</a>
    </p>
    <div v-if="fallback !== null" ref="fallbackBox" class="grid gap-3">
      <p class="m-0 flex items-baseline gap-2.5 text-body text-ink" role="alert">
        <span class="size-1.5 shrink-0 translate-y-[-1px] rounded-full bg-wip" aria-hidden="true" />
        {{ t.cv.copyFailed }}
      </p>
      <Field :label="t.cv.textLabel">
        <TextArea :model-value="fallback" readonly :prose="false" :rows="8" :max-rows="16" data-cv-text />
      </Field>
    </div>

    <Dialog v-model:open="expanded" :title="t.cv.expandTitle" size="lg">
      <CvFrame v-if="expanded" :url="url" :title="t.cv.sheet" :max-width="712" />
    </Dialog>
  </div>
</template>
