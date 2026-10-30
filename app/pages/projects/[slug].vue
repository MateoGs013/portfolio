<script setup lang="ts">
// Caso mínimo (F1): los campos de /api/projects/:slug en una lista llana. P3 lo reemplaza por el caso.
import { metricLabel, metricValue } from '~/lib/format'
import { safeHref } from '~/lib/record'

const route = useRoute()
const { t, lang, localeRoute, langAttr } = useLocale()
const slug = computed(() => String(route.params.slug))

const [project, all] = await Promise.all([useProject(slug), useProjects()])
failOn(project.error)
const p = computed(() => project.data.value!)
const cover = computed(() => p.value.media.find(m => m.role === 'COVER'))
await usePageSeo(() => ({ title: p.value.title, description: p.value.summary, image: cover.value }))

/** La siguiente obra en sortOrder, circular, siempre desde la lista completa. */
const next = computed(() => {
  const list = all.data.value ?? []
  const i = list.findIndex(item => item.slug === p.value.slug)
  return list.length > 1 && i >= 0 ? list[(i + 1) % list.length] : undefined
})
</script>

<template>
  <article data-hf="measure" class="flex flex-col gap-12 px-(--pad) py-24">
    <header class="flex flex-col gap-4">
      <h1 class="text-display-case font-medium tracking-tight text-ink">
        <span data-vt="title">{{ p.title }}</span>
      </h1>
      <p class="max-w-[58ch] text-l text-dim" :lang="langAttr(p, 'summary')">
        {{ p.summary }}
      </p>
    </header>

    <figure v-if="cover && cover.kind === 'IMAGE'" data-vt="cover" class="m-0">
      <img :src="cover.src" :alt="cover.alt" :width="cover.width" :height="cover.height" class="h-auto w-full rounded-[3px]" :lang="langAttr(cover, 'alt')">
    </figure>

    <dl class="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-3 text-m">
      <dt class="text-xs text-dim">{{ t('case.role') }}</dt>
      <dd :lang="langAttr(p, 'role')">{{ p.role }}</dd>
      <dt class="text-xs text-dim">{{ t('case.year') }}</dt>
      <dd>{{ p.year }}</dd>
      <dt class="text-xs text-dim">{{ t('case.status') }}</dt>
      <dd>{{ t(`status.${p.status}`) }}</dd>
      <template v-if="p.org">
        <dt class="text-xs text-dim">{{ t('case.client') }}</dt>
        <dd>{{ p.org.name }}</dd>
      </template>
    </dl>

    <section v-if="p.brief" class="flex flex-col gap-2">
      <h2 class="text-s text-dim">{{ t('case.brief') }}</h2>
      <p class="max-w-[58ch] text-l" :lang="langAttr(p, 'brief')">{{ p.brief }}</p>
    </section>

    <section v-if="p.steps.length" class="flex flex-col gap-4">
      <h2 class="text-s text-dim">{{ t('case.process') }}</h2>
      <ol class="flex flex-col gap-4">
        <li v-for="step in p.steps" :key="step.order" class="flex flex-col gap-1">
          <h3 class="text-l text-ink" :lang="langAttr(step, 'title')">{{ step.title }}</h3>
          <p class="max-w-[58ch] text-m text-dim" :lang="langAttr(step, 'body')">{{ step.body }}</p>
        </li>
      </ol>
    </section>

    <section v-if="p.outcome" class="flex flex-col gap-2">
      <h2 class="text-s text-dim">{{ t('case.outcome') }}</h2>
      <p class="max-w-[58ch] text-l" :lang="langAttr(p, 'outcome')">{{ p.outcome }}</p>
    </section>

    <section v-if="p.metrics.length" class="flex flex-col gap-2">
      <h2 class="text-s text-dim">{{ t('case.metrics') }}</h2>
      <dl class="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2 text-m">
        <template v-for="m in p.metrics" :key="m.key">
          <dt class="text-xs text-dim">{{ metricLabel(m, lang) }}</dt>
          <dd class="tabular-nums">{{ metricValue(m, lang) }}</dd>
        </template>
      </dl>
    </section>

    <section v-if="p.techs.length" class="flex flex-col gap-2">
      <h2 class="text-s text-dim">{{ t('case.stack') }}</h2>
      <ul class="flex flex-wrap gap-x-5 gap-y-1 text-m">
        <li v-for="tech in p.techs" :key="tech.slug">
          <NuxtLink :to="localeRoute({ path: '/projects', query: { stack: tech.slug } })" class="text-ink underline underline-offset-4">{{ tech.name }}</NuxtLink>
        </li>
      </ul>
    </section>

    <section v-if="p.links.length" class="flex flex-col gap-2">
      <h2 class="text-s text-dim">{{ t('case.links') }}</h2>
      <ul class="flex flex-col gap-1 text-m">
        <li v-for="link in p.links" :key="link.url">
          <a :href="safeHref(link.url)" rel="noopener" class="text-ink underline underline-offset-4" :lang="langAttr(link, 'label')">{{ link.label }}</a>
        </li>
      </ul>
    </section>

    <nav v-if="next" :aria-label="t('case.next')" class="border-t border-rule pt-6">
      <NuxtLink :to="localeRoute(`/projects/${next.slug}`)" data-travel="next" class="flex flex-col gap-1 text-ink no-underline">
        <span class="text-s text-dim">{{ t('case.next') }}</span>
        <span data-travel-title class="text-xl font-medium">{{ next.title }}</span>
      </NuxtLink>
    </nav>
  </article>
</template>
