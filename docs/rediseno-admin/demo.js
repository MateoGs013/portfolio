// Demo del admin nuevo: rutas por hash, explorador, editor por secciones, paleta Ctrl/⌘K y guardado.
// Todo el contenido sale de window.DEMO (snapshot real); las vacantes de abajo son ficticias.
const D = window.DEMO
const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

const SITUACION = { LIVE: ['En línea', 'ok'], WIP: ['En desarrollo', 'wip'], ARCHIVED: ['Archivada', ''] }
const KIND = { THESIS: 'Tesis', CLIENT: 'Cliente', PERSONAL: 'Proyecto propio', FREELANCE: 'Freelance', EDUCATION: 'Formación', JOB: 'Empleo' }
const CATEGORIA = { FRAMEWORK: 'Framework', LANGUAGE: 'Lenguaje', BACKEND: 'Backend', DATABASE: 'Base de datos', MOTION: 'Movimiento', TOOLING: 'Herramientas', INFRA: 'Infraestructura', AI: 'IA', DESIGN: 'Diseño' }
const METRIC = { performanceScore: 'Rendimiento', accessibilityScore: 'Accesibilidad', bestPracticesScore: 'Buenas prácticas', seoScore: 'SEO', lcp: 'LCP', bundleKb: 'Peso del bundle', languages: 'Idiomas', commits: 'Commits', localModels: 'Modelos locales' }
const BLOCKS = {
  name: 'Nombre completo', display_name: 'Nombre visible', role: 'Rol', headline: 'Titular del inicio', portrait: 'Retrato', portrait_alt: 'Descripción del retrato',
  technical_degree: 'Título técnico', higher_education: 'Formación superior', freelance_experience: 'Experiencia freelance', work_modalities: 'Modalidades',
  languages: 'Idiomas', core_competencies: 'Metodología', engineering_philosophy: 'Filosofía', professional_goal: 'Hacia dónde voy',
  email: 'Email', github: 'GitHub', linkedin: 'LinkedIn', website: 'Sitio web', cv: 'PDF del CV', availability: 'Disponibilidad', response_time: 'Tiempo de respuesta',
  location: 'Ubicación', time_zone: 'Zona horaria', preferred_contact: 'Contacto preferido',
}
const FIXED = new Set(['name', 'display_name', 'role', 'headline', 'portrait', 'portrait_alt', 'email', 'cv', 'availability', 'location', 'time_zone', 'languages', 'engineering_philosophy', 'professional_goal'])
const doc = key => D.docs.find(d => d.key === key)
const docVal = (key, name) => doc(key)?.fields.find(f => f.name === name)?.value
const sortedExp = () => [...D.experience].sort((a, b) => (a.cvOrder ?? 99) - (b.cvOrder ?? 99))

const JOBS = [
  { id: 'v1', role: 'Frontend Engineer (Vue y Nuxt)', company: 'Halcyon SaaS', place: 'Remoto, LATAM', match: 86, verdict: 'Muy compatible', tone: 'ok', fresh: true, lang: 'en',
    strengths: ['Vue 3 y Nuxt en producción para clientes reales (La Rúcula, ARG Piscinas)', 'Motion con GSAP y Lenis, que piden como diferencial', 'TypeScript estricto en cliente y servidor'],
    gaps: ['Piden 3 años en un equipo de producto; tu experiencia es freelance y tesis', 'Mencionan Storybook, que no figura en tu stack'] },
  { id: 'v2', role: 'Full Stack Developer', company: 'Lumen Fintech', place: 'Remoto', match: 78, verdict: 'Compatible', tone: 'ok', fresh: true, lang: 'es',
    strengths: ['Express, Prisma y PostgreSQL de punta a punta', 'Paneles internos con roles (barberpole)'], gaps: ['Piden experiencia en pagos'] },
  { id: 'v3', role: 'Creative Developer', company: 'Prism Studio', place: 'Híbrido, Barcelona', match: 71, verdict: 'Compatible', tone: 'ok', fresh: false, lang: 'es',
    strengths: ['Dirección de arte y motion propios'], gaps: ['Piden WebGL avanzado', 'Híbrido en Barcelona'] },
  { id: 'v4', role: 'Desarrollador Web SSr', company: 'Andes Nearshore', place: 'Remoto', match: 58, verdict: 'Dudosa', tone: 'wip', fresh: false, lang: 'es',
    strengths: ['Stack Vue'], gaps: ['Piden Angular y .NET'] },
  { id: 'v5', role: 'Senior Backend (Go)', company: 'Meridian Digital', place: 'Presencial', match: 32, verdict: 'Descartar', tone: '', fresh: false, lang: 'en',
    strengths: [], gaps: ['Go y Kubernetes, fuera de tu stack', 'Seniority 6+ años'] },
]
const EROS_SUMMARY = 'Desarrollador full stack con foco en front end: Vue 3 y Nuxt en producción para clientes reales, motion con GSAP y Lenis, y APIs en Express con PostgreSQL. Diseño y construyo el producto entero, de Figma al deploy.'

// Estado de la demo
const state = { lang: 'es', dirty: false, filter: 'todas', cvSummary: 'base' }

/* ── Navegación ───────────────────────────────────────────── */
const NAV = {
  navMain: [['inicio', 'Inicio', null], ['obras', 'Obras', D.projects.length], ['trayectoria', 'Trayectoria', D.experience.length], ['articulos', 'Artículos', D.articles.length], ['perfil', 'Perfil', null]],
  navCat: [['tecnologias', 'Tecnologías', D.stack.length], ['empresas', 'Empresas', D.orgs.length]],
  navJobs: [['busqueda', 'Vacantes', JOBS.filter(j => j.fresh).length + ' nuevas'], ['publicaciones', 'Publicaciones', 3], ['tendencias', 'Tendencias', null]],
}
const firstOf = {
  obras: () => '#/obras', trayectoria: () => '#/trayectoria', articulos: () => '#/articulos',
  perfil: () => '#/perfil/sobre-mi', busqueda: () => '#/busqueda', inicio: () => '#/inicio', tecnologias: () => '#/tecnologias', empresas: () => '#/empresas',
  publicaciones: () => '#/publicaciones', tendencias: () => '#/tendencias',
}
for (const [id, items] of Object.entries(NAV)) {
  $('#' + id).innerHTML = items.map(([k, label, n]) => `<li><a href="${firstOf[k]()}" data-sec="${k}">${label}${n != null ? `<span class="n">${n}</span>` : ''}</a></li>`).join('')
}
function placeNavInd(sec) {
  const a = $(`.nav a[data-sec="${sec}"]`), ind = $('#navInd')
  if (!a) { ind.style.opacity = 0; return }
  const top = a.getBoundingClientRect().top - $('.nav').getBoundingClientRect().top
  ind.style.opacity = 1
  ind.style.transform = `translateY(${top}px)`
  $$('.nav a').forEach(x => x.toggleAttribute('aria-current', x === a))
}

/* ── Componentes de formulario ────────────────────────────── */
const tr = (es, en, missingLabel) => {
  if (state.lang === 'es') return { v: es, miss: false }
  return { v: en ?? '', miss: !en && !!es, missingLabel }
}
function field({ label, value, en, kind = 'input', help, aux, translatable = true, mono = false, rows, narrow = false }) {
  const same = state.lang === 'en' && !translatable
  const t = translatable ? tr(value, en) : { v: value, miss: false }
  const miss = t.miss ? '<span class="miss"><span class="dot wip"></span>Falta el inglés</span>' : ''
  const sameNote = same && !narrow ? '<span class="aux">Igual en los dos idiomas</span>' : (aux ? `<span class="aux">${aux}</span>` : '')
  const ctl = kind === 'textarea'
    ? `<textarea class="textarea" rows="${rows ?? 3}" ${same ? 'readonly' : ''}>${esc(t.v)}</textarea>`
    : `<input class="input${mono ? ' mono' : ''}" value="${esc(t.v)}" ${same ? 'readonly' : ''}>`
  return `<div class="field${same ? ' same' : ''}"><div class="lab"><label>${label}</label>${miss}${sameNote}</div>${ctl}${help ? `<div class="help">${help}</div>` : ''}</div>`
}
const seg = (opts, cur, attr) => `<div class="seg" style="margin:0">${opts.map(([v, l]) => `<button type="button" ${attr}="${v}" aria-pressed="${v === cur}">${l}</button>`).join('')}</div>`
const sw = (on, label) => `<button type="button" class="switch" role="switch" aria-checked="${on}"><span class="track"></span>${label}</button>`
const fmtDate = s => s ? new Date(s).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
const monthYear = s => s ? new Date(s).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }).replace('.', '') : 'Actualidad'
// La demo se sirve desde la raíz del repo: los archivos del sitio están bajo /public.
const asset = s => s ? '/public' + s : s
const kb = n => n > 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' MB' : Math.round(n / 1000) + ' KB'

function shell({ crumb, title, right = '', tabs = [], tab, body, foot = true, vt = true }) {
  const tabsHtml = tabs.length ? `<div class="tabs" role="tablist">${tabs.map(([k, l, n, href]) => `<a role="tab" href="${href}" aria-selected="${k === tab}" data-tab="${k}">${l}${n != null ? `<span class="n">${n}</span>` : ''}</a>`).join('')}<span class="tab-ind" id="tabInd"></span></div>` : '<div style="height:16px"></div>'
  return `<header class="ed-head">
      <div class="crumb">${crumb}</div>
      <div class="ed-top"><h1 class="t-title" ${vt ? 'style="view-transition-name:ed-title"' : ''}>${esc(title)}</h1><div class="right">${right}</div></div>
      ${tabsHtml}
    </header>
    <div class="ed-body" id="edBody">${body}</div>
    ${foot ? `<footer class="ed-foot">
      <span class="save-state" id="saveState"><span class="dot ok"></span>Sin cambios</span>
      <div class="right"><button class="btn ghost" type="button" data-discard>Descartar</button><button class="btn primary lg" type="button" data-save>Guardar <kbd>Ctrl S</kbd></button></div>
    </footer>` : ''}`
}
const langToggle = () => `<div class="lang" role="group" aria-label="Idioma que editás"><button type="button" data-lang="es" aria-pressed="${state.lang === 'es'}">Español</button><button type="button" data-lang="en" aria-pressed="${state.lang === 'en'}">Inglés</button></div>`

/* ── Explorador ───────────────────────────────────────────── */
function explorer({ title, count, newLabel, search, filters, items, current }) {
  return `<div class="ex-head"><span class="t-title">${title}</span><span class="count">${count}</span>${newLabel ? `<button class="btn" type="button" data-new>${newLabel}<kbd>N</kbd></button>` : ''}</div>
    ${search ? `<div class="ex-search"><input class="input" id="exSearch" placeholder="${search}"></div>` : ''}
    ${filters ?? ''}
    <div class="list" role="listbox" aria-label="${title}">${items.map(it => `<a class="item" href="${it.href}" role="option" ${it.id === current ? 'aria-current="true" aria-selected="true"' : 'aria-selected="false"'} data-id="${it.id}">
      <span class="t-row">${esc(it.title)}</span><span class="meta">${it.meta}</span></a>`).join('')}</div>`
}

/* ── Vistas ───────────────────────────────────────────────── */
function viewInicio() {
  const missingMetricSource = D.projects.reduce((n, p) => n + p.metrics.filter(m => !m.source).length, 0)
  const noCover = D.projects.filter(p => !p.media.some(m => m.role === 'COVER'))
  const missEnHl = D.experience.filter(e => e.highlights?.length && !e.highlightsEn?.length)
  const fresh = JOBS.filter(j => j.fresh)
  const pend = [
    ...noCover.map(p => [`${p.title} no tiene portada`, 'La tarjeta y el caso muestran el título sobre una placa lisa.', `#/obras/${p.slug}/imagenes`, 'wip']),
    [`${missingMetricSource} métricas sin fuente`, 'Las 6 obras. Una cifra sin fuente no se puede sostener en una entrevista.', `#/obras/${D.projects[0].slug}/datos`, 'wip'],
    ['El PDF del CV en inglés ya no coincide con la base', 'Cambiaste viñetas de Trayectoria el 30 de octubre. Se regenera con pnpm cv:pdf.', '#/trayectoria/cv', 'sig'],
    [`${fresh.length} vacantes nuevas, ${fresh.filter(j => j.match >= 80).length} muy compatible`, fresh.map(j => j.company).join(' · '), `#/busqueda/${fresh[0].id}/evaluacion`, 'ok'],
    ...missEnHl.map(e => [`Viñetas sin inglés en ${e.org ?? e.role}`, 'El CV en inglés las muestra en español.', `#/trayectoria/${e.slug}`, 'wip']),
  ]
  return `<div class="home"><div class="home-in">
    <h1 class="t-title" style="font-size:24px;margin:0">Inicio</h1>
    <p class="summary"><b>${D.projects.length} obras</b> publicadas · <b>${D.experience.length}</b> entradas de trayectoria · <b>${D.articles.length}</b> artículo · <b>${fresh.length}</b> vacantes nuevas</p>
    <div class="actions"><a class="btn primary" href="#/obras/${D.projects[0].slug}/esencial">Nueva obra</a><a class="btn" href="#/busqueda/${JOBS[0].id}/evaluacion">Pegar una vacante</a></div>
    <h2>Pendientes <span>${pend.length}</span></h2>
    <ul class="pending">${pend.map(([w, c, h, tone]) => `<li><a href="${h}"><span class="dot ${tone}"></span><span><span class="what">${esc(w)}</span><span class="ctx">${esc(c)}</span></span><span class="go">Ir →</span></a></li>`).join('')}</ul>
    <div class="status-row">
      <div><span class="t-label">Sitio</span><span class="dot ok"></span> En línea · mateogs.tech</div>
      <div><span class="t-label">Base</span><span class="dot ok"></span> Respaldo de hoy, 03:00</div>
      <div><span class="t-label">Eros</span><span class="dot"></span> Sin respuesta; las vacantes siguen editables</div>
    </div>
  </div></div>`
}

function exObras(current) {
  const map = { todas: () => true, linea: p => p.status === 'LIVE', desarrollo: p => p.status === 'WIP', destacadas: p => p.featured }
  const items = D.projects.filter(map[state.filter] ?? map.todas).map(p => ({
    id: p.slug, title: p.title, href: `#/obras/${p.slug}/esencial`,
    meta: `<span class="dot ${SITUACION[p.status][1]}"></span>${SITUACION[p.status][0]} · ${p.year}${p.featured ? ' · Destacada' : ''}<span class="r">${p.media.length ? '' : 'Sin portada'}</span>`,
  }))
  const filters = `<div class="seg" role="group" aria-label="Filtrar">${[['todas', 'Todas'], ['linea', 'En línea'], ['desarrollo', 'En desarrollo'], ['destacadas', 'Destacadas']].map(([v, l]) => `<button type="button" data-filter="${v}" aria-pressed="${state.filter === v}">${l}</button>`).join('')}</div>`
  return explorer({ title: 'Obras', count: D.projects.length, newLabel: 'Nueva', search: 'Buscar obra', filters, items, current })
}
function viewObra(slug, sec) {
  const p = D.projects.find(x => x.slug === slug) ?? D.projects[0]
  const base = `#/obras/${p.slug}/`
  const tabs = [['esencial', 'Lo esencial', null, base + 'esencial'], ['relato', 'Relato', p.steps.length, base + 'relato'], ['imagenes', 'Imágenes', p.media.length, base + 'imagenes'], ['datos', 'Datos', p.metrics.length, base + 'datos']]
  const checks = [p.title, p.summary, p.media.some(m => m.role === 'COVER'), p.techs.length, p.summaryEn, p.briefEn]
  const ready = checks.filter(Boolean).length
  const right = `${langToggle()}<button class="pub" type="button" title="Lista para publicar"><span class="dot ${p.publishedAt ? 'ok' : ''}"></span>${p.publishedAt ? 'Publicada' : 'Oculta'} <span class="faint">· ${ready} de ${checks.length}</span></button><a class="btn ghost" href="https://mateogs.tech/projects/${p.slug}" target="_blank" rel="noopener">Ver en el sitio ↗</a>`
  let body = ''
  if (sec === 'esencial') {
    body = `<div class="form">
      <div class="grid2">${field({ label: 'Título', value: p.title, translatable: false })}
        <div class="field"><div class="lab"><label>Dirección</label><a class="aux" href="#" data-noop>Cambiar dirección</a></div><input class="input mono" value="/projects/${p.slug}" readonly><div class="help">Fija desde que se publicó: cambiarla rompe los enlaces que ya circulan.</div></div></div>
      <div class="grid3" style="grid-template-columns:96px auto 1fr">${field({ label: 'Año', value: p.year, translatable: false, narrow: true })}
        <div class="field"><div class="lab"><label>Situación</label></div>${seg([['LIVE', 'En línea'], ['WIP', 'En desarrollo'], ['ARCHIVED', 'Archivada']], p.status, 'data-status')}</div>
        <div class="field"><div class="lab"><label>Empresa o cliente</label></div><select class="input"><option>${esc(p.org ?? 'Sin empresa')}</option><option>Crear empresa…</option></select></div></div>
      ${field({ label: 'Rol', value: p.role, en: p.roleEn, help: 'Cómo participaste. Sale en la tarjeta y en la ficha del caso.' })}
      ${field({ label: 'Resumen', value: p.summary, en: p.summaryEn, kind: 'textarea', rows: 2, aux: `${(state.lang === 'es' ? p.summary : p.summaryEn ?? '').length} de 160`, help: 'Una o dos líneas. Es lo que se lee en la lista de obras y en los buscadores.' })}
      <div class="field"><div class="lab"><label>Tecnologías</label><span class="aux">${p.techs.length}</span></div><div class="chips">${p.techs.map(t => `<span class="chip">${esc(t)}<button type="button" aria-label="Quitar ${esc(t)}">×</button></span>`).join('')}<button class="chip add" type="button">+ Agregar</button></div></div>
      <div class="field">${sw(p.featured, 'Destacada en el inicio')}</div>
      <hr class="rule">
      <div><button class="btn danger" type="button">Eliminar obra…</button></div>
    </div>`
  } else if (sec === 'relato') {
    body = `<div class="form">
      ${field({ label: 'Encargo', value: p.brief, en: p.briefEn, kind: 'textarea', rows: 3, help: 'Qué te pidieron y por qué importaba. Abre el caso.' })}
      ${field({ label: 'Resultado', value: p.outcome, en: p.outcomeEn, kind: 'textarea', rows: 3, help: 'Qué quedó en producción y qué cambió para el cliente.' })}
      <h2>Proceso</h2>
      <div class="steps">${p.steps.map((s, i) => `<div class="step"><span class="num">${i + 1}</span><div class="form" style="gap:10px">${field({ label: 'Título del paso', value: s.title.replace(/^\d+\s*·\s*/, ''), en: s.titleEn })}${field({ label: 'Qué hiciste', value: s.body, en: s.bodyEn, kind: 'textarea', rows: 2 })}</div></div>`).join('')}</div>
      <div><button class="btn" type="button">+ Agregar paso</button></div>
    </div>`
  } else if (sec === 'imagenes') {
    const cards = p.media.map(m => {
      const img = m.kind === 'VIDEO' ? m.poster : m.src
      return `<article class="mcard"><div class="thumb${m.viewport === 'MOBILE' ? ' mobile' : ''}">${img ? `<img src="${asset(img)}" alt="" loading="lazy">` : ''}${m.kind === 'VIDEO' ? '<span class="kind">Video</span>' : ''}</div>
        <div class="info"><div class="top"><b style="font-weight:520">${m.role === 'COVER' ? 'Portada' : 'Galería'}</b><span class="faint">${m.viewport === 'MOBILE' ? 'Móvil' : 'Escritorio'} · ${kb(m.bytes)}</span><span class="sw" style="background:${m.tint ?? 'transparent'}" title="Tinte ${m.tint ?? 'sin calcular'}"></span></div>
        <p>${esc(state.lang === 'es' ? m.alt : m.altEn ?? '')}</p>${state.lang === 'en' && !m.altEn ? '<span class="miss"><span class="dot wip"></span>Falta el inglés</span>' : ''}</div></article>`
    }).join('')
    body = `<div class="form" style="max-width:none">
      <div class="drop">Soltá imágenes o videos acá, o <a href="#" data-noop>elegilos</a>. WebP, PNG, JPG, MP4 o WebM; el tamaño y el tinte se leen solos.</div>
      ${p.media.length ? `<div class="media-grid">${cards}</div>` : '<p class="dim" style="margin:0">Esta obra todavía no tiene imágenes. La primera que subas queda como portada.</p>'}
    </div>`
  } else {
    const rows = p.metrics.map(m => `<tr><td style="width:24%"><span class="mono dim">${esc(m.key)}</span><div class="t-meta faint">${METRIC[m.key] ?? m.label ?? ''}</div></td>
      <td style="width:22%"><input class="input" value="${esc(m.items?.length ? m.items.join(', ') : m.value)}"></td><td style="width:12%"><input class="input" value="${esc(m.unit ?? '')}" placeholder="—"></td>
      <td><input class="input" value="${esc(m.source ?? '')}" placeholder="Sin fuente"></td><td style="width:16%"><input class="input" value="${esc(m.measuredAt ? fmtDate(m.measuredAt) : '')}" placeholder="Sin fecha"></td></tr>`).join('')
    body = `<div class="form">
      <h2>Métricas</h2>
      <table class="table"><thead><tr><th>Clave</th><th>Valor</th><th>Unidad</th><th>Fuente</th><th>Medido</th></tr></thead><tbody>${rows}</tbody></table>
      <div><button class="btn" type="button">+ Agregar métrica</button> <span class="faint t-meta" style="margin-left:10px">Las claves sugeridas salen de las otras obras.</span></div>
      <h2>Enlaces</h2>
      <table class="table"><tbody>${p.links.map(l => `<tr><td style="width:34%"><input class="input" value="${esc(state.lang === 'es' ? l.label : l.labelEn ?? '')}"></td><td><input class="input mono" value="${esc(l.url)}"></td></tr>`).join('')}</tbody></table>
      <div><button class="btn" type="button">+ Agregar enlace</button></div>
    </div>`
  }
  return shell({ crumb: '<a href="#/obras">← Obras</a>', title: p.title, right, tabs, tab: sec, body })
}

function exTrayectoria(current) {
  const items = [{ id: 'cv', title: 'Vista CV', href: '#/trayectoria/cv', meta: 'La hoja A4 tal como se imprime' },
    ...sortedExp().map(e => ({ id: e.slug, title: e.org ?? e.role, href: `#/trayectoria/${e.slug}`, meta: `${KIND[e.kind] ?? e.kind} · ${monthYear(e.startedAt)} – ${monthYear(e.endedAt)}<span class="r">${e.cvOrder ? 'En el CV' : ''}</span>` }))]
  return explorer({ title: 'Trayectoria', count: D.experience.length, newLabel: 'Nueva', search: 'Buscar entrada', items, current })
}
function cvSheet({ summary, highlight } = {}) {
  const exp = sortedExp().filter(e => e.cvOrder && e.kind !== 'EDUCATION')
  const edu = D.experience.filter(e => e.kind === 'EDUCATION')
  const contact = [docVal('contact', 'location'), docVal('contact', 'email'), 'linkedin.com/in/mateo-sonzogni', 'github.com/MateoGs013'].join(' · ')
  return `<div class="sheet-box"><div class="sheet" id="sheet"><h3>${esc(docVal('about', 'name'))}</h3><div class="contact">${esc(contact)}</div>
    <h4>Perfil</h4><p style="margin:0" class="${highlight ? 'hl' : ''}">${esc(summary ?? docVal('about', 'core_competencies'))}</p>
    <h4>Experiencia</h4>${exp.map(e => `<div class="entry"><div class="top"><span>${esc(e.org ?? '')}</span><span>${esc(e.location ?? '')}</span></div><div class="sub"><span>${esc(e.role)}</span><span>${monthYear(e.startedAt)} – ${monthYear(e.endedAt)}</span></div><ul>${(e.highlights ?? []).slice(0, 3).map(h => `<li>${esc(h)}</li>`).join('')}</ul></div>`).join('')}
    <h4>Educación</h4>${edu.map(e => `<div class="entry"><div class="top"><span>${esc(e.org ?? '')}</span><span>${esc(e.location ?? '')}</span></div><div class="sub"><span>${esc(e.role)}</span><span>${monthYear(e.startedAt)} – ${monthYear(e.endedAt)}</span></div></div>`).join('')}
    <h4>Habilidades</h4><p style="margin:0"><b>Técnicas:</b> ${D.stack.slice(0, 16).map(t => t.name).join(', ')}.</p><p style="margin:2px 0 0"><b>Idiomas:</b> ${esc((docVal('about', 'languages') ?? []).join(', '))}.</p></div></div>`
}
// La hoja mide 794 px (A4 a 96 dpi): se escala entera dentro de su columna, sin recortarse.
function fitSheet() {
  const s = $('#sheet'), wrap = s?.closest('.sheet-wrap')
  if (!s) return
  s.style.transform = 'none'
  const k = Math.min(1, (wrap.clientWidth - 56) / 794)
  const box = s.parentElement
  box.style.width = `${794 * k}px`
  box.style.height = `${s.offsetHeight * k}px`
  s.style.transform = `scale(${k})`
}
function viewTrayectoria(slug) {
  if (slug === 'cv') {
    const body = `<div class="stage-grid"><div class="sheet-wrap">${cvSheet()}</div>
      <aside class="side"><span class="t-label">Orden en el CV</span><ol class="points" style="counter-reset:n">${sortedExp().filter(e => e.cvOrder).map((e, i) => `<li><span class="faint">${i + 1}</span><span>${esc(e.org ?? e.role)}</span></li>`).join('')}</ol>
      <p class="faint t-meta" style="margin:0">Arrastrá para cambiar el orden. La hoja se actualiza en vivo y avisa si se pasa de una página.</p>
      <div class="prop"><div class="src"><span class="dot ok"></span>Una página A4 · 256 mm de 276</div><div class="src"><span class="dot sig"></span>El PDF del sitio en inglés quedó viejo</div><button class="btn" type="button">Imprimir o guardar como PDF</button></div></aside></div>`
    return shell({ crumb: '<a href="#/trayectoria">← Trayectoria</a>', title: 'Vista CV', tabs: [], body, foot: false })
  }
  const e = D.experience.find(x => x.slug === slug) ?? D.experience[0]
  const hl = state.lang === 'es' ? e.highlights ?? [] : e.highlightsEn ?? []
  const body = `<div class="form">
    <div class="grid2">${field({ label: 'Empresa o institución', value: e.org ?? '', translatable: false })}<div class="field"><div class="lab"><label>Tipo</label></div><select class="input"><option>${KIND[e.kind] ?? e.kind}</option></select></div></div>
    ${field({ label: 'Cargo', value: e.role, en: e.roleEn })}
    <div class="grid3">${field({ label: 'Desde', value: monthYear(e.startedAt), translatable: false, narrow: true })}${field({ label: 'Hasta', value: e.endedAt ? monthYear(e.endedAt) : 'Actualidad', translatable: false, narrow: true })}${field({ label: 'Lugar', value: e.location ?? '', translatable: false, narrow: true })}</div>
    ${field({ label: 'Resumen', value: e.summary, kind: 'textarea', rows: 2, en: null })}
    <div class="field"><div class="lab"><label>Viñetas del CV</label><span class="aux">Hasta 3, de 160 caracteres</span>${state.lang === 'en' && !hl.length ? '<span class="miss"><span class="dot wip"></span>Falta el inglés</span>' : ''}</div>
      ${(hl.length ? hl : ['']).map(h => `<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:start"><textarea class="textarea" rows="2" style="min-height:56px">${esc(h)}</textarea><span class="faint t-meta" style="padding-top:10px;font-variant-numeric:tabular-nums">${h.length}</span></div>`).join('')}</div>
    <div class="field">${sw(!!e.cvOrder, 'Sale en el CV')}</div>
  </div>`
  return shell({ crumb: '<a href="#/trayectoria">← Trayectoria</a>', title: e.org ?? e.role, right: langToggle(), tabs: [], body })
}

function viewPerfil(which) {
  const key = which === 'contacto' ? 'contact' : 'about'
  const d = doc(key)
  const tabs = [['sobre-mi', 'Sobre mí', null, '#/perfil/sobre-mi'], ['contacto', 'Contacto', null, '#/perfil/contacto']]
  const translatable = f => ['string', 'text', 'list'].includes(f.type) && !['portrait', 'cv', 'time_zone', 'email', 'github', 'linkedin', 'website'].includes(f.name)
  const fields = d.fields.map(f => {
    if (f.name === 'portrait') return `<div class="field"><div class="lab"><label>Retrato</label><span class="aux">Lo usa el sitio</span></div><div style="display:flex;gap:14px;align-items:center"><img src="/public${f.value}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:6px;background:var(--surface)"><button class="btn" type="button">Reemplazar</button></div></div>`
    const val = Array.isArray(f.value) ? f.value.join(' · ') : f.value
    const en = Array.isArray(f.en) ? f.en.join(' · ') : f.en
    return field({ label: BLOCKS[f.name] ?? f.name, value: val, en, kind: f.type === 'text' ? 'textarea' : 'input', translatable: translatable(f), mono: ['email', 'url'].includes(f.type), aux: FIXED.has(f.name) ? 'Lo usa el sitio' : undefined, rows: 3 })
  }).join('')
  const body = `<div class="form">${fields}<hr class="rule"><div><button class="btn" type="button">+ Agregar bloque libre</button> <span class="faint t-meta" style="margin-left:10px">Los bloques que usa el sitio no se pueden quitar ni renombrar.</span></div></div>`
  return shell({ crumb: '<a href="#/perfil/sobre-mi">Perfil</a>', title: which === 'contacto' ? 'Contacto' : 'Sobre mí', right: langToggle(), tabs, tab: which, body })
}

function exArticulos(current) {
  return explorer({ title: 'Artículos', count: D.articles.length, newLabel: 'Nuevo', items: D.articles.map(a => ({ id: a.slug, title: a.title, href: `#/articulos/${a.slug}`, meta: `<span class="dot ok"></span>Publicado · ${fmtDate(a.publishedAt)}<span class="r">${a.readingTimeMin} min</span>` })), current })
}
function viewArticulo(slug) {
  const a = D.articles.find(x => x.slug === slug) ?? D.articles[0]
  const body = `<div class="form">${field({ label: 'Título', value: a.title, en: a.titleEn })}${field({ label: 'Resumen', value: a.summary, kind: 'textarea', rows: 2 })}
    <div class="field"><div class="lab"><label>Texto</label><span class="aux">Markdown · ${a.readingTimeMin} min de lectura</span></div><textarea class="textarea" rows="12"># ${esc(a.title)}\n\nLa proliferación de bases de datos especializadas para vectores resolvió necesidades iniciales…</textarea></div></div>`
  return shell({ crumb: '<a href="#/articulos/' + a.slug + '">Artículos</a>', title: a.title, right: langToggle(), tabs: [['texto', 'Texto', null, '#'], ['vista', 'Vista previa', null, '#']], tab: 'texto', body })
}

function viewCatalogo(kind) {
  const isTech = kind === 'tecnologias'
  const rows = isTech
    ? D.stack.map(t => `<tr><td><b style="font-weight:520">${esc(t.name)}</b></td><td class="dim">${CATEGORIA[t.category] ?? t.category}</td><td class="dim" style="font-variant-numeric:tabular-nums">${t.since ?? ''}</td><td class="dim">${t.count} ${t.count === 1 ? 'obra' : 'obras'}</td><td>${t.noteEn ? '' : '<span class="miss"><span class="dot wip"></span>Falta el inglés</span>'}</td></tr>`).join('')
    : D.orgs.map(o => `<tr><td><b style="font-weight:520">${esc(o.name)}</b></td><td class="dim">${esc(o.city ?? '')}</td><td><span class="mono dim">${esc(o.url ?? '')}</span></td></tr>`).join('')
  const head = isTech ? '<th>Nombre</th><th>Categoría</th><th>Desde</th><th>Uso</th><th></th>' : '<th>Nombre</th><th>Ciudad</th><th>Sitio</th>'
  return `<div class="home"><div class="home-in" style="max-width:980px"><div style="display:flex;align-items:center;gap:12px"><h1 class="t-title" style="margin:0;font-size:24px">${isTech ? 'Tecnologías' : 'Empresas'}</h1><span class="faint">${isTech ? D.stack.length : D.orgs.length}</span><button class="btn" type="button" style="margin-left:auto">Nueva</button></div>
    <table class="table" style="margin-top:24px"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div></div>`
}

function exVacantes(current) {
  const items = JOBS.map(j => ({ id: j.id, title: j.role, href: `#/busqueda/${j.id}/evaluacion`, meta: `<span class="dot ${j.tone}"></span>${j.verdict} · ${esc(j.company)}<span class="r">${j.match} %</span>` }))
  return explorer({ title: 'Vacantes', count: JOBS.length, newLabel: 'Pegar', search: 'Buscar vacante', filters: `<div class="seg"><button type="button" aria-pressed="true">Por revisar</button><button type="button" aria-pressed="false">Postuladas</button><button type="button" aria-pressed="false">Descartadas</button></div>`, items, current })
}
function viewVacante(id, stage) {
  const j = JOBS.find(x => x.id === id) ?? JOBS[0]
  const base = `#/busqueda/${j.id}/`
  const tabs = [['evaluacion', 'Evaluación', null, base + 'evaluacion'], ['cv', 'CV adaptado', null, base + 'cv'], ['envio', 'Envío', null, base + 'envio']]
  let body
  if (stage === 'evaluacion') {
    body = `<div class="form">
      <div style="display:flex;align-items:baseline;gap:18px"><span class="t-figure">${j.match} %</span><span class="verdict"><span class="dot ${j.tone}"></span>${j.verdict}</span><span class="src" style="margin-left:auto">Generado por Eros · hace 3 h</span></div>
      <div class="grid2"><div class="field"><div class="lab"><label>A favor</label></div><ul class="points">${j.strengths.map(s => `<li><span class="dot ok"></span><span>${esc(s)}</span></li>`).join('') || '<li class="faint">Nada relevante.</li>'}</ul></div>
      <div class="field"><div class="lab"><label>En contra</label></div><ul class="points">${j.gaps.map(s => `<li><span class="dot wip"></span><span>${esc(s)}</span></li>`).join('')}</ul></div></div>
      <hr class="rule"><div style="display:flex;gap:8px"><a class="btn primary" href="${base}cv">Armar el CV para esta vacante</a><button class="btn ghost" type="button">Descartar</button></div>
    </div>`
  } else if (stage === 'cv') {
    const useEros = state.cvSummary === 'eros'
    body = `<div class="stage-grid"><div class="sheet-wrap">${cvSheet({ summary: useEros ? EROS_SUMMARY : undefined, highlight: useEros })}</div>
      <aside class="side"><span class="t-label">Resumen del CV</span>
        <div class="prop"><div class="src"><span class="dot"></span>De la base · Perfil</div><p class="dim">${esc(docVal('about', 'core_competencies'))}</p>${useEros ? '<button class="btn" type="button" data-cvsum="base">Volver a este</button>' : '<span class="src"><span class="dot ok"></span>En uso</span>'}</div>
        <div class="prop"><div class="src"><span class="dot sig"></span>Propuesta de Eros para ${esc(j.company)}</div><p>${esc(EROS_SUMMARY)}</p>${useEros ? '<span class="src"><span class="dot ok"></span>En uso</span>' : '<button class="btn" type="button" data-cvsum="eros">Usar esta propuesta</button>'}</div>
        <div class="prop"><div class="src"><span class="dot ok"></span>Una página A4 · 258 mm de 276</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button">Imprimir</button><button class="btn" type="button" data-copy>Copiar texto plano</button></div></div>
      </aside></div>`
  } else {
    body = `<div class="form">${field({ label: 'Asunto', value: `Postulación: ${j.role} · Mateo Sonzogni`, translatable: false })}
      ${field({ label: 'Mensaje', value: `Hola, equipo de ${j.company}:\n\nLes escribo por la búsqueda de ${j.role}. Trabajo con Vue 3 y Nuxt en producción para clientes reales…`, kind: 'textarea', rows: 8, translatable: false, help: 'Generado por Eros a partir de la evaluación. Editalo antes de enviarlo.' })}
      <div style="display:flex;gap:8px"><button class="btn primary" type="button" data-copy>Copiar mensaje</button><button class="btn" type="button">Marcar como postulada</button></div></div>`
  }
  const right = `<a class="btn ghost" href="#" data-noop>Aviso original ↗</a>`
  return shell({ crumb: `<a href="#/busqueda">← Vacantes</a><span>·</span>${esc(j.company)} · ${esc(j.place)}`, title: j.role, right, tabs, tab: stage, body, foot: false })
}
function viewSimple(title, lines) {
  return `<div class="home"><div class="home-in"><h1 class="t-title" style="margin:0;font-size:24px">${title}</h1><ul class="pending" style="margin-top:24px">${lines.map(([w, c]) => `<li><a href="#" data-noop><span class="dot"></span><span><span class="what">${w}</span><span class="ctx">${c}</span></span><span class="go">Abrir →</span></a></li>`).join('')}</ul></div></div>`
}

// Una lista es su propia pantalla: filas grandes como las del inicio del sitio.
function listPage({ title, n, sub, filters = '', actions = '', items }) {
  return `<div class="lp"><div class="lp-head"><h1>${title}</h1><span class="n">${n}</span><div class="act">${actions}</div></div>
    ${sub ? `<p class="lp-sub">${sub}</p>` : ''}${filters}
    <div class="rows" role="listbox" aria-label="${title}">${items.map((it, i) => `<a class="item" role="option" href="${it.href}" style="--i:${i}"><span class="t-row">${esc(it.title)}</span><span class="meta">${it.meta}</span></a>`).join('')}</div></div>`
}
function lpObras() {
  const map = { todas: () => true, linea: p => p.status === 'LIVE', desarrollo: p => p.status === 'WIP', destacadas: p => p.featured }
  const filters = `<div class="lp-filters">${[['todas', 'Todas'], ['linea', 'En línea'], ['desarrollo', 'En desarrollo'], ['destacadas', 'Destacadas']].map(([v, l]) => `<button type="button" data-lpfilter="${v}" aria-pressed="${state.filter === v}">${l}</button>`).join('')}</div>`
  return listPage({ title: 'Obras', n: D.projects.length, filters, actions: '<button class="btn primary" type="button">Nueva obra</button>',
    items: D.projects.filter(map[state.filter] ?? map.todas).map(p => ({ title: p.title, href: `#/obras/${p.slug}/esencial`, meta: `<span class="dot ${SITUACION[p.status][1]}"></span>&nbsp;${SITUACION[p.status][0]} · ${p.year}<span class="r">${p.media.length ? p.media.length + ' imágenes' : 'Sin portada'}</span>` })) })
}
function lpTrayectoria() {
  return listPage({ title: 'Trayectoria', n: D.experience.length, actions: '<a class="btn" href="#/trayectoria/cv">Vista CV</a><button class="btn primary" type="button">Nueva</button>',
    items: sortedExp().map(e => ({ title: e.org ?? e.role, href: `#/trayectoria/${e.slug}`, meta: `${KIND[e.kind] ?? e.kind} · ${monthYear(e.startedAt)} – ${monthYear(e.endedAt)}<span class="r">${e.cvOrder ? 'En el CV' : ''}</span>` })) })
}
function lpVacantes() {
  return listPage({ title: 'Vacantes', n: JOBS.length, sub: 'Las evalúa Eros; el CV se arma siempre desde la base.', actions: '<button class="btn" type="button" data-scan>Buscar vacantes nuevas</button><button class="btn primary" type="button">Pegar una vacante</button>',
    items: JOBS.map(j => ({ title: j.role, href: `#/busqueda/${j.id}/evaluacion`, meta: `${esc(j.company)} · <span class="dot ${j.tone}"></span>&nbsp;${j.verdict}<span class="r" style="font-variant-numeric:tabular-nums">${j.match} %</span>` })) })
}

/* ── Router ───────────────────────────────────────────────── */
function route() {
  const [sec = 'inicio', a, b] = location.hash.replace(/^#\/?/, '').split('/')
  const app = $('#app'), ex = $('#explorer'), main = $('#main')
  let wide = false
  if (sec === 'obras' && !a) { wide = true; main.innerHTML = lpObras() }
  else if (sec === 'trayectoria' && !a) { wide = true; main.innerHTML = lpTrayectoria() }
  else if (sec === 'busqueda' && !a) { wide = true; main.innerHTML = lpVacantes() }
  else if (sec === 'articulos' && !a) { wide = true; main.innerHTML = listPage({ title: 'Artículos', n: D.articles.length, items: D.articles.map(x => ({ title: x.title, href: `#/articulos/${x.slug}`, meta: `Publicado · ${fmtDate(x.publishedAt)}` })) }) }
  else if (sec === 'obras') { main.innerHTML = viewObra(a, b ?? 'esencial') }
  else if (sec === 'trayectoria') { main.innerHTML = viewTrayectoria(a ?? 'cv') }
  else if (sec === 'articulos') { main.innerHTML = viewArticulo(a) }
  else if (sec === 'perfil') { wide = true; main.innerHTML = viewPerfil(a ?? 'sobre-mi') }
  else if (sec === 'tecnologias' || sec === 'empresas') { wide = true; main.innerHTML = viewCatalogo(sec) }
  else if (sec === 'busqueda') { main.innerHTML = viewVacante(a, b ?? 'evaluacion') }
  else if (sec === 'publicaciones') { wide = true; main.innerHTML = viewSimple('Publicaciones', [['Por qué consolidé vectores y datos en PostgreSQL 17', 'Borrador para LinkedIn · generado por Eros a partir del artículo'], ['Motion con oficio en un sitio de restaurante', 'Borrador para X · a partir del caso La Rúcula'], ['Del PDF escaneado a la carta digital', 'Publicado el 22 de octubre en LinkedIn']]) }
  else if (sec === 'tendencias') { wide = true; main.innerHTML = viewSimple('Tendencias', [['View Transitions entre documentos llegan a Safari', 'Hacker News · relacionado con tu stack: Nuxt, motion'], ['pgvector 0.9 y los índices HNSW', 'GitHub Trending · relacionado con tu artículo']]) }
  else { wide = true; main.innerHTML = viewInicio() }
  app.classList.toggle('wide', wide)
  placeNavInd(sec === 'busqueda' ? 'busqueda' : sec)
  placeTabInd()
  fitSheet()
  state.dirty = false
}
function placeTabInd() {
  const t = $('.tabs a[aria-selected=true]'), ind = $('#tabInd')
  if (!t || !ind) return
  ind.style.width = t.offsetWidth + 'px'
  ind.style.transform = `translateX(${t.offsetLeft}px)`
}
function go(fn) {
  if (!reduce && document.startViewTransition) document.startViewTransition(fn)
  else fn()
}
let lastHash = location.hash
addEventListener('hashchange', () => {
  if (state.dirty && !confirm('Tenés cambios sin guardar. ¿Salir igual?')) { history.replaceState(null, '', lastHash); return }
  const prev = lastHash
  lastHash = location.hash
  // Cambiar de pestaña dentro del mismo registro no es una transición de página.
  const sameView = $('#tabInd') && location.hash.split('/').slice(0, 3).join('/') === prev.split('/').slice(0, 3).join('/')
  sameView ? route() : go(route)
})
addEventListener('resize', () => { fitSheet(); placeTabInd() })

/* ── Interacciones ────────────────────────────────────────── */
function setDirty(on) {
  state.dirty = on
  const s = $('#saveState')
  if (s) s.innerHTML = on ? '<span class="dot wip"></span>Cambios sin guardar' : '<span class="dot ok"></span>Sin cambios'
}
function save() {
  const s = $('#saveState')
  if (!s) return
  s.innerHTML = '<span class="dot"></span>Guardando…'
  setTimeout(() => { setDirty(false); s.innerHTML = '<span class="dot ok"></span>Guardado recién'; toast('Cambios guardados') }, 450)
}
let toastT
function toast(msg) {
  const t = $('#toast')
  t.innerHTML = `<span class="dot ok"></span>${msg}`
  t.setAttribute('data-on', '')
  clearTimeout(toastT)
  toastT = setTimeout(() => t.removeAttribute('data-on'), 2200)
}
document.addEventListener('input', e => { if (e.target.closest('.ed-body')) setDirty(true) })
document.addEventListener('click', (e) => {
  const t = e.target.closest('button, a')
  if (!t) return
  if (t.matches('[data-noop]')) { e.preventDefault(); return }
  if (t.matches('[data-palette]')) return openPalette()
  if (t.matches('[data-save]')) return save()
  if (t.matches('[data-discard]')) { setDirty(false); route(); return }
  if (t.matches('[data-copy]')) return toast('Copiado al portapapeles')
  if (t.dataset.lang) { state.lang = t.dataset.lang; route(); return }
  if (t.matches('[data-scan]')) {
    // Eros recorre los portales; la lista suma lo nuevo cuando termina.
    t.disabled = true
    t.innerHTML = '<span class="dot wip"></span>Buscando en LinkedIn, Get on Board y RemoteOK…'
    setTimeout(() => { t.disabled = false; t.textContent = 'Buscar vacantes nuevas'; toast('Eros encontró 3 vacantes nuevas; 1 muy compatible') }, 1800)
    return
  }
  if (t.dataset.lpfilter) { state.filter = t.dataset.lpfilter; route(); return }
  if (t.dataset.filter) { state.filter = t.dataset.filter; $('#explorer').innerHTML = exObras(location.hash.split('/')[2]); return }
  if (t.dataset.cvsum) { state.cvSummary = t.dataset.cvsum; route(); toast(t.dataset.cvsum === 'eros' ? 'El CV usa la propuesta de Eros' : 'El CV volvió al resumen de la base'); return }
  if (t.dataset.status) { $$('[data-status]').forEach(b => b.setAttribute('aria-pressed', b === t)); setDirty(true); return }
  if (t.matches('.switch')) { t.setAttribute('aria-checked', t.getAttribute('aria-checked') !== 'true'); setDirty(true); return }
  if (t.matches('.item')) {
    // La fila tocada viaja al encabezado del editor (250 ms).
    const title = t.querySelector('.t-row')
    title.style.viewTransitionName = 'ed-title'
    $$('.ed-top h1').forEach(h => { h.style.viewTransitionName = 'none' })
  }
})

/* ── Teclado ──────────────────────────────────────────────── */
const typing = el => el.closest('input, textarea, select, [contenteditable]')
document.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey
  if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); return openPalette() }
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); return save() }
  if ($('.scrim')) return
  if (typing(e.target)) { if (e.key === 'Escape') e.target.blur(); return }
  if (e.key === '/') { e.preventDefault(); $('#exSearch')?.focus() }
  if (e.key === 'j' || e.key === 'k' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const items = $$('.item'), cur = items.findIndex(i => i.hasAttribute('aria-current'))
    if (!items.length) return
    e.preventDefault()
    const next = items[Math.max(0, Math.min(items.length - 1, cur + (e.key === 'j' || e.key === 'ArrowDown' ? 1 : -1)))]
    next.click()
    next.focus()
  }
  if (e.key.toLowerCase() === 'n') $('[data-new]')?.click()
})

/* ── Paleta Ctrl/⌘K ───────────────────────────────────────── */
function paletteItems() {
  return [
    ['Secciones', [['Inicio', '#/inicio'], ['Obras', firstOf.obras()], ['Trayectoria', firstOf.trayectoria()], ['Vista CV', '#/trayectoria/cv'], ['Perfil', '#/perfil/sobre-mi'], ['Vacantes', firstOf.busqueda()]].map(([l, h]) => ({ l, h, k: 'Ir' }))],
    ['Obras', D.projects.map(p => ({ l: p.title, h: `#/obras/${p.slug}/esencial`, k: SITUACION[p.status][0] }))],
    ['Trayectoria', D.experience.map(e => ({ l: e.org ?? e.role, h: `#/trayectoria/${e.slug}`, k: KIND[e.kind] }))],
    ['Vacantes', JOBS.map(j => ({ l: `${j.role} · ${j.company}`, h: `#/busqueda/${j.id}/evaluacion`, k: `${j.match} %` }))],
    ['Acciones', [{ l: 'Nueva obra', h: `#/obras/${D.projects[0].slug}/esencial`, k: 'N' }, { l: 'Pegar una vacante', h: firstOf.busqueda(), k: '' }, { l: 'Imprimir el CV', h: '#/trayectoria/cv', k: '' }]],
  ]
}
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
function openPalette() {
  if ($('.scrim')) return
  const opener = document.activeElement
  const scrim = document.createElement('div')
  scrim.className = 'scrim'
  scrim.innerHTML = `<div class="palette" role="dialog" aria-modal="true" aria-label="Ir a"><input role="combobox" aria-expanded="true" aria-controls="palList" placeholder="Buscar o ir a…"><div class="pal-list" id="palList" role="listbox"></div><div class="pal-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> moverse</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Esc</kbd> cerrar</span></div></div>`
  document.body.append(scrim)
  requestAnimationFrame(() => scrim.setAttribute('data-open', ''))
  const input = $('input', scrim), list = $('#palList', scrim)
  let flat = [], idx = 0, first = true
  const draw = () => {
    const q = norm(input.value)
    flat = []
    list.innerHTML = '<div class="pal-hi" id="palHi"></div>' + paletteItems().map(([g, its]) => {
      const f = its.filter(i => norm(i.l).includes(q))
      if (!f.length) return ''
      return `<div class="pal-group">${g}</div>` + f.map(i => { flat.push(i); return `<div class="pal-item" role="option" data-i="${flat.length - 1}">${esc(i.l)}<span class="k">${esc(i.k)}</span></div>` }).join('')
    }).join('')
    idx = 0
    first = true
    hi()
  }
  const hi = () => {
    const el = $(`.pal-item[data-i="${idx}"]`, list), h = $('#palHi', list)
    if (!el) { h.style.opacity = 0; return }
    h.style.opacity = 1
    if (first) { h.style.transition = 'none'; first = false } else h.style.transition = ''
    h.style.transform = `translateY(${el.offsetTop}px)`
    $$('.pal-item', list).forEach(x => x.setAttribute('aria-selected', x === el))
    el.scrollIntoView({ block: 'nearest' })
  }
  const close = () => { scrim.removeAttribute('data-open'); setTimeout(() => scrim.remove(), 180); opener?.focus?.() }
  const pick = () => { const it = flat[idx]; close(); if (it) location.hash = it.h }
  input.addEventListener('input', draw)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(flat.length - 1, idx + 1); hi() }
    if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(0, idx - 1); hi() }
    if (e.key === 'Enter') { e.preventDefault(); pick() }
    if (e.key === 'Escape') { e.preventDefault(); close() }
  })
  list.addEventListener('mousemove', (e) => { const it = e.target.closest('.pal-item'); if (it && +it.dataset.i !== idx) { idx = +it.dataset.i; hi() } })
  list.addEventListener('click', (e) => { if (e.target.closest('.pal-item')) pick() })
  scrim.addEventListener('mousedown', (e) => { if (e.target === scrim) close() })
  draw()
  input.focus()
}

if (!location.hash) history.replaceState(null, '', '#/inicio')
route()
