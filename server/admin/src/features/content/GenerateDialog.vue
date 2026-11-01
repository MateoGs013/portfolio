<script setup lang="ts">
/**
 * Pedirle una publicación a Eros: el tema (o, desde una tendencia, la tendencia misma), el enfoque,
 * la obra de la base de la que habla, los puntos clave y un ángulo propio. Solo con Eros arriba.
 * Mientras escribe (puede tardar un minuto) el diálogo queda trabado y lo dice; si el servidor marca
 * un campo, el error va debajo de ese campo.
 */
import { postPillarLabels, postPillars, type ContentPost, type GenerateRequest } from '@shared/contentContracts'
import { computed, reactive, ref, watch } from 'vue'
import { FieldErrors } from '../../api/errors'
import { options } from '../../stores/meta'
import { toast } from '../../stores/toasts'
import Button from '../../ui/Button.vue'
import Dialog from '../../ui/Dialog.vue'
import Field from '../../ui/Field.vue'
import type { SelectOption } from '../../ui/field'
import Select from '../../ui/Select.vue'
import TextArea from '../../ui/TextArea.vue'
import TextInput from '../../ui/TextInput.vue'
import { failureText } from '../hunter/adapter'
import { generator as t } from './dict'

const props = defineProps<{
  /** Desde una tendencia: su título (el tema es la tendencia). Sin ella, se pide el tema. */
  trendTitle?: string | null
  /** El pedido a Eros: devuelve la publicación escrita (o null si Eros no la mandó). */
  run: (request: GenerateRequest) => Promise<ContentPost | null>
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ created: [post: ContentPost | null] }>()

const fromTrend = computed(() => !!props.trendTitle)
const blank = () => ({ topic: '', pillar: '' as string, project: '' as string, keyPoints: '', angle: '' })
const form = reactive(blank())
const tried = ref(false)
const pending = ref(false)
const serverErrors = ref<Record<string, string>>({})

watch(open, (value) => {
  if (!value) return
  Object.assign(form, blank())
  tried.value = false
  serverErrors.value = {}
})

const pillarOptions = computed<SelectOption<string>[]>(() => [
  { value: '', label: t.pillarAny },
  ...postPillars.map(value => ({ value, label: postPillarLabels[value] })),
])
const projectOptions = computed<SelectOption<string>[]>(() => [
  { value: '', label: t.projectNone },
  ...(options.value?.projects ?? []).map(p => ({ value: p.slug, label: p.title })),
])

const missing = computed(() => !fromTrend.value && !form.topic.trim() && !form.angle.trim())
const errorOf = (key: 'topic' | 'pillar' | 'project_slug' | 'key_points' | 'custom_angle') =>
  serverErrors.value[key] ?? (key === 'topic' && tried.value && missing.value ? t.missing : null)

const dirty = computed(() => Object.values(form).some(value => value.trim()))

function request(): GenerateRequest {
  const angle = form.angle.trim() || null
  return {
    topic: form.topic.trim() || angle || '',
    custom_angle: angle,
    pillar: postPillars.find(p => p === form.pillar) ?? null,
    project_slug: form.project || null,
    key_points: form.keyPoints.split('\n').map(line => line.replace(/^\s*[-*•]\s*/, '').trim()).filter(Boolean).slice(0, 8),
  }
}

async function submit(): Promise<void> {
  if (pending.value) return
  tried.value = true
  serverErrors.value = {}
  if (missing.value) {
    document.querySelector<HTMLElement>('[data-generate="topic"] input')?.focus()
    return
  }
  pending.value = true
  try {
    const post = await props.run(request())
    open.value = false
    toast(fromTrend.value ? t.trend.done : t.done)
    emit('created', post)
  }
  catch (err) {
    if (err instanceof FieldErrors) {
      serverErrors.value = Object.fromEntries(err.issues.map(issue => [issue.path, issue.message]))
      return
    }
    toast(failureText(err, fromTrend.value ? t.trend.failed : t.failed), { tone: 'error' })
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="fromTrend ? t.trend.title : t.title"
    :description="fromTrend ? t.trend.description(trendTitle ?? '') : t.description"
    size="lg"
    :dismissible="!dirty && !pending"
    :locked="pending"
    :initial-focus="fromTrend ? '[data-generate=\'pillar\'] select' : '[data-generate=\'topic\'] input'"
  >
    <form id="generar-publicacion" class="grid gap-8.5" novalidate :aria-busy="pending || undefined" @submit.prevent="submit">
      <Field v-if="!fromTrend" :label="t.topic" :hint="t.topicHint" :error="errorOf('topic')" data-generate="topic">
        <TextInput v-model="form.topic" autocomplete="off" :readonly="pending" />
      </Field>
      <div class="grid gap-8.5 sm:grid-cols-2">
        <Field :label="t.pillar" :error="errorOf('pillar')" data-generate="pillar">
          <Select v-model="form.pillar" :options="pillarOptions" :placeholder="false" :disabled="pending" />
        </Field>
        <Field :label="t.project" :hint="t.projectHint" :error="errorOf('project_slug')" data-generate="project">
          <Select v-model="form.project" :options="projectOptions" :placeholder="false" :disabled="pending" />
        </Field>
      </div>
      <Field :label="t.keyPoints" :hint="t.keyPointsHint" :error="errorOf('key_points')" data-generate="key_points">
        <template #aux>
          {{ t.optional }}
        </template>
        <TextArea v-model="form.keyPoints" :rows="3" :max-rows="8" :readonly="pending" />
      </Field>
      <Field :label="t.angle" :hint="t.angleHint" :error="errorOf('custom_angle')" data-generate="custom_angle">
        <template #aux>
          {{ t.optional }}
        </template>
        <TextArea v-model="form.angle" :rows="2" :max-rows="6" :readonly="pending" />
      </Field>
    </form>
    <template #footer>
      <p class="m-0 mr-auto text-label text-dim" role="status">
        {{ pending ? t.wait : '' }}
      </p>
      <Button variant="ghost" :disabled="pending" @click="open = false">
        {{ t.cancel }}
      </Button>
      <Button variant="primary" type="submit" form="generar-publicacion" :loading="pending" :loading-label="t.running">
        {{ fromTrend ? t.trend.run : t.run }}
      </Button>
    </template>
  </Dialog>
</template>
