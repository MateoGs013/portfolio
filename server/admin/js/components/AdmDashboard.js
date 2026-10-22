// Componente Estructural: AdmDashboard
// Panel principal ejecutivo con Bento Grid de métricas, accesos rápidos y estado del sistema Linear 2026
// Cero emojis, telemetría ACID y micro-interacciones táctiles

import { store } from '../store.js'
import { ICONS } from '../config.js'

export const AdmDashboard = {
  name: 'AdmDashboard',
  setup() {
    return {
      store,
      icons: ICONS,
    }
  },
  template: `
    <div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 bg-[#080808] blueprint-grid select-none">
      <!-- Header Ejecutivo Linear -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-[#ff3e00]"></span>
            <span class="text-[11px] font-mono-code uppercase tracking-wider text-zinc-400 font-bold">
              00 // Consola de Operaciones
            </span>
          </div>
          <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Panel Ejecutivo y Telemetría
          </h1>
          <p class="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Resumen centralizado del portafolio técnico, colecciones relacionales PostgreSQL 17 y suite de inteligencia artificial Eros.
          </p>
        </div>

        <div class="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            @click="store.refreshCounts()"
            class="inline-flex items-center gap-1.5 h-7.5 px-3 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 font-mono-code text-[11px] text-zinc-300 hover:text-white active:scale-[0.97] transition-all cursor-pointer"
            title="Recargar métricas"
          >
            <span v-html="icons.refresh"></span>
            <span>Sincronizar</span>
          </button>
          <a
            href="/"
            target="_blank"
            class="inline-flex items-center gap-1.5 h-7.5 px-3 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 font-mono-code text-[11px] text-zinc-300 hover:text-white no-underline active:scale-[0.97] transition-all"
          >
            <span>Sitio Público</span>
            <span v-html="icons.external"></span>
          </a>
        </div>
      </div>

      <!-- Cuadrícula Bento de Métricas Principales -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <!-- 1. Proyectos -->
        <div
          @click="store.loadSection('projects')"
          class="p-4 sm:p-5 bg-[#0c0d10]/90 backdrop-blur-sm hover:bg-[#121318] border border-white/10 hover:border-[#ff3e00]/50 rounded-xl transition-all cursor-pointer space-y-3 group shadow-xs active:scale-[0.99]"
        >
          <div class="flex items-center justify-between text-zinc-400 text-xs font-mono-code">
            <span class="flex items-center gap-1.5">
              <span class="text-zinc-500">01.</span>
              <span>Proyectos en Vivo</span>
            </span>
            <span class="status-dot live"></span>
          </div>
          <div class="text-3xl font-extrabold text-white tracking-tight font-mono-code group-hover:text-[#ff3e00] transition-colors">
            {{ String(store.counts.projects ?? 0).padStart(2, '0') }}
          </div>
          <div class="text-[11px] text-zinc-500 font-mono-code flex items-center justify-between pt-1 border-t border-white/5">
            <span>Casos de estudio</span>
            <span class="text-zinc-400 group-hover:text-white transition-colors">Explorar →</span>
          </div>
        </div>

        <!-- 2. Experiencia -->
        <div
          @click="store.loadSection('experience')"
          class="p-4 sm:p-5 bg-[#0c0d10]/90 backdrop-blur-sm hover:bg-[#121318] border border-white/10 hover:border-white/25 rounded-xl transition-all cursor-pointer space-y-3 group shadow-xs active:scale-[0.99]"
        >
          <div class="flex items-center justify-between text-zinc-400 text-xs font-mono-code">
            <span class="flex items-center gap-1.5">
              <span class="text-zinc-500">02.</span>
              <span>Trayectoria</span>
            </span>
            <span class="status-dot live"></span>
          </div>
          <div class="text-3xl font-extrabold text-white tracking-tight font-mono-code group-hover:text-zinc-200 transition-colors">
            {{ String(store.counts.experience ?? 0).padStart(2, '0') }}
          </div>
          <div class="text-[11px] text-zinc-500 font-mono-code flex items-center justify-between pt-1 border-t border-white/5">
            <span>Posiciones y roles</span>
            <span class="text-zinc-400 group-hover:text-white transition-colors">Gestionar →</span>
          </div>
        </div>

        <!-- 3. Stack Técnico -->
        <div
          @click="store.loadSection('stack')"
          class="p-4 sm:p-5 bg-[#0c0d10]/90 backdrop-blur-sm hover:bg-[#121318] border border-white/10 hover:border-white/25 rounded-xl transition-all cursor-pointer space-y-3 group shadow-xs active:scale-[0.99]"
        >
          <div class="flex items-center justify-between text-zinc-400 text-xs font-mono-code">
            <span class="flex items-center gap-1.5">
              <span class="text-zinc-500">03.</span>
              <span>Stack Técnico</span>
            </span>
            <span class="status-dot live"></span>
          </div>
          <div class="text-3xl font-extrabold text-white tracking-tight font-mono-code group-hover:text-zinc-200 transition-colors">
            {{ String(store.counts.stack ?? 0).padStart(2, '0') }}
          </div>
          <div class="text-[11px] text-zinc-500 font-mono-code flex items-center justify-between pt-1 border-t border-white/5">
            <span>Tecnologías activas</span>
            <span class="text-zinc-400 group-hover:text-white transition-colors">Revisar →</span>
          </div>
        </div>

        <!-- 4. Empresas & Clientes -->
        <div
          @click="store.loadSection('orgs')"
          class="p-4 sm:p-5 bg-[#0c0d10]/90 backdrop-blur-sm hover:bg-[#121318] border border-white/10 hover:border-white/25 rounded-xl transition-all cursor-pointer space-y-3 group shadow-xs active:scale-[0.99]"
        >
          <div class="flex items-center justify-between text-zinc-400 text-xs font-mono-code">
            <span class="flex items-center gap-1.5">
              <span class="text-zinc-500">04.</span>
              <span>Empresas & Clientes</span>
            </span>
            <span class="status-dot live"></span>
          </div>
          <div class="text-3xl font-extrabold text-white tracking-tight font-mono-code group-hover:text-zinc-200 transition-colors">
            {{ String(store.counts.orgs ?? 0).padStart(2, '0') }}
          </div>
          <div class="text-[11px] text-zinc-500 font-mono-code flex items-center justify-between pt-1 border-t border-white/5">
            <span>Organizaciones</span>
            <span class="text-zinc-400 group-hover:text-white transition-colors">Detalles →</span>
          </div>
        </div>
      </div>

      <!-- Cuadrícula Bento de Suite Eros AI y Blog -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <!-- 5. Job Hunter (Eros) -->
        <div
          @click="store.loadSection('hunter')"
          class="p-4 sm:p-5 bg-[#0c0d10]/90 backdrop-blur-sm hover:bg-[#121318] border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl transition-all cursor-pointer space-y-3 group shadow-xs active:scale-[0.99]"
        >
          <div class="flex items-center justify-between text-emerald-400 text-xs font-mono-code">
            <span class="flex items-center gap-1.5">
              <span class="text-emerald-500/60">07.</span>
              <span>Job Hunter (Eros)</span>
            </span>
            <span class="status-dot live"></span>
          </div>
          <div class="text-3xl font-extrabold text-emerald-400 tracking-tight font-mono-code">
            {{ String(store.counts.hunter ?? 0).padStart(2, '0') }}
          </div>
          <div class="text-[11px] text-zinc-500 font-mono-code flex items-center justify-between pt-1 border-t border-white/5">
            <span>Vacantes rastreadas</span>
            <span class="text-emerald-400 group-hover:text-emerald-300 transition-colors">Consola IA →</span>
          </div>
        </div>

        <!-- 6. Contenido Omnicanal (Eros) -->
        <div
          @click="store.loadSection('content')"
          class="p-4 sm:p-5 bg-[#0c0d10]/90 backdrop-blur-sm hover:bg-[#121318] border border-purple-500/20 hover:border-purple-500/40 rounded-xl transition-all cursor-pointer space-y-3 group shadow-xs active:scale-[0.99]"
        >
          <div class="flex items-center justify-between text-purple-400 text-xs font-mono-code">
            <span class="flex items-center gap-1.5">
              <span class="text-purple-500/60">08.</span>
              <span>Contenido Omnicanal</span>
            </span>
            <span class="status-dot live"></span>
          </div>
          <div class="text-3xl font-extrabold text-purple-400 tracking-tight font-mono-code">
            {{ String(store.counts.content ?? 0).padStart(2, '0') }}
          </div>
          <div class="text-[11px] text-zinc-500 font-mono-code flex items-center justify-between pt-1 border-t border-white/5">
            <span>Posts y carruseles</span>
            <span class="text-purple-400 group-hover:text-purple-300 transition-colors">Editorial IA →</span>
          </div>
        </div>

        <!-- 7. TrendRadar (Eros) -->
        <div
          @click="store.loadSection('radar')"
          class="p-4 sm:p-5 bg-[#0c0d10]/90 backdrop-blur-sm hover:bg-[#121318] border border-cyan-500/20 hover:border-cyan-500/40 rounded-xl transition-all cursor-pointer space-y-3 group shadow-xs active:scale-[0.99]"
        >
          <div class="flex items-center justify-between text-cyan-400 text-xs font-mono-code">
            <span class="flex items-center gap-1.5">
              <span class="text-cyan-500/60">09.</span>
              <span>TrendRadar (Eros)</span>
            </span>
            <span class="status-dot live"></span>
          </div>
          <div class="text-3xl font-extrabold text-cyan-400 tracking-tight font-mono-code">
            {{ String(store.counts.radar ?? 0).padStart(2, '0') }}
          </div>
          <div class="text-[11px] text-zinc-500 font-mono-code flex items-center justify-between pt-1 border-t border-white/5">
            <span>Tendencias de mercado</span>
            <span class="text-cyan-400 group-hover:text-cyan-300 transition-colors">Radar técnico →</span>
          </div>
        </div>
      </div>

      <!-- Accesos Rápidos & Operaciones Inmediatas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <!-- Bloque de Acciones de Curaduría -->
        <div class="p-5 bg-[#0c0d10]/90 backdrop-blur-sm border border-white/10 rounded-xl space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold font-mono-code text-white uppercase tracking-wider flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-[#ff3e00]"></span>
              <span>Accesos Rápidos de Creación</span>
            </h3>
            <span class="text-[10px] font-mono-code text-zinc-500">Atajo: Ctrl + N</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              @click="store.loadSection('projects').then(() => store.createRecord())"
              class="btn-secondary !h-9 !justify-start !px-3 font-mono-code text-zinc-300 hover:text-white"
            >
              <span class="text-[#ff3e00] font-bold">+</span>
              <span>Nuevo Proyecto</span>
            </button>
            <button
              type="button"
              @click="store.loadSection('experience').then(() => store.createRecord())"
              class="btn-secondary !h-9 !justify-start !px-3 font-mono-code text-zinc-300 hover:text-white"
            >
              <span class="text-[#ff3e00] font-bold">+</span>
              <span>Nueva Experiencia</span>
            </button>
            <button
              type="button"
              @click="store.loadSection('stack').then(() => store.createRecord())"
              class="btn-secondary !h-9 !justify-start !px-3 font-mono-code text-zinc-300 hover:text-white"
            >
              <span class="text-[#ff3e00] font-bold">+</span>
              <span>Añadir Tecnología</span>
            </button>
            <button
              type="button"
              @click="store.loadSection('orgs').then(() => store.createRecord())"
              class="btn-secondary !h-9 !justify-start !px-3 font-mono-code text-zinc-300 hover:text-white"
            >
              <span class="text-[#ff3e00] font-bold">+</span>
              <span>Añadir Empresa</span>
            </button>
            <button
              type="button"
              @click="store.loadSection('articles').then(() => store.createRecord())"
              class="btn-secondary !h-9 !justify-start !px-3 font-mono-code text-zinc-300 hover:text-white"
            >
              <span class="text-[#ff3e00] font-bold">+</span>
              <span>Nuevo Artículo / Blog</span>
            </button>
            <button
              type="button"
              @click="store.loadSection('content')"
              class="btn-secondary !h-9 !justify-start !px-3 font-mono-code text-purple-300 border-purple-500/20 hover:bg-purple-500/10"
            >
              <span class="text-purple-400 font-bold">+</span>
              <span>Generar con Eros IA</span>
            </button>
          </div>
        </div>

        <!-- Bloque de Infraestructura & Salud del Servidor -->
        <div class="p-5 bg-[#0c0d10]/90 backdrop-blur-sm border border-white/10 rounded-xl space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold font-mono-code text-white uppercase tracking-wider flex items-center gap-2">
              <span class="status-dot live"></span>
              <span>Infraestructura & Telemetría</span>
            </h3>
            <span class="text-[10px] font-mono-code text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
              SISTEMA EN LÍNEA
            </span>
          </div>

          <div class="space-y-2 text-xs font-mono-code text-zinc-400">
            <div class="flex items-center justify-between p-2.5 bg-black/40 rounded-lg border border-white/5">
              <span class="text-zinc-500">Base de Datos</span>
              <span class="text-white font-medium flex items-center gap-1.5">
                <span class="status-dot live"></span>
                <span>PostgreSQL 17 (Prisma ORM)</span>
              </span>
            </div>
            <div class="flex items-center justify-between p-2.5 bg-black/40 rounded-lg border border-white/5">
              <span class="text-zinc-500">Servidor API & SSR</span>
              <span class="text-white font-medium">Express 5 + Nuxt 4 Nitro</span>
            </div>
            <div class="flex items-center justify-between p-2.5 bg-black/40 rounded-lg border border-white/5">
              <span class="text-zinc-500">Arquitectura de Despliegue</span>
              <span class="text-emerald-400 font-medium">VPS Coolify · Docker Compose</span>
            </div>
            <div class="flex items-center justify-between p-2.5 bg-black/40 rounded-lg border border-white/5">
              <span class="text-zinc-500">Seguridad & Sesión</span>
              <span class="text-zinc-300 font-medium">Bearer Token · ACID Isolation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
}
