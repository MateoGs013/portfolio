<script setup lang="ts">
// Un artículo desde /api/articles/:slug en el idioma de la página: el título que llegó viajando desde
// la fila, el resumen, la columna fija y el cuerpo en markdown a medida de lectura. Anterior y
// siguiente salen de la lista completa del blog. 404 si no existe o no está publicado.
import type { PublicArticle, PublicArticleSummary } from '~~/server/src/content/present'

const route = useRoute()
const { t, lang, localeRoute } = useLocale()
const { get } = useApi()
const { public: { siteUrl } } = useRuntimeConfig()
const slug = computed(() => String(route.params.slug).toLowerCase())

const about = useDoc('about')
const [article, all] = await Promise.all([
  useAsyncData(
    () => `article:${slug.value}:${lang.value}`,
    () => get<PublicArticle>(`/articles/${encodeURIComponent(slug.value)}`).then(r => r.data),
    { getCachedData: cachedApiData },
  ),
  useAsyncData(
    () => `articles:${lang.value}`,
    () => get<PublicArticleSummary[]>('/articles').then(r => r.data),
    { getCachedData: cachedApiData },
  ),
])
failOn(article.error)
const a = computed(() => article.data.value!)

await usePageSeo(() => ({ title: a.value.title, description: a.value.summary, type: 'article' }))

const url = computed(() => new URL(`/articles/${a.value.slug}${lang.value === 'en' ? '?lang=en' : ''}`, siteUrl).toString())
const author = computed(() => docText(about.data.value, 'name') ?? docText(about.data.value, 'display_name'))

useSeoMeta({
  articlePublishedTime: () => a.value.publishedAt ?? undefined,
  articleModifiedTime: () => a.value.updatedAt,
  articleTag: () => a.value.techs.map(tech => tech.name),
})

useHead({
  script: [{
    key: 'ld-article',
    type: 'application/ld+json',
    innerHTML: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': a.value.title,
      'description': a.value.summary ?? undefined,
      'inLanguage': lang.value,
      'url': url.value,
      'mainEntityOfPage': url.value,
      'datePublished': a.value.publishedAt ?? undefined,
      'dateModified': a.value.updatedAt,
      'timeRequired': a.value.readingTimeMin ? `PT${a.value.readingTimeMin}M` : undefined,
      'keywords': a.value.techs.map(tech => tech.name).join(', ') || undefined,
      'author': author.value ? { '@type': 'Person', 'name': author.value, 'url': new URL('/', siteUrl).toString() } : undefined,
      'about': a.value.project ? { '@type': 'CreativeWork', 'name': a.value.project.title, 'url': new URL(`/projects/${a.value.project.slug}`, siteUrl).toString() } : undefined,
    }).replace(/</g, '\\u003c')),
  }],
})
</script>

<template>
  <article data-hf="measure" class="px-pad pt-[clamp(8rem,24vh,13rem)] pb-section">
    <header class="flex flex-col gap-[clamp(1.5rem,4vh,2.5rem)] record:gap-0">
      <NuxtLink data-chrome :to="localeRoute('/articles')" class="w-fit text-s text-dim transition-colors duration-200 hover:text-ink record:mb-6">
        <RollText :text="t('articles.back')" />
      </NuxtLink>
      <RecordField v-slot="{ fv }" collection="articles" k="title" :value="a.title" :record="a" shared>
        <h1 tabindex="-1" :class="fv" class="-ms-[0.04em] max-w-[22ch] text-display-row text-ink">
          <span data-vt="title">{{ a.title }}</span>
        </h1>
      </RecordField>
      <RecordField v-slot="{ fv }" collection="articles" k="summary" :value="a.summary" :record="a" shared>
        <p :class="fv" class="max-w-read text-l text-dim">
          {{ a.summary }}
        </p>
      </RecordField>
    </header>

    <div class="grid gap-[clamp(2rem,5vw,6rem)] pt-section md:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] focus-mode:md:grid-cols-1 record:gap-0 record:pt-0 record:md:grid-cols-1">
      <ArticleAside :article="a" />
      <RecordField v-slot="{ fv }" collection="articles" k="content" :value="a.content" :record="a">
        <div :class="fv" class="min-w-0">
          <ArticleMarkdown :source="a.content" />
        </div>
      </RecordField>
    </div>

    <ArticleSiblings :articles="all.data.value ?? []" :current="a.slug" />
  </article>
</template>
