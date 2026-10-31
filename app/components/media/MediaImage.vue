<script setup lang="ts">
/**
 * Una imagen de la base (`Media`). Reserva su caja con `width` y `height` reales (sin saltos de
 * layout), toma el texto alternativo de `Media.alt` en el idioma activo (`lang="es"` si quedó sin
 * traducir) y lo deja vacío si es decorativa. De un VIDEO muestra su póster.
 *
 * `loading` y `fetchpriority` por prop: la portada del caso va eager y high; el resto, lazy.
 * `vt` le da un nombre estático de view transition (`data-vt`, docs/diseno.md §4). Los atributos
 * sueltos (clases, `data-travel-cover`, `data-motion`) pasan a la `<img>`.
 */
import type { Media } from '~/lib/api'
import type { VtName } from '~/composables/useMotion'

const props = withDefaults(defineProps<{
  media: Media
  /** Decorativa: `alt=""`, el lector la saltea. */
  decorative?: boolean
  loading?: 'lazy' | 'eager'
  fetchpriority?: 'high' | 'low' | 'auto'
  vt?: VtName
  sizes?: string
}>(), { decorative: false, loading: 'lazy', fetchpriority: 'auto', vt: undefined, sizes: undefined })

const { langAttr } = useLocale()

const src = computed(() => (props.media.kind === 'VIDEO' ? props.media.poster : props.media.src))
</script>

<template>
  <img
    v-if="src"
    :src="src"
    :width="media.width"
    :height="media.height"
    :alt="decorative ? '' : media.alt"
    :lang="decorative ? undefined : langAttr(media, 'alt')"
    :loading="loading"
    :fetchpriority="fetchpriority"
    :decoding="loading === 'eager' ? 'auto' : 'async'"
    :sizes="sizes"
    :data-vt="vt"
  >
</template>
