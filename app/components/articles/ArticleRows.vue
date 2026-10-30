<script setup lang="ts">
/**
 * Los artículos como filas tipográficas sobre líneas de 1 px, como la obra del inicio: el título a la
 * izquierda (viaja como `title` hasta el h1 del artículo), la fecha y la lectura a la derecha y el
 * resumen debajo. Atenuar (docs/diseno.md §2): con puntero fino, al apuntar una fila sus hermanas
 * bajan a .25 y su título se corre 1,2 rem.
 */
import type { PublicArticleSummary } from '~~/server/src/content/present'

defineProps<{
  articles: readonly PublicArticleSummary[]
}>()

const { t, localeRoute, langAttr } = useLocale()
</script>

<template>
  <ul class="group/rows flex flex-col border-b border-rule">
    <li v-for="a in articles" :key="a.slug">
      <NuxtLink
        :to="localeRoute(`/articles/${a.slug}`)"
        data-row
        data-travel="row"
        class="group/row grid grid-cols-1 items-baseline gap-x-8 gap-y-3 border-t border-rule py-[clamp(1.2rem,3vh,2rem)] text-ink no-underline transition-opacity duration-500 ease-expo md:grid-cols-[minmax(0,1fr)_auto] fine:group-hover/rows:not-hover:opacity-25"
      >
        <span class="flex min-w-0 flex-col gap-3">
          <span class="text-xl">
            <span
              data-travel-title
              class="transition-transform duration-700 ease-expo fine:group-hover/row:translate-x-[1.2rem]"
              :lang="langAttr(a, 'title')"
            >{{ a.title }}</span>
          </span>
          <span v-if="a.summary" class="max-w-read text-m text-dim" :lang="langAttr(a, 'summary')">{{ a.summary }}</span>
        </span>
        <span class="text-s text-dim tabular-nums md:text-right">
          <ArticleDate v-if="a.publishedAt" :value="a.publishedAt" /><template v-if="a.publishedAt && a.readingTimeMin"> · </template>
          <template v-if="a.readingTimeMin">{{ t('articles.readingTime', { n: a.readingTimeMin }) }}</template>
        </span>
      </NuxtLink>
    </li>
  </ul>
</template>
