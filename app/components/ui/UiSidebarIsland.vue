<script setup lang="ts">
/**
 * UiSidebarIsland — Vertical Dynamic Island Navigation HUD (Bencho UI × Spatial OS)
 * Permanece fija flotando en el lateral izquierdo como una cápsula compacta (54px)
 * con líneas de calibre (line-gauge) y números tabulares (00..06).
 * Al acercar el puntero (o fijarla), se expande elásticamente (232px) revelando
 * el árbol relacional completo, contadores de registros y atajos de teclado.
 */
import type { RouteLocationRaw } from 'vue-router'

export interface SidebarIslandItem {
  key: string
  num: string
  label: string
  count?: string | number
  to: RouteLocationRaw
  shortcut?: string
  isRoot?: boolean
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

const isHovered = ref(false)
const isPinned = ref(false)
const hoveredKey = ref<string | null>(null)

const isExpanded = computed(() => !isHyperfocus.value && (isHovered.value || isPinned.value))

function onEnterIsland() {
  if (isHyperfocus.value) return
  if (!isHovered.value) {
    isHovered.value = true
    playSound('expand', { gap: 180 })
  }
}

function onLeaveIsland() {
  isHovered.value = false
  hoveredKey.value = null
}

function onRowEnter(key: string) {
  hoveredKey.value = key
  playSound('notch', { gap: 45 })
}

function togglePin() {
  isPinned.value = !isPinned.value
  playSound(isPinned.value ? 'pop' : 'off')
}
</script>

<template>
  <aside
    class="sdi hidden lg:flex fixed left-3.5 top-1/2 -translate-y-1/2 z-40 flex-col select-none"
    :data-expanded="isExpanded || undefined"
    :data-pinned="isPinned || undefined"
    aria-label="Sidebar Dynamic Island"
    @mouseenter="onEnterIsland"
    @mouseleave="onLeaveIsland"
    @focusin="isHovered = true"
    @focusout="isHovered = false"
  >
    <div class="sdi-shell floating-pill-10k flex flex-col justify-between overflow-hidden">
      <!-- Cabecera de la Isla Lateral -->
      <div class="sdi-head flex items-center justify-between px-3 pt-3 pb-2 border-b border-rule/60">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-2 h-2 rounded-full bg-sig shadow-[0_0_8px_var(--d-sig)] shrink-0" />
          <span class="sdi-reveal font-mono text-[10px] tracking-widest uppercase text-dim truncate">
            {{ headerLabel }}
          </span>
        </div>

        <button
          type="button"
          class="sdi-reveal inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-paper/70 border border-rule hover:border-rule-strong font-mono text-[9.5px] text-dim hover:text-ink cursor-pointer transition-colors shrink-0"
          :title="isPinned ? 'Desfijar isla lateral' : 'Fijar isla lateral abierta'"
          @click.stop="togglePin"
        >
          <span class="w-1 h-1 rounded-full" :class="isPinned ? 'bg-sig' : 'bg-faint'" />
          <span>{{ isPinned ? 'PIN' : engineLabel }}</span>
        </button>
      </div>

      <!-- Lista de Nodos con Calibre Lineal (Bencho Line Tree) -->
      <nav class="sdi-nav flex flex-col py-2 px-2 gap-0.5" aria-label="Colecciones del sistema">
        <NuxtLink
          v-for="item in items"
          :key="item.key"
          :to="item.to"
          class="sdi-row group relative flex items-center h-9 px-2 rounded-xl no-underline transition-colors duration-150"
          :data-active="activeKey === item.key || undefined"
          :data-hover="hoveredKey === item.key || undefined"
          :aria-current="activeKey === item.key ? 'page' : undefined"
          :title="`${item.num} · ${item.label} [${item.shortcut}]`"
          @mouseenter="onRowEnter(item.key)"
          @click="playSound('press')"
        >
          <!-- Trazo de calibre izquierdo + número tabular (Siempre visible en estado compacto 54px) -->
          <div class="flex items-center gap-2 shrink-0">
            <span class="sdi-tick" aria-hidden="true" />
            <span
              class="font-mono text-[11px] tabular-nums transition-colors duration-150"
              :class="activeKey === item.key ? 'text-sig font-semibold' : 'text-faint group-hover:text-ink'"
            >
              {{ item.num }}
            </span>
          </div>

          <!-- Etiqueta y contador (Se revelan elásticamente al expandir la isla) -->
          <div class="sdi-reveal flex items-center justify-between flex-1 min-w-0 ml-2.5">
            <span
              class="font-sans text-[12.5px] truncate transition-colors duration-150"
              :class="activeKey === item.key ? 'text-ink font-medium' : 'text-dim group-hover:text-ink'"
            >
              {{ item.label }}
            </span>

            <div class="flex items-center gap-1.5 shrink-0 ml-2">
              <span
                v-if="item.count !== undefined"
                class="font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded bg-paper/60 border border-rule/70"
                :class="activeKey === item.key ? 'text-sig border-sig/40' : 'text-faint'"
              >
                {{ item.count }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </nav>

      <!-- Pie de la Isla Lateral -->
      <div class="sdi-foot flex items-center justify-between px-3 py-2.5 border-t border-rule/60 font-mono text-[10px] text-dim">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_6px_var(--d-green)] shrink-0" />
          <span class="sdi-reveal truncate text-faint">{{ statusText }}</span>
        </div>
        <button
          type="button"
          class="sdi-reveal px-1.5 py-0.5 rounded bg-paper/70 border border-rule hover:border-rule-strong text-dim hover:text-ink font-mono text-[10px] cursor-pointer transition-colors shrink-0"
          @click.stop="emit('openGuide')"
        >
          {{ shortcutsLabel }}
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sdi-shell {
  width: 56px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--d-paper) 92%, var(--d-surface) 8%);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 1px solid var(--d-rule);
  box-shadow:
    0 16px 40px -10px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
  transition:
    width 380ms cubic-bezier(0.22, 1, 0.36, 1),
    border-radius 380ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 280ms ease,
    background-color 200ms ease;
  will-change: width;
}

.sdi[data-expanded] .sdi-shell {
  width: 232px;
  border-radius: 22px;
  background: var(--d-paper);
  box-shadow:
    0 32px 80px -12px rgba(0, 0, 0, 0.85),
    0 0 0 1px var(--d-rule-strong),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.16);
}

.sdi-reveal {
  opacity: 0;
  transform: translateX(-6px);
  pointer-events: none;
  transition:
    opacity 200ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
  white-space: nowrap;
}

.sdi[data-expanded] .sdi-reveal {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.sdi-row[data-active] {
  background: color-mix(in srgb, var(--d-ink) 7%, transparent);
}

.sdi-row:hover {
  background: color-mix(in srgb, var(--d-ink) 4.5%, transparent);
}

.sdi-tick {
  display: inline-block;
  width: 7px;
  height: 1.5px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--d-ink) 26%, transparent);
  transition:
    width 240ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 180ms ease,
    box-shadow 180ms ease;
}

.sdi-row:hover .sdi-tick {
  width: 11px;
  background: color-mix(in srgb, var(--d-ink) 65%, transparent);
}

.sdi-row[data-active] .sdi-tick {
  width: 14px;
  height: 2px;
  background: var(--d-sig);
  box-shadow: 0 0 8px var(--d-sig-glow);
}

@media (prefers-reduced-motion: reduce) {
  .sdi-shell,
  .sdi-reveal,
  .sdi-tick {
    transition: none !important;
  }
}

@media print {
  .sdi {
    display: none !important;
  }
}
</style>
