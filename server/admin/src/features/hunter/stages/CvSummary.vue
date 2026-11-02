<script setup lang="ts">
/**
 * El resumen del CV: por defecto el de la base (Perfil). Si Eros propuso uno dirigido a esta vacante
 * y entra en la hoja, se muestra al lado como propuesta, aceptable con un clic y reversible. Si la
 * propuesta no sirve (larga, corta, en otro idioma), se dice por qué y no se ofrece.
 */
import type { TailoredCv } from '@shared/hunterContracts'
import { computed } from 'vue'
import Button from '../../../ui/Button.vue'
import StatusDot from '../../../ui/StatusDot.vue'
import { job as t } from '../dictJob'

const props = defineProps<{
  tailored: TailoredCv
  baseSummary: string | null
  company: string
  pending: boolean
}>()

const emit = defineEmits<{ use: [proposal: boolean] }>()

const usesProposal = computed(() => props.tailored.usesSummaryProposal)
const base = computed(() => (usesProposal.value ? props.baseSummary : props.tailored.data.summary))
const verdict = computed(() => props.tailored._adaptation.proposal)
const proposal = computed(() => (verdict.value === 'ok' ? props.tailored.summaryProposal : null))
const reason = computed(() => (verdict.value && verdict.value !== 'ok' ? t.cv.proposalReason[verdict.value] : null))
</script>

<template>
  <section class="grid gap-4" :aria-label="t.cv.summary">
    <h3 class="m-0 text-label font-[420] text-dim">
      {{ t.cv.summary }}
    </h3>
    <div class="grid gap-3 border-t border-rule pt-4">
      <p class="m-0 text-label text-faint">
        {{ t.cv.fromBase }}
      </p>
      <p v-if="base" class="m-0 text-body" :class="usesProposal ? 'text-dim' : 'text-ink'">
        {{ base }}
      </p>
      <StatusDot v-if="!usesProposal" tone="ok" :label="t.cv.inUse" />
      <div v-else>
        <Button :loading="pending" @click="emit('use', false)">
          {{ t.cv.useBase }}
        </Button>
      </div>
    </div>
    <div v-if="proposal" class="grid gap-3 border-t border-rule pt-4">
      <p class="m-0 flex items-center gap-2 text-label text-faint">
        <span class="size-1.5 shrink-0 rounded-full bg-sig" aria-hidden="true" />
        {{ t.cv.proposal(company) }}
      </p>
      <p class="m-0 text-body" :class="usesProposal ? 'text-ink' : 'text-dim'">
        {{ proposal }}
      </p>
      <StatusDot v-if="usesProposal" tone="ok" :label="t.cv.inUse" />
      <div v-else>
        <Button :loading="pending" @click="emit('use', true)">
          {{ t.cv.useProposal }}
        </Button>
      </div>
    </div>
    <p v-else-if="reason" class="m-0 border-t border-rule pt-4 text-label text-faint">
      {{ reason }}
    </p>
  </section>
</template>
