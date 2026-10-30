<script setup lang="ts">
/**
 * El proceso: cada paso con su título, su cuerpo en líneas que se revelan y su pieza, si la tiene. La
 * base numera los títulos («01 · encargo»); el diseño no numera rótulos (docs/diseno.md §3), así que se
 * lee «Encargo». El registro muestra el título tal como está guardado.
 */
import type { ProcessStep } from '~/lib/api'

defineProps<{ steps: ProcessStep[] }>()

const { lang, langAttr } = useLocale()

/** «01 · encargo» → «Encargo». */
function heading(title: string) {
  const bare = title.replace(/^\s*\d+\s*[·.\-/]\s*/, '').trim() || title
  return bare.charAt(0).toLocaleUpperCase(lang.value) + bare.slice(1)
}
</script>

<template>
  <RecordField v-slot="{ fv }" collection="projects" k="steps" :value="steps">
    <ol class="flex flex-col gap-[clamp(2rem,6vh,3.5rem)]">
      <li v-for="step in steps" :key="step.order" class="flex flex-col gap-2">
        <h3 :class="fv" class="text-m font-title text-ink" :lang="langAttr(step, 'title')">
          {{ heading(step.title) }}
        </h3>
        <RevealLines :text="step.body" class="max-w-read text-l" :lang="langAttr(step, 'body')" />
        <CaseGallery v-if="step.media" :items="[step.media]" class="mt-6" />
      </li>
    </ol>
  </RecordField>
</template>
