// Componente UI: AdmBottomNav (Mobile Navigation Drawer Sheet)
// Drawer táctil minimalista Linear 2026 para navegación móvil bajo demanda (sin barra fija de 62px)
// Cero emojis, telemetría ACID y micro-interacciones táctiles

import { store } from '../../store.js'
import { ICONS } from '../../config.js'

export const AdmBottomNav = {
  name: 'AdmBottomNav',
  props: {
    open: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'openPalette', 'openHelp'],
  setup(props, { emit }) {
    function navigate(sec) {
      emit('close')
      store.loadSection(sec)
    }

    function openPortfolio() {
      emit('close')
      window.open('/', '_blank', 'noopener')
    }

    function openHelp() {
      emit('close')
      emit('openHelp')
    }

    function openPalette() {
      emit('close')
      emit('openPalette')
    }

    function logout() {
      emit('close')
      store.token = ''
      sessionStorage.removeItem('admin-token')
      store.toast('ok', 'Sesión cerrada correctamente')
    }

    return {
      store,
      icons: ICONS,
      navigate,
      openPortfolio,
      openHelp,
      openPalette,
      logout,
    }
  },
  template: `
    <!-- DRAWER / SHEET TÁCTIL MÓVIL BAJO DEMANDA (md:hidden) -->
    <Transition name="adm-sheet">
      <div
        v-if="open"
        class="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md select-none"
        @click.self="$emit('close')"
      >
        <div class="bg-[#0c0d10] border-t border-white/15 rounded-t-2xl p-4 pb-8 space-y-4 max-h-[85vh] overflow-y-auto blueprint-grid shadow-[0_-12px_32px_rgba(0,0,0,0.8)]">
          <!-- Manija de arrastre táctil (Drawer handle) -->
          <div class="w-10 h-1 bg-white/20 rounded-full mx-auto" aria-hidden="true"></div>

          <!-- Cabecera del Drawer -->
          <div class="flex items-center justify-between pb-2 border-b border-white/10">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-[#ff3e00]"></span>
              <span class="text-[11px] font-mono-code uppercase font-bold text-zinc-300">00-09 // Navegación CMS</span>
            </div>
            <button
              type="button"
              @click="$emit('close')"
              class="text-zinc-400 hover:text-white text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/5 border border-white/10 active:scale-[0.96] transition-all cursor-pointer"
            >
              ✕ Cerrar
            </button>
          </div>

          <!-- Buscador Rápido (Command Palette Trigger) -->
          <button
            type="button"
            @click="openPalette"
            class="w-full h-8 px-3 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 flex items-center justify-between text-xs font-mono-code active:scale-[0.98] transition-all cursor-pointer"
          >
            <div class="flex items-center gap-2">
              <span class="text-zinc-400" v-html="icons.search"></span>
              <span class="text-zinc-400 text-[11px]">Buscar o saltar a...</span>
            </div>
            <kbd class="text-[9.5px] bg-black/50 border border-white/10 px-1.5 py-0.5 rounded text-zinc-400">Ctrl+K</kbd>
          </button>

          <!-- GRUPO 1: SISTEMA -->
          <div class="space-y-1">
            <div class="px-1 text-[9.5px] font-mono-code uppercase tracking-wider text-zinc-500 font-bold">
              00 // Sistema
            </div>
            <button
              type="button"
              @click="navigate('dashboard')"
              class="w-full flex items-center justify-between p-2.5 rounded-lg border border-white/10 bg-white/[0.02] active:scale-[0.98] transition-all text-left"
              :class="store.section === 'dashboard' ? '!border-[#ff3e00] !bg-[#ff3e00]/10 text-[#ff3e00]' : 'text-zinc-300 hover:text-white'"
            >
              <div class="flex items-center gap-2.5">
                <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">00.</span>
                <span v-html="icons.dashboard"></span>
                <span class="text-xs font-medium">Panel Principal</span>
              </div>
              <span class="text-[9.5px] font-mono-code px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">SYS</span>
            </button>
          </div>

          <!-- GRUPO 2: COLECCIONES ACID -->
          <div class="space-y-1">
            <div class="px-1 text-[9.5px] font-mono-code uppercase tracking-wider text-zinc-500 font-bold">
              01 // Colecciones ACID
            </div>
            <div class="grid grid-cols-1 gap-1">
              <!-- 01. Proyectos -->
              <button
                type="button"
                @click="navigate('projects')"
                class="w-full flex items-center justify-between p-2.5 rounded-lg border border-white/10 bg-white/[0.02] active:scale-[0.98] transition-all text-left"
                :class="store.section === 'projects' ? '!border-[#ff3e00] !bg-[#ff3e00]/10 text-[#ff3e00]' : 'text-zinc-300 hover:text-white'"
              >
                <div class="flex items-center gap-2.5">
                  <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">01.</span>
                  <span v-html="icons.projects"></span>
                  <span class="text-xs font-medium">Proyectos</span>
                </div>
                <span class="text-[9.5px] font-mono-code px-1.5 py-0.5 rounded" :class="store.section === 'projects' ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-bold' : 'bg-white/5 text-zinc-400'">
                  {{ String(store.counts.projects ?? 0).padStart(2, '0') }}
                </span>
              </button>

              <!-- 02. Experiencia -->
              <button
                type="button"
                @click="navigate('experience')"
                class="w-full flex items-center justify-between p-2.5 rounded-lg border border-white/10 bg-white/[0.02] active:scale-[0.98] transition-all text-left"
                :class="store.section === 'experience' ? '!border-[#ff3e00] !bg-[#ff3e00]/10 text-[#ff3e00]' : 'text-zinc-300 hover:text-white'"
              >
                <div class="flex items-center gap-2.5">
                  <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">02.</span>
                  <span v-html="icons.experience"></span>
                  <span class="text-xs font-medium">Experiencia</span>
                </div>
                <span class="text-[9.5px] font-mono-code px-1.5 py-0.5 rounded" :class="store.section === 'experience' ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-bold' : 'bg-white/5 text-zinc-400'">
                  {{ String(store.counts.experience ?? 0).padStart(2, '0') }}
                </span>
              </button>

              <!-- 03. Stack -->
              <button
                type="button"
                @click="navigate('stack')"
                class="w-full flex items-center justify-between p-2.5 rounded-lg border border-white/10 bg-white/[0.02] active:scale-[0.98] transition-all text-left"
                :class="store.section === 'stack' ? '!border-[#ff3e00] !bg-[#ff3e00]/10 text-[#ff3e00]' : 'text-zinc-300 hover:text-white'"
              >
                <div class="flex items-center gap-2.5">
                  <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">03.</span>
                  <span v-html="icons.stack"></span>
                  <span class="text-xs font-medium">Stack & Habilidades</span>
                </div>
                <span class="text-[9.5px] font-mono-code px-1.5 py-0.5 rounded" :class="store.section === 'stack' ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-bold' : 'bg-white/5 text-zinc-400'">
                  {{ String(store.counts.stack ?? 0).padStart(2, '0') }}
                </span>
              </button>

              <!-- 04. Empresas -->
              <button
                type="button"
                @click="navigate('orgs')"
                class="w-full flex items-center justify-between p-2.5 rounded-lg border border-white/10 bg-white/[0.02] active:scale-[0.98] transition-all text-left"
                :class="store.section === 'orgs' ? '!border-[#ff3e00] !bg-[#ff3e00]/10 text-[#ff3e00]' : 'text-zinc-300 hover:text-white'"
              >
                <div class="flex items-center gap-2.5">
                  <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">04.</span>
                  <span v-html="icons.orgs"></span>
                  <span class="text-xs font-medium">Empresas & Clientes</span>
                </div>
                <span class="text-[9.5px] font-mono-code px-1.5 py-0.5 rounded" :class="store.section === 'orgs' ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-bold' : 'bg-white/5 text-zinc-400'">
                  {{ String(store.counts.orgs ?? 0).padStart(2, '0') }}
                </span>
              </button>

              <!-- 05. Artículos -->
              <button
                type="button"
                @click="navigate('articles')"
                class="w-full flex items-center justify-between p-2.5 rounded-lg border border-white/10 bg-white/[0.02] active:scale-[0.98] transition-all text-left"
                :class="store.section === 'articles' ? '!border-[#ff3e00] !bg-[#ff3e00]/10 text-[#ff3e00]' : 'text-zinc-300 hover:text-white'"
              >
                <div class="flex items-center gap-2.5">
                  <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">05.</span>
                  <span v-html="icons.articles"></span>
                  <span class="text-xs font-medium">Artículos & Blog</span>
                </div>
                <span class="text-[9.5px] font-mono-code px-1.5 py-0.5 rounded" :class="store.section === 'articles' ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-bold' : 'bg-white/5 text-zinc-400'">
                  {{ String(store.counts.articles ?? 0).padStart(2, '0') }}
                </span>
              </button>

              <!-- 06. Páginas -->
              <button
                type="button"
                @click="navigate('docs')"
                class="w-full flex items-center justify-between p-2.5 rounded-lg border border-white/10 bg-white/[0.02] active:scale-[0.98] transition-all text-left"
                :class="store.section === 'docs' ? '!border-[#ff3e00] !bg-[#ff3e00]/10 text-[#ff3e00]' : 'text-zinc-300 hover:text-white'"
              >
                <div class="flex items-center gap-2.5">
                  <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">06.</span>
                  <span v-html="icons.docs"></span>
                  <span class="text-xs font-medium">Páginas & Textos</span>
                </div>
                <span class="text-[9.5px] font-mono-code px-1.5 py-0.5 rounded" :class="store.section === 'docs' ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-bold' : 'bg-white/5 text-zinc-400'">
                  {{ String(store.counts.docs ?? 0).padStart(2, '0') }}
                </span>
              </button>
            </div>
          </div>

          <!-- GRUPO 3: EROS AI SUITE -->
          <div class="space-y-1">
            <div class="px-1 text-[9.5px] font-mono-code uppercase tracking-wider text-zinc-500 font-bold">
              02 // Eros AI Suite
            </div>
            <div class="grid grid-cols-1 gap-1">
              <!-- 07. Job Hunter -->
              <button
                type="button"
                @click="navigate('hunter')"
                class="w-full flex items-center justify-between p-2.5 rounded-lg border border-white/10 bg-white/[0.02] active:scale-[0.98] transition-all text-left"
                :class="store.section === 'hunter' ? '!border-emerald-500 !bg-emerald-500/10 text-emerald-400' : 'text-zinc-300 hover:text-white'"
              >
                <div class="flex items-center gap-2.5">
                  <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">07.</span>
                  <span v-html="icons.hunter"></span>
                  <span class="text-xs font-medium">Job Hunter (Eros)</span>
                </div>
                <span class="text-[9.5px] font-mono-code bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {{ String(store.counts.hunter ?? 0).padStart(2, '0') }}
                </span>
              </button>

              <!-- 08. Contenido Omnicanal -->
              <button
                type="button"
                @click="navigate('content')"
                class="w-full flex items-center justify-between p-2.5 rounded-lg border border-white/10 bg-white/[0.02] active:scale-[0.98] transition-all text-left"
                :class="store.section === 'content' ? '!border-purple-500 !bg-purple-500/10 text-purple-400' : 'text-zinc-300 hover:text-white'"
              >
                <div class="flex items-center gap-2.5">
                  <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">08.</span>
                  <span v-html="icons.content"></span>
                  <span class="text-xs font-medium">Contenido Omnicanal</span>
                </div>
                <span class="text-[9.5px] font-mono-code bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20">
                  {{ String(store.counts.content ?? 0).padStart(2, '0') }}
                </span>
              </button>

              <!-- 09. TrendRadar -->
              <button
                type="button"
                @click="navigate('radar')"
                class="w-full flex items-center justify-between p-2.5 rounded-lg border border-white/10 bg-white/[0.02] active:scale-[0.98] transition-all text-left"
                :class="store.section === 'radar' ? '!border-cyan-500 !bg-cyan-500/10 text-cyan-400' : 'text-zinc-300 hover:text-white'"
              >
                <div class="flex items-center gap-2.5">
                  <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">09.</span>
                  <span v-html="icons.radar"></span>
                  <span class="text-xs font-medium">TrendRadar (Eros)</span>
                </div>
                <span class="text-[9.5px] font-mono-code bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  {{ String(store.counts.radar ?? 0).padStart(2, '0') }}
                </span>
              </button>
            </div>
          </div>

          <!-- Acciones Rápidas Inferiores & Telemetría -->
          <div class="pt-3 border-t border-white/10 space-y-3">
            <div class="flex items-center justify-between text-[11px] font-mono-code text-zinc-400">
              <div class="flex items-center gap-1.5">
                <span class="status-dot live"></span>
                <span>PG-17 ACID</span>
                <span class="text-zinc-600">·</span>
                <span class="text-emerald-400 font-medium">ONLINE</span>
              </div>
              <span class="text-zinc-600">v2026.2</span>
            </div>

            <div class="flex items-center gap-2 text-xs">
              <button
                type="button"
                @click="openPortfolio"
                class="flex-1 py-2 px-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center gap-1.5 font-mono-code text-[11px] active:scale-[0.98] cursor-pointer"
              >
                <span>Ver Portafolio</span>
                <span v-html="icons.external"></span>
              </button>

              <button
                type="button"
                @click="openHelp"
                class="py-2 px-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300 font-mono-code text-[11px] active:scale-[0.98] cursor-pointer"
              >
                Guía
              </button>

              <button
                type="button"
                @click="logout"
                class="py-2 px-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-mono-code text-[11px] active:scale-[0.98] cursor-pointer"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  `,
}
