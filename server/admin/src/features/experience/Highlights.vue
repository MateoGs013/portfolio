<script setup lang="ts">
/**
 * Las viñetas del CV: hasta 3, de 160 caracteres, cada una con su inglés al lado en la misma posición.
 * Quitar una quita el par entero, así ninguna traducción se corre a la viñeta de al lado; editar el
 * inglés de la segunda no toca las demás. Cada lado lleva su ruta (`highlights[1]`,
 * `translations.en.highlights[1]`) para que los errores y ?campo= caigan en él.
 */
import { computed, nextTick, ref } from 'vue'
import { announce } from '../../ui/announce'
import Button from '../../ui/Button.vue'
import IconButton from '../../ui/IconButton.vue'
import BilingualField from '../collections/BilingualField.vue'
import { useEditorContext } from '../collections/context'
import { experience as t } from './dict'
import { BULLET_CHARS, BULLETS_MAX } from './record'

const es = defineModel<string[]>('es', { required: true })
const en = defineModel<string[]>('en', { required: true })

const editor = useEditorContext()
const locked = computed(() => editor?.busy.value ?? false)
const full = computed(() => es.value.length >= BULLETS_MAX)
const list = ref<HTMLElement | null>(null)

/** El inglés siempre con tantas posiciones como el español. */
function englishAt(i: number): string {
  return en.value[i] ?? ''
}

function setSpanish(i: number, value: string): void {
  es.value = es.value.map((item, at) => (at === i ? value : item))
}

function setEnglish(i: number, value: string): void {
  const next = es.value.map((_, at) => (at === i ? value : englishAt(at)))
  en.value = next
}

async function add(): Promise<void> {
  if (full.value) return
  es.value = [...es.value, '']
  en.value = [...es.value.map((_, at) => englishAt(at))]
  await nextTick()
  list.value?.querySelector<HTMLElement>(`[data-field="highlights[${es.value.length - 1}]"] textarea`)?.focus()
}

function remove(i: number): void {
  es.value = es.value.filter((_, at) => at !== i)
  en.value = en.value.filter((_, at) => at !== i)
  announce(t.bullets.removed(i + 1))
  void nextTick(() => list.value?.querySelector<HTMLElement>('textarea')?.focus())
}
</script>

<template>
  <fieldset data-field="highlights" class="m-0 grid min-w-0 gap-6 border-0 p-0">
    <legend class="mb-2 grid gap-1.5 p-0">
      <span class="text-title">{{ t.bullets.label }}</span>
      <span class="max-w-[64ch] text-label text-faint">{{ t.bullets.hint(BULLETS_MAX, BULLET_CHARS) }}</span>
    </legend>
    <ol v-if="es.length" ref="list" class="m-0 grid list-none gap-9 p-0">
      <li
        v-for="(_, i) in es"
        :key="i"
        class="grid animate-enter grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 border-t border-rule pt-6"
      >
        <BilingualField
          :es="es[i]"
          :en="englishAt(i)"
          :path="`highlights[${i}]`"
          :en-path="`translations.en.highlights[${i}]`"
          :label="t.bullets.item(i + 1)"
          kind="prose"
          :rows="2"
          :max="BULLET_CHARS"
          @update:es="setSpanish(i, $event)"
          @update:en="setEnglish(i, $event)"
        />
        <IconButton icon="trash" :label="t.bullets.remove(i + 1)" :disabled="locked" class="mt-6" @click="remove(i)" />
      </li>
    </ol>
    <p v-else class="m-0 text-body text-faint">
      {{ t.bullets.none }}
    </p>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Button icon="plus" :disabled="full || locked" @click="add">
        {{ t.bullets.add }}
      </Button>
      <span v-if="full" class="text-label text-faint">{{ t.bullets.full(BULLETS_MAX) }}</span>
    </div>
  </fieldset>
</template>
