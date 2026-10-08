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

    const filteredJobs = computed(() => {
      const q = store.searchQuery.trim().toLowerCase()
      let list = store.hunter.jobs || []

      if (store.hunter.filter === 'high') {
        list = list.filter(j => (j.match_score || 0) >= 70)
      } else if (store.hunter.filter === 'applied') {
        list = list.filter(j => j.status === 'applied')
      }

      if (!q) return list
      return list.filter(j => {
        const title = (j.title || '').toLowerCase()
        const comp = (j.company || '').toLowerCase()
        return title.includes(q) || comp.includes(q)
      })
    })

    const selectedAnalysis = computed(() => {
      if (!store.hunter.selected || !store.hunter.selected.match_analysis) return null
      try {
        return typeof store.hunter.selected.match_analysis === 'string'
          ? JSON.parse(store.hunter.selected.match_analysis)
          : store.hunter.selected.match_analysis
      } catch {
        return null
      }
    })

    function selectJob(j) {
      store.hunter.selected = j
      hunterPitch.value = null
      currentTailoredCV.value = null
      if (j.pitch_draft) {
        hunterPitch.value = j.pitch_draft
      }
      if (j.tailored_cv) {
        try {
          currentTailoredCV.value = typeof j.tailored_cv === 'string' ? JSON.parse(j.tailored_cv) : j.tailored_cv
        } catch {
          currentTailoredCV.value = null
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
        hunterPitch.value = res.pitch
        store.hunter.selected.pitch_draft = res.pitch
        store.toast('ok', 'Elevator pitch generado por Gemini')
      } catch (err) {
        store.toast('err', `Error al redactar propuesta: ${err.message}`)
      } finally {
        store.hunter.isPitching = false
      }
    }

    async function copyPitch() {
      if (!hunterPitch.value) return
      const text = typeof hunterPitch.value === 'object' ? (hunterPitch.value.elevator_pitch || JSON.stringify(hunterPitch.value)) : hunterPitch.value
      await navigator.clipboard.writeText(text)
      store.hunter.copiedPitch = true
      store.toast('ok', 'Propuesta copiada al portapapeles')
      setTimeout(() => { store.hunter.copiedPitch = false }, 2500)
    }

    async function generateTailoredCV() {
      if (!store.hunter.selected || store.hunter.isGeneratingCV) return
      store.hunter.isGeneratingCV = true
      try {
        const res = await api.generateHunterCV(store.hunter.selected.id)
        currentTailoredCV.value = res.cv
        store.hunter.selected.tailored_cv = res.cv
        store.toast('ok', 'CV Harvard ATS adaptado y priorizado')
      } catch (err) {
        store.toast('err', `Error al adaptar CV: ${err.message}`)
      } finally {
        store.hunter.isGeneratingCV = false
      }
    }

    async function copyTailoredCVText() {
      if (!currentTailoredCV.value) return
      const cv = currentTailoredCV.value
      const lines = [
        cv.name || 'MATEO GABRIEL SONZOGNI',
        `${cv.title || ''} | ${cv.location || ''} | mateogabus@gmail.com`,
        '',
        'PROFESSIONAL SUMMARY',
        cv.summary || '',
        '',
        'CORE COMPETENCIES & STACK',
      ]
      for (const [cat, items] of Object.entries(cv.skills || {})) {
        lines.push(`${cat}: ${(items || []).join(', ')}`)
      }
      lines.push('', 'EXPERIENCE & SHIPPED WORK')
      for (const exp of (cv.experience || [])) {
        lines.push(`${exp.title} — ${exp.role} (${exp.period || ''})`)
        for (const b of (exp.bullets || [])) {
          lines.push(`• ${b}`)
        }
        lines.push('')
      }
      await navigator.clipboard.writeText(lines.join('\n'))
      store.toast('ok', 'CV ATS copiado en texto plano')
    }

    function downloadTailoredCVHtml() {
      window.print()
    }

    return {
      store,
      hunterPitch,
      currentTailoredCV,
      filteredJobs,
      selectedAnalysis,
      selectJob,
      setJobStatus,
      generatePitch,
      copyPitch,
      generateTailoredCV,
      copyTailoredCVText,
      downloadTailoredCVHtml,
    }
  },
  template: `
    <div class="flex-1 flex overflow-hidden bg-[#08090a]">
      <!-- Lista Lateral de Vacantes (340px) -->
      <div class="w-84 bg-[#101114] border-r border-white/10 flex flex-col shrink-0 overflow-hidden select-none">
        <div class="p-3 border-b border-white/10 space-y-2.5 bg-[#0c0d10]">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h2 class="text-xs font-bold text-white uppercase font-mono-code tracking-wide">
                Ofertas Laborales
              </h2>
              <span class="text-[10px] font-mono-code bg-white/5 text-zinc-400 px-1.5 py-0.2 rounded border border-white/10">
                {{ filteredJobs.length }}
              </span>
            </div>

            <button
              type="button"
              @click="store.scanHunterJobs"
              :disabled="store.hunter.isScanning"
              class="btn-primary !h-[26px] !px-2.5 !text-xs cursor-pointer disabled:opacity-50"
            >
              <span v-if="store.hunter.isScanning" class="animate-spin inline-block">↻</span>
              <span>{{ store.hunter.isScanning ? 'Escaneando...' : 'Escanear' }}</span>
            </button>
          </div>

          <!-- Buscador -->
          <div class="relative">
            <input
              type="text"
              v-model="store.searchQuery"
              placeholder="Buscar por rol o empresa..."
              class="text-input !h-[30px] pl-7 text-xs font-mono-code"
            />
            <svg class="adm-icon sm text-zinc-500 absolute left-2 top-1/2 -translate-y-1/2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>

          <!-- Filtros de Vacantes -->
          <div class="flex items-center gap-1 text-[10.5px] font-mono-code">
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
              @click="store.hunter.filter = 'applied'"
              class="px-2 py-0.5 rounded transition-colors cursor-pointer"
              :class="store.hunter.filter === 'applied' ? 'bg-emerald-500/15 text-emerald-300 font-semibold' : 'text-zinc-500 hover:text-white'"
            >
              Postuladas
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
              <span class="font-mono-code text-emerald-400 font-bold text-[11px] shrink-0 ml-1">
                {{ j.match_score }}%
              </span>
            </div>
            <div class="text-[11px] text-zinc-400 mt-0.5 truncate">{{ j.company }} · {{ j.source }}</div>
            <div class="text-[10px] font-mono-code text-zinc-500 mt-1 flex items-center justify-between">
              <span>{{ j.salary || j.salary_range || 'Salario no esp.' }}</span>
              <span class="uppercase px-1 rounded bg-white/5 text-zinc-400">{{ j.status }}</span>
            </div>
          </div>

          <div v-if="filteredJobs.length === 0" class="p-6 text-center text-xs text-zinc-500 font-mono-code">
            Sin vacantes bajo este filtro.
          </div>
        </div>
      </div>

      <!-- Detalle de la Vacante & Herramientas de IA -->
      <div class="flex-1 flex flex-col overflow-hidden bg-[#08090a]">
        <div v-if="store.hunter.selected" class="h-full flex flex-col overflow-hidden">
          
          <!-- Cabecera de Vacante -->
          <div class="p-5 border-b border-white/10 bg-[#0c0d10] flex items-center justify-between shrink-0 select-none">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-white tracking-tight">{{ store.hunter.selected.title }}</h2>
                <span class="text-xs font-mono-code font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {{ store.hunter.selected.match_score }}% Afinidad
                </span>
              </div>
              <div class="text-xs text-zinc-400 mt-0.5">
                {{ store.hunter.selected.company }} · {{ store.hunter.selected.source }}
              </div>
            </div>

            <div class="flex items-center gap-2.5">
              <a
                :href="store.hunter.selected.url"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-secondary !h-[30px] !text-xs"
              >
                <span>Ver Oferta Original</span>
                <svg class="adm-icon sm" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>

              <button
                type="button"
                @click="generateTailoredCV"
                :disabled="store.hunter.isGeneratingCV"
                class="btn-primary !h-[30px] !text-xs cursor-pointer"
              >
                <span v-if="store.hunter.isGeneratingCV" class="animate-spin inline-block">↻</span>
                <span>{{ store.hunter.isGeneratingCV ? 'Adaptando CV...' : 'Generar CV Harvard ATS' }}</span>
              </button>
            </div>
          </div>

          <!-- Contenido con Scroll de Vacante -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            
            <!-- Análisis de Afinidad Técnica -->
            <div v-if="selectedAnalysis" class="p-4 bg-[#121318] border border-white/10 rounded-lg space-y-3">
              <h3 class="text-xs font-bold font-mono-code text-white uppercase tracking-wider">Afinidad Técnica Detectada por IA</h3>
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="p-3 bg-[#0c0d10] rounded border border-white/5 space-y-1">
                  <span class="text-zinc-400 block text-[11px] font-mono-code">Requerimientos de la Vacante:</span>
                  <div class="flex flex-wrap gap-1">
                    <span v-for="req in (selectedAnalysis.required_skills || [])" :key="req" class="text-[10px] font-mono-code bg-white/5 text-zinc-300 px-1.5 py-0.5 rounded">
                      {{ req }}
                    </span>
                  </div>
                </div>

                <div class="p-3 bg-[#0c0d10] rounded border border-white/5 space-y-1">
                  <span class="text-emerald-400 block text-[11px] font-mono-code">Coincidencias en tu Perfil:</span>
                  <div class="flex flex-wrap gap-1">
                    <span v-for="sk in (selectedAnalysis.matching_skills || [])" :key="sk" class="text-[10px] font-mono-code bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      {{ sk }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Propuesta de Contacto / Elevator Pitch -->
            <div class="p-4 bg-[#121318] border border-white/10 rounded-lg space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-bold font-mono-code text-white uppercase tracking-wider">Elevator Pitch & Carta</h3>
                <button
                  v-if="!hunterPitch"
                  type="button"
                  @click="generatePitch"
                  :disabled="store.hunter.isPitching"
                  class="btn-secondary !h-[26px] !text-xs cursor-pointer"
                >
                  <span v-if="store.hunter.isPitching" class="animate-spin inline-block">↻</span>
                  <span>{{ store.hunter.isPitching ? 'Redactando...' : 'Generar Pitch' }}</span>
                </button>
                <button
                  v-else
                  type="button"
                  @click="copyPitch"
                  class="text-xs text-[#ff3e00] hover:underline font-medium cursor-pointer"
                >
                  {{ store.hunter.copiedPitch ? 'Copiado al portapapeles' : 'Copiar Texto' }}
                </button>
              </div>

              <p v-if="hunterPitch" class="text-xs text-zinc-300 leading-relaxed bg-[#08090a] p-3.5 rounded border border-white/10 font-mono-code select-text">
                {{ hunterPitch.elevator_pitch || hunterPitch }}
              </p>
              <div v-else class="text-xs text-zinc-500 font-mono-code">
                Hacé clic en "Generar Pitch" para que Gemini redacte una propuesta de contacto enfocada.
              </div>
            </div>

            <!-- CV Harvard ATS Adaptado (Vista Previa B&W) -->
            <div v-if="currentTailoredCV" class="p-4 bg-[#121318] border border-white/10 rounded-lg space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-xs font-bold font-mono-code text-white uppercase tracking-wider">CV Harvard ATS Adaptado</h3>
                  <p class="text-[11px] text-zinc-400">Palabras clave y proyectos jerarquizados para esta vacante.</p>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" @click="downloadTailoredCVHtml" class="btn-secondary !h-[28px] !text-xs cursor-pointer">
                    Imprimir A4 (1 Pág)
                  </button>
                  <button type="button" @click="copyTailoredCVText" class="btn-secondary !h-[28px] !text-xs cursor-pointer">
                    Copiar Texto ATS
                  </button>
                </div>
              </div>

              <!-- Tarjeta Visual Harvard ATS B&W -->
              <div class="bg-white text-black p-6 rounded shadow-sm font-serif text-xs space-y-3 select-text">
                <div class="text-center border-b border-black pb-2">
                  <div class="text-sm font-bold tracking-wider uppercase font-sans">{{ currentTailoredCV.name || 'MATEO GABRIEL SONZOGNI' }}</div>
                  <div class="text-[11px] italic">{{ currentTailoredCV.title || 'Desarrollador Frontend & Full Stack' }} · {{ currentTailoredCV.location || 'Patagonia Argentina' }} · mateogabus@gmail.com</div>
                </div>
                <div>
                  <div class="font-bold border-b border-black text-[11px] mb-1 font-sans uppercase">Professional Summary (Tailored)</div>
                  <p class="text-[10px] leading-relaxed text-justify">
                    {{ currentTailoredCV.summary || 'Software engineer specialized in reactive frontend architectures.' }}
                  </p>
                </div>
                <div v-if="currentTailoredCV.skills && Object.keys(currentTailoredCV.skills).length">
                  <div class="font-bold border-b border-black text-[11px] mb-1 font-sans uppercase">Core Competencies & Stack</div>
                  <div class="space-y-1 text-[10px]">
                    <div v-for="(skillsList, category) in currentTailoredCV.skills" :key="category">
                      <span class="font-bold">{{ category }}:</span>
                      <span>{{ Array.isArray(skillsList) ? skillsList.join(', ') : skillsList }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="currentTailoredCV.experience && currentTailoredCV.experience.length">
                  <div class="font-bold border-b border-black text-[11px] mb-1 font-sans uppercase">Prioritized Experience & Shipped Projects</div>
                  <div v-for="exp in currentTailoredCV.experience" :key="exp.title" class="space-y-0.5 text-[10px] mb-1.5">
                    <div class="flex justify-between font-bold">
                      <span>{{ (exp.title || '').toUpperCase() }} — {{ exp.role }}</span>
                      <span>{{ exp.period || '2026' }}</span>
                    </div>
                    <ul class="list-disc pl-4 space-y-0.5">
                      <li v-for="(b, bIdx) in (exp.bullets || [])" :key="bIdx">{{ b }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botones de Estado de Postulación -->
            <div class="pt-2 flex items-center gap-2 select-none">
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

        <div v-else class="flex-1 flex items-center justify-center text-xs text-zinc-500 font-mono-code">
          Seleccioná una vacante de la lista para analizarla y generar el CV adaptado.
        </div>
      </div>
    </div>
  `,
}
