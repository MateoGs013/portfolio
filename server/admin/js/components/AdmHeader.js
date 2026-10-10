// Componente Estructural: AdmHeader
// Cabecera global de 52px con identidad minimalista, Command Palette trigger y breadcrumb

import { store } from '../store.js'
import { MODELS } from '../config.js'

export const AdmHeader = {
  name: 'AdmHeader',
  emits: ['openPalette', 'openHelp', 'logout'],
  setup() {
    function logout() {
      store.token = ''
      sessionStorage.removeItem('admin-token')
      store.toast('ok', 'Sesión cerrada correctamente')
    }

    return {
      store,
      models: MODELS,
      logout,
    }
  },
  template: `
    <header class="h-[52px] bg-[#0c0d10] border-b border-white/10 px-4 sm:px-5 flex items-center justify-between shrink-0 select-none z-30">
      <!-- Identidad y Monograma -->
      <div class="flex items-center gap-3 sm:gap-4 min-w-0">
        <div class="flex items-center gap-2 sm:gap-2.5">
          <div class="w-6 h-6 rounded bg-[#ff3e00] text-[#09090b] flex items-center justify-center font-bold text-xs font-mono-code tracking-tighter shrink-0">
            MS
          </div>
          <span class="text-xs font-bold text-white tracking-tight truncate">Mateo Sonzogni</span>
          <span class="text-[10px] font-mono-code bg-white/5 text-zinc-400 px-1.5 py-0.5 rounded border border-white/10 shrink-0">
            CMS 2026
          </span>
        </div>

        <span class="h-3.5 w-px bg-white/10 hidden sm:inline-block"></span>

        <!-- Status VPS -->
        <div class="hidden md:flex items-center gap-1.5 text-[11px] font-mono-code text-zinc-400">
          <span class="status-dot live"></span>
          <span>VPS Coolify · Conectado</span>
        </div>
      </div>

      <!-- Command Palette Trigger Central (Desktop) -->
      <button
        type="button"
        @click="$emit('openPalette')"
        class="hidden sm:flex items-center gap-3 bg-[#14151b] hover:bg-[#1a1b24] border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white px-3.5 py-1 rounded-md text-xs font-mono-code transition-all cursor-pointer shadow-inner"
        title="Buscador global y atajos rápidos"
      >
        <span class="flex items-center gap-1.5">
          <svg class="adm-icon sm text-zinc-500" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <span class="text-zinc-500">Buscar o saltar a...</span>
        </span>
        <kbd class="text-[9.5px] bg-black/50 border border-white/10 px-1.5 py-0.2 rounded text-zinc-400">
          Ctrl + K
        </kbd>
      </button>

      <!-- Botón de Búsqueda Móvil -->
      <button
        type="button"
        @click="$emit('openPalette')"
        class="sm:hidden p-1.5 text-zinc-400 hover:text-white rounded bg-white/5 border border-white/10 cursor-pointer"
        title="Buscar o saltar a..."
      >
        <svg class="adm-icon sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </button>

      <!-- Enlaces y Acciones de Cabecera (Desktop) -->
      <div class="hidden sm:flex items-center gap-2.5 text-xs">
        <a
          href="/"
          target="_blank"
          class="btn-secondary !h-[28px] !text-[11px] !px-2.5"
          title="Abrir portafolio en una nueva pestaña"
        >
          <span>Ver Portafolio</span>
          <svg class="adm-icon sm" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>

        <button
          type="button"
          @click="$emit('openHelp')"
          class="btn-secondary !h-[28px] !text-[11px] !px-2"
          title="Guía operativa para colaboradores"
        >
          <span>Guía Asistente</span>
        </button>

        <button
          type="button"
          @click="logout"
          class="text-zinc-500 hover:text-red-400 text-xs px-2 py-1 transition-colors cursor-pointer"
          title="Cerrar sesión administrativa"
        >
          Salir
        </button>
      </div>
    </header>

  `,
}
