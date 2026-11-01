<script setup lang="ts">
/**
 * La sesión venció a mitad del trabajo: se pide la clave encima de lo que estaba, sin desmontarlo.
 * Con la clave buena se cierra y los pedidos que esperaban se repiten solos. «Ahora no» cierra y deja
 * todo como estaba: lo que se intentaba guardar falla con su aviso y se puede volver a probar.
 */
import { computed, ref, watch } from 'vue'
import { reauth, reenter, settleReauth } from '../stores/session'
import { toast } from '../stores/toasts'
import Button from '../ui/Button.vue'
import Dialog from '../ui/Dialog.vue'
import { shell } from './dict'
import KeyField from './KeyField.vue'

const key = ref('')
const error = ref<string | null>(null)
const pending = ref(false)
const field = ref<InstanceType<typeof KeyField> | null>(null)
const formId = 'reauth-form'

const open = computed({
  get: () => reauth.open,
  set: (value: boolean) => {
    if (!value && reauth.open) settleReauth(false)
  },
})

watch(() => reauth.open, (isOpen) => {
  if (!isOpen) return
  key.value = ''
  error.value = null
})

async function submit(): Promise<void> {
  if (pending.value) return
  if (!key.value.trim()) {
    error.value = shell.login.empty
    field.value?.focus()
    return
  }
  pending.value = true
  error.value = null
  const result = await reenter(key.value)
  pending.value = false
  if (result.ok) {
    toast(shell.reauth.done)
    return
  }
  error.value = result.message
  field.value?.select()
}
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="shell.reauth.title"
    :description="shell.reauth.text"
    size="sm"
    :dismissible="false"
    :close-button="false"
    :locked="pending"
    initial-focus="[data-key-input]"
  >
    <form v-if="reauth.open" :id="formId" novalidate @submit.prevent="submit">
      <KeyField ref="field" v-model="key" :error="error" :disabled="pending" />
    </form>
    <template #footer>
      <Button variant="ghost" :disabled="pending" @click="open = false">
        {{ shell.reauth.cancel }}
      </Button>
      <Button type="submit" variant="primary" :form="formId" :loading="pending" :loading-label="shell.login.checking">
        {{ shell.reauth.submit }}
      </Button>
    </template>
  </Dialog>
</template>
