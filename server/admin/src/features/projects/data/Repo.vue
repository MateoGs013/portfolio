<script setup lang="ts">
/**
 * «Importar desde el repositorio»: con el repositorio de Lo esencial, lee GitHub y suma a la obra las
 * tecnologías del catálogo que reconoce; si el sitio o la síntesis están vacíos, los completa con lo
 * del repositorio. Dice qué hizo y qué no encontró. Nada se guarda hasta Guardar.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { options } from '../../../stores/meta'
import { announce } from '../../../ui/announce'
import Button from '../../../ui/Button.vue'
import { useEditorContext } from '../../collections/context'
import { useProject } from '../context'
import { dataText } from './dict'
import { parseRepo, readRepo, type RepoFindings } from './github'

const t = dataText.repo
const { form, record } = useProject()
const editor = useEditorContext()
const locked = computed(() => editor?.busy.value ?? false)

const repo = computed(() => parseRepo(form.value.repo))
const working = ref(false)
const problem = ref('')
const lines = ref<string[]>([])
let controller: AbortController | null = null
onBeforeUnmount(() => controller?.abort())

/** A Lo esencial, con el foco en el repositorio. */
const toRepo = computed(() => ({
  name: record.value ? 'obra' : 'obra-nueva',
  params: record.value ? { id: String(record.value.id) } : {},
  query: { campo: 'repo' },
}))

function apply(found: RepoFindings): string[] {
  const added = found.techs.filter(tech => !form.value.techIds.includes(tech.id))
  form.value.techIds = [...form.value.techIds, ...added.map(tech => tech.id)]
  const out = [t.added(added.map(tech => tech.name))]
  const already = found.techs.length - added.length
  if (already) out.push(t.already(already))
  if (found.unknown.length) out.push(t.unknown(found.unknown))
  if (!form.value.url.trim() && found.homepage) {
    form.value.url = found.homepage
    out.push(t.site(found.homepage))
  }
  if (!form.value.summary.trim() && found.description) {
    form.value.summary = found.description
    out.push(t.summary)
  }
  return out
}

async function run(): Promise<void> {
  if (!repo.value || working.value || locked.value) return
  controller?.abort()
  controller = new AbortController()
  working.value = true
  problem.value = ''
  lines.value = []
  try {
    const found = await readRepo(repo.value, options.value?.techs ?? [], controller.signal)
    lines.value = apply(found)
    announce(`${t.done} ${lines.value.join(' ')}`)
  }
  catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return
    problem.value = err instanceof TypeError ? t.offline : (err as Error).message
  }
  finally {
    working.value = false
  }
}
</script>

<template>
  <div class="grid gap-3 border-l border-rule pl-5">
    <p class="m-0 text-row text-ink">
      {{ t.title }}
    </p>
    <p class="m-0 max-w-[60ch] text-label text-faint">
      {{ t.text }}
    </p>
    <div v-if="repo" class="flex flex-wrap items-center gap-3">
      <Button :loading="working" :loading-label="t.loading" :disabled="locked" @click="run">
        {{ t.action }}
      </Button>
      <span class="text-label text-dim" translate="no">{{ repo.owner }}/{{ repo.name }}</span>
    </div>
    <p v-else class="m-0 text-label text-dim">
      {{ form.repo.trim() ? t.notGithub : t.noRepo }}
      <RouterLink :to="toRepo" class="rounded-control text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink">
        {{ t.goRepo }}
      </RouterLink>
    </p>
    <p v-if="problem" class="m-0 text-label text-danger" role="alert">
      {{ problem }}
    </p>
    <ul v-if="lines.length" class="m-0 grid list-none gap-1 p-0 text-label text-dim" aria-live="polite">
      <li v-for="line in lines" :key="line">
        {{ line }}
      </li>
    </ul>
  </div>
</template>
