<script setup lang="ts">
/**
 * El estado del servidor, solo si algo anda mal: una línea en --dim con el punto en --wip, una frase
 * corta y Reintentar. Lo que sigue andando sin Eros lo dice cada pantalla que lo usa. La región viva
 * está montada desde el arranque, así el aviso se lee cuando aparece.
 */
import { ref } from 'vue'
import { refreshStatus, statusProblem } from '../stores/status'
import { shell } from './dict'

// Solo el pedido de quien tocó Reintentar cambia el rótulo: el sondeo de cada 30 s no se anuncia.
const retrying = ref(false)
async function retry(): Promise<void> {
  retrying.value = true
  await refreshStatus()
  retrying.value = false
}
</script>

<template>
  <div role="status" :aria-label="shell.status.region" data-status-notice>
    <p v-if="statusProblem" class="m-0 flex animate-enter items-start gap-2 text-label text-dim">
      <span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-wip" aria-hidden="true" />
      <span class="min-w-0">
        {{ statusProblem }}
        <button
          type="button"
          class="ml-1 rounded-kbd border-0 bg-transparent p-0 text-label text-ink underline decoration-rule-hover underline-offset-4 transition-colors duration-120 ease-e hover:decoration-ink disabled:text-faint"
          :disabled="retrying"
          @click="retry"
        >{{ retrying ? shell.status.checking : shell.status.retry }}</button>
      </span>
    </p>
  </div>
</template>
