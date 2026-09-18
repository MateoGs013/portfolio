<script setup lang="ts">
// Componente de Iconografía Minimalista Lineal — Sistema DATOS
// Vectores SVG limpios, stroke-only (1.5px), fill=none, sin emojis.
export type IconName =
  | 'db'
  | 'folder'
  | 'file'
  | 'code'
  | 'user'
  | 'academic'
  | 'printer'
  | 'mail'
  | 'globe'
  | 'briefcase'
  | 'pin'
  | 'clock'
  | 'copy'
  | 'check'
  | 'sun'
  | 'moon'
  | 'grid'
  | 'table'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'chevron-right'
  | 'chevron-left'
  | 'external'
  | 'close'
  | 'minimize'
  | 'maximize'
  | 'target'
  | 'search'
  | 'zap'
  | 'languages'
  | 'help'
  | 'info'
  | 'download'

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
    class="d-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :style="{ width: px, height: px }"
    aria-hidden="true"
  >
    <!-- Base de datos / Sistema -->
    <template v-if="name === 'db'">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </template>

    <!-- Carpeta -->
    <template v-else-if="name === 'folder'">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </template>

    <!-- Documento / Ficha / Archivo -->
    <template v-else-if="name === 'file'">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </template>

    <!-- Código </> -->
    <template v-else-if="name === 'code'">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </template>

    <!-- Usuario / Perfil -->
    <template v-else-if="name === 'user'">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </template>

    <!-- Academia / Educación / Harvard -->
    <template v-else-if="name === 'academic'">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </template>

    <!-- Impresora / PDF -->
    <template v-else-if="name === 'printer'">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect width="12" height="8" x="6" y="14" />
    </template>

    <!-- Correo / Mail -->
    <template v-else-if="name === 'mail'">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </template>

    <!-- Globo / Red mundial -->
    <template v-else-if="name === 'globe'">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </template>

    <!-- Maletín / Experiencia -->
    <template v-else-if="name === 'briefcase'">
      <rect width="20" height="14" x="2" y="7" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </template>

    <!-- Ubicación / Pin -->
    <template v-else-if="name === 'pin'">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </template>

    <!-- Reloj / Timezone -->
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </template>

    <!-- Copiar -->
    <template v-else-if="name === 'copy'">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </template>

    <!-- Chequeado / Confirmado -->
    <template v-else-if="name === 'check'">
      <polyline points="20 6 9 17 4 12" />
    </template>

    <!-- Sol (Modo Claro) -->
    <template v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </template>

    <!-- Luna (Modo Oscuro) -->
    <template v-else-if="name === 'moon'">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </template>

    <!-- Cuadrícula / Grid -->
    <template v-else-if="name === 'grid'">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </template>

    <!-- Tabla -->
    <template v-else-if="name === 'table'">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </template>

    <!-- Flechas Navegación -->
    <template v-else-if="name === 'arrow-left'">
      <path d="m12 19-7-7 7-7M19 12H5" />
    </template>
    <template v-else-if="name === 'arrow-right'">
      <path d="m12 5 7 7-7 7M5 12h14" />
    </template>
    <template v-else-if="name === 'arrow-up'">
      <path d="m5 12 7-7 7 7M12 19V5" />
    </template>
    <template v-else-if="name === 'chevron-right'">
      <path d="m9 18 6-6-6-6" />
    </template>
    <template v-else-if="name === 'chevron-left'">
      <path d="m15 18-6-6 6-6" />
    </template>
    <template v-else-if="name === 'external'">
      <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </template>

    <!-- Controles Ventana -->
    <template v-else-if="name === 'close'">
      <path d="M18 6 6 18M6 6l12 12" />
    </template>
    <template v-else-if="name === 'minimize'">
      <path d="M5 12h14" />
    </template>
    <template v-else-if="name === 'maximize'">
      <rect width="16" height="16" x="4" y="4" rx="1" />
    </template>

    <!-- Crosshair / Target -->
    <template v-else-if="name === 'target'">
      <circle cx="12" cy="12" r="10" />
      <line x1="22" x2="18" y1="12" y2="12" />
      <line x1="6" x2="2" y1="12" y2="12" />
      <line x1="12" x2="12" y1="6" y2="2" />
      <line x1="12" x2="12" y1="22" y2="18" />
    </template>

    <!-- Búsqueda / Search -->
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </template>

    <!-- Hiperfoco / Zap -->
    <template v-else-if="name === 'zap'">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </template>

    <!-- Idiomas / Languages -->
    <template v-else-if="name === 'languages'">
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </template>

    <!-- Ayuda / Help -->
    <template v-else-if="name === 'help'">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </template>

    <!-- Info -->
    <template v-else-if="name === 'info'">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="16" y2="12" />
      <line x1="12" x2="12.01" y1="8" y2="8" />
    </template>

    <!-- Descargar / Download -->
    <template v-else-if="name === 'download'">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </template>
  </svg>
</template>

<style scoped>
.d-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
  transition: transform 0.15s ease, stroke 0.15s ease;
}
</style>
