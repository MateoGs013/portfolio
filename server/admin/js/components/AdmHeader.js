// Componente Estructural: AdmHeader
// Cabecera global de 48px con identidad minimalista Linear 2026, Command Palette trigger y telemetría

import { store } from '../store.js'
import { MODELS, ICONS } from '../config.js'

export const AdmHeader = {
  name: 'AdmHeader',
  emits: ['openPalette', 'openHelp', 'openMenu', 'logout'],
  setup() {
    function logout() {
      store.logout()
    }

    return {
      store,
      models: MODELS,
      icons: ICONS,
      logout,
    }
  },
  template: `
    <header class="h-12 bg-[#080808]/90 backdrop-blur-md border-b border-white/10 px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 select-none z-30">
      <!-- Identidad y Monograma -->
      <div class="flex items-center gap-2 sm:gap-3 min-w-0">
        <div class="flex items-center gap-2 shrink-0">
          <div class="w-6 h-6 rounded bg-[#ff3e00] text-[#09090b] flex items-center justify-center font-bold text-[11px] font-mono-code tracking-tight shrink-0 shadow-xs">
            MS
          </div>
          <span class="text-xs font-semibold text-white tracking-tight truncate hidden sm:inline">Mateo Sonzogni</span>
          <span class="hidden sm:inline-block text-[10px] font-mono-code bg-white/5 text-zinc-400 px-1.5 py-0.5 rounded border border-white/10 shrink-0">
            CMS 2026
          </span>
        </div>

        <!-- Botón Menú Móvil Táctil (md:hidden) -->
        <button
          type="button"
          @click="$emit('openMenu')"
          class="md:hidden inline-flex items-center gap-1.5 h-7 px-2 rounded-md border border-white/15 bg-white/5 font-mono-code text-[11px] text-zinc-300 hover:text-white active:scale-[0.96] transition-all cursor-pointer max-w-[130px]"
          aria-label="Abrir menú de navegación"
        >
          <span class="text-[#ff3e00] flex items-center shrink-0" v-html="icons.menu"></span>
          <span class="uppercase font-semibold tracking-wider text-[10.5px] truncate">{{ store.section }}</span>
        </button>

        <!-- Breadcrumb Activo Desktop (lg:flex) -->
        <div class="hidden lg:flex items-center gap-2 h-7 px-2.5 rounded-md border border-white/10 bg-white/[0.03] font-mono-code text-[11px] text-zinc-400">
          <span class="w-1.5 h-1.5 rounded-full bg-[#ff3e00] shrink-0"></span>
          <span class="text-zinc-500">cms</span>
          <span class="text-zinc-600">/</span>
          <span class="text-white font-medium">{{ store.section }}</span>
          <template v-if="store.current">
            <span class="text-zinc-600">/</span>
            <span class="text-zinc-300 truncate max-w-[140px]">{{ store.current.slug || store.current.title || store.current.key }}</span>
          </template>
        </div>
      </div>

      <!-- Command Palette Trigger Central (Desktop) -->
      <button
        type="button"
        @click="$emit('openPalette')"
        class="hidden sm:flex items-center gap-2.5 h-7 px-3 rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-zinc-400 hover:text-white text-xs font-mono-code transition-all cursor-pointer shadow-xs active:scale-[0.99]"
        title="Buscador global y atajos rápidos (⌘K)"
      >
        <svg class="adm-icon sm text-zinc-500" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <span class="text-zinc-400 text-[11px]">Buscar o saltar a...</span>
        <kbd class="text-[9.5px] bg-black/40 border border-white/10 px-1.5 py-0.2 rounded text-zinc-500 font-mono-code ml-1">
          Ctrl + K
        </kbd>
      </button>

      <!-- Acciones de Cabecera Derecha -->
      <div class="flex items-center gap-1.5 sm:gap-2 text-xs">
        <!-- Telemetría ACID en Vivo -->
        <div class="hidden xl:flex items-center gap-2 h-7 px-2.5 rounded-md border border-white/10 bg-white/[0.02] font-mono-code text-[10.5px] text-zinc-400">
          <span class="status-dot live"></span>
          <span>PG-17 ACID</span>
          <span class="text-zinc-600">·</span>
          <span class="text-emerald-400 font-medium">ONLINE</span>
        </div>

        <!-- Botón de Búsqueda Móvil (sm:hidden) -->
        <button
          type="button"
          @click="$emit('openPalette')"
          class="sm:hidden inline-flex items-center justify-center w-7 h-7 text-zinc-400 hover:text-white rounded-md bg-white/5 border border-white/10 cursor-pointer active:scale-[0.96]"
          title="Buscar (Ctrl+K)"
        >
          <svg class="adm-icon sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </button>

        <!-- Enlace al Portafolio Público -->
        <a
          href="/"
          target="_blank"
          class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-zinc-300 hover:text-white font-mono-code text-[11px] no-underline transition-all active:scale-[0.98]"
          title="Abrir portafolio en una nueva pestaña"
        >
          <span class="hidden sm:inline">Ver Portafolio</span>
          <span class="sm:hidden">Web</span>
          <span class="text-zinc-500 font-bold">↗</span>
        </a>

        <!-- Guía Operativa -->
        <button
          type="button"
          @click="$emit('openHelp')"
          class="hidden sm:inline-flex items-center justify-center h-7 px-2 rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white font-mono-code text-[11px] cursor-pointer transition-all active:scale-[0.96]"
          title="Guía operativa y atajos (?)"
        >
          <span>?</span>
        </button>

        <!-- Salir -->
        <button
          type="button"
          @click="logout"
          class="inline-flex items-center h-7 px-2 text-zinc-500 hover:text-red-400 text-xs font-mono-code transition-colors cursor-pointer"
          title="Cerrar sesión administrativa"
        >
          Salir
        </button>
      </div>
    </header>
  `,
}
