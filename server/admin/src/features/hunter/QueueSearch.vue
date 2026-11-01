<script setup lang="ts">
/**
 * Búsqueda de la cola. Por texto filtra mientras se escribe (título, empresa, etiquetas). Con
 * «Buscar por afinidad» prendido, Enter le pide a Eros las vacantes más afines a lo escrito
 * (POST /hunter/search/semantic); la afinidad se muestra aparte del porcentaje de compatibilidad.
 * Sin Eros el interruptor queda apagado y dice por qué.
 */
import { ref } from 'vue'
import { useId } from '../../composables/useId'
import Button from '../../ui/Button.vue'
import Icon from '../../ui/Icon.vue'
import Switch from '../../ui/Switch.vue'
import TextInput from '../../ui/TextInput.vue'
import { hunter } from './dict'

const props = defineProps<{
  /** Sin Eros: la afinidad no se puede pedir. */
  offline: boolean
  pending: boolean
  /** Hay resultados por afinidad a la vista. */
  showingResults: boolean
}>()

const emit = defineEmits<{ search: [], clear: [] }>()
const query = defineModel<string>('query', { default: '' })
const affinity = defineModel<boolean>('affinity', { default: false })

const inputId = useId('cola-buscar')
const input = ref<InstanceType<typeof TextInput> | null>(null)

function onEnter(event: KeyboardEvent): void {
  if (!affinity.value || props.offline || !query.value.trim()) return
  event.preventDefault()
  emit('search')
}

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div class="flex flex-wrap items-end gap-x-8 gap-y-4">
    <div class="relative flex min-w-[min(100%,280px)] flex-1 items-center gap-2.5 sm:max-w-[420px]" @keydown.enter="onEnter">
      <label :for="inputId" class="sr-only">{{ hunter.search.label }}</label>
      <Icon name="search" :size="16" class="text-faint" />
      <TextInput
        :id="inputId"
        ref="input"
        v-model="query"
        type="search"
        :placeholder="hunter.search.placeholder"
        autocomplete="off"
      />
    </div>
    <Switch
      v-model="affinity"
      :label="hunter.search.affinity"
      :hint="offline ? hunter.search.affinityOff : hunter.search.affinityHint"
      :disabled="offline"
    />
    <Button v-if="affinity && !offline" :loading="pending" :disabled="!query.trim()" :loading-label="hunter.search.run" @click="emit('search')">
      {{ hunter.search.run }}
    </Button>
    <Button v-if="showingResults" variant="ghost" @click="emit('clear')">
      {{ hunter.search.clear }}
    </Button>
  </div>
</template>
