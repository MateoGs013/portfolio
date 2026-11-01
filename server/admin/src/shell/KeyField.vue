<script setup lang="ts">
/**
 * La clave de acceso: campo liviano con «Mostrar clave» (aria-pressed) al lado y el error en el lugar.
 * Lo usan el ingreso y la reautenticación.
 */
import { ref } from 'vue'
import Field from '../ui/Field.vue'
import IconButton from '../ui/IconButton.vue'
import TextInput from '../ui/TextInput.vue'
import { shell } from './dict'

withDefaults(defineProps<{
  error?: string | null
  disabled?: boolean
}>(), { error: null, disabled: false })

const model = defineModel<string>({ default: '' })
const visible = ref(false)
const input = ref<InstanceType<typeof TextInput> | null>(null)

defineExpose({ focus: () => input.value?.focus(), select: () => input.value?.select() })
</script>

<template>
  <Field :label="shell.login.key" :error="error">
    <div class="flex items-end gap-2">
      <TextInput
        ref="input"
        v-model="model"
        :type="visible ? 'text' : 'password'"
        autocomplete="current-password"
        :disabled="disabled"
        class="flex-1"
        data-key-input
      />
      <IconButton
        :icon="visible ? 'eye-off' : 'eye'"
        :label="shell.login.show"
        :pressed="visible"
        :disabled="disabled"
        class="mb-1"
        @click="visible = !visible"
      />
    </div>
  </Field>
</template>
