<script setup lang="ts">
/**
 * Un texto de la publicación tal como lo escribió Eros, para leer y copiar: su rótulo, el botón
 * Copiar (la confirmación queda en el mismo botón dos segundos y se anuncia), la cuenta de caracteres
 * y el texto con sus saltos de línea. No se edita: Eros no tiene dónde guardar un retoque.
 */
import { computed } from 'vue'
import { useClipboard } from '../../composables/useClipboard'
import { toast } from '../../stores/toasts'
import Button from '../../ui/Button.vue'
import { ui } from '../../ui/dict'
import { monoClass } from '../../ui/Mono.vue'
import { post as t } from './dict'

const props = withDefaults(defineProps<{
  label: string
  /** Qué se copia, para el nombre del botón: «Copiar el texto de LinkedIn». */
  what: string
  text: string
  hint?: string
  /** Markdown o código: se lee en mono y en una medida más ancha. */
  code?: boolean
  /** Un renglón (un título): sin cuenta de caracteres. */
  short?: boolean
  /** Tope del formato (280 en X): la cuenta se pone en rojo al pasarse. */
  limit?: number
}>(), { code: false, short: false })

const { copy, copied } = useClipboard()

async function onCopy(): Promise<void> {
  const result = await copy(props.text)
  if (result === 'ok') toast(ui.copy.ok, { tone: 'info', duration: 2000 })
  else toast(ui.copy.error, { tone: 'error' })
}

const length = computed(() => [...props.text].length)
const over = computed(() => props.limit !== undefined && length.value > props.limit)
const count = computed(() => (props.limit !== undefined ? t.thread.limit(length.value) : t.chars(length.value)))
</script>

<template>
  <section class="grid gap-3" :class="code ? 'max-w-[820px]' : 'max-w-[680px]'">
    <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h3 class="m-0 text-label font-[420] text-dim">
        {{ label }}
      </h3>
      <div class="flex items-baseline gap-4">
        <span v-if="!short" class="text-meta tabular-nums" :class="over ? 'text-danger' : 'text-faint'">{{ count }}</span>
        <Button variant="ghost" class="-my-2 -mr-3" icon="copy" :aria-label="copied ? ui.actions.copied : t.copy(what)" @click="onCopy">
          {{ copied ? ui.actions.copied : ui.actions.copy }}
        </Button>
      </div>
    </div>
    <div
      class="border-b border-rule pb-4 whitespace-pre-wrap text-ink wrap-break-word"
      :class="code ? [monoClass.label, 'leading-[1.7]'] : short ? 'text-field' : 'text-prose'"
    >{{ text }}</div>
    <p v-if="over" class="m-0 text-label text-danger">
      {{ t.thread.over }}
    </p>
    <p v-else-if="hint" class="m-0 text-label text-faint">
      {{ hint }}
    </p>
  </section>
</template>
