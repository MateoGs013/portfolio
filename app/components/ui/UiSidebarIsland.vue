<script setup lang="ts">
/**
 * UiSidebarIsland — Sidebar Estructural Integrado Linear / Bencho UI
 * Integrado verticalmente en el layout (h-full).
 * - Colapsado: riel de 56px con iconos perfectamente centrados en el eje vertical (38×38px).
 * - Expandido: 224px con árbol relacional completo, etiquetas, badges tabulares y atajos.
 * - En Modo Hiperfoco: colapsa suavemente a 0px para lectura 100% libre de distracciones.
 */
import type { RouteLocationRaw } from 'vue-router'
import type { IconName } from '~/components/ui/AppIcon.vue'
import AppIcon from '~/components/ui/AppIcon.vue'
import { useHyperfocus } from '~/composables/useHyperfocus'
import { useBenchoSound } from '~/composables/useBenchoSound'

export interface SidebarIslandItem {
  key: string
  num: string
  label: string
  count?: string | number
  to: RouteLocationRaw
  shortcut?: string
  isRoot?: boolean
  icon?: IconName
}

withDefaults(defineProps<{
  items: SidebarIslandItem[]
  activeKey: string
  headerLabel?: string
  engineLabel?: string
  statusText?: string
  shortcutsLabel?: string
}>(), {
  headerLabel: 'WORKSPACE',
  engineLabel: 'PG-17',
  statusText: 'ONLINE · 2026',
  shortcutsLabel: 'Atajos (?)',
})

const emit = defineEmits<{
  openGuide: []
}>()

const { isHyperfocus } = useHyperfocus()
const { playSound } = useBenchoSound()

const isExpanded = ref(false)
const hoveredKey = ref<string | null>(null)

function toggleExpand() {
  if (isHyperfocus.value) return
  isExpanded.value = !isExpanded.value
  playSound(isExpanded.value ? 'expand' : 'off')
}

function onRowEnter(key: string) {
  hoveredKey.value = key
  playSound('notch', { gap: 45 })
}

function onKeydownGlobal(e: KeyboardEvent) {
  // Atajo ⌘B o Ctrl+B para alternar sidebar
  if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
    e.preventDefault()
    toggleExpand()
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', onKeydownGlobal)
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', onKeydownGlobal)
  }
})
</script>

<template>
  <aside
    class="sidebar-rail hidden lg:flex flex-col flex-none h-full border-r border-rule bg-surface/40 backdrop-blur-md select-none transition-all duration-200 z-30 overflow-hidden"
    :class="[
      isHyperfocus ? '!w-0 !p-0 !border-0' : (isExpanded ? 'w-[224px]' : 'w-[56px]'),
    ]"
    :aria-label="headerLabel"
  >
    <!-- Cabecera del Sidebar -->
    <div
      class="sbr-head h-12 flex items-center border-b border-rule/60 transition-all px-2"
      :class="isExpanded ? 'justify-between px-3' : 'justify-center'"
    >
      <div v-if="isExpanded" class="flex items-center gap-2 min-w-0">
        <span class="w-2 h-2 rounded-full bg-sig shadow-[0_0_8px_var(--d-sig)] shrink-0" />
        <span class="font-mono text-[10px] tracking-widest uppercase text-dim truncate">
          {{ headerLabel }}
        </span>
        <span class="font-mono text-[9px] px-1 py-0.2 rounded bg-paper/80 border border-rule text-sig/80 shrink-0">
          {{ engineLabel }}
        </span>
      </div>

      <button
        type="button"
        class="sbr-toggle inline-flex items-center justify-center w-8 h-8 rounded-lg bg-paper/60 border border-rule hover:border-rule-strong text-dim hover:text-ink cursor-pointer transition-colors shrink-0"
        :title="isExpanded ? 'Colapsar barra lateral (⌘B)' : 'Expandir barra lateral (⌘B)'"
        :aria-label="isExpanded ? 'Colapsar' : 'Expandir'"
        @click="toggleExpand"
      >
        <AppIcon :name="isExpanded ? 'chevron-left' : 'chevron-right'" :size="13" />
      </button>
    </div>

    <!-- Lista de Navegación -->
    <nav class="sbr-nav flex-1 flex flex-col py-2 px-2 gap-1 overflow-y-auto overflow-x-hidden" aria-label="Secciones del sistema">
      <NuxtLink
        v-for="item in items"
        :key="item.key"
        :to="item.to"
        class="sbr-item group relative flex items-center rounded-xl no-underline transition-all duration-150"
        :class="[
          isExpanded ? 'h-9 px-2.5 justify-start' : 'h-10 px-0 justify-center',
          activeKey === item.key ? 'bg-surface-raised border border-rule text-sig font-semibold shadow-xs' : 'text-dim hover:text-ink hover:bg-hover border border-transparent',
        ]"
        :data-active="activeKey === item.key || undefined"
        :aria-current="activeKey === item.key ? 'page' : undefined"
        :title="!isExpanded ? `${item.num} · ${item.label} [${item.shortcut}]` : undefined"
        @mouseenter="onRowEnter(item.key)"
        @click="playSound('press')"
      >
        <!-- Icono perfectamente centrado -->
        <span
          class="sbr-icon inline-flex items-center justify-center shrink-0 transition-colors"
          :class="[
            isExpanded ? 'w-5 h-5 mr-2.5' : 'w-9 h-9',
            activeKey === item.key ? 'text-sig' : 'text-dim group-hover:text-ink',
          ]"
        >
          <AppIcon :name="item.icon || 'db'" :size="16" />
        </span>

        <!-- Contenido expandible (solo visible en modo expandido) -->
        <div v-if="isExpanded" class="sbr-info flex items-center justify-between flex-1 min-w-0">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="font-mono text-[10.5px] tabular-nums text-faint group-hover:text-ink">
              {{ item.num }}
            </span>
            <span class="font-sans text-[12.5px] truncate text-ink font-medium">
              {{ item.label }}
            </span>
          </div>

          <div class="flex items-center gap-1.5 shrink-0 ml-1.5">
            <span
              v-if="item.count !== undefined"
              class="font-mono text-[10px] tabular-nums px-1.5 py-0.2 rounded bg-paper/60 border border-rule/70"
              :class="activeKey === item.key ? 'text-sig border-sig/40' : 'text-faint'"
            >
              {{ item.count }}
            </span>
          </div>
        </div>

        <!-- Tooltip flotante al hover en modo colapsado -->
        <div
          v-if="!isExpanded"
          class="sbr-tooltip pointer-events-none fixed left-[64px] z-50 px-2.5 py-1 rounded-md bg-paper border border-rule shadow-xl text-[11px] font-mono text-ink whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        >
          <span class="text-sig font-bold mr-1.5">{{ item.num }}</span>
          <span>{{ item.label }}</span>
          <span v-if="item.count !== undefined" class="text-dim ml-1.5 font-normal">({{ item.count }})</span>
        </div>
      </NuxtLink>
    </nav>

    <!-- Pie del Sidebar -->
    <div
      class="sbr-foot h-11 flex items-center border-t border-rule/60 transition-all px-2 font-mono text-[10px]"
      :class="isExpanded ? 'justify-between px-3 text-dim' : 'justify-center'"
    >
      <div class="flex items-center gap-2 min-w-0" :title="statusText">
        <span class="w-2 h-2 rounded-full bg-green shadow-[0_0_8px_var(--d-green)] shrink-0" />
        <span v-if="isExpanded" class="truncate text-faint">{{ statusText }}</span>
      </div>

      <button
        v-if="isExpanded"
        type="button"
        class="px-1.5 py-0.5 rounded bg-paper/70 border border-rule hover:border-rule-strong text-dim hover:text-ink font-mono text-[10px] cursor-pointer transition-colors shrink-0"
        @click.stop="emit('openGuide')"
      >
        {{ shortcutsLabel }}
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-rail {
  will-change: width;
}

.sbr-item:hover .sbr-tooltip {
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-rail,
  .sbr-item {
    transition: none !important;
  }
}

@media print {
  .sidebar-rail {
    display: none !important;
  }
}
</style>
