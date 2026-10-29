<script setup lang="ts">
// Hoja técnica de especificación de un registro o documento.
// Presenta cabecera unificada, navegación entre registros vecinos (prev/next),
// vistas dossier editoriales de alta claridad para Proyectos y Experiencias,
// campos estructurados con tipos de datos a la vista y visor colapsable de JSON crudo de la API.
import ExplorerHeader from './ExplorerHeader.vue'
import CvContainer from '~/components/cv/CvContainer.vue'
import AppIcon from '~/components/ui/AppIcon.vue'
import ExplorerValue from './ExplorerValue.vue'
import ExplorerFileWindow from './ExplorerFileWindow.vue'
import ArticleMarkdown from '~/components/blog/ArticleMarkdown.vue'
import UiCopyPill from '~/components/ui/UiCopyPill.vue'
import UiHubDiagram from '~/components/ui/UiHubDiagram.vue'
import UiSharePill from '~/components/ui/UiSharePill.vue'
import UiSlideConfirm from '~/components/ui/UiSlideConfirm.vue'
import UiSpotlightCard from '~/components/ui/UiSpotlightCard.vue'
import { pad, safeHref, type Detail, type Vecino, type Project } from '~/lib/explorer'
import { routeFor } from '~/lib/path'

const props = defineProps<{
  detail: Detail
  prev?: Vecino | null
  next?: Vecino | null
}>()

const { isEs, isEn, tr, localizeFieldLabel, getProjectLocalization, getExperienceLocalization } = usePortfolioLocale()

const uid = useId()
const showRawJson = ref(false)
const showRawFields = ref(false)

const isAbout = computed(() => props.detail.name.toLowerCase() === 'about' || props.detail.type.includes('about'))
const isProject = computed(() => props.detail.type.includes('projects') || props.detail.type.includes('Project'))
const isExperience = computed(() => props.detail.type.includes('experience') || props.detail.type.includes('Experience'))
const isArticle = computed(() => props.detail.type.includes('articles') || props.detail.type.includes('Article'))
const isContact = computed(() => props.detail.name.toLowerCase() === 'contact' || props.detail.type.includes('contact'))

const canonicalFilePath = computed(() => {
  const t = props.detail.type.toLowerCase()
  const n = props.detail.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
  if (t.includes('project')) return `file://portfolio/projects/${n}.ts`
  if (t.includes('about')) return `file://portfolio/profile/mateo-cv.md`
  if (t.includes('contact')) return `file://portfolio/contact/channels.json`
  if (t.includes('tech') || t.includes('stack')) return `file://portfolio/stack/${n}.ts`
  if (t.includes('experience')) return `file://portfolio/experience/${n}.ts`
  if (t.includes('article')) return `file://portfolio/articles/${n}.md`
  return `file://portfolio/${n}.json`
})

const apiEndpoint = computed(() => {
  if (props.detail.requestLine) {
    return props.detail.requestLine.startsWith('GET') ? props.detail.requestLine : `GET ${props.detail.requestLine}`
  }
  const n = props.detail.name.toLowerCase().replace(/\s+/g, '-')
  return `GET /api/${n}`
})

const raw = computed(() => (props.detail.rawRecord as Record<string, unknown> | undefined) ?? {})
const projectUrl = computed(() => typeof raw.value.url === 'string' ? (safeHref(raw.value.url) ?? null) : null)
const projectRepo = computed(() => typeof raw.value.repo === 'string' ? (safeHref(raw.value.repo) ?? null) : null)
const projectStatus = computed(() => typeof raw.value.status === 'string' ? raw.value.status : 'LIVE')
const projectYear = computed(() => raw.value.year ? String(raw.value.year) : null)

const projectSlug = computed(() => {
  if (typeof raw.value.slug === 'string') return raw.value.slug
  return props.detail.name.toLowerCase().replace(/\s+/g, '-')
})
const projectLoc = computed(() => getProjectLocalization(projectSlug.value))
const expLoc = computed(() => getExperienceLocalization(projectSlug.value))

const projectRole = computed(() => {
  if (typeof raw.value.role === 'string') {
    if (isEn.value) {
      if (raw.value.role.includes('diseño y desarrollo')) return raw.value.role.replace('diseño y desarrollo', 'design & engineering')
      if (raw.value.role.includes('front y back a medida')) return raw.value.role.replace('front y back a medida', 'custom full stack')
      if (raw.value.role.includes('Landing inmersiva')) return raw.value.role.replace('Landing inmersiva · diseño y desarrollo', 'Immersive landing · design & dev')
      if (raw.value.role.includes('Producto propio')) return raw.value.role.replace('Producto propio · diseño y desarrollo', 'Proprietary product · design & dev')
    }
    return raw.value.role
  }
  return null
})

const projectOrg = computed(() => {
  if (raw.value.org && typeof raw.value.org === 'object' && 'name' in raw.value.org) {
    const o = raw.value.org as { name?: string, city?: string }
    return o.city ? `${o.name} · ${o.city}` : o.name
  }
  return null
})

function getLocalizedRow(row: Detail['rows'][number]) {
  if (isProject.value && projectLoc.value) {
    if (isEn.value) {
      if (row.name === 'summary' && projectLoc.value.summary) return { ...row, value: projectLoc.value.summary }
      if (row.name === 'brief' && projectLoc.value.brief) return { ...row, value: projectLoc.value.brief }
      if (row.name === 'outcome' && projectLoc.value.outcome) return { ...row, value: projectLoc.value.outcome }
    }
    else {
      if (row.name === 'summary' && !row.value && projectLoc.value.summary) return { ...row, value: projectLoc.value.summary }
      if (row.name === 'brief' && !row.value && projectLoc.value.brief) return { ...row, value: projectLoc.value.brief }
      if (row.name === 'outcome' && !row.value && projectLoc.value.outcome) return { ...row, value: projectLoc.value.outcome }
    }
  }
  if (isExperience.value && expLoc.value) {
    if (isEn.value) {
      if (row.name === 'summary' && expLoc.value.summary) return { ...row, value: expLoc.value.summary }
      if (row.name === 'role' && expLoc.value.role) return { ...row, value: expLoc.value.role }
    }
    else {
      if (row.name === 'summary' && !row.value && expLoc.value.summary) return { ...row, value: expLoc.value.summary }
      if (row.name === 'role' && !row.value && expLoc.value.role) return { ...row, value: expLoc.value.role }
    }
  }
  return row
}

// Filas computadas para Proyecto
const projectSummaryRow = computed(() => {
  const r = props.detail.rows.find(x => x.name === 'summary')
  return r ? getLocalizedRow(r) : null
})
const projectBriefRow = computed(() => {
  const r = props.detail.rows.find(x => x.name === 'brief')
  return r ? getLocalizedRow(r) : null
})
const projectOutcomeRow = computed(() => {
  const r = props.detail.rows.find(x => x.name === 'outcome')
  return r ? getLocalizedRow(r) : null
})
const projectMediaRow = computed(() => {
  return props.detail.rows.find(x => x.name === 'media' && x.media && x.media.length) ?? null
})
const projectStepsRow = computed(() => {
  return props.detail.rows.find(x => x.name === 'steps' && x.steps && x.steps.length) ?? null
})
const projectMetricsRow = computed(() => {
  return props.detail.rows.find(x => x.name === 'metrics' && x.metrics && Object.keys(x.metrics).length) ?? null
})
const projectTechsRow = computed(() => {
  return props.detail.rows.find(x => x.name === 'techs' && x.items && x.items.length) ?? null
})

const projectHubNodes = computed(() => {
  const items = projectTechsRow.value?.items ?? []
  return items.slice(0, 6).map((it, idx) => ({
    id: `tech-${idx}`,
    label: it.label,
    metric: 'ACTIVE',
  }))
})

function triggerMailto() {
  if (import.meta.client) {
    const email = emailRow.value?.value ?? 'mateogabus@gmail.com'
    window.location.href = `mailto:${email}`
  }
}

const projectCoverMedia = computed(() => {
  const m = projectMediaRow.value?.media
  if (Array.isArray(m) && m.length > 0) {
    const cover = m.find(item => item.role === 'COVER') || m[0]
    return cover ?? null
  }
  const knownCovers: Record<string, string> = {
    'la-rucula': '/media/projects/la-rucula.jpg',
    'argpiscinas': '/media/projects/argpiscinas.jpg',
    'arg-piscinas': '/media/projects/argpiscinas.jpg',
    'ynara': '/media/projects/ynara-mtucqc2j.png',
    'barberpole': '/media/projects/barberpole.png',
  }
  const src = knownCovers[projectSlug.value]
  if (src) {
    return {
      id: `${projectSlug.value}-hero`,
      src,
      alt: props.detail.name,
      role: 'COVER',
    }
  }
  return null
})

// Metadatos y filas computadas para Experiencia
const expRole = computed(() => {
  if (expLoc.value?.role) return expLoc.value.role
  const r = props.detail.rows.find(x => x.name === 'role')
  if (r?.value) return String(r.value)
  if (typeof raw.value.role === 'string') return raw.value.role
  return null
})

const expOrg = computed(() => {
  if (raw.value.org && typeof raw.value.org === 'object' && 'name' in raw.value.org) {
    const o = raw.value.org as { name?: string, city?: string }
    return o.city ? `${o.name} · ${o.city}` : o.name
  }
  const r = props.detail.rows.find(x => x.name === 'org')
  return r?.value ? String(r.value) : null
})

const expStartedAt = computed(() => {
  const val = raw.value.startedAt ?? props.detail.rows.find(x => x.name === 'startedAt')?.value
  return typeof val === 'string' ? val : null
})

const expEndedAt = computed(() => {
  const val = raw.value.endedAt ?? props.detail.rows.find(x => x.name === 'endedAt')?.value
  return typeof val === 'string' ? val : null
})

const expPeriod = computed(() => {
  const start = expStartedAt.value
  const end = expEndedAt.value
  if (!start) return null
  const sYear = start.slice(0, 4)
  const eYear = end ? end.slice(0, 4) : (isEs.value ? 'PRESENTE' : 'PRESENT')
  return sYear === eYear && end ? sYear : `${sYear} — ${eYear}`
})

const expSummaryRow = computed(() => {
  const r = props.detail.rows.find(x => x.name === 'summary')
  return r ? getLocalizedRow(r) : null
})

const expStoryRow = computed(() => {
  const r = props.detail.rows.find(x => x.name === 'story')
  return r ? getLocalizedRow(r) : null
})

const expTechsRow = computed(() => {
  return props.detail.rows.find(x => x.name === 'techs' && x.items && x.items.length) ?? null
})

const expMetricsRow = computed(() => {
  return props.detail.rows.find(x => x.name === 'metrics' && x.metrics && Object.keys(x.metrics).length) ?? null
})

const expCategory = computed(() => {
  const s = projectSlug.value
  if (s === 'ynara') return { label: isEs.value ? 'TESIS PREAPROBADA' : 'PRE-APPROVED THESIS', tag: 'THESIS' }
  if (s === 'la-rucula' || s === 'arg-piscinas') return { label: isEs.value ? 'CLIENTE REAL · EN PRODUCCIÓN' : 'REAL CLIENT · IN PRODUCTION', tag: 'CLIENT' }
  if (s === 'escuela-da-vinci' || s === 'cet-30') return { label: isEs.value ? 'FORMACIÓN TÉCNICA' : 'TECHNICAL EDUCATION', tag: 'EDU' }
  return { label: isEs.value ? 'TRAYECTORIA PROFESIONAL' : 'PROFESSIONAL MILESTONE', tag: 'EXP' }
})

const expHighlights = computed(() => {
  const s = projectSlug.value
  if (s === 'ynara') {
    return [
      { label: isEs.value ? 'COMMITS LIDERADOS' : 'LEAD COMMITS', value: '382' },
      { label: isEs.value ? 'CALIFICACIÓN' : 'GRADE', value: isEs.value ? 'PREAPROBADA' : 'PRE-APPROVED' },
      { label: isEs.value ? 'MOTOR VECTORIAL' : 'VECTOR ENGINE', value: 'PGVECTOR' },
      { label: isEs.value ? 'STACK IA' : 'AI STACK', value: 'FASTAPI + ON-PREM' },
    ]
  }
  if (s === 'la-rucula') {
    return [
      { label: isEs.value ? 'ESTADO' : 'STATUS', value: isEs.value ? 'EN PRODUCCIÓN' : 'LIVE PRODUCTION' },
      { label: isEs.value ? 'ARQUITECTURA' : 'ARCHITECTURE', value: 'MENU-FIRST QR' },
      { label: isEs.value ? 'DISPONIBILIDAD' : 'AVAILABILITY', value: 'OFFLINE FALLBACK' },
      { label: isEs.value ? 'GESTIÓN' : 'MANAGEMENT', value: isEs.value ? 'PANEL A MEDIDA' : 'CUSTOM CMS' },
    ]
  }
  if (s === 'arg-piscinas') {
    return [
      { label: isEs.value ? 'ESTADO' : 'STATUS', value: isEs.value ? 'EN PRODUCCIÓN' : 'LIVE PRODUCTION' },
      { label: isEs.value ? 'LOCALIZACIÓN' : 'LOCALIZATION', value: 'TRILINGÜE (ES/EN/DE)' },
      { label: isEs.value ? 'ADMINISTRACIÓN' : 'ADMINISTRATION', value: 'CMS PRISMA' },
      { label: isEs.value ? 'LATENCIA MÓVIL' : 'MOBILE SPEED', value: 'OPTIMIZADO 4G' },
    ]
  }
  if (s === 'escuela-da-vinci') {
    return [
      { label: isEs.value ? 'CICLO' : 'CYCLE', value: '2024 — 2026' },
      { label: isEs.value ? 'ESTADO' : 'STATUS', value: isEs.value ? 'EN CURSO' : 'IN PROGRESS' },
      { label: isEs.value ? 'ENFOQUE' : 'FOCUS', value: 'FULL STACK & UI/UX' },
      { label: isEs.value ? 'TESIS' : 'THESIS', value: 'YNARA AI' },
    ]
  }
  if (s === 'freelance') {
    return [
      { label: isEs.value ? 'PROYECTOS' : 'PROJECTS', value: '10+ ENTREGADOS' },
      { label: isEs.value ? 'CICLO COMPLETO' : 'FULL CYCLE', value: 'FIGMA → DEPLOY' },
      { label: isEs.value ? 'INICIO' : 'STARTED', value: '2023' },
      { label: isEs.value ? 'MODALIDAD' : 'MODALITY', value: isEs.value ? 'GLOBAL / REMOTO' : 'GLOBAL / REMOTE' },
    ]
  }
  if (s === 'cet-30') {
    return [
      { label: isEs.value ? 'DURACIÓN' : 'DURATION', value: isEs.value ? '7 AÑOS LECTIVOS' : '7 ACADEMIC YEARS' },
      { label: isEs.value ? 'TÍTULO OBTENIDO' : 'DEGREE', value: isEs.value ? 'TÉCNICO EN PROGRAMACIÓN' : 'PROGRAMMING DEGREE' },
      { label: isEs.value ? 'FUNDAMENTOS' : 'FOUNDATIONS', value: 'ALGORITMOS & BD' },
      { label: isEs.value ? 'EGRESO' : 'GRADUATED', value: '2023' },
    ]
  }
  return []
})

const expLinkedProjects = computed<Project[]>(() => {
  return props.detail.projects ?? []
})

const emailRow = computed(() => props.detail.rows.find(r => r.name === 'email'))
const copiedEmail = ref(false)

async function copyEmail() {
  if (!emailRow.value?.value) return
  try {
    await navigator.clipboard.writeText(String(emailRow.value.value))
    copiedEmail.value = true
    setTimeout(() => { copiedEmail.value = false }, 2500)
  }
  catch {
    // Fallback silencioso
  }
}

// Datos computados para Artículos / Blog
const articleSummaryRow = computed(() => props.detail.rows.find(x => x.name === 'summary') ?? null)
const articleContentRow = computed(() => props.detail.rows.find(x => x.name === 'content') ?? null)
const articleReadingTime = computed(() => {
  const r = props.detail.rows.find(x => x.name === 'readingTimeMin')
  return typeof r?.value === 'string' || typeof r?.value === 'number' ? Number(r.value) : 5
})
const articleStatus = computed(() => {
  const r = props.detail.rows.find(x => x.name === 'status')
  return typeof r?.value === 'string' ? r.value : 'PUBLISHED'
})
const articlePublishedAt = computed(() => {
  const r = props.detail.rows.find(x => x.name === 'publishedAt')
  return typeof r?.value === 'string' ? r.value.slice(0, 10) : null
})
const articleTechsRow = computed(() => {
  return props.detail.rows.find(x => x.name === 'techs' && x.items && x.items.length) ?? null
})
const articleProjectRow = computed(() => {
  return props.detail.rows.find(x => x.name === 'project' && (x.to || x.value)) ?? null
})
const articleCanonicalRow = computed(() => {
  return props.detail.rows.find(x => x.name === 'canonicalUrl' && x.href) ?? null
})

const { path: explorerPath } = useExplorerRoute()
const parentRoute = computed(() => routeFor(explorerPath.value.slice(0, -1)))

const line = computed(() => [
  ...props.detail.type.split(' · '),
  ...(props.detail.updated ? [`updatedAt ${props.detail.updated}`] : []),
  `${pad(props.detail.rows.length)} ${isEs.value ? 'campos' : 'fields'}`,
])

const jsonContent = computed(() => {
  return JSON.stringify(props.detail.rawRecord ?? props.detail, null, 2)
})
</script>

<template>
  <ExplorerFileWindow
    :title="detail.name"
    :path="canonicalFilePath"
    :badge="detail.type"
    :parent-url="parentRoute"
  >
    <article class="hoja grid grid-cols-1 gap-5 w-full" :class="{ 'is-about-cv': isAbout && !showRawFields }" :aria-labelledby="uid">
      <ExplorerHeader :id="uid" kind="file" :badge="pad(detail.rows.length)" :name="detail.name" :line="line">
        <div class="hoja-acciones flex items-center gap-2 flex-wrap max-md:w-full">
          <!-- Toggle para ver CV vs Campos técnicos si es About -->
          <button
            v-if="isAbout"
            type="button"
            class="raw-btn inline-flex items-center gap-1.5 rounded-md h-7.5 px-2.5 border border-rule bg-surface/80 text-dim font-mono text-[11px] font-medium hover:border-rule-strong hover:text-ink hover:bg-hover active:scale-[0.98] transition-all cursor-pointer"
            :class="{ '!border-sig !text-sig !bg-hover': showRawFields }"
            :title="isEs ? 'Alternar entre la vista de CV y la tabla de campos técnicos' : 'Toggle between CV view and technical fields table'"
            @click="showRawFields = !showRawFields"
          >
            <AppIcon v-if="showRawFields" name="file" :size="12" />
            <AppIcon v-else name="table" :size="12" />
            <span>{{ showRawFields ? tr.detail.dossierTab : tr.detail.fieldsTab }}</span>
          </button>

          <!-- Toggle para ver Dossier vs Esquema de Campos si es Proyecto o Experiencia -->
          <button
            v-else-if="isProject || isExperience"
            type="button"
            class="raw-btn inline-flex items-center gap-1.5 rounded-md h-7.5 px-2.5 border border-rule bg-surface/80 text-dim font-mono text-[11px] font-medium hover:border-rule-strong hover:text-ink hover:bg-hover active:scale-[0.98] transition-all cursor-pointer"
            :class="{ '!border-sig !text-sig !bg-hover': showRawFields }"
            :title="isEs ? 'Alternar entre el dossier editorial y la tabla de campos técnicos' : 'Toggle between editorial dossier and technical fields table'"
            @click="showRawFields = !showRawFields"
          >
            <AppIcon v-if="showRawFields" name="file" :size="12" />
            <AppIcon v-else name="table" :size="12" />
            <span>{{ showRawFields ? tr.detail.dossierTab : tr.detail.fieldsTab }}</span>
          </button>

          <!-- Botón de Inspección de JSON Crudo -->
          <button
            type="button"
            class="raw-btn inline-flex items-center gap-1.5 rounded-md h-7.5 px-2.5 border border-rule bg-surface/80 text-dim font-mono text-[11px] font-medium hover:border-rule-strong hover:text-ink hover:bg-hover active:scale-[0.98] transition-all cursor-pointer"
            :class="{ '!border-sig !text-sig !bg-hover': showRawJson }"
            :title="isEs ? 'Inspeccionar respuesta cruda de la API REST' : 'Inspect raw REST API response'"
            @click="showRawJson = !showRawJson"
          >
            <span class="raw-icon font-mono font-bold">{ }</span>
            <span>{{ showRawJson ? (isEs ? 'CERRAR JSON' : 'CLOSE JSON') : 'RAW JSON' }}</span>
          </button>

          <!-- Navegación entre vecinos -->
          <nav v-if="prev || next" class="vecinos flex items-center gap-1.5 font-sans text-[12px] flex-wrap max-md:w-full" :aria-label="isEs ? 'Registros vecinos' : 'Adjacent records'">
            <NuxtLink
              v-if="prev"
              :to="prev.to"
              class="vecino group inline-flex items-center gap-1.5 max-w-[280px] max-md:max-w-none max-md:flex-1 rounded-md h-7.5 px-2.5 border border-rule bg-surface/80 text-dim font-mono text-[11px] font-medium no-underline whitespace-nowrap overflow-hidden text-ellipsis hover:border-rule-strong hover:text-ink hover:bg-hover active:scale-[0.98] transition-all"
              rel="prev"
              :title="isEs ? 'Registro anterior' : 'Previous record'"
            >
              <AppIcon name="chevron-left" :size="11" class="group-hover:text-ink transition-colors duration-150" />
              <span class="truncate">{{ prev.label }}</span>
            </NuxtLink>

            <NuxtLink
              v-if="next"
              :to="next.to"
              class="vecino group inline-flex items-center gap-1.5 max-w-[280px] max-md:max-w-none max-md:flex-1 rounded-md h-7.5 px-2.5 border border-rule bg-surface/80 text-dim font-mono text-[11px] font-medium no-underline whitespace-nowrap overflow-hidden text-ellipsis hover:border-rule-strong hover:text-ink hover:bg-hover active:scale-[0.98] transition-all"
              rel="next"
              :title="isEs ? 'Registro siguiente' : 'Next record'"
            >
              <span class="truncate">{{ next.label }}</span>
              <AppIcon name="chevron-right" :size="11" class="group-hover:text-ink transition-colors duration-150" />
            </NuxtLink>
          </nav>
        </div>
      </ExplorerHeader>

      <!-- Drawer de Inspección JSON Crudo -->
      <div v-if="showRawJson" class="raw-drawer bg-surface border border-rule mb-3 overflow-hidden shadow-md w-full rounded-xl">
        <div class="raw-toolbar flex items-center justify-between gap-2 p-2 px-3.5 bg-surface-raised/80 border-b border-rule font-mono text-[11px]">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-1.5 h-1.5 rounded-full bg-sig shrink-0" aria-hidden="true" />
            <span class="raw-endpoint text-sig font-bold truncate">{{ apiEndpoint }}</span>
          </div>
          <UiCopyPill :text="jsonContent" :label="isEs ? 'Copiar JSON' : 'Copy JSON'" :copied-label="isEs ? 'Copiado' : 'Copied'" />
        </div>
        <pre class="raw-code m-0 p-3.5 bg-black/70 text-ink font-mono text-[11.5px] leading-relaxed max-h-[360px] max-md:max-h-[260px] overflow-auto"><code>{{ jsonContent }}</code></pre>
      </div>

      <!-- 1. Si es documento About y no está en modo campos: Renderizar CvContainer -->
      <CvContainer v-if="isAbout && !showRawFields" :detail="detail" />

      <!-- 2. Si es PROYECTO y está en modo Dossier Editorial (por defecto) -->
      <div v-else-if="isProject && !showRawFields" class="dossier-wrap project-dossier flex flex-col gap-6 sm:gap-8 w-full min-w-0">
        <!-- Barra de Créditos Arquitectónica Suiza (Awwwards Case Study 4-Column Credits) -->
        <div class="project-hero-bar w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-y border-rule divide-y sm:divide-y-0 sm:divide-x divide-rule bg-surface/20">
          <!-- Columna 1: Estado & Año -->
          <div class="p-3.5 sm:p-4 flex flex-col justify-between gap-1 min-w-0">
            <span class="font-mono text-[10px] text-dim uppercase tracking-[0.12em]">01 / {{ isEs ? 'ESTADO & AÑO' : 'STATUS & YEAR' }}</span>
            <div class="flex items-center gap-2 font-sans text-[14px] font-medium text-ink mt-0.5">
              <span class="w-2 h-2 rounded-full shrink-0" :class="projectStatus === 'LIVE' ? 'bg-green' : 'bg-amber'" />
              <span>{{ (projectStatus === 'LIVE' ? tr.detail.statusLive : tr.detail.statusWip).replace(/^[●•·\s]+/, '') }}</span>
              <span v-if="projectYear" class="text-dim">· {{ projectYear }}</span>
            </div>
          </div>

          <!-- Columna 2: Cliente & Ubicación -->
          <div class="p-3.5 sm:p-4 flex flex-col justify-between gap-1 min-w-0">
            <span class="font-mono text-[10px] text-dim uppercase tracking-[0.12em]">02 / {{ isEs ? 'CLIENTE & UBICACIÓN' : 'CLIENT & LOCATION' }}</span>
            <span class="font-sans text-[14px] font-medium text-ink truncate mt-0.5">
              {{ projectOrg || detail.name }}
            </span>
          </div>

          <!-- Columna 3: Rol & Dirección -->
          <div class="p-3.5 sm:p-4 flex flex-col justify-between gap-1 min-w-0">
            <span class="font-mono text-[10px] text-dim uppercase tracking-[0.12em]">03 / {{ isEs ? 'ROL & RESPONSABILIDAD' : 'ROLE & DIRECTION' }}</span>
            <span class="font-sans text-[14px] font-medium text-ink truncate mt-0.5">
              {{ projectRole || (isEs ? 'Ingeniería Full Stack & UI' : 'Full Stack & UI Engineering') }}
            </span>
          </div>

          <!-- Columna 4: Acciones Directas -->
          <div class="p-3.5 sm:p-4 flex items-center justify-start lg:justify-end gap-2 flex-wrap">
            <UiSharePill :title="isEs ? 'Compartir' : 'Share'" compact />
            <a
              v-if="projectUrl"
              :href="projectUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="ph-btn primary bg-ink text-paper hover:opacity-90 active:scale-[0.98] rounded-full px-4 py-1.5 font-sans text-[12px] font-semibold no-underline inline-flex items-center justify-center gap-1.5 transition-all"
            >
              <span>{{ tr.detail.visitOfficial }}</span>
              <AppIcon name="external" :size="11" />
            </a>
            <a
              v-if="projectRepo"
              :href="projectRepo"
              target="_blank"
              rel="noopener noreferrer"
              class="ph-btn secondary bg-surface hover:bg-hover text-ink border border-rule hover:border-rule-strong active:scale-[0.98] rounded-full px-3.5 py-1.5 font-sans text-[12px] font-medium no-underline inline-flex items-center justify-center gap-1.5 transition-all"
            >
              <AppIcon name="code" :size="11" />
              <span>{{ tr.detail.sourceCode }}</span>
            </a>
          </div>
        </div>

        <!-- Showcase Visual Hero Awwwards (16:9 Monumental Cover right under Credits) -->
        <div v-if="projectCoverMedia" class="project-hero-media relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-[2px] overflow-hidden bg-black/60 border border-rule group">
          <img
            :src="projectCoverMedia.src"
            :alt="projectCoverMedia.alt || detail.name"
            class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
          >
          <div class="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-2 font-mono text-[10.5px]">
            <span class="px-3 py-1 rounded-full backdrop-blur-md bg-black/80 border border-white/15 text-white inline-flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full" :class="projectStatus === 'LIVE' ? 'bg-green' : 'bg-amber'" />
              <span>{{ detail.name }} · {{ projectYear || '2026' }} · {{ projectStatus === 'LIVE' ? 'LIVE PRODUCTION' : 'IN DEVELOPMENT' }}</span>
            </span>
          </div>
        </div>

        <!-- Síntesis Ejecutiva Lead (Editorial Text sin cajas oscuras de dashboard) -->
        <div
          v-if="projectSummaryRow?.value"
          class="summary-editorial pt-2 sm:pt-4 max-w-[82ch]"
        >
          <span class="font-mono text-[10.5px] uppercase tracking-[0.14em] text-sig block mb-2">
            01 / {{ tr.detail.executiveOverview }}
          </span>
          <p class="m-0 font-sans text-[17px] sm:text-[20px] font-normal text-ink leading-[1.5] tracking-[-0.015em] break-words">
            {{ projectSummaryRow.value }}
          </p>
        </div>

        <!-- Split Editorial: El Encargo (Brief) vs Resultado en Producción (Outcome) -->
        <div v-if="projectBriefRow?.value || projectOutcomeRow?.value" class="split-editorial grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 pt-4 border-t border-rule/70 w-full min-w-0">
          <!-- Columna Brief -->
          <div v-if="projectBriefRow?.value" class="flex flex-col gap-2 min-w-0">
            <span class="font-mono text-[10.5px] uppercase tracking-[0.14em] text-dim">
              {{ tr.detail.briefSection }}
            </span>
            <div class="font-sans text-[14px] sm:text-[15px] text-dim leading-[1.62] whitespace-pre-line break-words">
              {{ projectBriefRow.value }}
            </div>
          </div>

          <!-- Columna Resultado en Producción -->
          <div v-if="projectOutcomeRow?.value" class="flex flex-col gap-2 min-w-0">
            <span class="font-mono text-[10.5px] uppercase tracking-[0.14em] text-green">
              {{ tr.detail.outcomeSection }}
            </span>
            <div class="font-sans text-[14px] sm:text-[15px] text-dim leading-[1.62] whitespace-pre-line break-words">
              {{ projectOutcomeRow.value }}
            </div>
          </div>
        </div>

        <!-- Telemetría & Scorecard de Rendimiento Suiza (Minimalista) -->
        <div v-if="projectMetricsRow" class="telemetry-bar pt-4 border-t border-rule/70 flex flex-col gap-3 w-full min-w-0">
          <div class="flex items-center justify-between gap-2 border-b border-rule pb-2 w-full min-w-0">
            <div class="flex items-center gap-2 min-w-0">
              <span class="telemetry-dot w-2 h-2 rounded-full bg-green animate-pulse shrink-0" />
              <span class="font-mono text-[11px] sm:text-[11.5px] font-medium text-ink tracking-wider truncate">{{ tr.detail.telemetrySection }}</span>
            </div>
            <span class="font-mono text-[10.5px] text-faint hidden sm:inline shrink-0">POSTGRESQL 17 · LATENCIA SUB-100MS</span>
          </div>
          <ExplorerValue :cell="projectMetricsRow" name="metrics" />
        </div>

        <!-- Capturas Técnicas & Galería Multimedia -->
        <div v-if="projectMediaRow" class="media-section flex flex-col gap-3 w-full min-w-0">
          <div class="section-title-bar flex items-center justify-between gap-2 border-b border-rule pb-2 w-full min-w-0">
            <span class="font-mono text-[11.5px] font-medium text-ink tracking-wider flex items-center gap-2 min-w-0">
              <span class="w-1.5 h-1.5 rounded-full bg-sig shrink-0" aria-hidden="true" />
              <span class="truncate">{{ tr.detail.gallerySection }}</span>
            </span>
            <span class="font-mono text-[10.5px] text-faint hidden sm:inline shrink-0">{{ isEs ? 'CLICK PARA INSPECCIONAR EN LIGHTBOX' : 'CLICK TO EXPAND IN LIGHTBOX' }}</span>
          </div>
          <ExplorerValue :cell="projectMediaRow" name="media" />
        </div>

        <!-- Proceso de Ingeniería (Taller de Pasos) -->
        <div v-if="projectStepsRow" class="steps-section flex flex-col gap-3 w-full min-w-0">
          <div class="section-title-bar flex items-center justify-between gap-2 border-b border-rule pb-2 w-full min-w-0">
            <span class="font-mono text-[11.5px] font-medium text-ink tracking-wider flex items-center gap-2 min-w-0">
              <span class="w-1.5 h-1.5 rounded-full bg-sig shrink-0" aria-hidden="true" />
              <span class="truncate">{{ tr.detail.workshopSection }}</span>
            </span>
            <span class="font-mono text-[10.5px] text-faint hidden sm:inline shrink-0">{{ isEs ? 'SECUENCIA ITERATIVA' : 'ITERATIVE SEQUENCE' }}</span>
          </div>
          <ExplorerValue :cell="projectStepsRow" name="steps" />
        </div>

        <!-- Arsenal Tecnológico + Diagrama Radial Interactivo -->
        <div v-if="projectTechsRow" class="techs-section p-3.5 sm:p-4 bg-surface/60 border border-rule rounded-xl flex flex-col gap-3 w-full min-w-0">
          <div class="flex items-center justify-between gap-2 border-b border-rule pb-2 w-full min-w-0">
            <span class="font-mono text-[11.5px] font-medium text-ink tracking-wider flex items-center gap-2 min-w-0">
              <span class="w-1.5 h-1.5 rounded-full bg-sig shrink-0" aria-hidden="true" />
              <span class="truncate">{{ tr.detail.stackSection }}</span>
            </span>
            <span class="font-mono text-[10.5px] text-dim hidden sm:inline shrink-0">{{ isEs ? 'TOPOLOGÍA & DEPENDENCIAS' : 'TOPOLOGY & DEPENDENCIES' }}</span>
          </div>
          <div v-if="projectHubNodes.length >= 3" class="hidden sm:flex items-center justify-center py-2 border-b border-rule/60">
            <UiHubDiagram
              :core-label="detail.name.slice(0, 12)"
              :nodes="projectHubNodes"
              :spread="102"
              :height="210"
            />
          </div>
          <div class="flex flex-wrap gap-2 pt-1">
            <template v-for="(it, i) in projectTechsRow.items" :key="i">
              <NuxtLink
                v-if="it.to"
                :to="it.to"
                class="tech-chip font-mono text-[11px] px-2.5 py-1 border border-rule bg-paper/80 text-dim hover:text-ink hover:border-sig/60 hover:-translate-y-0.5 transition-all rounded-md no-underline"
              >
                {{ it.label }}
              </NuxtLink>
            </template>
          </div>
        </div>

        <!-- Cajón Colapsable de Especificaciones Técnicas del Esquema Relacional -->
        <details class="specs-accordion border border-rule bg-surface/60 rounded-xl transition-all w-full min-w-0 overflow-hidden">
          <summary class="p-3 px-3.5 sm:px-4 font-mono text-[11.5px] font-medium text-dim cursor-pointer select-none hover:text-sig flex items-center justify-between gap-2">
            <span class="flex items-center gap-2 min-w-0">
              <AppIcon name="table" :size="12" class="shrink-0" />
              <span class="truncate">{{ tr.detail.specsSection }} ({{ pad(detail.rows.length) }} {{ isEs ? 'CAMPOS' : 'FIELDS' }})</span>
            </span>
            <span class="text-faint text-[10.5px] hidden sm:inline shrink-0">{{ isEs ? 'DESPLEGAR ESQUEMA' : 'EXPAND SCHEMA' }}</span>
          </summary>
          <div class="p-3 sm:p-4 pt-2 border-t border-rule bg-paper/50">
            <dl class="campos flex flex-col border border-rule bg-surface rounded-lg divide-y divide-rule w-full m-0 overflow-hidden">
              <div
                v-for="row in detail.rows"
                :key="row.name"
                class="campo grid grid-cols-1 sm:grid-cols-[minmax(120px,180px)_1fr_auto] p-3 sm:px-3.5 gap-2 sm:gap-3 items-baseline w-full min-w-0"
                :class="{
                  'bg-paper/20': row.name === 'brief' || row.name === 'outcome' || row.name === 'story' || row.name === 'summary',
                }"
              >
                <dt class="nombre font-mono text-[11.5px] sm:text-[12px] text-dim flex items-baseline gap-1 min-w-0 break-words" :title="row.label ? `campo: ${row.name}` : undefined">
                  <span class="nombre-label text-ink font-medium">{{ localizeFieldLabel(row.name, row.label) }}</span>
                  <span v-if="row.label && row.label !== row.name" class="nombre-key text-faint text-[10px]"> · {{ row.name }}</span>
                </dt>
                <dd
                  class="valor min-w-0 font-sans text-[13px] sm:text-[13.5px] text-ink leading-relaxed break-words w-full m-0"
                  :class="{
                    'border-l-2 border-sig pl-2.5 sm:pl-3 text-ink': row.name === 'brief' || row.name === 'outcome' || row.name === 'story' || row.name === 'summary' || row.name === 'note',
                  }"
                >
                  <ExplorerValue :cell="getLocalizedRow(row)" :name="row.name" />
                </dd>
                <dd class="tipo font-mono text-[10.5px] sm:text-[11px] text-faint sm:text-right shrink-0 break-all self-start sm:self-auto m-0">{{ row.type }}</dd>
              </div>
            </dl>
          </div>
        </details>
      </div>

      <!-- 3. Si es EXPERIENCIA y está en modo Dossier Editorial (por defecto) -->
      <div v-else-if="isExperience && !showRawFields" class="dossier-wrap experience-dossier flex flex-col gap-5 sm:gap-6 w-full min-w-0">
        <!-- Hero Bar de la Experiencia (Linear Properties Bar) -->
        <div class="experience-hero-bar w-full p-4 sm:p-5 rounded-xl border border-rule bg-surface/60 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div class="eh-meta flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-mono min-w-0 flex-1">
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="eh-category px-2.5 py-1 font-medium rounded-lg text-[11px] bg-sig/10 text-sig border border-sig/30">
                ● {{ expCategory.label }}
              </span>
              <span v-if="expPeriod" class="eh-pill period px-2.5 py-1 border border-rule bg-paper/80 text-ink font-medium text-[11px] rounded-lg">
                {{ expPeriod }}
              </span>
            </div>
            <span v-if="expOrg" class="eh-pill org px-2.5 py-1 border border-rule bg-paper/80 text-dim text-[11px] rounded-lg max-w-full break-words">
              {{ expOrg }}
            </span>
            <span v-if="expRole" class="eh-pill role px-2.5 py-1 border border-rule bg-paper/80 text-dim text-[11px] rounded-lg max-w-full break-words">
              {{ expRole }}
            </span>
          </div>

          <div v-if="expLinkedProjects.length && expLinkedProjects[0]" class="eh-actions flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
            <NuxtLink
              :to="routeFor(['projects', expLinkedProjects[0].slug])"
              class="eh-btn bg-surface hover:bg-hover text-ink border border-rule hover:border-rule-strong active:scale-[0.98] rounded-md px-3.5 py-2 font-sans text-[12.5px] font-medium no-underline inline-flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
            >
              <span>{{ isEs ? 'VER PROYECTO ASOCIADO' : 'VIEW LINKED PROJECT' }}</span>
              <AppIcon name="external" :size="11" />
            </NuxtLink>
          </div>
        </div>

        <!-- Puntos Clave de Impacto (Highlights KPI Cards) -->
        <div v-if="expHighlights.length" class="exp-highlights-grid grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full min-w-0">
          <div
            v-for="(hl, i) in expHighlights"
            :key="i"
            class="hl-card p-3 sm:px-3.5 bg-surface/60 border border-rule flex flex-col justify-between gap-1 rounded-lg min-w-0"
          >
            <span class="hl-label font-mono text-[9px] sm:text-[10px] text-faint uppercase tracking-wider truncate">{{ hl.label }}</span>
            <span class="hl-value font-mono text-[12px] sm:text-[13px] md:text-[14px] font-bold text-ink break-words leading-tight">{{ hl.value }}</span>
          </div>
        </div>

        <!-- Telemetría & Rendimiento si existen -->
        <div v-if="expMetricsRow" class="telemetry-bar p-3.5 sm:p-4 bg-surface/60 border border-rule rounded-xl flex flex-col gap-2.5 w-full min-w-0">
          <div class="flex items-center justify-between gap-2 border-b border-rule/60 pb-2 w-full min-w-0">
            <div class="flex items-center gap-2 min-w-0">
              <span class="telemetry-dot w-2 h-2 rounded-full bg-green animate-pulse shrink-0" />
              <span class="font-mono text-[11px] sm:text-[11.5px] font-medium text-ink tracking-wider truncate">{{ tr.detail.telemetrySection }}</span>
            </div>
            <span class="font-mono text-[10.5px] text-faint hidden sm:inline shrink-0">POSTGRESQL 17 · LATENCIA SUB-100MS</span>
          </div>
          <ExplorerValue :cell="expMetricsRow" name="metrics" />
        </div>

        <!-- Síntesis de Alcance / Resumen -->
        <UiSpotlightCard
          v-if="expSummaryRow?.value"
          class="summary-lead-card rounded-xl border border-rule bg-surface/60 p-4 sm:p-5 w-full min-w-0"
        >
          <div class="flex items-center gap-2 mb-2">
            <span class="w-1.5 h-1.5 rounded-full bg-sig shrink-0" aria-hidden="true" />
            <span class="font-mono text-[11px] font-medium text-sig uppercase tracking-wider">{{ tr.detail.executiveOverview }}</span>
          </div>
          <p class="m-0 font-sans text-[14.5px] sm:text-[15.5px] text-ink leading-relaxed break-words">
            {{ expSummaryRow.value }}
          </p>
        </UiSpotlightCard>

        <!-- Relato de Aprendizajes e Impacto de Ingeniería -->
        <UiSpotlightCard
          v-if="expStoryRow?.value"
          class="story-section rounded-xl border border-rule bg-surface/60 p-4 sm:p-5 flex flex-col gap-3 w-full min-w-0"
        >
          <div class="flex items-center gap-2 pb-2.5 border-b border-rule w-full min-w-0">
            <span class="w-1.5 h-1.5 rounded-full bg-sig shrink-0" aria-hidden="true" />
            <span class="font-mono text-[11.5px] font-medium text-ink tracking-wider truncate">{{ tr.detail.storySection }}</span>
          </div>
          <div class="story-content font-sans text-[13.5px] sm:text-[14.5px] text-ink leading-relaxed whitespace-pre-line break-words">
            {{ expStoryRow.value }}
          </div>
        </UiSpotlightCard>

        <!-- Arsenal Tecnológico -->
        <div v-if="expTechsRow" class="techs-section p-3.5 sm:p-4 bg-surface/60 border border-rule rounded-xl flex flex-col gap-3 w-full min-w-0">
          <div class="flex items-center justify-between gap-2 border-b border-rule pb-2 w-full min-w-0">
            <span class="font-mono text-[11.5px] font-medium text-ink tracking-wider flex items-center gap-2 min-w-0">
              <span class="w-1.5 h-1.5 rounded-full bg-sig shrink-0" aria-hidden="true" />
              <span class="truncate">{{ tr.detail.stackSection }}</span>
            </span>
            <span class="font-mono text-[10.5px] text-dim hidden sm:inline shrink-0">{{ isEs ? 'TECNOLOGÍAS APLICADAS' : 'APPLIED TECHNOLOGIES' }}</span>
          </div>
          <div class="flex flex-wrap gap-2 pt-1">
            <template v-for="(it, i) in expTechsRow.items" :key="i">
              <NuxtLink
                v-if="it.to"
                :to="it.to"
                class="tech-chip font-mono text-[11px] px-2.5 py-1 border border-rule bg-paper/80 text-dim hover:text-ink hover:border-sig/60 hover:-translate-y-0.5 transition-all rounded-md no-underline"
              >
                {{ it.label }}
              </NuxtLink>
            </template>
          </div>
        </div>

        <!-- Proyecto Relacionado Destacado -->
        <div v-if="expLinkedProjects.length" class="linked-project-box p-4 sm:p-5 bg-surface/60 border border-rule rounded-xl flex flex-col gap-3 w-full min-w-0">
          <div class="flex items-center justify-between gap-2 border-b border-rule pb-2 w-full min-w-0">
            <span class="font-mono text-[11.5px] font-medium text-green tracking-wider flex items-center gap-2 min-w-0">
              <span class="w-1.5 h-1.5 rounded-full bg-green shrink-0" aria-hidden="true" />
              <span class="truncate">{{ tr.detail.relatedProjects }}</span>
            </span>
            <span class="font-mono text-[10.5px] text-faint hidden sm:inline shrink-0">POSTGRESQL 17 RELATION</span>
          </div>

          <div
            v-for="lp in expLinkedProjects"
            :key="lp.slug"
            class="lp-card p-3 sm:p-3.5 bg-paper/80 border border-rule rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0"
          >
            <div class="flex flex-col gap-1 min-w-0 flex-1">
              <div class="flex items-center gap-2 font-mono text-[12px] flex-wrap">
                <span class="font-bold text-ink truncate">{{ lp.title }}</span>
                <span class="text-faint">· {{ lp.year }}</span>
                <span v-if="lp.status" class="text-green text-[11px] font-medium">● {{ lp.status }}</span>
              </div>
              <p v-if="lp.summary" class="m-0 font-sans text-[13px] sm:text-[13.5px] text-dim line-clamp-2 break-words">
                {{ lp.summary }}
              </p>
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <NuxtLink
                :to="routeFor(['projects', lp.slug])"
                class="ph-btn primary bg-ink text-paper hover:opacity-90 active:scale-[0.98] rounded-md px-3.5 py-1.5 font-sans text-[12px] font-medium no-underline inline-flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto"
              >
                <span>{{ isEs ? 'Ver dossier' : 'View dossier' }}</span>
                <AppIcon name="chevron-right" :size="11" />
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Cajón Colapsable de Especificaciones Técnicas del Esquema Relacional -->
        <details class="specs-accordion border border-rule bg-surface/60 rounded-xl transition-all w-full min-w-0 overflow-hidden">
          <summary class="p-3 px-3.5 sm:px-4 font-mono text-[11.5px] font-medium text-dim cursor-pointer select-none hover:text-sig flex items-center justify-between gap-2">
            <span class="flex items-center gap-2 min-w-0">
              <AppIcon name="table" :size="12" class="shrink-0" />
              <span class="truncate">{{ tr.detail.specsSection }} ({{ pad(detail.rows.length) }} {{ isEs ? 'CAMPOS' : 'FIELDS' }})</span>
            </span>
            <span class="text-faint text-[10.5px] hidden sm:inline shrink-0">{{ isEs ? 'DESPLEGAR ESQUEMA' : 'EXPAND SCHEMA' }}</span>
          </summary>
          <div class="p-3 sm:p-4 pt-2 border-t border-rule bg-paper/50">
            <dl class="campos flex flex-col border border-rule bg-surface rounded-lg divide-y divide-rule w-full m-0 overflow-hidden">
              <div
                v-for="row in detail.rows"
                :key="row.name"
                class="campo grid grid-cols-1 sm:grid-cols-[minmax(120px,180px)_1fr_auto] p-3 sm:px-3.5 gap-2 sm:gap-3 items-baseline w-full min-w-0"
                :class="{
                  'bg-paper/20': row.name === 'brief' || row.name === 'outcome' || row.name === 'story' || row.name === 'summary',
                }"
              >
                <dt class="nombre font-mono text-[11.5px] sm:text-[12px] text-dim flex items-baseline gap-1 min-w-0 break-words" :title="row.label ? `campo: ${row.name}` : undefined">
                  <span class="nombre-label text-ink font-medium">{{ localizeFieldLabel(row.name, row.label) }}</span>
                  <span v-if="row.label && row.label !== row.name" class="nombre-key text-faint text-[10px]"> · {{ row.name }}</span>
                </dt>
                <dd
                  class="valor min-w-0 font-sans text-[13px] sm:text-[13.5px] text-ink leading-relaxed break-words w-full m-0"
                  :class="{
                    'border-l-2 border-sig pl-2.5 sm:pl-3 text-ink': row.name === 'brief' || row.name === 'outcome' || row.name === 'story' || row.name === 'summary' || row.name === 'note',
                  }"
                >
                  <ExplorerValue :cell="getLocalizedRow(row)" :name="row.name" />
                </dd>
                <dd class="tipo font-mono text-[10.5px] sm:text-[11px] text-faint sm:text-right shrink-0 break-all self-start sm:self-auto m-0">{{ row.type }}</dd>
              </div>
            </dl>
          </div>
        </details>
      </div>

      <!-- 4. Si es ARTÍCULO / BLOG y está en modo Dossier Editorial (por defecto) -->
      <div v-else-if="isArticle && !showRawFields" class="dossier-wrap article-dossier flex flex-col gap-5 sm:gap-6 w-full min-w-0">
        <!-- Hero Bar del Artículo (Linear Properties Bar) -->
        <div class="article-hero-bar w-full p-4 sm:p-5 rounded-xl border border-rule bg-surface/60 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div class="ah-meta flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-mono min-w-0 flex-1">
            <div class="flex items-center gap-1.5 shrink-0">
              <span
                class="ah-status px-2.5 py-1 font-medium rounded-lg text-[11px]"
                :class="articleStatus === 'PUBLISHED' ? 'text-green border border-green/30 bg-green/10' : 'text-amber border border-amber/30 bg-amber/10'"
              >
                ● {{ articleStatus }}
              </span>
              <span class="ah-pill px-2.5 py-1 border border-rule bg-paper/80 text-dim text-[11px] rounded-lg">
                {{ pad(articleReadingTime) }} MIN READ
              </span>
              <span v-if="articlePublishedAt" class="ah-pill px-2.5 py-1 border border-rule bg-paper/80 text-faint text-[11px] rounded-lg">
                {{ articlePublishedAt }}
              </span>
            </div>
            <span v-if="articleProjectRow?.value" class="ah-pill project px-2.5 py-1 border border-rule bg-paper/80 text-sig font-medium text-[11px] rounded-lg max-w-full break-words">
              PROYECTO: {{ articleProjectRow.value }}
            </span>
          </div>

          <div v-if="articleCanonicalRow?.href" class="ah-actions flex items-center gap-2 w-full md:w-auto shrink-0">
            <a
              :href="articleCanonicalRow.href"
              target="_blank"
              rel="noopener noreferrer"
              class="ph-btn secondary bg-surface hover:bg-hover text-ink border border-rule hover:border-rule-strong active:scale-[0.98] rounded-md px-3.5 py-2 font-sans text-[12.5px] font-medium no-underline inline-flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
            >
              <AppIcon name="external" :size="12" />
              <span>CANONICAL URL</span>
            </a>
          </div>
        </div>

        <!-- Síntesis Ejecutiva Lead -->
        <UiSpotlightCard
          v-if="articleSummaryRow?.value"
          class="summary-lead-card rounded-xl border border-rule bg-surface/60 p-4 sm:p-5 w-full min-w-0"
        >
          <div class="flex items-center gap-2 mb-2">
            <span class="w-1.5 h-1.5 rounded-full bg-sig shrink-0" aria-hidden="true" />
            <span class="font-mono text-[11px] font-medium text-sig uppercase tracking-wider">{{ tr.detail.executiveOverview }}</span>
          </div>
          <p class="m-0 font-sans text-[14.5px] sm:text-[15.5px] text-ink leading-relaxed break-words">
            {{ articleSummaryRow.value }}
          </p>
        </UiSpotlightCard>

        <!-- Tecnologías Relacionadas -->
        <div v-if="articleTechsRow" class="techs-section p-3.5 sm:p-4 bg-surface/60 border border-rule rounded-xl flex flex-col gap-2.5 w-full min-w-0">
          <div class="flex items-center justify-between gap-2 border-b border-rule pb-2 w-full min-w-0">
            <span class="font-mono text-[11.5px] font-medium text-ink tracking-wider flex items-center gap-2 min-w-0">
              <span class="w-1.5 h-1.5 rounded-full bg-sig shrink-0" aria-hidden="true" />
              <span class="truncate">{{ tr.detail.stackSection }}</span>
            </span>
            <span class="font-mono text-[10.5px] text-dim hidden sm:inline shrink-0">STACK APLICADO</span>
          </div>
          <div class="flex flex-wrap gap-2 pt-1">
            <template v-for="(it, i) in articleTechsRow.items" :key="i">
              <NuxtLink
                v-if="it.to"
                :to="it.to"
                class="tech-chip font-mono text-[11px] px-2.5 py-1 border border-rule bg-paper/80 text-dim hover:text-ink hover:border-sig/60 hover:-translate-y-0.5 transition-all rounded-md no-underline"
              >
                {{ it.label }}
              </NuxtLink>
            </template>
          </div>
        </div>

        <!-- Cuerpo del Artículo en Markdown Técnico -->
        <div v-if="articleContentRow?.value" class="article-body-section p-4 sm:p-6 bg-surface/60 border border-rule rounded-xl w-full min-w-0 shadow-sm">
          <ArticleMarkdown :content="String(articleContentRow.value)" />
        </div>

        <!-- Cajón Colapsable de Especificaciones Técnicas del Esquema Relacional -->
        <details class="specs-accordion border border-rule bg-surface/60 rounded-xl transition-all w-full min-w-0 overflow-hidden">
          <summary class="p-3 px-3.5 sm:px-4 font-mono text-[11.5px] font-medium text-dim cursor-pointer select-none hover:text-sig flex items-center justify-between gap-2">
            <span class="flex items-center gap-2 min-w-0">
              <AppIcon name="table" :size="12" class="shrink-0" />
              <span class="truncate">{{ tr.detail.specsSection }} ({{ pad(detail.rows.length) }} {{ isEs ? 'CAMPOS' : 'FIELDS' }})</span>
            </span>
            <span class="text-faint text-[10.5px] hidden sm:inline shrink-0">{{ isEs ? 'DESPLEGAR ESQUEMA' : 'EXPAND SCHEMA' }}</span>
          </summary>
          <div class="p-3 sm:p-4 pt-2 border-t border-rule bg-paper/50">
            <dl class="campos flex flex-col border border-rule bg-surface rounded-lg divide-y divide-rule w-full m-0 overflow-hidden">
              <div
                v-for="row in detail.rows"
                :key="row.name"
                class="campo grid grid-cols-1 sm:grid-cols-[minmax(120px,180px)_1fr_auto] p-3 sm:px-3.5 gap-2 sm:gap-3 items-baseline w-full min-w-0"
              >
                <dt class="nombre font-mono text-[11.5px] sm:text-[12px] text-dim flex items-baseline gap-1 min-w-0 break-words">
                  <span class="nombre-label text-ink font-medium">{{ localizeFieldLabel(row.name, row.label) }}</span>
                  <span v-if="row.label && row.label !== row.name" class="nombre-key text-faint text-[10px]"> · {{ row.name }}</span>
                </dt>
                <dd class="valor min-w-0 font-sans text-[13px] sm:text-[13.5px] text-ink leading-relaxed break-words w-full m-0">
                  <ExplorerValue :cell="getLocalizedRow(row)" :name="row.name" />
                </dd>
                <dd class="tipo font-mono text-[10.5px] sm:text-[11px] text-faint sm:text-right shrink-0 break-all self-start sm:self-auto m-0">{{ row.type }}</dd>
              </div>
            </dl>
          </div>
        </details>
      </div>

      <!-- 5. De lo contrario (o si se activó 'showRawFields'): Renderizar Esquema de Campos Estándar -->
      <template v-else>
        <!-- Barra de Acción Hero de Proyecto (para vista de campos crudos) -->
        <div v-if="isProject" class="project-hero-bar w-full p-4 sm:p-5 rounded-xl border border-rule bg-surface/60 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div class="ph-meta flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-mono min-w-0 flex-1">
            <span class="ph-status text-green font-medium text-[11px] px-2.5 py-1 rounded-lg border border-green/30 bg-green/10 shrink-0">● {{ projectStatus }}</span>
            <span v-if="projectYear" class="ph-pill px-2.5 py-1 border border-rule bg-paper/80 text-dim text-[11px] rounded-lg shrink-0">{{ projectYear }}</span>
            <span v-if="projectOrg" class="ph-pill org px-2.5 py-1 border border-rule bg-paper/80 text-dim text-[11px] rounded-lg max-w-full break-words">{{ projectOrg }}</span>
            <span v-if="projectRole" class="ph-pill role px-2.5 py-1 border border-rule bg-paper/80 text-dim text-[11px] rounded-lg max-w-full break-words">{{ projectRole }}</span>
          </div>

          <div class="ph-actions flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto shrink-0">
            <a
              v-if="projectUrl"
              :href="projectUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="ph-btn primary bg-ink text-paper hover:opacity-90 active:scale-[0.98] rounded-md px-3.5 py-2 font-sans text-[12.5px] font-medium no-underline inline-flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
            >
              <AppIcon name="external" :size="12" />
              <span>{{ isEs ? 'VISITAR SITIO EN VIVO' : 'VISIT LIVE SITE' }}</span>
            </a>
            <a
              v-if="projectRepo"
              :href="projectRepo"
              target="_blank"
              rel="noopener noreferrer"
              class="ph-btn secondary bg-surface hover:bg-hover text-ink border border-rule hover:border-rule-strong active:scale-[0.98] rounded-md px-3.5 py-2 font-sans text-[12.5px] font-medium no-underline inline-flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
            >
              <AppIcon name="code" :size="12" />
              <span>{{ isEs ? 'CÓDIGO FUENTE EN GITHUB' : 'SOURCE CODE ON GITHUB' }}</span>
            </a>
          </div>
        </div>

        <!-- Barra de Acción Rápida de Contacto -->
        <div v-if="isContact" class="contact-hero-bar w-full p-4 sm:p-5 rounded-xl border border-rule bg-surface/60 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div class="ch-info flex flex-col gap-1 min-w-0 flex-1">
            <span class="ch-badge text-green font-mono text-xs font-medium">● {{ isEs ? 'DISPONIBLE · CONTRATACIÓN DIRECTA' : 'AVAILABLE · DIRECT HIRE' }}</span>
            <span class="ch-desc text-dim text-[13px] sm:text-[13.5px] font-sans break-words">{{ isEs ? 'Respondo habitualmente en menos de 24 horas laborables.' : 'I usually respond in less than 24 business hours.' }}</span>
          </div>
          <div class="ch-actions flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
            <button
              type="button"
              class="ch-btn copy group inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 font-mono text-[11px] font-medium no-underline cursor-pointer transition-all duration-150 rounded-md bg-paper/80 border border-rule text-ink hover:bg-hover hover:border-rule-strong"
              :class="{ '!border-green !text-green !bg-green/10': copiedEmail }"
              @click="copyEmail"
            >
              <AppIcon :name="copiedEmail ? 'check' : 'copy'" :size="12" />
              <span>{{ copiedEmail ? (isEs ? '¡EMAIL COPIADO!' : 'EMAIL COPIED!') : (isEs ? 'COPIAR EMAIL DIRECTO' : 'COPY DIRECT EMAIL') }}</span>
            </button>
            <div v-if="emailRow?.value" class="hidden sm:block">
              <UiSlideConfirm
                :label="isEs ? 'Deslizar para redactar' : 'Slide to compose'"
                :confirmed-label="isEs ? 'Abriendo cliente...' : 'Opening mail...'"
                :width="250"
                @confirm="triggerMailto"
              />
            </div>
            <a
              v-if="emailRow?.value"
              :href="`mailto:${emailRow.value}`"
              class="ch-btn primary sm:hidden inline-flex items-center justify-center gap-2 px-3.5 py-2 font-mono text-[11px] font-medium no-underline cursor-pointer transition-all duration-150 rounded-md bg-ink text-paper hover:opacity-90 w-full"
            >
              <AppIcon name="mail" :size="12" />
              <span>{{ isEs ? 'ENVIAR CORREO' : 'SEND EMAIL' }}</span>
              <AppIcon name="external" :size="11" />
            </a>
          </div>
        </div>

        <!-- Lista de Campos Técnicos Estándar -->
        <dl class="campos flex flex-col border border-rule bg-surface rounded-xl divide-y divide-rule w-full m-0 overflow-hidden">
          <div
            v-for="row in detail.rows"
            :key="row.name"
            class="campo grid grid-cols-1 sm:grid-cols-[minmax(120px,180px)_1fr_auto] p-3 sm:px-3.5 gap-2 sm:gap-3 items-baseline w-full min-w-0"
            :class="{
              'bg-paper/20': row.name === 'brief' || row.name === 'outcome' || row.name === 'story' || row.name === 'summary',
            }"
          >
            <dt class="nombre font-mono text-[11.5px] sm:text-[12px] text-dim flex items-baseline gap-1 min-w-0 break-words" :title="row.label ? `campo: ${row.name}` : undefined">
              <span class="nombre-label text-ink font-medium">{{ localizeFieldLabel(row.name, row.label) }}</span>
              <span v-if="row.label && row.label !== row.name" class="nombre-key text-faint text-[10px]"> · {{ row.name }}</span>
            </dt>
            <dd
              class="valor min-w-0 font-sans text-[13px] sm:text-[13.5px] text-ink leading-relaxed break-words w-full m-0"
              :class="{
                'border-l-2 border-sig pl-2.5 sm:pl-3 text-ink': row.name === 'brief' || row.name === 'outcome' || row.name === 'story' || row.name === 'summary' || row.name === 'note',
              }"
            >
              <ExplorerValue :cell="getLocalizedRow(row)" :name="row.name" />
            </dd>
            <dd class="tipo font-mono text-[10.5px] sm:text-[11px] text-faint sm:text-right shrink-0 break-all self-start sm:self-auto m-0">{{ row.type }}</dd>
          </div>
        </dl>
      </template>
    </article>
  </ExplorerFileWindow>
</template>

<style scoped>
.hoja {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px 48px;
  align-content: start;
}

.hoja-acciones {
  display: flex;
  align-items: center;
  gap: 8px;
}

.raw-icon { font-weight: 700; }

.specs-accordion {
  transition: border-color 220ms ease, background-color 220ms ease;
}
.specs-accordion summary {
  list-style: none;
  transition: color 150ms ease;
}
.specs-accordion summary::-webkit-details-marker {
  display: none;
}
.specs-accordion[open] > summary {
  border-bottom: 1px solid var(--d-rule);
}
.specs-accordion[open] > div {
  animation: accordion-expand 280ms cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes accordion-expand {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media screen and (max-width: 768px) {
  .is-about-cv :deep(.cabecera) { display: none !important; }
  .hoja-acciones { flex-wrap: wrap; width: 100%; gap: 8px; }
  .vecinos { width: 100%; justify-content: space-between; }
  .vecino { max-width: none; flex: 1 1 auto; }
}

@media print {
  .hoja-acciones,
  .raw-drawer,
  .vecinos,
  .ph-actions,
  .eh-actions,
  .ah-actions,
  .ch-actions,
  .specs-accordion {
    display: none !important;
  }
}
</style>
