<script setup lang="ts">
/**
 * Etapa Análisis (POST /hunter/jobs/:id/evaluate con la vacante en el cuerpo): el veredicto en
 * palabras con su porcentaje, a favor y en contra, y las obras para citar con el enlace a su caso.
 * Sin Eros el análisis se arma desde la base y lo dice. Primario: analizar, o seguir con el mensaje.
 */
import type { HunterJob } from '@shared/hunterContracts'
import { computed, ref } from 'vue'
import { normalize } from '../../../composables/usePalette'
import { options } from '../../../stores/meta'
import { toast } from '../../../stores/toasts'
import Button from '../../../ui/Button.vue'
import StatusDot from '../../../ui/StatusDot.vue'
import { failureText, hunterApi, originOf } from '../adapter'
import { job as t } from '../dictJob'
import { analysisOf, isManual, isSample, verdictOf } from '../model'
import OriginNote from '../OriginNote.vue'
import { replaceJob } from '../store'
import { workOf } from '../work'
import StageHead from './StageHead.vue'

const props = defineProps<{ job: HunterJob }>()

// El componente va con :key por vacante: el trabajo es siempre el de esta.
const work = workOf(props.job)
const analysis = computed(() => work.analysis)
const verdict = computed(() => (analysis.value ? verdictOf(analysis.value.score) : null))
const pending = ref(false)
const head = ref<InstanceType<typeof StageHead> | null>(null)

async function run(): Promise<void> {
  if (pending.value) return
  pending.value = true
  try {
    const result = await hunterApi.evaluate(props.job)
    const match = result.match ?? analysisOf(result.job)
    work.analysis = match
    work.analysisOrigin = isSample(props.job) ? 'demo' : originOf(result)
    // Una pegada a mano pasa a «Evaluada»; las de Eros quedan como Eros diga.
    const status = isManual(props.job) && props.job.status === 'new' ? 'evaluated' : result.job.status
    replaceJob({ ...props.job, match_score: match?.score ?? result.job.match_score, match_analysis: result.job.match_analysis, status })
    toast(t.analysis.done)
    head.value?.focus()
  }
  catch (err) {
    toast(failureText(err, t.analysis.failed), { tone: 'error' })
  }
  finally {
    pending.value = false
  }
}

/** Las obras que nombra el análisis, con su caso si está publicado en el sitio. */
const projects = computed(() => (analysis.value?.matching_projects ?? []).map((title) => {
  const found = options.value?.projects.find(p => normalize(p.title) === normalize(title))
  return { title, href: found?.visible ? `/projects/${found.slug}` : null }
}))

const cons = computed(() => [
  ...(analysis.value?.cons ?? []),
  ...(analysis.value?.missing_skills.length ? [t.analysis.missing(analysis.value.missing_skills.join(', '))] : []),
])

const nextStage = computed(() => `#/busqueda/vacantes/${encodeURIComponent(props.job.id)}/mensaje`)
</script>

<template>
  <div class="grid gap-11">
    <StageHead ref="head" :heading="t.analysis.heading" :intro="t.analysis.intro">
      <!-- Con el análisis hecho, el siguiente paso va después de leerlo (al pie del análisis). -->
      <Button v-if="analysis" variant="ghost" :loading="pending" :loading-label="t.analysis.running" @click="run">
        {{ t.analysis.again }}
      </Button>
      <Button v-else variant="primary" :loading="pending" :loading-label="t.analysis.running" @click="run">
        {{ t.analysis.run }}
      </Button>
    </StageHead>

    <div v-if="analysis && verdict" class="grid animate-enter gap-10">
      <div class="flex flex-wrap items-baseline gap-x-5 gap-y-3 border-t border-rule pt-7">
        <span class="text-figure tabular-nums" :aria-label="t.analysis.score(analysis.score)">{{ analysis.score }} %</span>
        <StatusDot :tone="verdict.tone" :label="verdict.label" strong />
        <OriginNote v-if="work.analysisOrigin" class="sm:ml-auto" :origin="work.analysisOrigin" />
      </div>
      <p v-if="analysis.summary" class="m-0 max-w-[68ch] text-prose text-ink">
        {{ analysis.summary }}
      </p>

      <div class="grid gap-10 md:grid-cols-2">
        <section class="grid content-start gap-3.5">
          <h3 class="m-0 text-label font-[420] text-dim">
            {{ t.analysis.pros }}
          </h3>
          <ul class="m-0 grid list-none gap-2.5 p-0">
            <li v-for="line in analysis.pros" :key="line" class="grid grid-cols-[14px_1fr] items-baseline gap-2 text-field">
              <span class="size-1.5 translate-y-[-2px] rounded-full bg-ok" aria-hidden="true" />{{ line }}
            </li>
            <li v-if="!analysis.pros.length" class="text-body text-faint">
              {{ t.analysis.nothing }}
            </li>
          </ul>
        </section>
        <section class="grid content-start gap-3.5">
          <h3 class="m-0 text-label font-[420] text-dim">
            {{ t.analysis.cons }}
          </h3>
          <ul class="m-0 grid list-none gap-2.5 p-0">
            <li v-for="line in cons" :key="line" class="grid grid-cols-[14px_1fr] items-baseline gap-2 text-field">
              <span class="size-1.5 translate-y-[-2px] rounded-full bg-wip" aria-hidden="true" />{{ line }}
            </li>
            <li v-if="!cons.length" class="text-body text-faint">
              {{ t.analysis.nothing }}
            </li>
          </ul>
        </section>
      </div>

      <section class="grid gap-3.5 border-t border-rule pt-7">
        <h3 class="m-0 text-label font-[420] text-dim">
          {{ t.analysis.projects }}
        </h3>
        <ul v-if="projects.length" class="m-0 grid list-none gap-2 p-0">
          <li v-for="project in projects" :key="project.title" class="text-list">
            <a v-if="project.href" :href="project.href" target="_blank" rel="noopener noreferrer" class="rounded-control text-ink no-underline decoration-1 underline-offset-4 hover:underline">{{ project.title }}</a>
            <span v-else>{{ project.title }}</span>
          </li>
        </ul>
        <p class="m-0 text-label text-faint">
          {{ projects.length ? t.analysis.projectsHint : t.analysis.noProjects }}
        </p>
      </section>

      <p v-if="analysis.salary_estimate" class="m-0 text-body text-dim">
        {{ t.analysis.salary }}: <span class="text-ink">{{ analysis.salary_estimate }}</span>
      </p>

      <div class="border-t border-rule pt-7">
        <Button variant="primary" :href="nextStage">
          {{ t.analysis.next }}
        </Button>
      </div>
    </div>

    <details v-if="job.description" class="group max-w-[68ch] border-t border-rule pt-6">
      <summary class="w-fit rounded-control text-body text-dim transition-colors duration-120 ease-e hover:text-ink">
        {{ t.analysis.description }}
      </summary>
      <p class="mt-5 mb-0 text-prose whitespace-pre-line text-dim">
        {{ job.description }}
      </p>
    </details>
  </div>
</template>
