// Portfolio CMS 2026 · Estado Reactivo Compartido (Vue 3 Store)
// Manejo centralizado de datos, navegación, dirty tracking y modales

import { api, AUTH_MESSAGE } from './api.js'
import { MODELS } from './config.js'
import { TRANSLATABLE_SECTIONS, missingEn } from './translations.js'
import { clearCachedJobs, isSampleJob, readCachedJobs as getCachedHunterJobs, writeCachedJobs } from './hunterCache.js'

const { reactive } = window.Vue

/** Secciones cuyo slug queda fijo al abrir un registro guardado: ya no sigue al título ni al cargo. */
const FIXED_SLUG_SECTIONS = ['projects', 'experience', 'articles']
/** Páginas y Textos son documentos fijos (about, contact): no se crean, duplican ni eliminan. */
const FIXED_RECORD_SECTIONS = ['docs']

export const store = reactive({
  // Autenticación
  token: api.getToken(),
  tokenInput: '',
  passwordVisible: false,

  // Navegación & Selección
  section: 'dashboard',
  rows: [],
  current: null,
  form: null,
  formSection: null, // sección a la que pertenece el formulario abierto: guardar se niega si no coincide
  loadingSection: false,
  loadError: '', // la colección no se pudo leer: no hay formulario y no se guarda nada
  isNew: false,
  isDirty: false,
  initialSnapshot: null,
  slugLocked: true,
  activeTab: 'general',
  lang: 'es', // idioma que se edita: 'es' (el registro) | 'en' (sus traducciones, con el español de referencia)
  mobileView: 'list', // 'list' | 'detail' for responsive master-detail

  // Metadatos relacionales
  meta: {
    enums: { ProjectStatus: [], TechCategory: [], MediaKind: [], MediaRole: [], MediaViewport: [], ExperienceKind: [], MetricUnit: [] },
    options: { orgs: [], techs: [], projects: [] },
  },
  allTechs: [],
  counts: {
    projects: 0,
    experience: 0,
    stack: 0,
    orgs: 0,
    articles: 0,
    docs: 0,
    hunter: getCachedHunterJobs().length,
    content: 0,
    radar: 0,
  },

  // Job Hunter & Reclutamiento IA
  hunter: {
    jobs: getCachedHunterJobs(),
    filter: 'high',
    selected: null,
    isScanning: false,
    isEvaluating: false,
    isEvaluatingSingle: false,
    isPitching: false,
    isGeneratingCV: false,
    isPurging: false,
    isVectorizing: false,
    isDeletingAll: false,
    isDeletingSingle: false,
    isApplying: false,
    sortBy: 'ia',
    copiedPitch: false,
    copiedCV: false,
  },

  // Gestión de Contenido Omnicanal (Eros IA)
  content: {
    posts: [],
    filter: 'all',
    selected: null,
    isGenerating: false,
    publishing: {},
    expanded: {},
  },

  // TrendRadar (Eros IA)
  radar: {
    trends: [],
    filter: 'all',
    selected: null,
    isScanning: false,
    isGenerating: false,
    generatingId: null,
  },

  // Filtros & Búsqueda
  searchQuery: '',
  filter: 'all',
  techSearchQuery: '',

  // Feedback Visual (Toasts & Modales)
  toasts: [],
  modals: {
    commandPalette: false,
    confirm: null,
    help: false,
    lightbox: null,
  },

  // Flags operativos
  uploading: false,
  importingGitHub: false,

  /** Filas Metric de la obra abierta (viven en form.metrics; la pestaña muestra cuántas hay). */
  get metricsList() {
    return this.section === 'projects' && Array.isArray(this.form?.metrics) ? this.form.metrics : []
  },

  /** En inglés solo se editan las secciones que tienen traducción. */
  get editingEn() {
    return this.lang === 'en' && TRANSLATABLE_SECTIONS.includes(this.section)
  },

  /** Campos del registro abierto que tienen español y no tienen inglés. */
  get missingEnList() {
    return TRANSLATABLE_SECTIONS.includes(this.section) ? missingEn(this.section, this.form) : []
  },

  // ─── ACCIONES DE TOAST & MENSAJES ─────────────────────────────────────────
  toast(kind, text, timeout = 3600) {
    // Un 401 tiene un solo aviso: los mensajes que lo repiten («Error al cargar…: <401>») no suman otro.
    if (kind === 'err' && String(text).includes(AUTH_MESSAGE)) {
      if (this.toasts.some(t => t.text === AUTH_MESSAGE)) return null
      text = AUTH_MESSAGE
    }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    this.toasts.push({ id, kind, text })
    if (timeout > 0) {
      setTimeout(() => {
        this.removeToast(id)
      }, timeout)
    }
    return id
  },

  removeToast(id) {
    const idx = this.toasts.findIndex(t => t.id === id)
    if (idx !== -1) this.toasts.splice(idx, 1)
  },

  // ─── MODAL CONFIRMACIÓN ACCESIBLE ─────────────────────────────────────────
  requestConfirm(options) {
    return new Promise((resolve) => {
      this.modals.confirm = {
        title: options.title || 'Confirmar Acción',
        message: options.message || '¿Confirmás que deseás continuar con esta operación?',
        targetName: options.targetName || '',
        detail: options.detail || '',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        kind: options.kind || 'danger',
        onConfirm: () => {
          this.modals.confirm = null
          resolve(true)
        },
        onCancel: () => {
          this.modals.confirm = null
          resolve(false)
        },
      }
    })
  },

  // ─── DIRTY STATE TRACKING ─────────────────────────────────────────────────
  calcSnapshot(formData) {
    if (!formData) return null
    try {
      return JSON.stringify(formData)
    } catch {
      return null
    }
  },

  markClean(formData) {
    this.initialSnapshot = this.calcSnapshot(formData)
    this.isDirty = false
  },

  checkDirty() {
    if (!this.form || !this.initialSnapshot) {
      this.isDirty = false
      return false
    }
    const current = this.calcSnapshot(this.form)
    this.isDirty = current !== this.initialSnapshot
    return this.isDirty
  },

  /** true si se puede seguir (no había cambios o se descartaron); false si el operador sigue editando. */
  async checkDirtyDiscard(nextAction) {
    if (!this.isDirty) {
      if (typeof nextAction === 'function') nextAction()
      return true
    }
    const targetName = this.form ? (this.form.title || this.form.name || this.form.role || this.form.slug || 'este registro') : ''
    const confirmed = await this.requestConfirm({
      title: 'Descartar Cambios sin Guardar',
      message: 'Tenés modificaciones que no se han guardado en la base de datos.',
      targetName: `[Sin guardar] ${targetName}`,
      detail: 'Si continuás ahora, los cambios realizados se perderán y no podrán recuperarse.',
      confirmText: 'Descartar Cambios',
      cancelText: 'Seguir Editando',
      kind: 'warning',
    })
    if (confirmed) {
      this.isDirty = false
      this.initialSnapshot = null
      if (typeof nextAction === 'function') nextAction()
      return true
    }
    return false
  },

  // ─── CARGA INICIAL DE LA SESIÓN ───────────────────────────────────────────
  async initSession() {
    if (!this.token) return
    try {
      const meta = await api.getMeta()
      this.meta = meta

      // Cargar tecnologías completas para chips categorizados
      try {
        const techs = await api.getCollection('techs')
        this.allTechs = techs || []
      } catch (err) {
        console.warn('No se pudo cargar la lista extendida de tecnologías:', err)
      }

      await this.refreshCounts()
      await this.loadSection(this.section, false)
    } catch (err) {
      this.toast('err', err.message || 'Error al autenticar sesión')
      this.token = ''
      api.setToken('')
    }
  },

  async refreshCounts() {
    try {
      try {
        const res = typeof api.get === 'function'
          ? await api.get('/admin/meta')
          : await api.getMeta()

        if (res?.counts) {
          Object.assign(store.counts, res.counts)
          if (!this.counts.hunter && this.hunter.jobs.length) {
            this.counts.hunter = this.hunter.jobs.length
          }
          if (!this.counts.content && this.content.posts.length) {
            this.counts.content = this.content.posts.length
          }
          if (!this.counts.radar && this.radar.trends.length) {
            this.counts.radar = this.radar.trends.length
          }
          return
        }
      } catch {
        // Fallback al conteo individual si /api/admin/meta no responde o no expone counts
      }

      const [projs, exps, stks, orgs, arts, dcs, jbs, cnts, rads] = await Promise.all([
        api.getCollection('projects').catch(() => []),
        api.getCollection('experience').catch(() => []),
        api.getCollection('techs').catch(() => []),
        api.getCollection('orgs').catch(() => []),
        api.getCollection('articles').catch(() => []),
        api.getCollection('docs').catch(() => []),
        api.getHunterJobs().catch(() => []),
        api.getContentPosts().catch(() => []),
        api.getRadarTrends().catch(() => []),
      ])
      this.counts.projects = projs.length
      this.counts.experience = exps.length
      this.counts.stack = stks.length
      this.counts.orgs = orgs.length
      this.counts.articles = arts.length
      this.counts.docs = dcs.length
      this.counts.hunter = jbs.length
      this.counts.content = cnts.length
      this.counts.radar = rads.length
    } catch (err) {
      console.warn('Error al calcular conteos:', err)
    }
  },

  /** Abre una sección. Devuelve false si el operador decidió seguir editando o si la lectura falló. */
  async loadSection(sec, preserveDirtyCheck = true) {
    if (preserveDirtyCheck && this.isDirty && !(await this.checkDirtyDiscard())) return false

    this.section = sec
    this.loadError = ''
    this.loadingSection = false
    this.clearForm()
    this.searchQuery = ''
    this.filter = 'all'
    this.activeTab = 'general'
    this.mobileView = 'list'

    if (sec === 'dashboard') {
      await this.refreshCounts()
      return true
    }

    if (sec === 'hunter') {
      await this.loadHunterJobs()
      return true
    }

    if (sec === 'content') {
      await this.loadContentPosts()
      return true
    }

    if (sec === 'radar') {
      await this.loadRadarTrends()
      return true
    }

    const model = MODELS[sec]
    if (!model) return false

    this.rows = []
    this.loadingSection = true
    try {
      const rows = await api.getCollection(model.path)
      if (this.section !== sec) return false
      this.rows = rows || []
      this.counts[sec] = this.rows.length
      this.loadingSection = false

      if (this.rows.length > 0) {
        this.selectRecord(this.rows[0])
      } else {
        this.createRecord()
      }
      return true
    } catch (err) {
      if (this.section !== sec) return false
      // Sin la lista no queda nada que editar: un Ctrl+S no puede mandar un formulario de otra sección.
      this.rows = []
      this.clearForm()
      this.loadError = `No pudimos cargar ${model.label}. ${err.message}`
      this.toast('err', this.loadError)
      return false
    } finally {
      if (this.section === sec) this.loadingSection = false
    }
  },

  /** Cierra el formulario abierto sin tocar la lista. */
  clearForm() {
    this.current = null
    this.form = null
    this.formSection = null
    this.isNew = false
    this.isDirty = false
    this.initialSnapshot = null
  },

  /** true si en esta sección se pueden crear registros (no en el Panel, el Job Hunter ni los documentos). */
  get canCreate() {
    return !!MODELS[this.section] && !FIXED_RECORD_SECTIONS.includes(this.section) && !this.loadError && !this.loadingSection
  },

  /** true si el registro abierto se puede duplicar o eliminar. */
  get canRemove() {
    return !this.isNew && !!this.current && !FIXED_RECORD_SECTIONS.includes(this.section)
  },

  selectRecord(row) {
    const model = MODELS[this.section]
    if (!model) return
    this.current = row
    this.isNew = false
    this.form = model.toForm(JSON.parse(JSON.stringify(row)))
    this.formSection = this.section
    this.slugLocked = !FIXED_SLUG_SECTIONS.includes(this.section)
    this.markClean(this.form)
  },

  createRecord() {
    const model = MODELS[this.section]
    if (!model || !this.canCreate) return false
    this.current = null
    this.isNew = true
    this.form = model.blank()
    this.formSection = this.section
    this.slugLocked = true
    this.markClean(this.form)
    return true
  },

  /** «Nuevo» (botón, Ctrl+N, paleta): pide confirmación si hay cambios; en el Panel Principal no hace nada. */
  async requestNewRecord() {
    if (!this.canCreate) return false
    if (this.isNew && !this.isDirty) return true
    if (!(await this.checkDirtyDiscard())) return false
    return this.createRecord()
  },

  /**
   * Aplica un cambio que ya se guardó en el server (media, orden) al formulario, a su foto
   * limpia y al registro de la lista: así no aparece como cambio pendiente ni se pisa al guardar.
   */
  applySaved(change) {
    if (this.form) change(this.form)
    if (this.current) change(this.current)
    if (this.initialSnapshot) {
      const snapshot = JSON.parse(this.initialSnapshot)
      change(snapshot)
      this.initialSnapshot = JSON.stringify(snapshot)
    }
    this.checkDirty()
  },

  /** Sube o baja una obra en la lista y renumera sortOrder 1..n con PATCH solo donde cambió. */
  async moveProject(row, dir) {
    const rows = [...this.rows]
    const from = rows.indexOf(row)
    const to = from + dir
    if (from === -1 || to < 0 || to >= rows.length) return
    rows.splice(to, 0, ...rows.splice(from, 1))
    const changed = rows
      .map((r, i) => ({ r, sortOrder: i + 1 }))
      .filter(({ r, sortOrder }) => r.sortOrder !== sortOrder)
    try {
      await Promise.all(changed.map(({ r, sortOrder }) => api.patchRecord('projects', r.id, { sortOrder })))
      for (const { r, sortOrder } of changed) {
        if (this.current && this.current.id === r.id) this.applySaved((f) => { f.sortOrder = sortOrder })
        else r.sortOrder = sortOrder
      }
      this.rows = rows
      this.toast('ok', `«${row.title}» quedó en el puesto ${to + 1}`)
    } catch (err) {
      this.toast('err', `No se pudo reordenar: ${err.message}`)
      // Algunos PATCH pudieron entrar: la lista vuelve a leerse para mostrar el orden real.
      try {
        this.rows = (await api.getCollection('projects')) || []
      } catch { /* la lista queda como estaba */ }
    }
  },

  // ─── OPERACIONES DE JOB HUNTER ────────────────────────────────────────────
  _persistHunterJobs() {
    writeCachedJobs(this.hunter.jobs)
  },

  async loadHunterJobs() {
    const s = this || store
    // 1. Si no hay vacantes en memoria, poblar con caché inmediata de localStorage
    if (!s.hunter.jobs || s.hunter.jobs.length === 0) {
      const cached = getCachedHunterJobs()
      if (cached.length > 0) {
        s.hunter.jobs = cached
        s.counts.hunter = cached.length
        if (!s.hunter.selected) s.hunter.selected = cached[0]
      }
    }

    // 2. Traer la última lista fresca desde el agente Eros
    try {
      const res = await api.getHunterJobs()
      const list = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : [])
      const onlySample = list.length > 0 && list.every(isSampleJob)
      const realJobs = s.hunter.jobs.filter(j => !isSampleJob(j))
      if (onlySample && realJobs.length > 0) {
        // Eros no respondió y la API mandó su cola de ejemplo: se quedan las vacantes reales guardadas.
        s.hunter.jobs = realJobs
        s.counts.hunter = realJobs.length
        s.toast('info', 'Eros no respondió. Te mostramos las vacantes que tenías guardadas.')
      } else if (list.length > 0 || (s.hunter.jobs.length === 0)) {
        s.hunter.jobs = list
        s.counts.hunter = list.length
        s._persistHunterJobs()
      }
      if (s.hunter.jobs.length > 0) {
        if (!s.hunter.selected || !s.hunter.jobs.find(j => j.id === s.hunter.selected.id)) {
          s.hunter.selected = s.hunter.jobs[0]
        }
      }
    } catch (err) {
      if (s.hunter.jobs.length > 0) {
        console.warn('Eros Agent no respondió; usando vacantes guardadas en localStorage.')
      } else {
        s.toast('err', `Error al cargar vacantes: ${err.message}`)
      }
    }
  },

  async scanHunterJobs() {
    const s = this || store
    if (s.hunter.isScanning) return
    s.hunter.isScanning = true
    try {
      const res = await api.scanHunterJobs()
      // Sin Eros el servidor responde el respaldo con los conteos de la muestra: no se escaneó nada.
      if (res?._source === 'fallback' || res?._source === 'demo') {
        s.toast('info', 'Eros no respondió, así que no se buscaron vacantes nuevas. La lista muestra lo que ya estaba guardado.')
        await s.loadHunterJobs()
        return
      }
      const total = res?.scanned ?? res?.scanned_count ?? res?.data?.scanned ?? res?.data?.scanned_count ?? 0
      const newJobs = res?.new_jobs ?? res?.new_jobs_count ?? res?.data?.new_jobs ?? res?.data?.new_jobs_count ?? 0
      const evaluated = res?.evaluated_count ?? res?.data?.evaluated_count
      const evalText = evaluated ? ` (${evaluated} evaluadas con IA)` : ''
      const newText = newJobs > 0 ? ` (${newJobs} nuevas guardadas)` : ''
      s.toast('ok', `Escaneo finalizado: ${total} vacantes analizadas${newText}${evalText}`)
      await s.loadHunterJobs()
    } catch (err) {
      s.toast('err', `Error al escanear ofertas: ${err.message}`)
    } finally {
      s.hunter.isScanning = false
    }
  },

  async purgeHunterJobs() {
    const s = this || store
    if (s.hunter.isPurging) return
    s.hunter.isPurging = true
    try {
      const res = await api.purgeHunterJobs()
      const count = res?.purged_count ?? res?.data?.purged_count ?? 0
      if (count > 0) {
        s.toast('ok', `Depuración completa: ${count} vacantes incompatibles/descartadas eliminadas`)
      } else {
        s.toast('info', 'No se encontraron vacantes incompatibles para depurar')
      }
      await s.loadHunterJobs()
    } catch (err) {
      s.toast('err', `Error al depurar vacantes: ${err.message}`)
    } finally {
      s.hunter.isPurging = false
    }
  },

  async deleteAllHunterJobs() {
    const s = this || store
    if (s.hunter.isDeletingAll) return
    const confirmed = await s.requestConfirm({
      title: 'Eliminar Todas las Vacantes',
      message: '¿Estás seguro de que deseas eliminar todas las vacantes escaneadas?',
      detail: 'Esta acción borrará todas las ofertas de la base de datos para que puedas escanear todo limpio desde cero.',
      confirmText: 'Eliminar Todo',
      cancelText: 'Cancelar',
      kind: 'danger',
    })
    if (!confirmed) return
    s.hunter.isDeletingAll = true
    try {
      const res = await api.deleteAllHunterJobs()
      const count = res?.deleted_count ?? res?.data?.deleted_count ?? 0
      s.hunter.jobs = []
      s.hunter.selected = null
      s.counts.hunter = 0
      clearCachedJobs()
      s.toast('ok', `Se eliminaron ${count} vacantes escaneadas. Listo para escanear de cero.`)
    } catch (err) {
      s.toast('err', `Error al eliminar vacantes: ${err.message}`)
    } finally {
      s.hunter.isDeletingAll = false
    }
  },

  async deleteSingleHunterJob(id) {
    const s = this || store
    if (!id || s.hunter.isDeletingSingle) return
    const confirmed = await s.requestConfirm({
      title: 'Eliminar Vacante',
      message: '¿Deseas eliminar permanentemente esta vacante?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      kind: 'danger',
    })
    if (!confirmed) return
    s.hunter.isDeletingSingle = true
    try {
      await api.deleteHunterJob(id)
      s.hunter.jobs = s.hunter.jobs.filter(j => j.id !== id)
      s.counts.hunter = s.hunter.jobs.length
      if (s.hunter.selected && s.hunter.selected.id === id) {
        s.hunter.selected = s.hunter.jobs[0] || null
      }
      s._persistHunterJobs()
      s.toast('ok', 'Vacante eliminada')
    } catch (err) {
      s.toast('err', `Error al eliminar vacante: ${err.message}`)
    } finally {
      s.hunter.isDeletingSingle = false
    }
  },

  async vectorizeHunterJobs() {
    const s = this || store
    if (s.hunter.isVectorizing) return
    s.hunter.isVectorizing = true
    try {
      const res = await api.vectorizeHunterJobs()
      const count = res?.vectorized_count ?? res?.data?.vectorized_count ?? 0
      s.toast('ok', `Vectorización completada: ${count} vacantes indexadas con Gemini`)
      await s.loadHunterJobs()
    } catch (err) {
      s.toast('err', `Error al vectorizar vacantes: ${err.message}`)
    } finally {
      s.hunter.isVectorizing = false
    }
  },

  async evaluatePendingHunterJobs(limit = 15) {
    const s = this || store
    if (s.hunter.isEvaluating) return
    s.hunter.isEvaluating = true
    try {
      const res = await api.evaluateHunterJobs(limit)
      const count = res?.evaluated_count ?? res?.data?.evaluated_count ?? (Array.isArray(res?.evaluated) ? res.evaluated.length : 0)

      if (Array.isArray(res?.evaluated)) {
        for (const item of res.evaluated) {
          const matchJob = s.hunter.jobs.find(j => j.id === item.id || j.external_id === item.id)
          if (matchJob) {
            matchJob.match_score = item.score
            if (item.verdict === 'DESCARTAR') {
              matchJob.status = 'discarded'
            } else if (item.score >= 70) {
              matchJob.status = 'saved'
            } else {
              matchJob.status = 'evaluated'
            }
          }
        }
        if (s.hunter.selected) {
          const updatedSel = s.hunter.jobs.find(j => j.id === s.hunter.selected.id || j.external_id === s.hunter.selected.id)
          if (updatedSel) {
            s.hunter.selected = { ...updatedSel }
          }
        }
        s._persistHunterJobs()
      }

      s.toast('ok', `Evaluación completada: ${count} vacantes analizadas`)
      await s.loadHunterJobs()
    } catch (err) {
      s.toast('err', `Error al evaluar vacantes: ${err.message}`)
    } finally {
      s.hunter.isEvaluating = false
    }
  },

  /** Analiza una vacante: la manda entera en el cuerpo para que la API la evalúe aunque Eros no la tenga. */
  async evaluateSingleHunterJob(target) {
    const s = this || store
    const id = target?.id
    if (!id || s.hunter.isEvaluatingSingle) return
    s.hunter.isEvaluatingSingle = true
    try {
      const res = await api.evaluateHunterJob(target)
      const job = res?.job || res?.data?.job || (res?.id ? res : null)
      const match = res?.match || res?.data?.match || null

      const idx = s.hunter.jobs.findIndex(j => j.id === id || j.external_id === id)
      if (idx !== -1) {
        const current = s.hunter.jobs[idx]
        // El análisis no cambia de dónde viene la vacante: una real evaluada por el respaldo sigue siendo real.
        const updated = {
          ...current,
          ...(job || {}),
          _source: current._source,
        }
        if (!updated._source) delete updated._source
        if (match) {
          updated.match_score = match.score ?? updated.match_score
          updated.match_analysis = typeof match === 'string' ? match : JSON.stringify(match)
          if (match.recruiter_note) {
            updated.connection_note = match.recruiter_note
          }
          if (match.salary_estimate && !updated.salary) {
            updated.salary = match.salary_estimate
          }
          if (match.verdict === 'DESCARTAR') {
            updated.status = 'discarded'
          } else if ((match.score ?? 0) >= 70) {
            updated.status = 'saved'
          } else {
            updated.status = 'evaluated'
          }
        } else if (updated.match_analysis && typeof updated.match_analysis !== 'string') {
          updated.match_analysis = JSON.stringify(updated.match_analysis)
        }
        s.hunter.jobs[idx] = updated
        if (s.hunter.selected && (s.hunter.selected.id === id || s.hunter.selected.external_id === id)) {
          s.hunter.selected = { ...updated }
        }
        s._persistHunterJobs()
        s.toast('ok', `Vacante evaluada: ${updated.match_score ?? 0}% de compatibilidad`)
      } else if (job) {
        if (match && !job.match_analysis) {
          job.match_analysis = typeof match === 'string' ? match : JSON.stringify(match)
        }
        s.hunter.jobs.unshift(job)
        s.hunter.selected = { ...job }
        s._persistHunterJobs()
        s.toast('ok', `Vacante evaluada: ${job.match_score ?? 0}% de compatibilidad`)
      }
    } catch (err) {
      s.toast('err', `Error al evaluar vacante: ${err.message}`)
    } finally {
      s.hunter.isEvaluatingSingle = false
    }
  },

  async applyHunterJobByEmail(id, payload = {}) {
    const s = this || store
    if (!id || s.hunter.isApplying) return
    s.hunter.isApplying = true
    try {
      const res = await api.applyHunterJobByEmail(id, payload)
      const recipient = res?.dispatched_to || payload.to_email || 'destinatario'
      if (res?.provider === 'local_registered') {
        s.toast('info', `Postulación registrada localmente para ${recipient}. Configurá credenciales SMTP en eros-agent para envío real.`)
      } else {
        const provider = res?.provider ? ` vía ${res.provider.toUpperCase()}` : ''
        s.toast('ok', `Postulación enviada exitosamente a ${recipient}${provider}`)
      }
      const job = s.hunter.jobs.find(j => j.id === id)
      if (job) {
        job.status = 'applied'
        job.applied_at = res?.applied_at || new Date().toISOString()
        if (payload.to_email) job.contact_email = payload.to_email
      }
      if (s.hunter.selected && s.hunter.selected.id === id) {
        s.hunter.selected.status = 'applied'
        s.hunter.selected.applied_at = res?.applied_at || new Date().toISOString()
        if (payload.to_email) s.hunter.selected.contact_email = payload.to_email
      }
      s._persistHunterJobs()
      return res
    } catch (err) {
      s.toast('err', `Error al enviar postulación: ${err.message}`)
      throw err
    } finally {
      s.hunter.isApplying = false
    }
  },

  async updateHunterJobContactEmail(id, email) {
    const s = this || store
    try {
      await api.updateHunterJobContactEmail(id, email)
      const job = s.hunter.jobs.find(j => j.id === id)
      if (job) job.contact_email = email
      if (s.hunter.selected && s.hunter.selected.id === id) {
        s.hunter.selected.contact_email = email
      }
      s._persistHunterJobs()
      s.toast('ok', 'Correo de contacto actualizado')
    } catch (err) {
      s.toast('err', `Error al actualizar correo de contacto: ${err.message}`)
    }
  },

  // ─── OPERACIONES DE CONTENIDO OMNICANAL (EROS IA) ─────────────────────────
  async loadContentPosts() {
    const s = this || store
    try {
      const posts = await api.getContentPosts()
      s.content.posts = Array.isArray(posts) ? posts : []
      s.counts.content = s.content.posts.length
      if (s.content.posts.length > 0 && (!s.content.selected || !s.content.posts.find(p => p.id === s.content.selected.id))) {
        s.content.selected = s.content.posts[0]
      }
    } catch (err) {
      console.warn('Error al cargar posts omnicanal:', err)
      s.toast('err', `Error al cargar publicaciones de contenido: ${err.message}`)
    }
  },

  async generateContentPost(payload) {
    const s = this || store
    if (s.content.isGenerating) return null
    s.content.isGenerating = true
    try {
      const res = await api.generateContent(payload)
      const post = res?.post || res?.data?.post || res
      s.toast('ok', 'Contenido omnicanal generado con éxito')
      await s.loadContentPosts()
      if (post && post.id) {
        s.content.selected = s.content.posts.find(p => p.id === post.id) || post
      }
      return post
    } catch (err) {
      s.toast('err', `Error al generar contenido: ${err.message}`)
      throw err
    } finally {
      s.content.isGenerating = false
    }
  },

  async publishContentPost(id, platform = 'all') {
    const s = this || store
    if (s.content.publishing[id]) return
    s.content.publishing[id] = true
    try {
      const res = await api.publishContentPost(id, platform)
      s.toast('ok', `Contenido despachado exitosamente a n8n (${platform})`)
      await s.loadContentPosts()
      return res
    } catch (err) {
      s.toast('err', `Error al publicar contenido: ${err.message}`)
    } finally {
      delete s.content.publishing[id]
    }
  },

  async updateContentPostStatus(id, status) {
    const s = this || store
    try {
      await api.updateContentPostStatus(id, status)
      const post = s.content.posts.find(p => p.id === id)
      if (post) post.status = status
      if (s.content.selected && s.content.selected.id === id) {
        s.content.selected.status = status
      }
      s.toast('ok', `Estado actualizado a: ${status}`)
    } catch (err) {
      s.toast('err', `Error al actualizar estado: ${err.message}`)
    }
  },

  async deleteContentPost(id) {
    const s = this || store
    const confirmed = await s.requestConfirm({
      title: 'Eliminar Publicación',
      message: '¿Estás seguro de que deseas eliminar este contenido omnicanal?',
      detail: 'Se borrará el post de LinkedIn, el hilo de X, el artículo de Dev.to y su carrusel generado.',
      confirmText: 'Eliminar Definitivamente',
      cancelText: 'Cancelar',
      kind: 'danger',
    })
    if (!confirmed) return
    try {
      await api.deleteContentPost(id)
      s.content.posts = s.content.posts.filter(p => p.id !== id)
      s.counts.content = s.content.posts.length
      if (s.content.selected && s.content.selected.id === id) {
        s.content.selected = s.content.posts[0] || null
      }
      s.toast('ok', 'Publicación eliminada correctamente')
    } catch (err) {
      s.toast('err', `Error al eliminar publicación: ${err.message}`)
    }
  },

  async publishPostToBlog(id) {
    const s = this || store
    try {
      const res = await api.publishPostToBlog(id)
      s.toast('ok', `Artículo publicado en /articles/${res?.article?.slug || ''}`)
      await s.loadContentPosts()
      await s.refreshCounts()
      return res
    } catch (err) {
      s.toast('err', `Error al publicar en el Blog: ${err.message}`)
      throw err
    }
  },

  // TrendRadar Operations
  async loadRadarTrends() {
    const s = this || store
    try {
      const trends = await api.getRadarTrends()
      s.radar.trends = trends || []
      s.counts.radar = s.radar.trends.length
      if (s.radar.trends.length > 0 && (!s.radar.selected || !s.radar.trends.find(t => t.id === s.radar.selected.id))) {
        s.radar.selected = s.radar.trends[0]
      }
    } catch (err) {
      console.warn('Error al cargar tendencias de TrendRadar:', err)
      s.toast('err', `Error al cargar radar de tendencias: ${err.message}`)
    }
  },

  async scanRadar() {
    const s = this || store
    if (s.radar.isScanning) return
    s.radar.isScanning = true
    try {
      const res = await api.scanRadar(15)
      s.toast('ok', `Radar completado: ${res.new_trends ?? res.trends?.length ?? 0} tendencias evaluadas`)
      await s.loadRadarTrends()
    } catch (err) {
      s.toast('err', `Error al escanear radar: ${err.message}`)
    } finally {
      s.radar.isScanning = false
    }
  },

  async updateRadarTrendStatus(id, status) {
    const s = this || store
    try {
      await api.updateRadarTrendStatus(id, status)
      const trend = s.radar.trends.find(t => t.id === id)
      if (trend) trend.status = status
      if (s.radar.selected && s.radar.selected.id === id) {
        s.radar.selected.status = status
      }
      s.toast('ok', `Estado de tendencia actualizado: ${status}`)
    } catch (err) {
      s.toast('err', `Error al actualizar tendencia: ${err.message}`)
    }
  },

  async generateFromRadarTrend(id, payload = {}) {
    const s = this || store
    if (s.radar.generatingId) return
    s.radar.generatingId = id
    s.radar.isGenerating = true
    try {
      const res = await api.generateFromRadarTrend(id, payload)
      s.toast('ok', 'Publicación técnica omnicanal generada exitosamente desde tendencia')
      await s.loadRadarTrends()
      await s.loadContentPosts()
      s.section = 'content'
      if (res?.post) {
        s.content.selected = s.content.posts.find(p => p.id === res.post.id) || res.post
      }
      return res
    } catch (err) {
      s.toast('err', `Error al generar contenido desde tendencia: ${err.message}`)
      throw err
    } finally {
      s.radar.generatingId = null
      s.radar.isGenerating = false
    }
  },

  /** Lo que queda en el navegador al cerrar la sesión: nada del editor ni de la cola de vacantes. */
  clearSession() {
    api.setToken('')
    this.token = ''
    this.tokenInput = ''
    this.clearForm()
    this.hunter.jobs = []
    this.hunter.selected = null
    this.counts.hunter = 0
    clearCachedJobs()
  },

  logout() {
    this.clearSession()
    this.toast('ok', 'Sesión cerrada correctamente')
  },
})

// Blindaje de métodos contra invocaciones desvinculadas de this (callbacks de eventos o event handlers)
for (const key of Object.keys(store)) {
  if (typeof store[key] === 'function') {
    store[key] = store[key].bind(store)
  }
}

// Deslogueo unificado y limpio ante respuesta 401 de la API
api.setOnAuthError(() => {
  store.clearSession()
  store.toast('err', AUTH_MESSAGE)
})

