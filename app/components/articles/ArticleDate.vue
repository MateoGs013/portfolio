<script setup lang="ts">
// Fecha de publicación de un artículo, escrita en el idioma de la página («12 de octubre de 2026»).
// En UTC: el SSR y el navegador escriben el mismo día, sea cual sea la zona del visitante.
const props = defineProps<{
  /** ISO completo (publishedAt). */
  value: string
}>()

const { lang } = useLocale()
const locales = { es: 'es-AR', en: 'en-US' } as const

const label = computed(() => new Intl.DateTimeFormat(locales[lang.value], {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(props.value)))
</script>

<template>
  <time :datetime="value.slice(0, 10)">{{ label }}</time>
</template>
