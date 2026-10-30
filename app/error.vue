<script setup lang="ts">
// 404 (página u obra que no existe o no se publica) y 503 (la API o la base no responden).
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const { t, localeRoute } = useLocale()
const router = useRouter()

const status = computed(() => (props.error.statusCode === 404 ? 404 : 503))
const home = computed(() => router.resolve(localeRoute('/')).href)

if (import.meta.server) setResponseStatus(useRequestEvent()!, status.value)

useHead({
  title: computed(() => t(status.value === 404 ? 'error.404.title' : 'error.503.title')),
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
        {{ t(status === 404 ? 'error.404.title' : 'error.503.title') }}
      </h1>
      <p class="max-w-[58ch] text-m text-dim">
        {{ t(status === 404 ? 'error.404.body' : 'error.503.body') }}
      </p>
      <a :href="home" class="w-fit text-m text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sig-text" @click.prevent="goHome">
        {{ t('error.home') }}
      </a>
    </section>
  </NuxtLayout>
</template>
