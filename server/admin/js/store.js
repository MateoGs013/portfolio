// Portfolio CMS 2026 · Estado Reactivo Compartido (Vue 3 Store)
// Manejo centralizado de datos, navegación, dirty tracking y modales

import { api } from './api.js'
import { MODELS } from './config.js'

const { reactive } = window.Vue

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
  isNew: false,
  isDirty: false,
  initialSnapshot: null,
  slugLocked: true,
  activeTab: 'general',

  // Metadatos relacionales
  meta: {
    enums: { ProjectStatus: [], TechCategory: [], MediaKind: [], MediaRole: [] },
    options: { orgs: [], techs: [], projects: [] },
  },
  allTechs: [],
  counts: {
    projects: 0,
    experience: 0,
    stack: 0,
    orgs: 0,
    docs: 0,
    hunter: 0,
  },

  // Job Hunter & Reclutamiento IA
  hunter: {
    jobs: [],
    filter: 'high',
    selected: null,
    isScanning: false,
    isPitching: false,
    isGeneratingCV: false,
    copiedPitch: false,
    copiedCV: false,
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
  metricsList: [],
  advancedMetricsMode: false,

  // ─── ACCIONES DE TOAST & MENSAJES ─────────────────────────────────────────
  toast(kind, text, timeout = 3600) {
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
      const [projs, exps, stks, orgs, dcs, jbs] = await Promise.all([
        api.getCollection('projects').catch(() => []),
        api.getCollection('experience').catch(() => []),
        api.getCollection('techs').catch(() => []),
        api.getCollection('orgs').catch(() => []),
        api.getCollection('docs').catch(() => []),
        api.getHunterJobs().catch(() => []),
      ])
      this.counts.projects = projs.length
      this.counts.experience = exps.length
      this.counts.stack = stks.length
      this.counts.orgs = orgs.length
      this.counts.docs = dcs.length
      this.counts.hunter = jbs.length
    } catch (err) {
      console.warn('Error al calcular conteos:', err)
    }
  },

  async loadSection(sec, preserveDirtyCheck = true) {
    if (preserveDirtyCheck && this.isDirty) {
      const proceed = await this.checkDirtyDiscard(() => this.loadSection(sec, false))
      if (!proceed) return
    }

    this.section = sec
    this.searchQuery = ''
    this.filter = 'all'
    this.activeTab = 'general'

    if (sec === 'dashboard') {
      this.current = null
      this.form = null
      this.isNew = false
      this.isDirty = false
      await this.refreshCounts()
      return
    }

    if (sec === 'hunter') {
      this.current = null
      this.form = null
      this.isNew = false
      this.isDirty = false
      await this.loadHunterJobs()
      return
    }

    const model = MODELS[sec]
    if (!model) return

    try {
      const rows = await api.getCollection(model.path)
      this.rows = rows || []
      this.counts[sec] = this.rows.length

      if (this.rows.length > 0) {
        this.selectRecord(this.rows[0])
      } else {
        this.createRecord()
      }
    } catch (err) {
      this.toast('err', `Error al cargar ${model.label}: ${err.message}`)
    }
  },

  selectRecord(row) {
    const model = MODELS[this.section]
    if (!model) return
    this.current = row
    this.isNew = false
    this.form = model.toForm(JSON.parse(JSON.stringify(row)))
    this.slugLocked = true
    this.markClean(this.form)
    this.initMetricsFromForm()
  },

  createRecord() {
    const model = MODELS[this.section]
    if (!model) return
    this.current = null
    this.isNew = true
    this.form = model.blank()
    this.slugLocked = true
    this.markClean(this.form)
    this.initMetricsFromForm()
  },

  initMetricsFromForm() {
    if (this.section !== 'projects' || !this.form) {
      this.metricsList = []
      this.advancedMetricsMode = false
      return
    }
    const raw = this.form.metrics
    if (!raw) {
      this.metricsList = []
      this.advancedMetricsMode = false
      return
    }
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        this.metricsList = Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) }))
        this.advancedMetricsMode = false
      } else {
        this.advancedMetricsMode = true
      }
    } catch {
      this.advancedMetricsMode = true
    }
  },

  syncMetricsToJson() {
    if (!this.form || this.advancedMetricsMode) return
    const valid = this.metricsList.filter(m => (m.key || '').trim())
    if (valid.length === 0) {
      this.form.metrics = ''
    } else {
      const obj = {}
      for (const m of valid) {
        obj[m.key.trim()] = (m.value || '').trim()
      }
      this.form.metrics = JSON.stringify(obj, null, 2)
    }
    this.checkDirty()
  },

  // ─── OPERACIONES DE JOB HUNTER ────────────────────────────────────────────
  async loadHunterJobs() {
    try {
      const jobs = await api.getHunterJobs()
      this.hunter.jobs = jobs || []
      this.counts.hunter = this.hunter.jobs.length
      if (this.hunter.jobs.length > 0 && !this.hunter.selected) {
        this.hunter.selected = this.hunter.jobs[0]
      }
    } catch (err) {
      this.toast('err', `Error al cargar vacantes: ${err.message}`)
    }
  },

  async scanHunterJobs() {
    if (this.hunter.isScanning) return
    this.hunter.isScanning = true
    try {
      const res = await api.scanHunterJobs()
      this.toast('ok', `Escaneo finalizado: ${res.new_jobs || 0} nuevas ofertas detectadas`)
      await this.loadHunterJobs()
    } catch (err) {
      this.toast('err', `Error al escanear ofertas: ${err.message}`)
    } finally {
      this.hunter.isScanning = false
    }
  },
})
