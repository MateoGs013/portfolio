<script setup lang="ts">
/**
 * El markdown en línea de la vista previa, con las reglas del sitio (ArticleInline.vue): negrita,
 * cursiva, código y enlaces. Un enlace a una ruta del sitio o a http(s)/mailto se abre en otra pestaña
 * (así no se deja el editor); uno inseguro queda como su texto, igual que en el sitio.
 */
import { linkTarget, parseInline, type Inline } from '@shared/markdown'
import { computed } from 'vue'
import { monoClass } from '../../ui/Mono.vue'

const props = defineProps<{
  /** El texto en markdown; o `nodes`, ya partidos (la recursión de negrita, cursiva y enlaces). */
  text?: string
  nodes?: Inline[]
}>()

type Part =
  | Exclude<Inline, { type: 'link' }>
  | { type: 'link', children: Inline[], href?: string }

const parts = computed<Part[]>(() => (props.nodes ?? parseInline(props.text ?? '')).map((node) => {
  if (node.type !== 'link') return node
  const target = linkTarget(node.href)
  if (!target) return { type: 'link', children: node.children }
  return { type: 'link', children: node.children, href: 'path' in target ? target.path : target.url }
}))

const link = 'rounded-control text-ink underline decoration-faint decoration-1 underline-offset-4 transition-colors duration-120 ease-e hover:decoration-current'
</script>

<template>
  <template v-for="(node, i) in parts" :key="i">
    <template v-if="node.type === 'text'">{{ node.text }}</template>
    <code v-else-if="node.type === 'code'" class="rounded-kbd bg-surface px-[.3em] text-ink" :class="monoClass.label">{{ node.text }}</code>
    <strong v-else-if="node.type === 'strong'" class="font-[560] text-ink"><ArticlePreviewInline :nodes="node.children" /></strong>
    <em v-else-if="node.type === 'em'"><ArticlePreviewInline :nodes="node.children" /></em>
    <a v-else-if="node.href" :href="node.href" target="_blank" rel="noopener noreferrer" :class="link"><ArticlePreviewInline :nodes="node.children" /></a>
    <ArticlePreviewInline v-else :nodes="node.children" />
  </template>
</template>
