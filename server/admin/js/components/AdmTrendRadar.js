// Componente Estructural: AdmTrendRadar
// Radar de Tendencias Técnicas & Blogs de Ingeniería (Eros IA)
// Monitorea Hacker News, Dev.to, GitHub y feeds técnicos para curaduría omnicanal y blog del portafolio.

import { store } from '../store.js'
import { ICONS } from '../config.js'

const { computed, ref } = window.Vue

export const AdmTrendRadar = {
  name: 'AdmTrendRadar',
  setup() {
    const mobileRadarMode = ref(store.radar.selected ? 'detail' : 'list')
    const customAngleInput = ref('')
    const selectedPillar = ref('TECHNICAL_BREAKDOWN')
    const selectedProjectSlug = ref('')

    const filteredTrends = computed(() => {
      const q = store.searchQuery.trim().toLowerCase()
      let list = [...(store.radar.trends || [])]

      if (store.radar.filter === 'HACKER_NEWS') {
        list = list.filter(t => t.source === 'HACKER_NEWS')
      } else if (store.radar.filter === 'DEVTO') {
        list = list.filter(t => t.source === 'DEVTO')
      } else if (store.radar.filter === 'GITHUB') {
        list = list.filter(t => t.source === 'GITHUB')
      } else if (store.radar.filter === 'DISCOVERED') {
        list = list.filter(t => t.status === 'DISCOVERED')
      } else if (store.radar.filter === 'GENERATED') {
        list = list.filter(t => t.status === 'GENERATED')
      }

      if (q) {
        list = list.filter(t => {
          const title = (t.title || '').toLowerCase()
          const summary = (t.summary || '').toLowerCase()
          const angle = (t.engineering_angle || '').toLowerCase()
          const tags = (t.tags || []).join(' ').toLowerCase()
          return title.includes(q) || summary.includes(q) || angle.includes(q) || tags.includes(q)
        })
      }

      list.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
      return list
    })

    const counts = computed(() => {
      const all = store.radar.trends || []
      return {
        total: all.length,
        hn: all.filter(t => t.source === 'HACKER_NEWS').length,
        devto: all.filter(t => t.source === 'DEVTO').length,
        github: all.filter(t => t.source === 'GITHUB').length,
        discovered: all.filter(t => t.status === 'DISCOVERED').length,
        generated: all.filter(t => t.status === 'GENERATED').length,
      }
    })

    function selectTrend(trend) {
      store.radar.selected = trend
      mobileRadarMode.value = 'detail'
      customAngleInput.value = ''
    }

    async function handleGenerate(trend) {
      if (!trend) return
      try {
        await store.generateFromRadarTrend(trend.id, {
          pillar: selectedPillar.value,
          project_slug: selectedProjectSlug.value || undefined,
          custom_angle: customAngleInput.value.trim() || undefined,
        })
      } catch {
        // error manejado en store
      }
    }

    function formatSource(src) {
      const map = {
        HACKER_NEWS: 'Hacker News',
        DEVTO: 'Dev.to',
        GITHUB: 'GitHub',
        TECH_RSS: 'Tech RSS',
      }
      return map[src] || src
    }

    function formatScoreColor(score) {
      if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      if (score >= 65) return 'text-amber-400 border-amber-500/30 bg-amber-500/10'
      return 'text-zinc-400 border-zinc-500/30 bg-zinc-500/10'
    }

    return {
      store,
      icons: ICONS,
      mobileRadarMode,
      customAngleInput,
      selectedPillar,
      selectedProjectSlug,
      filteredTrends,
      counts,
      selectTrend,
      handleGenerate,
      formatSource,
      formatScoreColor,
    }
  },
  template: `
    <div class="flex-1 flex flex-col overflow-hidden bg-[#08090a]">
      <!-- 1. BARRA SUPERIOR DE OPERACIONES RADAR -->
      <header class="p-4 sm:p-5 border-b border-white/10 bg-[#0c0d10] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <h1 class="text-base sm:text-lg font-bold text-white tracking-tight">
              TrendRadar · Exploración de Tendencias
            </h1>
            <span class="text-[10px] font-mono-code text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded font-bold">
              Eros IA
            </span>
          </div>
          <p class="text-xs text-zinc-400 mt-0.5">
            Monitoreo continuo de Hacker News, Dev.to, GitHub y blogs de ingeniería para publicaciones de alta señal técnica.
          </p>
        </div>

        <div class="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            @click="store.loadRadarTrends()"
            class="btn-secondary !h-[34px] !px-3 !text-xs cursor-pointer inline-flex items-center gap-1.5 font-mono-code"
            title="Recargar tendencias guardadas"
          >
            <svg class="adm-icon sm" viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
            <span class="hidden sm:inline">Actualizar</span>
          </button>

          <button
            type="button"
            @click="store.scanRadar()"
            :disabled="store.radar.isScanning"
            class="btn-primary !h-[34px] !px-3.5 !text-xs cursor-pointer inline-flex items-center gap-1.5 font-mono-code bg-cyan-600 hover:bg-cyan-500 border-cyan-500"
          >
            <span v-if="store.radar.isScanning" class="animate-spin text-xs">↻</span>
            <svg v-else class="adm-icon sm" viewBox="0 0 24 24"><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07"/><path d="M16.24 7.76A6 6 0 0 0 7.76 16.24"/><path d="M13.41 10.59a2 2 0 0 0-2.82 2.82"/><line x1="12" y1="12" x2="21" y2="3"/></svg>
            <span>{{ store.radar.isScanning ? 'Escaneando Fuentes...' : 'Escanear Tendencias Ahora' }}</span>
          </button>
        </div>
      </header>

      <!-- 2. CONTENIDO PRINCIPAL: MASTER-DETAIL DUAL PANE -->
      <div class="flex-1 flex overflow-hidden">

        <!-- PANEL IZQUIERDO: LISTA DE TENDENCIAS -->
        <aside
          class="w-full md:w-[380px] lg:w-[420px] border-r border-white/10 bg-[#0c0d10] flex flex-col shrink-0"
          :class="{ 'hidden md:flex': mobileRadarMode === 'detail' && store.radar.selected }"
        >
          <!-- Buscador y Filtros -->
          <div class="p-3.5 border-b border-white/10 space-y-2.5">
            <div class="relative">
              <input
                type="text"
                v-model="store.searchQuery"
                placeholder="Buscar tendencias o tecnologías..."
                class="w-full bg-[#121318] border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff3e00] font-mono-code"
              />
              <button
                v-if="store.searchQuery"
                type="button"
                @click="store.searchQuery = ''"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
              >
                ×
              </button>
            </div>

            <!-- Chips de Filtro -->
            <div class="flex items-center gap-1.5 flex-wrap text-[11px] font-mono-code">
              <button
                type="button"
                @click="store.radar.filter = 'all'"
                class="px-2 py-0.5 rounded border transition-colors cursor-pointer"
                :class="store.radar.filter === 'all' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 font-bold' : 'border-white/5 text-zinc-400 hover:text-white'"
              >
                Todas ({{ counts.total }})
              </button>
              <button
                type="button"
                @click="store.radar.filter = 'HACKER_NEWS'"
                class="px-2 py-0.5 rounded border transition-colors cursor-pointer"
                :class="store.radar.filter === 'HACKER_NEWS' ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold' : 'border-white/5 text-zinc-400 hover:text-white'"
              >
                HN ({{ counts.hn }})
              </button>
              <button
                type="button"
                @click="store.radar.filter = 'DEVTO'"
                class="px-2 py-0.5 rounded border transition-colors cursor-pointer"
                :class="store.radar.filter === 'DEVTO' ? 'border-purple-500 bg-purple-500/10 text-purple-300 font-bold' : 'border-white/5 text-zinc-400 hover:text-white'"
              >
                Dev.to ({{ counts.devto }})
              </button>
              <button
                type="button"
                @click="store.radar.filter = 'GITHUB'"
                class="px-2 py-0.5 rounded border transition-colors cursor-pointer"
                :class="store.radar.filter === 'GITHUB' ? 'border-blue-500 bg-blue-500/10 text-blue-300 font-bold' : 'border-white/5 text-zinc-400 hover:text-white'"
              >
                GitHub ({{ counts.github }})
              </button>
              <button
                type="button"
                @click="store.radar.filter = 'DISCOVERED'"
                class="px-2 py-0.5 rounded border transition-colors cursor-pointer"
                :class="store.radar.filter === 'DISCOVERED' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold' : 'border-white/5 text-zinc-400 hover:text-white'"
              >
                Nuevas ({{ counts.discovered }})
              </button>
            </div>
          </div>

          <!-- Lista de Items con Scroll -->
          <div class="flex-1 overflow-y-auto divide-y divide-white/5">
            <div
              v-for="trend in filteredTrends"
              :key="trend.id"
              @click="selectTrend(trend)"
              class="p-3.5 cursor-pointer transition-colors hover:bg-white/[0.03]"
              :class="{
                'bg-white/[0.06] border-l-2 border-l-cyan-400': store.radar.selected && store.radar.selected.id === trend.id,
              }"
            >
              <div class="flex items-center justify-between gap-2 mb-1.5">
                <span class="text-[10px] font-mono-code font-bold uppercase px-1.5 py-0.2 rounded border" :class="formatScoreColor(trend.relevance_score)">
                  {{ trend.relevance_score }}% AFINIDAD
                </span>
                <span class="text-[10px] font-mono-code text-zinc-500">
                  {{ formatSource(trend.source) }}
                </span>
              </div>

              <h3 class="text-xs font-bold text-white leading-snug line-clamp-2 font-sans mb-1.5">
                {{ trend.title }}
              </h3>

              <p class="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-2">
                {{ trend.engineering_angle || trend.summary }}
              </p>

              <div class="flex items-center justify-between gap-1 text-[10px] font-mono-code">
                <div class="flex items-center gap-1 flex-wrap">
                  <span
                    v-for="tag in (trend.tags || []).slice(0, 3)"
                    :key="tag"
                    class="bg-white/5 text-zinc-400 px-1.5 py-0.2 rounded"
                  >
                    #{{ tag }}
                  </span>
                </div>
                <span
                  v-if="trend.status === 'GENERATED'"
                  class="text-emerald-400 font-bold"
                >
                  ✓ GENERADA
                </span>
              </div>
            </div>

            <div v-if="filteredTrends.length === 0" class="p-8 text-center text-zinc-500 text-xs font-mono-code">
              No se encontraron tendencias con los filtros activos.
            </div>
          </div>
        </aside>

        <!-- PANEL DERECHO: DETALLE DE TENDENCIA & ACCIÓN GENERADORA -->
        <main
          class="flex-1 flex flex-col bg-[#08090a] overflow-hidden"
          :class="{ 'hidden md:flex': mobileRadarMode === 'list' && !store.radar.selected }"
        >
          <div v-if="store.radar.selected" class="flex-1 flex flex-col overflow-hidden">
            <!-- Barra Superior de Detalle -->
            <div class="p-4 sm:p-5 border-b border-white/10 bg-[#0c0d10] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="mobileRadarMode = 'list'"
                  class="md:hidden btn-secondary !h-[30px] !px-2 text-xs"
                >
                  ← Volver
                </button>
                <span class="text-xs font-mono-code font-bold uppercase px-2 py-0.5 rounded border" :class="formatScoreColor(store.radar.selected.relevance_score)">
                  {{ store.radar.selected.relevance_score }}% AFINIDAD TÉCNICA
                </span>
                <span class="text-xs font-mono-code text-zinc-400">
                  Fuente: {{ formatSource(store.radar.selected.source) }}
                </span>
              </div>

              <div class="flex items-center gap-2 flex-wrap">
                <a
                  :href="store.radar.selected.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-secondary !h-[30px] !text-xs font-mono-code inline-flex items-center gap-1.5"
                >
                  <span>Abrir Fuente Original ↗</span>
                </a>

                <button
                  v-if="store.radar.selected.status === 'DISCOVERED'"
                  type="button"
                  @click="store.updateRadarTrendStatus(store.radar.selected.id, 'DISCARDED')"
                  class="btn-secondary !h-[30px] !text-xs text-red-400 border-red-500/20 hover:bg-red-500/10 font-mono-code"
                >
                  Descartar
                </button>
              </div>
            </div>

            <!-- Contenido con Scroll -->
            <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              <!-- Título de la Tendencia -->
              <div class="space-y-2">
                <h2 class="text-base sm:text-xl font-bold text-white leading-snug font-sans">
                  {{ store.radar.selected.title }}
                </h2>
                <div class="flex items-center gap-2 text-xs font-mono-code text-zinc-400 flex-wrap">
                  <span>Enlace:</span>
                  <a :href="store.radar.selected.url" target="_blank" rel="noopener noreferrer" class="text-cyan-400 underline truncate max-w-md">
                    {{ store.radar.selected.url }}
                  </a>
                </div>
              </div>

              <!-- Caja Destacada: Ángulo de Ingeniería Sugerido -->
              <div class="p-4 sm:p-5 bg-[#121318] border-l-4 border-l-[#ff3e00] border-y border-r border-white/10 rounded-r-lg space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-mono-code font-bold uppercase tracking-wider text-[#ff3e00]">
                    Ángulo de Ingeniería Sugerido (Enfoque Crítico)
                  </span>
                  <span class="text-[10px] font-mono-code text-zinc-500">OPTIMIZADO PARA TU STACK</span>
                </div>
                <p class="text-xs sm:text-sm text-zinc-100 font-sans leading-relaxed">
                  {{ store.radar.selected.engineering_angle }}
                </p>
              </div>

              <!-- Síntesis Técnica Detectada -->
              <div class="p-4 bg-[#121318] border border-white/10 rounded-lg space-y-2">
                <span class="text-xs font-mono-code font-bold uppercase tracking-wider text-zinc-400">
                  Resumen & Discusión Original
                </span>
                <p class="text-xs text-zinc-300 font-sans leading-relaxed">
                  {{ store.radar.selected.summary }}
                </p>
                <div class="pt-2 flex items-center gap-1.5 flex-wrap">
                  <span
                    v-for="tag in (store.radar.selected.tags || [])"
                    :key="tag"
                    class="bg-white/5 border border-white/5 text-zinc-400 text-[10px] font-mono-code px-2 py-0.5 rounded"
                  >
                    #{{ tag }}
                  </span>
                </div>
              </div>

              <!-- Formulario de Acción Generadora 1-Click -->
              <div class="p-5 bg-[#0c0d10] border border-cyan-500/30 rounded-lg space-y-4">
                <div class="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 class="text-xs sm:text-sm font-bold font-mono-code text-white uppercase tracking-wider">
                      Generador Omnicanal de Publicación & Blog
                    </h3>
                    <p class="text-[11px] text-zinc-400 mt-0.5">
                      Crea un post para LinkedIn, hilo de Twitter, carrusel y artículo técnico para el Blog del Portafolio.
                    </p>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[11px] font-mono-code text-zinc-400 mb-1.5">
                      Pilar Editorial
                    </label>
                    <select
                      v-model="selectedPillar"
                      class="w-full bg-[#121318] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono-code"
                    >
                      <option value="TECHNICAL_BREAKDOWN">Desglose Técnico & Arquitectura</option>
                      <option value="METRICS_DRIVEN">Impacto & Rendimiento de Producción</option>
                      <option value="CONTROVERSIAL_TAKE">Debate / Punto Crítico Contrarian</option>
                      <option value="LEARNING_FAIL">Aprendizaje & Lecciones de Fallo</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-[11px] font-mono-code text-zinc-400 mb-1.5">
                      Vincular a Proyecto del Portafolio (Opcional)
                    </label>
                    <select
                      v-model="selectedProjectSlug"
                      class="w-full bg-[#121318] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono-code"
                    >
                      <option value="">Sin vincular a proyecto específico</option>
                      <option value="ynara">Ynara AI (RAG, pgvector, FastAPI)</option>
                      <option value="la-rucula">La Rúcula Gastrobar (Vue 3, GSAP, Offline-first)</option>
                      <option value="argpiscinas">ARG Piscinas (Prisma, Nuxt 4, Multilingüe)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-mono-code text-zinc-400 mb-1.5">
                    Ángulo Personalizado (Opcional - Reemplaza o complementa el sugerido)
                  </label>
                  <textarea
                    v-model="customAngleInput"
                    rows="2"
                    placeholder="Escribe un enfoque o aprendizaje personal específico si lo deseas..."
                    class="w-full bg-[#121318] border border-white/10 rounded p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400 font-sans"
                  ></textarea>
                </div>

                <div class="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    @click="handleGenerate(store.radar.selected)"
                    :disabled="store.radar.isGenerating"
                    class="btn-primary !h-[38px] !px-5 !text-xs font-mono-code cursor-pointer bg-[#ff3e00] hover:bg-[#ff551e] border-[#ff3e00] text-white flex items-center gap-2"
                  >
                    <span v-if="store.radar.isGenerating" class="animate-spin text-xs">↻</span>
                    <span>{{ store.radar.isGenerating ? 'Generando Ecosistema Omnicanal...' : 'Generar Publicación Omnicanal & Blog →' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Estado Vacío Cuando No Hay Selección -->
          <div v-else class="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-3">
            <svg class="adm-icon w-12 h-12 text-zinc-600" viewBox="0 0 24 24"><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07"/><path d="M16.24 7.76A6 6 0 0 0 7.76 16.24"/><path d="M13.41 10.59a2 2 0 0 0-2.82 2.82"/><line x1="12" y1="12" x2="21" y2="3"/></svg>
            <div class="text-xs font-mono-code">Selecciona una tendencia del radar técnico</div>
            <p class="text-[11px] text-zinc-600 max-w-sm">
              Podrás inspeccionar el ángulo de ingeniería evaluado y disparar la generación omnicanal adaptada a tu perfil en 1 clic.
            </p>
          </div>
        </main>

      </div>
    </div>
  `,
}
