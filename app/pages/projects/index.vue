<script setup lang="ts">
// Obra mínima (F1): la lista de /api/projects con las facetas de la URL. P2 la reemplaza por la galería.
import type { ProjectStatus } from '~/lib/api'

const route = useRoute()
const { t, localeRoute, langAttr } = useLocale()

const filters = computed(() => apiParams('projects', route.query))
const projects = await useProjects(filters)
failOn(projects.error)
await usePageSeo(() => ({ title: t('nav.work') }))

const statuses: ProjectStatus[] = ['LIVE', 'WIP', 'ARCHIVED']

/** La query actual con otro estado (o sin estado): facetar es cambiar la URL. */
function withStatus(status?: ProjectStatus) {
  const { status: _drop, ...rest } = route.query
  return localeRoute({ path: '/projects', query: status ? { ...rest, status: status.toLowerCase() } : rest })
}
</script>

<template>
  <article data-hf="measure" class="flex flex-col gap-10 px-(--pad) py-24">
    <h1 data-vt="page-title" class="text-display-page font-medium tracking-tight text-ink">
      {{ t('nav.work') }}
    </h1>

    <nav :aria-label="t('work.filters')">
      <ul class="flex flex-wrap gap-x-6 gap-y-2 text-s">
        <li>
          <NuxtLink :to="withStatus()" :aria-current="filters.status ? undefined : 'page'" class="text-dim aria-[current=page]:text-ink">
            {{ t('work.all') }}
          </NuxtLink>
        </li>
        <li v-for="s in statuses" :key="s">
          <NuxtLink :to="withStatus(s)" :aria-current="filters.status === s.toLowerCase() ? 'page' : undefined" class="text-dim aria-[current=page]:text-ink">
            {{ t(`status.${s}`) }}
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <ul v-if="projects.data.value?.length" class="flex flex-col border-t border-rule">
      <li v-for="p in projects.data.value" :key="p.slug" class="border-b border-rule">
        <NuxtLink
          :to="localeRoute(`/projects/${p.slug}`)"
          data-card
          data-travel="card"
          :data-tint="p.media[0]?.tint ?? undefined"
          class="flex flex-col gap-1 py-5 text-ink no-underline focus-visible:outline-2 focus-visible:outline-sig-text"
        >
          <span data-travel-title class="text-xl font-medium">{{ p.title }}</span>
          <span class="text-s text-dim">
            {{ p.year }} · {{ t(`status.${p.status}`) }}<template v-if="p.org"> · {{ p.org.name }}</template>
          </span>
          <span class="max-w-[58ch] text-m text-dim" :lang="langAttr(p, 'summary')">{{ p.summary }}</span>
        </NuxtLink>
      </li>
    </ul>
    <p v-else-if="projects.error.value" role="alert" class="text-m text-dim">
      {{ t('error.503.body') }}
    </p>
    <p v-else-if="projects.status.value === 'success'" class="text-m text-dim">
      {{ t('work.empty') }}
    </p>
  </article>
</template>
