<script setup lang="ts">
// Marco de todas las páginas: salto al contenido, cabecera, los bordes de lectura (SiteEdge), la página,
// el pie de contacto, la paleta
// (diferida hasta que se pide) y la única región aria-live, que también anuncia la página nueva al
// navegar (en lugar de NuxtRouteAnnouncer). Monta los atajos de teclado.
// La fuente se precarga acá: error.vue también usa este layout.
const { t } = useLocale()
const { message, announce } = useAnnounce()
const { requested } = usePalette()

usePreloadFonts()
useHotkeys()

const nuxtApp = useNuxtApp()
/** Al llegar a otra página se anuncia su h1 (o el título, si no tiene): el lector sabe dónde está. */
const stop = nuxtApp.hook('page:finish', () => {
  if (nuxtApp.isHydrating) return
  // El texto accesible del h1: sin lo que está aria-hidden (las letras del nombre del inicio repiten su sr-only).
  const h1 = document.querySelector('#contenido h1')?.cloneNode(true) as HTMLElement | undefined
  h1?.querySelectorAll('[aria-hidden="true"]').forEach(node => node.remove())
  const heading = h1?.textContent?.replace(/\s+/g, ' ').trim()
  announce(heading || document.title)
})
onBeforeUnmount(stop)
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <a
      data-chrome
      href="#contenido"
      class="fixed top-2 left-2 z-50 inline-flex min-h-11 -translate-y-[200%] items-center rounded-sm bg-ink px-3.5 py-2 text-s text-bg no-underline transition-transform duration-150 focus-visible:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sig-text"
    >
      {{ t('shell.skip') }}
    </a>
    <SiteEdge side="top" />
    <SiteHeader />
    <main id="contenido" tabindex="-1" class="flex-1 outline-none">
      <slot />
    </main>
    <SiteFooter />
    <SiteEdge side="bottom" />
    <LazySitePalette v-if="requested" />
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {{ message }}
    </p>
  </div>
</template>
