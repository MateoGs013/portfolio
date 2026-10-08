// Componente Estructural: AdmDashboard
// Panel principal ejecutivo con métricas de 3 segundos, accesos rápidos y estado del sistema

import { store } from '../store.js'

export const AdmDashboard = {
  name: 'AdmDashboard',
  setup() {
    return {
      store,
    }
  },
  template: `
    <div class="flex-1 overflow-y-auto p-8 space-y-8 bg-[#08090a]">
      <!-- Header Ejecutivo -->
      <div class="space-y-1">
        <h1 class="text-xl font-bold text-white tracking-tight">Consola de Operaciones</h1>
        <p class="text-xs text-zinc-400">
          Resumen ejecutivo del portafolio, base de datos relacional y agente de reclutamiento IA.
        </p>
      </div>

      <!-- Cuadrícula de 4 Métricas de Alta Densidad -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 1. Proyectos -->
        <div
          @click="store.loadSection('projects')"
          class="p-4 bg-[#121318] hover:bg-[#16171f] border border-white/10 hover:border-[#ff3e00]/50 rounded-xl transition-all cursor-pointer space-y-3 group"
        >
          <div class="flex items-center justify-between text-zinc-400 text-xs font-mono-code">
            <span>Proyectos en Vivo</span>
            <span class="status-dot live"></span>
          </div>
          <div class="text-3xl font-extrabold text-white tracking-tight font-mono-code group-hover:text-[#ff3e00] transition-colors">
            {{ store.counts.projects }}
          </div>
          <div class="text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Casos de estudio</span>
            <span class="text-zinc-400 group-hover:text-white transition-colors">Ver lista →</span>
          </div>
        </div>

        <!-- 2. Experiencia -->
        <div
          @click="store.loadSection('experience')"
          class="p-4 bg-[#121318] hover:bg-[#16171f] border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer space-y-3 group"
        >
          <div class="flex items-center justify-between text-zinc-400 text-xs font-mono-code">
            <span>Trayectoria</span>
            <span class="status-dot wip"></span>
          </div>
          <div class="text-3xl font-extrabold text-white tracking-tight font-mono-code group-hover:text-zinc-200 transition-colors">
            {{ store.counts.experience }}
          </div>
          <div class="text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Posiciones y roles</span>
            <span class="text-zinc-400 group-hover:text-white transition-colors">Gestionar →</span>
          </div>
        </div>

        <!-- 3. Stack -->
        <div
          @click="store.loadSection('stack')"
          class="p-4 bg-[#121318] hover:bg-[#16171f] border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer space-y-3 group"
        >
          <div class="flex items-center justify-between text-zinc-400 text-xs font-mono-code">
            <span>Stack Técnico</span>
            <span class="status-dot live"></span>
          </div>
          <div class="text-3xl font-extrabold text-white tracking-tight font-mono-code group-hover:text-zinc-200 transition-colors">
            {{ store.counts.stack }}
          </div>
          <div class="text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Herramientas activas</span>
            <span class="text-zinc-400 group-hover:text-white transition-colors">Revisar →</span>
          </div>
        </div>

        <!-- 4. Job Hunter -->
        <div
          @click="store.loadSection('hunter')"
          class="p-4 bg-[#121318] hover:bg-[#16171f] border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl transition-all cursor-pointer space-y-3 group"
        >
          <div class="flex items-center justify-between text-emerald-400 text-xs font-mono-code">
            <span>Oportunidades IA</span>
            <span class="status-dot live"></span>
          </div>
          <div class="text-3xl font-extrabold text-emerald-400 tracking-tight font-mono-code">
            {{ store.counts.hunter }}
          </div>
          <div class="text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Vacantes rastreadas</span>
            <span class="text-emerald-400 group-hover:text-emerald-300 transition-colors">Abrir consola →</span>
          </div>
        </div>
      </div>

      <!-- Accesos Rápidos & Operaciones Inmediatas -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Bloque de Acciones -->
        <div class="p-5 bg-[#0f1014] border border-white/10 rounded-xl space-y-3">
          <h3 class="text-xs font-bold font-mono-code text-white uppercase tracking-wider">
            Accesos Rápidos de Curaduría
          </h3>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              @click="store.loadSection('projects').then(() => store.createRecord())"
              class="btn-secondary !h-[34px] !justify-start !px-3 !text-xs cursor-pointer"
            >
              + Nuevo Proyecto
            </button>
            <button
              type="button"
              @click="store.loadSection('experience').then(() => store.createRecord())"
              class="btn-secondary !h-[34px] !justify-start !px-3 !text-xs cursor-pointer"
            >
              + Nueva Experiencia
            </button>
            <button
              type="button"
              @click="store.loadSection('stack').then(() => store.createRecord())"
              class="btn-secondary !h-[34px] !justify-start !px-3 !text-xs cursor-pointer"
            >
              + Añadir Tecnología
            </button>
            <button
              type="button"
              @click="store.loadSection('orgs').then(() => store.createRecord())"
              class="btn-secondary !h-[34px] !justify-start !px-3 !text-xs cursor-pointer"
            >
              + Añadir Empresa
            </button>
          </div>
        </div>

        <!-- Bloque de Infraestructura & Salud -->
        <div class="p-5 bg-[#0f1014] border border-white/10 rounded-xl space-y-3">
          <h3 class="text-xs font-bold font-mono-code text-white uppercase tracking-wider">
            Infraestructura & Despliegue
          </h3>
          <div class="space-y-2 text-xs font-mono-code text-zinc-400">
            <div class="flex items-center justify-between p-2 bg-[#08090a] rounded border border-white/5">
              <span>Motor de Base de Datos</span>
              <span class="text-white font-semibold">PostgreSQL 17 (Prisma ORM)</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-[#08090a] rounded border border-white/5">
              <span>Servidor Web & API</span>
              <span class="text-white font-semibold">Express 5 + Nuxt 4 Nitro</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-[#08090a] rounded border border-white/5">
              <span>Alojamiento y Dominio</span>
              <span class="text-emerald-400 font-semibold">VPS Coolify · Docker Compose</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
}
