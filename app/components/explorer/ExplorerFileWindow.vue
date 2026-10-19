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
    class="ventana-archivo-chassis w-full max-w-[1040px] mx-auto rounded-xl border border-rule bg-surface/40 backdrop-blur-sm flex flex-col transition-all duration-200 overflow-hidden"
    :class="{ 'maximized !fixed !inset-2.5 !z-[999] !w-auto !max-w-none !h-auto !shadow-[0_25px_60px_rgba(0,0,0,0.7)]': isMaximized }"
  >
    <!-- Barra Superior de la Ventana OS / Linear Document Surface -->
    <header class="va-titlebar flex-none h-9 flex items-center justify-between gap-3 px-3.5 bg-surface/80 border-b border-rule select-none">
      <!-- Botón Volver / Cerrar sutil y táctil con Esc -->
      <div class="va-controls flex items-center gap-2">
        <button
          type="button"
          class="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-paper/80 border border-rule text-dim hover:text-ink hover:border-rule-strong active:scale-[0.98] transition-colors cursor-pointer shrink-0"
          :title="isEs ? 'Volver / Cerrar archivo (Esc)' : 'Back / Close file (Esc)'"
          :aria-label="isEs ? 'Cerrar' : 'Close'"
          @click="onClose"
        >
          <AppIcon name="arrow-left" :size="12" />
          <span class="font-mono text-[11px] text-dim group-hover:text-ink">esc</span>
        </button>
      </div>

      <!-- Título y Ruta del Archivo (Centro/Izquierda con punto quirúrgico bg-sig) -->
      <div class="va-path-info flex items-center gap-2 min-w-0 overflow-hidden font-mono text-[11px] text-dim flex-1">
        <span class="w-1.5 h-1.5 rounded-full bg-sig shrink-0" aria-hidden="true" />
        <span class="va-filename font-semibold text-ink truncate">{{ title }}</span>
        <span v-if="path" class="va-canonical-path text-dim/70 whitespace-nowrap overflow-hidden text-ellipsis hidden sm:inline">{{ path }}</span>
      </div>

      <!-- Lado Derecho: Status Tag y Botón Maximizar -->
      <div class="flex items-center gap-2 shrink-0">
        <div class="va-status-tag hidden sm:flex items-center gap-1.5 rounded-md bg-paper/70 border border-rule px-2 py-0.5 font-mono text-[10px] text-dim shrink-0">
          <span class="va-dot w-1.5 h-1.5 rounded-full bg-green" />
          <span class="va-status-text font-medium">{{ badge ?? 'READ-ONLY · UTF-8' }}</span>
        </div>
        <button
          type="button"
          class="va-btn maximize inline-flex items-center justify-center w-6 h-6 rounded bg-paper/80 border border-rule text-dim hover:text-ink hover:border-rule-strong active:scale-[0.98] transition-colors cursor-pointer"
          :title="isMaximized ? (isEs ? 'Restaurar tamaño normal' : 'Restore normal size') : (isEs ? 'Maximizar ventana' : 'Maximize window')"
          :aria-label="isEs ? 'Maximizar' : 'Maximize'"
          @click="isMaximized = !isMaximized"
        >
          <AppIcon :name="isMaximized ? 'minimize' : 'maximize'" :size="11" />
        </button>
      </div>
    </header>

    <!-- Contenido del Archivo -->
    <div class="va-body flex-1 min-h-0 p-4 sm:p-6 md:p-8 overflow-y-auto">
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
