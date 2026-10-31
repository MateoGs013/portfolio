<script setup lang="ts">
/** Muestra la confirmación pedida con requestConfirm (stores/dialogs.ts). Se monta una vez, en App. */
import { computed, ref, watch } from 'vue'
import { confirmState, settleConfirm } from '../stores/dialogs'
import ConfirmDialog from './ConfirmDialog.vue'

const open = ref(false)
const current = computed(() => confirmState.current)
let answer = false

watch(current, (value) => {
  answer = false
  open.value = !!value
}, { immediate: true })

function onConfirm(): void {
  answer = true
  open.value = false
}

/** Se resuelve cuando el diálogo terminó de cerrarse, así el foco ya volvió a su lugar. */
function onDone(): void {
  settleConfirm(answer)
}
</script>

<template>
  <ConfirmDialog
    v-if="current"
    :key="current.id"
    v-model:open="open"
    :title="current.title"
    :message="current.message"
    :impact="current.impact ? [...current.impact] : []"
    :confirm-label="current.confirmLabel"
    :cancel-label="current.cancelLabel"
    :destructive="current.destructive"
    @confirm="onConfirm"
    @closed="onDone"
  />
</template>
