// Componente UI: AdmBottomNav
// Barra de navegación inferior móvil táctil (estilo redes sociales / app nativa)
// Ergonomía del pulgar, micro-interacciones, badges reactivos y drawer de 'Más opciones'

import { store } from '../../store.js'
import { ICONS } from '../../config.js'

const { ref } = window.Vue

export const AdmBottomNav = {
  name: 'AdmBottomNav',
  setup() {
    const showMoreSheet = ref(false)

    function navigate(sec) {
      showMoreSheet.value = false
      store.loadSection(sec)
    }

    function openPortfolio() {
      showMoreSheet.value = false
      window.open('/', '_blank', 'noopener')
    }

    function openHelp() {
      showMoreSheet.value = false
      store.modals.help = true
    }

    function logout() {
      showMoreSheet.value = false
      store.token = ''
      sessionStorage.removeItem('admin-token')
      store.toast('ok', 'Sesión cerrada correctamente')
    }

    const isSecondarySection = () => {
      return ['stack', 'orgs', 'docs'].includes(store.section)
    }

    return {
      store,
      icons: ICONS,
      showMoreSheet,
      navigate,
      openPortfolio,
      openHelp,
      logout,
      isSecondarySection,
    }
  },
  template: `
    <!-- Barra de Navegación Inferior Fija para Móviles (md:hidden) -->
    <nav class="md:hidden fixed bottom-0 inset-x-0 z-40 h-[62px] pb-[env(safe-area-inset-bottom,0)] bg-[#0c0d10]/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-1 select-none shadow-[0_-8px_24px_rgba(0,0,0,0.6)]" aria-label="Navegación móvil del CMS">
      
      <!-- 1. DASHBOARD / INICIO -->
      <button
        type="button"
        @click="navigate('dashboard')"
        class="flex flex-col items-center justify-center flex-1 h-full relative group transition-all duration-150 py-1"
        :class="store.section === 'dashboard' ? 'text-[#ff3e00] font-bold' : 'text-zinc-400 hover:text-white'"
      >
        <span
          v-if="store.section === 'dashboard'"
          class="absolute top-0 inset-x-3.5 h-[2.5px] bg-[#ff3e00] rounded-full shadow-[0_0_8px_rgba(255,62,0,0.6)]"
          aria-hidden="true"
        ></span>
        <div
          class="w-8 h-6.5 rounded-full flex items-center justify-center transition-all duration-150"
          :class="store.section === 'dashboard' ? 'bg-[#ff3e00]/15 scale-110' : ''"
          v-html="icons.dashboard"
        ></div>
        <span class="text-[10px] font-mono-code mt-0.5 tracking-tight">Inicio</span>
      </button>

      <!-- 2. PROYECTOS -->
      <button
        type="button"
        @click="navigate('projects')"
        class="flex flex-col items-center justify-center flex-1 h-full relative group transition-all duration-150 py-1"
        :class="store.section === 'projects' ? 'text-[#ff3e00] font-bold' : 'text-zinc-400 hover:text-white'"
      >
        <span
          v-if="store.section === 'projects'"
          class="absolute top-0 inset-x-3.5 h-[2.5px] bg-[#ff3e00] rounded-full shadow-[0_0_8px_rgba(255,62,0,0.6)]"
          aria-hidden="true"
        ></span>
        <div class="relative">
          <div
            class="w-8 h-6.5 rounded-full flex items-center justify-center transition-all duration-150"
            :class="store.section === 'projects' ? 'bg-[#ff3e00]/15 scale-110' : ''"
            v-html="icons.projects"
          ></div>
          <span v-if="store.counts.projects" class="absolute -top-1 -right-1.5 px-1 py-0 text-[8.5px] font-mono-code font-bold rounded-full bg-[#ff3e00] text-black leading-tight">
            {{ store.counts.projects }}
          </span>
        </div>
        <span class="text-[10px] font-mono-code mt-0.5 tracking-tight">Proyectos</span>
      </button>

      <!-- 3. EXPERIENCIA -->
      <button
        type="button"
        @click="navigate('experience')"
        class="flex flex-col items-center justify-center flex-1 h-full relative group transition-all duration-150 py-1"
        :class="store.section === 'experience' ? 'text-[#ff3e00] font-bold' : 'text-zinc-400 hover:text-white'"
      >
        <span
          v-if="store.section === 'experience'"
          class="absolute top-0 inset-x-3.5 h-[2.5px] bg-[#ff3e00] rounded-full shadow-[0_0_8px_rgba(255,62,0,0.6)]"
          aria-hidden="true"
        ></span>
        <div class="relative">
          <div
            class="w-8 h-6.5 rounded-full flex items-center justify-center transition-all duration-150"
            :class="store.section === 'experience' ? 'bg-[#ff3e00]/15 scale-110' : ''"
            v-html="icons.experience"
          ></div>
          <span v-if="store.counts.experience" class="absolute -top-1 -right-1.5 px-1 py-0 text-[8.5px] font-mono-code font-bold rounded-full bg-white/20 text-white leading-tight">
            {{ store.counts.experience }}
          </span>
        </div>
        <span class="text-[10px] font-mono-code mt-0.5 tracking-tight">Exp</span>
      </button>

      <!-- 4. JOB HUNTER -->
      <button
        type="button"
        @click="navigate('hunter')"
        class="flex flex-col items-center justify-center flex-1 h-full relative group transition-all duration-150 py-1"
        :class="store.section === 'hunter' ? 'text-[#ff3e00] font-bold' : 'text-zinc-400 hover:text-white'"
      >
        <span
          v-if="store.section === 'hunter'"
          class="absolute top-0 inset-x-3.5 h-[2.5px] bg-[#ff3e00] rounded-full shadow-[0_0_8px_rgba(255,62,0,0.6)]"
          aria-hidden="true"
        ></span>
        <div
          class="w-8 h-6.5 rounded-full flex items-center justify-center transition-all duration-150"
          :class="store.section === 'hunter' ? 'bg-[#ff3e00]/15 scale-110' : ''"
          v-html="icons.hunter"
        ></div>
        <span class="text-[10px] font-mono-code mt-0.5 tracking-tight">Hunter</span>
      </button>

      <!-- 5. MÁS / GESTIÓN ADICIONAL (DRAWER TRIGGER) -->
      <button
        type="button"
        @click="showMoreSheet = !showMoreSheet"
        class="flex flex-col items-center justify-center flex-1 h-full relative group transition-all duration-150 py-1"
        :class="isSecondarySection() || showMoreSheet ? 'text-[#ff3e00] font-bold' : 'text-zinc-400 hover:text-white'"
      >
        <span
          v-if="isSecondarySection()"
          class="absolute top-0 inset-x-3.5 h-[2.5px] bg-[#ff3e00] rounded-full shadow-[0_0_8px_rgba(255,62,0,0.6)]"
          aria-hidden="true"
        ></span>
        <div
          class="w-8 h-6.5 rounded-full flex items-center justify-center transition-all duration-150"
          :class="isSecondarySection() || showMoreSheet ? 'bg-[#ff3e00]/15 scale-110' : ''"
        >
          <svg class="adm-icon" viewBox="0 0 24 24"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </div>
        <span class="text-[10px] font-mono-code mt-0.5 tracking-tight">Más</span>
      </button>
    </nav>

    <!-- DRAWER / BOTTOM SHEET MODERNO PARA SECCIONES SECUNDARIAS -->
    <div
      v-if="showMoreSheet"
      class="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm transition-opacity"
      @click.self="showMoreSheet = false"
    >
      <div class="bg-[#121318] border-t border-white/15 rounded-t-2xl p-5 pb-8 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
        <!-- Manija de arrastre táctil (Drawer handle) -->
        <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2" aria-hidden="true"></div>

        <div class="flex items-center justify-between pb-2 border-b border-white/10">
          <span class="text-xs font-mono-code uppercase font-bold text-zinc-400">Otras Colecciones & Sistema</span>
          <button
            type="button"
            @click="showMoreSheet = false"
            class="text-zinc-400 hover:text-white text-xs px-2 py-0.5 font-mono-code"
          >
            ✕ Cerrar
          </button>
        </div>

        <!-- Secciones Secundarias -->
        <div class="grid grid-cols-1 gap-2">
          <!-- Stack -->
          <button
            type="button"
            @click="navigate('stack')"
            class="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-[#161720] hover:border-[#ff3e00]/50 transition-colors text-left"
            :class="{ '!border-[#ff3e00] !bg-[#ff3e00]/10 text-[#ff3e00]': store.section === 'stack' }"
          >
            <div class="flex items-center gap-2.5">
              <span v-html="icons.stack"></span>
              <span class="text-xs font-medium">Habilidades & Stack</span>
            </div>
            <span class="text-[10px] font-mono-code bg-white/10 px-1.5 py-0.5 rounded text-zinc-300">
              {{ store.counts.stack }}
            </span>
          </button>

          <!-- Empresas & Clientes -->
          <button
            type="button"
            @click="navigate('orgs')"
            class="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-[#161720] hover:border-[#ff3e00]/50 transition-colors text-left"
            :class="{ '!border-[#ff3e00] !bg-[#ff3e00]/10 text-[#ff3e00]': store.section === 'orgs' }"
          >
            <div class="flex items-center gap-2.5">
              <span v-html="icons.orgs"></span>
              <span class="text-xs font-medium">Empresas & Clientes</span>
            </div>
            <span class="text-[10px] font-mono-code bg-white/10 px-1.5 py-0.5 rounded text-zinc-300">
              {{ store.counts.orgs }}
            </span>
          </button>

          <!-- Páginas & Textos -->
          <button
            type="button"
            @click="navigate('docs')"
            class="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-[#161720] hover:border-[#ff3e00]/50 transition-colors text-left"
            :class="{ '!border-[#ff3e00] !bg-[#ff3e00]/10 text-[#ff3e00]': store.section === 'docs' }"
          >
            <div class="flex items-center gap-2.5">
              <span v-html="icons.docs"></span>
              <span class="text-xs font-medium">Páginas & Textos</span>
            </div>
            <span class="text-[10px] font-mono-code bg-white/10 px-1.5 py-0.5 rounded text-zinc-300">
              {{ store.counts.docs }}
            </span>
          </button>
        </div>

        <!-- Acciones Rápidas -->
        <div class="pt-2 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            @click="openPortfolio"
            class="flex-1 py-2.5 px-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center gap-1.5 font-mono-code text-[11px]"
          >
            <span>Ver Portafolio</span>
            <span v-html="icons.external"></span>
          </button>

          <button
            type="button"
            @click="openHelp"
            class="flex-1 py-2.5 px-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center font-mono-code text-[11px]"
          >
            Guía Asistente
          </button>

          <button
            type="button"
            @click="logout"
            class="py-2.5 px-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-mono-code text-[11px]"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  `,
}
