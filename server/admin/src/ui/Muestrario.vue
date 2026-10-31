<script setup lang="ts">
/**
 * #/muestrario, solo con `pnpm dev:admin` (import.meta.env.DEV): cada componente base con sus estados,
 * sobre datos reales de la API pública. Sirve para revisar look, teclado y accesibilidad en un lugar.
 */
import { computed, onMounted } from 'vue'
import { ui } from './dict'
import ControlsSamples from './muestrario/ControlsSamples.vue'
import FeedbackSamples from './muestrario/FeedbackSamples.vue'
import FieldsSamples from './muestrario/FieldsSamples.vue'
import NavigationSamples from './muestrario/NavigationSamples.vue'
import { useSampleProjects } from './muestrario/useSampleProjects'

const { items, loading, error, load } = useSampleProjects()
const first = computed(() => items.value[0] ?? null)

onMounted(() => {
  document.title = `${ui.muestrario.title} · ${ui.app.title}`
  void load()
})
</script>

<template>
  <main class="mx-auto max-w-[1180px] px-4 pt-14 pb-24 sm:px-16">
    <header class="grid max-w-[1080px] gap-4 pb-12">
      <p class="m-0 text-label text-faint">
        {{ ui.app.name }} · {{ ui.app.area }}
      </p>
      <h1 class="m-0 animate-rise text-display">
        {{ ui.muestrario.title }}
      </h1>
      <p class="m-0 max-w-[64ch] animate-rise text-lead text-dim stagger [--i:2]">
        {{ ui.muestrario.lead }}
      </p>
    </header>
    <ControlsSamples :project="first" />
    <!-- Los campos arrancan con la primera obra: se montan cuando llegó la lista. -->
    <FieldsSamples v-if="!loading" :key="items.length" :projects="items" />
    <NavigationSamples :projects="items" :loading="loading" :error="error" @retry="load" />
    <FeedbackSamples :project="first" />
  </main>
</template>
