<script setup lang="ts">
/**
 * Las métricas de la obra, en el orden del caso: cada una tipada (MetricItem), sin JSON a mano. Se
 * ordenan arrastrando o con Subir y Bajar; quitar una se puede deshacer desde el aviso. «Ver JSON»
 * muestra, de solo lectura, lo que viaja al guardar.
 */
import { computed, nextTick } from 'vue'
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

    <ol v-if="form.metrics.length" class="m-0 grid list-none border-t border-rule p-0">
      <li
        v-for="(metric, index) in form.metrics"
        :key="keyOf(metric)"
        :data-metric-key="keyOf(metric)"
        class="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-b border-rule transition-[background-color,opacity] duration-200 ease-e"
        :class="[
          drag.over.value === index && drag.dragging.value !== index ? 'bg-surface' : '',
          drag.dragging.value === index ? 'opacity-45' : '',
        ]"
        v-bind="drag.row(index)"
      >
        <span
          v-bind="drag.handle(index)"
          class="mt-5 grid size-7 cursor-grab place-items-center rounded-control text-faint transition-colors duration-120 ease-e hover:bg-surface hover:text-ink active:cursor-grabbing"
          aria-hidden="true"
        >
          <Icon name="drag" :size="16" />
        </span>
        <MetricItem
          :index="index"
          :total="form.metrics.length"
          :locked="locked"
          @up="move(index, index - 1, 'up')"
          @down="move(index, index + 1, 'down')"
          @remove="remove(index)"
        />
      </li>
    </ol>
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
