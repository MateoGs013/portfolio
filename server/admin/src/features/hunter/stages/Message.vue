<script setup lang="ts">
/**
 * Etapa Mensaje (POST /hunter/jobs/:id/pitch con la vacante): asunto, presentación corta, carta y
 * nota para conectar, en el idioma de la vacante. Se pueden retocar antes de copiar; lo retocado
 * queda para esta vacante mientras dure la sesión y Postular lo usa como cuerpo del correo.
 */
import type { HunterJob } from '@shared/hunterContracts'
import { computed, ref } from 'vue'
import { toast } from '../../../stores/toasts'
import Button from '../../../ui/Button.vue'
import { failureText, hunterApi, originOf } from '../adapter'
import { job as t } from '../dictJob'
import { isSample } from '../model'
import OriginNote from '../OriginNote.vue'
import { workOf } from '../work'
import CopyField from './CopyField.vue'
import StageHead from './StageHead.vue'

const props = defineProps<{ job: HunterJob }>()

const work = workOf(props.job)
const pitch = computed(() => work.pitch)
const pending = ref(false)
const head = ref<InstanceType<typeof StageHead> | null>(null)

async function run(): Promise<void> {
  if (pending.value) return
  pending.value = true
  try {
    const result = await hunterApi.pitch(props.job)
    work.pitch = { ...result.data }
    work.pitchOrigin = isSample(props.job) ? 'demo' : originOf(result)
    // El correo de Postular se vuelve a armar con este mensaje.
    work.mail = null
    toast(t.message.done)
    head.value?.focus()
  }
  catch (err) {
    toast(failureText(err, t.message.failed), { tone: 'error' })
  }
  finally {
    pending.value = false
  }
}

// Si el CV todavía no está armado, la etapa CV lo adapta al entrar (lo que promete el botón).
const next = computed(() => `#/busqueda/vacantes/${encodeURIComponent(props.job.id)}/cv${work.cv ? '' : '?adaptar=1'}`)
const lang = computed(() => pitch.value?.lang ?? undefined)
</script>

<template>
  <div class="grid gap-11">
    <StageHead ref="head" :heading="t.message.heading" :intro="t.message.intro">
      <template v-if="pitch">
        <Button variant="primary" :href="next">
          {{ t.cv.run }}
        </Button>
        <Button variant="ghost" :loading="pending" :loading-label="t.message.running" @click="run">
          {{ t.message.again }}
        </Button>
      </template>
      <Button v-else variant="primary" :loading="pending" :loading-label="t.message.running" @click="run">
        {{ t.message.run }}
      </Button>
    </StageHead>

    <div v-if="pitch" class="grid max-w-[720px] animate-enter gap-8.5 border-t border-rule pt-7" :lang="lang">
      <OriginNote v-if="work.pitchOrigin" :origin="work.pitchOrigin" />
      <CopyField v-model="pitch.subject" :label="t.message.subject" :copy-label="t.message.copy(t.message.subject)" :multiline="false" />
      <CopyField v-model="pitch.elevator_pitch" :label="t.message.pitch" :copy-label="t.message.copy(t.message.pitch)" />
      <CopyField v-model="pitch.cover_letter" :label="t.message.letter" :copy-label="t.message.copy(t.message.letter)" />
      <CopyField
        v-model="pitch.connection_note"
        :label="t.message.note"
        :copy-label="t.message.copy(t.message.note)"
        :hint="t.message.noteHint"
        :max="300"
      />
    </div>
    <p v-else class="m-0 border-t border-rule pt-7 text-body text-faint">
      {{ t.message.empty }}
    </p>
  </div>
</template>
