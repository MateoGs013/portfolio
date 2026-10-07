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
    class="ventana-archivo-chassis w-full border border-rule-strong bg-paper shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex flex-col transition-all duration-200"
    :class="{ 'maximized !fixed !inset-2.5 !z-[999] !w-auto !h-auto !shadow-[0_25px_60px_rgba(0,0,0,0.7)]': isMaximized }"
  >
    <!-- Barra Superior de la Ventana OS -->
    <header class="va-titlebar flex-none h-[38px] flex items-center justify-between gap-3 px-3 bg-surface-raised border-b border-rule select-none">
      <!-- Controles de Ventana (Semáforo / OS buttons) -->
      <div class="va-controls flex items-center gap-1.5 group" role="group" :aria-label="isEs ? 'Controles de ventana' : 'Window controls'">
        <button
          type="button"
          class="va-btn close w-3.5 h-3.5 rounded-full border border-[#e0443e] bg-[#ff5f56] text-[#5c0000] flex items-center justify-center cursor-pointer p-0 transition-colors"
          :title="isEs ? 'Cerrar archivo (Esc)' : 'Close file (Esc)'"
          :aria-label="isEs ? 'Cerrar' : 'Close'"
          @click="onClose"
        >
          <AppIcon name="close" :size="9" class="opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
        </button>
        <button
          type="button"
          class="va-btn minimize w-3.5 h-3.5 rounded-full border border-[#dea123] bg-[#ffbd2e] text-[#614400] flex items-center justify-center cursor-pointer p-0 transition-colors"
          :title="isEs ? 'Minimizar archivo' : 'Minimize file'"
          :aria-label="isEs ? 'Minimizar' : 'Minimize'"
          @click="onClose"
        >
          <AppIcon name="minimize" :size="9" class="opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
        </button>
        <button
          type="button"
          class="va-btn maximize w-3.5 h-3.5 rounded-full border border-[#1aab29] bg-[#27c93f] text-[#004d10] flex items-center justify-center cursor-pointer p-0 transition-colors"
          :title="isMaximized ? (isEs ? 'Restaurar tamaño normal' : 'Restore normal size') : (isEs ? 'Maximizar ventana' : 'Maximize window')"
          :aria-label="isEs ? 'Maximizar' : 'Maximize'"
          @click="isMaximized = !isMaximized"
        >
          <AppIcon name="maximize" :size="9" class="opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
        </button>
      </div>

      <!-- Título y Ruta del Archivo -->
      <div class="va-path-info flex items-center gap-2 min-w-0 overflow-hidden font-mono text-[11.5px]">
        <AppIcon name="file" :size="13" class="va-file-icon text-sig shrink-0" />
        <span class="va-filename font-bold text-ink whitespace-nowrap">{{ title }}</span>
        <span v-if="path" class="va-canonical-path text-dim whitespace-nowrap overflow-hidden text-ellipsis text-[11px] max-sm:hidden">{{ path }}</span>
      </div>

      <!-- Badge de Estado en la Ventana -->
      <div class="va-status-tag flex items-center gap-1.5 px-2 py-0.5 bg-paper border border-rule font-mono text-[10px] text-dim shrink-0 max-sm:hidden">
        <span class="va-dot w-1.5 h-1.5 rounded-full bg-green" />
        <span class="va-status-text font-bold">{{ badge ?? 'READ-ONLY · UTF-8' }}</span>
      </div>
    </header>

    <!-- Contenido del Archivo -->
    <div class="va-body flex-1 min-h-0 p-5 max-sm:p-3 overflow-y-auto">
      <slot />
    </div>
  </div>
</template>
