<script setup lang="ts">
// Íconos utilitarios del sitio: trazo lineal de 1,5 px, sin relleno. Siempre decorativos (aria-hidden):
// el nombre accesible lo pone el botón o el enlace que los contiene.
export type IconName = 'sun' | 'moon' | 'external' | 'close' | 'menu' | 'focus' | 'download' | 'printer'

const props = withDefaults(defineProps<{
  name: IconName
  size?: number | string
  strokeWidth?: number | string
}>(), {
  size: 14,
  strokeWidth: 1.5,
})

const px = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
</script>

<template>
  <svg
    class="inline-block shrink-0 align-middle"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :style="{ width: px, height: px }"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </template>
    <path v-else-if="name === 'moon'" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    <path v-else-if="name === 'external'" d="M7 17 17 7M8 7h9v9" />
    <path v-else-if="name === 'close'" d="M18 6 6 18M6 6l12 12" />
    <path v-else-if="name === 'menu'" d="M4 8h16M4 16h16" />
    <!-- Hiperfoco: un visor que encuadra lo que se lee. -->
    <template v-else-if="name === 'focus'">
      <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
      <circle cx="12" cy="12" r="1.5" />
    </template>
    <template v-else-if="name === 'download'">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5M12 15V3" />
    </template>
    <template v-else-if="name === 'printer'">
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect width="12" height="8" x="6" y="14" />
    </template>
  </svg>
</template>
