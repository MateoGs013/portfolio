// Componente Estructural: AdmContentManager
// Consola Ejecutiva de Contenido Omnicanal (Eros IA)
// Publicaciones para LinkedIn, Hilos de X (Twitter), Dev.to Markdown y Carruseles PDF

import { store } from '../store.js'
import { api } from '../api.js'
import { ICONS } from '../config.js'
import { AdmAiTrace } from './AdmAiTrace.js'

const { computed, ref } = window.Vue

export const AdmContentManager = {
  name: 'AdmContentManager',
  components: {
    AdmAiTrace,
  },
  setup() {
    const showGenModal = ref(false)
    const activeSubTab = ref('linkedin') // 'linkedin' | 'x' | 'devto' | 'carousel'
    const mobileContentMode = ref(store.content.selected ? 'detail' : 'list')

    // Estado del formulario generador
    const genForm = ref({
      topic: '',
      key_points: '',
      project_id: '',
      pillar: 'TECHNICAL_BREAKDOWN',
    })

    // Feedback de copiado individual
    const copiedKeys = ref({})

    function setCopied(key) {
      copiedKeys.value[key] = true
      setTimeout(() => {
        copiedKeys.value[key] = false
      }, 2500)
    }

    async function copyText(text, key, successMsg = 'Texto copiado al portapapeles') {
      if (!text) return
      try {
        await navigator.clipboard.writeText(text)
        setCopied(key)
        store.toast('ok', successMsg)
      } catch {
        store.toast('err', 'No se pudo copiar el texto')
      }
    }

    const filteredPosts = computed(() => {
      const q = store.searchQuery.trim().toLowerCase()
      let list = [...(store.content.posts || [])]

      if (store.content.filter === 'draft') {
        list = list.filter(p => p.status === 'draft')
      } else if (store.content.filter === 'published') {
        list = list.filter(p => p.status === 'published')
      } else if (store.content.filter === 'rejected') {
        list = list.filter(p => p.status === 'rejected')
      }

      if (q) {
        list = list.filter(p => {
          const t = (p.title || '').toLowerCase()
          const b = (p.body || '').toLowerCase()
          const h = (p.hook || '').toLowerCase()
          const pil = (p.pillar || '').toLowerCase()
          return t.includes(q) || b.includes(q) || h.includes(q) || pil.includes(q)
        })
      }

      list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
      return list
    })

    const counts = computed(() => {
      const all = store.content.posts || []
      return {
        total: all.length,
        draft: all.filter(p => p.status === 'draft').length,
        published: all.filter(p => p.status === 'published').length,
        rejected: all.filter(p => p.status === 'rejected').length,
      }
    })

    const twitterThreadList = computed(() => {
      const cur = store.content.selected
      if (!cur || !cur.twitter_thread) return []
      if (Array.isArray(cur.twitter_thread)) return cur.twitter_thread
      if (typeof cur.twitter_thread === 'string') {
        try {
          const parsed = JSON.parse(cur.twitter_thread)
          return Array.isArray(parsed) ? parsed : [cur.twitter_thread]
        } catch {
          return cur.twitter_thread.split('\n\n').filter(Boolean)
        }
      }
      return []
    })

    const carouselSlidesList = computed(() => {
      const cur = store.content.selected
      if (!cur || !cur.carousel_slides) return []
      if (Array.isArray(cur.carousel_slides)) return cur.carousel_slides
      if (typeof cur.carousel_slides === 'string') {
        try {
          const parsed = JSON.parse(cur.carousel_slides)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
      return []
    })

    function selectPost(p) {
      store.content.selected = p
      mobileContentMode.value = 'detail'
    }

    async function handleGenerateSubmit() {
      if (!genForm.value.topic.trim()) {
        store.toast('err', 'Por favor ingresa un tema central para la publicación')
        return
      }
      const points = genForm.value.key_points
        ? genForm.value.key_points.split('\n').map(s => s.trim()).filter(Boolean)
        : []

      try {
        await store.generateContentPost({
          topic: genForm.value.topic.trim(),
          key_points: points,
          project_id: genForm.value.project_id || undefined,
          pillar: genForm.value.pillar,
        })
        showGenModal.value = false
        genForm.value = {
          topic: '',
          key_points: '',
          project_id: '',
          pillar: 'TECHNICAL_BREAKDOWN',
        }
      } catch {
        // error manejado en store
      }
    }

    async function openCarouselWindow(id) {
      try {
        const ticketRes = await api.getCarouselTicket(id)
        const ticketParam = ticketRes?.ticket ? `?ticket=${encodeURIComponent(ticketRes.ticket)}` : ''
        const url = `${api.getCarouselUrl(id)}${ticketParam}`
        window.open(url, '_blank', 'noopener')
      } catch (err) {
        store.toast('err', `No se pudo abrir la vista previa: ${err.message}`)
      }
    }

    function formatPillar(p) {
      const map = {
        TECHNICAL_BREAKDOWN: 'Desglose Técnico',
        METRICS_DRIVEN: 'Impacto & Métricas',
        CONTROVERSIAL_TAKE: 'Debate / Punto Crítico',
        LEARNING_FAIL: 'Aprendizaje & Postmortem',
      }
      return map[p] || p || 'Estratégico'
    }

    const isPublishingToBlog = ref(false)

    async function handlePublishToBlog(id) {
      if (isPublishingToBlog.value) return
      isPublishingToBlog.value = true
      try {
        await store.publishPostToBlog(id)
      } finally {
        isPublishingToBlog.value = false
      }
    }

    function copyFullThread() {
      const full = (twitterThreadList.value || []).join('\n\n---\n\n')
      copyText(full, 'thread')
    }

    return {
      store,
      icons: ICONS,
      showGenModal,
      activeSubTab,
      mobileContentMode,
      genForm,
      copiedKeys,
      filteredPosts,
      counts,
      twitterThreadList,
      carouselSlidesList,
      selectPost,
      handleGenerateSubmit,
      copyText,
      copyFullThread,
      openCarouselWindow,
      formatPillar,
      isPublishingToBlog,
      handlePublishToBlog,
    }
  },
  template: `
    <div class="flex-1 flex flex-col overflow-hidden bg-[#08090a]">
      <!-- 1. BARRA SUPERIOR DE OPERACIONES EDITORIALES -->
      <header class="p-4 sm:p-5 border-b border-white/10 bg-[#0c0d10] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-2 h-2 rounded-full bg-purple-400"></span>
            <h1 class="text-base sm:text-lg font-bold text-white tracking-tight">
              Gestión de Contenido Omnicanal
            </h1>
            <span class="text-[10px] font-mono-code text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded font-bold">
              Eros IA
            </span>
          </div>
          <p class="text-xs text-zinc-400 mt-0.5">
            Ecosistema editorial omnicanal: posts de LinkedIn, hilos técnicos de X, artículos Dev.to y carruseles PDF.
          </p>
        </div>

        <div class="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            @click="store.loadContentPosts()"
            class="btn-secondary !h-[34px] !px-3 !text-xs cursor-pointer inline-flex items-center gap-1.5 font-mono-code"
            title="Recargar publicaciones de Eros"
          >
            <svg class="adm-icon sm" viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
            <span class="hidden sm:inline">Actualizar</span>
          </button>

          <button
            type="button"
            @click="showGenModal = true"
            :disabled="store.content.isGenerating"
            class="btn-primary !h-[34px] !px-3.5 !text-xs cursor-pointer inline-flex items-center gap-1.5 font-mono-code"
          >
            <span v-if="store.content.isGenerating" class="animate-spin text-xs">↻</span>
            <svg v-else class="adm-icon sm" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>{{ store.content.isGenerating ? 'Generando...' : '+ Nuevo Post IA' }}</span>
          </button>
        </div>
      </header>

      <!-- 2. MÉTRICAS EDITORIALES RESUMIDAS -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:px-5 sm:py-3 border-b border-white/5 bg-[#0a0b0e] shrink-0 text-xs font-mono-code">
        <div class="p-2.5 bg-[#121318] rounded-lg border border-white/5 flex items-center justify-between">
          <span class="text-zinc-400">Total Posts:</span>
          <span class="text-white font-bold">{{ counts.total }}</span>
        </div>
        <div class="p-2.5 bg-[#121318] rounded-lg border border-amber-500/20 flex items-center justify-between">
          <span class="text-amber-400">Borradores:</span>
          <span class="text-amber-400 font-bold">{{ counts.draft }}</span>
        </div>
        <div class="p-2.5 bg-[#121318] rounded-lg border border-emerald-500/20 flex items-center justify-between">
          <span class="text-emerald-400">Publicados:</span>
          <span class="text-emerald-400 font-bold">{{ counts.published }}</span>
        </div>
        <div class="p-2.5 bg-[#121318] rounded-lg border border-zinc-700 flex items-center justify-between">
          <span class="text-zinc-400">Descartados:</span>
          <span class="text-zinc-400 font-bold">{{ counts.rejected }}</span>
        </div>
      </div>

      <!-- 3. CUERPO PRINCIPAL (2 COLUMNAS: EXPLORADOR + DETALLE) -->
      <div class="flex-1 flex overflow-hidden">
        <!-- COLUMNA IZQUIERDA: LISTA DE PUBLICACIONES -->
        <section 
          class="w-full md:w-80 lg:w-96 border-r border-white/10 flex flex-col bg-[#0c0d10] shrink-0 overflow-hidden"
          :class="mobileContentMode === 'list' ? 'flex' : 'hidden md:flex'"
        >
          <!-- Barra de Búsqueda y Filtros de Estado -->
          <div class="p-3 border-b border-white/10 space-y-2 shrink-0">
            <div class="relative">
              <input
                v-model="store.searchQuery"
                type="text"
                placeholder="Filtrar por tema o título..."
                class="w-full bg-[#161720] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 font-mono-code"
              />
            </div>

            <!-- Chips de Filtro -->
            <div class="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-mono-code">
              <button
                type="button"
                @click="store.content.filter = 'all'"
                class="px-2 py-0.5 rounded cursor-pointer transition-colors"
                :class="store.content.filter === 'all' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold' : 'bg-white/5 text-zinc-400 hover:text-white'"
              >
                Todos ({{ counts.total }})
              </button>
              <button
                type="button"
                @click="store.content.filter = 'draft'"
                class="px-2 py-0.5 rounded cursor-pointer transition-colors"
                :class="store.content.filter === 'draft' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' : 'bg-white/5 text-zinc-400 hover:text-white'"
              >
                Borradores ({{ counts.draft }})
              </button>
              <button
                type="button"
                @click="store.content.filter = 'published'"
                class="px-2 py-0.5 rounded cursor-pointer transition-colors"
                :class="store.content.filter === 'published' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold' : 'bg-white/5 text-zinc-400 hover:text-white'"
              >
                Publicados ({{ counts.published }})
              </button>
              <button
                type="button"
                @click="store.content.filter = 'rejected'"
                class="px-2 py-0.5 rounded cursor-pointer transition-colors"
                :class="store.content.filter === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/30 font-bold' : 'bg-white/5 text-zinc-400 hover:text-white'"
              >
                Descartados ({{ counts.rejected }})
              </button>
            </div>
          </div>

          <!-- Lista de Items con Scroll -->
          <div class="flex-1 overflow-y-auto divide-y divide-white/5">
            <div
              v-for="p in filteredPosts"
              :key="p.id"
              @click="selectPost(p)"
              class="p-3.5 cursor-pointer transition-colors"
              :class="store.content.selected && store.content.selected.id === p.id 
                ? 'bg-[#181924] border-l-2 border-purple-500' 
                : 'hover:bg-white/[0.03]'"
            >
              <div class="flex items-center justify-between text-xs font-bold text-white gap-2">
                <span class="truncate">{{ p.title }}</span>
                <span
                  class="text-[9.5px] font-mono-code uppercase px-1.5 py-0.2 rounded border shrink-0"
                  :class="p.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : p.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'"
                >
                  {{ p.status }}
                </span>
              </div>

              <!-- Hook / Bajada -->
              <p class="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                {{ p.hook || p.body }}
              </p>

              <!-- Meta Footer -->
              <div class="text-[10px] font-mono-code text-zinc-500 mt-2 flex items-center justify-between gap-1">
                <span class="text-purple-400/80">{{ formatPillar(p.pillar) }}</span>
                <span v-if="p.carousel_slides" class="text-cyan-400 bg-cyan-500/10 px-1 py-0.2 rounded border border-cyan-500/20">
                  Carrusel
                </span>
              </div>
            </div>

            <!-- Estado Vacío -->
            <div v-if="filteredPosts.length === 0" class="p-8 text-center space-y-2">
              <div class="text-zinc-500 text-xs font-mono-code">No se encontraron publicaciones</div>
              <p class="text-[11px] text-zinc-600">Haz clic en '+ Nuevo Post IA' para redactar un contenido omnicanal.</p>
            </div>
          </div>
        </section>

        <!-- COLUMNA DERECHA: DETALLE Y ACCIONES DE PUBLICACIÓN -->
        <main 
          class="flex-1 flex flex-col bg-[#08090a] overflow-hidden"
          :class="mobileContentMode === 'detail' ? 'flex' : 'hidden md:flex'"
        >
          <!-- Si hay publicación seleccionada -->
          <div v-if="store.content.selected" class="flex-1 flex flex-col overflow-hidden">
            <!-- Header del Detalle -->
            <div class="p-4 sm:p-5 border-b border-white/10 bg-[#0c0d10] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div class="space-y-1">
                <!-- Botón Volver en móvil -->
                <button
                  type="button"
                  @click="mobileContentMode = 'list'"
                  class="md:hidden text-xs text-zinc-400 hover:text-white font-mono-code flex items-center gap-1 mb-1"
                >
                  ← Volver a lista
                </button>
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-sm sm:text-base font-bold text-white tracking-tight">
                    {{ store.content.selected.title }}
                  </h2>
                  <span
                    class="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded border font-bold"
                    :class="store.content.selected.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : store.content.selected.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'"
                  >
                    {{ store.content.selected.status }}
                  </span>
                  <span class="text-[10px] font-mono-code text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                    {{ formatPillar(store.content.selected.pillar) }}
                  </span>
                </div>
                <div class="text-[11px] text-zinc-500 font-mono-code">
                  ID: {{ store.content.selected.id }} · Creado: {{ store.content.selected.created_at ? store.content.selected.created_at.slice(0, 19).replace('T', ' ') : 'Reciente' }}
                </div>
              </div>

              <!-- Acciones de Cabecera -->
              <div class="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  @click="openCarouselWindow(store.content.selected.id)"
                  class="btn-secondary !h-[30px] !text-xs inline-flex items-center gap-1.5 font-mono-code text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10"
                >
                  <span>Ver Carrusel Web</span>
                  <svg class="adm-icon sm" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </button>

                <button
                  v-if="store.content.selected.status === 'draft'"
                  type="button"
                  @click="store.publishContentPost(store.content.selected.id, 'all')"
                  :disabled="store.content.publishing[store.content.selected.id]"
                  class="btn-primary !h-[30px] !text-xs inline-flex items-center gap-1.5 font-mono-code cursor-pointer"
                >
                  <span v-if="store.content.publishing[store.content.selected.id]" class="animate-spin text-xs">↻</span>
                  <span>{{ store.content.publishing[store.content.selected.id] ? 'Despachando...' : 'Aprobar & Despachar n8n' }}</span>
                </button>

                <button
                  v-if="store.content.selected.status === 'draft'"
                  type="button"
                  @click="store.updateContentPostStatus(store.content.selected.id, 'rejected')"
                  class="btn-secondary !h-[30px] !text-xs text-red-400 border-red-500/20 hover:bg-red-500/10 font-mono-code"
                >
                  Descartar
                </button>

                <button
                  type="button"
                  @click="store.deleteContentPost(store.content.selected.id)"
                  class="btn-secondary !h-[30px] !px-2.5 text-zinc-400 hover:text-red-400 hover:border-red-500/30"
                  title="Eliminar publicación"
                >
                  <svg class="adm-icon sm" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>

            <!-- Tabs de Plataformas Omnicanal -->
            <div class="px-5 border-b border-white/10 bg-[#0c0d10] flex items-center gap-4 text-xs font-mono-code shrink-0">
              <button
                type="button"
                @click="activeSubTab = 'linkedin'"
                class="py-3 border-b-2 font-medium transition-colors"
                :class="activeSubTab === 'linkedin' ? 'border-[#ff3e00] text-white font-bold' : 'border-transparent text-zinc-400 hover:text-white'"
              >
                LinkedIn Post
              </button>
              <button
                type="button"
                @click="activeSubTab = 'x'"
                class="py-3 border-b-2 font-medium transition-colors"
                :class="activeSubTab === 'x' ? 'border-[#ff3e00] text-white font-bold' : 'border-transparent text-zinc-400 hover:text-white'"
              >
                Hilo de X / Twitter ({{ twitterThreadList.length }})
              </button>
              <button
                type="button"
                @click="activeSubTab = 'devto'"
                class="py-3 border-b-2 font-medium transition-colors"
                :class="activeSubTab === 'devto' ? 'border-[#ff3e00] text-white font-bold' : 'border-transparent text-zinc-400 hover:text-white'"
              >
                Dev.to Markdown
              </button>
              <button
                type="button"
                @click="activeSubTab = 'carousel'"
                class="py-3 border-b-2 font-medium transition-colors"
                :class="activeSubTab === 'carousel' ? 'border-[#ff3e00] text-white font-bold' : 'border-transparent text-zinc-400 hover:text-white'"
              >
                Carrusel PDF / Slides ({{ carouselSlidesList.length }})
              </button>
            </div>

            <!-- Contenido con Scroll de la Pestaña Activa -->
            <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

              <!-- TAB 1: LINKEDIN POST -->
              <div v-if="activeSubTab === 'linkedin'" class="space-y-5">
                <!-- Gancho / Hook -->
                <div class="p-4 bg-[#121318] border border-amber-500/30 rounded-lg space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-mono-code uppercase font-bold text-amber-400">
                      Hook de Captura (Primeras 2 Líneas)
                    </span>
                    <button
                      type="button"
                      @click="copyText(store.content.selected.hook, 'hook')"
                      class="btn-secondary !h-[26px] !text-xs font-mono-code"
                    >
                      <span v-if="copiedKeys['hook']" class="text-emerald-400 font-bold">[COPIADO OK]</span>
                      <span v-else>Copiar Hook</span>
                    </button>
                  </div>
                  <p class="text-sm font-semibold text-white leading-relaxed font-sans">
                    {{ store.content.selected.hook }}
                  </p>
                </div>

                <!-- Cuerpo Completo del Post -->
                <div class="p-5 bg-[#121318] border border-white/10 rounded-lg space-y-3">
                  <div class="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <span class="text-xs font-mono-code uppercase font-bold text-zinc-300">
                      Cuerpo del Post LinkedIn
                    </span>
                    <button
                      type="button"
                      @click="copyText(store.content.selected.body, 'body')"
                      class="btn-primary !h-[28px] !text-xs font-mono-code cursor-pointer"
                    >
                      <span v-if="copiedKeys['body']" class="text-emerald-300 font-bold">[COPIADO OK]</span>
                      <span v-else>Copiar Post Completo</span>
                    </button>
                  </div>
                  <div class="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {{ store.content.selected.body }}
                  </div>
                </div>

                <!-- Primer Comentario Estratégico -->
                <div v-if="store.content.selected.first_comment" class="p-4 bg-[#121318] border border-white/10 rounded-lg space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-mono-code uppercase font-bold text-zinc-400">
                      Primer Comentario (Call-to-Action & Enlaces)
                    </span>
                    <button
                      type="button"
                      @click="copyText(store.content.selected.first_comment, 'first_comment')"
                      class="btn-secondary !h-[26px] !text-xs font-mono-code"
                    >
                      <span v-if="copiedKeys['first_comment']" class="text-emerald-400 font-bold">[COPIADO OK]</span>
                      <span v-else>Copiar 1er Comentario</span>
                    </button>
                  </div>
                  <p class="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {{ store.content.selected.first_comment }}
                  </p>
                </div>
              </div>

              <!-- TAB 2: HILO DE X / TWITTER -->
              <div v-else-if="activeSubTab === 'x'" class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-mono-code uppercase font-bold text-zinc-400">
                    Hilo Desglosado para X ({{ twitterThreadList.length }} Tweets)
                  </span>
                  <button
                    type="button"
                    @click="copyFullThread"
                    class="btn-secondary !h-[28px] !text-xs font-mono-code"
                  >
                    <span v-if="copiedKeys['thread']" class="text-emerald-400 font-bold">[COPIADO OK]</span>
                    <span v-else>Copiar Hilo Completo</span>
                  </button>
                </div>

                <div class="space-y-3">
                  <div
                    v-for="(tw, twIdx) in twitterThreadList"
                    :key="twIdx"
                    class="p-4 bg-[#121318] border border-white/10 rounded-lg space-y-2"
                  >
                    <div class="flex items-center justify-between text-xs font-mono-code text-zinc-500">
                      <span class="text-purple-400 font-bold">Tweet {{ twIdx + 1 }}/{{ twitterThreadList.length }}</span>
                      <button
                        type="button"
                        @click="copyText(tw, 'tw_' + twIdx)"
                        class="text-zinc-400 hover:text-white text-[11px]"
                      >
                        <span v-if="copiedKeys['tw_' + twIdx]" class="text-emerald-400 font-bold">[COPIADO OK]</span>
                        <span v-else>Copiar</span>
                      </button>
                    </div>
                    <p class="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap">
                      {{ tw }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- TAB 3: DEV.TO MARKDOWN & BLOG PORTFOLIO -->
              <div v-else-if="activeSubTab === 'devto'" class="space-y-4">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <span class="text-xs font-mono-code uppercase font-bold text-zinc-400">
                    Artículo Técnico Formateado en Markdown
                  </span>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      @click="handlePublishToBlog(store.content.selected.id)"
                      :disabled="isPublishingToBlog"
                      class="btn-primary !h-[28px] !text-xs font-mono-code cursor-pointer bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white"
                      title="Publicar directamente como artículo en /articles"
                    >
                      <svg v-if="isPublishingToBlog" class="adm-icon xs animate-spin inline-block mr-1" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      <span>{{ isPublishingToBlog ? 'Publicando...' : 'Publicar en Blog del Portafolio' }}</span>
                    </button>
                    <button
                      type="button"
                      @click="copyText(store.content.selected.devto_markdown, 'devto')"
                      class="btn-secondary !h-[28px] !text-xs font-mono-code cursor-pointer"
                    >
                      <span v-if="copiedKeys['devto']" class="text-emerald-300 font-bold">[COPIADO OK]</span>
                      <span v-else>Copiar Markdown Dev.to</span>
                    </button>
                  </div>
                </div>

                <div class="p-4 bg-[#0c0d10] border border-white/10 rounded-lg">
                  <pre class="text-xs font-mono-code text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text">{{ store.content.selected.devto_markdown || '(No hay contenido de Dev.to para esta publicación)' }}</pre>
                </div>
              </div>

              <!-- TAB 4: CARRUSEL PDF / SLIDES -->
              <div v-else-if="activeSubTab === 'carousel'" class="space-y-4">
                <div class="p-4 bg-[#121318] border border-cyan-500/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 class="text-xs font-bold font-mono-code text-white uppercase tracking-wider">
                      Carrusel Técnico Multi-Slide
                    </h3>
                    <p class="text-[11px] text-zinc-400 mt-0.5">
                      {{ carouselSlidesList.length }} diapositivas generadas con estética Obsidian Dark y Martian Mono.
                    </p>
                  </div>
                  <button
                    type="button"
                    @click="openCarouselWindow(store.content.selected.id)"
                    class="btn-primary !h-[32px] !text-xs inline-flex items-center gap-1.5 font-mono-code cursor-pointer"
                  >
                    <span>Abrir Visor Web</span>
                    <svg class="adm-icon sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7"/><polyline points="7 7 17 7 17 17"/></svg>
                  </button>
                </div>

                <!-- Diapositivas Preview -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    v-for="(slide, sIdx) in carouselSlidesList"
                    :key="sIdx"
                    class="p-4 bg-[#121318] border border-white/10 rounded-lg space-y-2"
                  >
                    <div class="flex items-center justify-between text-[11px] font-mono-code text-zinc-500">
                      <span class="text-cyan-400 font-bold">Slide {{ sIdx + 1 }}/{{ carouselSlidesList.length }}</span>
                      <span class="uppercase text-[9px] bg-white/5 px-1.5 py-0.2 rounded">{{ slide.type || 'Contenido' }}</span>
                    </div>
                    <div class="text-xs font-bold text-white">{{ slide.title }}</div>
                    <p v-if="slide.subtitle" class="text-[11px] text-zinc-400">{{ slide.subtitle }}</p>
                    <div v-if="slide.bullets" class="space-y-1 pt-1">
                      <div v-for="(b, bIdx) in slide.bullets" :key="bIdx" class="text-[11px] text-zinc-300 flex items-start gap-1.5">
                        <span class="text-[#ff3e00]">•</span>
                        <span>{{ b }}</span>
                      </div>
                    </div>
                    <div v-if="slide.code" class="p-2 bg-[#08090a] rounded border border-white/5 text-[10px] font-mono-code text-emerald-300 overflow-x-auto">
                      <code>{{ slide.code }}</code>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Estado Vacío Cuando No Hay Selección -->
          <div v-else class="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-3">
            <svg class="adm-icon w-12 h-12 text-zinc-600" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="4" y1="10" x2="20" y2="10"/></svg>
            <div class="text-xs font-mono-code">Selecciona una publicación para ver su desglose omnicanal</div>
            <p class="text-[11px] text-zinc-600 max-w-sm">
              Podrás inspeccionar el gancho, el cuerpo para LinkedIn, el hilo de Twitter, el markdown para Dev.to y su carrusel web.
            </p>
          </div>
        </main>
      </div>

      <!-- 4. MODAL: GENERAR NUEVO POST CON EROS IA -->
      <div
        v-if="showGenModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        @click.self="showGenModal = false"
      >
        <div class="bg-[#121318] border border-white/15 rounded-xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in duration-150">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-purple-400"></span>
              <h3 class="text-sm font-bold font-mono-code text-white uppercase tracking-wider">
                Generador Omnicanal Eros IA
              </h3>
            </div>
            <button
              type="button"
              @click="showGenModal = false"
              class="text-zinc-400 hover:text-white text-xs font-mono-code"
            >
              [X] Cerrar
            </button>
          </div>

          <!-- Traza de Razonamiento IA (Bencho UI) -->
          <adm-ai-trace
            :active="store.content.isGenerating"
            title="EROS // GENERACIÓN OMNICANAL"
            :steps="[
              'Extrayendo tesis técnica y pilar editorial',
              'Consultando contexto relacional en PostgreSQL 17',
              'Estructurando desglose para LinkedIn, X y Blog',
              'Optimizando diagramas técnicos y síntesis final con Gemini'
            ]"
          />

          <form @submit.prevent="handleGenerateSubmit" class="space-y-3.5 text-xs">
            <div>
              <label class="block text-[11px] font-mono-code text-zinc-400 uppercase mb-1">
                Tema / Concepto Central *
              </label>
              <input
                v-model="genForm.topic"
                type="text"
                required
                placeholder="Ej: Cómo implementé RAG con Gemini y PostgreSQL en el portfolio"
                class="w-full bg-[#181924] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 font-sans"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-mono-code text-zinc-400 uppercase mb-1">
                  Pilar Editorial
                </label>
                <select
                  v-model="genForm.pillar"
                  class="w-full bg-[#181924] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50 font-mono-code"
                >
                  <option value="TECHNICAL_BREAKDOWN">Desglose Técnico</option>
                  <option value="METRICS_DRIVEN">Impacto & Métricas</option>
                  <option value="CONTROVERSIAL_TAKE">Debate / Punto Crítico</option>
                  <option value="LEARNING_FAIL">Aprendizaje & Fail</option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-mono-code text-zinc-400 uppercase mb-1">
                  Proyecto de Referencia
                </label>
                <select
                  v-model="genForm.project_id"
                  class="w-full bg-[#181924] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50 font-mono-code"
                >
                  <option value="">(Ninguno / Genérico)</option>
                  <option
                    v-for="p in store.meta.options.projects"
                    :key="p.id"
                    :value="p.id"
                  >
                    {{ p.title }}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-mono-code text-zinc-400 uppercase mb-1">
                Puntos Clave / Ideas a Incluir (Uno por línea)
              </label>
              <textarea
                v-model="genForm.key_points"
                rows="3"
                placeholder="• PostgreSQL 17 con pgvector
• Búsqueda híbrida con scoring
• Despliegue en VPS Coolify"
                class="w-full bg-[#181924] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 font-mono-code"
              ></textarea>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                @click="showGenModal = false"
                class="btn-secondary !h-[32px] !text-xs font-mono-code"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="store.content.isGenerating"
                class="btn-primary !h-[32px] !px-4 !text-xs font-mono-code cursor-pointer inline-flex items-center gap-1.5"
              >
                <span v-if="store.content.isGenerating" class="animate-spin text-xs">↻</span>
                <span>{{ store.content.isGenerating ? 'Generando con Eros IA...' : 'Generar Contenido IA' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
}
