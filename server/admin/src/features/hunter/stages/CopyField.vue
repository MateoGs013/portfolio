<script setup lang="ts">
/**
 * Un texto del mensaje, editable, con su botón de copiar: la confirmación está en el mismo botón
 * («Copiado» durante dos segundos) y además se anuncia. Si el portapapeles no responde, lo dice.
 */
import { useClipboard } from '../../../composables/useClipboard'
import { toast } from '../../../stores/toasts'
import Button from '../../../ui/Button.vue'
import { ui } from '../../../ui/dict'
import Field from '../../../ui/Field.vue'
import TextArea from '../../../ui/TextArea.vue'
import TextInput from '../../../ui/TextInput.vue'

withDefaults(defineProps<{
  label: string
  /** Rótulo completo del botón para el lector («Copiar asunto»). */
  copyLabel: string
  hint?: string
  multiline?: boolean
  max?: number
}>(), { multiline: true })

const model = defineModel<string>({ default: '' })
const { copy, copied } = useClipboard()

async function onCopy(): Promise<void> {
  const result = await copy(model.value)
  if (result === 'ok') toast(ui.copy.ok, { tone: 'info', duration: 2000 })
  else toast(ui.copy.error, { tone: 'error' })
}

</script>

<template>
  <Field :label="label" :hint="hint" :count="max ? model.length : undefined" :max="max">
    <template #aux>
      <Button variant="ghost" class="-my-2 -mr-3" :aria-label="copied ? ui.actions.copied : copyLabel" icon="copy" @click="onCopy">
        {{ copied ? ui.actions.copied : ui.actions.copy }}
      </Button>
    </template>
    <TextArea v-if="multiline" v-model="model" :rows="3" />
    <TextInput v-else v-model="model" />
  </Field>
</template>
