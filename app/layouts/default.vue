<script setup lang="ts">
// Esqueleto del sitio: salto al contenido y la región principal. F3 suma cabecera, pie y paleta.
const { t } = useLocale()
</script>

<template>
  <div class="min-h-dvh">
    <a
      data-chrome
      href="#contenido"
      class="fixed top-2 left-2 z-50 -translate-y-[200%] rounded-sm bg-ink px-3.5 py-2 text-s text-bg no-underline transition-transform duration-150 focus-visible:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sig-text"
    >
      {{ t('shell.skip') }}
    </a>
    <main id="contenido" tabindex="-1" class="outline-none">
      <slot />
    </main>
  </div>
</template>
