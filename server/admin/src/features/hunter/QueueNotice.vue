<script setup lang="ts">
/**
 * Por qué la cola está en solo lectura, en palabras: Eros no respondió (con la hora de la última
 * lista buena de esta sesión, si hay) o es la muestra de prueba. El párrafo con el motivo es el que
 * describen los controles apagados (aria-describedby="cola-bloqueada").
 */
import { computed } from 'vue'
import Button from '../../ui/Button.vue'
import { ui } from '../../ui/dict'
import { hunter } from './dict'
import { isSampleQueue, lastSync, offline, queueFetching } from './store'

defineProps<{ locked: string | null }>()
defineEmits<{ retry: [] }>()

const time = computed(() => (lastSync.value
  ? new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(lastSync.value))
  : null))
</script>

<template>
  <div v-if="offline" role="status" class="grid max-w-[68ch] animate-enter gap-2 border-t border-rule pt-5">
    <p class="m-0 flex items-center gap-2.5 text-row text-ink">
      <span class="size-1.5 shrink-0 rounded-full bg-wip" aria-hidden="true" />
      {{ hunter.offline.title }}
      <span v-if="time" class="text-label font-[420] text-faint tabular-nums">{{ hunter.offline.synced(time) }}</span>
    </p>
    <p id="cola-bloqueada" class="m-0 text-body text-dim">
      {{ time ? hunter.offline.withCache(time) : hunter.offline.noCache }}
    </p>
    <div class="mt-1">
      <Button variant="ghost" class="-ml-3" :loading="queueFetching" @click="$emit('retry')">
        {{ ui.actions.retry }}
      </Button>
    </div>
  </div>
  <p v-else-if="isSampleQueue && locked" id="cola-bloqueada" class="m-0 flex max-w-[68ch] items-center gap-2.5 border-t border-rule pt-5 text-body text-dim">
    <span class="size-1.5 shrink-0 rounded-full bg-faint" aria-hidden="true" />
    {{ locked }}
  </p>
</template>
