/* global Vue */
// Portfolio CMS · Admin Console
// Conecta con /api/admin/* usando el ADMIN_TOKEN guardado en sessionStorage.

// Safeguard: Interceptar confirm(), alert() y prompt() nativos para que nunca congelen la UI
window.confirm = (msg) => {
  console.warn('[Admin Security Safeguard] Native window.confirm() interceptado:', msg)
  return false
}
window.alert = (msg) => {
  console.warn('[Admin Security Safeguard] Native window.alert() interceptado:', msg)
  if (window.__adminApp && window.__adminApp.say) {
    window.__adminApp.say('err', String(msg))
  }
}
window.prompt = (msg) => {
  console.warn('[Admin Security Safeguard] Native window.prompt() interceptado:', msg)
  return null
}

const { createApp } = Vue

const F = (name, type, label, hint, placeholder) => ({
  name,
  type,
  label: label || name,
  hint: hint || '',
  placeholder: placeholder || '',
})

const toLocalDatetime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const toDateOnly = iso => (iso ? String(iso).slice(0, 10) : '')

function slugify(text) {
  if (!text) return ''
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

const ICONS = {
  dashboard: '<svg class="adm-icon" viewBox="0 0 24 24"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>',
  projects: '<svg class="adm-icon" viewBox="0 0 24 24"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>',
  experience: '<svg class="adm-icon" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="7" rx="2" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  stack: '<svg class="adm-icon" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  orgs: '<svg class="adm-icon" viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/><path d="M14 9h1"/><path d="M14 13h1"/><path d="M14 17h1"/></svg>',
  docs: '<svg class="adm-icon" viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>',
  hunter: '<svg class="adm-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>',
}

const MODELS = {
  projects: {
    label: 'Proyectos',
    singular: 'Proyecto',
    icon: ICONS.projects,
    path: 'projects',
    name: r => r.title || '(Sin título)',
    meta: r => `${r.year} · ${r.status}${r.featured ? ' · Destacado' : ''}`,
    fields: [
      F('slug', 'string', 'Identificador web (Slug)', 'Parte de la URL pública. Usá minúsculas y guiones.', 'mi-nuevo-proyecto'),
      F('title', 'string', 'Título del proyecto', 'Nombre visible del proyecto o caso de estudio.', 'Plataforma Interactiva'),
      F('year', 'int', 'Año de realización', 'Año en el que se desarrolló el trabajo.', '2026'),
      F('role', 'string', 'Rol desempeñado', 'Puesto o responsabilidad principal en el proyecto.', 'Lead Developer & Designer'),
      F('status', 'enum:ProjectStatus', 'Estado de producción', 'En Vivo (visible), En Desarrollo o Archivado.'),
      F('featured', 'bool', 'Destacar en portada', 'Muestra este proyecto en los primeros lugares destacados del sitio.'),
      F('sortOrder', 'int', 'Prioridad de orden', 'Número menor aparece primero (0 es máxima prioridad).', '0'),
      F('publishedAt', 'datetime', 'Fecha de publicación', 'Fecha formal de lanzamiento.'),
      F('summary', 'text', 'Síntesis ejecutiva (1 a 2 líneas)', 'Descripción corta que aparece en las tarjetas de presentación.', 'Diseño y desarrollo de una experiencia inmersiva...'),
      F('brief', 'text', 'El Reto / Desafío', 'Explicá el problema que el cliente o proyecto necesitaba resolver.', 'El cliente requería una solución de alta velocidad...'),
      F('outcome', 'text', 'El Resultado / Impacto', 'Qué se logró, beneficios medibles y aprendizajes obtenidos.', 'Se logró un aumento del 40% en retención...'),
      F('url', 'url', 'Sitio web online', 'Enlace público para visitar el proyecto funcionando.', 'https://ejemplo.com'),
      F('repo', 'url', 'Repositorio de código (GitHub)', 'Enlace opcional al código fuente en GitHub.', 'https://github.com/...'),
      F('orgId', 'rel:orgs', 'Empresa / Cliente', 'Seleccioná la empresa u organización asociada (opcional).'),
      F('techIds', 'rels:techs', 'Tecnologías utilizadas', 'Seleccioná las herramientas que forman parte del stack.'),
      F('metrics', 'json', 'Métricas de impacto', 'Datos cuantificables como velocidad, rendimiento o usuarios.'),
    ],
    sub: {
      links: [
        F('label', 'string', 'Etiqueta', '', 'Demo en vivo'),
        F('url', 'string', 'Enlace URL', '', 'https://...'),
      ],
      steps: [
        F('order', 'int', 'Orden', '', '1'),
        F('title', 'string', 'Título del paso', '', '01 · Investigación inicial'),
        F('body', 'text', 'Descripción detallada', '', 'Explicación del proceso de diseño...'),
        F('mediaId', 'rel:media', 'Imagen asociada', ''),
      ],
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
      metrics: f.metrics && typeof f.metrics === 'string' && f.metrics.trim() !== '' ? f.metrics : null,
      media: undefined,
    }),
  },

  experience: {
    label: 'Experiencia Laboral',
    singular: 'Experiencia',
    icon: ICONS.experience,
    path: 'experience',
    name: r => (r.org ? `${r.role} · ${r.org.name}` : r.role),
    meta: r => `${toDateOnly(r.startedAt)} → ${r.endedAt ? toDateOnly(r.endedAt) : 'Actualidad'}`,
    fields: [
      F('slug', 'string', 'Identificador web (Slug)', 'Identificador único en minúsculas.', 'frontend-lead'),
      F('role', 'string', 'Cargo o Posición', 'Título de tu puesto de trabajo.', 'Senior Frontend Engineer'),
      F('startedAt', 'date', 'Fecha de inicio', 'Cuándo comenzaste en esta etapa.'),
      F('endedAt', 'date', 'Fecha de finalización', 'Dejar vacío si es tu posición actual.'),
      F('orgId', 'rel:orgs', 'Empresa u Organización', 'Empresa en la que desempeñaste el rol.'),
      F('techIds', 'rels:techs', 'Tecnologías utilizadas', 'Herramientas principales de esta experiencia.'),
      F('summary', 'text', 'Síntesis de desempeño (1 línea)', 'Descripción concisa de tu aporte.', 'Liderazgo técnico en desarrollo de interfaces web...'),
      F('story', 'text', 'Historia y aprendizajes', 'Relato más amplio de retos, responsabilidades y logros.', 'Durante este período lideré un equipo de...'),
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
    label: 'Habilidades & Stack',
    singular: 'Tecnología',
    icon: ICONS.stack,
    path: 'techs',
    name: r => r.name,
    meta: r => `${r.category} · Desde ${r.since}${r._count ? ` · ${r._count.projects} proyectos` : ''}`,
    fields: [
      F('slug', 'string', 'Identificador web (Slug)', 'Ej: vue, typescript, tailwind.', 'vue'),
      F('name', 'string', 'Nombre de la tecnología', 'Nombre visible oficial.', 'Vue.js'),
      F('category', 'enum:TechCategory', 'Categoría técnica', 'Área o tipo de herramienta.'),
      F('since', 'int', 'Año de inicio', 'Año en el que empezaste a utilizarla profesionalmente.', '2022'),
      F('note', 'string', 'Criterio técnico de uso', 'Cuándo o por qué la elegís para un proyecto.', 'La utilizo para crear interfaces altamente reactivas y modulares.'),
      F('color', 'string', 'Color de acento (HEX)', 'Color de contraste en formato hexadecimal (ej: #42b883).', '#42b883'),
    ],
    toForm: r => ({ ...r }),
    blank: () => ({ slug: '', name: '', category: 'FRAMEWORK', since: new Date().getFullYear(), note: '', color: '' }),
    toPayload: f => f,
  },

  orgs: {
    label: 'Empresas & Clientes',
    singular: 'Empresa',
    icon: ICONS.orgs,
    path: 'orgs',
    name: r => r.name,
    meta: r => (r._count ? `${r._count.projects} proyectos · ${r._count.experiences} exp.` : ''),
    fields: [
      F('slug', 'string', 'Identificador web (Slug)', 'Ej: acme-corp.', 'acme-corp'),
      F('name', 'string', 'Nombre de la organización', 'Nombre legal o comercial de la empresa.', 'Acme Studio'),
      F('url', 'url', 'Sitio web corporativo', 'Dirección URL oficial.', 'https://acme.com'),
      F('city', 'string', 'Ciudad o País', 'Ubicación geográfica de la sede o cliente.', 'Buenos Aires, Argentina'),
    ],
    toForm: r => ({ ...r }),
    blank: () => ({ slug: '', name: '', url: '', city: '' }),
    toPayload: f => f,
  },

  docs: {
    label: 'Páginas & Textos',
    singular: 'Documento',
    icon: ICONS.docs,
    path: 'docs',
    idKey: 'key',
    name: r => (r.key === 'about' ? 'Sobre Mí (About)' : r.key === 'contact' ? 'Contacto (Contact)' : r.key),
    meta: r => `${Array.isArray(r.fields) ? r.fields.length : 0} bloques de contenido`,
    fields: [
      F('key', 'string', 'Clave del documento', 'Clave del sistema (about, contact).', 'about'),
      F('title', 'string', 'Título de la página', 'Título principal que encabeza la sección.', 'Sobre Mí'),
    ],
    sub: {
      fields: [
        F('name', 'string', 'Identificador del bloque', '', 'bio'),
        F('type', 'string', 'Tipo de campo', '', 'text'),
        F('value', 'text', 'Contenido del texto', '', 'Texto largo o biografía...'),
        F('wide', 'bool', 'Ancho completo (Destacado)', ''),
      ],
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
    saveUrl: f => `docs/${encodeURIComponent(f.key)}`,
    saveMethod: () => 'PUT',
  },
}

createApp({
  data: () => ({
    models: MODELS,
    icons: ICONS,
    token: sessionStorage.getItem('admin-token') || '',
    tokenInput: '',
    passwordVisible: false,
    section: 'dashboard',
    meta: { enums: {}, options: { orgs: [], techs: [], projects: [] } },
    rows: [],
    current: null,
    form: null,
    isNew: false,
    error: '',
    status: { kind: '', text: '' },
    uploadForm: { alt: '', role: 'GALLERY', layer: null, order: 0 },
    searchQuery: '',
    projectStatusFilter: 'all',
    techSearchQuery: '',
    isSaving: false,
    counts: { projects: 0, experience: 0, stack: 0, orgs: 0, docs: 0 },
    activeTab: 'general',

    // Auto-Slug, Presets y Productividad
    slugLocked: true,
    initialFormSnapshot: null,
    importingGitHub: false,
    metricPresets: [
      { label: 'Lighthouse (99/100)', key: 'Lighthouse', value: '99/100' },
      { label: 'Bundle Size (< 45 kB)', key: 'Bundle Size', value: '< 45 kB' },
      { label: 'Latencia API (< 80 ms)', key: 'Latencia API', value: '< 80 ms' },
      { label: 'Commits (350+)', key: 'Commits', value: '350+' },
      { label: 'Test Coverage (98%)', key: 'Test Coverage', value: '98%' },
      { label: 'Uptime (99.99%)', key: 'Uptime', value: '99.99%' },
    ],

    // Visual Metrics Editor State
    metricsList: [],
    advancedMetricsMode: false,

    // Modales y Lightbox
    lightboxImage: null,
    showHelpModal: false,
    showCommandPalette: false,
    commandQuery: '',
    copiedPitch: false,

    // Job Hunter Agent State
    hunterJobs: [],
    hunterSelected: null,
    hunterStats: { total: 0, high_match_count: 0, pending_eval_count: 0, applied_count: 0, discarded_count: 0 },
    hunterFilter: 'high',
    hunterIsScanning: false,
    hunterIsPitching: false,
    hunterPitch: null,
    hunterCV: null,
    hunterIsGeneratingCV: false,

    // Dialogo Modal
    dialog: {
      open: false,
      title: '',
      message: '',
      targetName: '',
      detail: '',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      kind: 'danger',
      resolve: null,
    },
  }),

  computed: {
    isDirty() {
      if (!this.form || !this.initialFormSnapshot) return false
      try {
        return JSON.stringify(this.form) !== this.initialFormSnapshot
      } catch {
        return false
      }
    },

    model() {
      return this.models[this.section] || {}
    },

    filteredRows() {
      if (!this.model || !this.model.name) return []
      let list = this.rows || []

      if (this.section === 'projects' && this.projectStatusFilter !== 'all') {
        if (this.projectStatusFilter === 'featured') {
          list = list.filter(r => r.featured)
        } else {
          list = list.filter(r => (r.status || '').toLowerCase() === this.projectStatusFilter)
        }
      }

      if (!this.searchQuery.trim()) return list
      const q = this.searchQuery.toLowerCase().trim()
      return list.filter(r => {
        const name = (this.model.name(r) || '').toLowerCase()
        const meta = (this.model.meta ? this.model.meta(r) : '').toLowerCase()
        const slug = String(r.slug || r.key || r.id || '').toLowerCase()
        const role = String(r.role || '').toLowerCase()
        return name.includes(q) || meta.includes(q) || slug.includes(q) || role.includes(q)
      })
    },

    filteredHunterJobs() {
      let list = this.hunterJobs || []
      if (this.hunterFilter === 'high') {
        list = list.filter(j => (j.match_score || 0) >= 70 && j.status !== 'discarded')
      } else if (this.hunterFilter === 'applied') {
        list = list.filter(j => j.status === 'applied')
      } else if (this.hunterFilter === 'discarded') {
        list = list.filter(j => j.status === 'discarded')
      } else if (this.hunterFilter === 'saved') {
        list = list.filter(j => j.status === 'saved')
      }
      if (!this.searchQuery.trim()) return list
      const q = this.searchQuery.toLowerCase().trim()
      return list.filter(j => {
        const title = (j.title || '').toLowerCase()
        const company = (j.company || '').toLowerCase()
        const source = (j.source || '').toLowerCase()
        const tags = (j.tags || []).join(' ').toLowerCase()
        return title.includes(q) || company.includes(q) || source.includes(q) || tags.includes(q)
      })
    },

    filteredAvailableTechs() {
      const all = this.meta.options.techs || []
      if (!this.techSearchQuery.trim()) return all
      const q = this.techSearchQuery.toLowerCase().trim()
      return all.filter(t => (t.name || '').toLowerCase().includes(q))
    },

    hunterSelectedAnalysis() {
      if (!this.hunterSelected || !this.hunterSelected.match_analysis) return null
      try {
        return JSON.parse(this.hunterSelected.match_analysis)
      } catch {
        return null
      }
    },

    activePitch() {
      if (this.hunterPitch) return this.hunterPitch
      if (this.hunterSelected && this.hunterSelected.pitch_draft) {
        try {
          return JSON.parse(this.hunterSelected.pitch_draft)
        } catch {
          return { elevator_pitch: this.hunterSelected.pitch_draft }
        }
      }
      return null
    },

    currentPitchSubject() {
      return this.activePitch ? (this.activePitch.subject_or_hook || '') : ''
    },

    currentPitchBody() {
      if (!this.activePitch) return ''
      const parts = []
      if (this.activePitch.elevator_pitch) {
        parts.push(this.activePitch.elevator_pitch)
      }
      if (this.activePitch.cover_letter) {
        parts.push('\n--- CARTA DE PRESENTACIÓN EXTENDIDA ---\n' + this.activePitch.cover_letter)
      }
      return parts.join('\n\n')
    },

    currentTailoredCV() {
      if (this.hunterCV && this.hunterCV.data) return this.hunterCV.data
      if (this.hunterSelected && this.hunterSelected.tailored_cv) {
        try {
          return JSON.parse(this.hunterSelected.tailored_cv)
        } catch {
          return null
        }
      }
      return null
    },

    currentCVPlainText() {
      const cv = this.currentTailoredCV
      if (!cv) return ''
      const lines = []
      lines.push(`${cv.name || 'Mateo Gabus Sonzogni'}`)
      lines.push(`${cv.title || ''} | ${cv.location || ''}`)
      lines.push('\n=== PROFESSIONAL SUMMARY ===')
      lines.push(cv.summary || '')
      lines.push('\n=== TECHNICAL SKILLS ===')
      for (const [cat, items] of Object.entries(cv.skills || {})) {
        lines.push(`${cat}: ${(items || []).join(', ')}`)
      }
      lines.push('\n=== FEATURED PROJECTS & EXPERIENCE ===')
      for (const exp of (cv.experience || [])) {
        lines.push(`\n${exp.title} — ${exp.role} (${exp.period}) [${exp.location}]`)
        for (const b of (exp.bullets || [])) {
          lines.push(`• ${b}`)
        }
        if (exp.tech_stack && exp.tech_stack.length) {
          lines.push(`  Technologies: ${exp.tech_stack.join(', ')}`)
        }
      }
      lines.push('\n=== EDUCATION ===')
      for (const ed of (cv.education || [])) {
        lines.push(`${ed.institution} — ${ed.degree} (${ed.period})`)
        if (ed.details) lines.push(`  ${ed.details}`)
      }
      return lines.join('\n')
    },

    isLocalhost() {
      return typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
    },

    dashboardStats() {
      const projects = this.meta.options.projects || []
      const techs = this.meta.options.techs || []
      const orgs = this.meta.options.orgs || []
      return {
        totalProjects: projects.length,
        totalTechs: techs.length,
        totalOrgs: orgs.length,
        totalExperience: this.counts.experience || 0,
        highMatchJobs: this.hunterStats.high_match_count || 0,
        totalJobs: this.hunterJobs.length || 0,
      }
    },

    tabs() {
      if (!this.model || !this.form || !this.model.fields) return []
      const list = []
      const genCount = this.model.fields.filter(f => f.type !== 'text' && f.type !== 'json').length
      list.push({ id: 'general', label: 'Datos Básicos', count: genCount })

      const textFields = this.model.fields.filter(f => f.type === 'text')
      if (textFields.length) {
        list.push({ id: 'narrative', label: 'Historia y Textos', count: textFields.length })
      }
      if (this.model.media && !this.isNew) {
        list.push({ id: 'media', label: 'Galería Multimedia', count: (this.form.media || []).length })
      }
      if (this.model.sub && Object.keys(this.model.sub).length) {
        const subCount = Object.keys(this.model.sub).reduce((acc, k) => acc + (this.form[k] ? this.form[k].length : 0), 0)
        list.push({ id: 'sub', label: 'Enlaces y Pasos', count: subCount })
      }
      if (this.model.fields.some(f => f.type === 'json')) {
        list.push({ id: 'telemetry', label: 'Métricas de Impacto', count: this.metricsList.length || null })
      }
      return list
    },
  },

  created() {
    if (this.token) {
      this.initAdmin()
    }
  },

  mounted() {
    window.__adminApp = this
    window.addEventListener('keydown', this.handleKeydown)
    this._beforeUnloadHandler = (e) => {
      if (this.isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', this._beforeUnloadHandler)
  },

  beforeUnmount() {
    if (window.__adminApp === this) window.__adminApp = null
    window.removeEventListener('keydown', this.handleKeydown)
    if (this._beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this._beforeUnloadHandler)
    }
  },

  methods: {
    handleKeydown(e) {
      if (this.dialog.open) {
        if (e.key === 'Escape') {
          e.preventDefault()
          this.onDialogCancel()
          return
        }
        if (e.key === 'Enter') {
          e.preventDefault()
          this.onDialogConfirm()
          return
        }
      }
      if (this.showHelpModal || this.lightboxImage || this.showCommandPalette) {
        if (e.key === 'Escape') {
          this.showHelpModal = false
          this.lightboxImage = null
          this.showCommandPalette = false
          return
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        this.showCommandPalette = !this.showCommandPalette
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (this.form && !this.isSaving) {
          this.save()
        }
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        if (this.section !== 'dashboard' && this.section !== 'hunter') {
          this.createRecord()
        }
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        if (this.form || this.current) {
          this.duplicateRecord(this.form || this.current)
        }
        return
      }
      if (e.key === 'Escape' && this.form) {
        e.preventDefault()
        this.cancelEdit()
        return
      }
    },

    askConfirm(options = {}) {
      return new Promise((resolve) => {
        this.dialog = {
          open: true,
          title: options.title || 'Confirmar Acción',
          message: options.message || '¿Confirmás que deseás continuar con esta operación?',
          targetName: options.targetName || '',
          detail: options.detail || '',
          confirmText: options.confirmText || 'Confirmar',
          cancelText: options.cancelText || 'Cancelar',
          kind: options.kind || 'danger',
          resolve,
        }
        this.$nextTick(() => {
          if (this.$refs.dialogConfirmBtn) {
            this.$refs.dialogConfirmBtn.focus()
          }
        })
      })
    },

    onDialogConfirm() {
      if (this.dialog.resolve) this.dialog.resolve(true)
      this.dialog.open = false
      this.dialog.resolve = null
    },

    onDialogCancel() {
      if (this.dialog.resolve) this.dialog.resolve(false)
      this.dialog.open = false
      this.dialog.resolve = null
    },

    async handleLogoutClick() {
      const confirmed = await this.askConfirm({
        title: 'Cerrar Sesión',
        message: '¿Estás seguro de que deseás cerrar la sesión del panel?',
        targetName: 'Sesión activa',
        detail: 'Deberás ingresar tu clave de acceso autorizada para volver a entrar.',
        confirmText: 'Cerrar Sesión',
        cancelText: 'Permanecer Conectado',
        kind: 'warning',
      })
      if (!confirmed) return
      this.logout()
    },

    say(kind, text) {
      this.status = { kind, text }
      clearTimeout(this._t)
      this._t = setTimeout(() => { this.status = { kind: '', text: '' } }, 4000)
    },

    async api(path, init = {}) {
      const headers = { Authorization: `Bearer ${this.token}`, ...(init.headers || {}) }
      if (init.body && !(init.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json'
        init.body = JSON.stringify(init.body)
      }
      try {
        const res = await fetch(`/api/admin/${path}`, { ...init, headers })
        if (res.status === 401) {
          this.logout()
          throw new Error('Clave de acceso inválida o expirada.')
        }
        if (res.status === 204) return null
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(body.error || `Error del servidor (código ${res.status})`)
        }
        return body
      } catch (err) {
        if (err.message && err.message.includes('Failed to fetch')) {
          throw new Error('No se pudo conectar con el servidor API (localhost:3001). Verificá que esté encendido.', { cause: err })
        }
        throw err
      }
    },

    useDevToken() {
      this.tokenInput = 'eYqFZFx0mqFXT6L2hFlTrUvYAfB-4ZU5'
      this.login()
    },

    login() {
      this.token = this.tokenInput.trim()
      sessionStorage.setItem('admin-token', this.token)
      this.tokenInput = ''
      this.initAdmin()
    },

    logout() {
      this.token = ''
      sessionStorage.removeItem('admin-token')
      this.rows = []
      this.form = null
      this.current = null
      this.section = 'dashboard'
    },

    async initAdmin() {
      try {
        const meta = await this.api('meta')
        this.meta = meta
        if (meta.options) {
          if (meta.options.projects) this.counts.projects = meta.options.projects.length
          if (meta.options.techs) this.counts.stack = meta.options.techs.length
          if (meta.options.orgs) this.counts.orgs = meta.options.orgs.length
        }
        const [expRows, docRows] = await Promise.all([
          this.api('experience').catch(() => []),
          this.api('docs').catch(() => []),
        ])
        this.counts.experience = expRows.length
        this.counts.docs = docRows.length

        this.fetchHunterStats()
        this.fetchHunterJobs()
      } catch (e) {
        this.say('err', e.message)
      }
    },

    rowKey(r) {
      return r ? r[this.model.idKey || 'id'] : null
    },

    relOptions(kind) {
      if (kind === 'media') return this.form ? this.form.media : []
      return this.meta.options[kind] || []
    },

    blankRow(cols) {
      const row = {}
      for (const c of cols) {
        row[c.name] = c.type === 'bool' ? false : c.type === 'int' ? null : c.type.startsWith('rel:') ? null : ''
      }
      return row
    },

    suggestSlug() {
      if (!this.form) return
      const base = this.form.title || this.form.name || this.form.role || ''
      if (base) {
        this.form.slug = slugify(base)
        this.say('ok', `Slug generado: ${this.form.slug}`)
      }
    },

    async open(key) {
      if (this.isDirty) {
        const discard = await this.checkDirtyDiscard()
        if (!discard) return
      }
      if (key === 'dashboard') {
        this.section = 'dashboard'
        this.form = null
        this.current = null
        this.initialFormSnapshot = null
        this.initAdmin()
        return
      }
      if (key === 'hunter') {
        this.initialFormSnapshot = null
        return this.openHunter()
      }
      this.section = key
      this.form = null
      this.current = null
      this.initialFormSnapshot = null
      this.error = ''
      this.searchQuery = ''
      this.projectStatusFilter = 'all'
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
      } catch (e) {
        this.say('err', e.message)
      }
    },

    async openHunter() {
      this.section = 'hunter'
      this.form = null
      this.current = null
      this.error = ''
      this.searchQuery = ''
      this.hunterPitch = null
      await Promise.all([
        this.fetchHunterStats(),
        this.fetchHunterJobs(),
      ])
    },

    async fetchHunterStats() {
      try {
        const stats = await this.api('hunter/stats')
        if (stats && typeof stats.total === 'number') {
          this.hunterStats = stats
        }
      } catch (e) {
        console.warn('[Eros Agent] Stats error:', e.message)
      }
    },

    async fetchHunterJobs() {
      try {
        const res = await this.api('hunter/jobs?limit=100')
        const jobs = res && res.data ? res.data : []
        this.hunterJobs = jobs
        if (!this.hunterSelected && jobs.length > 0) {
          this.selectHunterJob(jobs[0])
        } else if (this.hunterSelected) {
          const refreshed = jobs.find(j => j.id === this.hunterSelected.id)
          if (refreshed) this.selectHunterJob(refreshed)
        }
      } catch (e) {
        console.warn('Error cargando vacantes:', e.message)
      }
    },

    selectHunterJob(job) {
      this.hunterSelected = job
      this.hunterPitch = null
      this.hunterCV = null
      if (job && job.pitch_draft) {
        try {
          this.hunterPitch = JSON.parse(job.pitch_draft)
        } catch {
          this.hunterPitch = { elevator_pitch: job.pitch_draft }
        }
      }
      if (job && job.tailored_cv) {
        try {
          this.hunterCV = { data: JSON.parse(job.tailored_cv) }
        } catch {
          this.hunterCV = null
        }
      }
    },

    async triggerHunterScan() {
      this.hunterIsScanning = true
      this.say('ok', 'Escaneando Get on Board, RemoteOK y Hacker News...')
      try {
        const res = await this.api('hunter/scan', { method: 'POST' })
        this.say('ok', `Escaneo finalizado: ${res.new_jobs || 0} nuevas ofertas detectadas`)
        await this.fetchHunterStats()
        await this.fetchHunterJobs()
      } catch (e) {
        this.say('err', `Error en escaneo: ${e.message}`)
      } finally {
        this.hunterIsScanning = false
      }
    },

    async generateHunterPitch(jobId) {
      this.hunterIsPitching = true
      this.say('ok', 'Gemini está analizando la vacante y redactando la propuesta...')
      try {
        const res = await this.api(`hunter/pitch/${jobId}`, { method: 'POST' })
        if (res && res.data) {
          this.hunterPitch = res.data
          if (this.hunterSelected && this.hunterSelected.id === jobId) {
            this.hunterSelected.pitch_draft = JSON.stringify(res.data)
          }
          this.say('ok', 'Propuesta redactada con éxito')
          await this.fetchHunterJobs()
        }
      } catch (e) {
        this.say('err', `Error generando propuesta: ${e.message}`)
      } finally {
        this.hunterIsPitching = false
      }
    },

    async generateHunterCV(jobId) {
      this.hunterIsGeneratingCV = true
      this.say('ok', 'Gemini está adaptando el CV al estándar Harvard ATS para esta vacante...')
      try {
        const res = await this.api(`hunter/cv/${jobId}`, { method: 'POST' })
        if (res && res.data) {
          this.hunterCV = res
          if (this.hunterSelected && this.hunterSelected.id === jobId) {
            this.hunterSelected.tailored_cv = JSON.stringify(res.data)
          }
          this.say('ok', 'CV adaptado Harvard ATS generado con éxito')
          await this.fetchHunterJobs()
        }
      } catch (e) {
        this.say('err', `Error generando CV: ${e.message}`)
      } finally {
        this.hunterIsGeneratingCV = false
      }
    },

    async openCVPrintWindow(jobId) {
      this.say('ok', 'Preparando documento de impresión A4...')
      try {
        const res = await fetch(`/api/admin/hunter/cv/${jobId}/html`, {
          headers: { Authorization: `Bearer ${this.token}` },
        })
        if (!res.ok) throw new Error('No se pudo obtener el documento HTML del CV')
        const html = await res.text()
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.open()
          printWindow.document.write(html)
          printWindow.document.close()
        } else {
          this.say('err', 'El navegador bloqueó la ventana emergente. Habilitá popups para imprimir.')
        }
      } catch (e) {
        this.say('err', `Error al abrir vista de impresión: ${e.message}`)
      }
    },

    async copyCVTextToClipboard() {
      const text = this.currentCVPlainText
      if (!text) return
      try {
        await navigator.clipboard.writeText(text)
        this.say('ok', 'CV en texto plano ATS copiado al portapapeles')
      } catch {
        this.say('err', 'No se pudo copiar el CV al portapapeles')
      }
    },

    async updateHunterJobStatus(jobId, status) {
      try {
        await this.api(`hunter/jobs/${jobId}/status`, {
          method: 'PATCH',
          body: { status },
        })
        if (this.hunterSelected && this.hunterSelected.id === jobId) {
          this.hunterSelected.status = status
        }
        const target = this.hunterJobs.find(j => j.id === jobId)
        if (target) target.status = status
        await this.fetchHunterStats()
        this.say('ok', `Estado actualizado a "${status}"`)
      } catch (e) {
        this.say('err', `Error actualizando estado: ${e.message}`)
      }
    },

    async copyPitchToClipboard() {
      const text = this.currentPitchBody
      if (!text) return
      try {
        await navigator.clipboard.writeText(text)
        this.copiedPitch = true
        this.say('ok', 'Propuesta copiada al portapapeles')
        setTimeout(() => { this.copiedPitch = false }, 2500)
      } catch {
        this.say('err', 'No se pudo copiar automáticamente')
      }
    },

    getScoreClass(score) {
      if (score == null) return 'score-low'
      if (score >= 80) return 'score-fire'
      if (score >= 65) return 'score-good'
      if (score >= 40) return 'score-mid'
      return 'score-low'
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

    async checkDirtyDiscard() {
      if (!this.isDirty) return true
      const targetName = this.form ? (this.model?.name ? this.model.name(this.form) : this.form.title || this.form.name || this.form.slug || '') : ''
      return await this.askConfirm({
        title: 'Cambios Sin Guardar',
        message: 'Tenés cambios sin guardar en el formulario actual.',
        targetName: targetName ? `[${this.model?.label || 'Registro'}] ${targetName}` : '',
        detail: 'Si continuás sin guardar, todas las modificaciones pendientes se perderán.',
        confirmText: 'Descartar Cambios',
        cancelText: 'Seguir Editando',
        kind: 'warning',
      })
    },

    async edit(r) {
      if (this.isDirty && this.current && this.current.id !== r.id) {
        const discard = await this.checkDirtyDiscard()
        if (!discard) return
      }
      this.current = r
      this.isNew = false
      this.slugLocked = false
      this.error = ''
      this.activeTab = 'general'
      this.techSearchQuery = ''
      this.advancedMetricsMode = false
      this.form = this.model.toForm(JSON.parse(JSON.stringify(r)))
      this.initMetricsList()
      this.initialFormSnapshot = JSON.stringify(this.form)
    },

    async startNew() {
      if (this.isDirty) {
        const discard = await this.checkDirtyDiscard()
        if (!discard) return
      }
      this.current = null
      this.isNew = true
      this.slugLocked = true
      this.error = ''
      this.activeTab = 'general'
      this.techSearchQuery = ''
      this.advancedMetricsMode = false
      this.form = this.model.blank()
      if (this.section === 'projects' && Array.isArray(this.rows) && this.rows.length > 0) {
        const maxOrder = this.rows.reduce((m, r) => Math.max(m, Number(r.sortOrder) || 0), 0)
        this.form.sortOrder = maxOrder + 1
      }
      this.initMetricsList()
      this.initialFormSnapshot = JSON.stringify(this.form)
    },

    async cancelEdit() {
      if (this.isDirty) {
        const discard = await this.checkDirtyDiscard()
        if (!discard) return
      }
      if (this.current) {
        this.isNew = false
        this.slugLocked = false
        this.form = this.model.toForm(JSON.parse(JSON.stringify(this.current)))
        this.initMetricsList()
        this.initialFormSnapshot = JSON.stringify(this.form)
      } else {
        this.form = null
        this.initialFormSnapshot = null
      }
    },

    // ─── Visual Metrics Key-Value Editor ──────────────────────────────────────
    initMetricsList() {
      this.metricsList = []
      if (!this.form || !this.form.metrics) return
      try {
        let obj = this.form.metrics
        if (typeof obj === 'string') {
          obj = JSON.parse(obj)
        }
        if (obj && typeof obj === 'object') {
          this.metricsList = Object.entries(obj).map(([key, value]) => ({
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          }))
        }
      } catch {
        this.metricsList = []
      }
    },

    addMetricRow() {
      this.metricsList.push({ key: '', value: '' })
      this.syncMetricsFromList()
    },

    removeMetricRow(index) {
      this.metricsList.splice(index, 1)
      this.syncMetricsFromList()
    },

    syncMetricsFromList() {
      if (!this.form) return
      const obj = {}
      for (const item of this.metricsList) {
        const k = item.key.trim()
        if (k) {
          obj[k] = item.value
        }
      }
      this.form.metrics = Object.keys(obj).length > 0 ? JSON.stringify(obj, null, 2) : ''
    },

    toggleAdvancedMetrics() {
      this.advancedMetricsMode = !this.advancedMetricsMode
      if (!this.advancedMetricsMode) {
        this.initMetricsList()
      }
    },

    // ─── Tecnologías Chips ────────────────────────────────────────────────────
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

    // ─── Guardar y Eliminar ───────────────────────────────────────────────────
    async save() {
      this.error = ''
      this.isSaving = true

      if (!this.advancedMetricsMode) {
        this.syncMetricsFromList()
      }

      const m = this.model
      const payload = m.toPayload({ ...this.form })
      const url = m.saveUrl ? m.saveUrl(this.form) : this.isNew ? m.path : `${m.path}/${this.rowKey(this.current)}`
      const method = m.saveMethod ? m.saveMethod(this.isNew) : this.isNew ? 'POST' : 'PUT'

      try {
        const saved = await this.api(url, { method, body: payload })
        this.say('ok', this.isNew ? 'Registro creado exitosamente' : 'Cambios guardados con éxito')
        this.initialFormSnapshot = JSON.stringify(this.form)
        this.slugLocked = false
        await this.reload(saved ? saved[m.idKey || 'id'] : null)
      } catch (e) {
        this.error = e.message
        this.say('err', `Error al guardar: ${e.message}`)
      } finally {
        this.isSaving = false
      }
    },

    async remove() {
      const name = this.model.name(this.current)
      const confirmed = await this.askConfirm({
        title: 'Eliminar Registro',
        message: `¿Estás seguro de que deseás eliminar permanentemente "${name}"?`,
        targetName: `[${this.model.label}] ${name}`,
        detail: 'Esta acción borrará el registro de la base de datos de forma irreversible.',
        confirmText: 'Eliminar Registro',
        cancelText: 'Cancelar',
        kind: 'danger',
      })
      if (!confirmed) return
      try {
        await this.api(`${this.model.path}/${this.rowKey(this.current)}`, { method: 'DELETE' })
        this.say('ok', 'Registro eliminado correctamente')
        this.form = null
        this.current = null
        await this.reload()
      } catch (e) {
        this.error = e.message
        this.say('err', `Error al eliminar: ${e.message}`)
      }
    },

    // ─── Multimedia ──────────────────────────────────────────────────────────
    openLightbox(src) {
      this.lightboxImage = src
    },

    closeLightbox() {
      this.lightboxImage = null
    },

    async uploadMedia() {
      const input = this.$refs.fileInput || this.$refs.file
      const file = input && input.files && input.files[0]
      if (!file) {
        this.say('err', 'Por favor seleccioná una imagen para subir')
        return
      }
      const fd = new FormData()
      fd.append('file', file)
      fd.append('projectId', String(this.current.id))
      fd.append('alt', this.uploadForm.alt || file.name)
      fd.append('role', this.uploadForm.role || 'GALLERY')
      if (this.uploadForm.layer != null && this.uploadForm.layer !== '') {
        fd.append('layer', String(this.uploadForm.layer))
      }
      fd.append('order', String(this.uploadForm.order || 0))

      try {
        await this.api('media', { method: 'POST', body: fd })
        this.say('ok', 'Imagen subida exitosamente')
        input.value = ''
        this.uploadForm = { alt: '', role: 'GALLERY', layer: null, order: 0 }
        await this.reload(this.current.id)
      } catch (e) {
        this.error = e.message
        this.say('err', `Error al subir imagen: ${e.message}`)
      }
    },

    async saveMedia(m) {
      try {
        await this.api(`media/${m.id}`, {
          method: 'PUT',
          body: {
            alt: m.alt,
            role: m.role,
            layer: m.layer === '' ? null : m.layer,
            order: m.order || 0,
          },
        })
        this.say('ok', 'Datos de imagen actualizados')
      } catch (e) {
        this.error = e.message
        this.say('err', `Error al actualizar imagen: ${e.message}`)
      }
    },

    async deleteMedia(mediaOrId) {
      const m = typeof mediaOrId === 'object' && mediaOrId ? mediaOrId : (this.form?.media || []).find(item => item.id === mediaOrId)
      if (!m) return
      const confirmed = await this.askConfirm({
        title: 'Eliminar Imagen',
        message: '¿Estás seguro de que deseás eliminar este archivo multimedia?',
        targetName: m.alt || m.url || m.src,
        detail: 'La imagen será desvinculada del proyecto y borrada del servidor.',
        confirmText: 'Borrar Imagen',
        cancelText: 'Cancelar',
        kind: 'danger',
      })
      if (!confirmed) return
      try {
        await this.api(`media/${m.id}`, { method: 'DELETE' })
        this.say('ok', 'Imagen eliminada')
        await this.reload(this.current.id)
      } catch (e) {
        this.error = e.message
        this.say('err', `Error al borrar imagen: ${e.message}`)
      }
    },

    // ─── Aliases & Helpers para la Nueva Interfaz 2026 ───────────────────────
    createRecord() {
      this.startNew()
    },

    selectRow(r) {
      this.edit(r)
    },

    saveCurrent() {
      this.save()
    },

    handleDeleteClick() {
      this.remove()
    },

    onTitleInput() {
      if (!this.form) return
      if (this.slugLocked) {
        const base = this.form.title || this.form.name || this.form.role || ''
        if (base) {
          this.form.slug = slugify(base)
        }
      }
    },

    toggleSlugLock() {
      this.slugLocked = !this.slugLocked
      if (this.slugLocked && this.form) {
        const base = this.form.title || this.form.name || this.form.role || ''
        if (base) {
          this.form.slug = slugify(base)
          this.say('ok', `Slug sincronizado automáticamente: "${this.form.slug}"`)
        }
      } else {
        this.say('ok', 'Edición manual de slug desbloqueada.')
      }
    },

    setPublishedNow() {
      if (!this.form) return
      this.form.publishedAt = toLocalDatetime(new Date().toISOString())
      this.say('ok', 'Fecha de publicación actualizada a la hora actual')
    },

    clearPublishedAt() {
      if (!this.form) return
      this.form.publishedAt = ''
    },

    addMetricPreset(preset) {
      if (!this.metricsList) this.metricsList = []
      const existing = this.metricsList.find(m => m.key.toLowerCase().trim() === preset.key.toLowerCase().trim())
      if (existing) {
        existing.value = preset.value
      } else {
        this.metricsList.push({ key: preset.key, value: preset.value })
      }
      this.syncMetricsFromList()
      this.say('ok', `Métrica añadida: "${preset.label || preset.key}"`)
    },

    async duplicateRecord(record) {
      if (this.isDirty) {
        const discard = await this.checkDirtyDiscard()
        if (!discard) return
      }
      const source = record || this.current || this.form
      if (!source) {
        this.say('warn', 'No hay ningún registro seleccionado para duplicar.')
        return
      }
      const clone = JSON.parse(JSON.stringify(source))
      delete clone.id
      delete clone.createdAt
      delete clone.updatedAt
      if (clone.title) clone.title = `${clone.title} (Copia)`
      if (clone.name) clone.name = `${clone.name} (Copia)`
      if (clone.role && !clone.title) clone.role = `${clone.role} (Copia)`
      if (clone.slug) clone.slug = `${clone.slug}-copia`
      this.current = null
      this.isNew = true
      this.slugLocked = false
      this.activeTab = 'general'
      this.form = this.model.toForm ? this.model.toForm(clone) : clone
      this.initMetricsList()
      this.initialFormSnapshot = JSON.stringify(this.form)
      this.say('ok', `Registro duplicado: "${this.form.title || this.form.name || this.form.role}". Ajustá los campos y guardá.`)
    },

    async quickToggleProjectStatus(p, event) {
      if (event) event.stopPropagation()
      const nextStatus = p.status === 'LIVE' ? 'WIP' : 'LIVE'
      const prevStatus = p.status
      p.status = nextStatus
      try {
        await this.api(`projects/${p.id}`, {
          method: 'PATCH',
          body: { status: nextStatus },
        })
        if (this.form && this.form.id === p.id) {
          this.form.status = nextStatus
          if (this.initialFormSnapshot) {
            try {
              const snap = JSON.parse(this.initialFormSnapshot)
              snap.status = nextStatus
              this.initialFormSnapshot = JSON.stringify(snap)
            } catch {
              // ignore snapshot parse error
            }
          }
        }
        this.say('ok', `"${p.title}" ahora está en estado ${nextStatus}`)
      } catch (err) {
        p.status = prevStatus
        this.say('err', `Error al cambiar estado: ${err.message}`)
      }
    },

    async quickToggleProjectFeatured(p, event) {
      if (event) event.stopPropagation()
      const nextFeatured = !p.featured
      p.featured = nextFeatured
      try {
        await this.api(`projects/${p.id}`, {
          method: 'PATCH',
          body: { featured: nextFeatured },
        })
        if (this.form && this.form.id === p.id) {
          this.form.featured = nextFeatured
          if (this.initialFormSnapshot) {
            try {
              const snap = JSON.parse(this.initialFormSnapshot)
              snap.featured = nextFeatured
              this.initialFormSnapshot = JSON.stringify(snap)
            } catch {
              // ignore snapshot parse error
            }
          }
        }
        this.say('ok', nextFeatured ? `"${p.title}" destacado ★` : `"${p.title}" quitado de destacados`)
      } catch (err) {
        p.featured = !nextFeatured
        this.say('err', `Error al cambiar destacado: ${err.message}`)
      }
    },

    async importFromGitHub() {
      if (!this.form) return
      const repoUrl = (this.form.repo || '').trim()
      if (!repoUrl) {
        this.say('warn', 'Ingresá primero la URL del repositorio GitHub en el campo correspondiente (ej: https://github.com/usuario/repo).')
        return
      }
      const match = repoUrl.match(/(?:github\.com\/|^)([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/|\.git)?$/)
      if (!match) {
        this.say('warn', 'Formato de URL de GitHub no reconocido. Usá https://github.com/usuario/proyecto')
        return
      }
      const owner = match[1]
      const repoName = match[2].replace(/\.git$/, '')
      this.importingGitHub = true
      try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}`)
        if (!res.ok) {
          throw new Error(`GitHub respondió con código ${res.status}. Verificá que el repositorio sea público.`)
        }
        const data = await res.json()
        if (!this.form.title) {
          this.form.title = repoName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }
        if (this.slugLocked || !this.form.slug) {
          this.form.slug = slugify(this.form.title || repoName)
        }
        if (!this.form.summary && data.description) {
          this.form.summary = data.description
        }
        if (!this.form.url && data.homepage) {
          this.form.url = data.homepage
        }
        if (!this.form.role) {
          this.form.role = 'Lead Developer & Creator'
        }
        if (data.stargazers_count > 0) {
          this.addMetricPreset({ label: 'GitHub Stars', key: 'GitHub Stars', value: `${data.stargazers_count} ★` })
        }
        this.say('ok', `Datos importados de GitHub (${owner}/${repoName}): ${data.stargazers_count || 0} ★`)
      } catch (err) {
        this.say('err', `Error importando de GitHub: ${err.message}`)
      } finally {
        this.importingGitHub = false
      }
    },

    addSubRow(key) {
      if (!this.form[key]) this.form[key] = []
      const cols = (this.model.sub && this.model.sub[key]) || []
      this.form[key].push(this.blankRow(cols))
    },

    removeSubRow(key, index) {
      if (this.form && this.form[key]) {
        this.form[key].splice(index, 1)
      }
    },

    addMetricVisual() {
      this.addMetricRow()
    },

    removeMetricVisual(idx) {
      this.removeMetricRow(idx)
    },

    syncVisualMetricsToJson() {
      this.syncMetricsFromList()
    },

    scanHunterJobs() {
      this.triggerHunterScan()
    },

    generatePitch() {
      if (this.hunterSelected) this.generateHunterPitch(this.hunterSelected.id)
    },

    generateTailoredCV() {
      if (this.hunterSelected) this.generateHunterCV(this.hunterSelected.id)
    },

    downloadTailoredCVHtml() {
      if (this.hunterSelected) this.openCVPrintWindow(this.hunterSelected.id)
    },

    copyTailoredCVText() {
      this.copyCVTextToClipboard()
    },

    copyPitch() {
      this.copyPitchToClipboard()
    },

    setJobStatus(status) {
      if (this.hunterSelected) this.updateHunterJobStatus(this.hunterSelected.id, status)
    },

    async updateMediaRole(mediaId, role) {
      const m = (this.form?.media || []).find(item => item.id === mediaId)
      if (!m) return
      m.role = role
      await this.saveMedia(m)
    },
  },
}).mount('#app')
