<script setup lang="ts">
// Obra: el título con el conteo que rueda, las facetas de la URL y la galería horizontal. Los filtros
// de la query (?status=, ?stack=…) llegan tal cual a la API; en registro, la colección como tabla.
import type { ProjectSummary } from '~/lib/api'

const route = useRoute()
const { t, localeRoute } = useLocale()
const { isRecord } = useRecordView()

const filters = computed(() => apiParams('projects', route.query))
const projects = await useProjects(filters)
failOn(projects.error)
await usePageSeo(() => ({ title: t('nav.work') }))

/** Lo último que llegó: mientras se trae otro filtro, la galería no se vacía. */
const list = shallowRef<readonly ProjectSummary[]>(projects.data.value ?? [])
watch(projects.data, (data) => {
  if (data) list.value = data
})

const count = computed(() => list.value.length)
const countLabel = computed(() => t(count.value === 1 ? 'work.count.one' : 'work.count.other', { n: count.value }))
</script>

<template>
  <article data-hf="measure">
    <header class="px-pad pt-[clamp(7rem,22vh,12rem)] pb-[clamp(2rem,6vh,4rem)]">
      <h1 tabindex="-1" class="-ms-[0.045em] text-display-page text-ink">
        <span data-vt="page-title">{{ t('nav.work') }}</span>
        <sup aria-hidden="true" class="ms-[0.2em] align-super text-[0.2em] font-[450] tracking-normal text-dim"><RollNumber :value="count" /></sup>
        <span class="sr-only">, {{ countLabel }}</span>
      </h1>
      <WorkFilters :status="filters.status" :stack="filters.stack" :projects="list" class="mt-[clamp(1.5rem,4vh,2.5rem)]" />
    </header>

    <p v-if="projects.error.value" role="alert" class="px-pad text-m text-dim">
      {{ t('error.503.body') }}
    </p>
    <div v-else-if="isRecord" class="px-pad">
      <RecordTable collection="projects" :rows="list" />
    </div>
    <WorkGallery v-else-if="list.length" :projects="list" />
    <p v-else class="flex flex-wrap gap-x-4 gap-y-2 px-pad text-m text-dim">
      {{ t('work.empty') }}
      <NuxtLink :to="localeRoute('/projects')" class="text-ink underline underline-offset-4">
        {{ t('work.clear') }}
      </NuxtLink>
    </p>

    <CursorBubble />
  </article>
</template>
