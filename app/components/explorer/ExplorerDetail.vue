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
const copied = ref(false)

const isAbout = computed(() => props.detail.name.toLowerCase() === 'about' || props.detail.type.includes('about'))
const isProject = computed(() => props.detail.type.includes('projects') || props.detail.type.includes('Project'))
const isExperience = computed(() => props.detail.type.includes('experience') || props.detail.type.includes('Experience'))
const isContact = computed(() => props.detail.name.toLowerCase() === 'contact' || props.detail.type.includes('contact'))

const canonicalFilePath = computed(() => {
  const t = props.detail.type.toLowerCase()
  const n = props.detail.name.toLowerCase().replace(/\s+/g, '-')
  if (t.includes('project')) return `file://portfolio/projects/${n}.ts`
  if (t.includes('about')) return `file://portfolio/profile/mateo-cv.md`
  if (t.includes('contact')) return `file://portfolio/contact/channels.json`
  if (t.includes('tech') || t.includes('stack')) return `file://portfolio/stack/${n}.ts`
  if (t.includes('experience')) return `file://portfolio/experience/${n}.ts`
  return `file://portfolio/${n}.json`
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

async function copyJson() {
  try {
    await navigator.clipboard.writeText(jsonContent.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
  catch {
    // Fallback silencioso
  }
}
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
            class="raw-btn inline-flex items-center gap-1.5 h-[30px] px-2.5 border border-rule bg-surface text-dim font-mono text-[12px] font-bold cursor-pointer transition-colors duration-150 hover:border-sig hover:text-sig hover:bg-hover"
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
            class="raw-btn inline-flex items-center gap-1.5 h-[30px] px-2.5 border border-rule bg-surface text-dim font-mono text-[12px] font-bold cursor-pointer transition-colors duration-150 hover:border-sig hover:text-sig hover:bg-hover"
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
            class="raw-btn inline-flex items-center gap-1.5 h-[30px] px-2.5 border border-rule bg-surface text-dim font-mono text-[12px] font-bold cursor-pointer transition-colors duration-150 hover:border-sig hover:text-sig hover:bg-hover"
            :class="{ '!border-sig !text-sig !bg-hover': showRawJson }"
            :title="isEs ? 'Inspeccionar respuesta cruda de la API REST' : 'Inspect raw REST API response'"
            @click="showRawJson = !showRawJson"
          >
            <span class="raw-icon font-black">{ }</span>
            <span>{{ showRawJson ? (isEs ? 'CERRAR JSON' : 'CLOSE JSON') : 'RAW JSON' }}</span>
          </button>

          <!-- Navegación entre vecinos -->
          <nav v-if="prev || next" class="vecinos flex items-center gap-1.5 font-sans text-[13px] flex-wrap max-md:w-full max-md:justify-between" :aria-label="isEs ? 'Registros vecinos' : 'Adjacent records'">
            <NuxtLink v-if="prev" :to="prev.to" class="vecino group inline-flex items-center gap-1.5 max-w-[280px] max-md:max-w-none max-md:flex-1 h-[30px] px-2.5 border border-rule bg-surface text-dim no-underline whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-150 hover:border-sig hover:text-sig hover:bg-hover" rel="prev" :title="isEs ? 'Registro anterior' : 'Previous record'">
              <AppIcon name="chevron-left" :size="11" class="group-hover:text-sig transition-colors duration-150" />
              <span>{{ prev.label }}</span>
            </NuxtLink>
            <span v-else class="vecino off inline-flex items-center gap-1.5 max-w-[280px] max-md:max-w-none max-md:flex-1 h-[30px] px-2.5 border border-rule bg-surface text-faint opacity-50 cursor-default" aria-hidden="true">
              <AppIcon name="chevron-left" :size="11" />
            </span>

            <NuxtLink v-if="next" :to="next.to" class="vecino group inline-flex items-center gap-1.5 max-w-[280px] max-md:max-w-none max-md:flex-1 h-[30px] px-2.5 border border-rule bg-surface text-dim no-underline whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-150 hover:border-sig hover:text-sig hover:bg-hover" rel="next" :title="isEs ? 'Registro siguiente' : 'Next record'">
              <span>{{ next.label }}</span>
              <AppIcon name="chevron-right" :size="11" class="group-hover:text-sig transition-colors duration-150" />
            </NuxtLink>
            <span v-else class="vecino off inline-flex items-center gap-1.5 max-w-[280px] max-md:max-w-none max-md:flex-1 h-[30px] px-2.5 border border-rule bg-surface text-faint opacity-50 cursor-default" aria-hidden="true">
              <AppIcon name="chevron-right" :size="11" />
            </span>
          </nav>
        </div>
      </ExplorerHeader>

      <!-- Drawer de Inspección JSON Crudo -->
      <div v-if="showRawJson" class="raw-drawer bg-surface border border-rule-strong mb-3 overflow-hidden shadow-lg w-full rounded-[2px]">
        <div class="raw-toolbar flex items-center justify-between gap-2 p-2 px-3.5 bg-surface-raised border-b border-rule font-mono text-[11px]">
          <span class="raw-endpoint text-sig font-bold">GET /api/{{ detail.name.toLowerCase().replace(/\s+/g, '-') }}</span>
          <button
            type="button"
            class="copy-btn inline-flex items-center gap-1.5 px-2.5 py-1 border border-rule bg-paper text-dim text-[10.5px] font-bold cursor-pointer transition-colors duration-150 hover:border-sig hover:text-sig"
            :class="{ '!border-sig !text-sig': copied }"
            @click="copyJson"
          >
            <AppIcon :name="copied ? 'check' : 'copy'" :size="12" />
            <span>{{ copied ? (isEs ? '¡COPIADO AL PORTAPAPELES!' : 'COPIED TO CLIPBOARD!') : (isEs ? 'COPIAR PAYLOAD JSON' : 'COPY JSON PAYLOAD') }}</span>
          </button>
        </div>
        <pre class="raw-code m-0 p-3.5 bg-black/70 text-ink font-mono text-[11.5px] leading-relaxed max-h-[360px] max-md:max-h-[260px] overflow-auto"><code>{{ jsonContent }}</code></pre>
      </div>

      <!-- 1. Si es documento About y no está en modo campos: Renderizar CvContainer -->
      <CvContainer v-if="isAbout && !showRawFields" :detail="detail" />

      <!-- 2. Si es PROYECTO y está en modo Dossier Editorial (por defecto) -->
      <div v-else-if="isProject && !showRawFields" class="dossier-wrap project-dossier flex flex-col gap-5 sm:gap-6 w-full min-w-0">
        <!-- Hero Bar del Proyecto -->
        <div class="project-hero-bar w-full p-3.5 sm:p-4 bg-surface border border-rule border-l-4 border-l-sig flex flex-col md:flex-row md:items-center justify-between gap-3.5 rounded-[2px]">
          <div class="ph-meta flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-xs font-mono min-w-0 flex-1">
            <div class="flex items-center gap-1.5 shrink-0">
              <span
                class="ph-status px-2.5 py-1 font-bold rounded-[2px]"
                :class="projectStatus === 'LIVE' ? 'text-green border border-green/30 bg-green/10' : 'text-amber border border-amber/30 bg-amber/10'"
              >
                ● {{ projectStatus === 'LIVE' ? tr.detail.statusLive : tr.detail.statusWip }}
              </span>
              <span v-if="projectYear" class="ph-pill px-2.5 py-1 border border-rule bg-paper text-dim text-[11px] sm:text-[11.5px] rounded-[2px]">{{ projectYear }}</span>
            </div>
            <span v-if="projectOrg" class="ph-pill org px-2.5 py-1 border border-rule bg-paper text-ink font-semibold text-[11px] sm:text-[11.5px] rounded-[2px] max-w-full break-words">{{ projectOrg }}</span>
            <span v-if="projectRole" class="ph-pill role px-2.5 py-1 border border-rule bg-paper text-dim text-[11px] sm:text-[11.5px] rounded-[2px] max-w-full break-words">{{ projectRole }}</span>
          </div>

          <div class="ph-actions flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto shrink-0">
            <a
              v-if="projectUrl"
              :href="projectUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="ph-btn primary inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 font-mono text-[11.5px] sm:text-[12px] font-bold no-underline cursor-pointer transition-all duration-150 rounded-[2px] bg-sig text-on-sig border border-sig hover:bg-sig-hover w-full sm:w-auto min-h-[38px]"
            >
              <AppIcon name="external" :size="12" />
              <span>{{ tr.detail.visitOfficial }}</span>
            </a>
            <a
              v-if="projectRepo"
              :href="projectRepo"
              target="_blank"
              rel="noopener noreferrer"
              class="ph-btn secondary group inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 font-mono text-[11.5px] sm:text-[12px] font-bold no-underline cursor-pointer transition-all duration-150 rounded-[2px] bg-paper text-ink border border-rule-strong hover:bg-hover hover:border-sig hover:text-sig w-full sm:w-auto min-h-[38px]"
            >
              <AppIcon name="code" :size="12" class="group-hover:text-sig transition-colors duration-150" />
              <span>{{ tr.detail.sourceCode }}</span>
            </a>
          </div>
        </div>

        <!-- Telemetría & Scorecard de Rendimiento -->
        <div v-if="projectMetricsRow" class="telemetry-bar p-3.5 sm:p-4 bg-surface border border-rule rounded-[2px] flex flex-col gap-2.5 w-full min-w-0">
          <div class="flex items-center justify-between gap-2 border-b border-rule/60 pb-2 w-full min-w-0">
            <div class="flex items-center gap-2 min-w-0">
              <span class="telemetry-dot w-2 h-2 rounded-full bg-green animate-pulse shrink-0" />
              <span class="font-mono text-[11px] sm:text-[11.5px] font-bold text-ink tracking-wider truncate">{{ tr.detail.telemetrySection }}</span>
            </div>
            <span class="font-mono text-[10.5px] text-faint hidden sm:inline shrink-0">POSTGRESQL 17 · LATENCIA SUB-100MS</span>
          </div>
          <ExplorerValue :cell="projectMetricsRow" name="metrics" />
        </div>

        <!-- Síntesis Ejecutiva Lead -->
        <div v-if="projectSummaryRow?.value" class="summary-lead-card p-4 sm:p-5 bg-surface border-l-4 border-sig border-y border-r border-rule rounded-[2px] w-full min-w-0">
          <span class="font-mono text-[11px] font-bold text-sig uppercase tracking-wider block mb-1.5">{{ tr.detail.executiveOverview }}</span>
          <p class="m-0 font-sans text-[14.5px] sm:text-[15.5px] text-ink leading-relaxed break-words">
            {{ projectSummaryRow.value }}
          </p>
        </div>

        <!-- Split Editorial: El Encargo (Brief) vs Resultado en Producción (Outcome) -->
        <div v-if="projectBriefRow?.value || projectOutcomeRow?.value" class="split-cards grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 w-full min-w-0">
          <!-- Tarjeta Brief -->
          <div v-if="projectBriefRow?.value" class="split-card brief-card p-4 sm:p-5 bg-surface border border-rule border-l-4 border-l-sig rounded-[2px] flex flex-col gap-2.5 min-w-0">
            <div class="sc-header flex items-center gap-2 pb-2 border-b border-rule font-mono text-[11.5px] font-bold text-sig">
              <AppIcon name="file" :size="13" class="shrink-0" />
              <span class="truncate">{{ tr.detail.briefSection }}</span>
            </div>
            <div class="sc-body font-sans text-[13.5px] sm:text-[14px] text-ink leading-relaxed whitespace-pre-line break-words">
              {{ projectBriefRow.value }}
            </div>
          </div>

          <!-- Tarjeta Resultado en Producción -->
          <div v-if="projectOutcomeRow?.value" class="split-card outcome-card p-4 sm:p-5 bg-surface border border-rule border-l-4 border-l-green rounded-[2px] flex flex-col gap-2.5 min-w-0">
            <div class="sc-header flex items-center gap-2 pb-2 border-b border-rule font-mono text-[11.5px] font-bold text-green">
              <AppIcon name="check" :size="13" class="shrink-0" />
              <span class="truncate">{{ tr.detail.outcomeSection }}</span>
            </div>
            <div class="sc-body font-sans text-[13.5px] sm:text-[14px] text-ink leading-relaxed whitespace-pre-line break-words">
              {{ projectOutcomeRow.value }}
            </div>
          </div>
        </div>

        <!-- Capturas Técnicas & Galería Multimedia -->
        <div v-if="projectMediaRow" class="media-section flex flex-col gap-3 w-full min-w-0">
          <div class="section-title-bar flex items-center justify-between gap-2 border-b border-rule pb-2 w-full min-w-0">
            <span class="font-mono text-[11.5px] font-bold text-ink tracking-wider flex items-center gap-2 min-w-0">
              <AppIcon name="grid" :size="12" class="text-sig shrink-0" />
              <span class="truncate">{{ tr.detail.gallerySection }}</span>
            </span>
            <span class="font-mono text-[10.5px] text-faint hidden sm:inline shrink-0">{{ isEs ? 'CLICK PARA INSPECCIONAR EN LIGHTBOX' : 'CLICK TO EXPAND IN LIGHTBOX' }}</span>
          </div>
          <ExplorerValue :cell="projectMediaRow" name="media" />
        </div>

        <!-- Proceso de Ingeniería (Taller de Pasos) -->
        <div v-if="projectStepsRow" class="steps-section flex flex-col gap-3 w-full min-w-0">
          <div class="section-title-bar flex items-center justify-between gap-2 border-b border-rule pb-2 w-full min-w-0">
            <span class="font-mono text-[11.5px] font-bold text-ink tracking-wider flex items-center gap-2 min-w-0">
              <AppIcon name="table" :size="12" class="text-sig shrink-0" />
              <span class="truncate">{{ tr.detail.workshopSection }}</span>
            </span>
            <span class="font-mono text-[10.5px] text-faint hidden sm:inline shrink-0">{{ isEs ? 'SECUENCIA ITERATIVA' : 'ITERATIVE SEQUENCE' }}</span>
          </div>
          <ExplorerValue :cell="projectStepsRow" name="steps" />
        </div>

        <!-- Arsenal Tecnológico -->
        <div v-if="projectTechsRow" class="techs-section p-3.5 sm:p-4 bg-surface border border-rule rounded-[2px] flex flex-col gap-3 w-full min-w-0">
          <div class="flex items-center justify-between gap-2 border-b border-rule pb-2 w-full min-w-0">
            <span class="font-mono text-[11.5px] font-bold text-ink tracking-wider flex items-center gap-2 min-w-0">
              <AppIcon name="code" :size="12" class="text-sig shrink-0" />
              <span class="truncate">{{ tr.detail.stackSection }}</span>
            </span>
            <span class="font-mono text-[10.5px] text-dim hidden sm:inline shrink-0">{{ isEs ? 'TECNOLOGÍAS CLAVE' : 'CORE TECHNOLOGIES' }}</span>
          </div>
          <div class="flex flex-wrap gap-2 pt-1">
            <template v-for="(it, i) in projectTechsRow.items" :key="i">
              <NuxtLink
                v-if="it.to"
                :to="it.to"
                class="tech-chip font-mono text-[11.5px] px-3 py-1.5 border border-rule bg-paper text-ink no-underline hover:border-sig hover:text-sig transition-colors rounded-[2px]"
              >
                {{ it.label }}
              </NuxtLink>
            </template>
          </div>
        </div>

        <!-- Cajón Colapsable de Especificaciones Técnicas del Esquema Relacional -->
        <details class="specs-accordion border border-rule bg-surface rounded-[2px] transition-all w-full min-w-0">
          <summary class="p-3 px-3.5 sm:px-4 font-mono text-[12px] font-bold text-dim cursor-pointer select-none hover:text-sig flex items-center justify-between gap-2">
            <span class="flex items-center gap-2 min-w-0">
              <AppIcon name="table" :size="12" class="shrink-0" />
              <span class="truncate">{{ tr.detail.specsSection }} ({{ pad(detail.rows.length) }} {{ isEs ? 'CAMPOS' : 'FIELDS' }})</span>
            </span>
            <span class="text-faint text-[10.5px] hidden sm:inline shrink-0">{{ isEs ? 'DESPLEGAR ESQUEMA' : 'EXPAND SCHEMA' }}</span>
          </summary>
          <div class="p-3 sm:p-4 pt-2 border-t border-rule bg-paper/50">
            <dl class="campos flex flex-col border border-rule bg-surface divide-y divide-rule w-full m-0">
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
        <!-- Hero Bar de la Experiencia -->
        <div class="experience-hero-bar w-full p-3.5 sm:p-4 bg-surface border border-rule border-l-4 border-l-sig flex flex-col md:flex-row md:items-center justify-between gap-3.5 rounded-[2px]">
          <div class="eh-meta flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-xs font-mono min-w-0 flex-1">
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="eh-category px-2.5 py-1 font-bold rounded-[2px] bg-sig/10 text-sig border border-sig/30">
                ● {{ expCategory.label }}
              </span>
              <span v-if="expPeriod" class="eh-pill period px-2.5 py-1 border border-rule bg-paper text-ink font-bold text-[11px] sm:text-[11.5px] rounded-[2px]">
                {{ expPeriod }}
              </span>
            </div>
            <span v-if="expOrg" class="eh-pill org px-2.5 py-1 border border-rule bg-paper text-dim text-[11px] sm:text-[11.5px] rounded-[2px] max-w-full break-words">
              {{ expOrg }}
            </span>
            <span v-if="expRole" class="eh-pill role px-2.5 py-1 border border-rule bg-paper text-dim text-[11px] sm:text-[11.5px] rounded-[2px] max-w-full break-words">
              {{ expRole }}
            </span>
          </div>

          <div v-if="expLinkedProjects.length && expLinkedProjects[0]" class="eh-actions flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
            <NuxtLink
              :to="routeFor(['projects', expLinkedProjects[0].slug])"
              class="eh-btn group inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 font-mono text-[11.5px] font-bold no-underline cursor-pointer transition-all duration-150 rounded-[2px] bg-paper text-ink border border-rule-strong hover:bg-hover hover:border-sig hover:text-sig w-full sm:w-auto min-h-[38px]"
            >
              <span>{{ isEs ? 'VER PROYECTO ASOCIADO' : 'VIEW LINKED PROJECT' }}</span>
              <AppIcon name="external" :size="11" class="group-hover:text-sig transition-colors" />
            </NuxtLink>
          </div>
        </div>

        <!-- Puntos Clave de Impacto (Highlights KPI Cards) -->
        <div v-if="expHighlights.length" class="exp-highlights-grid grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full min-w-0">
          <div
            v-for="(hl, i) in expHighlights"
            :key="i"
            class="hl-card p-3 sm:px-3.5 bg-surface border border-rule flex flex-col justify-between gap-1 rounded-[2px] min-w-0"
          >
            <span class="hl-label font-mono text-[9px] sm:text-[10px] text-faint uppercase tracking-wider truncate">{{ hl.label }}</span>
            <span class="hl-value font-mono text-[12px] sm:text-[13px] md:text-[14px] font-bold text-ink break-words leading-tight">{{ hl.value }}</span>
          </div>
        </div>

        <!-- Telemetría & Rendimiento si existen -->
        <div v-if="expMetricsRow" class="telemetry-bar p-3.5 sm:p-4 bg-surface border border-rule rounded-[2px] flex flex-col gap-2.5 w-full min-w-0">
          <div class="flex items-center justify-between gap-2 border-b border-rule/60 pb-2 w-full min-w-0">
            <div class="flex items-center gap-2 min-w-0">
              <span class="telemetry-dot w-2 h-2 rounded-full bg-green animate-pulse shrink-0" />
              <span class="font-mono text-[11px] sm:text-[11.5px] font-bold text-ink tracking-wider truncate">{{ tr.detail.telemetrySection }}</span>
            </div>
            <span class="font-mono text-[10.5px] text-faint hidden sm:inline shrink-0">POSTGRESQL 17 · LATENCIA SUB-100MS</span>
          </div>
          <ExplorerValue :cell="expMetricsRow" name="metrics" />
        </div>

        <!-- Síntesis de Alcance / Resumen -->
        <div v-if="expSummaryRow?.value" class="summary-lead-card p-4 sm:p-5 bg-surface border-l-4 border-sig border-y border-r border-rule rounded-[2px] w-full min-w-0">
          <span class="font-mono text-[11px] font-bold text-sig uppercase tracking-wider block mb-1.5">{{ tr.detail.executiveOverview }}</span>
          <p class="m-0 font-sans text-[14.5px] sm:text-[15.5px] text-ink leading-relaxed break-words">
            {{ expSummaryRow.value }}
          </p>
        </div>

        <!-- Relato de Aprendizajes e Impacto de Ingeniería -->
        <div v-if="expStoryRow?.value" class="story-section p-4 sm:p-5 bg-surface border border-rule rounded-[2px] flex flex-col gap-3 w-full min-w-0">
          <div class="flex items-center gap-2 pb-2.5 border-b border-rule w-full min-w-0">
            <AppIcon name="file" :size="13" class="text-sig shrink-0" />
            <span class="font-mono text-[11.5px] font-bold text-ink tracking-wider truncate">{{ tr.detail.storySection }}</span>
          </div>
          <div class="story-content font-sans text-[13.5px] sm:text-[14.5px] text-ink leading-relaxed whitespace-pre-line break-words">
            {{ expStoryRow.value }}
          </div>
        </div>

        <!-- Arsenal Tecnológico -->
        <div v-if="expTechsRow" class="techs-section p-3.5 sm:p-4 bg-surface border border-rule rounded-[2px] flex flex-col gap-3 w-full min-w-0">
          <div class="flex items-center justify-between gap-2 border-b border-rule pb-2 w-full min-w-0">
            <span class="font-mono text-[11.5px] font-bold text-ink tracking-wider flex items-center gap-2 min-w-0">
              <AppIcon name="code" :size="12" class="text-sig shrink-0" />
              <span class="truncate">{{ tr.detail.stackSection }}</span>
            </span>
            <span class="font-mono text-[10.5px] text-dim hidden sm:inline shrink-0">{{ isEs ? 'TECNOLOGÍAS APLICADAS' : 'APPLIED TECHNOLOGIES' }}</span>
          </div>
          <div class="flex flex-wrap gap-2 pt-1">
            <template v-for="(it, i) in expTechsRow.items" :key="i">
              <NuxtLink
                v-if="it.to"
                :to="it.to"
                class="tech-chip font-mono text-[11.5px] px-3 py-1.5 border border-rule bg-paper text-ink no-underline hover:border-sig hover:text-sig transition-colors rounded-[2px]"
              >
                {{ it.label }}
              </NuxtLink>
            </template>
          </div>
        </div>

        <!-- Proyecto Relacionado Destacado -->
        <div v-if="expLinkedProjects.length" class="linked-project-box p-4 sm:p-5 bg-surface border border-rule border-l-4 border-l-green rounded-[2px] flex flex-col gap-3 w-full min-w-0">
          <div class="flex items-center justify-between gap-2 border-b border-rule pb-2 w-full min-w-0">
            <span class="font-mono text-[11.5px] font-bold text-green tracking-wider flex items-center gap-2 min-w-0">
              <AppIcon name="check" :size="13" class="shrink-0" />
              <span class="truncate">{{ tr.detail.relatedProjects }}</span>
            </span>
            <span class="font-mono text-[10.5px] text-faint hidden sm:inline shrink-0">POSTGRESQL 17 RELATION</span>
          </div>

          <div
            v-for="lp in expLinkedProjects"
            :key="lp.slug"
            class="lp-card p-3 sm:p-3.5 bg-paper border border-rule rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0"
          >
            <div class="flex flex-col gap-1 min-w-0 flex-1">
              <div class="flex items-center gap-2 font-mono text-[12px] flex-wrap">
                <span class="font-bold text-ink truncate">{{ lp.title }}</span>
                <span class="text-faint">· {{ lp.year }}</span>
                <span v-if="lp.status" class="text-green text-[11px] font-bold">● {{ lp.status }}</span>
              </div>
              <p v-if="lp.summary" class="m-0 font-sans text-[13px] sm:text-[13.5px] text-dim line-clamp-2 break-words">
                {{ lp.summary }}
              </p>
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <NuxtLink
                :to="routeFor(['projects', lp.slug])"
                class="ph-btn primary inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 font-mono text-[11.5px] font-bold no-underline rounded-[2px] bg-sig text-on-sig border border-sig hover:bg-sig-hover w-full sm:w-auto min-h-[34px]"
              >
                <span>{{ isEs ? 'VER DOSSIER' : 'VIEW DOSSIER' }}</span>
                <AppIcon name="chevron-right" :size="11" />
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Cajón Colapsable de Especificaciones Técnicas del Esquema Relacional -->
        <details class="specs-accordion border border-rule bg-surface rounded-[2px] transition-all w-full min-w-0">
          <summary class="p-3 px-3.5 sm:px-4 font-mono text-[12px] font-bold text-dim cursor-pointer select-none hover:text-sig flex items-center justify-between gap-2">
            <span class="flex items-center gap-2 min-w-0">
              <AppIcon name="table" :size="12" class="shrink-0" />
              <span class="truncate">{{ tr.detail.specsSection }} ({{ pad(detail.rows.length) }} {{ isEs ? 'CAMPOS' : 'FIELDS' }})</span>
            </span>
            <span class="text-faint text-[10.5px] hidden sm:inline shrink-0">{{ isEs ? 'DESPLEGAR ESQUEMA' : 'EXPAND SCHEMA' }}</span>
          </summary>
          <div class="p-3 sm:p-4 pt-2 border-t border-rule bg-paper/50">
            <dl class="campos flex flex-col border border-rule bg-surface divide-y divide-rule w-full m-0">
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

      <!-- 4. De lo contrario (o si se activó 'showRawFields'): Renderizar Esquema de Campos Estándar -->
      <template v-else>
        <!-- Barra de Acción Hero de Proyecto (para vista de campos crudos) -->
        <div v-if="isProject" class="project-hero-bar w-full p-3.5 sm:p-4 bg-surface border border-rule border-l-4 border-l-sig flex flex-col md:flex-row md:items-center justify-between gap-3.5 rounded-[2px]">
          <div class="ph-meta flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-xs font-mono min-w-0 flex-1">
            <span class="ph-status text-green font-bold shrink-0">● {{ projectStatus }}</span>
            <span v-if="projectYear" class="ph-pill px-2.5 py-1 border border-rule bg-paper text-dim text-[11px] sm:text-[11.5px] rounded-[2px] shrink-0">{{ projectYear }}</span>
            <span v-if="projectOrg" class="ph-pill org px-2.5 py-1 border border-rule bg-paper text-dim text-[11px] sm:text-[11.5px] rounded-[2px] max-w-full break-words">{{ projectOrg }}</span>
            <span v-if="projectRole" class="ph-pill role px-2.5 py-1 border border-rule bg-paper text-dim text-[11px] sm:text-[11.5px] rounded-[2px] max-w-full break-words">{{ projectRole }}</span>
          </div>

          <div class="ph-actions flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto shrink-0">
            <a
              v-if="projectUrl"
              :href="projectUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="ph-btn primary inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 font-mono text-[11.5px] sm:text-[12px] font-bold no-underline cursor-pointer transition-all duration-150 rounded-[2px] bg-sig text-on-sig border border-sig hover:bg-sig-hover w-full sm:w-auto min-h-[38px]"
            >
              <AppIcon name="external" :size="12" />
              <span>{{ isEs ? 'VISITAR SITIO EN VIVO' : 'VISIT LIVE SITE' }}</span>
            </a>
            <a
              v-if="projectRepo"
              :href="projectRepo"
              target="_blank"
              rel="noopener noreferrer"
              class="ph-btn secondary group inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 font-mono text-[11.5px] sm:text-[12px] font-bold no-underline cursor-pointer transition-all duration-150 rounded-[2px] bg-paper text-ink border border-rule-strong hover:bg-hover hover:border-sig hover:text-sig w-full sm:w-auto min-h-[38px]"
            >
              <AppIcon name="code" :size="12" class="group-hover:text-sig transition-colors duration-150" />
              <span>{{ isEs ? 'CÓDIGO FUENTE EN GITHUB' : 'SOURCE CODE ON GITHUB' }}</span>
            </a>
          </div>
        </div>

        <!-- Barra de Acción Rápida de Contacto -->
        <div v-if="isContact" class="contact-hero-bar w-full p-3.5 sm:p-4 bg-surface border border-rule border-l-4 border-l-green flex flex-col md:flex-row md:items-center justify-between gap-3.5 rounded-[2px]">
          <div class="ch-info flex flex-col gap-1 min-w-0 flex-1">
            <span class="ch-badge text-green font-mono text-xs font-bold">● {{ isEs ? 'DISPONIBLE // CONTRATACIÓN DIRECTA' : 'AVAILABLE // DIRECT HIRE' }}</span>
            <span class="ch-desc text-dim text-[13px] sm:text-[13.5px] font-sans break-words">{{ isEs ? 'Respondo habitualmente en menos de 24 horas laborables.' : 'I usually respond in less than 24 business hours.' }}</span>
          </div>
          <div class="ch-actions flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
            <button
              type="button"
              class="ch-btn copy group inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 font-mono text-[11.5px] font-bold no-underline cursor-pointer transition-all duration-150 rounded-[2px] bg-paper border border-rule-strong text-ink hover:bg-hover hover:border-sig hover:text-sig w-full sm:w-auto min-h-[38px]"
              :class="{ '!border-green !text-green !bg-green/10': copiedEmail }"
              @click="copyEmail"
            >
              <AppIcon :name="copiedEmail ? 'check' : 'copy'" :size="12" class="group-hover:text-sig transition-colors duration-150" />
              <span>{{ copiedEmail ? (isEs ? '¡EMAIL COPIADO!' : 'EMAIL COPIED!') : (isEs ? 'COPIAR EMAIL DIRECTO' : 'COPY DIRECT EMAIL') }}</span>
            </button>
            <a
              v-if="emailRow?.value"
              :href="`mailto:${emailRow.value}`"
              class="ch-btn primary inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 font-mono text-[11.5px] font-bold no-underline cursor-pointer transition-all duration-150 rounded-[2px] bg-green text-white border border-green hover:bg-[#047857] w-full sm:w-auto min-h-[38px]"
            >
              <AppIcon name="mail" :size="12" />
              <span>{{ isEs ? 'ENVIAR CORREO' : 'SEND EMAIL' }}</span>
              <AppIcon name="external" :size="11" />
            </a>
          </div>
        </div>

        <!-- Lista de Campos Técnicos Estándar -->
        <dl class="campos flex flex-col border border-rule bg-surface divide-y divide-rule w-full m-0">
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
  gap: 10px;
}

.raw-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  color: var(--d-dim);
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--d-dur) ease;
}
.raw-btn:hover, .raw-btn.active {
  border-color: var(--d-sig);
  color: var(--d-sig);
  background: var(--d-hover);
}
.raw-icon { font-weight: 900; }

.vecinos { display: flex; align-items: center; gap: 6px; font-family: var(--font-text); font-size: var(--d-fs-ui); flex-wrap: wrap; }
.vecino {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 280px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  color: var(--d-dim);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all var(--d-dur) ease;
}
.vecino:hover { border-color: var(--d-sig); color: var(--d-sig); background: var(--d-hover); }
.vecino.off { color: var(--d-faint); opacity: 0.5; cursor: default; }

/* ─── Drawer JSON Crudo ────────────────────────────────────────────────────── */
.raw-drawer {
  background: var(--d-surface);
  border: 1px solid var(--d-rule-strong);
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  width: 100%;
}
.raw-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: var(--d-surface-raised);
  border-bottom: 1px solid var(--d-rule);
}
.raw-endpoint {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-sig);
  font-weight: 700;
}
.copy-btn {
  background: none;
  border: 1px solid var(--d-rule);
  color: var(--d-ink);
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all var(--d-dur) ease;
}
.copy-btn:hover {
  border-color: var(--d-sig);
  color: var(--d-sig);
}
.raw-code {
  margin: 0;
  padding: 14px 16px;
  max-height: 360px;
  overflow: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
  color: var(--d-ink);
  background: var(--d-paper);
}

.summary-lead-card {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.specs-accordion summary {
  list-style: none;
}
.specs-accordion summary::-webkit-details-marker {
  display: none;
}

@media screen and (max-width: 768px) {
  .is-about-cv :deep(.cabecera) { display: none !important; }
  .hoja-acciones { flex-wrap: wrap; width: 100%; gap: 8px; }
  .vecinos { width: 100%; justify-content: space-between; }
  .vecino { max-width: none; flex: 1 1 auto; }
  .raw-code { max-height: 260px; font-size: 11px; }
}
</style>
