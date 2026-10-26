// Componente Estructural: AdmJobHunter
// Consola ejecutiva de Job Hunter (Eros IA) con medidor de match y visor ATS Harvard

import { store } from '../store.js'
import { api } from '../api.js'
import { AdmAiTrace } from './AdmAiTrace.js'

const { computed, ref, reactive } = window.Vue

export const AdmJobHunter = {
  name: 'AdmJobHunter',
  components: {
    AdmAiTrace,
  },
  setup() {
    const hunterPitch = ref(null)
    const currentTailoredCV = ref(null)
    const activePitchTab = ref('elevator') // 'elevator' | 'cover' | 'subject'
    const hunterMobileView = ref(store.hunter.selected ? 'detail' : 'list')

    // Modal de Postulación Rápida (1 Input, 1 Clic)
    const applyModalOpen = ref(false)
    const isLoadingApplyPreview = ref(false)
    const isCustomizingText = ref(false)
    const applyForm = reactive({
      toEmail: '',
      subject: '',
      body: '',
    })
    const isEditingEmail = ref(false)
    const editEmailVal = ref('')

    const filteredJobs = computed(() => {
      const q = store.searchQuery.trim().toLowerCase()
      let list = [...(store.hunter.jobs || [])]

      if (store.hunter.filter === 'high') {
        list = list.filter(j => (j.match_score || 0) >= 70)
      } else if (store.hunter.filter === 'applied') {
        list = list.filter(j => j.status === 'applied')
      } else if (store.hunter.filter === 'saved') {
        list = list.filter(j => j.status === 'saved')
      } else if (store.hunter.filter === 'pending') {
        list = list.filter(j => (j.match_score === null || j.match_score === undefined) && j.status !== 'discarded')
      } else if (store.hunter.filter === 'discarded') {
        list = list.filter(j => j.status === 'discarded')
      }

      if (q) {
        list = list.filter(j => {
          const title = (j.title || '').toLowerCase()
          const comp = (j.company || '').toLowerCase()
          const src = (j.source || '').toLowerCase()
          return title.includes(q) || comp.includes(q) || src.includes(q)
        })
      }

      if (store.hunter.sortBy === 'semantic') {
        list.sort((a, b) => (b.semantic_score || 0) - (a.semantic_score || 0))
      } else if (store.hunter.sortBy === 'recent') {
        list.sort((a, b) => String(b.found_at || '').localeCompare(String(a.found_at || '')))
      } else {
        list.sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
      }

      return list
    })

    const pendingJobsCount = computed(() => {
      const list = store.hunter.jobs || []
      return list.filter(j => (j.match_score === null || j.match_score === undefined || j.status === 'new') && j.status !== 'discarded').length
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
      hunterMobileView.value = 'detail'
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
        store._persistHunterJobs()
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

    const copiedNote = ref(false)

    async function copyConnectionNoteText() {
      const note = store.hunter.selected?.connection_note
      if (!note) return
      await navigator.clipboard.writeText(note)
      copiedNote.value = true
      store.toast('ok', 'Nota de conexión copiada al portapapeles (< 280 caracteres)')
      setTimeout(() => { copiedNote.value = false }, 2500)
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
          if (edu.details) {
            lines.push(edu.details)
          }
        }
        lines.push('')
      }
      if (cv.languages && cv.languages.length) {
        lines.push('LANGUAGES')
        lines.push(Array.isArray(cv.languages) ? cv.languages.join(' · ') : String(cv.languages))
        lines.push('')
      }
      if (cv.methodologies && cv.methodologies.length) {
        lines.push('ENGINEERING PRACTICES & METHODOLOGIES')
        lines.push(Array.isArray(cv.methodologies) ? cv.methodologies.join(' · ') : String(cv.methodologies))
        lines.push('')
      }
      await navigator.clipboard.writeText(lines.join('\n'))
      store.toast('ok', 'CV ATS copiado en texto plano')
    }

    async function getCVTicket() {
      if (!store.hunter.selected) return null
      try {
        const data = await api.getHunterCVTicket(store.hunter.selected.id)
        return data?.ticket || null
      } catch {
        store.toast('err', 'Error al solicitar ticket para el CV')
        return null
      }
    }

    async function openTailoredCVHtml() {
      if (!store.hunter.selected) return
      const ticket = await getCVTicket()
      const query = ticket ? `?ticket=${encodeURIComponent(ticket)}` : ''
      window.open(`/api/admin/hunter/cv/${encodeURIComponent(store.hunter.selected.id)}/html${query}`, '_blank', 'noopener')
    }

    async function printTailoredCV() {
      if (!store.hunter.selected) return
      const ticket = await getCVTicket()
      const query = ticket ? `?ticket=${encodeURIComponent(ticket)}&auto_print=true` : '?auto_print=true'
      window.open(`/api/admin/hunter/cv/${encodeURIComponent(store.hunter.selected.id)}/html${query}`, '_blank', 'noopener')
    }

    const isDownloadingPdf = ref(false)
    const cvZoom = ref('fit') // 'fit' | '100%'
    const cvPreviewModalOpen = ref(false)
    const cvPreviewUrl = ref('')
    const cvPreviewLoading = ref(false)
    const cvModalZoom = ref('fit') // 'fit' | '100%'

    async function downloadTailoredCVPdf() {
      if (!store.hunter.selected || isDownloadingPdf.value) return
      isDownloadingPdf.value = true
      try {
        const blob = await api.downloadHunterCVPdf(store.hunter.selected.id)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const comp = (store.hunter.selected.company || 'Job').replace(/[^a-zA-Z0-9_-]/g, '_')
        a.download = `CV_Mateo_Sonzogni_Harvard_ATS_${comp}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        store.toast('ok', 'PDF nativo descargado exitosamente')
      } catch {
        store.toast('info', 'Generación directa no disponible en offline. Abriendo diálogo de impresión A4...')
        await printTailoredCV()
      } finally {
        isDownloadingPdf.value = false
      }
    }

    async function openCvPreviewModal() {
      if (!store.hunter.selected) return
      cvPreviewLoading.value = true
      cvPreviewModalOpen.value = true
      try {
        const ticket = await getCVTicket()
        if (ticket) {
          cvPreviewUrl.value = `/api/admin/hunter/cv/${encodeURIComponent(store.hunter.selected.id)}/html?ticket=${encodeURIComponent(ticket)}`
        } else {
          cvPreviewUrl.value = `/api/admin/hunter/cv/${encodeURIComponent(store.hunter.selected.id)}/html`
        }
      } catch {
        cvPreviewUrl.value = `/api/admin/hunter/cv/${encodeURIComponent(store.hunter.selected.id)}/html`
      } finally {
        cvPreviewLoading.value = false
      }
    }

    function closeCvPreviewModal() {
      cvPreviewModalOpen.value = false
      cvPreviewUrl.value = ''
    }

    function toggleCvModalZoom() {
      cvModalZoom.value = cvModalZoom.value === 'fit' ? '100%' : 'fit'
    }

    function setCvZoom(z) {
      cvZoom.value = z
    }

    async function downloadTailoredCVHtml() {
      if (!store.hunter.selected) return
      try {
        const blob = await api.downloadHunterCVHtml(store.hunter.selected.id)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'CV_Mateo_Sonzogni_Harvard_ATS.html'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        store.toast('ok', 'CV descargado')
      } catch {
        store.toast('err', 'Fallo de red al descargar CV')
      }
    }

    function getVerdictClass(verdict) {
      const v = (verdict || '').toUpperCase()
      if (v.includes('BUEN') || v.includes('EXCELENTE') || v.includes('HIGH') || v.includes('ALTO')) {
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      }
      if (v.includes('MEDIO') || v.includes('MID') || v.includes('REGULAR')) {
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      }
      return 'text-zinc-400 bg-white/5 border-white/10'
    }

    async function scanJobs() {
      await store.scanHunterJobs()
    }

    async function evaluatePendingJobs() {
      if (pendingJobsCount.value === 0) {
        store.toast('info', 'No hay vacantes pendientes de evaluación en la cola')
        return
      }
      await store.evaluatePendingHunterJobs()
    }

    async function evaluateCurrentJob() {
      if (!store.hunter.selected) return
      await store.evaluateSingleHunterJob(store.hunter.selected.id)
    }

    async function purgeJobs() {
      if (store.hunter.isPurging) return
      const confirmed = await store.requestConfirm({
        title: 'Depurar Vacantes Incompatibles',
        message: 'Esto eliminará permanentemente de la base las vacantes incompatibles (W2 / EE.UU. Only / stack no afín) y aquellas descartadas o con coincidencia menor a 35%.',
        confirmText: 'Depurar Ahora',
        kind: 'warning',
      })
      if (confirmed) {
        await store.purgeHunterJobs()
      }
    }

    async function vectorizeJobs() {
      await store.vectorizeHunterJobs()
    }

    async function deleteAllJobs() {
      await store.deleteAllHunterJobs()
    }

    async function deleteCurrentJob() {
      if (!store.hunter.selected) return
      await store.deleteSingleHunterJob(store.hunter.selected.id)
    }

    async function openApplyModal() {
      if (!store.hunter.selected) return
      applyModalOpen.value = true
      isLoadingApplyPreview.value = true
      isCustomizingText.value = false

      const sel = store.hunter.selected
      const isEn = !((sel.title + ' ' + (sel.description || '')).toLowerCase().includes('desarrollador') || (sel.title + ' ' + (sel.description || '')).toLowerCase().includes('experiencia'))

      // 1. Asunto y cuerpo por defecto inmediatos (garantizan que jamás quede en blanco)
      const defaultSubject = isEn
        ? `Application: ${sel.title} — Mateo Sonzogni`
        : `Postulación: ${sel.title} — Mateo Gabriel Sonzogni`

      const defaultBody = isEn
        ? `Dear Hiring Team at ${sel.company},\n\nI am writing to express my strong interest in the ${sel.title} position. With hands-on experience designing and operating production full-stack systems using TypeScript, Node.js, and PostgreSQL 17, my background aligns closely with your technical requirements.\n\nYou can review my production code and live portfolio at https://mateogs.tech.\n\nBest regards,\nMateo Sonzogni`
        : `Estimado equipo de selección de ${sel.company},\n\nMe pongo en contacto para presentar mi postulación a la búsqueda de ${sel.title}. Mi perfil combina desarrollo full stack riguroso, arquitectura de bases de datos relacionales (PostgreSQL 17) y micro-interacciones accesibles en producción.\n\nEn mi portafolio (https://mateogs.tech) pueden explorar casos de estudio reales con código abierto y métricas de producción.\n\nSaludos cordiales,\nMateo Gabriel Sonzogni`

      applyForm.toEmail = sel.contact_email || ''
      applyForm.subject = defaultSubject
      applyForm.body = defaultBody

      // 2. Si la vacante ya tenía un pitch guardado en pitch_draft, utilizarlo
      if (sel.pitch_draft) {
        try {
          const parsed = typeof sel.pitch_draft === 'string' ? JSON.parse(sel.pitch_draft) : sel.pitch_draft
          if (parsed.subject && parsed.subject.trim()) applyForm.subject = parsed.subject.trim()
          if (parsed.cover_letter && parsed.cover_letter.trim()) applyForm.body = parsed.cover_letter.trim()
          else if (parsed.elevator_pitch && parsed.elevator_pitch.trim()) applyForm.body = parsed.elevator_pitch.trim()
        } catch {
          if (typeof sel.pitch_draft === 'string' && sel.pitch_draft.trim()) {
            applyForm.body = sel.pitch_draft.trim()
          }
        }
      }

      // 3. Consultar a la API para obtener el preview enriquecido desde Eros AI o fallback del servidor
      try {
        const preview = await api.getHunterJobApplyPreview(sel.id)
        if (preview && (preview.ok || preview.subject || preview.body)) {
          if (preview.subject && preview.subject.trim()) {
            applyForm.subject = preview.subject.trim()
          }
          if (preview.body && preview.body.trim()) {
            applyForm.body = preview.body.trim()
          }
          const email = preview.to_email || preview.contact_email
          if (email && email.trim() && !applyForm.toEmail) {
            applyForm.toEmail = email.trim()
          }
        }
      } catch (err) {
        console.warn('Error al cargar vista previa enriquecida de postulación, utilizando plantilla determinista:', err)
      } finally {
        isLoadingApplyPreview.value = false
      }
    }

    function closeApplyModal() {
      applyModalOpen.value = false
      isCustomizingText.value = false
    }

    async function openGmailDirectCompose() {
      if (!store.hunter.selected) return
      if (!applyForm.toEmail || !applyForm.toEmail.includes('@')) {
        store.toast('err', 'Ingresá un correo de destino válido')
        return
      }

      const sel = store.hunter.selected
      const isEn = !((sel.title + ' ' + (sel.description || '')).toLowerCase().includes('desarrollador') || (sel.title + ' ' + (sel.description || '')).toLowerCase().includes('experiencia'))
      const fallbackSubject = isEn
        ? `Application: ${sel.title} — Mateo Sonzogni`
        : `Postulación: ${sel.title} — Mateo Gabriel Sonzogni`
      const finalSubject = (applyForm.subject || fallbackSubject).trim()
      const finalBody = applyForm.body || ''

      // 1. Descarga en paralelo del CV Harvard ATS nativo para adjuntar
      downloadTailoredCVPdf()

      // 2. Apertura de pestaña nativa de Gmail pre-cargada con destinatario, asunto y carta
      const params = new URLSearchParams({
        view: 'cm',
        fs: '1',
        to: applyForm.toEmail.trim(),
        su: finalSubject,
        body: finalBody,
      })
      const composeUrl = `https://mail.google.com/mail/?${params.toString()}`
      window.open(composeUrl, '_blank', 'noopener,noreferrer')

      // 3. Marcar la postulación como aplicada en el sistema
      await setJobStatus('applied')

      applyModalOpen.value = false
      store.toast('ok', 'Gmail abierto con propuesta lista y CV PDF descargado')
    }

    async function submitApplyEmail() {
      if (!store.hunter.selected) return
      if (!applyForm.toEmail || !applyForm.toEmail.includes('@')) {
        store.toast('err', 'Ingresá un correo de destino válido')
        return
      }
      const sel = store.hunter.selected
      const isEn = !((sel.title + ' ' + (sel.description || '')).toLowerCase().includes('desarrollador') || (sel.title + ' ' + (sel.description || '')).toLowerCase().includes('experiencia'))
      const fallbackSubject = isEn
        ? `Application: ${sel.title} — Mateo Sonzogni`
        : `Postulación: ${sel.title} — Mateo Gabriel Sonzogni`

      try {
        await store.applyHunterJobByEmail(store.hunter.selected.id, {
          to_email: applyForm.toEmail.trim(),
          subject: (applyForm.subject || fallbackSubject).trim(),
          body: applyForm.body,
          channel: 'n8n',
          confirmed: true,
        })
        applyModalOpen.value = false
      } catch {
        // error mostrado por el store
      }
    }

    function startEditContactEmail() {
      if (!store.hunter.selected) return
      editEmailVal.value = store.hunter.selected.contact_email || ''
      isEditingEmail.value = true
    }

    async function saveContactEmail() {
      if (!store.hunter.selected) return
      const email = editEmailVal.value.trim().toLowerCase()
      if (email && !email.includes('@')) {
        store.toast('err', 'El formato de correo no es válido')
        return
      }
      await store.updateHunterJobContactEmail(store.hunter.selected.id, email)
      isEditingEmail.value = false
    }

    function cancelEditContactEmail() {
      isEditingEmail.value = false
    }

    const isFallback = computed(() => {
      if (store.hunter.selected && store.hunter.selected._source === 'fallback') return true
      if (Array.isArray(store.hunter.jobs) && store.hunter.jobs.some(j => j._source === 'fallback')) return true
      return false
    })

    return {
      store,
      hunterPitch,
      pitchData,
      currentTailoredCV,
      cvData,
      activePitchTab,
      filteredJobs,
      pendingJobsCount,
      selectedAnalysis,
      isFallback,
      selectJob,
      setJobStatus,
      generatePitch,
      copyPitchText,
      generateTailoredCV,
      copyTailoredCVText,
      openTailoredCVHtml,
      printTailoredCV,
      downloadTailoredCVHtml,
      downloadTailoredCVPdf,
      isDownloadingPdf,
      cvZoom,
      setCvZoom,
      cvPreviewModalOpen,
      cvPreviewUrl,
      cvPreviewLoading,
      cvModalZoom,
      toggleCvModalZoom,
      openCvPreviewModal,
      closeCvPreviewModal,
      getVerdictClass,
      scanJobs,
      evaluatePendingJobs,
      evaluateCurrentJob,
      purgeJobs,
      deleteAllJobs,
      deleteCurrentJob,
      vectorizeJobs,
      hunterMobileView,
      copiedNote,
      copyConnectionNoteText,
      applyModalOpen,
      isLoadingApplyPreview,
      isCustomizingText,
      applyForm,
      isEditingEmail,
      editEmailVal,
      openApplyModal,
      closeApplyModal,
      openGmailDirectCompose,
      submitApplyEmail,
      startEditContactEmail,
      saveContactEmail,
      cancelEditContactEmail,
    }
  },
  template: `
    <div class="flex-1 flex flex-col overflow-hidden bg-[#08090a]">
      <!-- Banner Sutil de Snapshot Local / Eros Desconectado -->
      <div v-if="isFallback" class="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 border-b border-amber-500/25 text-amber-300 font-mono-code text-[11px] shrink-0">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
        <span class="font-semibold uppercase tracking-wider">SNAPSHOT LOCAL // EROS AGENT EN REPOSO</span>
        <span class="text-zinc-600">·</span>
        <span class="text-zinc-400 truncate">Visualizando datos locales de contingencia porque Eros Agent está desconectado</span>
      </div>

      <div class="flex-1 flex overflow-hidden">
        <!-- Lista Lateral de Vacantes (340px) -->
        <div
          class="bg-[#101114] border-r border-white/10 flex-col shrink-0 overflow-hidden select-none"
          :class="hunterMobileView === 'list' ? 'flex w-full md:w-84' : 'hidden md:flex md:w-84'"
        >
          <div class="p-3 border-b border-white/10 space-y-2.5 bg-[#0c0d10]">
            <!-- Fila 1: Título y Acción Secundaria (Depurar) -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                <h2 class="text-xs font-bold text-white uppercase font-mono-code tracking-wide truncate">
                  Eros Hunter
                </h2>
                <span 
                  class="text-[10px] font-mono-code bg-white/5 text-zinc-400 px-1.5 py-0.5 rounded border border-white/10 shrink-0"
                  :title="'Mostrando ' + filteredJobs.length + ' de ' + store.hunter.jobs.length + ' vacantes'"
                >
                  {{ filteredJobs.length }}<span v-if="filteredJobs.length !== store.hunter.jobs.length" class="text-zinc-500">/{{ store.hunter.jobs.length }}</span>
                </span>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  @click="vectorizeJobs"
                  :disabled="store.hunter.isVectorizing"
                  title="Vectorizar vacantes con Gemini text-embedding"
                  class="btn-ghost !h-[26px] !px-1.5 !text-[11px] cursor-pointer text-zinc-400 hover:text-cyan-300 font-mono-code inline-flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  <svg v-if="store.hunter.isVectorizing" class="adm-icon xs animate-spin text-cyan-400" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  <svg v-else class="adm-icon xs text-zinc-400" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                  <span class="hidden sm:inline">{{ store.hunter.isVectorizing ? 'Indexando...' : 'Vectorizar' }}</span>
                </button>
                <button
                  type="button"
                  @click="purgeJobs"
                  :disabled="store.hunter.isPurging"
                  title="Depurar vacantes incompatibles (W2 / EE.UU. Only / Obsoletas / Descartadas)"
                  class="btn-ghost !h-[26px] !px-1.5 !text-[11px] cursor-pointer text-zinc-400 hover:text-white font-mono-code inline-flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  <svg v-if="store.hunter.isPurging" class="adm-icon xs animate-spin text-zinc-400" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  <svg v-else class="adm-icon xs text-zinc-400" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  <span>{{ store.hunter.isPurging ? 'Depurando...' : 'Depurar' }}</span>
                </button>
                <button
                  type="button"
                  @click="deleteAllJobs"
                  :disabled="store.hunter.isDeletingAll || store.hunter.jobs.length === 0"
                  title="Eliminar todas las vacantes escaneadas para escanear todo desde cero"
                  class="btn-ghost !h-[26px] !px-1.5 !text-[11px] cursor-pointer text-zinc-400 hover:text-rose-400 font-mono-code inline-flex items-center gap-1 shrink-0 disabled:opacity-40"
                >
                  <svg v-if="store.hunter.isDeletingAll" class="adm-icon xs animate-spin text-rose-400" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  <svg v-else class="adm-icon xs text-zinc-400 hover:text-rose-400" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  <span>{{ store.hunter.isDeletingAll ? 'Borrando...' : 'Vaciar' }}</span>
                </button>
              </div>
            </div>

            <!-- Fila 2: Acciones Principales (Escanear & Evaluar con IA) -->
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="scanJobs"
                :disabled="store.hunter.isScanning"
                class="btn-primary !h-[30px] !px-2 text-xs font-semibold cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                <svg v-if="store.hunter.isScanning" class="adm-icon xs animate-spin" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <svg v-else class="adm-icon xs" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                <span>{{ store.hunter.isScanning ? 'Escaneando...' : 'Escanear' }}</span>
              </button>
              <button
                type="button"
                @click="evaluatePendingJobs"
                :disabled="store.hunter.isEvaluating"
                :title="pendingJobsCount > 0 ? ('Evaluar con IA las ' + pendingJobsCount + ' vacantes pendientes') : 'Evaluar vacantes pendientes'"
                class="btn-secondary !h-[30px] !px-2 text-xs font-semibold cursor-pointer text-amber-300 border-amber-500/30 hover:bg-amber-500/10 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                <svg v-if="store.hunter.isEvaluating" class="adm-icon xs animate-spin text-amber-300" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <svg v-else class="adm-icon xs text-amber-300" viewBox="0 0 24 24"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>
                <span>{{ store.hunter.isEvaluating ? 'Evaluando...' : 'Evaluar' }}</span>
                <span v-if="!store.hunter.isEvaluating && pendingJobsCount > 0" class="text-[10px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono-code">
                  {{ pendingJobsCount }}
                </span>
              </button>
            </div>

          <!-- Traza de Razonamiento IA: Escaneo y Evaluación de Cola (Bencho UI) -->
          <adm-ai-trace
            :active="store.hunter.isScanning || store.hunter.isEvaluating"
            :title="store.hunter.isScanning ? 'EROS // ESCANEO DE PORTALES' : 'EROS // EVALUACIÓN DE COLA'"
            :steps="store.hunter.isScanning ? [
              'Conectando con fuentes de empleo remotas',
              'Parseando oportunidades y metadatos',
              'Filtrando duplicados contra PostgreSQL 17',
              'Guardando nuevas vacantes en la cola'
            ] : [
              'Tomando vacantes no evaluadas de la cola',
              'Cruzando requisitos con proyectos del portfolio',
              'Calculando scores y veredictos con Gemini',
              'Persistiendo análisis en base de datos'
            ]"
          />

          <!-- Buscador -->
          <div class="relative">
            <input
              type="text"
              v-model="store.searchQuery"
              placeholder="Buscar rol, empresa o portal..."
              class="text-input !h-[30px] !pl-8.5 !pr-7 text-xs font-mono-code w-full placeholder:text-zinc-500"
            />
            <svg class="adm-icon sm text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <button
              v-if="store.searchQuery"
              type="button"
              @click="store.searchQuery = ''"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-1 inline-flex items-center"
              title="Limpiar búsqueda"
            >
              <svg class="adm-icon xs" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Selector de Ordenamiento Semántico / IA / Recientes -->
          <div class="flex items-center justify-between text-[10px] font-mono-code text-zinc-400 px-0.5">
            <span class="text-zinc-500">Orden:</span>
            <div class="flex items-center gap-1">
              <button
                type="button"
                @click="store.hunter.sortBy = 'ia'"
                class="px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                :class="store.hunter.sortBy === 'ia' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-300'"
                title="Ordenar por Score de IA"
              >
                Match IA
              </button>
              <button
                type="button"
                @click="store.hunter.sortBy = 'semantic'"
                class="px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                :class="store.hunter.sortBy === 'semantic' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-zinc-500 hover:text-zinc-300'"
                title="Ordenar por Afinidad Vectorial (Gemini Embedding)"
              >
                Vectorial
              </button>
              <button
                type="button"
                @click="store.hunter.sortBy = 'recent'"
                class="px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                :class="store.hunter.sortBy === 'recent' ? 'bg-white/10 text-white font-bold border border-white/20' : 'text-zinc-500 hover:text-zinc-300'"
                title="Ordenar por fecha de captura"
              >
                Recientes
              </button>
            </div>
          </div>

          <!-- Filtros de Vacantes (Grid 3x2 parejo) -->
          <div class="grid grid-cols-3 gap-1 pt-0.5 font-mono-code text-[11px]">
            <button
              type="button"
              @click="store.hunter.filter = 'high'"
              class="px-1 py-1 rounded text-center truncate border transition-all cursor-pointer"
              :class="store.hunter.filter === 'high' 
                ? 'bg-[#ff3e00]/20 text-[#ff3e00] font-bold border-[#ff3e00]/40' 
                : 'bg-white/[0.02] text-zinc-400 border-white/5 hover:text-white hover:bg-white/5'"
            >
              &ge; 70% Match
            </button>
            <button
              type="button"
              @click="store.hunter.filter = 'all'"
              class="px-1 py-1 rounded text-center truncate border transition-all cursor-pointer"
              :class="store.hunter.filter === 'all' 
                ? 'bg-white/20 text-white font-bold border-white/30' 
                : 'bg-white/[0.02] text-zinc-400 border-white/5 hover:text-white hover:bg-white/5'"
            >
              Todas
            </button>
            <button
              type="button"
              @click="store.hunter.filter = 'pending'"
              class="px-1 py-1 rounded text-center truncate border transition-all cursor-pointer"
              :class="store.hunter.filter === 'pending' 
                ? 'bg-amber-500/20 text-amber-300 font-bold border-amber-500/40' 
                : pendingJobsCount > 0 
                  ? 'bg-amber-500/10 text-amber-400/90 border-amber-500/25 hover:text-amber-200' 
                  : 'bg-white/[0.02] text-zinc-400 border-white/5 hover:text-white hover:bg-white/5'"
            >
              Pendientes{{ pendingJobsCount > 0 ? (' (' + pendingJobsCount + ')') : '' }}
            </button>
            <button
              type="button"
              @click="store.hunter.filter = 'saved'"
              class="px-1 py-1 rounded text-center truncate border transition-all cursor-pointer"
              :class="store.hunter.filter === 'saved' 
                ? 'bg-amber-500/20 text-amber-300 font-bold border-amber-500/40' 
                : 'bg-white/[0.02] text-zinc-400 border-white/5 hover:text-white hover:bg-white/5'"
            >
              Guardadas
            </button>
            <button
              type="button"
              @click="store.hunter.filter = 'applied'"
              class="px-1 py-1 rounded text-center truncate border transition-all cursor-pointer"
              :class="store.hunter.filter === 'applied' 
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border-emerald-500/40' 
                : 'bg-white/[0.02] text-zinc-400 border-white/5 hover:text-white hover:bg-white/5'"
            >
              Postuladas
            </button>
            <button
              type="button"
              @click="store.hunter.filter = 'discarded'"
              class="px-1 py-1 rounded text-center truncate border transition-all cursor-pointer"
              :class="store.hunter.filter === 'discarded' 
                ? 'bg-red-500/20 text-red-300 font-bold border-red-500/40' 
                : 'bg-white/[0.02] text-zinc-400 border-white/5 hover:text-white hover:bg-white/5'"
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
              <div class="flex items-center gap-1 shrink-0 ml-1.5">
                <span 
                  v-if="j.match_score !== null && j.match_score !== undefined"
                  class="font-mono-code font-bold text-[11px]"
                  :class="j.match_score >= 70 ? 'text-emerald-400' : j.match_score >= 50 ? 'text-amber-400' : 'text-zinc-400'"
                  :title="'Score IA: ' + j.match_score + '%'"
                >
                  {{ j.match_score }}%
                </span>
                <span
                  v-if="j.semantic_score !== null && j.semantic_score !== undefined"
                  class="font-mono-code text-[9px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1 py-0.2 rounded"
                  :title="'Afinidad Vectorial Gemini: ' + j.semantic_score + '%'"
                >
                  v:{{ j.semantic_score }}%
                </span>
                <span
                  v-else-if="j.status === 'discarded'"
                  class="font-mono-code text-[10px] text-red-400/80"
                >
                  Desc.
                </span>
                <span
                  v-else-if="j.match_score === null || j.match_score === undefined"
                  class="font-mono-code text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded inline-flex items-center gap-1"
                  title="Pendiente de evaluación con IA"
                >
                  <svg class="adm-icon xs text-amber-400" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>Pendiente</span>
                </span>
              </div>
            </div>
            <div class="text-[11px] text-zinc-400 mt-0.5 truncate flex items-center justify-between">
              <span class="truncate">{{ j.company }} · <span class="capitalize">{{ j.source }}</span></span>
              <div class="flex items-center gap-1 shrink-0 ml-1">
                <span v-if="j.contact_email" class="text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1 py-0.2 rounded text-[8.5px] font-mono-code shrink-0" :title="'Email de contacto: ' + j.contact_email">@email</span>
                <span v-if="j.hiring_manager_name" class="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1 py-0.2 rounded text-[8.5px] font-mono-code shrink-0" title="Hiring Lead detectado">[Lead]</span>
              </div>
            </div>
            <div class="text-[10px] font-mono-code text-zinc-500 mt-1.5 flex items-center justify-between gap-1">
              <span class="truncate max-w-[130px]">{{ j.country || (j.is_remote ? 'Remoto' : 'Ubicación no esp.') }}</span>
              <span 
                v-if="j.status === 'applied'"
                class="uppercase px-1.5 py-0.2 rounded border text-[9px] shrink-0 font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                title="Postulación despachada"
              >
                Postulada
              </span>
              <span 
                v-else-if="j.salary" 
                class="text-emerald-400 font-semibold truncate text-[9.5px] bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 max-w-[135px]"
                :title="j.salary"
              >
                {{ j.salary }}
              </span>
              <span 
                v-else
                class="uppercase px-1 py-0.2 rounded border text-[9px] shrink-0"
                :class="j.status === 'discarded' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-zinc-400 border-white/10'"
              >
                {{ j.status }}
              </span>
            </div>
          </div>

          <!-- Estados Vacíos Inteligentes -->
          <div v-if="filteredJobs.length === 0" class="p-6 text-center">
            <!-- Caso 1: Hay vacantes sin evaluar -->
            <div v-if="pendingJobsCount > 0 && !store.searchQuery" class="space-y-3">
              <div class="text-amber-400 text-xs font-mono-code flex items-center justify-center gap-1.5 font-bold">
                <svg class="adm-icon sm text-amber-400" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>{{ pendingJobsCount }} vacante{{ pendingJobsCount === 1 ? '' : 's' }} sin evaluar</span>
              </div>
              <p class="text-[11px] text-zinc-400 leading-relaxed font-mono-code max-w-[240px] mx-auto">
                Hay vacantes capturadas pendientes de análisis semántico con IA.
              </p>
              <div class="flex flex-col gap-2 pt-1 max-w-[200px] mx-auto">
                <button
                  type="button"
                  @click="evaluatePendingJobs"
                  :disabled="store.hunter.isEvaluating"
                  class="btn-secondary !h-[30px] !px-3 !text-xs text-amber-300 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer inline-flex items-center justify-center gap-1.5 font-mono-code"
                >
                  <span v-if="store.hunter.isEvaluating" class="animate-spin inline-block text-[10px]">↻</span>
                  <svg v-else class="adm-icon xs text-amber-300" viewBox="0 0 24 24"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>
                  <span>{{ store.hunter.isEvaluating ? 'Evaluando...' : 'Evaluar cola ahora' }}</span>
                </button>
                <button
                  type="button"
                  @click="store.hunter.filter = 'pending'"
                  class="btn-ghost !h-[26px] !px-2 !text-[11px] text-zinc-300 hover:text-white cursor-pointer font-mono-code"
                >
                  Ver pendientes
                </button>
              </div>
            </div>

            <!-- Caso 2: Búsqueda activa sin resultados -->
            <div v-else-if="store.searchQuery" class="space-y-2 font-mono-code">
              <div class="text-xs text-zinc-400">Sin resultados para "{{ store.searchQuery }}"</div>
              <button
                type="button"
                @click="store.searchQuery = ''"
                class="text-[11px] text-[#ff3e00] hover:underline cursor-pointer"
              >
                Limpiar búsqueda
              </button>
            </div>

            <!-- Caso 3: Sin vacantes en absoluto -->
            <div v-else-if="store.hunter.jobs.length === 0" class="space-y-3 font-mono-code">
              <div class="text-xs text-zinc-400">Sin vacantes registradas en el radar.</div>
              <button
                type="button"
                @click="scanJobs"
                :disabled="store.hunter.isScanning"
                class="btn-primary !h-[28px] !px-3 !text-xs cursor-pointer inline-flex items-center gap-1.5 mx-auto"
              >
                <span v-if="store.hunter.isScanning" class="animate-spin inline-block text-[10px]">↻</span>
                <svg v-else class="adm-icon xs" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                <span>{{ store.hunter.isScanning ? 'Escaneando...' : 'Escanear portales' }}</span>
              </button>
            </div>

            <!-- Caso 4: Filtro sin resultados -->
            <div v-else class="space-y-2 font-mono-code">
              <div class="text-xs text-zinc-400">Sin vacantes bajo el criterio actual.</div>
              <button
                type="button"
                @click="store.hunter.filter = 'all'"
                class="text-[11px] text-zinc-300 hover:text-white underline cursor-pointer"
              >
                Ver todas ({{ store.hunter.jobs.length }})
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Detalle de la Vacante & Herramientas de IA -->
      <div
        class="flex-1 flex-col overflow-hidden bg-[#08090a]"
        :class="hunterMobileView === 'detail' ? 'flex w-full' : 'hidden md:flex'"
      >
        <div v-if="store.hunter.selected" class="h-full flex flex-col overflow-hidden">
          
          <!-- Cabecera de Vacante -->
          <div class="p-4 sm:p-5 border-b border-white/10 bg-[#0c0d10] flex items-center justify-between shrink-0 select-none flex-wrap sm:flex-nowrap gap-3">
            <div class="min-w-0 pr-2 sm:pr-4 flex-1">
              <div class="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <button
                  type="button"
                  @click="hunterMobileView = 'list'"
                  class="md:hidden flex items-center gap-1 px-2.5 py-1 text-xs font-mono-code text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/10 shrink-0 cursor-pointer"
                  title="Volver a la lista de vacantes"
                >
                  <span>←</span>
                  <span>Vacantes</span>
                </button>
                <h2 class="text-sm sm:text-base font-bold text-white tracking-tight truncate">{{ store.hunter.selected.title }}</h2>
                <span 
                  v-if="store.hunter.selected.match_score !== null && store.hunter.selected.match_score !== undefined"
                  class="text-xs font-mono-code font-bold px-2 py-0.5 rounded border"
                  :class="store.hunter.selected.match_score >= 70 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'"
                >
                  {{ store.hunter.selected.match_score }}% Match IA
                </span>
                <span 
                  v-if="store.hunter.selected.semantic_score !== null && store.hunter.selected.semantic_score !== undefined"
                  class="text-xs font-mono-code font-bold px-2 py-0.5 rounded border text-cyan-300 bg-cyan-500/10 border-cyan-500/20"
                  :title="'Afinidad vectorial calculada con text-embedding de Gemini'"
                >
                  {{ store.hunter.selected.semantic_score }}% Vectorial
                </span>
                <span 
                  v-else-if="store.hunter.selected.status === 'discarded'"
                  class="text-xs font-mono-code px-2 py-0.5 rounded border text-red-400 bg-red-500/10 border-red-500/20"
                >
                  Descartada (Filtro Previo)
                </span>
                <span 
                  v-else
                  class="text-xs font-mono-code px-2 py-0.5 rounded border text-amber-400 bg-amber-500/10 border-amber-500/20 inline-flex items-center gap-1.5"
                >
                  <svg class="adm-icon xs text-amber-400" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>Pendiente de Evaluación</span>
                </span>
                <span v-if="store.hunter.selected.is_remote" class="text-[10px] font-mono-code text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  Remoto
                </span>
                <span 
                  v-if="store.hunter.selected.salary || selectedAnalysis?.salary_estimate" 
                  class="text-[11px] font-mono-code text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-flex items-center gap-1 font-semibold"
                  :title="store.hunter.selected.salary && !store.hunter.selected.salary.includes('Est') ? 'Compensación publicada en la oferta' : 'Rango salarial estimado por Eros IA'"
                >
                  <svg class="adm-icon xs text-emerald-400" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <span>{{ store.hunter.selected.salary || selectedAnalysis.salary_estimate }}</span>
                </span>
              </div>
              <div class="text-xs text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
                <span class="font-semibold text-zinc-300">{{ store.hunter.selected.company }}</span>
                <span>·</span>
                <span class="capitalize">{{ store.hunter.selected.source }}</span>
                <span v-if="store.hunter.selected.country">·</span>
                <span v-if="store.hunter.selected.country" class="text-zinc-500 truncate">{{ store.hunter.selected.country }}</span>
                <span>·</span>
                <!-- Visualización y Edición de Email de Contacto -->
                <div class="flex items-center gap-1.5 font-mono-code text-[11px]">
                  <span class="text-zinc-500">Email:</span>
                  <div v-if="isEditingEmail" class="flex items-center gap-1">
                    <input
                      type="email"
                      v-model="editEmailVal"
                      placeholder="hr@company.com"
                      class="text-input !h-[22px] !py-0 !px-1.5 text-[11px] font-mono-code w-44"
                      @keyup.enter="saveContactEmail"
                      @keyup.esc="cancelEditContactEmail"
                    />
                    <button type="button" @click="saveContactEmail" class="text-[10px] text-emerald-400 hover:text-emerald-300 px-1 font-bold cursor-pointer">OK</button>
                    <button type="button" @click="cancelEditContactEmail" class="text-[10px] text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer inline-flex items-center" title="Cancelar edicion"><svg class="adm-icon xs" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                  </div>
                  <div v-else class="flex items-center gap-1.5">
                    <span v-if="store.hunter.selected.contact_email" class="text-blue-300 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20 select-all font-semibold">
                      {{ store.hunter.selected.contact_email }}
                    </span>
                    <span v-else class="text-zinc-600 italic">No detectado</span>
                    <button
                      type="button"
                      @click="startEditContactEmail"
                      class="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                      title="Asignar o editar correo de postulación"
                    >
                      {{ store.hunter.selected.contact_email ? 'Editar' : 'Asignar' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0 flex-wrap">
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

              <!-- Botón de Postulación Automatizada por Email -->
              <button
                type="button"
                @click="openApplyModal"
                class="!h-[30px] !text-xs cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded font-semibold transition-all border font-mono-code"
                :class="store.hunter.selected.status === 'applied' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30' 
                  : store.hunter.selected.contact_email 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-950 font-bold' 
                    : 'btn-secondary text-zinc-300'"
                :title="store.hunter.selected.contact_email ? ('Enviar CV y Pitch por correo a ' + store.hunter.selected.contact_email) : 'Postular por email'"
              >
                <svg class="adm-icon xs" viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                <span>{{ store.hunter.selected.status === 'applied' ? 'Reenviar Postulación' : 'Postular por Email' }}</span>
              </button>

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

            <!-- Traza de Razonamiento IA: CV, Pitch y Evaluación Individual (Bencho UI) -->
            <adm-ai-trace
              :active="store.hunter.isGeneratingCV || store.hunter.isPitching || store.hunter.isEvaluatingSingle"
              :title="store.hunter.isGeneratingCV ? 'EROS // ADAPTACIÓN CV HARVARD ATS' : (store.hunter.isPitching ? 'EROS // SÍNTESIS DE PITCH EJECUTIVO' : 'EROS // EVALUACIÓN DE VACANTE CON GEMINI')"
              :steps="store.hunter.isGeneratingCV ? [
                'Analizando requisitos técnicos y seniority de la vacante',
                'Seleccionando proyectos de máxima afinidad en PostgreSQL 17',
                'Adaptando métricas e impacto con formato Harvard ATS',
                'Optimizando tipografía y maquetación de 1 página A4'
              ] : (store.hunter.isPitching ? [
                'Extrayendo pain-points y rol del hiring manager',
                'Cruzando logros técnicos comprobables del candidato',
                'Estructurando propuesta directa con tono de ingeniería',
                'Sintetizando cover letter ejecutiva con Gemini 2.5'
              ] : [
                'Scrapeando descripción completa de la oportunidad',
                'Extrayendo tech stack, rango salarial y modalidad',
                'Calculando score heurístico de match con el perfil',
                'Estructurando bullet points y recomendación de postulación'
              ])"
            />

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

              <!-- Banda Salarial & Compensación de Mercado -->
              <div v-if="store.hunter.selected.salary || selectedAnalysis.salary_estimate" class="p-3 bg-[#0c0d10] rounded border border-white/5 flex items-center justify-between text-xs font-mono-code flex-wrap gap-2">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <svg class="adm-icon sm text-emerald-400" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <div>
                    <span class="text-zinc-500 text-[10px] uppercase font-bold block">Banda Salarial / Compensación:</span>
                    <span class="text-emerald-400 font-bold text-xs">{{ store.hunter.selected.salary || selectedAnalysis.salary_estimate }}</span>
                  </div>
                </div>
                <span class="text-[10px] text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                  {{ store.hunter.selected.salary && !store.hunter.selected.salary.includes('Est') ? 'Dato publicado por la empresa' : 'Estimación de mercado (Eros IA)' }}
                </span>
              </div>

              <!-- Medidor de Afinidad Vectorial (Gemini Embedding) -->
              <div v-if="store.hunter.selected.semantic_score !== null && store.hunter.selected.semantic_score !== undefined" class="p-3 bg-[#0c0d10] rounded border border-white/5 flex items-center justify-between text-xs font-mono-code flex-wrap gap-2">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <svg class="adm-icon sm text-cyan-400" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                  </div>
                  <div>
                    <span class="text-zinc-500 text-[10px] uppercase font-bold block">Afinidad Vectorial del Perfil:</span>
                    <span class="text-cyan-300 font-bold text-xs">{{ store.hunter.selected.semantic_score }}% de Coincidencia Semántica</span>
                  </div>
                </div>
                <div class="w-36 bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/10 shrink-0">
                  <div class="bg-cyan-400 h-full rounded-full transition-all" :style="{ width: store.hunter.selected.semantic_score + '%' }"></div>
                </div>
              </div>

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

            <!-- Tarjeta CTA cuando la vacante aún no fue evaluada por la IA -->
            <div v-else-if="store.hunter.selected.status !== 'discarded'" class="p-5 bg-[#121318] border border-amber-500/25 rounded-lg space-y-3.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                  <h3 class="text-xs font-bold font-mono-code text-white uppercase tracking-wider">Vacante Pendiente de Evaluación Semántica</h3>
                </div>
                <span class="text-[10px] font-mono-code text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">Sin Puntuación</span>
              </div>
              <p class="text-xs text-zinc-300 leading-relaxed font-sans">
                Esta oferta fue capturada en el escaneo pero aún no pasó por Gemini. Puedes evaluarla ahora mismo para calcular el porcentaje de match contra tu CV y detectar pros, contras y proyectos clave a destacar.
              </p>
              <div class="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  @click="evaluateCurrentJob"
                  :disabled="store.hunter.isEvaluatingSingle"
                  class="btn-primary !h-[32px] !px-3.5 !text-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span v-if="store.hunter.isEvaluatingSingle" class="animate-spin text-xs">↻</span>
                  <svg v-else class="adm-icon xs" viewBox="0 0 24 24"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>
                  <span>{{ store.hunter.isEvaluatingSingle ? 'Evaluando con Gemini...' : 'Evaluar esta vacante con IA' }}</span>
                </button>
              </div>
            </div>

            <!-- Detective de Hiring Manager & Conexión Directa (Fase 4) -->
            <div v-if="store.hunter.selected.hiring_manager_name || store.hunter.selected.connection_note" class="p-4.5 bg-[#121318] border border-cyan-500/30 rounded-lg space-y-3.5">
              <div class="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <h3 class="text-xs font-bold font-mono-code text-white uppercase tracking-wider">Hiring Lead & Conexión Directa</h3>
                </div>
                <span class="text-[10px] font-mono-code text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded font-bold">
                  Lead Detectado
                </span>
              </div>

              <!-- Responsable / Recruiter -->
              <div v-if="store.hunter.selected.hiring_manager_name" class="p-3 bg-[#0c0d10] rounded border border-white/5 flex items-center justify-between text-xs font-mono-code flex-wrap gap-2">
                <div>
                  <div class="text-white font-bold text-xs flex items-center gap-2">
                    <span>{{ store.hunter.selected.hiring_manager_name }}</span>
                    <span v-if="store.hunter.selected.hiring_manager_title" class="text-zinc-400 font-normal text-[11px]">· {{ store.hunter.selected.hiring_manager_title }}</span>
                  </div>
                  <div class="text-[10px] text-zinc-500 mt-0.5">Responsable directo o recruiter identificado para esta vacante</div>
                </div>
                <a
                  v-if="store.hunter.selected.hiring_manager_url"
                  :href="store.hunter.selected.hiring_manager_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-secondary !h-[26px] !text-xs inline-flex items-center gap-1.5 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10 font-mono-code"
                >
                  <span>Ver en LinkedIn</span>
                  <svg class="adm-icon xs" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>

              <!-- Nota de Conexión Personalizada (< 280 car.) -->
              <div v-if="store.hunter.selected.connection_note" class="space-y-2">
                <div class="flex items-center justify-between text-[11px] font-mono-code">
                  <span class="text-zinc-400 font-bold">Nota de Conexión Personalizada (&lt; 280 car.):</span>
                  <span class="text-zinc-500 text-[10px]">{{ store.hunter.selected.connection_note.length }} / 300</span>
                </div>
                <div class="p-3 bg-[#0c0d10] rounded border border-white/5 text-xs text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {{ store.hunter.selected.connection_note }}
                </div>
                <div class="flex justify-end">
                  <button
                    type="button"
                    @click="copyConnectionNoteText"
                    class="btn-primary !h-[28px] !text-xs inline-flex items-center gap-1.5 cursor-pointer font-mono-code"
                  >
                    <span v-if="copiedNote" class="text-emerald-300 font-bold">[COPIADO OK]</span>
                    <span v-else>Copiar Nota de Conexión</span>
                  </button>
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

            <!-- Empty State si aún no se generó CV adaptado -->
            <div v-if="!cvData" class="p-5 bg-[#121318] border border-white/10 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-3.5">
                <div class="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <svg class="adm-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <div>
                  <h3 class="text-xs font-bold font-mono-code text-white uppercase tracking-wider">CV Harvard ATS Adaptado</h3>
                  <p class="text-[11px] text-zinc-400 mt-0.5">Generá una versión personalizada en formato Harvard A4 destacando proyectos afines a esta vacante.</p>
                </div>
              </div>
              <button 
                type="button" 
                @click="generateTailoredCV" 
                :disabled="store.hunter.isGeneratingCV"
                class="btn-primary !h-[32px] !px-3.5 !text-xs cursor-pointer inline-flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                <span v-if="store.hunter.isGeneratingCV" class="animate-spin inline-block text-[11px]">↻</span>
                <span>{{ store.hunter.isGeneratingCV ? 'Adaptando CV...' : 'Generar CV Harvard ATS' }}</span>
              </button>
            </div>

            <!-- CV Harvard ATS Adaptado (Vista Previa A4 Realista & Acciones de Descarga/Impresión) -->
            <div v-else class="p-4.5 bg-[#121318] border border-white/10 rounded-lg space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    <h3 class="text-xs font-bold font-mono-code text-white uppercase tracking-wider">CV Harvard ATS Adaptado · Formato A4</h3>
                  </div>
                  <p class="text-[11px] text-zinc-400 mt-0.5">Hoja única 210 × 297 mm · Sin fotos ni gráficos · Formato 100% amigable para parsers ATS</p>
                </div>

                <!-- Barra de Acciones de Exportación -->
                <div class="flex items-center flex-wrap gap-2">
                  <button 
                    type="button" 
                    @click="downloadTailoredCVPdf" 
                    :disabled="isDownloadingPdf"
                    class="btn-primary !h-[30px] !text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                    title="Descargar documento PDF compilado nativo (A4)"
                  >
                    <svg v-if="!isDownloadingPdf" class="adm-icon sm" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span v-else class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>{{ isDownloadingPdf ? 'Generando PDF...' : 'Descargar PDF' }}</span>
                  </button>

                  <button 
                    type="button" 
                    @click="printTailoredCV" 
                    class="btn-secondary !h-[30px] !text-xs cursor-pointer inline-flex items-center gap-1.5 text-zinc-200 hover:text-white"
                    title="Imprimir o exportar mediante diálogo A4 del sistema"
                  >
                    <svg class="adm-icon sm" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    <span>Imprimir en A4</span>
                  </button>

                  <button 
                    type="button" 
                    @click="openCvPreviewModal" 
                    class="btn-secondary !h-[30px] !text-xs cursor-pointer inline-flex items-center gap-1.5 text-zinc-200 hover:text-white"
                    title="Previsualizador de alta fidelidad a pantalla completa con zoom"
                  >
                    <svg class="adm-icon sm" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <span>Previsualizar</span>
                  </button>

                  <button 
                    type="button" 
                    @click="copyTailoredCVText" 
                    class="btn-secondary !h-[30px] !text-xs cursor-pointer inline-flex items-center gap-1.5"
                    title="Copiar contenido en texto plano para postulaciones con formularios ATS"
                  >
                    <svg class="adm-icon sm" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    <span>Copiar ATS</span>
                  </button>

                  <button 
                    type="button" 
                    @click="openTailoredCVHtml" 
                    class="btn-ghost !h-[30px] !px-2 !text-xs cursor-pointer text-zinc-400 hover:text-white inline-flex items-center"
                    title="Abrir en pestaña nueva"
                  >
                    <svg class="adm-icon sm" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </button>

                  <button 
                    type="button" 
                    @click="generateTailoredCV" 
                    :disabled="store.hunter.isGeneratingCV"
                    class="btn-ghost !h-[30px] !px-2 !text-xs cursor-pointer text-zinc-400 hover:text-white inline-flex items-center"
                    title="Regenerar con Eros IA"
                  >
                    <span v-if="store.hunter.isGeneratingCV" class="animate-spin inline-block text-[11px]">↻</span>
                    <span v-else>↻</span>
                  </button>
                </div>
              </div>

              <!-- Staging Canvas A4 Estilo Obsidian / Linear Document Preview -->
              <div class="rounded-lg border border-white/10 overflow-hidden shadow-2xl">
                <!-- Barra de Control del Canvas Staging -->
                <div class="flex items-center justify-between px-3.5 py-2 bg-[#0e1015] border-b border-white/5 text-[11px] font-mono-code text-zinc-400 select-none flex-wrap gap-2">
                  <div class="flex items-center gap-2.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    <span class="text-white font-medium">CANVAS ATS // HARVARD 1-PAGE</span>
                    <span class="hidden sm:inline-block text-zinc-600">·</span>
                    <span class="hidden sm:inline-block text-zinc-500 text-[10px]">A4 · 210 × 297 mm · aspect-[1/1.4142]</span>
                  </div>

                  <div class="flex items-center gap-2">
                    <!-- Selector de Zoom Rápido: Fit vs 100% -->
                    <div class="inline-flex items-center p-0.5 rounded bg-black/40 border border-white/10">
                      <button 
                        type="button" 
                        @click="setCvZoom('fit')" 
                        class="px-2 py-0.5 text-[10px] rounded transition-colors cursor-pointer"
                        :class="cvZoom === 'fit' ? 'bg-white/15 text-white font-semibold' : 'text-zinc-400 hover:text-white'"
                      >
                        Fit
                      </button>
                      <button 
                        type="button" 
                        @click="setCvZoom('100%')" 
                        class="px-2 py-0.5 text-[10px] rounded transition-colors cursor-pointer"
                        :class="cvZoom === '100%' ? 'bg-white/15 text-white font-semibold' : 'text-zinc-400 hover:text-white'"
                      >
                        100%
                      </button>
                    </div>

                    <!-- Botón directo Descargar PDF -->
                    <button 
                      type="button" 
                      @click="downloadTailoredCVPdf"
                      :disabled="isDownloadingPdf"
                      class="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                      title="Descargar PDF compilado nativo"
                    >
                      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      <span>PDF</span>
                    </button>

                    <!-- Botón Expandir a Modal Fullscreen -->
                    <button 
                      type="button" 
                      @click="openCvPreviewModal"
                      class="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                      title="Expandir previsualizador de alta fidelidad"
                    >
                      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                      <span>Expandir</span>
                    </button>
                  </div>
                </div>

                <!-- Canvas Editorial Gris Neutro con Sombra Volumétrica -->
                <div class="bg-[#0c0d10] p-4 sm:p-8 flex justify-center overflow-x-auto transition-all">
                  <div 
                    class="bg-white text-[#111111] p-8 sm:p-11 md:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08),0_10px_20px_-5px_rgba(0,0,0,0.4)] rounded-[2px] font-serif text-xs select-text flex flex-col justify-between transition-all"
                    :class="cvZoom === 'fit' ? 'w-full max-w-[680px] aspect-[1/1.4142] overflow-y-auto' : 'w-[210mm] min-h-[297mm]'"
                  >
                  <div>
                    <!-- Cabecera Harvard -->
                    <div class="text-center pb-2">
                      <h1 class="text-xl sm:text-2xl font-bold font-sans tracking-wide text-black uppercase">{{ cvData.name || 'MATEO GABRIEL SONZOGNI' }}</h1>
                      <div class="text-[11px] font-sans font-semibold text-zinc-800 mt-1">
                        {{ cvData.title || 'Full Stack Developer & Software Engineer' }}
                      </div>
                      <div class="text-[10px] font-sans text-zinc-600 mt-1 flex flex-wrap justify-center items-center gap-x-2 gap-y-0.5">
                        <span>{{ cvData.location || 'Río Negro, Patagonia Argentina (UTC-3)' }}</span>
                        <span class="text-zinc-400">·</span>
                        <a :href="'mailto:' + (cvData.email || 'mateogabus@gmail.com')" class="text-zinc-800 hover:underline">{{ cvData.email || 'mateogabus@gmail.com' }}</a>
                        <span class="text-zinc-400">·</span>
                        <a :href="cvData.portfolio || 'https://mateogs.tech'" target="_blank" class="text-zinc-800 hover:underline">mateogs.tech</a>
                        <span v-if="cvData.linkedin" class="text-zinc-400">·</span>
                        <a v-if="cvData.linkedin" :href="cvData.linkedin" target="_blank" class="text-zinc-800 hover:underline">LinkedIn</a>
                        <span v-if="cvData.github" class="text-zinc-400">·</span>
                        <a v-if="cvData.github" :href="cvData.github" target="_blank" class="text-zinc-800 hover:underline">GitHub</a>
                      </div>
                    </div>
                    <div class="border-b-[1.5px] border-black my-2.5"></div>

                    <!-- Professional Summary -->
                    <div class="mb-3.5">
                      <h2 class="text-[11px] font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
                        Professional Summary
                      </h2>
                      <p class="text-[10px] leading-relaxed text-justify text-zinc-800 font-serif">
                        {{ cvData.summary || 'Software engineer specialized in reactive web architectures, high-performance UI, and robust backend systems.' }}
                      </p>
                    </div>

                    <!-- Core Competencies & Stack -->
                    <div v-if="cvData.skills && Object.keys(cvData.skills).length" class="mb-3.5">
                      <h2 class="text-[11px] font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
                        Core Competencies & Stack
                      </h2>
                      <div class="space-y-1 text-[9.5px] font-serif leading-snug">
                        <div v-for="(skillsList, category) in cvData.skills" :key="category">
                          <span class="font-sans font-bold text-black uppercase tracking-tight text-[9.5px]">{{ category }}: </span>
                          <span class="text-zinc-800">{{ Array.isArray(skillsList) ? skillsList.join(', ') : skillsList }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Prioritized Experience & Shipped Projects -->
                    <div v-if="cvData.experience && cvData.experience.length" class="mb-3.5">
                      <h2 class="text-[11px] font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-2">
                        Relevant Experience & Shipped Projects
                      </h2>
                      <div v-for="(exp, expIdx) in cvData.experience" :key="expIdx" class="mb-2.5 last:mb-0">
                        <div class="flex justify-between items-baseline font-sans text-[10.5px] font-bold text-black">
                          <span>{{ (exp.title || exp.company || '').toUpperCase() }} — <span class="font-semibold text-zinc-800">{{ exp.role }}</span></span>
                          <span class="text-[9.5px] font-normal font-sans text-zinc-600">{{ exp.period || '2026' }}</span>
                        </div>
                        <ul class="list-disc pl-4 mt-0.5 space-y-0.5 text-[9.5px] leading-relaxed text-zinc-800 font-serif">
                          <li v-for="(b, bIdx) in (exp.bullets || [])" :key="bIdx">{{ b }}</li>
                        </ul>
                        <div v-if="exp.tech_stack && exp.tech_stack.length" class="text-[9px] text-zinc-600 font-sans mt-0.5 pl-4">
                          <span class="italic font-medium">Stack:</span> {{ Array.isArray(exp.tech_stack) ? exp.tech_stack.join(', ') : exp.tech_stack }}
                        </div>
                      </div>
                    </div>

                    <!-- Education -->
                    <div v-if="cvData.education && cvData.education.length" class="mb-2">
                      <h2 class="text-[11px] font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
                        Education
                      </h2>
                      <div v-for="(edu, eduIdx) in cvData.education" :key="eduIdx" class="mb-1 last:mb-0">
                        <div class="flex justify-between items-baseline font-sans text-[10px]">
                          <span class="font-bold text-black">{{ edu.degree || edu.title }} — <span class="font-normal text-zinc-800">{{ edu.institution }}</span></span>
                          <span class="text-[9.5px] text-zinc-600">{{ edu.period || '' }}</span>
                        </div>
                        <p v-if="edu.details" class="text-[9px] text-zinc-600 font-serif leading-snug mt-0.5">{{ edu.details }}</p>
                      </div>
                    </div>

                    <!-- Languages & Engineering Practices -->
                    <div v-if="(cvData.languages && cvData.languages.length) || (cvData.methodologies && cvData.methodologies.length)" class="mb-2">
                      <h2 class="text-[11px] font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
                        Languages & Engineering Standards
                      </h2>
                      <div class="space-y-1 text-[9.5px] font-serif leading-snug">
                        <div v-if="cvData.languages && cvData.languages.length">
                          <span class="font-sans font-bold text-black uppercase tracking-tight text-[9.5px]">Languages: </span>
                          <span class="text-zinc-800">{{ Array.isArray(cvData.languages) ? cvData.languages.join(' · ') : cvData.languages }}</span>
                        </div>
                        <div v-if="cvData.methodologies && cvData.methodologies.length">
                          <span class="font-sans font-bold text-black uppercase tracking-tight text-[9.5px]">Methodologies & Practices: </span>
                          <span class="text-zinc-800">{{ Array.isArray(cvData.methodologies) ? cvData.methodologies.join(' · ') : cvData.methodologies }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Pie de Página A4 Estándar -->
                  <div class="mt-6 pt-2 border-t border-zinc-200 flex justify-between items-center text-[9px] font-mono-code text-zinc-400 select-none">
                    <span>Estándar Harvard ATS (Página Única)</span>
                    <span>210 × 297 mm · A4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

            <!-- Botones de Estado de Postulación y Eliminación -->
            <div class="pt-2 flex items-center justify-between select-none border-t border-white/5 flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <span class="text-xs text-zinc-400 font-mono-code">Estado:</span>
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

              <button
                type="button"
                @click="deleteCurrentJob"
                :disabled="store.hunter.isDeletingSingle"
                title="Eliminar esta vacante permanentemente de la base de datos"
                class="px-2.5 py-1 text-xs rounded border border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 font-mono-code cursor-pointer inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <svg v-if="store.hunter.isDeletingSingle" class="adm-icon xs animate-spin text-rose-400" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <svg v-else class="adm-icon xs text-rose-400" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                <span>{{ store.hunter.isDeletingSingle ? 'Borrando...' : 'Eliminar Vacante' }}</span>
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

      <!-- Modal de Postulación Rápida (1 Input, 1 Clic) -->
      <div
        v-if="applyModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none"
        @click.self="closeApplyModal"
      >
        <div class="bg-[#0f1013] border border-white/10 rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden text-zinc-200">
          <!-- Cabecera Limpia -->
          <div class="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-[#131418] shrink-0">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <div class="min-w-0">
                <h3 class="text-xs font-bold text-white font-mono-code uppercase tracking-wider truncate">
                  Despacho Rápido de Postulación
                </h3>
                <p class="text-[11px] text-zinc-400 font-mono-code truncate">
                  {{ store.hunter.selected?.title }} · {{ store.hunter.selected?.company }}
                </p>
              </div>
            </div>
            <button
              type="button"
              @click="closeApplyModal"
              class="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <svg class="adm-icon sm" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Spinner al preparar borrador -->
          <div v-if="isLoadingApplyPreview" class="p-12 flex flex-col items-center justify-center space-y-3 font-mono-code">
            <div class="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs text-zinc-400">Compilando CV Harvard y ajustando pitch de ingeniería...</p>
          </div>

          <!-- Contenido Rápido -->
          <form v-else @submit.prevent="submitApplyEmail" class="flex-1 flex flex-col overflow-hidden p-5 space-y-4 font-mono-code text-xs">
            <!-- Único Input Requerido: Destinatario -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-[11px] text-zinc-300 font-semibold uppercase tracking-wider">
                  Destinatario (Email de Selección / Recruiter):
                </label>
                <span v-if="applyForm.toEmail && applyForm.toEmail.includes('@')" class="text-[10px] text-emerald-400 font-mono-code flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Listo para despachar
                </span>
                <span v-else class="text-[10px] text-amber-400 font-mono-code">
                  Requerido para enviar
                </span>
              </div>
              <div class="relative">
                <input
                  type="email"
                  required
                  v-model="applyForm.toEmail"
                  placeholder="reclutador@empresa.com o jobs@company.com"
                  class="text-input !h-[38px] !pl-9 text-xs font-mono-code w-full bg-[#16171d] border-white/15 placeholder:text-zinc-600 focus:border-emerald-400 focus:bg-[#1a1b22] text-white"
                  autofocus
                />
                <svg class="adm-icon xs text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
            </div>

            <!-- Fila de Adjunto Automatizado -->
            <div class="flex items-center justify-between p-2.5 rounded-lg bg-white/3 border border-white/10 text-[11px]">
              <div class="flex items-center gap-2 min-w-0">
                <svg class="adm-icon sm text-emerald-400 shrink-0" viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <div class="truncate">
                  <span class="text-white font-medium">CV_Mateo_Sonzogni.pdf</span>
                  <span class="text-zinc-500 ml-1.5">(Harvard ATS · 1 pág A4 nativa)</span>
                </div>
              </div>
              <button
                type="button"
                @click="openTailoredCVHtml"
                class="text-[10px] text-zinc-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                title="Previsualizar el CV que se enviará adjunto"
              >
                Previsualizar
              </button>
            </div>

            <!-- Vista Previa del Mensaje (Modo Lectura por Defecto) -->
            <div class="flex-1 flex flex-col space-y-2 min-h-0">
              <div class="flex items-center justify-between">
                <span class="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
                  Vista Previa del Correo:
                </span>
                <button
                  type="button"
                  @click="isCustomizingText = !isCustomizingText"
                  class="text-[10px] text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {{ isCustomizingText ? 'Fijar texto' : 'Modificar texto' }}
                </button>
              </div>

              <!-- Si está en modo edición -->
              <div v-if="isCustomizingText" class="space-y-2 flex-1 flex flex-col min-h-0">
                <input
                  type="text"
                  v-model="applyForm.subject"
                  class="text-input !h-[32px] text-xs font-mono-code w-full bg-[#16171d]"
                  placeholder="Asunto del correo"
                />
                <textarea
                  v-model="applyForm.body"
                  class="text-input flex-1 min-h-[140px] text-xs font-mono-code w-full p-2.5 resize-none bg-[#16171d]"
                  placeholder="Cuerpo del mensaje"
                ></textarea>
              </div>

              <!-- Modo Lectura Estilo Carta (Cero Fricción) -->
              <div v-else class="flex-1 flex flex-col min-h-0 bg-[#0a0b0d] border border-white/5 rounded-lg p-3 overflow-y-auto space-y-2 text-zinc-300 text-[11px] leading-relaxed select-text">
                <div class="text-white font-semibold pb-1.5 border-b border-white/5">
                  <span class="text-zinc-500 mr-1.5">Asunto:</span>{{ applyForm.subject }}
                </div>
                <div class="whitespace-pre-line text-zinc-300 font-sans text-xs pt-1">
                  {{ applyForm.body }}
                </div>
              </div>
            </div>

            <!-- Botones de Acción -->
            <div class="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-white/10 shrink-0">
              <div class="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500/60"></span>
                <span>Remitente: <span class="text-zinc-300 font-mono-code">mateogabus@gmail.com</span></span>
              </div>

              <div class="flex items-center justify-end gap-2">
                <button
                  type="button"
                  @click="closeApplyModal"
                  class="btn-secondary !h-[34px] !px-3 text-xs font-mono-code cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  @click="submitApplyEmail"
                  :disabled="store.hunter.isApplying || !applyForm.toEmail"
                  class="btn-secondary !h-[34px] !px-3 text-xs font-mono-code cursor-pointer inline-flex items-center gap-1.5 text-zinc-300 hover:text-white border-white/10 disabled:opacity-40"
                  title="Despachar automáticamente en segundo plano mediante webhook de n8n"
                >
                  <svg v-if="store.hunter.isApplying" class="adm-icon xs animate-spin" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  <svg v-else class="adm-icon xs text-purple-400" viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                  <span>{{ store.hunter.isApplying ? 'Despachando...' : 'Despachar (n8n)' }}</span>
                </button>
                <button
                  type="button"
                  @click="openGmailDirectCompose"
                  :disabled="!applyForm.toEmail"
                  class="btn-primary !h-[34px] !px-4 text-xs font-mono-code font-bold cursor-pointer inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  title="Abre la redacción directa en Gmail y descarga automáticamente el CV en PDF"
                >
                  <svg class="adm-icon xs" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <span>Postular en Gmail (1-Click)</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal de Previsualización de Alta Fidelidad (PDF / HTML Renderizado) -->
      <div 
        v-if="cvPreviewModalOpen" 
        class="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-md overflow-hidden select-none"
        @keydown.esc="closeCvPreviewModal"
      >
        <!-- Barra Superior del Visor de Documentos (macOS Studio / Linear 2026) -->
        <header class="h-14 bg-[#0f1117]/95 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between text-xs font-mono-code text-white select-none gap-4 shrink-0">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span class="font-bold tracking-wider uppercase text-white truncate">VISOR HARVARD ATS // ALTA FIDELIDAD</span>
            <span class="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-zinc-400">A4 · 210 × 297 mm</span>
            <span v-if="store.hunter.selected && store.hunter.selected.company" class="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 truncate max-w-[200px]">
              {{ store.hunter.selected.company }}
            </span>
          </div>

          <!-- Acciones del Visor -->
          <div class="flex items-center gap-2">
            <!-- Selector de Zoom en Modal -->
            <div class="inline-flex items-center p-0.5 rounded bg-black/50 border border-white/10">
              <button 
                type="button" 
                @click="cvModalZoom = 'fit'" 
                class="px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer"
                :class="cvModalZoom === 'fit' ? 'bg-white/15 text-white font-semibold' : 'text-zinc-400 hover:text-white'"
              >
                Fit
              </button>
              <button 
                type="button" 
                @click="cvModalZoom = '100%'" 
                class="px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer"
                :class="cvModalZoom === '100%' ? 'bg-white/15 text-white font-semibold' : 'text-zinc-400 hover:text-white'"
              >
                100%
              </button>
            </div>

            <!-- Descargar PDF Nativo -->
            <button 
              type="button" 
              @click="downloadTailoredCVPdf"
              :disabled="isDownloadingPdf"
              class="btn-primary !h-[30px] !text-xs cursor-pointer inline-flex items-center gap-1.5"
              title="Descargar documento PDF compilado nativo"
            >
              <svg v-if="!isDownloadingPdf" class="adm-icon sm" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span v-else class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>{{ isDownloadingPdf ? 'Descargando...' : 'Descargar PDF' }}</span>
            </button>

            <!-- Imprimir A4 -->
            <button 
              type="button" 
              @click="printTailoredCV" 
              class="btn-secondary !h-[30px] !text-xs cursor-pointer inline-flex items-center gap-1.5 text-zinc-200 hover:text-white"
              title="Imprimir en A4"
            >
              <svg class="adm-icon sm" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span class="hidden sm:inline">Imprimir A4</span>
            </button>

            <!-- Copiar Texto Plano ATS -->
            <button 
              type="button" 
              @click="copyTailoredCVText" 
              class="btn-secondary !h-[30px] !text-xs cursor-pointer inline-flex items-center gap-1.5 text-zinc-200 hover:text-white"
              title="Copiar texto plano ATS"
            >
              <svg class="adm-icon sm" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span class="hidden md:inline">Copiar ATS</span>
            </button>

            <!-- Cerrar Modal -->
            <button 
              type="button" 
              @click="closeCvPreviewModal" 
              class="h-[30px] w-[30px] rounded hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors ml-1"
              title="Cerrar visor (Esc)"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </header>

        <!-- Cuerpo del Visor con Canvas Editorial Neutro -->
        <main class="flex-1 overflow-auto bg-[#0c0d10] flex justify-center items-start p-4 sm:p-8">
          <div 
            class="bg-white rounded-[2px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.08),0_10px_20px_-5px_rgba(0,0,0,0.5)] transition-all duration-200 flex flex-col overflow-hidden"
            :class="cvModalZoom === 'fit' ? 'w-full max-w-[820px] aspect-[1/1.4142] h-[calc(100vh-110px)]' : 'w-[210mm] min-h-[297mm] h-[297mm]'"
          >
            <iframe 
              v-if="cvPreviewUrl"
              :src="cvPreviewUrl" 
              class="w-full h-full border-none"
              title="Vista previa del CV Harvard ATS"
              sandbox="allow-scripts allow-modals allow-same-origin allow-popups"
            ></iframe>
            <div v-else class="flex-1 flex items-center justify-center text-zinc-500 font-mono-code text-xs">
              Cargando documento...
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
  `,
}
