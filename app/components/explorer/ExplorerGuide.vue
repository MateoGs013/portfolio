<script setup lang="ts">
// Guía de Orientación Rápida y Tutorial No Invasivo — Sistema DATOS
// Brinda orientación contextual en 3 pasos clave sin bloquear la pantalla ni interrumpir la navegación.
import AppIcon from '~/components/ui/AppIcon.vue'

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
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-3 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-3 scale-95"
  >
    <aside
      v-if="open"
      class="datos-guia fixed bottom-8 max-sm:bottom-[68px] right-4 max-sm:left-2 max-sm:right-2 w-[min(390px,calc(100vw-32px))] max-sm:w-auto bg-surface border border-rule-strong rounded shadow-[0_12px_32px_rgba(0,0,0,0.45),0_2px_8px_rgba(0,0,0,0.25)] z-[85] font-mono overflow-hidden backdrop-blur-md flex flex-col"
      role="region"
      :aria-label="isEs ? 'Guía rápida de orientación' : 'Quick orientation guide'"
    >
      <!-- Cabecera de la Guía -->
      <div class="flex items-center justify-between px-3 py-2 bg-surface-raised border-b border-rule">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-sig shadow-[0_0_8px_var(--d-sig)] animate-pulse" />
          <span class="text-[10px] font-bold tracking-[0.08em] text-ink">{{ isEs ? 'GUÍA RÁPIDA' : 'QUICK GUIDE' }}</span>
          <span class="text-[9px] px-1.5 py-0.5 rounded-[2px] bg-rule text-dim font-semibold">{{ step + 1 }}/{{ steps.length }}</span>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center w-[22px] h-[22px] rounded-[2px] border-none bg-transparent text-dim hover:bg-rule-strong hover:text-ink cursor-pointer transition-colors duration-150"
          :title="isEs ? 'Cerrar guía (no volverá a aparecer automáticamente)' : 'Close guide (will not show automatically again)'"
          :aria-label="isEs ? 'Cerrar guía' : 'Close guide'"
          @click="dismiss"
        >
          <AppIcon name="close" :size="12" />
        </button>
      </div>

      <!-- Contenido del Paso Actual -->
      <div v-if="!showShortcuts" class="p-3.5 pb-2.5 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-[9px] tracking-[0.06em] text-sig font-bold">{{ steps[step]?.tag }}</span>
          <span class="text-[9px] px-1 py-0.5 border border-rule-strong rounded-[2px] text-dim">{{ steps[step]?.badge }}</span>
        </div>

        <h4 class="m-0 text-[13px] font-bold text-ink flex items-center gap-2 tracking-tight">
          <AppIcon :name="steps[step]?.icon ?? 'db'" :size="14" class="text-sig shrink-0" />
          {{ steps[step]?.title }}
        </h4>

        <p class="m-0 text-[11px] leading-relaxed text-dim">
          {{ steps[step]?.desc }}
        </p>

        <!-- Indicador de Puntos -->
        <div class="flex items-center gap-1.5 mt-1" aria-hidden="true">
          <button
            v-for="(s, i) in steps"
            :key="i"
            type="button"
            class="h-1.5 border-none p-0 cursor-pointer transition-all duration-200"
            :class="i === step ? 'bg-sig w-4 rounded-[3px]' : 'bg-rule-strong w-1.5 rounded-full'"
            :aria-label="`Paso ${i + 1}`"
            @click="step = i"
          />
        </div>
      </div>

      <!-- Vista Alternativa: Chuleta de Atajos de Teclado -->
      <div v-else class="p-3.5 max-h-[220px] overflow-y-auto flex flex-col gap-1.5">
        <div class="text-[9px] tracking-[0.08em] text-sig font-bold mb-1">
          <span>{{ isEs ? 'ATAJOS DEL SISTEMA' : 'SYSTEM SHORTCUTS' }}</span>
        </div>
        <ul class="list-none m-0 p-0 flex flex-col gap-1.5">
          <li v-for="sc in shortcuts" :key="sc.key" class="flex items-baseline gap-2.5 text-[10.5px]">
            <kbd class="inline-block px-1.5 py-0.5 text-[9.5px] font-bold bg-surface-raised border border-rule-strong rounded-[2px] text-ink whitespace-nowrap min-w-[48px] text-center">{{ sc.key }}</kbd>
            <span class="text-dim leading-snug">{{ sc.label }}</span>
          </li>
        </ul>
      </div>

      <!-- Barra de Acciones Inferior -->
      <div class="flex items-center justify-between px-3 py-2 bg-surface-raised border-t border-rule">
        <button
          type="button"
          class="bg-transparent border-none text-[10px] text-dim hover:text-sig cursor-pointer px-1.5 py-1 rounded-[2px] transition-colors duration-150"
          @click="showShortcuts = !showShortcuts"
        >
          {{ showShortcuts ? (isEs ? '‹ Volver a tips' : '‹ Back to tips') : (isEs ? 'Ver atajos ⌨' : 'View shortcuts ⌨') }}
        </button>

        <div class="flex items-center gap-1.5">
          <button
            v-if="!showShortcuts && step > 0"
            type="button"
            class="inline-flex items-center justify-center px-2.5 py-1 text-[10.5px] font-semibold rounded-[2px] cursor-pointer transition-all duration-150 bg-transparent border border-rule text-dim hover:bg-rule-strong hover:text-ink"
            @click="prev"
          >
            {{ isEs ? '‹ Ant' : '‹ Prev' }}
          </button>
          <button
            v-if="!showShortcuts"
            type="button"
            class="inline-flex items-center justify-center px-2.5 py-1 text-[10.5px] font-bold rounded-[2px] cursor-pointer transition-all duration-150 bg-sig text-white border border-sig hover:brightness-110 hover:-translate-y-px"
            @click="next"
          >
            {{ step === steps.length - 1 ? (isEs ? 'Entendido ✓' : 'Done ✓') : (isEs ? 'Siguiente ›' : 'Next ›') }}
          </button>
          <button
            v-else
            type="button"
            class="inline-flex items-center justify-center px-2.5 py-1 text-[10.5px] font-bold rounded-[2px] cursor-pointer transition-all duration-150 bg-sig text-white border border-sig hover:brightness-110 hover:-translate-y-px"
            @click="dismiss"
          >
            {{ isEs ? 'Cerrar ✓' : 'Close ✓' }}
          </button>
        </div>
      </div>
    </aside>
  </Transition>
</template>
