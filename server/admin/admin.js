/* global Vue */
// Admin propio. Un descriptor por modelo; el formulario se genera de ahí.
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

const MODELS = {
  projects: {
    label: 'projects',
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
    path: 'experience',
    name: r => `${r.org ? r.org.name : '?'} · ${r.role}`,
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
    path: 'docs',
    idKey: 'key',
    name: r => r.key,
    meta: r => `${Array.isArray(r.fields) ? r.fields.length : 0} fields`,
    fields: [F('key', 'string'), F('title', 'string')],
    sub: {
      fields: [F('name', 'string'), F('type', 'string'), F('value', 'text'), F('wide', 'bool'), F('worlds', 'worlds')],
    },
    toForm: r => ({
      ...r,
      fields: (r.fields || []).map(f => ({ ...f, wide: !!f.wide, worlds: (f.worlds || []).join(',') })),
    }),
    blank: () => ({ key: '', title: '', fields: [] }),
    toPayload: f => ({
      title: f.title,
      fields: f.fields.map(x => ({
        ...x,
        worlds: x.worlds ? x.worlds.split(',').map(s => s.trim()).filter(Boolean) : [],
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
    meta: { enums: {}, options: {} },
    rows: [],
    current: null,
    form: null,
    isNew: false,
    error: '',
    status: { kind: '', text: '' },
    uploadForm: { alt: '', role: 'GALLERY', layer: null, order: 0 },
  }),
  computed: {
    model() { return this.models[this.section] },
  },
  created() {
    if (this.token) this.open(this.section)
  },
  methods: {
    say(kind, text) {
      this.status = { kind, text }
      clearTimeout(this._t)
      this._t = setTimeout(() => { this.status = { kind: '', text: '' } }, 3000)
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
        throw new Error('token inválido')
      }
      if (res.status === 204) return null
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
      return body
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
    },
    rowKey(r) { return r[this.model.idKey || 'id'] },
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
      try {
        const [meta, rows] = await Promise.all([this.api('meta'), this.api(this.model.path)])
        this.meta = meta
        this.rows = rows
      }
      catch (e) {
        this.say('err', e.message)
      }
    },
    async reload(keepKey) {
      this.rows = await this.api(this.model.path)
      this.meta = await this.api('meta')
      if (keepKey != null) {
        const row = this.rows.find(r => this.rowKey(r) === keepKey)
        if (row) this.edit(row)
      }
    },
    edit(r) {
      this.current = r
      this.isNew = false
      this.error = ''
      this.form = this.model.toForm(JSON.parse(JSON.stringify(r)))
    },
    startNew() {
      this.current = null
      this.isNew = true
      this.error = ''
      this.form = this.model.blank()
    },
    async save() {
      this.error = ''
      const m = this.model
      const payload = m.toPayload({ ...this.form })
      const url = m.saveUrl ? m.saveUrl(this.form) : this.isNew ? m.path : `${m.path}/${this.rowKey(this.current)}`
      const method = m.saveMethod ? m.saveMethod(this.isNew) : this.isNew ? 'POST' : 'PUT'
      try {
        const saved = await this.api(url, { method, body: payload })
        this.say('ok', this.isNew ? 'creado' : 'guardado')
        await this.reload(saved ? saved[m.idKey || 'id'] : null)
      }
      catch (e) {
        this.error = e.message
      }
    },
    async remove() {
      if (!confirm(`¿Borrar "${this.model.name(this.current)}"? No se puede deshacer.`)) return
      try {
        await this.api(`${this.model.path}/${this.rowKey(this.current)}`, { method: 'DELETE' })
        this.say('ok', 'borrado')
        this.form = null
        await this.reload()
      }
      catch (e) {
        this.error = e.message
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
        this.say('ok', 'subido')
        input.value = ''
        this.uploadForm = { alt: '', role: 'GALLERY', layer: null, order: 0 }
        await this.reload(this.current.id)
      }
      catch (e) {
        this.error = e.message
      }
    },
    async saveMedia(m) {
      try {
        await this.api(`media/${m.id}`, { method: 'PUT', body: { alt: m.alt, role: m.role, layer: m.layer === '' ? null : m.layer, order: m.order || 0 } })
        this.say('ok', 'media guardada')
      }
      catch (e) {
        this.error = e.message
      }
    },
    async deleteMedia(m) {
      if (!confirm(`¿Borrar ${m.src}? También se borra el archivo.`)) return
      try {
        await this.api(`media/${m.id}`, { method: 'DELETE' })
        this.say('ok', 'media borrada')
        await this.reload(this.current.id)
      }
      catch (e) {
        this.error = e.message
      }
    },
  },
}).mount('#app')
