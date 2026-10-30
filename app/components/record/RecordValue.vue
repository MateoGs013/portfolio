<script setup lang="ts">
/**
 * El valor de un campo en registro (docs/diseno.md §4): string entre comillas (`.fv.q`), cifra, enum
 * y fecha en mono, relación como enlace, lista como `.fv-list` y media como miniaturas (`.flip`). Sin
 * valor es `NULL`. La forma la decide `cellFor` de app/lib/record.ts; `class` y `lang` van a la raíz.
 */
import type { RouteLocationRaw } from 'vue-router'
import { valueClass, type Cell } from '~/lib/record'

const props = withDefaults(defineProps<{
  cell: Cell
  /** Strings con comillas; la tabla las omite para leer en columnas. */
  quoted?: boolean
  /** Destino propio (el nombre del registro en la tabla lleva a su página). */
  to?: RouteLocationRaw
}>(), { quoted: true, to: undefined })

const { t, localeRoute } = useLocale()

const target = computed(() => props.to ?? props.cell.to ?? props.cell.facet)
/** Los nodos que viajan son inline-block: un transform no mueve un elemento inline. */
const scalar = computed(() => `${valueClass(props.cell.kind, props.quoted)} inline-block max-w-full`)
const item = computed(() => valueClass(props.cell.kind === 'list' ? 'string' : 'relation', props.quoted))
const link = 'underline decoration-faint decoration-1 underline-offset-4 transition-colors duration-200 hover:text-ink hover:decoration-current'
</script>

<template>
  <ul v-if="cell.media?.length" class="fv-list flex flex-col gap-3 self-start">
    <li v-for="(media, i) in cell.media" :key="i" class="flex items-center gap-4">
      <img
        v-if="media.src"
        class="flip block aspect-[16/10] w-34 shrink-0 rounded-[2px] bg-surface object-cover"
        :src="media.src"
        :alt="media.alt"
        :width="media.width"
        :height="media.height"
        :lang="media.untranslated ? 'es' : undefined"
        loading="lazy"
        decoding="async"
      >
      <span class="fv min-w-0 font-mono text-xs text-faint wrap-anywhere">{{ media.meta }}</span>
    </li>
  </ul>
  <ul v-else-if="cell.items?.length" class="fv-list flex flex-col gap-1">
    <li v-for="(entry, i) in cell.items" :key="i" :class="item" :lang="entry.untranslated ? 'es' : undefined">
      <NuxtLink v-if="entry.to" :to="localeRoute(entry.to)" :class="link">{{ entry.label }}</NuxtLink>
      <a v-else-if="entry.href" :href="entry.href" rel="noopener" :class="link">{{ entry.label }}</a>
      <template v-else>{{ entry.label }}</template>
      <span v-if="entry.meta" class="font-mono text-xs text-faint"> · {{ entry.meta }}</span>
    </li>
  </ul>
  <span v-else-if="cell.value === null" class="null font-mono text-xs text-faint">{{ t('record.null') }}</span>
  <NuxtLink v-else-if="target" :to="localeRoute(target)" :class="[scalar, link]">{{ cell.value }}</NuxtLink>
  <a v-else-if="cell.href" :href="cell.href" rel="noopener" :class="[scalar, link]">{{ cell.value }}</a>
  <span v-else :class="scalar">{{ cell.value }}</span>
</template>
