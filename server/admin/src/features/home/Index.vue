<script setup lang="ts">
/**
 * #/inicio: la bandeja de trabajo. Arriba, el resumen con cifras reales (las de /meta, con las reglas
 * de visibilidad de la API pública) y los dos accesos, Nueva obra (N) y Pegar una vacante. Debajo, lo
 * pendiente agrupado por tipo, cada fila con el enlace al campo exacto, y las vacantes nuevas
 * compatibles si Eros responde (o una línea con el motivo si no).
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { onShortcut } from '../../composables/useShortcuts'
import { summary } from '../../stores/meta'
import Button from '../../ui/Button.vue'
import EmptyState from '../../ui/EmptyState.vue'
import ErrorState from '../../ui/ErrorState.vue'
import Skeleton from '../../ui/Skeleton.vue'
import { home } from './dict'
import { freshCount } from './freshJobs'
import JobsBlock from './JobsBlock.vue'
import PendingList from './PendingList.vue'
import { usePending } from './usePending'

const router = useRouter()
const { items, groups, error, loading, reload } = usePending()
const s = home.summary

const figures = computed(() => {
  const counts = summary.value
  if (!counts) return []
  const list = [
    { id: 'projects', value: counts.projects.visible, label: s.projects(counts.projects.visible) },
    { id: 'articles', value: counts.articles.published, label: s.articles(counts.articles.published) },
    { id: 'experience', value: counts.experience.total, label: s.experience(counts.experience.total) },
    { id: 'cv', value: counts.experience.cv, label: s.cv(counts.experience.cv) },
  ]
  const jobs = freshCount.value
  return jobs === null ? list : [...list, { id: 'jobs', value: jobs, label: s.jobs(jobs) }]
})

const newProject = router.resolve('/obras/nueva').href
const pasteJob = router.resolve('/busqueda/vacantes?pegar=1').href

/** Donde sigue el escalonado después de la bandeja: grupos más filas. */
const afterList = computed(() => groups.value.reduce((n, g) => n + g.items.length + 1, 0))

onShortcut('new', () => void router.push('/obras/nueva'))
</script>

<template>
  <section class="px-4 pt-10 pb-20 md:px-10 md:pt-12 xl:px-16 xl:pt-14">
    <div class="max-w-[1080px]">
      <h1 class="m-0 animate-rise text-display">
        {{ home.title }}
      </h1>

      <ul v-if="figures.length" :aria-label="s.label" class="m-0 mt-5 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
        <li
          v-for="(f, i) in figures"
          :key="f.id"
          class="flex animate-rise items-baseline gap-2 stagger"
          :style="{ '--i': i + 1 }"
          :data-figure="f.id"
        >
          <span class="text-lead font-[560] text-ink tabular-nums">{{ f.value }}</span>
          <span class="text-lead text-dim">{{ f.label }}</span>
        </li>
      </ul>

      <div class="mt-7 flex animate-rise flex-wrap gap-2 stagger [--i:3]">
        <Button variant="primary" icon="plus" shortcut="n" :href="newProject">
          {{ home.actions.newProject }}
        </Button>
        <Button :href="pasteJob">
          {{ home.actions.pasteJob }}
        </Button>
      </div>

      <h2 class="mt-14 mb-0 flex animate-rise items-baseline gap-3 text-title stagger [--i:4]">
        {{ home.pending.title }}
        <span v-if="items" class="text-row font-[420] text-faint tabular-nums">{{ items.length }}</span>
      </h2>
      <p class="sr-only" role="status">
        {{ items && !loading ? home.pending.label(items.length) : '' }}
      </p>

      <div class="mt-6" :aria-busy="loading">
        <ErrorState v-if="error && !items" :title="home.pending.loadError" :message="error.message" :retrying="loading" @retry="reload()" />
        <Skeleton v-else-if="!items" variant="rows" :count="5" />
        <template v-else>
          <ErrorState v-if="error" :title="home.pending.loadError" :message="error.message" :retrying="loading" class="mb-8" @retry="reload()" />
          <EmptyState v-if="!items.length" :title="home.pending.emptyTitle" :text="home.pending.emptyText" />
          <PendingList v-else :groups="groups" />
        </template>
      </div>

      <JobsBlock class="mt-11" :offset="afterList + 5" />
    </div>
  </section>
</template>
