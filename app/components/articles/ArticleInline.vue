<script setup lang="ts">
// Markdown en línea de un artículo (app/lib/markdown.ts) dibujado con elementos: negrita, cursiva,
// código y enlaces. Las rutas del sitio son NuxtLink y conservan el idioma; un enlace inseguro queda
// como su texto.
import type { RouteLocationRaw } from 'vue-router'
import { linkTarget, parseInline, type Inline } from '~/lib/markdown'

const props = defineProps<{
  /** El texto en markdown; o `nodes`, ya partidos (la recursión de negrita, cursiva y enlaces). */
  text?: string
  nodes?: Inline[]
}>()

const { localeRoute } = useLocale()

type Part =
  | Exclude<Inline, { type: 'link' }>
  | { type: 'link', children: Inline[], to?: RouteLocationRaw, href?: string }

const parts = computed<Part[]>(() => (props.nodes ?? parseInline(props.text ?? '')).map((node) => {
  if (node.type !== 'link') return node
  const target = linkTarget(node.href)
  if (!target) return { type: 'link', children: node.children }
  return 'path' in target
    ? { type: 'link', children: node.children, to: localeRoute(target.path) }
    : { type: 'link', children: node.children, href: target.url }
}))

const link = 'text-ink underline decoration-faint decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-current'
</script>

<template>
  <template v-for="(node, i) in parts" :key="i">
    <template v-if="node.type === 'text'">{{ node.text }}</template>
    <code v-else-if="node.type === 'code'" class="rounded-[2px] bg-surface px-[.3em] font-mono text-s text-ink">{{ node.text }}</code>
    <strong v-else-if="node.type === 'strong'" class="font-title text-ink"><ArticleInline :nodes="node.children" /></strong>
    <em v-else-if="node.type === 'em'"><ArticleInline :nodes="node.children" /></em>
    <NuxtLink v-else-if="node.to" :to="node.to" :class="link"><ArticleInline :nodes="node.children" /></NuxtLink>
    <a v-else-if="node.href" :href="node.href" rel="noopener noreferrer" :class="link"><ArticleInline :nodes="node.children" /></a>
    <ArticleInline v-else :nodes="node.children" />
  </template>
</template>
