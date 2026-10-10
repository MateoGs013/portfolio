// Portfolio CMS 2026 · Configuración, Modelos y Constantes
// Arquitectura Modular de Administración

export const toLocalDatetime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const toDateOnly = (iso) => (iso ? String(iso).slice(0, 10) : '')

export function slugify(text) {
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

export const ICONS = {
  dashboard: `<svg class="adm-icon" viewBox="0 0 24 24"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
  projects: `<svg class="adm-icon" viewBox="0 0 24 24"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
  experience: `<svg class="adm-icon" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="7" rx="2" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  stack: `<svg class="adm-icon" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  orgs: `<svg class="adm-icon" viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/><path d="M14 9h1"/><path d="M14 13h1"/><path d="M14 17h1"/></svg>`,
  docs: `<svg class="adm-icon" viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  hunter: `<svg class="adm-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>`,
  search: `<svg class="adm-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  plus: `<svg class="adm-icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  trash: `<svg class="adm-icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
  external: `<svg class="adm-icon" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  eye: `<svg class="adm-icon" viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg class="adm-icon" viewBox="0 0 24 24"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`,
  lock: `<svg class="adm-icon" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  unlock: `<svg class="adm-icon" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`,
  copy: `<svg class="adm-icon" viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
  check: `<svg class="adm-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  close: `<svg class="adm-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  chevronRight: `<svg class="adm-icon" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>`,
  chevronDown: `<svg class="adm-icon" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>`,
  refresh: `<svg class="adm-icon" viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>`,
  menu: `<svg class="adm-icon" viewBox="0 0 24 24"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,
}

export const METRIC_PRESETS = [
  { key: 'Lighthouse', value: '100/100 Perf', label: 'Lighthouse Score' },
  { key: 'Bundle Size', value: '< 45 kB gzip', label: 'Bundle Size' },
  { key: 'Deploy SLA', value: '< 25s Nitro', label: 'Deploy Speed' },
  { key: 'Tests Passing', value: '100% Cobertura', label: 'Tests Passing' },
  { key: 'Commits', value: '450+ en Prod', label: 'Volumen Commits' },
  { key: 'Uptime', value: '99.98% Coolify', label: 'Uptime VPS' },
]

export const TECH_CATEGORY_MAP = {
  FRONTEND: 'Frontend & UI',
  BACKEND: 'Backend & APIs',
  DATABASE: 'Bases de Datos & ORM',
  DEVOPS: 'Cloud, Docker & VPS',
  TOOLING: 'Herramientas & Bundlers',
  LANGUAGE: 'Lenguajes de Programación',
  OTHER: 'Otras Herramientas',
}

export const MODELS = {
  projects: {
    label: 'Proyectos',
    singular: 'Proyecto',
    icon: ICONS.projects,
    path: 'projects',
    name: r => r.title || '(Sin título)',
    meta: r => `${r.year} · ${r.status}${r.featured ? ' · Destacado' : ''}`,
    toForm: r => ({
      ...r,
      publishedAt: toLocalDatetime(r.publishedAt),
      metrics: r.metrics == null ? '' : (typeof r.metrics === 'string' ? r.metrics : JSON.stringify(r.metrics, null, 2)),
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
    toForm: r => ({ ...r }),
    blank: () => ({ slug: '', name: '', category: 'FRONTEND', since: new Date().getFullYear(), note: '', color: '' }),
    toPayload: f => f,
  },

  orgs: {
    label: 'Empresas & Clientes',
    singular: 'Empresa',
    icon: ICONS.orgs,
    path: 'orgs',
    name: r => r.name,
    meta: r => (r._count ? `${r._count.projects} proyectos · ${r._count.experiences} exp.` : ''),
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
    toForm: r => ({
      ...r,
      fields: (r.fields || []).map(f => ({ ...f, wide: !!f.wide })),
    }),
    blank: () => ({ key: '', title: '', fields: [] }),
    toPayload: f => ({
      title: f.title,
      fields: (f.fields || []).map(x => ({ ...x, worlds: ['datos'] })),
    }),
    saveUrl: f => `docs/${encodeURIComponent(f.key)}`,
    saveMethod: () => 'PUT',
  },
}
