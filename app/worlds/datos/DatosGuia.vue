<script setup lang="ts">
// Guía de Orientación Rápida y Tutorial No Invasivo — Sistema DATOS
// Brinda orientación contextual en 3 pasos clave sin bloquear la pantalla ni interrumpir la navegación.
import DatosIcon from './DatosIcon.vue'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { isEs } = usePortfolioLocale()
const step = ref(0)
const showShortcuts = ref(false)

const steps = computed(() => [
  {
    tag: isEs.value ? '01 // ARQUITECTURA' : '01 // ARCHITECTURE',
    title: isEs.value ? 'Explorador de Datos Relacional' : 'Relational Data Explorer',
    icon: 'db' as const,
    desc: isEs.value
      ? 'Este sitio opera como un explorador técnico sobre PostgreSQL. La raíz es la base de datos, las secciones son carpetas y cada proyecto es una hoja de ingeniería con métricas y arquitectura real.'
      : 'This site operates as a technical explorer backed by PostgreSQL. The root is the database, sections are folders, and each project is an engineering datasheet with live architecture.',
    badge: 'SYS',
  },
  {
    tag: isEs.value ? '02 // NAVEGACIÓN' : '02 // NAVIGATION',
    title: isEs.value ? 'Control por Teclado y Clics' : 'Keyboard & Click Control',
    icon: 'code' as const,
    desc: isEs.value
      ? 'Diseñado para alta productividad: pulsa [0-5] para saltar de sección, flechas [↑ ↓] y [Enter] para abrir registros, o [/] (⌘K) para buscar cualquier tecnología o proyecto al instante.'
      : 'Built for high productivity: press [0-5] to jump sections, arrow keys [↑ ↓] and [Enter] to open records, or [/] (⌘K) to instantly search any project or tech.',
    badge: 'KBD',
  },
  {
    tag: isEs.value ? '03 // PRODUCTIVIDAD' : '03 // PRODUCTIVITY',
    title: isEs.value ? 'Modo Hiperfoco y CV Harvard' : 'Hyperfocus & Harvard CV',
    icon: 'zap' as const,
    desc: isEs.value
      ? 'Pulsa [H] o el rayo [⚡] para modo zen de lectura pura. En la sección 04 (/about) encontrarás el currículum técnico con formato dual (ATS Harvard y moderno) listo para imprimir en PDF.'
      : 'Press [H] or [⚡] for zen reading without chrome. In section 04 (/about) you will find the dual-format resume (Harvard ATS & Modern) ready to export as PDF.',
    badge: 'ZEN',
  },
])

const shortcuts = computed(() => [
  { key: '0 - 5', label: isEs.value ? 'Saltar entre secciones (db, proyectos, exp, stack...)' : 'Jump between sections (db, projects, exp, stack...)' },
  { key: '↑ ↓ ← →', label: isEs.value ? 'Mover foco entre filas / registros vecinos' : 'Move focus between rows / adjacent records' },
  { key: 'Enter', label: isEs.value ? 'Abrir carpeta o detalle del proyecto enfocado' : 'Open selected folder or project sheet' },
  { key: 'Backspace', label: isEs.value ? 'Subir un nivel en el árbol de directorios' : 'Go up one directory level' },
  { key: '/  o  ⌘K', label: isEs.value ? 'Paleta de búsqueda global "ir a"' : 'Global command palette "goto"' },
  { key: 'H', label: isEs.value ? 'Alternar Modo Hiperfoco (lectura zen)' : 'Toggle Hyperfocus mode (zen reading)' },
  { key: '?', label: isEs.value ? 'Abrir / cerrar esta guía rápida' : 'Toggle this quick guide' },
])

function next() {
  if (step.value < steps.value.length - 1) {
    step.value++
  }
  else {
    dismiss()
  }
}

function prev() {
  if (step.value > 0) step.value--
}

function dismiss() {
  if (import.meta.client) {
    localStorage.setItem('portfolio-guide-seen', 'true')
  }
  emit('close')
}
</script>

<template>
  <Transition name="guide-pop">
    <aside
      v-if="open"
      class="datos-guia"
      role="region"
      :aria-label="isEs ? 'Guía rápida de orientación' : 'Quick orientation guide'"
    >
      <!-- Cabecera de la Guía -->
      <div class="guia-header">
        <div class="guia-title-box">
          <span class="guia-indicator" />
          <span class="guia-tag">{{ isEs ? 'GUÍA RÁPIDA' : 'QUICK GUIDE' }}</span>
          <span class="guia-step-badge">{{ step + 1 }}/{{ steps.length }}</span>
        </div>
        <button
          type="button"
          class="guia-close-btn"
          :title="isEs ? 'Cerrar guía (no volverá a aparecer automáticamente)' : 'Close guide (will not show automatically again)'"
          :aria-label="isEs ? 'Cerrar guía' : 'Close guide'"
          @click="dismiss"
        >
          <DatosIcon name="close" :size="12" />
        </button>
      </div>

      <!-- Contenido del Paso Actual -->
      <div v-if="!showShortcuts" class="guia-body">
        <div class="guia-step-meta">
          <span class="guia-step-tag">{{ steps[step]?.tag }}</span>
          <span class="guia-pill-badge">{{ steps[step]?.badge }}</span>
        </div>

        <h4 class="guia-step-title">
          <DatosIcon :name="steps[step]?.icon ?? 'db'" :size="14" class="guia-step-icon" />
          {{ steps[step]?.title }}
        </h4>

        <p class="guia-step-desc">
          {{ steps[step]?.desc }}
        </p>

        <!-- Indicador de Puntos -->
        <div class="guia-dots" aria-hidden="true">
          <button
            v-for="(s, i) in steps"
            :key="i"
            type="button"
            class="guia-dot"
            :class="{ active: i === step }"
            :aria-label="`Paso ${i + 1}`"
            @click="step = i"
          />
        </div>
      </div>

      <!-- Vista Alternativa: Chuleta de Atajos de Teclado -->
      <div v-else class="guia-shortcuts-panel">
        <div class="sc-header">
          <span class="sc-title">{{ isEs ? 'ATAJOS DEL SISTEMA' : 'SYSTEM SHORTCUTS' }}</span>
        </div>
        <ul class="sc-list">
          <li v-for="sc in shortcuts" :key="sc.key" class="sc-item">
            <kbd class="sc-k">{{ sc.key }}</kbd>
            <span class="sc-label">{{ sc.label }}</span>
          </li>
        </ul>
      </div>

      <!-- Barra de Acciones Inferior -->
      <div class="guia-footer">
        <button
          type="button"
          class="guia-toggle-sc"
          @click="showShortcuts = !showShortcuts"
        >
          {{ showShortcuts ? (isEs ? '‹ Volver a tips' : '‹ Back to tips') : (isEs ? 'Ver atajos ⌨' : 'View shortcuts ⌨') }}
        </button>

        <div class="guia-nav-btns">
          <button
            v-if="!showShortcuts && step > 0"
            type="button"
            class="guia-btn guia-btn-subtle"
            @click="prev"
          >
            {{ isEs ? '‹ Ant' : '‹ Prev' }}
          </button>
          <button
            v-if="!showShortcuts"
            type="button"
            class="guia-btn guia-btn-primary"
            @click="next"
          >
            {{ step === steps.length - 1 ? (isEs ? 'Entendido ✓' : 'Done ✓') : (isEs ? 'Siguiente ›' : 'Next ›') }}
          </button>
          <button
            v-else
            type="button"
            class="guia-btn guia-btn-primary"
            @click="dismiss"
          >
            {{ isEs ? 'Cerrar ✓' : 'Close ✓' }}
          </button>
        </div>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.datos-guia {
  position: fixed;
  bottom: calc(var(--d-frame) + 32px);
  right: calc(var(--d-frame) + 16px);
  width: min(390px, calc(100vw - 32px));
  background-color: var(--d-surface);
  border: 1px solid var(--d-rule-strong);
  border-radius: 4px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.25);
  z-index: 85;
  font-family: var(--d-mono);
  overflow: hidden;
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
}

/* Header */
.guia-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--d-surface-raised);
  border-bottom: 1px solid var(--d-rule);
}

.guia-title-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.guia-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--d-accent);
  box-shadow: 0 0 8px var(--d-accent);
  animation: pulse-dot 2.5s infinite ease-in-out;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 0.6; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.15); }
}

.guia-tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--d-ink);
}

.guia-step-badge {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 2px;
  background: var(--d-rule);
  color: var(--d-dim);
  font-weight: 600;
}

.guia-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 2px;
  border: none;
  background: transparent;
  color: var(--d-dim);
  cursor: pointer;
  transition: all 0.15s ease;
}

.guia-close-btn:hover {
  background: var(--d-rule-strong);
  color: var(--d-ink);
}

/* Body */
.guia-body {
  padding: 14px 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.guia-step-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.guia-step-tag {
  font-size: 9px;
  letter-spacing: 0.06em;
  color: var(--d-accent);
  font-weight: 700;
}

.guia-pill-badge {
  font-size: 9px;
  padding: 1px 4px;
  border: 1px solid var(--d-rule-strong);
  border-radius: 2px;
  color: var(--d-dim);
}

.guia-step-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--d-ink);
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.01em;
}

.guia-step-icon {
  color: var(--d-accent);
  flex-shrink: 0;
}

.guia-step-desc {
  margin: 0;
  font-size: 11px;
  line-height: 1.55;
  color: var(--d-dim);
}

/* Dots */
.guia-dots {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.guia-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: none;
  background: var(--d-rule-strong);
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.guia-dot.active {
  background: var(--d-accent);
  width: 16px;
  border-radius: 3px;
}

/* Shortcuts Panel */
.guia-shortcuts-panel {
  padding: 12px 14px;
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sc-header {
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--d-accent);
  font-weight: 700;
  margin-bottom: 4px;
}

.sc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sc-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 10.5px;
}

.sc-k {
  display: inline-block;
  padding: 1px 5px;
  font-size: 9.5px;
  font-family: inherit;
  font-weight: 700;
  background: var(--d-surface-raised);
  border: 1px solid var(--d-rule-strong);
  border-radius: 2px;
  color: var(--d-ink);
  white-space: nowrap;
  min-width: 48px;
  text-align: center;
}

.sc-label {
  color: var(--d-dim);
  line-height: 1.4;
}

/* Footer */
.guia-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--d-surface-raised);
  border-top: 1px solid var(--d-rule);
}

.guia-toggle-sc {
  background: transparent;
  border: none;
  font-size: 10px;
  font-family: inherit;
  color: var(--d-dim);
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 2px;
  transition: color 0.15s ease;
}

.guia-toggle-sc:hover {
  color: var(--d-accent);
}

.guia-nav-btns {
  display: flex;
  align-items: center;
  gap: 6px;
}

.guia-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  font-size: 10.5px;
  font-family: inherit;
  font-weight: 600;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.guia-btn-subtle {
  background: transparent;
  border-color: var(--d-rule);
  color: var(--d-dim);
}

.guia-btn-subtle:hover {
  background: var(--d-rule-strong);
  color: var(--d-ink);
}

.guia-btn-primary {
  background: var(--d-accent);
  color: #000;
  border-color: var(--d-accent);
  font-weight: 700;
}

.guia-btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

/* Transitions */
.guide-pop-enter-active,
.guide-pop-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.guide-pop-enter-from,
.guide-pop-leave-to {
  opacity: 0;
  transform: translateY(14px) scale(0.97);
}

@media (max-width: 640px) {
  .datos-guia {
    right: 8px;
    left: 8px;
    width: auto;
    bottom: calc(var(--d-frame) + 68px);
  }
}
</style>
