// Componente Estructural: AdmSidebar
// Barra lateral de 240px agrupada por jerarquía con badges numéricos y hover sutil

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
    <aside class="hidden md:flex w-60 bg-[#0c0d10] border-r border-white/10 flex-col shrink-0 select-none">
      <div class="p-3 space-y-6 flex-1 overflow-y-auto">
        <!-- GRUPO 1: VISTA GENERAL -->
        <div class="space-y-1">
          <div class="px-2.5 py-1 text-[10px] font-mono-code uppercase tracking-wider text-zinc-500 font-bold">
            Vista General
          </div>
          <button
            type="button"
            @click="store.loadSection('dashboard')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'dashboard' }"
          >
            <span v-html="icons.dashboard"></span>
            <span class="flex-1 truncate">Panel Principal</span>
          </button>
        </div>

        <!-- GRUPO 2: CONTENIDO -->
        <div class="space-y-1">
          <div class="px-2.5 py-1 text-[10px] font-mono-code uppercase tracking-wider text-zinc-500 font-bold">
            Contenido
          </div>

          <button
            type="button"
            @click="store.loadSection('projects')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'projects' }"
          >
            <span v-html="icons.projects"></span>
            <span class="flex-1 truncate">Proyectos</span>
            <span class="text-[10px] font-mono-code bg-white/5 px-1.5 py-0.2 rounded text-zinc-400">
              {{ store.counts.projects }}
            </span>
          </button>

          <button
            type="button"
            @click="store.loadSection('experience')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'experience' }"
          >
            <span v-html="icons.experience"></span>
            <span class="flex-1 truncate">Experiencia Laboral</span>
            <span class="text-[10px] font-mono-code bg-white/5 px-1.5 py-0.2 rounded text-zinc-400">
              {{ store.counts.experience }}
            </span>
          </button>

          <button
            type="button"
            @click="store.loadSection('stack')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'stack' }"
          >
            <span v-html="icons.stack"></span>
            <span class="flex-1 truncate">Habilidades & Stack</span>
            <span class="text-[10px] font-mono-code bg-white/5 px-1.5 py-0.2 rounded text-zinc-400">
              {{ store.counts.stack }}
            </span>
          </button>

          <button
            type="button"
            @click="store.loadSection('orgs')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'orgs' }"
          >
            <span v-html="icons.orgs"></span>
            <span class="flex-1 truncate">Empresas & Clientes</span>
            <span class="text-[10px] font-mono-code bg-white/5 px-1.5 py-0.2 rounded text-zinc-400">
              {{ store.counts.orgs }}
            </span>
          </button>

          <button
            type="button"
            @click="store.loadSection('docs')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'docs' }"
          >
            <span v-html="icons.docs"></span>
            <span class="flex-1 truncate">Páginas & Textos</span>
            <span class="text-[10px] font-mono-code bg-white/5 px-1.5 py-0.2 rounded text-zinc-400">
              {{ store.counts.docs }}
            </span>
          </button>
        </div>

        <!-- GRUPO 3: HERRAMIENTAS & IA -->
        <div class="space-y-1">
          <div class="px-2.5 py-1 text-[10px] font-mono-code uppercase tracking-wider text-zinc-500 font-bold">
            Herramientas & IA
          </div>

          <button
            type="button"
            @click="store.loadSection('hunter')"
            class="nav-item w-full text-left"
            :class="{ active: store.section === 'hunter' }"
          >
            <span v-html="icons.hunter"></span>
            <span class="flex-1 truncate">Job Hunter (Eros)</span>
            <span class="text-[10px] font-mono-code bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20">
              {{ store.counts.hunter }}
            </span>
          </button>
        </div>
      </div>

      <!-- Footer de Sidebar con versión -->
      <div class="p-3 border-t border-white/5 text-[10.5px] font-mono-code text-zinc-600 flex items-center justify-between">
        <span>Obsidian Console</span>
        <span>v2026.2</span>
      </div>
    </aside>
  `,
}
