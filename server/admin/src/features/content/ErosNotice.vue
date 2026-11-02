<script setup lang="ts">
/**
 * Por qué una lista de Eros está vacía o en solo lectura, en palabras: Eros no respondió (con
 * Reintentar) o es la muestra de prueba. El párrafo con el motivo lleva `describedId`: es el que
 * describen los controles apagados (aria-describedby).
 */
import Button from '../../ui/Button.vue'
import { ui } from '../../ui/dict'

defineProps<{
  offline: boolean
  /** El texto de la muestra si la lista es la de prueba, o null. */
  sample: string | null
  title: string
  text: string
  describedId: string
  retrying: boolean
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <div v-if="offline" role="status" class="grid max-w-[68ch] animate-enter gap-2 border-t border-rule pt-5">
    <p class="m-0 flex items-center gap-2.5 text-row text-ink">
      <span class="size-1.5 shrink-0 rounded-full bg-wip" aria-hidden="true" />
      {{ title }}
    </p>
    <p :id="describedId" class="m-0 text-body text-dim">
      {{ text }}
    </p>
    <div class="mt-1">
      <Button variant="ghost" class="-ml-3" :loading="retrying" :loading-label="ui.states.loading" @click="$emit('retry')">
        {{ ui.actions.retry }}
      </Button>
    </div>
  </div>
  <p v-else-if="sample" :id="describedId" class="m-0 flex max-w-[68ch] items-center gap-2.5 border-t border-rule pt-5 text-body text-dim">
    <span class="size-1.5 shrink-0 rounded-full bg-faint" aria-hidden="true" />
    {{ sample }}
  </p>
</template>
