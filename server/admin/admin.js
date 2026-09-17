/* global Vue */
// Admin Console // Sistema Operativo de Gestión de Datos
// Habla con /api/admin/* con el ADMIN_TOKEN guardado en sessionStorage.

const { createApp } = Vue

const F = (name, type) => ({ name, type })

const toLocalDatetime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const toDateOnly = iso => (iso ? String(iso).slice(0, 10) : '')

const ICONS = {
  projects: '<svg class="adm-icon" viewBox="0 0 24 24"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>',
  experience: '<svg class="adm-icon" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  stack: '<svg class="adm-icon" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  orgs: '<svg class="adm-icon" viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/><path d="M14 9h1"/><path d="M14 13h1"/><path d="M14 17h1"/></svg>',
  docs: '<svg class="adm-icon" viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>',
}

const MODELS = {
  projects: {
    label: 'projects',
    icon: ICONS.projects,
    path: 'projects',
    name: r => r.title || '(sin título)',
    meta: r => `${r.year} · ${r.status}${r.featured ? ' · featured' : ''}`,
    fields: [
      F('slug', 'string'), F('title', 'string'), F('year', 'int'), F('role', 'string'),
      F('status', 'enum:ProjectStatus'), F('featured', 'bool'), F('sortOrder', 'int'), F('publishedAt', 'datetime'),
      F('summary', 'text'), F('brief', 'text'), F('outcome', 'text'),
      F('url', 'url'), F('repo', 'url'), F('orgId', 'rel:orgs'), F('techIds', 'rels:techs'), F('metrics', 'json'),
    ],
    sub: {
      links: [F('label', 'string'), F('url', 'string')],
      steps: [F('order', 'int'), F('title', 'string'), F('body', 'text'), F('mediaId', 'rel:media')],
    },
    media: true,
    toForm: r => ({
      ...r,
      publishedAt: toLocalDatetime(r.publishedAt),
      metrics: r.metrics == null ? '' : JSON.stringify(r.metrics, null, 2),
      orgId: r.orgId ?? null,
      techIds: (r.techs || []).map(t => t.id),
      links: (r.links || []).map(({ label, url }) => ({ label, url })),
      steps: (r.steps || []).map(({ order, title, body, mediaId }) => ({ order, title, body, mediaId: mediaId ?? null })),
      media: r.media || [],
    }),
    blank: () => ({
      slug: '', title: '', year: new Date().getFullYear(), role: '', status: 'WIP', featured: false, sortOrder: 0,
      publishedAt: '', summary: '', brief: '', outcome: '', url: '', repo: '', orgId: null, techIds: [], metrics: '',
      links: [], steps: [], media: [],
    }),
    toPayload: f => ({
      ...f,
      publishedAt: f.publishedAt ? new Date(f.publishedAt).toISOString() : null,
      metrics: f.metrics.trim() === '' ? null : f.metrics,
      media: undefined,
    }),
  },

  experience: {
    label: 'experience',
    icon: ICONS.experience,
    path: 'experience',
    name: r => (r.org ? `${r.role} · ${r.org.name}` : r.role),
    meta: r => `${toDateOnly(r.startedAt)} → ${r.endedAt ? toDateOnly(r.endedAt) : 'actual'}`,
    fields: [
      F('slug', 'string'), F('role', 'string'), F('startedAt', 'date'), F('endedAt', 'date'),
      F('orgId', 'rel:orgs'), F('techIds', 'rels:techs'), F('summary', 'text'), F('story', 'text'),
    ],
    toForm: r => ({
      ...r,
      startedAt: toDateOnly(r.startedAt),
      endedAt: toDateOnly(r.endedAt),
      techIds: (r.techs || []).map(t => t.id),
    }),
    blank: () => ({ slug: '', role: '', startedAt: '', endedAt: '', orgId: null, techIds: [], summary: '', story: '' }),
    toPayload: f => ({ ...f, endedAt: f.endedAt || null }),
  },

  stack: {
    label: 'stack',
    icon: ICONS.stack,
    path: 'techs',
    name: r => r.name,
    meta: r => `${r.category} · desde ${r.since}${r._count ? ` · ${r._count.projects} projects` : ''}`,
    fields: [F('slug', 'string'), F('name', 'string'), F('category', 'enum:TechCategory'), F('since', 'int'), F('note', 'string'), F('color', 'string')],
    toForm: r => ({ ...r }),
    blank: () => ({ slug: '', name: '', category: 'FRAMEWORK', since: new Date().getFullYear(), note: '', color: '' }),
    toPayload: f => f,
  },

  orgs: {
    label: 'orgs',
    icon: ICONS.orgs,
    path: 'orgs',
    name: r => r.name,
    meta: r => (r._count ? `${r._count.projects} projects · ${r._count.experiences} experience` : ''),
    fields: [F('slug', 'string'), F('name', 'string'), F('url', 'url'), F('city', 'string')],
    toForm: r => ({ ...r }),
    blank: () => ({ slug: '', name: '', url: '', city: '' }),
    toPayload: f => f,
  },

  docs: {
    label: 'docs',
    icon: ICONS.docs,
    path: 'docs',
    idKey: 'key',
    name: r => r.key,
    meta: r => `${Array.isArray(r.fields) ? r.fields.length : 0} fields`,
    fields: [F('key', 'string'), F('title', 'string')],
    sub: {
      fields: [F('name', 'string'), F('type', 'string'), F('value', 'text'), F('wide', 'bool')],
    },
    toForm: r => ({
      ...r,
      fields: (r.fields || []).map(f => ({ ...f, wide: !!f.wide })),
    }),
    blank: () => ({ key: '', title: '', fields: [] }),
    toPayload: f => ({
      title: f.title,
      fields: f.fields.map(x => ({
        ...x,
        worlds: ['datos'],
      })),
    }),
    // Los docs se guardan siempre por clave (upsert).
    saveUrl: f => `docs/${encodeURIComponent(f.key)}`,
    saveMethod: () => 'PUT',
  },
}

createApp({
  data: () => ({
    models: MODELS,
    token: sessionStorage.getItem('admin-token') || '',
    tokenInput: '',
    section: 'projects',
    meta: { enums: {}, options: { orgs: [], techs: [], projects: [] } },
    rows: [],
    current: null,
    form: null,
    isNew: false,
    error: '',
    status: { kind: '', text: '' },
    uploadForm: { alt: '', role: 'GALLERY', layer: null, order: 0 },
    searchQuery: '',
    isSaving: false,
    counts: { projects: 0, experience: 0, stack: 0, orgs: 0, docs: 0 },
    activeTab: 'general',
  }),
  computed: {
    model() { return this.models[this.section] },
    filteredRows() {
      if (!this.searchQuery.trim()) return this.rows
      const q = this.searchQuery.toLowerCase().trim()
      return this.rows.filter(r => {
        const name = (this.model.name(r) || '').toLowerCase()
        const meta = (this.model.meta ? this.model.meta(r) : '').toLowerCase()
        const slug = String(r.slug || r.key || r.id || '').toLowerCase()
        return name.includes(q) || meta.includes(q) || slug.includes(q)
      })
    },
    canonicalFilePath() {
      if (!this.form) return `file://portfolio/admin/${this.section}`
      const id = this.rowKey(this.form) || (this.isNew ? 'nuevo' : 'item')
      return `file://portfolio/${this.section}/${id}.ts`
    },
    availableTechs() {
      return this.meta.options.techs || []
    },
    tabs() {
      if (!this.model || !this.form) return []
      const list = []
      const genCount = this.model.fields.filter(f => f.type !== 'text' && f.type !== 'json').length
      list.push({ id: 'general', label: '01 · General', count: genCount })

      const textFields = this.model.fields.filter(f => f.type === 'text')
      if (textFields.length) {
        list.push({ id: 'narrative', label: '02 · Narrativa', count: textFields.length })
      }
      if (this.model.media && !this.isNew) {
        list.push({ id: 'media', label: '03 · Multimedia', count: (this.form.media || []).length })
      }
      if (this.model.sub && Object.keys(this.model.sub).length) {
        const subCount = Object.keys(this.model.sub).reduce((acc, k) => acc + (this.form[k] ? this.form[k].length : 0), 0)
        list.push({ id: 'sub', label: '04 · Sub-tablas', count: subCount })
      }
      if (this.model.fields.some(f => f.type === 'json')) {
        list.push({ id: 'telemetry', label: '05 · Telemetría JSON', count: null })
      }
      return list
    },
  },
  created() {
    if (this.token) this.open(this.section)
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown)
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    handleKeydown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (this.form && !this.isSaving) {
          this.save()
        }
      }
    },
    say(kind, text) {
      this.status = { kind, text }
      clearTimeout(this._t)
      this._t = setTimeout(() => { this.status = { kind: '', text: '' } }, 3500)
    },
    async api(path, init = {}) {
      const headers = { Authorization: `Bearer ${this.token}`, ...(init.headers || {}) }
      if (init.body && !(init.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json'
        init.body = JSON.stringify(init.body)
      }
      const res = await fetch(`/api/admin/${path}`, { ...init, headers })
      if (res.status === 401) {
        this.logout()
        throw new Error('token inválido o expirado')
      }
      if (res.status === 204) return null
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
      return body
    },
    useDevToken() {
      this.tokenInput = 'eYqFZFx0mqFXT6L2hFlTrUvYAfB-4ZU5'
      this.login()
    },
    login() {
      this.token = this.tokenInput.trim()
      sessionStorage.setItem('admin-token', this.token)
      this.tokenInput = ''
      this.open(this.section)
    },
    logout() {
      this.token = ''
      sessionStorage.removeItem('admin-token')
      this.rows = []
      this.form = null
      this.current = null
    },
    rowKey(r) { return r ? r[this.model.idKey || 'id'] : null },
    relOptions(kind) {
      if (kind === 'media') return this.form ? this.form.media : []
      return this.meta.options[kind] || []
    },
    blankRow(cols) {
      const row = {}
      for (const c of cols) row[c.name] = c.type === 'bool' ? false : c.type === 'int' ? null : c.type.startsWith('rel:') ? null : ''
      return row
    },
    async open(key) {
      this.section = key
      this.form = null
      this.current = null
      this.error = ''
      this.searchQuery = ''
      try {
        const [meta, rows] = await Promise.all([this.api('meta'), this.api(this.model.path)])
        this.meta = meta
        this.rows = rows
        this.counts[key] = rows.length
        if (meta.options) {
          if (meta.options.projects) this.counts.projects = meta.options.projects.length
          if (meta.options.techs) this.counts.stack = meta.options.techs.length
          if (meta.options.orgs) this.counts.orgs = meta.options.orgs.length
        }
      }
      catch (e) {
        this.say('err', e.message)
      }
    },
    async reload(keepKey) {
      this.rows = await this.api(this.model.path)
      this.meta = await this.api('meta')
      this.counts[this.section] = this.rows.length
      if (keepKey != null) {
        const row = this.rows.find(r => this.rowKey(r) === keepKey)
        if (row) this.edit(row)
      }
    },
    edit(r) {
      this.current = r
      this.isNew = false
      this.error = ''
      this.activeTab = 'general'
      this.form = this.model.toForm(JSON.parse(JSON.stringify(r)))
    },
    startNew() {
      this.current = null
      this.isNew = true
      this.error = ''
      this.activeTab = 'general'
      this.form = this.model.blank()
    },
    cancelEdit() {
      if (this.current) {
        this.edit(this.current)
      } else {
        this.form = null
      }
    },
    toggleTech(techId) {
      if (!this.form) return
      if (!Array.isArray(this.form.techIds)) this.form.techIds = []
      const idx = this.form.techIds.indexOf(techId)
      if (idx === -1) {
        this.form.techIds.push(techId)
      } else {
        this.form.techIds.splice(idx, 1)
      }
    },
    isTechSelected(techId) {
      return Array.isArray(this.form?.techIds) && this.form.techIds.includes(techId)
    },
    formatMetricsJson() {
      if (!this.form || !this.form.metrics) return
      try {
        const parsed = typeof this.form.metrics === 'string' ? JSON.parse(this.form.metrics) : this.form.metrics
        this.form.metrics = JSON.stringify(parsed, null, 2)
        this.say('ok', 'JSON formateado correctamente')
      } catch {
        this.say('err', 'Sintaxis JSON inválida')
      }
    },
    async save() {
      this.error = ''
      this.isSaving = true
      const m = this.model
      const payload = m.toPayload({ ...this.form })
      const url = m.saveUrl ? m.saveUrl(this.form) : this.isNew ? m.path : `${m.path}/${this.rowKey(this.current)}`
      const method = m.saveMethod ? m.saveMethod(this.isNew) : this.isNew ? 'POST' : 'PUT'
      try {
        const saved = await this.api(url, { method, body: payload })
        this.say('ok', this.isNew ? 'Registro creado en base de datos' : 'Cambios guardados en PostgreSQL')
        await this.reload(saved ? saved[m.idKey || 'id'] : null)
      }
      catch (e) {
        this.error = e.message
        this.say('err', `Error: ${e.message}`)
      }
      finally {
        this.isSaving = false
      }
    },
    async remove() {
      const name = this.model.name(this.current)
      if (!confirm(`¿Confirmás borrar "${name}" de la base de datos? Esta acción es irreversible.`)) return
      try {
        await this.api(`${this.model.path}/${this.rowKey(this.current)}`, { method: 'DELETE' })
        this.say('ok', 'Registro eliminado')
        this.form = null
        this.current = null
        await this.reload()
      }
      catch (e) {
        this.error = e.message
        this.say('err', `Error: ${e.message}`)
      }
    },
    async uploadMedia() {
      const input = this.$refs.file
      const file = input && input.files && input.files[0]
      if (!file) return
      const fd = new FormData()
      fd.append('file', file)
      fd.append('projectId', String(this.current.id))
      fd.append('alt', this.uploadForm.alt)
      fd.append('role', this.uploadForm.role)
      if (this.uploadForm.layer != null && this.uploadForm.layer !== '') fd.append('layer', String(this.uploadForm.layer))
      fd.append('order', String(this.uploadForm.order || 0))
      try {
        await this.api('media', { method: 'POST', body: fd })
        this.say('ok', 'Pieza multimedia subida con éxito')
        input.value = ''
        this.uploadForm = { alt: '', role: 'GALLERY', layer: null, order: 0 }
        await this.reload(this.current.id)
      }
      catch (e) {
        this.error = e.message
        this.say('err', `Error: ${e.message}`)
      }
    },
    async saveMedia(m) {
      try {
        await this.api(`media/${m.id}`, { method: 'PUT', body: { alt: m.alt, role: m.role, layer: m.layer === '' ? null : m.layer, order: m.order || 0 } })
        this.say('ok', 'Metadatos de media guardados')
      }
      catch (e) {
        this.error = e.message
        this.say('err', `Error: ${e.message}`)
      }
    },
    async deleteMedia(m) {
      if (!confirm(`¿Borrar imagen ${m.src}? También se eliminará el archivo del servidor.`)) return
      try {
        await this.api(`media/${m.id}`, { method: 'DELETE' })
        this.say('ok', 'Imagen eliminada')
        await this.reload(this.current.id)
      }
      catch (e) {
        this.error = e.message
        this.say('err', `Error: ${e.message}`)
      }
    },
  },
}).mount('#app')
