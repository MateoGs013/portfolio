<script setup lang="ts">
/**
 * El color de una tecnología: la muestra es el selector nativo (<input type=color>, que también acepta
 * un hex escrito), al lado el hex en Mono y «Quitar el color» para dejarla sin. Sin color la muestra
 * queda vacía, con el borde punteado, en lugar del negro que pondría el navegador. Solo lo usa el
 * registro R, y la ayuda lo dice.
 */
import { computed } from 'vue'
import { fieldOf } from '../../models/validate'
import { announce } from '../../ui/announce'
import Field from '../../ui/Field.vue'
import Mono from '../../ui/Mono.vue'
import { useEditorContext } from '../collections/context'
import { stack } from './dict'

const color = defineModel<string>({ default: '' })

const t = stack.fields
const editor = useEditorContext()
const locked = computed(() => editor?.busy.value ?? false)
const descriptor = computed(() => fieldOf('Tech', 'color'))

function onInput(event: Event): void {
  color.value = (event.target as HTMLInputElement).value.toLowerCase()
}

function clear(): void {
  color.value = ''
  announce(t.colorCleared)
}
</script>

<template>
  <Field
    data-field="color"
    :label="descriptor?.label ?? ''"
    :hint="t.colorHint"
    :error="editor?.messageFor('color') ?? null"
  >
    <template #aux>
      <button
        v-if="color"
        type="button"
        class="rounded-control border-0 bg-transparent p-0 text-meta text-dim underline decoration-rule-strong underline-offset-4 transition-colors duration-120 ease-e hover:text-ink hover:decoration-ink disabled:cursor-not-allowed disabled:opacity-45"
        :disabled="locked"
        @click="clear"
      >
        {{ t.colorClear }}
      </button>
    </template>
    <template #default="{ id, describedBy }">
      <div class="flex items-center gap-4 border-b border-rule-strong pb-2.5">
        <span
          class="relative size-9 shrink-0 rounded-control has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-sig-text"
          :class="color ? 'border border-rule-strong' : 'border border-dashed border-rule-hover'"
          :style="color ? { backgroundColor: color } : undefined"
        >
          <input
            :id="id"
            type="color"
            :value="color || undefined"
            :disabled="locked"
            :aria-describedby="describedBy"
            class="absolute inset-0 size-full cursor-pointer appearance-none border-0 bg-transparent p-0 opacity-0 disabled:cursor-not-allowed"
            @input="onInput"
          >
        </span>
        <Mono v-if="color" size="label" class="text-ink">{{ color }}</Mono>
        <span v-else class="text-field text-faint">{{ t.colorNone }}</span>
      </div>
    </template>
  </Field>
</template>
