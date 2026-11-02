<script setup lang="ts">
/**
 * Las métricas de la obra, en el orden del caso, como una tabla compacta (qué se mide, valor, fuente y
 * fecha) que se abre fila por fila para editar: cada una tipada (MetricItem), sin JSON a mano. Se
 * ordenan arrastrando o con Subir y Bajar; quitar una se puede deshacer desde el aviso. «Ver JSON»
 * muestra, de solo lectura, lo que viaja al guardar.
 */
import { computed, nextTick, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from '../../../stores/toasts'
import { announce } from '../../../ui/announce'
import Button from '../../../ui/Button.vue'
import Icon from '../../../ui/Icon.vue'
import { monoClass } from '../../../ui/Mono.vue'
import { useEditorContext } from '../../collections/context'
import { useProject } from '../context'
import { keyer, moveItem, useDragSort } from '../reorder'
import type { MetricForm } from '../types'
import { dataText } from './dict'
import { blankMetric, metricPayload } from './metricForm'
import MetricItem from './MetricItem.vue'

const t = dataText.metrics
const { form, record } = useProject()
const editor = useEditorContext()
const locked = computed(() => editor?.busy.value ?? false)
const keyOf = keyer<MetricForm>('metrica')

/** Las que se abrieron a mano; las nuevas y las que tienen un error se abren solas. */
const opened = reactive(new Set<string>())
const METRIC_FIELDS = ['key', 'label', 'value', 'unit', 'items', 'source', 'measuredAt', 'translations.en.label']
const hasIssue = (index: number) => !!editor && METRIC_FIELDS.some(f => editor.messageFor(`metrics[${index}].${f}`))
const pinned = (index: number) => form.value.metrics[index]?.id === null || hasIssue(index)
function isOpen(index: number): boolean {
  const metric = form.value.metrics[index]
  return !!metric && (pinned(index) || opened.has(keyOf(metric)))
}

function open(index: number): void {
  const metric = form.value.metrics[index]
  if (!metric) return
  opened.add(keyOf(metric))
  void focusIn(metric, 'select')
}

function close(index: number): void {
  const metric = form.value.metrics[index]
  if (!metric) return
  opened.delete(keyOf(metric))
  void focusIn(metric, '[data-move="open"]')
}

// ?campo=metrics[2].source abre esa fila antes de que el editor busque el campo.
const route = useRoute()
watch(() => [route.query['campo'], form.value.metrics.length] as const, ([campo]) => {
  const at = typeof campo === 'string' ? /^metrics\[(\d+)\]/.exec(campo) : null
  const metric = at ? form.value.metrics[Number(at[1])] : undefined
  if (metric) opened.add(keyOf(metric))
}, { immediate: true })

const json = computed(() => JSON.stringify(form.value.metrics.map(metricPayload), null, 2))

async function focusIn(metric: MetricForm | undefined, selector: string): Promise<void> {
  await nextTick()
  if (!metric) return document.querySelector<HTMLElement>('[data-metric-add]')?.focus()
  const root = document.querySelector<HTMLElement>(`[data-metric-key="${keyOf(metric)}"]`)
  const target = root?.querySelector<HTMLButtonElement>(selector)
  if (target && !target.disabled) target.focus()
  else root?.querySelector<HTMLElement>('[data-move]:not(:disabled)')?.focus()
}

function move(from: number, to: number, focus?: 'up' | 'down'): void {
  const metric = form.value.metrics[from]
  if (!metric || locked.value) return
  moveItem(form.value.metrics, from, to)
  announce(t.moved(to + 1, form.value.metrics.length))
  if (focus) void focusIn(metric, `[data-move="${focus}"]`)
}

function add(): void {
  form.value.metrics.push(blankMetric())
  void focusIn(form.value.metrics.at(-1), 'select')
}

function remove(index: number): void {
  const metric = form.value.metrics[index]
  if (!metric || locked.value) return
  form.value.metrics.splice(index, 1)
  const owner = record.value?.id ?? null
  toast(t.removed(index + 1), {
    tone: 'info',
    action: {
      label: t.undo,
      run: () => {
        if ((record.value?.id ?? null) !== owner) return
        form.value.metrics.splice(Math.min(index, form.value.metrics.length), 0, metric)
        void focusIn(metric, 'select')
      },
    },
  })
  void focusIn(form.value.metrics[Math.min(index, form.value.metrics.length - 1)], '[data-move="remove"]')
}

const drag = useDragSort((from, to) => move(from, to), () => !locked.value)
</script>

<template>
  <section class="grid gap-7 border-t border-rule pt-8.5" data-field="metrics" aria-labelledby="metricas-titulo">
    <div class="grid gap-1.5">
      <h2 id="metricas-titulo" class="m-0 text-title">
        {{ t.title }}
      </h2>
      <p class="m-0 max-w-[60ch] text-body text-dim">
        {{ t.text }}
      </p>
    </div>

    <div v-if="form.metrics.length" class="grid">
      <div class="hidden grid-cols-[auto_minmax(0,1fr)] gap-3 border-b border-rule pb-2 sm:grid" aria-hidden="true">
        <span class="w-7" />
        <span class="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.7fr)] gap-x-4 pr-26 pl-1 text-label text-faint">
          <span>{{ t.columns.key }}</span>
          <span>{{ t.columns.value }}</span>
          <span>{{ t.columns.source }}</span>
          <span>{{ t.columns.measuredAt }}</span>
        </span>
      </div>
      <ol class="m-0 grid list-none border-t border-rule p-0 sm:border-t-0">
        <li
          v-for="(metric, index) in form.metrics"
          :key="keyOf(metric)"
          :data-metric-key="keyOf(metric)"
          class="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-b border-rule transition-[background-color,opacity] duration-200 ease-e"
          :class="[
            drag.over.value === index && drag.dragging.value !== index ? 'bg-surface' : '',
            drag.dragging.value === index ? 'opacity-45' : '',
          ]"
          v-bind="drag.row(index)"
        >
          <span
            v-bind="drag.handle(index)"
            class="mt-2.5 grid size-7 cursor-grab place-items-center rounded-control text-faint transition-colors duration-120 ease-e hover:bg-surface hover:text-ink active:cursor-grabbing"
            aria-hidden="true"
          >
            <Icon name="drag" :size="16" />
          </span>
          <MetricItem
            :index="index"
            :total="form.metrics.length"
            :locked="locked"
            :open="isOpen(index)"
            :closable="isOpen(index) && !pinned(index)"
            @open="open(index)"
            @close="close(index)"
            @up="move(index, index - 1, 'up')"
            @down="move(index, index + 1, 'down')"
            @remove="remove(index)"
          />
        </li>
      </ol>
    </div>
    <p v-else class="m-0 text-label text-faint">
      {{ t.empty }}
    </p>

    <div class="flex flex-wrap items-start gap-x-6 gap-y-4">
      <Button icon="plus" data-metric-add :disabled="locked" @click="add">
        {{ t.add }}
      </Button>
      <details v-if="form.metrics.length" class="group min-w-0 flex-1">
        <summary class="inline-flex h-8 cursor-pointer list-none items-center gap-2 rounded-control px-1 text-body text-dim transition-colors duration-120 ease-e hover:text-ink">
          <Icon name="chevron-down" :size="14" class="transition-transform duration-200 ease-e group-open:rotate-180" />
          {{ t.json }}
        </summary>
        <p class="m-0 mt-2 text-label text-faint">
          {{ t.jsonHint }}
        </p>
        <pre
          :class="monoClass.meta"
          class="m-0 mt-3 max-h-96 overflow-auto rounded-control border border-rule bg-panel p-4 whitespace-pre text-dim"
          tabindex="0"
        >{{ json }}</pre>
      </details>
    </div>
  </section>
</template>
