<script setup lang="ts">
/**
 * «Pedir un artículo a Eros»: tema y obra, los dos opcionales (desde una tendencia, el tema es la
 * tendencia y solo se elige la obra). Al pedirlo el diálogo pasa a mostrar que Eros está escribiendo,
 * con el tiempo que lleva; se puede cerrar y el pedido sigue (runs.ts avisa al terminar). Si lo
 * publica, lleva a su editor; si falla, dice por qué y deja probar de nuevo.
 */
import type { ArticleRunView } from '@shared/articleRunContracts'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { FieldErrors } from '../../api/errors'
import { options } from '../../stores/meta'
import { toast } from '../../stores/toasts'
import Button from '../../ui/Button.vue'
import Dialog from '../../ui/Dialog.vue'
import Field from '../../ui/Field.vue'
import type { SelectOption } from '../../ui/field'
import Select from '../../ui/Select.vue'
import Spinner from '../../ui/Spinner.vue'
import TextInput from '../../ui/TextInput.vue'
import { announce } from '../../ui/announce'
import { failureText } from '../hunter/adapter'
import { asked as t } from './dict'
import { askArticle, editorPath, loadRuns, tracked, watching } from './runs'

const props = defineProps<{
  /** Desde una tendencia: su id y su título (el tema es la tendencia). */
  trend?: { id: string, title: string } | null
}>()

const open = defineModel<boolean>('open', { default: false })
const router = useRouter()

const fromTrend = computed(() => !!props.trend)
const form = reactive({ topic: '', project: '' })
const pending = ref(false)
const errors = ref<Record<string, string>>({})
/** El pedido que este diálogo hizo (o el que encontró escribiendo al abrirse). */
const mine = ref<number | null>(null)

const run = computed<ArticleRunView | null>(() => (mine.value !== null && tracked.value?.id === mine.value ? tracked.value : null))
const phase = computed<'form' | 'writing' | 'failed'>(() => {
  if (run.value?.status === 'running') return 'writing'
  if (run.value?.status === 'failed') return 'failed'
  return 'form'
})

const projectOptions = computed<SelectOption<string>[]>(() => [
  { value: '', label: t.projectNone },
  ...(options.value?.projects ?? []).map(p => ({ value: p.slug, label: p.title })),
])

/* ── El tiempo que lleva ────────────────────────────────── */

const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | null = null
const elapsed = computed(() => {
  const started = run.value ? Date.parse(run.value.startedAt) : Number.NaN
  return Number.isNaN(started) ? 0 : Math.max(0, Math.floor((now.value - started) / 1000))
})

function tick(on: boolean): void {
  if (clock) clearInterval(clock)
  clock = on ? setInterval(() => { now.value = Date.now() }, 1000) : null
  now.value = Date.now()
}

watch(phase, (value) => {
  tick(open.value && value === 'writing')
  if (open.value && value === 'writing') announce(t.writing)
})
onBeforeUnmount(() => {
  tick(false)
  watching.value = false
})

/* ── Abrir, pedir y terminar ────────────────────────────── */

watch(open, (value) => {
  watching.value = value
  if (value) {
    errors.value = {}
    // Si ya hay uno escribiendo desde esta pestaña, se muestra ese en lugar del formulario.
    if (tracked.value?.status === 'running') mine.value = tracked.value.id
    else if (phase.value !== 'failed') {
      mine.value = null
      Object.assign(form, { topic: '', project: '' })
    }
  }
  tick(value && phase.value === 'writing')
}, { immediate: true })

watch(() => run.value?.status, (status) => {
  if (status !== 'done' || !open.value || !run.value) return
  const path = editorPath(run.value)
  open.value = false
  void router.push({ path, query: { origen: 'eros' } })
})

async function submit(): Promise<void> {
  if (pending.value) return
  pending.value = true
  errors.value = {}
  try {
    const started = await askArticle({
      topic: fromTrend.value ? null : form.topic.trim() || null,
      projectSlug: form.project || null,
      trendId: props.trend?.id ?? null,
    })
    mine.value = started.id
  }
  catch (err) {
    if (err instanceof FieldErrors) {
      errors.value = Object.fromEntries(err.issues.map(issue => [issue.path, issue.message]))
      return
    }
    toast(failureText(err, t.failedRequest), { tone: 'error' })
    // El servidor anota también el pedido que Eros no tomó: la línea de Artículos lo muestra.
    void loadRuns()
  }
  finally {
    pending.value = false
  }
}

function retry(): void {
  mine.value = null
}

/** Lo escrito en el formulario: tocar el fondo no lo pierde. */
const dirty = computed(() => phase.value === 'form' && !!(form.topic.trim() || form.project))
const dialogTitle = computed(() => (fromTrend.value ? t.trendTitle : t.title))
const description = computed(() => (props.trend ? t.trendDescription(props.trend.title) : t.description))
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="dialogTitle"
    :description="description"
    :dismissible="!pending && !dirty"
    :locked="pending"
    :initial-focus="phase === 'form' ? (fromTrend ? '[data-ask=\'project\'] select' : '[data-ask=\'topic\'] input') : undefined"
  >
    <form v-if="phase === 'form'" id="pedir-articulo" class="grid gap-8.5" novalidate :aria-busy="pending || undefined" @submit.prevent="submit">
      <Field v-if="!fromTrend" :label="t.topic" :hint="t.topicHint" :error="errors['topic'] ?? null" data-ask="topic">
        <template #aux>
          {{ t.optional }}
        </template>
        <TextInput v-model="form.topic" autocomplete="off" :readonly="pending" />
      </Field>
      <Field :label="t.project" :hint="t.projectHint" :error="errors['projectSlug'] ?? errors['trendId'] ?? null" data-ask="project">
        <template #aux>
          {{ t.optional }}
        </template>
        <Select v-model="form.project" :options="projectOptions" :placeholder="false" :disabled="pending" />
      </Field>
    </form>

    <div v-else-if="phase === 'writing'" class="grid gap-3" data-ask="writing">
      <p class="m-0 flex items-center gap-3 text-row text-ink" role="status">
        <Spinner :live="false" label="" />
        {{ t.writing }}
      </p>
      <p class="m-0 text-body text-dim tabular-nums">
        {{ t.elapsed(elapsed) }}
      </p>
      <p class="m-0 max-w-[60ch] text-body text-dim">
        {{ t.writingHint }}
      </p>
    </div>

    <div v-else class="grid gap-3" role="alert" data-ask="failed">
      <p class="m-0 flex items-center gap-2.5 text-row text-ink">
        <span class="size-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
        {{ t.failedTitle }}
      </p>
      <p class="m-0 max-w-[60ch] text-body text-dim">
        {{ run?.error ?? t.failedFallback }}
      </p>
    </div>

    <template #footer>
      <template v-if="phase === 'form'">
        <Button variant="ghost" :disabled="pending" @click="open = false">
          {{ t.cancel }}
        </Button>
        <Button variant="primary" type="submit" form="pedir-articulo" :loading="pending" :loading-label="t.sending">
          {{ fromTrend ? t.submitTrend : t.submit }}
        </Button>
      </template>
      <Button v-else-if="phase === 'writing'" variant="secondary" @click="open = false">
        {{ t.background }}
      </Button>
      <template v-else>
        <Button variant="ghost" @click="open = false">
          {{ t.close }}
        </Button>
        <Button variant="primary" @click="retry">
          {{ t.retry }}
        </Button>
      </template>
    </template>
  </Dialog>
</template>
