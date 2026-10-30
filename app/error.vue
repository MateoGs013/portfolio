<script setup lang="ts">
// 404 (página u obra que no existe o no se publica), 503 (la API o la base no responden: 502/503) y 500
// (cualquier otro error, con un texto neutro: no es una caída de la base).
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const { t, localeRoute } = useLocale()
const router = useRouter()

const status = computed<404 | 500 | 503>(() => {
  const code = props.error.statusCode
  if (code === 404) return 404
  return code === 502 || code === 503 ? 503 : 500
})
const key = computed(() => `error.${status.value}` as const)
const home = computed(() => router.resolve(localeRoute('/')).href)

if (import.meta.server) setResponseStatus(useRequestEvent()!, status.value)

useHead({
  title: computed(() => t(`${key.value}.title`)),
  meta: [{ name: 'robots', content: 'noindex' }],
})

function goHome() {
  clearError({ redirect: home.value })
}
</script>

<template>
  <NuxtLayout>
    <section class="flex min-h-dvh flex-col justify-center gap-6 px-(--pad)">
      <p class="text-s text-dim">
        {{ status }}
      </p>
      <h1 class="max-w-[26ch] text-hero font-medium tracking-tight text-ink">
        {{ t(`${key}.title`) }}
      </h1>
      <p class="max-w-[58ch] text-m text-dim">
        {{ t(`${key}.body`) }}
      </p>
      <a :href="home" class="w-fit text-m text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sig-text" @click.prevent="goHome">
        {{ t('error.home') }}
      </a>
    </section>
  </NuxtLayout>
</template>
