<script setup lang="ts">
/**
 * Dónde queda la entrada en el CV, en una línea: «Entra al CV en el puesto 2 · Ver CV» o «No entra
 * al CV · Sumar». Sumar la pone al final de la experiencia del CV (PATCH /experience/order) sin tocar
 * lo que se está escribiendo; la formación entra sola. Una entrada nueva se suma después de guardarla.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAsyncAction } from '../../composables/useAsyncAction'
import { useCollection } from '../../composables/useCollection'
import Button from '../../ui/Button.vue'
import StatusDot from '../../ui/StatusDot.vue'
import { useEditorContext } from '../collections/context'
import { addToCv } from './cvOrder'
import { experience as t } from './dict'
import { experienceModel } from './model'
import { cvPlace, isEducation, type Experience } from './record'

const props = defineProps<{ record: Experience | null, kind: string }>()
const emit = defineEmits<{ changed: [record: Experience] }>()

const editor = useEditorContext()
const { items } = useCollection<Experience>(experienceModel)
const rows = computed<Experience[]>(() => {
  const list = items.value ?? []
  const own = props.record
  return own && !list.some(e => e.id === own.id) ? [...list, own] : list
})

/** El tipo del formulario manda: pasar a Formación ya la saca de la experiencia del CV. */
const education = computed(() => isEducation({ kind: props.kind }))
const place = computed(() => (props.record && !education.value ? cvPlace(rows.value, props.record.id) : null))

const { run: add, pending: adding } = useAsyncAction(async () => {
  const own = props.record
  if (!own) return
  const { rows: saved, place: n } = await addToCv(rows.value, own.id)
  const next = saved.find(e => e.id === own.id)
  if (next) emit('changed', next)
  return n
}, { success: n => (typeof n === 'number' ? t.place.added(n) : '') })

const link = 'inline-flex items-center rounded-control text-body text-dim underline decoration-rule-strong underline-offset-4 transition-colors duration-120 ease-e hover:text-ink hover:decoration-ink'
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-rule py-4" data-cv-place>
    <template v-if="education">
      <StatusDot tone="ok" :label="t.place.education" strong />
      <span class="text-faint" aria-hidden="true">·</span>
      <RouterLink :to="{ name: 'trayectoria-cv' }" :class="link">
        {{ t.place.see }}
      </RouterLink>
    </template>
    <template v-else-if="place">
      <StatusDot tone="ok" :label="t.place.inCv(place)" strong />
      <span class="text-faint" aria-hidden="true">·</span>
      <RouterLink :to="{ name: 'trayectoria-cv' }" :class="link">
        {{ t.place.see }}
      </RouterLink>
    </template>
    <template v-else>
      <StatusDot :label="t.place.outside" strong />
      <span class="text-faint" aria-hidden="true">·</span>
      <Button
        v-if="record"
        variant="ghost"
        icon="plus"
        :loading="adding"
        :loading-label="t.place.adding"
        :disabled="editor?.busy.value ?? false"
        @click="add()"
      >
        {{ t.place.add }}
      </Button>
      <span v-else class="text-label text-faint">{{ t.place.afterSave }}</span>
    </template>
  </div>
</template>
