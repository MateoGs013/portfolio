<script setup lang="ts">
// Artículos: el blog desde /api/articles en el idioma de la página. Las facetas de la URL (stack,
// featured, project) filtran como en la API; en registro, la colección es una tabla tipada.
import type { PublicArticleSummary } from '~~/server/src/content/present'

const route = useRoute()
const { t, lang, localeRoute } = useLocale()
const { get } = useApi()
const { isRecord } = useRecordView()
const { public: { siteUrl } } = useRuntimeConfig()

const filters = computed(() => apiParams('articles', route.query))
const filterKey = computed(() => new URLSearchParams(filters.value as Record<string, string>).toString())
const articles = await useAsyncData(
  () => `articles:${lang.value}${filterKey.value ? `:${filterKey.value}` : ''}`,
  () => get<PublicArticleSummary[]>('/articles', filters.value).then(r => r.data),
  { getCachedData: cachedApiData },
)
failOn(articles.error)

const list = computed(() => articles.data.value ?? [])
const filtered = computed(() => Object.keys(filters.value).length > 0)
/** El nombre de la tecnología filtrada, tomado de los propios artículos (la URL solo trae el slug). */
const stackName = computed(() => list.value.flatMap(a => a.techs).find(tech => tech.slug === filters.value.stack)?.name)

await usePageSeo(() => ({ title: t('articles.title') }))

useHead({
  script: [{
    key: 'ld-blog',
    type: 'application/ld+json',
    innerHTML: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      'name': t('articles.title'),
      'inLanguage': lang.value,
      'url': new URL(`/articles${lang.value === 'en' ? '?lang=en' : ''}`, siteUrl).toString(),
      'blogPost': list.value.map(a => ({
        '@type': 'BlogPosting',
        'headline': a.title,
        'datePublished': a.publishedAt ?? undefined,
        'url': new URL(`/articles/${a.slug}${lang.value === 'en' ? '?lang=en' : ''}`, siteUrl).toString(),
      })),
    }).replace(/</g, '\\u003c')),
  }],
})
</script>

<template>
  <article data-hf="measure" class="px-pad pt-[clamp(7rem,22vh,12rem)] pb-section">
    <header class="flex flex-col gap-6 pb-[clamp(2rem,6vh,4rem)]">
      <PageTitle
        :title="t('articles.title')"
        :count="list.length"
        :count-label="t(list.length === 1 ? 'articles.count.one' : 'articles.count.other', { n: list.length })"
      />
      <p v-if="filtered" class="flex flex-wrap gap-x-6 gap-y-1 text-s text-dim">
        <span v-if="stackName">{{ t('articles.filtered', { name: stackName }) }}</span>
        <NuxtLink :to="localeRoute('/articles')" class="text-ink">
          <RollText :text="t('articles.clear')" />
        </NuxtLink>
      </p>
    </header>

    <template v-if="list.length">
      <RecordTable v-if="isRecord" collection="articles" :rows="list" />
      <ArticleRows v-else :articles="list" />
    </template>
    <p v-else class="text-m text-dim">
      {{ t(filtered ? 'articles.noMatch' : 'articles.empty') }}
    </p>
  </article>
</template>
