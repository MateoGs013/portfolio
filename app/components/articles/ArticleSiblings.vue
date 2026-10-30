<script setup lang="ts">
/**
 * Anterior y siguiente en el orden del blog (el de la lista, sin facetas). Cada título viaja como
 * `title` hasta el h1 del otro artículo y, con puntero fino, se corre 1,5 rem al apuntarlo, como
 * «Siguiente» en el caso. Con un solo artículo no hay nada que mostrar.
 */
import type { PublicArticleSummary } from '~~/server/src/content/present'

const props = defineProps<{
  articles: readonly PublicArticleSummary[]
  current: string
}>()

const { t, localeRoute, langAttr } = useLocale()

const siblings = computed(() => {
  const i = props.articles.findIndex(a => a.slug === props.current)
  if (i < 0) return []
  return [
    { key: 'previous', label: t('articles.previous'), article: props.articles[i - 1], shift: 'fine:group-hover:-translate-x-[1.5rem]', align: '' },
    { key: 'next', label: t('articles.next'), article: props.articles[i + 1], shift: 'fine:group-hover:translate-x-[1.5rem]', align: 'md:col-start-2 md:text-right' },
  ].filter((s): s is typeof s & { article: PublicArticleSummary } => !!s.article)
})
</script>

<template>
  <nav v-if="siblings.length" data-chrome :aria-label="t('articles.more')" class="mt-section border-t border-rule pt-8">
    <ul class="grid gap-10 md:grid-cols-2">
      <li v-for="s in siblings" :key="s.key" :class="s.align">
        <NuxtLink
          :to="localeRoute(`/articles/${s.article.slug}`)"
          data-travel="next"
          :rel="s.key === 'next' ? 'next' : 'prev'"
          class="group flex flex-col gap-3 text-ink no-underline"
        >
          <span class="text-s text-dim">{{ s.label }}</span>
          <span class="text-xl">
            <span
              data-travel-title
              class="transition-transform duration-900 ease-expo"
              :class="s.shift"
              :lang="langAttr(s.article, 'title')"
            >{{ s.article.title }}</span>
          </span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
