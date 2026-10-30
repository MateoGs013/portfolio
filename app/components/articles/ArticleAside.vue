<script setup lang="ts">
/**
 * La columna fija del artículo, como la del caso: publicación, lectura, tecnologías (facetan el blog)
 * y la obra relacionada. Cada dato es un campo del registro (R). En registro la lista de definición
 * pasa a ser un bloque de filas `.f`, que no son pares dt/dd.
 */
import type { PublicArticle } from '~~/server/src/content/present'

defineProps<{
  article: PublicArticle
}>()

const { t, localeRoute, langAttr } = useLocale()
const { isRecord } = useRecordView()

const dt = 'text-xs text-faint'
const link = 'underline decoration-rule decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-current'
</script>

<template>
  <aside class="md:sticky md:top-24 md:self-start focus-mode:static record:static">
    <component :is="isRecord ? 'div' : 'dl'" class="grid gap-1 text-s record:gap-0 [&>.f+.f>dt]:mt-4">
      <RecordField collection="articles" k="publishedAt" :value="article.publishedAt" :record="article">
        <template v-if="article.publishedAt">
          <dt :class="dt">{{ t('articles.published') }}</dt>
          <dd><ArticleDate :value="article.publishedAt" /></dd>
        </template>
      </RecordField>
      <RecordField collection="articles" k="readingTimeMin" :value="article.readingTimeMin" :record="article">
          <dt :class="dt">{{ t('articles.reading') }}</dt>
          <dd>{{ t('articles.readingTime', { n: article.readingTimeMin }) }}</dd>
      </RecordField>
      <RecordField collection="articles" k="techs" :value="article.techs" :record="article">
          <dt :class="dt">{{ t('articles.techs') }}</dt>
          <dd>
            <ul class="flex flex-wrap gap-x-4 gap-y-1">
              <li v-for="tech in article.techs" :key="tech.slug">
                <NuxtLink :to="localeRoute({ path: '/articles', query: { stack: tech.slug } })" :class="link">{{ tech.name }}</NuxtLink>
              </li>
            </ul>
          </dd>
      </RecordField>
      <RecordField collection="articles" k="project" :value="article.project" :record="article">
        <template v-if="article.project">
          <dt :class="dt">{{ t('articles.project') }}</dt>
          <dd>
            <NuxtLink :to="localeRoute(`/projects/${article.project.slug}`)" :class="link" :lang="langAttr(article.project, 'title')">
              {{ article.project.title }}
            </NuxtLink>
          </dd>
        </template>
      </RecordField>
    </component>
  </aside>
</template>
