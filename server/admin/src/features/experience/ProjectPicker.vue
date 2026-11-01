<script setup lang="ts">
/**
 * Las obras ligadas a una entrada, elegidas una por una (nunca por compartir empresa): todas las obras
 * de la base como fichas que se prenden y se apagan (aria-pressed). Las ocultas también se pueden
 * ligar y lo dicen; una ligada que /meta todavía no conoce sale del registro, así guardar no la suelta.
 */
import { computed } from 'vue'
import { useId } from '../../composables/useId'
import { options } from '../../stores/meta'
import Icon from '../../ui/Icon.vue'
import { useEditorContext } from '../collections/context'
import { experience as t } from './dict'
import type { Experience } from './record'

interface ProjectChoice {
  id: number
  title: string
  hidden: boolean
}

const props = defineProps<{ linked: Experience['projects'] }>()
const model = defineModel<number[]>({ required: true })

const editor = useEditorContext()
const locked = computed(() => editor?.busy.value ?? false)
const error = computed(() => editor?.messageFor('projectIds') ?? null)
const id = useId('obras')

const choices = computed<ProjectChoice[]>(() => {
  const known = (options.value?.projects ?? []).map(p => ({ id: p.id, title: p.title, hidden: !p.visible }))
  const extra = props.linked.filter(p => !known.some(k => k.id === p.id)).map(p => ({ id: p.id, title: p.title, hidden: false }))
  return [...known, ...extra]
})

function toggle(project: number): void {
  model.value = model.value.includes(project) ? model.value.filter(other => other !== project) : [...model.value, project]
}
</script>

<template>
  <fieldset data-field="projectIds" class="m-0 grid min-w-0 gap-3 border-0 p-0" :aria-describedby="`${id}-${error ? 'error' : 'hint'}`">
    <legend class="mb-2 p-0 text-label text-dim">
      {{ t.fields.projects }}
    </legend>
    <ul v-if="choices.length" class="m-0 flex list-none flex-wrap gap-2 p-0">
      <li v-for="choice in choices" :key="choice.id">
        <button
          type="button"
          :aria-pressed="model.includes(choice.id)"
          :disabled="locked"
          class="inline-flex h-8 items-center gap-1.5 rounded-full border border-rule-strong bg-transparent px-3.5 text-body text-dim transition-colors duration-120 ease-e hover:border-rule-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-45 aria-pressed:border-ink aria-pressed:bg-surface aria-pressed:text-ink"
          @click="toggle(choice.id)"
        >
          <Icon v-if="model.includes(choice.id)" name="check" :size="14" />
          {{ choice.title }}
          <span v-if="choice.hidden" class="text-label text-faint">· {{ t.fields.hidden }}</span>
        </button>
      </li>
    </ul>
    <p v-else class="m-0 text-body text-faint">
      {{ t.fields.projectsNone }}
    </p>
    <p v-if="error" :id="`${id}-error`" class="m-0 text-label text-danger">
      {{ error }}
    </p>
    <p v-else :id="`${id}-hint`" class="m-0 text-label text-faint">
      {{ t.fields.projectsHint }}
    </p>
  </fieldset>
</template>
