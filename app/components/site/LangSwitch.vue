<script setup lang="ts">
// Idioma: enlaces reales a la misma página con `?lang=en` o sin él, así funciona sin JS y cada idioma
// tiene su dirección. El nombre accesible empieza por el código visible y sigue con el idioma en su lengua.
import { langs, type Lang } from '~/lib/dict'
import { withLang } from '~/composables/useLocale'

const route = useRoute()
const { t, lang } = useLocale()

const options = computed(() => langs.map((l: Lang) => ({
  lang: l,
  to: { path: route.path, hash: route.hash, query: withLang(route.query, l) },
  current: l === lang.value,
})))
</script>

<template>
  <div role="group" :aria-label="t('shell.lang')" class="flex items-center gap-3">
    <NuxtLink
      v-for="o in options"
      :key="o.lang"
      :to="o.to"
      :lang="o.lang"
      :hreflang="o.lang"
      :aria-current="o.current ? 'true' : undefined"
      class="inline-flex min-h-6 items-center uppercase opacity-72 transition-opacity duration-300 hover:opacity-100 aria-[current]:opacity-100 aria-[current]:underline aria-[current]:decoration-1 aria-[current]:underline-offset-4"
    >
      {{ o.lang }}<span class="sr-only"> ({{ t(`shell.autonym.${o.lang}`) }})</span>
    </NuxtLink>
  </div>
</template>
