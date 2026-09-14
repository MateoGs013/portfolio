<script setup lang="ts">
// Chasis de Ventana OS para Archivos, Registros y Documentos.
// Simula la apertura interactiva de archivos en un sistema operativo / IDE técnico:
// - Controles de ventana [ — ][ □ ][ ✕ ]
// - Barra de ruta técnica tipo file://
// - Animación de expansión al abrir (simular-apertura)
// - Cierre interactivo con Esc o clic en ✕ que retorna al explorador.

import type { RouteLocationRaw } from 'vue-router'
import DatosIcon from './DatosIcon.vue'

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
  <div class="ventana-archivo-chassis" :class="{ maximized: isMaximized }">
    <!-- Barra Superior de la Ventana OS -->
    <header class="va-titlebar">
      <!-- Controles de Ventana (Semáforo / OS buttons) -->
      <div class="va-controls" role="group" :aria-label="isEs ? 'Controles de ventana' : 'Window controls'">
        <button
          type="button"
          class="va-btn close"
          :title="isEs ? 'Cerrar archivo (Esc)' : 'Close file (Esc)'"
          :aria-label="isEs ? 'Cerrar' : 'Close'"
          @click="onClose"
        >
          <DatosIcon name="close" :size="9" />
        </button>
        <button
          type="button"
          class="va-btn minimize"
          :title="isEs ? 'Minimizar archivo' : 'Minimize file'"
          :aria-label="isEs ? 'Minimizar' : 'Minimize'"
          @click="onClose"
        >
          <DatosIcon name="minimize" :size="9" />
        </button>
        <button
          type="button"
          class="va-btn maximize"
          :title="isMaximized ? (isEs ? 'Restaurar tamaño normal' : 'Restore normal size') : (isEs ? 'Maximizar ventana' : 'Maximize window')"
          :aria-label="isEs ? 'Maximizar' : 'Maximize'"
          @click="isMaximized = !isMaximized"
        >
          <DatosIcon name="maximize" :size="9" />
        </button>
      </div>

      <!-- Título y Ruta del Archivo -->
      <div class="va-path-info">
        <DatosIcon name="file" :size="13" class="va-file-icon" />
        <span class="va-filename">{{ title }}</span>
        <span v-if="path" class="va-canonical-path">{{ path }}</span>
      </div>

      <!-- Badge de Estado en la Ventana -->
      <div class="va-status-tag">
        <span class="va-dot" />
        <span class="va-status-text">{{ badge ?? 'READ-ONLY · UTF-8' }}</span>
      </div>
    </header>

    <!-- Contenido del Archivo -->
    <div class="va-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ventana-archivo-chassis {
  width: 100%;
  border: 1px solid var(--d-rule-strong);
  background: var(--d-paper);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  animation: simular-apertura 240ms cubic-bezier(0.16, 1, 0.3, 1) both;
  transition: all 0.2s ease;
}

.ventana-archivo-chassis.maximized {
  position: fixed;
  inset: 10px;
  z-index: 999;
  width: auto;
  height: auto;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
}

@keyframes simular-apertura {
  0% {
    opacity: 0;
    transform: translateY(16px) scale(0.985);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Barra de Título OS */
.va-titlebar {
  flex: none;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 12px;
  background: var(--d-surface-raised);
  border-bottom: 1px solid var(--d-rule);
  user-select: none;
}

/* Botones de Ventana */
.va-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}
.va-btn {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;
}
.va-btn :deep(.d-icon) {
  opacity: 0;
  transition: opacity 0.15s ease;
}
.va-controls:hover .va-btn :deep(.d-icon) {
  opacity: 1;
}

.va-btn.close {
  background: #ff5f56;
  border-color: #e0443e;
  color: #5c0000;
}
.va-btn.minimize {
  background: #ffbd2e;
  border-color: #dea123;
  color: #614400;
}
.va-btn.maximize {
  background: #27c93f;
  border-color: #1aab29;
  color: #004d10;
}

/* Ruta del Archivo */
.va-path-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: 11.5px;
}
.va-file-icon {
  color: var(--d-sig);
  flex-shrink: 0;
}
.va-filename {
  font-weight: 700;
  color: var(--d-ink);
  white-space: nowrap;
}
.va-canonical-path {
  color: var(--d-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
}

/* Badge de Estado */
.va-status-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  background: var(--d-paper);
  border: 1px solid var(--d-rule);
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--d-dim);
  flex-shrink: 0;
}
.va-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--d-green);
}
.va-status-text {
  font-weight: 700;
}

/* Cuerpo de la Ventana */
.va-body {
  flex: 1;
  min-height: 0;
  padding: 20px;
  overflow-y: auto;
}

@media (max-width: 600px) {
  .va-canonical-path, .va-status-tag {
    display: none;
  }
  .va-body {
    padding: 12px;
  }
}
</style>
