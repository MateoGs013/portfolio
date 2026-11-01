<script setup lang="ts">
/**
 * Los pasos del proceso, en el orden en que se leen en el caso. Se ordenan arrastrando el asa o con
 * Subir y Bajar (el foco sigue al paso movido); quitar uno se puede deshacer desde el aviso y nada
 * cambia en la base hasta Guardar. El servidor los renumera 1..n por su posición.
 */
import { computed, nextTick } from 'vue'
import { enumLabel } from '../../../models/labels'
import { toast } from '../../../stores/toasts'
import { announce } from '../../../ui/announce'
import Button from '../../../ui/Button.vue'
import type { SelectOption } from '../../../ui/field'
import { useEditorContext } from '../../collections/context'
import { useProject } from '../context'
import { projectsText } from '../dict'
import { blankStep } from '../model'
import { keyer, moveItem, useDragSort } from '../reorder'
import type { StepForm } from '../types'
import StepItem from './StepItem.vue'

const t = projectsText.steps
const { form, record } = useProject()
const editor = useEditorContext()
const locked = computed(() => editor?.busy.value ?? false)
const keyOf = keyer<StepForm>('paso')

/** Las imágenes guardadas de la obra, rotuladas por su uso y su texto alternativo. */
const mediaOptions = computed<SelectOption<number>[]>(() => (record.value?.media ?? []).map((m, i) => ({
  value: m.id,
  label: `${enumLabel('MediaRole', m.role)} · ${m.alt.trim() || projectsText.media.untitled(i + 1)}`,
})))

async function focusIn(step: StepForm, selector: string): Promise<void> {
  await nextTick()
  const root = document.querySelector<HTMLElement>(`[data-step-key="${keyOf(step)}"]`)
  const target = root?.querySelector<HTMLElement>(selector)
  if (target && !(target as HTMLButtonElement).disabled) target.focus()
  else root?.querySelector<HTMLElement>('[data-move]:not(:disabled)')?.focus()
}

function move(from: number, to: number, focus?: 'up' | 'down'): void {
  const step = form.value.steps[from]
  if (!step || locked.value) return
  moveItem(form.value.steps, from, to)
  announce(t.moved(to + 1, form.value.steps.length))
  if (focus) void focusIn(step, `[data-move="${focus}"]`)
}

function remove(index: number): void {
  const step = form.value.steps[index]
  if (!step || locked.value) return
  form.value.steps.splice(index, 1)
  // El editor se reusa al pasar a otra obra: deshacer solo vale en la obra de la que se quitó.
  const owner = record.value?.id ?? null
  toast(t.removed(index + 1), {
    tone: 'info',
    action: {
      label: t.undo,
      run: () => {
        if ((record.value?.id ?? null) !== owner) return
        form.value.steps.splice(Math.min(index, form.value.steps.length), 0, step)
        void focusIn(step, 'input')
      },
    },
  })
  const next = form.value.steps[Math.min(index, form.value.steps.length - 1)]
  if (next) void focusIn(next, '[data-move]')
  else void nextTick(() => document.querySelector<HTMLElement>('[data-step-add]')?.focus())
}

function add(): void {
  form.value.steps.push(blankStep())
  announce(t.added)
  // El de la lista (reactivo), no el recién armado: la clave del v-for es la del que está en la lista.
  void focusIn(form.value.steps.at(-1)!, 'input')
}

const drag = useDragSort((from, to) => move(from, to), () => !locked.value)
</script>

<template>
  <section class="grid gap-7 border-t border-rule pt-8.5" data-field="steps" aria-labelledby="pasos-titulo">
    <div class="grid gap-1.5">
      <h2 id="pasos-titulo" class="m-0 text-title">
        {{ t.title }}
      </h2>
      <p class="m-0 max-w-[60ch] text-body text-dim">
        {{ form.steps.length ? t.text : t.empty }}
      </p>
    </div>

    <ol v-if="form.steps.length" class="m-0 grid list-none gap-0 border-t border-rule p-0">
      <li
        v-for="(step, index) in form.steps"
        :key="keyOf(step)"
        :data-step-key="keyOf(step)"
        class="border-b border-rule transition-[background-color,opacity] duration-200 ease-e"
        :class="[
          drag.over.value === index && drag.dragging.value !== index ? 'bg-surface' : '',
          drag.dragging.value === index ? 'opacity-45' : '',
        ]"
        v-bind="drag.row(index)"
      >
        <StepItem
          :index="index"
          :total="form.steps.length"
          :media="mediaOptions"
          :handle="drag.handle(index)"
          @up="move(index, index - 1, 'up')"
          @down="move(index, index + 1, 'down')"
          @remove="remove(index)"
        />
      </li>
    </ol>

    <div>
      <Button icon="plus" data-step-add :disabled="locked" @click="add">
        {{ t.add }}
      </Button>
    </div>
  </section>
</template>
