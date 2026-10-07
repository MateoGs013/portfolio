<script setup lang="ts">
// Layout por defecto del portafolio técnico Mateo Sonzogni
</script>

<template>
  <div class="min-h-dvh">
    <a
      class="fixed z-[999] top-2 left-2 px-3.5 py-2 bg-ink text-paper font-sans text-[13px] no-underline rounded -translate-y-[200%] transition-transform duration-150 focus-visible:translate-y-0 focus-visible:outline-2 focus-visible:outline-sig focus-visible:outline-offset-2"
      href="#contenido"
    >
      saltar al contenido
    </a>
    <slot />
  </div>
</template>
