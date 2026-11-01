<script setup lang="ts">
/**
 * El cuerpo de un artículo como lo dibuja el sitio (app/components/articles/ArticleMarkdown.vue): el
 * mismo parser (shared/markdown.ts) y los mismos elementos, bloque por bloque (h2–h4, párrafos, listas,
 * citas, código en su figura con el lenguaje y separadores), con la medida de lectura del admin.
 * Nunca innerHTML: el texto no puede inyectar marcado.
 */
import { parseMarkdown } from '@shared/markdown'
import { computed } from 'vue'
import { monoClass } from '../../ui/Mono.vue'
import ArticlePreviewInline from './ArticlePreviewInline.vue'
import { articles } from './dict'

const props = defineProps<{
  source: string
  lang: 'es' | 'en'
}>()

const blocks = computed(() => parseMarkdown(props.source))
const t = articles.text

const heading: Record<2 | 3 | 4, string> = {
  2: 'mt-6 text-figure text-ink first:mt-0',
  3: 'mt-2 text-title text-ink first:mt-0',
  4: 'text-row text-ink first:mt-0',
}
const prose = 'm-0 max-w-[68ch] text-prose text-ink wrap-break-word'
</script>

<template>
  <div :lang="lang" class="flex min-w-0 flex-col gap-6" data-preview>
    <p v-if="!blocks.length" class="m-0 text-body text-faint">
      {{ t.empty }}
    </p>
    <template v-for="(block, i) in blocks" :key="i">
      <component :is="`h${block.level}`" v-if="block.type === 'heading'" class="m-0 text-balance" :class="heading[block.level]">
        {{ block.text }}
      </component>
      <p v-else-if="block.type === 'paragraph'" :class="prose">
        <ArticlePreviewInline :text="block.text" />
      </p>
      <component
        :is="block.ordered ? 'ol' : 'ul'"
        v-else-if="block.type === 'list'"
        :class="[prose, block.ordered ? 'list-decimal' : 'list-disc']"
        class="flex flex-col gap-2 ps-[1.2em] marker:text-faint"
      >
        <li v-for="(item, j) in block.items" :key="j" class="ps-1">
          <ArticlePreviewInline :text="item" />
        </li>
      </component>
      <blockquote v-else-if="block.type === 'quote'" class="m-0 max-w-[68ch] border-0 border-s border-rule-strong ps-5 text-prose text-dim">
        <p class="m-0">
          <ArticlePreviewInline :text="block.text" />
        </p>
      </blockquote>
      <figure v-else-if="block.type === 'code'" class="m-0 flex min-w-0 flex-col gap-2">
        <figcaption v-if="block.lang" aria-hidden="true" class="text-faint" :class="monoClass.meta">
          {{ block.lang }}
        </figcaption>
        <pre
          tabindex="0"
          role="region"
          :aria-label="block.lang ? t.codeLang(block.lang) : t.code"
          class="m-0 overflow-x-auto rounded-media bg-surface p-5 leading-[1.75] text-ink"
          :class="monoClass.label"
        ><code>{{ block.text }}</code></pre>
      </figure>
      <hr v-else class="my-4 w-full max-w-[68ch] border-0 border-t border-rule">
    </template>
  </div>
</template>
