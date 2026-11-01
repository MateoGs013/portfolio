<script setup lang="ts">
/**
 * Lo que no está en el orden del CV: las entradas de trabajo que quedaron afuera, cada una con «Sumar
 * al CV» (entra al final), y la formación, que entra sola de la más reciente a la más antigua.
 */
import { nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { announce } from '../../ui/announce'
import Button from '../../ui/Button.vue'
import { experience as t, periodText } from './dict'
import { experienceModel } from './model'
import { titleOf, type Experience } from './record'

const props = defineProps<{ outside: Experience[], education: Experience[], placed: number }>()
const emit = defineEmits<{ add: [id: number] }>()

const root = ref<HTMLElement | null>(null)

function add(entry: Experience): void {
  emit('add', entry.id)
  announce(t.cv.added(titleOf(entry), props.placed + 1))
  // El foco va a la próxima de afuera o, si no queda ninguna, al asa de la que entró.
  void nextTick(() => {
    const next = root.value?.querySelector<HTMLElement>('[data-add]')
    const handle = document.querySelector<HTMLElement>(`[data-handle="${entry.id}"]`)
    ;(next ?? handle)?.focus()
  })
}

const link = 'truncate rounded-control text-row text-ink no-underline transition-colors duration-120 ease-e hover:text-dim'
</script>

<template>
  <div ref="root" class="grid gap-9">
    <div v-if="outside.length" class="grid gap-3">
      <h2 class="m-0 text-label text-dim">
        {{ t.cv.outside }}
      </h2>
      <ul class="m-0 grid list-none border-t border-rule p-0">
        <li v-for="entry in outside" :key="entry.id" class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-b border-rule py-2.5">
          <span class="grid min-w-0 gap-0.5">
            <RouterLink :to="experienceModel.routes.record(entry.id)" :class="link">{{ titleOf(entry) }}</RouterLink>
            <span class="truncate text-label text-faint">{{ periodText(entry.startedAt, entry.endedAt) }}</span>
          </span>
          <Button variant="ghost" icon="plus" data-add :aria-label="t.cv.addNamed(titleOf(entry))" @click="add(entry)">
            {{ t.cv.add }}
          </Button>
        </li>
      </ul>
    </div>
    <div v-if="education.length" class="grid gap-3">
      <h2 class="m-0 text-label text-dim">
        {{ t.cv.education }}
      </h2>
      <ul class="m-0 grid list-none border-t border-rule p-0">
        <li v-for="entry in education" :key="entry.id" class="grid min-w-0 gap-0.5 border-b border-rule py-2.5">
          <RouterLink :to="experienceModel.routes.record(entry.id)" :class="link">{{ titleOf(entry) }}</RouterLink>
          <span class="truncate text-label text-faint">{{ entry.role }} · {{ periodText(entry.startedAt, entry.endedAt) }}</span>
        </li>
      </ul>
      <p class="m-0 text-label text-faint">
        {{ t.cv.educationHelp }}
      </p>
    </div>
  </div>
</template>
