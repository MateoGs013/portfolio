<script setup lang="ts">
/**
 * El nombre monumental del inicio (`about.display_name`): una palabra por línea, partida en letras
 * por el SSR. Cada letra va en su máscara (`chm`) y con `aria-hidden`; el lector lee el nombre entero
 * del `sr-only`. El cuadrado en `--sig` es decorativo (`data-ornament`).
 *
 * Deslizar (docs/diseno.md §2 y §6): solo al cargar la página, sin cargador (`html[data-intro]`) y con
 * movimiento ambiental, las letras suben desde su máscara (1,1 s `expo.out`, 0,025 s por letra). Es la
 * única excepción a «el texto nunca nace invisible»: el nombre llega pintado en el SSR (es el LCP) y
 * la animación arranca después. Al llegar por navegación, o al volver a armar la escena (registro,
 * Hiperfoco), no se anima. En la primera visita lo trae el cargador (IntroLoader) con FLIP.
 */
import gsap from 'gsap'
import type { SiteDoc } from '~/composables/useSiteContent'

const props = defineProps<{
  about: SiteDoc | null
}>()

const name = computed(() => docText(props.about, 'display_name') ?? '')
/** Palabras como listas de letras: cada palabra es una línea del nombre. */
const words = computed(() => name.value.split(/\s+/).filter(Boolean).map(word => [...word]))

const nuxtApp = useNuxtApp()
const { isRecord } = useRecordView()
const loaded = import.meta.client && nuxtApp.isHydrating
let played = false

const root = useTemplateRef<HTMLElement>('root')

useMotion(root, ({ el, ambient }) => {
  const first = !played
  played = true
  if (!first || !loaded || !ambient || isRecord.value) return
  if (document.documentElement.hasAttribute('data-intro')) return
  gsap.from(el.querySelectorAll('.ch'), { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.025 })
  return undefined
})
</script>

<template>
  <RecordField v-slot="{ fv }" collection="about" k="display_name" :value="name" :record="about" shared>
    <h1
      ref="root"
      tabindex="-1"
      :class="fv"
      class="-ml-[.045em] text-display-name text-ink focus-mode:text-display-row record:ml-0"
    >
      <span class="sr-only">{{ name }}</span>
      <span aria-hidden="true">
        <span v-for="(word, w) in words" :key="w" class="block whitespace-nowrap record:inline">
          <template v-if="w > 0">{{ ' ' }}</template>
          <span v-for="(ch, i) in word" :key="i" class="chm"><span class="ch inline-block">{{ ch }}</span></span>
          <span
            v-if="w === words.length - 1"
            data-ornament
            data-hf="hide"
            class="ml-[.04em] inline-block size-[.13em] bg-sig"
          />
        </span>
      </span>
    </h1>
  </RecordField>
</template>
