<script setup lang="ts">
/**
 * «Publicar por n8n» con su confirmación: se elige el canal y el botón lo nombra («Publicar en
 * LinkedIn»), así nunca sale por un canal que no se leyó. El foco empieza en Cancelar (no se puede
 * deshacer desde acá) y el diálogo queda trabado mientras n8n despacha.
 */
import { publishChannelLabels, publishChannels, type ContentPost, type PublishChannel } from '@shared/contentContracts'
import { computed, ref, watch } from 'vue'
import { toast } from '../../stores/toasts'
import Button from '../../ui/Button.vue'
import Dialog from '../../ui/Dialog.vue'
import Field from '../../ui/Field.vue'
import RadioGroup from '../../ui/RadioGroup.vue'
import { failureText } from '../hunter/adapter'
import { post as t } from './dict'
import { postTitle } from './model'
import { dispatchPost } from './store'

const props = defineProps<{ post: ContentPost }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ published: [post: ContentPost] }>()

const channel = ref<PublishChannel | null>('linkedin')
const pending = ref(false)

watch(open, (value) => {
  if (value) channel.value = 'linkedin'
})

const options = publishChannels.map(value => ({ value, label: label(value), hint: t.publish.hints[value] }))
const confirmLabel = computed(() => t.publish.confirm(publishChannelLabels[channel.value ?? 'all']))

function label(value: PublishChannel): string {
  const text = publishChannelLabels[value]
  // «todos los canales» va en minúscula dentro de la frase; como opción, con mayúscula inicial.
  return value === 'all' ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

async function publish(): Promise<void> {
  if (pending.value || !channel.value) return
  const target = channel.value
  pending.value = true
  try {
    const next = await dispatchPost(props.post, target)
    open.value = false
    toast(t.publish.done(publishChannelLabels[target]))
    emit('published', next)
  }
  catch (err) {
    toast(failureText(err, t.publish.failed(publishChannelLabels[target])), { tone: 'error' })
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="t.publish.title"
    :description="t.publish.description"
    :locked="pending"
    :dismissible="!pending"
    initial-focus="[data-publish-cancel]"
  >
    <div class="grid gap-6">
      <p class="m-0 text-row text-ink">
        {{ postTitle(post) }}
      </p>
      <Field :label="t.publish.channel" group>
        <RadioGroup v-model="channel" :options="options" :label="t.publish.channel" variant="list" :disabled="pending" />
      </Field>
      <p class="m-0 text-label text-faint">
        {{ t.publish.warning }}
      </p>
    </div>
    <template #footer>
      <Button variant="ghost" data-publish-cancel :disabled="pending" @click="open = false">
        {{ t.publish.cancel }}
      </Button>
      <Button variant="primary" :loading="pending" :loading-label="t.publish.running" @click="publish">
        {{ confirmLabel }}
      </Button>
    </template>
  </Dialog>
</template>
