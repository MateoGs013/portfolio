<script setup lang="ts">
/**
 * Pedir confirmación antes de algo que importa. Si es destructivo, Cancelar va primero y tiene el
 * foco: Enter por inercia nunca borra. La lista de impacto dice qué se ve afectado, en palabras.
 */
import Button from './Button.vue'
import Dialog from './Dialog.vue'
import { ui } from './dict'

const props = withDefaults(defineProps<{
  title: string
  message?: string
  impact?: string[]
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
}>(), { impact: () => [], cancelLabel: ui.actions.cancel, destructive: false, loading: false })

const open = defineModel<boolean>('open', { default: false })
/** `closed` llega siempre, cuando el diálogo terminó de cerrarse y el foco ya volvió. */
const emit = defineEmits<{ confirm: [], cancel: [], closed: [] }>()

function cancel(): void {
  open.value = false
}

/** Cerrar de cualquier forma (Esc, cruz, fondo, Cancelar) cuenta como cancelar. */
let confirmed = false
function confirm(): void {
  confirmed = true
  emit('confirm')
}
function onClose(): void {
  if (!confirmed) emit('cancel')
  confirmed = false
  emit('closed')
}

const initialFocus = props.destructive ? '[data-confirm-cancel]' : '[data-confirm-ok]'
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="title"
    size="sm"
    :initial-focus="initialFocus"
    :dismissible="!loading"
    @close="onClose"
  >
    <div class="grid gap-4">
      <p v-if="message" class="m-0 text-body text-dim">
        {{ message }}
      </p>
      <div v-if="impact.length" class="grid gap-2">
        <p class="m-0 text-label text-dim">
          {{ ui.confirm.impactTitle }}
        </p>
        <ul class="m-0 grid list-none gap-1.5 p-0">
          <li v-for="line in impact" :key="line" class="flex items-baseline gap-2.5 text-body text-ink">
            <span class="size-1.5 shrink-0 translate-y-[-1px] rounded-full bg-faint" aria-hidden="true" />
            {{ line }}
          </li>
        </ul>
      </div>
      <p v-if="destructive" class="m-0 text-label text-faint">
        {{ ui.confirm.destructiveHint }}
      </p>
    </div>
    <template #footer>
      <Button variant="ghost" data-confirm-cancel :disabled="loading" @click="cancel">
        {{ cancelLabel }}
      </Button>
      <Button
        :variant="destructive ? 'danger' : 'primary'"
        data-confirm-ok
        :loading="loading"
        :class="destructive ? 'border-danger/40' : ''"
        @click="confirm"
      >
        {{ confirmLabel }}
      </Button>
    </template>
  </Dialog>
</template>
