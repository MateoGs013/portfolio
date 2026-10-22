// Componente Estructural: AdmSidebar
// Barra lateral Linear Rail de 240px con numeración técnica, badges reactivos y estética 2026

import { store } from '../store.js'
import { ICONS } from '../config.js'

export const AdmSidebar = {
  name: 'AdmSidebar',
  setup() {
    return {
      store,
      icons: ICONS,
    }
  },
  template: `
    <aside class="hidden md:flex w-60 bg-[#080808]/95 border-r border-white/10 flex-col shrink-0 select-none">
      <div class="p-3 space-y-5 flex-1 overflow-y-auto">
        <!-- GRUPO 1: SISTEMA -->
        <div class="space-y-1">
          <div class="px-2.5 py-1 text-[10px] font-mono-code uppercase tracking-wider text-zinc-500 font-bold flex items-center justify-between">
            <span>00 // Sistema</span>
          </div>
          <button
            type="button"
            @click="store.loadSection('dashboard')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'dashboard' }"
          >
            <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">00.</span>
            <span class="flex items-center" v-html="icons.dashboard"></span>
            <span class="flex-1 truncate">Panel Principal</span>
            <span class="text-[9.5px] font-mono-code px-1.5 py-0.2 rounded" :class="store.section === 'dashboard' ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-bold' : 'bg-white/5 text-zinc-400'">
              SYS
            </span>
          </button>
        </div>

        <!-- GRUPO 2: COLECCIONES ACID -->
        <div class="space-y-1">
          <div class="px-2.5 py-1 text-[10px] font-mono-code uppercase tracking-wider text-zinc-500 font-bold flex items-center justify-between">
            <span>01 // Colecciones ACID</span>
          </div>

          <!-- 01. Proyectos -->
          <button
            type="button"
            @click="store.loadSection('projects')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'projects' }"
          >
            <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">01.</span>
            <span class="flex items-center" v-html="icons.projects"></span>
            <span class="flex-1 truncate">Proyectos</span>
            <span class="text-[9.5px] font-mono-code px-1.5 py-0.2 rounded" :class="store.section === 'projects' ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-bold' : 'bg-white/5 text-zinc-400'">
              {{ String(store.counts.projects ?? 0).padStart(2, '0') }}
            </span>
          </button>

          <!-- 02. Experiencia -->
          <button
            type="button"
            @click="store.loadSection('experience')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'experience' }"
          >
            <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">02.</span>
            <span class="flex items-center" v-html="icons.experience"></span>
            <span class="flex-1 truncate">Experiencia</span>
            <span class="text-[9.5px] font-mono-code px-1.5 py-0.2 rounded" :class="store.section === 'experience' ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-bold' : 'bg-white/5 text-zinc-400'">
              {{ String(store.counts.experience ?? 0).padStart(2, '0') }}
            </span>
          </button>

          <!-- 03. Stack -->
          <button
            type="button"
            @click="store.loadSection('stack')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'stack' }"
          >
            <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">03.</span>
            <span class="flex items-center" v-html="icons.stack"></span>
            <span class="flex-1 truncate">Stack & Habilidades</span>
            <span class="text-[9.5px] font-mono-code px-1.5 py-0.2 rounded" :class="store.section === 'stack' ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-bold' : 'bg-white/5 text-zinc-400'">
              {{ String(store.counts.stack ?? 0).padStart(2, '0') }}
            </span>
          </button>

          <!-- 04. Empresas -->
          <button
            type="button"
            @click="store.loadSection('orgs')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'orgs' }"
          >
            <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">04.</span>
            <span class="flex items-center" v-html="icons.orgs"></span>
            <span class="flex-1 truncate">Empresas & Clientes</span>
            <span class="text-[9.5px] font-mono-code px-1.5 py-0.2 rounded" :class="store.section === 'orgs' ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-bold' : 'bg-white/5 text-zinc-400'">
              {{ String(store.counts.orgs ?? 0).padStart(2, '0') }}
            </span>
          </button>

          <!-- 05. Artículos -->
          <button
            type="button"
            @click="store.loadSection('articles')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'articles' }"
          >
            <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">05.</span>
            <span class="flex items-center" v-html="icons.articles"></span>
            <span class="flex-1 truncate">Artículos & Blog</span>
            <span class="text-[9.5px] font-mono-code px-1.5 py-0.2 rounded" :class="store.section === 'articles' ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-bold' : 'bg-white/5 text-zinc-400'">
              {{ String(store.counts.articles ?? 0).padStart(2, '0') }}
            </span>
          </button>

          <!-- 06. Páginas -->
          <button
            type="button"
            @click="store.loadSection('docs')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'docs' }"
          >
            <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">06.</span>
            <span class="flex items-center" v-html="icons.docs"></span>
            <span class="flex-1 truncate">Páginas & Textos</span>
            <span class="text-[9.5px] font-mono-code px-1.5 py-0.2 rounded" :class="store.section === 'docs' ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-bold' : 'bg-white/5 text-zinc-400'">
              {{ String(store.counts.docs ?? 0).padStart(2, '0') }}
            </span>
          </button>
        </div>

        <!-- GRUPO 3: EROS AI SUITE -->
        <div class="space-y-1">
          <div class="px-2.5 py-1 text-[10px] font-mono-code uppercase tracking-wider text-zinc-500 font-bold flex items-center justify-between">
            <span>02 // Eros AI Suite</span>
          </div>

          <!-- 07. Job Hunter -->
          <button
            type="button"
            @click="store.loadSection('hunter')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'hunter' }"
          >
            <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">07.</span>
            <span class="flex items-center" v-html="icons.hunter"></span>
            <span class="flex-1 truncate">Job Hunter (Eros)</span>
            <span class="text-[9.5px] font-mono-code bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20">
              {{ String(store.counts.hunter ?? 0).padStart(2, '0') }}
            </span>
          </button>

          <!-- 08. Contenido Omnicanal -->
          <button
            type="button"
            @click="store.loadSection('content')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'content' }"
          >
            <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">08.</span>
            <span class="flex items-center" v-html="icons.content"></span>
            <span class="flex-1 truncate">Contenido Omnicanal</span>
            <span class="text-[9.5px] font-mono-code bg-purple-500/10 text-purple-400 px-1.5 py-0.2 rounded border border-purple-500/20">
              {{ String(store.counts.content ?? 0).padStart(2, '0') }}
            </span>
          </button>

          <!-- 09. TrendRadar -->
          <button
            type="button"
            @click="store.loadSection('radar')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'radar' }"
          >
            <span class="font-mono-code text-[11px] text-zinc-500 w-4.5">09.</span>
            <span class="flex items-center" v-html="icons.radar"></span>
            <span class="flex-1 truncate">TrendRadar (Eros)</span>
            <span class="text-[9.5px] font-mono-code bg-cyan-500/10 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-500/20">
              {{ String(store.counts.radar ?? 0).padStart(2, '0') }}
            </span>
          </button>
        </div>
      </div>

      <!-- Footer de Sidebar con versión y telemetría de BD -->
      <div class="p-3 border-t border-white/5 text-[10.5px] font-mono-code text-zinc-500 flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <span class="status-dot live"></span>
          <span>PG-17 ACID</span>
        </div>
        <span class="text-zinc-600">v2026.2</span>
      </div>
    </aside>
  `,
}
