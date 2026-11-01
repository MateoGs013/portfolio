<script setup lang="ts">
/**
 * El paso extra para crear una tecnología en línea: la base pide su categoría y desde qué año se usa
 * (entre 1990 y el actual). El foco entra a la categoría; Esc o Cancelar vuelven al buscador.
 */
import { computed, nextTick, onMounted, ref } from 'vue'
import { enumOptions } from '../../stores/meta'
import Button from '../../ui/Button.vue'
import Field from '../../ui/Field.vue'
import type { SelectOption } from '../../ui/field'
import Select from '../../ui/Select.vue'
import TextInput from '../../ui/TextInput.vue'
import { collections } from './dict'
import type { TechExtra } from './inlineCreate'

defineProps<{
  name: string
  busy: boolean
}>()

const emit = defineEmits<{ create: [extra: TechExtra], cancel: [] }>()

const t = collections.inline
const FIRST_YEAR = 1990
const thisYear = new Date().getFullYear()
const category = ref<string | null>(null)
const since = ref(String(thisYear))
const tried = ref(false)
const root = ref<HTMLElement | null>(null)

const categories = computed<SelectOption<string>[]>(() => enumOptions('TechCategory').map(o => ({ value: o.value, label: o.label })))
const year = computed(() => Number(since.value))
const categoryError = computed(() => (tried.value && !category.value ? t.categoryMissing : null))
const yearError = computed(() => (tried.value && (!Number.isInteger(year.value) || year.value < FIRST_YEAR || year.value > thisYear)
  ? t.sinceRange(FIRST_YEAR, thisYear)
  : null))

function submit(): void {
  tried.value = true
  if (categoryError.value || yearError.value || !category.value) return
  emit('create', { category: category.value, since: year.value })
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  emit('cancel')
}

onMounted(async () => {
  await nextTick()
  root.value?.querySelector<HTMLElement>('select')?.focus()
})
</script>

<template>
  <div
    ref="root"
    role="group"
    :aria-label="t.create(name)"
    class="grid animate-enter gap-5 border-l-2 border-rule-strong py-1 pl-5"
    @keydown="onKeydown"
  >
    <p class="m-0 text-row text-ink">
      {{ t.create(name) }}
    </p>
    <div class="grid items-start gap-6 sm:grid-cols-[minmax(0,1fr)_10rem]">
      <Field :label="t.category" :error="categoryError" required>
        <Select v-model="category" :options="categories" :disabled="busy" />
      </Field>
      <Field :label="t.since" :hint="t.sinceHint" :error="yearError" required>
        <TextInput v-model="since" inputmode="numeric" :readonly="busy" />
      </Field>
    </div>
    <div class="flex flex-wrap gap-2">
      <Button variant="primary" :loading="busy" :loading-label="t.creating" @click="submit">
        {{ t.confirmCreate }}
      </Button>
      <Button variant="ghost" :disabled="busy" @click="emit('cancel')">
        {{ t.cancel }}
      </Button>
    </div>
  </div>
</template>
