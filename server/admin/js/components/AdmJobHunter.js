// Componente Estructural: AdmJobHunter
// Consola ejecutiva de Job Hunter (Eros IA) con medidor de match y visor ATS Harvard

import { store } from '../store.js'
import { api } from '../api.js'

const { computed, ref } = window.Vue

export const AdmJobHunter = {
  name: 'AdmJobHunter',
  setup() {
    const hunterPitch = ref(null)
    const currentTailoredCV = ref(null)
    const activePitchTab = ref('elevator') // 'elevator' | 'cover' | 'subject'

    const filteredJobs = computed(() => {
      const q = store.searchQuery.trim().toLowerCase()
      let list = store.hunter.jobs || []

      if (store.hunter.filter === 'high') {
        list = list.filter(j => (j.match_score || 0) >= 70)
      } else if (store.hunter.filter === 'applied') {
        list = list.filter(j => j.status === 'applied')
      } else if (store.hunter.filter === 'saved') {
        list = list.filter(j => j.status === 'saved')
      } else if (store.hunter.filter === 'discarded') {
        list = list.filter(j => j.status === 'discarded')
      }

      if (!q) return list
      return list.filter(j => {
        const title = (j.title || '').toLowerCase()
        const comp = (j.company || '').toLowerCase()
        const src = (j.source || '').toLowerCase()
        return title.includes(q) || comp.includes(q) || src.includes(q)
      })
    })

    const selectedAnalysis = computed(() => {
      if (!store.hunter.selected || !store.hunter.selected.match_analysis) return null
      try {
        const val = typeof store.hunter.selected.match_analysis === 'string'
          ? JSON.parse(store.hunter.selected.match_analysis)
          : store.hunter.selected.match_analysis
        return val
      } catch {
        return null
      }
    })

    const pitchData = computed(() => {
      if (!hunterPitch.value) return null
      const raw = hunterPitch.value
      if (typeof raw === 'object') {
        return raw.data || raw
      }
      try {
        const parsed = JSON.parse(raw)
        return parsed.data || parsed
      } catch {
        return { elevator_pitch: String(raw) }
      }
    })

    const cvData = computed(() => {
      if (!currentTailoredCV.value) return null
      const raw = currentTailoredCV.value
      if (typeof raw === 'object') {
        return raw.data || raw.cv || raw
      }
      try {
        const parsed = JSON.parse(raw)
        return parsed.data || parsed.cv || parsed
      } catch {
        return null
      }
    })

    function selectJob(j) {
      store.hunter.selected = j
      hunterPitch.value = null
      currentTailoredCV.value = null
      activePitchTab.value = 'elevator'

      if (j.pitch_draft) {
        try {
          hunterPitch.value = typeof j.pitch_draft === 'string' ? JSON.parse(j.pitch_draft) : j.pitch_draft
        } catch {
          hunterPitch.value = j.pitch_draft
        }
      }
      if (j.tailored_cv) {
        try {
          currentTailoredCV.value = typeof j.tailored_cv === 'string' ? JSON.parse(j.tailored_cv) : j.tailored_cv
        } catch {
          currentTailoredCV.value = j.tailored_cv
        }
      }
    }

    async function setJobStatus(status) {
      if (!store.hunter.selected) return
      try {
        await api.updateHunterJobStatus(store.hunter.selected.id, status)
        store.hunter.selected.status = status
        store.toast('ok', `Vacante marcada como: ${status}`)
      } catch (err) {
        store.toast('err', `Error al cambiar estado: ${err.message}`)
      }
    }

    async function generatePitch() {
      if (!store.hunter.selected || store.hunter.isPitching) return
      store.hunter.isPitching = true
      try {
        const res = await api.generateHunterPitch(store.hunter.selected.id)
        const data = res?.data || res?.pitch || res
        hunterPitch.value = data
        store.hunter.selected.pitch_draft = typeof data === 'object' ? JSON.stringify(data) : data
        store.toast('ok', 'Propuesta y carta generadas con Eros IA')
      } catch (err) {
        store.toast('err', `Error al redactar propuesta: ${err.message}`)
      } finally {
        store.hunter.isPitching = false
      }
    }

    async function copyPitchText(field = 'elevator') {
      const data = pitchData.value
      if (!data) return
      let text = ''
      if (field === 'elevator') {
        text = data.elevator_pitch || data.pitch || JSON.stringify(data)
      } else if (field === 'cover') {
        text = data.cover_letter || data.letter || data.elevator_pitch || ''
      } else if (field === 'subject') {
        text = data.subject_or_hook || data.subject || ''
      }

      if (!text) return
      await navigator.clipboard.writeText(text)
      store.hunter.copiedPitch = true
      store.toast('ok', 'Texto copiado al portapapeles')
      setTimeout(() => { store.hunter.copiedPitch = false }, 2500)
    }

    async function generateTailoredCV() {
      if (!store.hunter.selected || store.hunter.isGeneratingCV) return
      store.hunter.isGeneratingCV = true
      try {
        const res = await api.generateHunterCV(store.hunter.selected.id)
        const data = res?.data || res?.cv || res
        currentTailoredCV.value = data
        store.hunter.selected.tailored_cv = typeof data === 'object' ? JSON.stringify(data) : data
        store.toast('ok', 'CV Harvard ATS adaptado y priorizado')
      } catch (err) {
        store.toast('err', `Error al adaptar CV: ${err.message}`)
      } finally {
        store.hunter.isGeneratingCV = false
      }
    }

    async function copyTailoredCVText() {
      const cv = cvData.value
      if (!cv) return
      const lines = [
        cv.name || 'MATEO GABRIEL SONZOGNI',
        `${cv.title || ''} | ${cv.location || ''} | ${cv.email || 'mateogabus@gmail.com'}`,
        `${cv.portfolio || 'https://mateogs.tech'} | ${cv.github || ''} | ${cv.linkedin || ''}`,
        '',
        'PROFESSIONAL SUMMARY',
        cv.summary || '',
        '',
        'CORE COMPETENCIES & STACK',
      ]
      if (cv.skills && typeof cv.skills === 'object') {
        for (const [cat, items] of Object.entries(cv.skills)) {
          const list = Array.isArray(items) ? items.join(', ') : String(items)
          lines.push(`${cat}: ${list}`)
        }
      }
      lines.push('', 'EXPERIENCE & SHIPPED WORK')
      if (Array.isArray(cv.experience)) {
        for (const exp of cv.experience) {
          lines.push(`${exp.title || exp.company || ''} — ${exp.role || ''} (${exp.period || ''})`)
          if (Array.isArray(exp.bullets)) {
            for (const b of exp.bullets) {
              lines.push(`• ${b}`)
            }
          }
          lines.push('')
        }
      }
      if (Array.isArray(cv.education)) {
        lines.push('EDUCATION')
        for (const edu of cv.education) {
          lines.push(`${edu.degree || edu.title || ''} — ${edu.institution || ''} (${edu.period || ''})`)
        }
        lines.push('')
      }
      await navigator.clipboard.writeText(lines.join('\n'))
      store.toast('ok', 'CV ATS copiado en texto plano')
    }

    function openTailoredCVHtml() {
      if (!store.hunter.selected) return
      const url = `/api/admin/hunter/cv/${encodeURIComponent(store.hunter.selected.id)}/html`
      window.open(url, '_blank')
    }

    function getVerdictClass(verdict) {
      const v = (verdict || '').toUpperCase()
      if (v.includes('BUEN') || v.includes('HIGH') || v.includes('ALTO')) {
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      }
      if (v.includes('MEDIO') || v.includes('MID')) {
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      }
      return 'text-zinc-400 bg-white/5 border-white/10'
    }

    return {
      store,
      hunterPitch,
      pitchData,
      currentTailoredCV,
      cvData,
      activePitchTab,
      filteredJobs,
      selectedAnalysis,
      selectJob,
      setJobStatus,
      generatePitch,
      copyPitchText,
      generateTailoredCV,
      copyTailoredCVText,
      openTailoredCVHtml,
      getVerdictClass,
    }
  },
  template: `
    <div class="flex-1 flex overflow-hidden bg-[#08090a]">
      <!-- Lista Lateral de Vacantes (340px) -->
      <div class="w-84 bg-[#101114] border-r border-white/10 flex flex-col shrink-0 overflow-hidden select-none">
        <div class="p-3 border-b border-white/10 space-y-2.5 bg-[#0c0d10]">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <h2 class="text-xs font-bold text-white uppercase font-mono-code tracking-wide">
                Eros Hunter
              </h2>
              <span class="text-[10px] font-mono-code bg-white/5 text-zinc-400 px-1.5 py-0.2 rounded border border-white/10">
                {{ filteredJobs.length }}
              </span>
            </div>

            <button
              type="button"
              @click="store.scanHunterJobs"
              :disabled="store.hunter.isScanning"
              class="btn-primary !h-[26px] !px-2.5 !text-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <span v-if="store.hunter.isScanning" class="animate-spin inline-block text-[11px]">↻</span>
              <span>{{ store.hunter.isScanning ? 'Escaneando...' : 'Escanear' }}</span>
            </button>
          </div>

          <!-- Buscador -->
          <div class="relative">
            <input
              type="text"
              v-model="store.searchQuery"
              placeholder="Buscar rol, empresa o portal..."
              class="text-input !h-[30px] pl-7 text-xs font-mono-code"
            />
            <svg class="adm-icon sm text-zinc-500 absolute left-2 top-1/2 -translate-y-1/2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>

          <!-- Filtros de Vacantes -->
          <div class="flex items-center gap-1 text-[10.5px] font-mono-code flex-wrap">
            <button
              type="button"
              @click="store.hunter.filter = 'high'"
              class="px-2 py-0.5 rounded transition-colors cursor-pointer"
              :class="store.hunter.filter === 'high' ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-bold border border-[#ff3e00]/30' : 'text-zinc-500 hover:text-white'"
            >
              Score &ge; 70%
            </button>
            <button
              type="button"
              @click="store.hunter.filter = 'all'"
              class="px-2 py-0.5 rounded transition-colors cursor-pointer"
              :class="store.hunter.filter === 'all' ? 'bg-white/15 text-white font-semibold' : 'text-zinc-500 hover:text-white'"
            >
              Todas
            </button>
            <button
              type="button"
              @click="store.hunter.filter = 'saved'"
              class="px-2 py-0.5 rounded transition-colors cursor-pointer"
              :class="store.hunter.filter === 'saved' ? 'bg-amber-500/15 text-amber-300 font-semibold' : 'text-zinc-500 hover:text-white'"
            >
              Guardadas
            </button>
            <button
              type="button"
              @click="store.hunter.filter = 'applied'"
              class="px-2 py-0.5 rounded transition-colors cursor-pointer"
              :class="store.hunter.filter === 'applied' ? 'bg-emerald-500/15 text-emerald-300 font-semibold' : 'text-zinc-500 hover:text-white'"
            >
              Postuladas
            </button>
            <button
              type="button"
              @click="store.hunter.filter = 'discarded'"
              class="px-2 py-0.5 rounded transition-colors cursor-pointer"
              :class="store.hunter.filter === 'discarded' ? 'bg-red-500/15 text-red-300 font-semibold' : 'text-zinc-500 hover:text-white'"
            >
              Descartadas
            </button>
          </div>
        </div>

        <!-- Lista scrolleable de vacantes -->
        <div class="flex-1 overflow-y-auto divide-y divide-white/5">
          <div
            v-for="j in filteredJobs"
            :key="j.id"
            @click="selectJob(j)"
            class="p-3 cursor-pointer transition-colors"
            :class="store.hunter.selected && store.hunter.selected.id === j.id 
              ? 'bg-[#181920] border-l-2 border-[#10b981]' 
              : 'hover:bg-white/[0.03]'"
          >
            <div class="flex items-center justify-between text-xs font-bold text-white">
              <span class="truncate">{{ j.title }}</span>
              <span 
                class="font-mono-code font-bold text-[11px] shrink-0 ml-1.5"
                :class="(j.match_score || 0) >= 70 ? 'text-emerald-400' : (j.match_score || 0) >= 50 ? 'text-amber-400' : 'text-zinc-400'"
              >
                {{ j.match_score }}%
              </span>
            </div>
            <div class="text-[11px] text-zinc-400 mt-0.5 truncate">{{ j.company }} · <span class="capitalize">{{ j.source }}</span></div>
            <div class="text-[10px] font-mono-code text-zinc-500 mt-1.5 flex items-center justify-between">
              <span class="truncate max-w-[170px]">{{ j.country || j.salary || (j.is_remote ? 'Remoto' : 'Ubicación no esp.') }}</span>
              <span 
                class="uppercase px-1 py-0.2 rounded border text-[9px]"
                :class="j.status === 'applied' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : j.status === 'discarded' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-zinc-400 border-white/10'"
              >
                {{ j.status }}
              </span>
            </div>
          </div>

          <div v-if="filteredJobs.length === 0" class="p-8 text-center text-xs text-zinc-500 font-mono-code">
            Sin vacantes bajo este criterio. Presioná "Escanear" para consultar fuentes activas en Eros.
          </div>
        </div>
      </div>

      <!-- Detalle de la Vacante & Herramientas de IA -->
      <div class="flex-1 flex flex-col overflow-hidden bg-[#08090a]">
        <div v-if="store.hunter.selected" class="h-full flex flex-col overflow-hidden">
          
          <!-- Cabecera de Vacante -->
          <div class="p-5 border-b border-white/10 bg-[#0c0d10] flex items-center justify-between shrink-0 select-none">
            <div class="min-w-0 pr-4">
              <div class="flex items-center gap-2.5 flex-wrap">
                <h2 class="text-base font-bold text-white tracking-tight truncate">{{ store.hunter.selected.title }}</h2>
                <span 
                  class="text-xs font-mono-code font-bold px-2 py-0.5 rounded border"
                  :class="(store.hunter.selected.match_score || 0) >= 70 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'"
                >
                  {{ store.hunter.selected.match_score }}% Match
                </span>
                <span v-if="store.hunter.selected.is_remote" class="text-[10px] font-mono-code text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  Remoto
                </span>
              </div>
              <div class="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                <span class="font-semibold text-zinc-300">{{ store.hunter.selected.company }}</span>
                <span>·</span>
                <span class="capitalize">{{ store.hunter.selected.source }}</span>
                <span v-if="store.hunter.selected.country">·</span>
                <span v-if="store.hunter.selected.country" class="text-zinc-500 truncate">{{ store.hunter.selected.country }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <a
                v-if="store.hunter.selected.url"
                :href="store.hunter.selected.url"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-secondary !h-[30px] !text-xs inline-flex items-center gap-1.5"
              >
                <span>Oferta Original</span>
                <svg class="adm-icon sm" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>

              <button
                type="button"
                @click="generateTailoredCV"
                :disabled="store.hunter.isGeneratingCV"
                class="btn-primary !h-[30px] !text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span v-if="store.hunter.isGeneratingCV" class="animate-spin inline-block">↻</span>
                <span>{{ store.hunter.isGeneratingCV ? 'Adaptando CV...' : 'Generar CV Harvard ATS' }}</span>
              </button>
            </div>
          </div>

          <!-- Contenido con Scroll de Vacante -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            
            <!-- Análisis Estratégico de Eros IA -->
            <div v-if="selectedAnalysis" class="p-4.5 bg-[#121318] border border-white/10 rounded-lg space-y-4">
              <div class="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <h3 class="text-xs font-bold font-mono-code text-white uppercase tracking-wider">Evaluación Estratégica de Perfil</h3>
                </div>
                <div v-if="selectedAnalysis.verdict" class="text-[10px] font-mono-code uppercase font-bold px-2 py-0.5 rounded border" :class="getVerdictClass(selectedAnalysis.verdict)">
                  {{ selectedAnalysis.verdict }}
                </div>
              </div>

              <!-- Resumen Ejecutivo -->
              <p v-if="selectedAnalysis.summary" class="text-xs text-zinc-300 leading-relaxed font-sans bg-[#0c0d10] p-3 rounded border border-white/5">
                {{ selectedAnalysis.summary }}
              </p>

              <!-- Pros & Cons Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <!-- Pros -->
                <div v-if="selectedAnalysis.pros && selectedAnalysis.pros.length" class="p-3 bg-[#0c0d10] rounded border border-white/5 space-y-2">
                  <div class="flex items-center gap-1.5 text-emerald-400 font-mono-code text-[11px] font-bold">
                    <span class="w-1 h-1 rounded-full bg-emerald-400"></span>
                    <span>Puntos Fuertes a Favor</span>
                  </div>
                  <ul class="space-y-1.5 text-zinc-300 text-[11px]">
                    <li v-for="(p, pIdx) in selectedAnalysis.pros" :key="pIdx" class="flex items-start gap-1.5">
                      <span class="text-emerald-500 font-bold shrink-0 mt-0.5">+</span>
                      <span>{{ p }}</span>
                    </li>
                  </ul>
                </div>

                <!-- Cons / Objeciones -->
                <div v-if="selectedAnalysis.cons && selectedAnalysis.cons.length" class="p-3 bg-[#0c0d10] rounded border border-white/5 space-y-2">
                  <div class="flex items-center gap-1.5 text-amber-400 font-mono-code text-[11px] font-bold">
                    <span class="w-1 h-1 rounded-full bg-amber-400"></span>
                    <span>Posibles Objeciones o Desafíos</span>
                  </div>
                  <ul class="space-y-1.5 text-zinc-300 text-[11px]">
                    <li v-for="(c, cIdx) in selectedAnalysis.cons" :key="cIdx" class="flex items-start gap-1.5">
                      <span class="text-amber-500 font-bold shrink-0 mt-0.5">&minus;</span>
                      <span>{{ c }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Proyectos recomendados del Portfolio para respaldar postulación -->
              <div v-if="selectedAnalysis.matching_projects && selectedAnalysis.matching_projects.length" class="p-3 bg-[#0c0d10] rounded border border-white/5 space-y-2">
                <span class="text-zinc-400 block text-[11px] font-mono-code">Proyectos sugeridos para citar:</span>
                <div class="flex flex-wrap gap-1.5">
                  <span 
                    v-for="proj in selectedAnalysis.matching_projects" 
                    :key="proj" 
                    class="text-[10.5px] font-mono-code bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded font-medium"
                  >
                    {{ proj }}
                  </span>
                </div>
              </div>

              <!-- Habilidades faltantes si aplica -->
              <div v-if="selectedAnalysis.missing_skills && selectedAnalysis.missing_skills.length" class="p-3 bg-[#0c0d10] rounded border border-white/5 space-y-1.5">
                <span class="text-zinc-500 block text-[10.5px] font-mono-code">Skills no identificadas en tu CV:</span>
                <div class="flex flex-wrap gap-1">
                  <span v-for="sk in selectedAnalysis.missing_skills" :key="sk" class="text-[10px] font-mono-code bg-white/5 text-zinc-400 px-1.5 py-0.5 rounded border border-white/5">
                    {{ sk }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Propuesta de Contacto / Pitch & Cover Letter con Tabs -->
            <div class="p-4.5 bg-[#121318] border border-white/10 rounded-lg space-y-3.5">
              <div class="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#ff3e00]"></span>
                  <h3 class="text-xs font-bold font-mono-code text-white uppercase tracking-wider">Propuesta & Carta de Presentación</h3>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    v-if="!pitchData"
                    type="button"
                    @click="generatePitch"
                    :disabled="store.hunter.isPitching"
                    class="btn-secondary !h-[26px] !text-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span v-if="store.hunter.isPitching" class="animate-spin inline-block">↻</span>
                    <span>{{ store.hunter.isPitching ? 'Redactando...' : 'Generar Pitch con Eros' }}</span>
                  </button>

                  <div v-else class="flex items-center gap-1.5">
                    <button
                      type="button"
                      @click="copyPitchText(activePitchTab)"
                      class="btn-secondary !h-[26px] !text-xs cursor-pointer text-[#ff3e00]"
                    >
                      {{ store.hunter.copiedPitch ? 'Copiado' : 'Copiar' }}
                    </button>
                    <button
                      type="button"
                      @click="generatePitch"
                      :disabled="store.hunter.isPitching"
                      title="Regenerar propuesta"
                      class="btn-secondary !h-[26px] !px-2 !text-xs cursor-pointer text-zinc-400 hover:text-white"
                    >
                      ↻
                    </button>
                  </div>
                </div>
              </div>

              <!-- Tabs para elegir qué ver -->
              <div v-if="pitchData" class="flex items-center gap-2 text-xs font-mono-code">
                <button
                  type="button"
                  @click="activePitchTab = 'elevator'"
                  class="px-2.5 py-1 rounded transition-colors cursor-pointer"
                  :class="activePitchTab === 'elevator' ? 'bg-white/15 text-white font-bold' : 'text-zinc-500 hover:text-white'"
                >
                  Elevator Pitch
                </button>
                <button
                  v-if="pitchData.cover_letter"
                  type="button"
                  @click="activePitchTab = 'cover'"
                  class="px-2.5 py-1 rounded transition-colors cursor-pointer"
                  :class="activePitchTab === 'cover' ? 'bg-white/15 text-white font-bold' : 'text-zinc-500 hover:text-white'"
                >
                  Cover Letter (Carta)
                </button>
                <button
                  v-if="pitchData.subject_or_hook"
                  type="button"
                  @click="activePitchTab = 'subject'"
                  class="px-2.5 py-1 rounded transition-colors cursor-pointer"
                  :class="activePitchTab === 'subject' ? 'bg-white/15 text-white font-bold' : 'text-zinc-500 hover:text-white'"
                >
                  Asunto / Hook
                </button>
              </div>

              <!-- Contenido del Pitch Seleccionado -->
              <div v-if="pitchData" class="space-y-3">
                <div v-if="activePitchTab === 'elevator'" class="text-xs text-zinc-300 leading-relaxed bg-[#08090a] p-3.5 rounded border border-white/10 font-mono-code select-text whitespace-pre-line">
                  {{ pitchData.elevator_pitch || pitchData.pitch || pitchData }}
                </div>

                <div v-else-if="activePitchTab === 'cover'" class="text-xs text-zinc-300 leading-relaxed bg-[#08090a] p-3.5 rounded border border-white/10 font-mono-code select-text whitespace-pre-line">
                  {{ pitchData.cover_letter || 'Sin carta generada.' }}
                </div>

                <div v-else-if="activePitchTab === 'subject'" class="text-xs text-emerald-300 font-mono-code bg-[#08090a] p-3.5 rounded border border-white/10 select-text">
                  {{ pitchData.subject_or_hook || 'Sin asunto generado.' }}
                </div>

                <!-- Proyectos sugeridos en el pitch -->
                <div v-if="pitchData.suggested_projects && pitchData.suggested_projects.length" class="flex items-center gap-2 text-[11px] font-mono-code text-zinc-400">
                  <span class="text-zinc-500">Proyectos citados:</span>
                  <span v-for="sp in pitchData.suggested_projects" :key="sp" class="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300">
                    {{ sp }}
                  </span>
                </div>
              </div>

              <div v-else class="text-xs text-zinc-500 font-mono-code p-2">
                Hacé clic en "Generar Pitch con Eros" para que la IA elabore un speech persuasivo y una cover letter alineada a los requerimientos de la oferta.
              </div>
            </div>

            <!-- CV Harvard ATS Adaptado (Vista Previa B&W y Botón de HTML Oficial) -->
            <div v-if="cvData" class="p-4.5 bg-[#121318] border border-white/10 rounded-lg space-y-4">
              <div class="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    <h3 class="text-xs font-bold font-mono-code text-white uppercase tracking-wider">CV Harvard ATS Adaptado</h3>
                  </div>
                  <p class="text-[11px] text-zinc-400 mt-0.5">Palabras clave y proyectos jerarquizados específicamente para esta vacante.</p>
                </div>
                <div class="flex items-center gap-2">
                  <button 
                    type="button" 
                    @click="openTailoredCVHtml" 
                    class="btn-primary !h-[28px] !text-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Abrir HTML Oficial A4</span>
                    <svg class="adm-icon sm" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </button>
                  <button type="button" @click="copyTailoredCVText" class="btn-secondary !h-[28px] !text-xs cursor-pointer">
                    Copiar Texto ATS
                  </button>
                </div>
              </div>

              <!-- Tarjeta Visual Harvard ATS B&W -->
              <div class="bg-white text-black p-6 rounded shadow-sm font-serif text-xs space-y-3.5 select-text">
                <div class="text-center border-b border-black pb-2.5">
                  <div class="text-sm font-bold tracking-wider uppercase font-sans">{{ cvData.name || 'MATEO GABRIEL SONZOGNI' }}</div>
                  <div class="text-[10.5px] italic text-zinc-700 mt-0.5">
                    {{ cvData.title || 'Desarrollador Frontend & Full Stack' }} · {{ cvData.location || 'Argentina' }} · {{ cvData.email || 'mateogabus@gmail.com' }}
                  </div>
                </div>

                <!-- Professional Summary -->
                <div>
                  <div class="font-bold border-b border-black text-[11px] mb-1 font-sans uppercase tracking-wide">Professional Summary (Tailored)</div>
                  <p class="text-[10px] leading-relaxed text-justify text-zinc-800">
                    {{ cvData.summary || 'Software engineer specialized in reactive frontend architectures.' }}
                  </p>
                </div>

                <!-- Competencies & Skills -->
                <div v-if="cvData.skills && Object.keys(cvData.skills).length">
                  <div class="font-bold border-b border-black text-[11px] mb-1 font-sans uppercase tracking-wide">Core Competencies & Stack</div>
                  <div class="space-y-1 text-[10px]">
                    <div v-for="(skillsList, category) in cvData.skills" :key="category">
                      <span class="font-bold">{{ category }}: </span>
                      <span>{{ Array.isArray(skillsList) ? skillsList.join(', ') : skillsList }}</span>
                    </div>
                  </div>
                </div>

                <!-- Experience -->
                <div v-if="cvData.experience && cvData.experience.length">
                  <div class="font-bold border-b border-black text-[11px] mb-1.5 font-sans uppercase tracking-wide">Prioritized Experience & Shipped Projects</div>
                  <div v-for="exp in cvData.experience" :key="exp.title || exp.company" class="space-y-0.5 text-[10px] mb-2">
                    <div class="flex justify-between font-bold">
                      <span>{{ (exp.title || exp.company || '').toUpperCase() }} — {{ exp.role }}</span>
                      <span>{{ exp.period || '2026' }}</span>
                    </div>
                    <ul class="list-disc pl-4 space-y-0.5 text-zinc-800">
                      <li v-for="(b, bIdx) in (exp.bullets || [])" :key="bIdx">{{ b }}</li>
                    </ul>
                  </div>
                </div>

                <!-- Education -->
                <div v-if="cvData.education && cvData.education.length">
                  <div class="font-bold border-b border-black text-[11px] mb-1 font-sans uppercase tracking-wide">Education</div>
                  <div v-for="edu in cvData.education" :key="edu.degree || edu.institution" class="flex justify-between text-[10px]">
                    <span class="font-bold">{{ edu.degree || edu.title }} — {{ edu.institution }}</span>
                    <span>{{ edu.period || '' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botones de Estado de Postulación -->
            <div class="pt-2 flex items-center gap-2 select-none border-t border-white/5">
              <span class="text-xs text-zinc-400 font-mono-code">Estado de la vacante:</span>
              <button
                type="button"
                @click="setJobStatus('applied')"
                class="px-2.5 py-1 text-xs rounded border transition-colors font-mono-code cursor-pointer"
                :class="store.hunter.selected.status === 'applied' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold' : 'bg-[#121318] text-zinc-400 border-white/10 hover:text-white'"
              >
                Postulada
              </button>
              <button
                type="button"
                @click="setJobStatus('saved')"
                class="px-2.5 py-1 text-xs rounded border transition-colors font-mono-code cursor-pointer"
                :class="store.hunter.selected.status === 'saved' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold' : 'bg-[#121318] text-zinc-400 border-white/10 hover:text-white'"
              >
                Guardada
              </button>
              <button
                type="button"
                @click="setJobStatus('discarded')"
                class="px-2.5 py-1 text-xs rounded border transition-colors font-mono-code cursor-pointer"
                :class="store.hunter.selected.status === 'discarded' ? 'bg-red-500/15 text-red-300 border-red-500/30 font-bold' : 'bg-[#121318] text-zinc-400 border-white/10 hover:text-white'"
              >
                Descartada
              </button>
            </div>

          </div>

        </div>

        <div v-else class="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 font-mono-code space-y-2">
          <div class="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-xs text-zinc-400">
            &bull;
          </div>
          <p class="text-xs">Seleccioná una vacante de la lista para analizar compatibilidad, redactar propuestas y adaptar tu CV ATS.</p>
        </div>
      </div>
    </div>
  `,
}
