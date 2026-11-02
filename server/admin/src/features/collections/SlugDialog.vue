<script setup lang="ts">
/**
 * «Cambiar dirección»: explica que los enlaces compartidos dejan de andar (no hay redirección), pide la
 * dirección nueva con la vista de cómo queda en la URL y hace PATCH /:colección/:id/slug. El registro
 * que devuelve el servidor es la verdad: el editor actualiza solo la dirección y conserva lo demás.
 */
import { computed, ref, watch } from 'vue'
import { api } from '../../api/client'
import { FieldErrors, messageOf } from '../../api/errors'
import { isSlug, slugify } from '../../models/slug'
import { toast } from '../../stores/toasts'
import Button from '../../ui/Button.vue'
import Dialog from '../../ui/Dialog.vue'
import { ui } from '../../ui/dict'
import Field from '../../ui/Field.vue'
import Mono from '../../ui/Mono.vue'
import TextInput from '../../ui/TextInput.vue'
import { collections } from './dict'

const props = defineProps<{
  current: string
  endpoint: string
  preview: (slug: string) => string | null
}>()

const emit = defineEmits<{ changed: [record: unknown] }>()
const open = defineModel<boolean>('open', { default: false })

const t = collections.slug
const next = ref(props.current)
const sending = ref(false)
const problem = ref('')
const tried = ref(false)

watch(open, (value) => {
  if (!value) return
  next.value = props.current
  problem.value = ''
  tried.value = false
})

const cleaned = computed(() => next.value.trim())
const localError = computed(() => {
  if (!tried.value) return ''
  if (!isSlug(cleaned.value)) return t.invalid
  if (cleaned.value === props.current) return t.same
  return ''
})
const error = computed(() => localError.value || problem.value || null)

async function change(): Promise<void> {
  if (sending.value) return
  tried.value = true
  problem.value = ''
  if (localError.value) return
  sending.value = true
  try {
    const record = await api.patch<unknown>(props.endpoint, { slug: cleaned.value })
    toast(t.changed(cleaned.value))
    open.value = false
    emit('changed', record)
  }
  catch (err) {
    problem.value = err instanceof FieldErrors ? (err.issues[0]?.message ?? err.message) : messageOf(err)
  }
  finally {
    sending.value = false
  }
}

/** Escribir con espacios o mayúsculas no es un error: se propone la versión limpia. */
function tidy(): void {
  const clean = slugify(next.value)
  if (clean && clean !== next.value) next.value = clean
}
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="t.change"
    :description="t.dialogText"
    initial-focus="[data-slug-next] input"
    :dismissible="false"
    :locked="sending"
  >
    <div class="grid gap-6">
      <div class="grid gap-1.5">
        <p class="m-0 text-label text-dim">
          {{ t.current }}
        </p>
        <Mono size="label" class="text-dim">
          {{ preview(current) ?? current }}
        </Mono>
      </div>
      <Field data-slug-next :label="t.next" :hint="t.nextHint" :error="error">
        <TextInput v-model="next" mono autocomplete="off" :readonly="sending" @blur="tidy" @keydown.enter.prevent="change" />
      </Field>
      <p v-if="preview(cleaned || '…') !== null" class="m-0 flex flex-wrap items-baseline gap-x-2 text-label text-faint">
        {{ collections.slug.preview }}
        <Mono>{{ preview(cleaned || '…') }}</Mono>
      </p>
    </div>
    <template #footer>
      <Button :disabled="sending" @click="open = false">
        {{ ui.actions.cancel }}
      </Button>
      <Button variant="primary" :loading="sending" :loading-label="t.confirm" @click="change">
        {{ t.confirm }}
      </Button>
    </template>
  </Dialog>
</template>
