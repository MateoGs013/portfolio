<script setup lang="ts">
// Chasis de Ventana OS para Archivos, Registros y Documentos.
// Simula la apertura interactiva de archivos en un sistema operativo / IDE técnico:
// - Controles de ventana [ — ][ □ ][ ✕ ]
// - Barra de ruta técnica tipo file://
// - Animación de expansión al abrir (simular-apertura)
// - Cierre interactivo con Esc o clic en ✕ que retorna al explorador.

import type { RouteLocationRaw } from 'vue-router'
import AppIcon from '~/components/ui/AppIcon.vue'

const { isEs } = usePortfolioLocale()

const props = defineProps<{
  title: string
  path?: string
  badge?: string
  parentUrl?: RouteLocationRaw | null
}>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const isMaximized = ref(false)

function onClose() {
  emit('close')
  if (props.parentUrl) {
    navigateTo(props.parentUrl)
  }
  else {
    router.back()
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    onClose()
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', onKey)
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', onKey)
  }
})
</script>

<template>
  <div
    class="ventana-archivo-chassis w-full max-w-[1140px] mx-auto flex flex-col transition-all duration-200"
    :class="{ 'maximized !fixed !inset-2.5 !z-[999] !w-auto !max-w-none !h-auto !bg-paper !border !border-rule !rounded-2xl !shadow-[0_25px_60px_rgba(0,0,0,0.7)]': isMaximized }"
  >
    <!-- Barra Editorial Superior Awwwards Case Study (Swiss Architectural Header) -->
    <header class="va-titlebar flex-none h-11 flex items-center justify-between gap-4 pb-3 mb-2 border-b border-rule select-none">
      <!-- Botón Volver Editorial (← Volver / Back) -->
      <div class="va-controls flex items-center gap-3">
        <button
          type="button"
          class="group inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface hover:bg-hover border border-rule hover:border-rule-strong text-dim hover:text-ink active:scale-[0.98] transition-all cursor-pointer shrink-0"
          :title="isEs ? 'Volver al índice (Esc)' : 'Back to index (Esc)'"
          :aria-label="isEs ? 'Cerrar' : 'Close'"
          @click="onClose"
        >
          <AppIcon name="arrow-left" :size="12" class="transition-transform group-hover:-translate-x-0.5" />
          <span class="font-sans text-[12px] font-medium text-ink">{{ isEs ? 'Volver' : 'Back' }}</span>
          <kbd class="font-mono text-[10px] text-faint ml-0.5">esc</kbd>
        </button>
      </div>

      <!-- Identificador Contextual del Caso de Estudio (Sin rutas file:// de IDE) -->
      <div class="va-path-info flex items-center gap-2 min-w-0 overflow-hidden font-mono text-[11px] text-dim flex-1">
        <span class="w-1.5 h-1.5 rounded-full bg-sig shrink-0" aria-hidden="true" />
        <span class="va-filename font-medium text-dim uppercase tracking-wider truncate">{{ title }}</span>
      </div>

      <!-- Lado Derecho: Maximizar Vista -->
      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          class="va-btn maximize inline-flex items-center justify-center w-7 h-7 rounded-full bg-surface hover:bg-hover border border-rule text-dim hover:text-ink hover:border-rule-strong active:scale-[0.98] transition-colors cursor-pointer"
          :title="isMaximized ? (isEs ? 'Restaurar tamaño normal' : 'Restore normal size') : (isEs ? 'Expandir vista' : 'Expand view')"
          :aria-label="isEs ? 'Maximizar' : 'Maximize'"
          @click="isMaximized = !isMaximized"
        >
          <AppIcon :name="isMaximized ? 'minimize' : 'maximize'" :size="11" />
        </button>
      </div>
    </header>

    <!-- Contenido Editorial del Caso de Estudio -->
    <div class="va-body flex-1 min-h-0 py-3 sm:py-5 overflow-y-auto">
      <slot />
    </div>
  </div>
</template>

<style scoped>
@media print {
  .va-titlebar {
    display: none !important;
  }
  .ventana-archivo-chassis {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    max-width: none !important;
    border-radius: 0 !important;
    overflow: visible !important;
  }
  .va-body {
    padding: 0 !important;
    overflow: visible !important;
  }
}
</style>
