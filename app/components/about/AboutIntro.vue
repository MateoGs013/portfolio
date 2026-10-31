<script setup lang="ts">
/**
 * Cabeza de Sobre mí: el título de página (par `page-title` de la palabra del menú) con el retrato
 * de about.portrait a su lado, y la filosofía (about.engineering_philosophy) como la frase grande
 * cuyas palabras se encienden al leerla (movimiento.html, vAbout). El retrato se mueve ±6 % dentro de
 * su marco (parallax, ambiental). Todo sale del documento about; sin él no se dibuja nada.
 */
import gsap from 'gsap'
import type { SiteDoc } from '~/composables/useSiteContent'

const props = defineProps<{ about: SiteDoc | null }>()

const { t, langAttr } = useLocale()

const portrait = computed(() => docText(props.about, 'portrait'))
const philosophy = computed(() => docText(props.about, 'engineering_philosophy'))

const frame = useTemplateRef<HTMLElement>('frame')

useMotion(frame, ({ el, ambient }) => {
  const img = el.querySelector('img')
  if (!ambient || !img) return
  gsap.fromTo(img, { yPercent: -6 }, {
    yPercent: 6,
    ease: 'none',
    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
  })
  // El tween y su ScrollTrigger se revierten con la escena: no hay limpieza propia.
  return undefined
})
</script>

<template>
  <header class="flex flex-wrap items-end justify-between gap-x-8 gap-y-6 px-pad pt-[clamp(7rem,22vh,12rem)] pb-[clamp(2rem,6vh,4rem)] record:block record:space-y-12">
    <PageTitle :title="t('nav.about')" class="focus-mode:text-display-row" />

    <RecordField collection="about" k="portrait" :value="portrait" :record="about">
      <template #default="{ fv }">
        <figure
          ref="frame"
          data-motion
          :class="fv"
          class="relative aspect-[4/5] w-[clamp(5.5rem,15vw,15rem)] shrink-0 overflow-hidden rounded-[3px] bg-surface"
        >
          <img
            :src="portrait ?? undefined"
            :alt="docText(about, 'portrait_alt') ?? ''"
            :lang="langAttr(about, 'portrait_alt')"
            decoding="async"
            class="absolute -top-[6%] left-0 h-[112%] w-full object-cover"
          >
        </figure>
      </template>
    </RecordField>
  </header>

  <section v-if="philosophy" class="px-pad">
    <RecordField collection="about" k="engineering_philosophy" :value="philosophy" :record="about">
      <template #default="{ fv }">
        <ScrubWords :text="philosophy" :class="fv" class="max-w-phrase text-hero text-ink" />
      </template>
    </RecordField>
  </section>
</template>
