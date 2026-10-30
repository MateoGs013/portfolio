<script setup lang="ts">
// El cuerpo de un artículo (app/lib/markdown.ts) a medida de lectura: párrafos de 58ch en `text-l`,
// encabezados que se revelan por líneas (RevealLines) y código en su placa, desplazable con teclado.
import { parseMarkdown } from '~/lib/markdown'

const props = defineProps<{
  source: string
}>()

const { t } = useLocale()

const blocks = computed(() => parseMarkdown(props.source))

/** Los encabezados se separan de lo anterior; el primero del cuerpo no. */
const heading: Record<2 | 3 | 4, string> = {
  2: 'mt-[clamp(1.5rem,5vh,3rem)] text-xl text-ink first:mt-0',
  3: 'mt-4 text-l font-title text-ink first:mt-0',
  4: 'mt-2 text-m font-title text-ink first:mt-0',
}
const prose = 'max-w-read text-l text-ink'
</script>

<template>
  <div class="flex flex-col gap-6">
    <template v-for="(block, i) in blocks" :key="i">
      <RevealLines v-if="block.type === 'heading'" :tag="`h${block.level}`" :text="block.text" :class="heading[block.level]" />
      <p v-else-if="block.type === 'paragraph'" :class="prose">
        <ArticleInline :text="block.text" />
      </p>
      <component
        :is="block.ordered ? 'ol' : 'ul'"
        v-else-if="block.type === 'list'"
        :class="[prose, block.ordered ? 'list-decimal' : 'list-disc']"
        class="flex flex-col gap-2 ps-[1.2em] marker:text-faint"
      >
        <li v-for="(item, j) in block.items" :key="j" class="ps-1">
          <ArticleInline :text="item" />
        </li>
      </component>
      <blockquote v-else-if="block.type === 'quote'" class="m-0 max-w-read border-s border-rule ps-5 text-l text-dim">
        <p><ArticleInline :text="block.text" /></p>
      </blockquote>
      <figure v-else-if="block.type === 'code'" class="m-0 flex max-w-focus min-w-0 flex-col gap-2">
        <figcaption v-if="block.lang" aria-hidden="true" class="font-mono text-xs text-faint">
          {{ block.lang }}
        </figcaption>
        <pre
          tabindex="0"
          role="region"
          :aria-label="block.lang ? t('articles.codeLang', { lang: block.lang }) : t('articles.code')"
          class="m-0 overflow-x-auto rounded-[3px] bg-surface p-5 font-mono text-xs leading-[1.75] text-ink"
        ><code>{{ block.text }}</code></pre>
      </figure>
      <hr v-else class="my-4 w-full max-w-read border-0 border-t border-rule">
    </template>
  </div>
</template>
