<script setup lang="ts">
// Una carpeta abierta: la base con sus tablas, o una colección con sus registros.
// Ofrece selector de vista (Baldosas en cuadrícula ☷ vs. Tabla técnica ☰),
// facets de filtrado activo y acceso directo por teclado.
import ExplorerHeader from './ExplorerHeader.vue'
import AppIcon from '~/components/ui/AppIcon.vue'
import ExplorerBadge from './ExplorerBadge.vue'
import UiBenchShowcase from '~/components/ui/UiBenchShowcase.vue'
import UiCodeReveal from '~/components/ui/UiCodeReveal.vue'
import UiCopyPill from '~/components/ui/UiCopyPill.vue'
import UiCursorWorkList, { type CursorWorkItem } from '~/components/ui/UiCursorWorkList.vue'
import UiDotGlobe from '~/components/ui/UiDotGlobe.vue'
import UiHoloCard from '~/components/ui/UiHoloCard.vue'
import UiHubDiagram from '~/components/ui/UiHubDiagram.vue'
import UiMagneticDots from '~/components/ui/UiMagneticDots.vue'
import UiRollingCounter from '~/components/ui/UiRollingCounter.vue'
import UiSegmentedSwitch from '~/components/ui/UiSegmentedSwitch.vue'
import UiSpotlightCard from '~/components/ui/UiSpotlightCard.vue'
import UiSweepButton from '~/components/ui/UiSweepButton.vue'
import UiTextBlurReveal from '~/components/ui/UiTextBlurReveal.vue'
import { pad, type Folder } from '~/lib/explorer'
import type { Project } from '~/lib/api'
import { routeFor } from '~/lib/path'

const props = defineProps<{ folder: Folder }>()
const uid = useId()

const route = useRoute()
const { isEs, tr, getProjectLocalization, getExperienceLocalization } = usePortfolioLocale()
const { isHyperfocus } = useHyperfocus()
const viewMode = ref<'grid' | 'table' | 'timeline'>(props.folder.head === 'experience' ? 'timeline' : 'grid')

const viewOptions = computed(() => {
  const opts = [
    { value: 'grid', label: tr.value.collection.grid },
    { value: 'table', label: tr.value.collection.table },
  ]
  if (props.folder.head === 'experience') {
    opts.unshift({ value: 'timeline', label: tr.value.collection.timeline })
  }
  return opts
})

watch(() => props.folder.head, (head) => {
  if (isHyperfocus.value) {
    viewMode.value = 'table'
  }
  else if (head === 'experience') {
    viewMode.value = 'timeline'
  }
  else {
    viewMode.value = 'grid'
  }
})

watch(isHyperfocus, (val) => {
  if (val) {
    viewMode.value = 'table'
  }
  else if (props.folder.head === 'experience') {
    viewMode.value = 'timeline'
  }
  else {
    viewMode.value = 'grid'
  }
}, { immediate: true })

const activeStatusFilter = computed(() => {
  const s = route.query.status
  return typeof s === 'string' ? s : null
})
const hasStatusFilter = computed(() => !!activeStatusFilter.value)
const isStatusLive = computed(() => activeStatusFilter.value === 'LIVE')
const isStatusWip = computed(() => activeStatusFilter.value === 'WIP')

function formatExpPeriod(it: Folder['items'][number]): string {
  const exp = props.folder.experience?.find(e => e.slug === it.key)
  if (exp?.startedAt) {
    const sDate = new Date(exp.startedAt)
    const sYear = sDate.getFullYear()
    if (!exp.endedAt) {
      return isEs.value ? `${sYear} — Presente` : `${sYear} — Present`
    }
    const eDate = new Date(exp.endedAt)
    const eYear = eDate.getFullYear()
    if (sYear === eYear) {
      const sMonth = sDate.toLocaleDateString(isEs.value ? 'es-ES' : 'en-US', { month: 'short' })
      const eMonth = eDate.toLocaleDateString(isEs.value ? 'es-ES' : 'en-US', { month: 'short' })
      return `${sMonth} — ${eMonth} ${sYear}`
    }
    return `${sYear} — ${eYear}`
  }
  if (it.key === 'cet-30') return isEs.value ? '2017 — 2023 · 7 Años' : '2017 — 2023 · 7 Years'
  if (it.key === 'escuela-da-vinci') return isEs.value ? '2024 — 2026 · Carrera' : '2024 — 2026 · Degree'
  if (it.key === 'freelance') return isEs.value ? '2023 — Presente' : '2023 — Present'
  return it.meta
}

function getExpCategory(key: string): { label: string, color: string } {
  if (key === 'ynara') return { label: isEs.value ? 'TESIS & LIDERAZGO' : 'THESIS & LEAD', color: 'text-sig' }
  if (key === 'la-rucula' || key === 'arg-piscinas') return { label: isEs.value ? 'PRODUCCIÓN CLIENTE' : 'CLIENT PRODUCTION', color: 'text-green' }
  if (key === 'freelance') return { label: isEs.value ? 'FREELANCE & TURNKEY' : 'FREELANCE & TURNKEY', color: 'text-amber' }
  return { label: isEs.value ? 'FORMACIÓN TÉCNICA' : 'TECHNICAL EDUCATION', color: 'text-dim' }
}

function getExpHighlights(key: string): string[] {
  if (key === 'ynara') return isEs.value ? ['382 commits liderados', 'Tesis preaprobada Da Vinci', 'pgvector'] : ['382 commits led', 'Pre-approved thesis', 'pgvector']
  if (key === 'la-rucula') return isEs.value ? ['Lighthouse 99', 'En producción en Chiclana', 'Vue 3 + GSAP'] : ['Lighthouse 99', 'Live production in Chiclana', 'Vue 3 + GSAP']
  if (key === 'arg-piscinas') return isEs.value ? ['Lighthouse 98', 'Multi-idioma ES/EN/DE', 'Panel Prisma'] : ['Lighthouse 98', 'Multilingual ES/EN/DE', 'Prisma CMS']
  if (key === 'cet-30') return isEs.value ? ['7 Años de formación', 'Título de Técnico en Programación', 'Bases de bajo nivel'] : ['7-Year technical basis', 'Official programming degree', 'Low-level foundations']
  if (key === 'freelance') return isEs.value ? ['~10 Entregables llave en mano', 'Stack full-cycle', 'Directo a producción'] : ['~10 Turnkey deliverables', 'Full-cycle stack', 'Direct to production']
  if (key === 'escuela-da-vinci') return isEs.value ? ['Promoción 2026', 'Tesis sobresaliente', 'Dirección visual & frontend'] : ['2026 Class', 'Honors thesis', 'Visual direction & frontend']
  return []
}

function getExpLinkedProject(key: string): { slug: string, title: string } | null {
  const p = props.folder.projects?.find(proj => proj.slug === key || (key === 'arg-piscinas' && proj.slug === 'argpiscinas'))
  if (p) return { slug: p.slug, title: p.title }
  if (key === 'ynara') return { slug: 'ynara', title: 'Ynara AI Assistant' }
  if (key === 'la-rucula') return { slug: 'la-rucula', title: 'La Rúcula Gastrobar' }
  if (key === 'arg-piscinas') return { slug: 'argpiscinas', title: 'ARG Piscinas' }
  return null
}

// Extracción dinámica de campos del documento 'home' desde PostgreSQL / API
function getHomeField(name: string): string | null {
  const f = (props.folder.homeDoc?.fields as Array<{ name: string, value: string }> | undefined)?.find(field => field.name === name)
  return f ? String(f.value) : null
}

const homeHeadlineWords = computed(() => {
  if (isEs.value) {
    const raw = getHomeField('headline')
    if (raw) {
      const parts = raw.split(' ').filter(Boolean)
      if (parts.length >= 3) return [parts[0]!, parts[1]!, parts.slice(2).join(' ')]
    }
  }
  return tr.value.home.headline
})

// 1. Scramble Text interactivo en el titular constructivista
const { displayText: headline1, scramble: scramble1 } = useScrambleText(computed(() => homeHeadlineWords.value[0] ?? ''), 300)
const { displayText: headline2, scramble: scramble2 } = useScrambleText(computed(() => homeHeadlineWords.value[1] ?? ''), 220)
const { displayText: headline3, scramble: scramble3 } = useScrambleText(computed(() => homeHeadlineWords.value[2] ?? ''), 360)

const homeAboutText = computed(() => (isEs.value ? (getHomeField('about_text') ?? tr.value.home.aboutText) : tr.value.home.aboutText))
const homeProfileRole = computed(() => (isEs.value ? (getHomeField('profile_role') ?? tr.value.home.profileRole) : tr.value.home.profileRole))
const homeProfileStatus = computed(() => {
  const raw = isEs.value ? (getHomeField('profile_status') ?? tr.value.home.profileStatus) : tr.value.home.profileStatus
  return String(raw).replace(/^[●•·\s]+/, '')
})

const projectCounts = computed(() => {
  const list = props.folder.projects && props.folder.projects.length ? props.folder.projects : props.folder.items
  const all = list.length
  const live = list.filter((p: { status?: string }) => p.status === 'LIVE').length
  const wip = list.filter((p: { status?: string }) => p.status === 'WIP').length
  return {
    all: pad(all),
    live: pad(live),
    wip: pad(wip),
  }
})

const projectCountBadge = computed(() => {
  const count = props.folder.projects?.length ?? Number(props.folder.items?.find(i => i.key === 'projects')?.badge ?? 6)
  return pad(isNaN(count) ? 6 : count)
})

const getCount = (key: string, fallbackNum: number) => {
  const c = props.folder.schemaCounts?.[key] ?? props.folder.items?.find(i => i.key === key)?.badge
  const parsed = typeof c === 'number' ? c : (c ? Number(c) : fallbackNum)
  return isNaN(parsed) ? pad(fallbackNum) : pad(parsed)
}

const bentoStackList = computed(() => {
  const defaults = [
    'VUE 3 / NUXT 4', 'TYPESCRIPT', 'REACT / NEXT.JS', 'PYTHON / FASTAPI',
    'POSTGRESQL 17 ACID', 'PRISMA ORM', 'GSAP & LENIS', 'TAILWIND CSS', 'DOCKER & CI/CD'
  ]
  if (props.folder.projects && props.folder.projects.length) {
    const techSet = new Set<string>()
    for (const p of props.folder.projects) {
      if (p.techs) {
        for (const t of p.techs) techSet.add(t.name.toUpperCase())
      }
    }
    if (techSet.size >= 6) return Array.from(techSet).slice(0, 9)
  }
  return defaults
})

function scrambleHeadline() {
  scramble1()
  scramble2()
  scramble3()
}

onMounted(() => {
  if (import.meta.client) {
    setTimeout(scrambleHeadline, 150)
  }
})

// 2. Matriz maestra de proyectos para vista hiperfoco
const masterProjects = computed(() => {
  if (props.folder.projects && props.folder.projects.length > 0) {
    return props.folder.projects.map((p: Project) => {
      const loc = getProjectLocalization(p.slug)
      return {
        slug: p.slug,
        title: p.title,
        year: String(p.year),
        status: p.status,
        role: isEs.value ? p.role : (p.role.includes('diseño y desarrollo') ? 'Freelance · Design & Engineering' : p.role),
        summary: isEs.value ? (p.summary || loc?.summary || '') : (loc?.summary || p.summary || ''),
        stack: p.techs ? p.techs.map((t: { name: string }) => t.name) : [],
        metrics: typeof p.metrics === 'object' && p.metrics
          ? Object.entries(p.metrics).map(([k, v]) => `${k} ${v}`).join(' · ')
          : (typeof p.metrics === 'string' ? p.metrics : (isEs.value ? 'Lighthouse 98+' : 'Lighthouse 98+')),
        url: p.url,
        repo: p.repo,
        to: `/projects/${p.slug}`,
      }
    })
  }

  return [
    {
      slug: 'la-rucula',
      title: 'La Rúcula Gastrobar',
      year: '2026',
      status: 'LIVE',
      role: isEs.value ? 'Freelance · Diseño y Desarrollo' : 'Freelance · Design & Engineering',
      summary: isEs.value ? 'Sitio editorial menu-first para restaurante frente al mar en Chiclana.' : (getProjectLocalization('la-rucula')?.summary ?? 'Editorial menu-first website for a beachfront restaurant in Chiclana.'),
      stack: ['Vue 3', 'Tailwind', 'GSAP', 'Vite'],
      metrics: 'Lighthouse 99 · 42 KB',
      url: 'https://laruculagastrobar.es/',
      repo: 'https://github.com/MateoGs013/LaRucula',
      to: '/projects/la-rucula',
    },
    {
      slug: 'argpiscinas',
      title: 'ARG Piscinas',
      year: '2026',
      status: 'LIVE',
      role: isEs.value ? 'Freelance · Front y Back a Medida' : 'Freelance · Custom Full Stack',
      summary: isEs.value ? 'Web corporativa multi-idioma con panel admin y blog para constructora de piscinas en Andalucía.' : (getProjectLocalization('argpiscinas')?.summary ?? 'Multilingual corporate website with admin panel and blog for a pool builder in Andalusia.'),
      stack: ['Vue 3', 'Node.js', 'Prisma', 'Tailwind'],
      metrics: 'Lighthouse 98 · ES/EN/DE',
      url: 'https://www.argpiscinas.es/',
      repo: 'https://github.com/MateoGs013/argpiscinas',
      to: '/projects/argpiscinas',
    },
    {
      slug: 'ynara',
      title: 'Ynara AI Assistant',
      year: '2026',
      status: 'WIP',
      role: isEs.value ? 'Tesis Da Vinci · Lead Frontend y Arquitecto' : 'Da Vinci Thesis · Lead Frontend & Architect',
      summary: isEs.value ? 'Asistente de IA adaptativo on-premise con memoria vectorial sobre Postgres y pgvector.' : (getProjectLocalization('ynara')?.summary ?? 'Adaptive on-premise AI assistant with vector memory over Postgres and pgvector.'),
      stack: ['FastAPI', 'Next.js', 'PostgreSQL', 'pgvector'],
      metrics: '382 commits · <100ms local',
      url: null,
      repo: 'https://github.com/MateoGs013/Ynara-Web',
      to: '/projects/ynara',
    },
    {
      slug: 'barberpole',
      title: 'Barberpole SaaS',
      year: '2025',
      status: 'LIVE',
      role: isEs.value ? 'Producto propio · Diseño y desarrollo MERN' : 'Proprietary product · MERN design & dev',
      summary: isEs.value ? 'SaaS de gestión para peluquerías y barberías: turnos, clientes y caja en tiempo real.' : (getProjectLocalization('barberpole')?.summary ?? 'Management SaaS for barbershops: bookings, clients, and revenue tracking in realtime.'),
      stack: ['React', 'Node.js', 'Express', 'MongoDB'],
      metrics: isEs.value ? 'Multi-negocio · Tiempo real' : 'Multi-tenant · Realtime',
      url: null,
      repo: 'https://github.com/MateoGs013/barberpole-saas',
      to: '/projects/barberpole',
    },
    {
      slug: 'ynara-web',
      title: 'Ynara WebGL',
      year: '2026',
      status: 'WIP',
      role: isEs.value ? 'Landing inmersiva · Diseño y shaders' : 'Immersive landing · Design & shaders',
      summary: isEs.value ? 'Landing inmersiva WebGL para Ynara con shader procedimental reactivo al scroll.' : (getProjectLocalization('ynara-web')?.summary ?? 'Immersive WebGL landing page for Ynara with procedural shader reacting to scroll.'),
      stack: ['Three.js', 'GSAP', 'Next.js', 'GLSL'],
      metrics: '60 FPS · 4 Draw Calls',
      url: null,
      repo: 'https://github.com/MateoGs013/Ynara-Web',
      to: '/projects/ynara-web',
    },
    {
      slug: 'eros',
      title: 'Eros Creative Engine',
      year: '2026',
      status: 'WIP',
      role: isEs.value ? 'Arquitectura de Sistema · IA Asistida' : 'System Architecture · AI-assisted',
      summary: isEs.value ? 'Director creativo asistido por IA con base de conocimiento en un vault de Obsidian.' : (getProjectLocalization('eros')?.summary ?? 'AI-assisted creative director with knowledge base rooted in an Obsidian vault.'),
      stack: ['Python', 'Vue', 'Obsidian', 'LLM Agents'],
      metrics: '1,420 Notes · 850 Nodes',
      url: null,
      repo: 'https://github.com/MateoGs013/eros',
      to: '/projects/eros',
    },
  ]
})

// 2.1 Proyectos destacados para Selected Work
const selectedWorkProjects = computed(() => {
  if (props.folder.projects && props.folder.projects.length > 0) {
    const featured = props.folder.projects.filter((p: Project) => p.featured)
    const list = featured.length ? featured : props.folder.projects.slice(0, 3)
    return list.map((p: Project, idx: number) => {
      const coverMedia = p.media?.find((m: { role: string, src: string }) => m.role === 'COVER')
      const cover = coverMedia?.src ?? `/media/projects/${p.slug}.jpg`
      const loc = getProjectLocalization(p.slug)
      return {
        idx: pad(idx + 1),
        slug: p.slug,
        title: p.title,
        to: `/projects/${p.slug}`,
        cover,
        status: p.status,
        year: String(p.year),
        orgDesc: isEs.value
          ? (p.org?.name ? `${p.org.name}${p.org.city ? ` · ${p.org.city}` : ''}` : (loc?.orgDesc ?? ''))
          : (loc?.orgDesc ?? (p.org?.name ? `${p.org.name}${p.org.city ? ` · ${p.org.city}` : ''}` : '')),
        summary: isEs.value ? (p.summary || loc?.summary || '') : (loc?.summary || p.summary || ''),
        chips: p.techs ? p.techs.slice(0, 4).map((t: { name: string }) => t.name) : [],
      }
    })
  }

  return [
    {
      idx: '01',
      slug: 'la-rucula',
      title: 'La Rúcula Gastrobar',
      to: '/projects/la-rucula',
      cover: '/media/projects/la-rucula.jpg',
      status: 'LIVE',
      year: '2026',
      orgDesc: isEs.value ? 'Restauración & Gastronomía · Chiclana de la Frontera, ES' : (getProjectLocalization('la-rucula')?.orgDesc ?? 'Dining & Hospitality · Spain'),
      summary: isEs.value ? 'Sitio editorial menu-first optimizado para escaneo QR en mesa. Lighthouse 99 en Performance y 100 en SEO. En producción.' : (getProjectLocalization('la-rucula')?.summary ?? 'Editorial menu-first website optimized for QR scanning at tables.'),
      chips: ['Vue 3', 'Vite', 'Tailwind CSS', 'GSAP'],
    },
    {
      idx: '02',
      slug: 'argpiscinas',
      title: 'ARG Piscinas',
      to: '/projects/argpiscinas',
      cover: '/media/projects/argpiscinas.jpg',
      status: 'LIVE',
      year: '2026',
      orgDesc: isEs.value ? 'Arquitectura & Construcción · Andalucía, ES' : (getProjectLocalization('argpiscinas')?.orgDesc ?? 'Architecture & Construction · Spain'),
      summary: isEs.value ? 'Plataforma corporativa multi-idioma (ES/EN/DE) con panel autónomo para carga de obras. Tipado integral con Prisma y Node.js.' : (getProjectLocalization('argpiscinas')?.summary ?? 'Multilingual corporate platform with autonomous admin panel.'),
      chips: ['Vue 3', 'Node.js', 'Prisma', 'Tailwind CSS'],
    },
    {
      idx: '03',
      slug: 'ynara',
      title: 'Ynara',
      to: '/projects/ynara',
      cover: '/media/projects/ynara-mtucqc2j.png',
      status: 'WIP',
      year: '2026',
      orgDesc: isEs.value ? 'Tesis Da Vinci (Preaprobada 2026) · 382 commits' : (getProjectLocalization('ynara')?.orgDesc ?? 'Da Vinci Thesis · 382 commits'),
      summary: isEs.value ? 'Asistente de IA adaptativo on-premise, con memoria cifrada vectorial sobre Postgres y pgvector.' : (getProjectLocalization('ynara')?.summary ?? 'Adaptive on-premise AI assistant with encrypted vector memory.'),
      chips: ['FastAPI', 'Next.js', 'PostgreSQL', 'Python'],
    },
  ]
})

const selectedWorkMode = ref<'reel' | 'grid'>('reel')

const cursorWorkProjects = computed<CursorWorkItem[]>(() => {
  return selectedWorkProjects.value.map(p => ({
    slug: p.slug,
    num: p.idx,
    title: p.title,
    role: p.orgDesc || (isEs.value ? 'Ingeniería y Dirección' : 'Engineering & Direction'),
    year: p.year,
    status: p.status,
    cover: p.cover,
    to: p.to,
    chips: p.chips,
    orgDesc: p.orgDesc,
    summary: p.summary,
  }))
})

function openExternal(url?: string | null) {
  if (!url || !import.meta.client) return
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <section class="carpeta" :aria-labelledby="uid">
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 1. MODO HIPERFOCO: DOSSIER EJECUTIVO DE ALTA DENSIDAD                   -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div v-if="folder.head === 'db' && isHyperfocus" key="db-hyperfocus" class="hiperfoco-dossier">
      <!-- Encabezado de Identidad y Contacto Centrado -->
      <header class="hd-header">
        <div class="hd-badge-row">
          <span class="hd-status">{{ isEs ? 'DISPONIBLE // CONTRATACIÓN DIRECTA 2026' : 'AVAILABLE // DIRECT HIRE 2026' }}</span>
          <span class="hd-sep">·</span>
          <span class="hd-loc">PATAGONIA, AR · UTC-3</span>
        </div>

        <h1 class="hd-name">Mateo Gabriel Sonzogni</h1>
        <p class="hd-role">{{ isEs ? 'Desarrollador Frontend & Full Stack · Creative Developer' : 'Frontend & Full Stack Developer · Creative Developer' }}</p>

        <nav class="hd-contact-bar" :aria-label="isEs ? 'Canales directos de contacto' : 'Direct contact channels'">
          <div class="inline-flex items-center gap-1.5">
            <a href="mailto:mateogabus@gmail.com" class="hd-link"><AppIcon name="mail" :size="12" /> mateogabus@gmail.com</a>
            <UiCopyPill text="mateogabus@gmail.com" label="Copy" copied-label="Copied" />
          </div>
          <span class="hd-sep">·</span>
          <a href="https://github.com/MateoGs013" target="_blank" rel="noopener noreferrer" class="hd-link"><AppIcon name="code" :size="12" /> github.com/MateoGs013</a>
          <span class="hd-sep">·</span>
          <a href="https://www.linkedin.com/in/mateo-sonzogni" target="_blank" rel="noopener noreferrer" class="hd-link"><AppIcon name="briefcase" :size="12" /> linkedin.com/in/mateo-sonzogni</a>
          <span class="hd-sep">·</span>
          <NuxtLink to="/about" class="hd-link"><AppIcon name="file" :size="12" /> {{ isEs ? 'CV Harvard ATS' : 'Harvard ATS Resume' }} ↗</NuxtLink>
        </nav>
      </header>

      <!-- Resumen Ejecutivo Centrado (Lectura en 20 segundos) -->
      <section class="hd-section">
        <h2 class="hd-sec-title">{{ isEs ? '00 / SÍNTESIS EJECUTIVA DE CAPACIDADES' : '00 / EXECUTIVE CAPABILITIES SYNTHESIS' }}</h2>
        <p class="hd-lead">
          <template v-if="isEs">
            Desarrollo productos digitales y arquitecturas de software orientadas a producción de extremo a extremo: modelado relacional en <strong>PostgreSQL 17</strong>, APIs fuertemente tipadas (TypeScript, Node.js, Python, FastAPI) e interfaces reactivas contemporáneas (Vue 3, Nuxt 4, Next.js). Tesis preaprobada en Escuela Da Vinci liderando con <strong>382 commits</strong> la arquitectura de un asistente de IA on-premise con memoria vectorial. Trayectoria comprobable de más de <strong>10 entregables llave en mano</strong> para clientes en España y Argentina con métricas Lighthouse de 99+ y latencia sub-segundo.
          </template>
          <template v-else>
            I architect and engineer digital software products end-to-end: relational schema modeling in <strong>PostgreSQL 17</strong>, type-safe APIs (TypeScript, Node.js, Python, FastAPI), and contemporary reactive user interfaces (Vue 3, Nuxt 4, Next.js). Pre-approved degree thesis at Da Vinci School leading with <strong>382 commits</strong> the architecture of an on-premise AI assistant with vector memory. Proven production track record of <strong>10+ turnkey deliverables</strong> for clients across Spain and Argentina with 99+ Lighthouse scores and sub-second latencies.
          </template>
        </p>
      </section>

      <!-- Directorios del Sistema (Fila Centrada Minimalista) -->
      <section class="hd-section">
        <h2 class="hd-sec-title">{{ isEs ? '01 / DIRECTORIO DEL SISTEMA' : '01 / SYSTEM DIRECTORIES' }}</h2>
        <nav class="hd-nav-row" :aria-label="isEs ? 'Directorios' : 'Directories'">
          <NuxtLink to="/projects" class="hd-nav-link">
            <span class="hnl-num">01.</span>
            <span class="hnl-label">{{ isEs ? 'Proyectos' : 'Projects' }}</span>
            <span class="hnl-count">({{ getCount('projects', 6) }})</span>
          </NuxtLink>
          <span class="hd-sep">·</span>
          <NuxtLink to="/experience" class="hd-nav-link">
            <span class="hnl-num">02.</span>
            <span class="hnl-label">{{ isEs ? 'Experiencia' : 'Experience' }}</span>
            <span class="hnl-count">({{ getCount('experience', 6) }})</span>
          </NuxtLink>
          <span class="hd-sep">·</span>
          <NuxtLink to="/stack" class="hd-nav-link">
            <span class="hnl-num">03.</span>
            <span class="hnl-label">{{ isEs ? 'Stack' : 'Stack' }}</span>
            <span class="hnl-count">({{ getCount('stack', 22) }})</span>
          </NuxtLink>
          <span class="hd-sep">·</span>
          <NuxtLink to="/about" class="hd-nav-link">
            <span class="hnl-num">04.</span>
            <span class="hnl-label">CV</span>
            <span class="hnl-count">(ATS)</span>
          </NuxtLink>
          <span class="hd-sep">·</span>
          <NuxtLink to="/contact" class="hd-nav-link">
            <span class="hnl-num">05.</span>
            <span class="hnl-label">{{ isEs ? 'Contacto' : 'Contact' }}</span>
            <span class="hnl-count">({{ getCount('contact', 7) }})</span>
          </NuxtLink>
        </nav>
      </section>

      <!-- Proyectos en Producción (Lista Limpia sin Marcos) -->
      <section class="hd-section">
        <div class="hd-sec-header">
          <h2 class="hd-sec-title">{{ isEs ? '02 / MATRIZ DE PROYECTOS EN PRODUCCIÓN & TESIS' : '02 / PRODUCTION PROJECTS & THESIS MATRIX' }}</h2>
          <span class="hd-sec-meta">{{ isEs ? `${getCount('projects', masterProjects.length)} REGISTROS` : `${getCount('projects', masterProjects.length)} RECORDS` }}</span>
        </div>

        <div class="hd-clean-projects">
          <article v-for="(p, idx) in masterProjects" :key="p.slug" class="hd-clean-proj">
            <div class="hd-cp-header">
              <span class="hd-cp-num">{{ pad(idx + 1) }}.</span>
              <NuxtLink :to="p.to" class="hd-cp-title">{{ p.title }}</NuxtLink>
              <span class="hd-cp-year">({{ p.year }})</span>
              <span class="hd-cp-role">· {{ p.role }}</span>
            </div>
            <p class="hd-cp-desc">{{ p.summary }}</p>
            <div class="hd-cp-meta">
              <span class="hd-cp-metric">{{ p.metrics }}</span>
              <span class="hd-sep">·</span>
              <span class="hd-cp-stack">{{ p.stack.join(' · ') }}</span>
            </div>
            <div class="hd-cp-links">
              <a v-if="p.url" :href="p.url" target="_blank" rel="noopener noreferrer" class="hd-cp-link">{{ isEs ? 'visitar en vivo ↗' : 'live site ↗' }}</a>
              <span v-if="p.url && p.repo" class="hd-sep">·</span>
              <a v-if="p.repo" :href="p.repo" target="_blank" rel="noopener noreferrer" class="hd-cp-link">{{ isEs ? 'código en github ↗' : 'source code ↗' }}</a>
              <span class="hd-sep">·</span>
              <NuxtLink :to="p.to" class="hd-cp-link">{{ isEs ? 'ficha técnica →' : 'technical dossier →' }}</NuxtLink>
            </div>
          </article>
        </div>
      </section>

      <!-- Trayectoria & Formación -->
      <section class="hd-section hd-split">
        <div class="hd-split-col">
          <h2 class="hd-sec-title">{{ isEs ? '03 / TRAYECTORIA PROFESIONAL' : '03 / CAREER HISTORY' }}</h2>
          <ul class="hd-clean-list">
            <li>
              <div class="hd-cl-top">
                <strong>Ynara AI Assistant</strong>
                <span>2026</span>
              </div>
              <p class="hd-cl-sub">{{ isEs ? 'Lead Frontend & Arquitectura Técnica' : 'Lead Frontend & Technical Architecture' }}</p>
              <p class="hd-cl-body">{{ isEs ? '382 commits liderando inferencia local, embeddings y base vectorial Postgres/pgvector.' : '382 commits leading local inference, embeddings, and Postgres/pgvector architecture.' }}</p>
            </li>
            <li>
              <div class="hd-cl-top">
                <strong>La Rúcula &amp; ARG Piscinas</strong>
                <span>2026</span>
              </div>
              <p class="hd-cl-sub">{{ isEs ? 'Desarrollo Web & Frontend a Medida (España)' : 'Web Engineering & Custom Frontend (Spain)' }}</p>
              <p class="hd-cl-body">{{ isEs ? 'Aplicaciones en producción para clientes reales con Lighthouse 99/100 y panel admin autónomo.' : 'Live production client applications with Lighthouse 99/100 and autonomous admin dashboard.' }}</p>
            </li>
            <li>
              <div class="hd-cl-top">
                <strong>{{ isEs ? 'Desarrollo Freelance' : 'Freelance Development' }}</strong>
                <span>2023 – {{ isEs ? 'Act.' : 'Present' }}</span>
              </div>
              <p class="hd-cl-sub">{{ isEs ? 'Desarrollador Full Stack' : 'Full Stack Developer' }}</p>
              <p class="hd-cl-body">{{ isEs ? '~10 soluciones llave en mano entregadas con arquitectura de software integral.' : '~10 turnkey web deliverables shipped with end-to-end software architecture.' }}</p>
            </li>
          </ul>
        </div>

        <div class="hd-split-col">
          <h2 class="hd-sec-title">{{ isEs ? '04 / FORMACIÓN ACADÉMICA' : '04 / TECHNICAL EDUCATION' }}</h2>
          <ul class="hd-clean-list">
            <li>
              <div class="hd-cl-top">
                <strong>Escuela Da Vinci</strong>
                <span>2024 – 2026</span>
              </div>
              <p class="hd-cl-sub">{{ isEs ? 'Tecnicatura Superior en Diseño y Desarrollo Web' : 'Associate Degree in Web Design & Development' }}</p>
              <p class="hd-cl-body">{{ isEs ? 'Buenos Aires. Tesis preaprobada con calificación sobresaliente: Ynara.' : 'Buenos Aires. Pre-approved degree thesis with honors: Ynara.' }}</p>
            </li>
            <li>
              <div class="hd-cl-top">
                <strong>CET N.º 30</strong>
                <span>2017 – 2023</span>
              </div>
              <p class="hd-cl-sub">{{ isEs ? 'Técnico en Programación (7 Años)' : 'Computer Programming Technician (7-Year Program)' }}</p>
              <p class="hd-cl-body">{{ isEs ? 'Río Negro. Algoritmos, estructuras de datos, lógica de bajo nivel, redes y sistemas operativos.' : 'Río Negro. Algorithmic logic, data structures, low-level logic, networks, and operating systems.' }}</p>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 2. INICIO: ACTIVE BENTO GRID 2.0 & AWWWARDS CURSOR WORK (folder.head === 'db' && !isHyperfocus) -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div v-else-if="folder.head === 'db'" key="db-poster" class="inicio-studio max-w-[1140px] mx-auto flex flex-col gap-8 sm:gap-11 py-1 sm:py-2 w-full">
      
      <!-- 2.1 ACTIVE BENTO GRID 2.0 (ABOVE-THE-FOLD LIVING STAGE) -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full" aria-label="Introducción e infraestructura técnica">
        
        <!-- Col 1-7: Hero Principal de Ingeniería con Magnetic Dots Canvas -->
        <UiSpotlightCard
          as="article"
          class="lg:col-span-7 surface-10k rounded-2xl p-5 sm:p-7 relative overflow-hidden flex flex-col justify-between"
        >
          <!-- Magnetic Dots Field interactivo sutil de fondo -->
          <div class="pointer-events-none absolute inset-0 opacity-[0.22] dark:opacity-[0.28] flex items-center justify-center overflow-hidden">
            <UiMagneticDots
              :width="540"
              :height="320"
              :pull="42"
              :radius="50"
              :spacing="16"
              initial-shape="Dots"
            />
          </div>

          <div class="relative z-10 flex flex-col h-full justify-between gap-5">
            <!-- Barra superior: Estado en Vivo + Ubicación + Latencia -->
            <div class="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-rule">
              <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-paper/85 border border-rule font-mono text-[11px] text-dim shadow-sm">
                <span class="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_6px_var(--d-green)]" />
                <span class="text-ink font-medium">{{ homeProfileStatus }}</span>
                <span class="text-faint">·</span>
                <span>Paraná / Patagonia, AR</span>
              </div>
              <div class="hidden sm:inline-flex items-center gap-2 font-mono text-[11px] text-dim">
                <span class="text-sig font-semibold">UTC-3</span>
                <span class="text-faint">·</span>
                <span>PG-17 ACID</span>
              </div>
            </div>

            <!-- Titular Monumental con Scramble Cinético -->
            <div>
              <span class="font-mono text-[11px] tracking-widest uppercase text-dim mb-2 flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-sig" />
                <span>{{ homeProfileRole }}</span>
              </span>

              <h1
                class="flex flex-wrap items-baseline gap-x-[0.26em] gap-y-1 font-sans font-semibold tracking-[-0.038em] text-[clamp(26px,4.2vw,46px)] leading-[1.06] text-ink m-0 mb-3 cursor-default select-none"
                data-anchor
                @mouseenter="scrambleHeadline"
              >
                <span>{{ headline1 }}</span>
                <span>{{ headline2 }}</span>
                <span><span class="text-ink underline decoration-sig decoration-2 underline-offset-[6px]">{{ headline3 }}</span><span class="text-sig">.</span></span>
              </h1>

              <div class="font-sans text-[14px] sm:text-[15px] text-dim leading-[1.62] max-w-[56ch] m-0">
                <UiTextBlurReveal
                  :text="homeAboutText"
                  split="words"
                  look="blur"
                  :stagger-ms="16"
                  :duration-ms="540"
                />
              </div>
            </div>

            <!-- Barra de Acciones Táctiles: Botón $10k Sweep + CV Harvard + Bencho Copy Pill -->
            <div class="flex flex-wrap items-center gap-2.5 pt-2">
              <UiSweepButton
                to="/projects"
                :title="isEs ? 'Explorar todas las aplicaciones en producción' : 'Explore all applications in production'"
              >
                <span>{{ tr.home.btnProjects }}</span>
                <span class="font-mono text-[11px] opacity-70">({{ projectCountBadge }})</span>
                <AppIcon name="arrow-right" :size="13" class="transition-transform duration-200 group-hover:translate-x-0.5" />
              </UiSweepButton>

              <NuxtLink
                to="/about"
                class="inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg bg-surface-raised hover:bg-hover border border-rule hover:border-rule-strong text-ink font-sans text-[13px] font-medium no-underline active:scale-[0.98] transition-all duration-150"
                :title="isEs ? 'Abrir currículum completo en formato Harvard ATS o Interactivo' : 'Open complete resume in Harvard ATS or Interactive format'"
              >
                <AppIcon name="file" :size="13" class="text-dim" />
                <span>{{ isEs ? 'CV Harvard / ATS' : 'Harvard ATS CV' }}</span>
              </NuxtLink>

              <UiCopyPill
                text="mateogabus@gmail.com"
                label="mateogabus@gmail.com"
                :copied-label="isEs ? 'Email copiado' : 'Email copied'"
              />
            </div>
          </div>
        </UiSpotlightCard>

        <!-- Col 8-12: Live 3D Globe + Odómetros Rolling Counter -->
        <UiSpotlightCard
          as="article"
          class="lg:col-span-5 surface-10k rounded-2xl p-5 flex flex-col justify-between gap-4 overflow-hidden"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-sig" />
              <span class="font-sans text-[13px] font-medium text-ink">{{ isEs ? 'Red Global & Telemetría' : 'Global Mesh & Telemetry' }}</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-paper/80 border border-rule font-mono text-[10px] text-dim uppercase">
              3D Live Sphere
            </span>
          </div>

          <!-- Globo 3D Interactivo Visible de Inmediato -->
          <div class="flex-1 flex items-center justify-center my-auto min-h-[190px] py-1 overflow-hidden">
            <UiDotGlobe
              :size="210"
              home-city="Paraná, AR"
              :speed="28"
            />
          </div>

          <!-- Métricas Odómetro Rodante (Rolling Counter Bencho) -->
          <div class="grid grid-cols-3 gap-2 pt-3 border-t border-rule font-mono text-center">
            <div class="flex flex-col items-center">
              <UiRollingCounter :model-value="99" :digits="2" :interactive="false" suffix="/100" />
              <span class="text-dim text-[10px] uppercase">Lighthouse</span>
            </div>
            <div class="flex flex-col items-center border-x border-rule px-1">
              <UiRollingCounter :model-value="382" :digits="3" :interactive="false" />
              <span class="text-dim text-[10px] uppercase">Commits IA</span>
            </div>
            <div class="flex flex-col items-center">
              <UiRollingCounter :model-value="10" :digits="2" :interactive="false" suffix="+" />
              <span class="text-dim text-[10px] uppercase">{{ isEs ? 'Entregas' : 'Shipped' }}</span>
            </div>
          </div>
        </UiSpotlightCard>

        <!-- Fila 2: Credencial 3D HoloCard + Topología en Vivo + Schema X-Ray -->
        <div class="lg:col-span-4 surface-10k rounded-2xl p-4 flex flex-col justify-between gap-3">
          <div class="flex items-center justify-between font-mono text-[10.5px] text-dim">
            <span class="flex items-center gap-2 font-medium text-ink">
              <span class="w-1.5 h-1.5 rounded-full bg-green" />
              <span>{{ isEs ? 'Credencial Técnica' : 'Technical Credential' }}</span>
            </span>
            <span class="text-faint">3D TILT</span>
          </div>
          <div class="flex items-center justify-center py-1">
            <UiHoloCard :max-tilt="12" class="w-[176px] rounded-xl overflow-hidden border border-rule bg-paper/90 p-1.5 group">
              <div class="aspect-[4/4.5] rounded-lg overflow-hidden bg-surface relative">
                <img
                  src="/media/profile/mateo-front.png"
                  alt="Mateo Gabriel Sonzogni"
                  class="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 group-hover:scale-[1.04] transition-all duration-500 ease-out"
                  loading="eager"
                >
                <span class="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md border border-white/15 font-mono text-[8.5px] text-white uppercase tracking-wider">
                  Design Eng · 2026
                </span>
              </div>
              <div class="pt-2 pb-0.5 px-1 flex items-center justify-between font-mono text-[10px] text-dim">
                <span class="text-ink font-medium truncate">Mateo Sonzogni</span>
                <span class="text-sig">✓</span>
              </div>
            </UiHoloCard>
          </div>
          <p class="m-0 font-mono text-[10px] text-dim text-center">
            {{ isEs ? 'Incliná el cursor para activar reflejo especular holográfico' : 'Tilt cursor to activate holographic specular glare' }}
          </p>
        </div>

        <UiSpotlightCard as="article" class="lg:col-span-4 surface-10k rounded-2xl p-4 flex flex-col justify-between gap-2 min-h-[260px]">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-sig" />
              <span class="font-sans text-[13px] font-medium text-ink">{{ isEs ? 'Topología Full-Stack' : 'Full-Stack Topology' }}</span>
            </div>
            <span class="px-2 py-0.5 rounded bg-paper/80 border border-rule font-mono text-[9.5px] text-dim uppercase">Live Packets</span>
          </div>

          <div class="flex-1 flex items-center justify-center overflow-hidden">
            <UiHubDiagram
              core-label="PG-17"
              :spread="96"
              :height="195"
            />
          </div>

          <p class="m-0 font-mono text-[10px] text-dim text-center">
            {{ isEs ? 'Puntero sobre un nodo para disparar paquetes de datos' : 'Hover any node to fire kinetic packet streaks' }}
          </p>
        </UiSpotlightCard>

        <UiSpotlightCard as="article" class="lg:col-span-4 surface-10k rounded-2xl p-4 flex flex-col justify-between gap-2 min-h-[260px]">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-sig" />
              <span class="font-sans text-[13px] font-medium text-ink">{{ isEs ? 'Lente Rayos X: UI → SQL' : 'X-Ray Lens: UI → SQL' }}</span>
            </div>
            <span class="px-2 py-0.5 rounded bg-paper/80 border border-rule font-mono text-[9.5px] text-dim uppercase">X-Ray Lens</span>
          </div>

          <div class="flex-1 flex items-center justify-center w-full">
            <UiCodeReveal
              :title="isEs ? 'Esquema ACID' : 'ACID Schema'"
              :subtitle="isEs ? 'Inspeccionar Prisma 7' : 'Inspect Prisma 7'"
              :radius="115"
            />
          </div>

          <p class="m-0 font-mono text-[10px] text-dim text-center">
            {{ isEs ? 'Mové el cursor o clic para rasgar la UI y ver SQL real' : 'Move cursor or click to peel the UI into SQL code' }}
          </p>
        </UiSpotlightCard>

      </section>

      <!-- 2.2 SELECTED WORK CON FLOTACIÓN POR RESORTE (DENNIS SNELLENBERG / OLIVIER LAROSE) -->
      <section aria-label="Producción destacada" class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3">
          <div class="flex items-center gap-2.5">
            <span class="font-mono text-[11px] text-sig font-semibold">01</span>
            <h2 class="m-0 font-sans text-[18px] sm:text-[20px] font-semibold tracking-[-0.025em] text-ink">
              {{ tr.home.swTitle }}
            </h2>
            <span class="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-paper/80 border border-rule font-mono text-[10px] text-dim">
              {{ isEs ? 'Previsualización cinética flotante' : 'Kinetic floating preview' }}
            </span>
          </div>

          <div class="flex items-center gap-3">
            <!-- Selector de Vista: Carrete Flotante (Reel) vs Baldosas 3D (Grid) -->
            <UiSegmentedSwitch
              v-model="selectedWorkMode"
              :options="[
                { value: 'reel', label: isEs ? 'Carrete Awwwards' : 'Cursor Reel' },
                { value: 'grid', label: isEs ? 'Baldosas 3D' : '3D Grid' }
              ]"
            />

            <NuxtLink
              to="/projects"
              class="group inline-flex items-center gap-1.5 font-mono text-[11.5px] text-dim hover:text-ink no-underline transition-colors ml-2"
            >
              <span>{{ tr.home.swViewAll }} ({{ projectCountBadge }})</span>
              <AppIcon name="arrow-right" :size="12" class="text-sig transition-transform duration-200 group-hover:translate-x-0.5" />
            </NuxtLink>
          </div>
        </div>

        <!-- Modo 1: Carrete Tipográfico Awwwards con Resorte y Ventana Flotante (UiCursorWorkList) -->
        <div v-if="selectedWorkMode === 'reel'" class="w-full">
          <UiCursorWorkList :items="cursorWorkProjects" />
        </div>

        <!-- Modo 2: Cuadrícula de Tarjetas 3D con Inclinación Giroscópica (UiHoloCard) -->
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UiHoloCard
            v-for="p in selectedWorkProjects"
            :key="p.slug"
            :max-tilt="5"
            :foil="false"
            class="surface-10k rounded-xl hover:border-rule-strong transition-all duration-200 flex flex-col overflow-hidden"
          >
            <NuxtLink
              :to="p.to"
              :data-row="p.slug"
              class="group flex flex-col h-full no-underline text-inherit focus:outline-none"
            >
              <div class="relative aspect-[16/10] w-full overflow-hidden border-b border-rule bg-paper">
                <img
                  :src="p.cover"
                  :alt="p.title"
                  class="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                >
                <div class="absolute top-2.5 right-2.5 flex items-center gap-1.5 font-mono text-[10px]">
                  <span class="px-2 py-0.5 rounded-full backdrop-blur-md bg-black/75 border border-white/10 text-white font-medium inline-flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full" :class="p.status === 'LIVE' ? 'bg-green' : 'bg-amber'" />
                    <span>{{ p.status }} · {{ p.year }}</span>
                  </span>
                </div>
              </div>

              <div class="flex flex-col flex-1 p-4 sm:p-5 gap-2">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="m-0 font-sans text-[15.5px] font-semibold tracking-[-0.02em] text-ink group-hover:text-sig transition-colors">
                    {{ p.title }}
                  </h3>
                  <span class="font-mono text-[12px] text-dim group-hover:text-sig group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" aria-hidden="true">↗</span>
                </div>
                <p v-if="p.orgDesc" class="m-0 font-mono text-[10.5px] text-faint truncate">
                  {{ p.orgDesc }}
                </p>
                <p v-if="p.summary" class="m-0 font-sans text-[13px] text-dim leading-relaxed line-clamp-2">
                  {{ p.summary }}
                </p>
                <div v-if="p.chips && p.chips.length" class="mt-auto pt-2.5 flex flex-wrap gap-1.5">
                  <span
                    v-for="chip in p.chips"
                    :key="chip"
                    class="px-2 py-0.5 rounded-md bg-paper/75 border border-rule font-mono text-[10px] text-dim group-hover:border-rule-strong transition-colors"
                  >
                    {{ chip }}
                  </span>
                </div>
              </div>
            </NuxtLink>
          </UiHoloCard>
        </div>
      </section>

      <!-- 2.3 ARSENAL TECNOLÓGICO -->
      <section aria-label="Arsenal Tecnológico" class="surface-10k rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <span class="font-mono text-[11px] font-semibold text-sig">02</span>
          <span class="font-mono text-[11.5px] uppercase tracking-wider text-dim font-medium">{{ tr.home.stackTag }}</span>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <NuxtLink
            v-for="st in bentoStackList"
            :key="st"
            to="/stack"
            class="px-2.5 py-1 rounded-md bg-paper/75 border border-rule hover:border-sig/60 text-dim hover:text-ink font-mono text-[10.5px] no-underline hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150"
          >
            {{ st }}
          </NuxtLink>
        </div>
      </section>

      <!-- 2.35 LIBRERÍA DE COMPONENTES PROPIA // SONZOGNI × BENCHO UI v2.0 -->
      <UiBenchShowcase />

      <!-- 2.4 PIE DE PÁGINA MINIMALISTA ESPECULAR -->
      <footer class="surface-10k rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6" aria-label="Contacto directo">
        <div>
          <h2 class="m-0 font-sans text-[16px] sm:text-[18px] font-semibold tracking-[-0.02em] text-ink">
            {{ tr.home.footerTitle }}
          </h2>
          <p class="m-0 mt-1 font-sans text-[13px] text-dim">
            {{ tr.home.footerSub }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <UiCopyPill
            text="mateogabus@gmail.com"
            label="mateogabus@gmail.com"
            :copied-label="isEs ? 'Copiado' : 'Copied'"
          />
          <a
            href="https://github.com/MateoGs013"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-surface hover:bg-hover border border-rule hover:border-rule-strong text-dim hover:text-ink font-mono text-[11.5px] no-underline transition-all"
          >
            <AppIcon name="code" :size="12" />
            <span>GitHub ↗</span>
          </a>
          <a
            href="https://www.linkedin.com/in/mateo-sonzogni"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-surface hover:bg-hover border border-rule hover:border-rule-strong text-dim hover:text-ink font-mono text-[11.5px] no-underline transition-all"
          >
            <AppIcon name="briefcase" :size="12" />
            <span>LinkedIn ↗</span>
          </a>
        </div>
      </footer>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 3. COLECCIONES: VISTA DE CARPETA (folder.head !== 'db')                 -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <template v-else>
      <!-- Cabecera de Carpeta -->
      <ExplorerHeader :id="uid" kind="folder" :badge="pad(folder.count)" :name="folder.head" :line="folder.line">
        <div class="folder-header-actions flex items-center gap-2.5 flex-wrap">
          <!-- Filtros Activos Facetados -->
          <template v-if="folder.facets.length">
            <NuxtLink
              v-for="f in folder.facets"
              :key="f.key"
              :to="f.remove"
              class="inline-flex items-center gap-2 h-7 px-2.5 rounded-md border border-sig/40 bg-sig/10 font-mono text-[11px] text-ink no-underline hover:border-sig transition-colors"
              :title="`quitar el filtro ${f.key}`"
            >
              <span>{{ f.key }}: <strong class="text-sig">{{ f.value }}</strong></span>
              <span class="text-dim" aria-hidden="true">×</span>
            </NuxtLink>
          </template>

          <!-- Selector de Vista Táctil (Bencho UI Segmented Switch) -->
          <UiSegmentedSwitch
            v-if="folder.items.length"
            v-model="viewMode"
            :options="viewOptions"
            :aria-label="isEs ? 'Modo de visualización' : 'View mode'"
          />
        </div>
      </ExplorerHeader>

      <!-- Barra de Filtros Rápidos de Proyectos (Minimalista) -->
      <div v-if="folder.head === 'projects'" class="flex items-center justify-between gap-3 p-2 px-3 my-4 rounded-xl bg-surface/60 border border-rule flex-wrap w-full min-w-0">
        <div class="flex items-center gap-1.5 flex-wrap">
          <NuxtLink
            :to="routeFor(['projects'])"
            class="font-mono text-[11px] px-2.5 py-1 rounded-md transition-all duration-150 no-underline shrink-0"
            :class="!hasStatusFilter ? 'bg-ink text-paper font-medium shadow-xs' : 'text-dim hover:text-ink hover:bg-hover/60'"
          >
            {{ tr.collection.filterAll }} ({{ projectCounts.all }})
          </NuxtLink>
          <NuxtLink
            :to="routeFor(['projects'], { status: 'LIVE' })"
            class="font-mono text-[11px] px-2.5 py-1 rounded-md transition-all duration-150 no-underline inline-flex items-center gap-1.5 shrink-0"
            :class="isStatusLive ? 'bg-green/15 text-green border border-green/30 font-medium' : 'text-dim hover:text-ink hover:bg-hover/60'"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-green" />
            <span>{{ tr.collection.filterLive }} ({{ projectCounts.live }})</span>
          </NuxtLink>
          <NuxtLink
            :to="routeFor(['projects'], { status: 'WIP' })"
            class="font-mono text-[11px] px-2.5 py-1 rounded-md transition-all duration-150 no-underline inline-flex items-center gap-1.5 shrink-0"
            :class="isStatusWip ? 'bg-amber/15 text-amber border border-amber/30 font-medium' : 'text-dim hover:text-ink hover:bg-hover/60'"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-amber" />
            <span>{{ tr.collection.filterWip }} ({{ projectCounts.wip }})</span>
          </NuxtLink>
        </div>
        <div class="text-faint font-mono text-[11px] hidden md:block">
          {{ isEs ? 'PostgreSQL 17 · Lighthouse 98+' : 'PostgreSQL 17 · Lighthouse 98+' }}
        </div>
      </div>

      <!-- 1. Vista de Cronología Técnica (Timeline) para Experiencia -->
      <div v-if="viewMode === 'timeline' && folder.head === 'experience'" class="experience-timeline relative pl-6 sm:pl-8 my-5 w-full max-w-[920px] min-w-0">
        <!-- Línea Vertical Hairline del Timeline -->
        <div class=" absolute left-2 sm:left-2.5 top-3 bottom-3 w-[1px] bg-rule-strong" aria-hidden="true" />

        <div class="flex flex-col gap-4 w-full min-w-0">
          <UiSpotlightCard
            v-for="(it, idx) in folder.items"
            :key="it.key"
            as="article"
            class="relative rounded-xl bg-surface/60 border border-rule hover:border-rule-strong p-4 sm:p-5 transition-all duration-200 group w-full min-w-0"
            :data-row="it.key"
          >
            <!-- Pin Quirúrgico en el Eje -->
            <div class="absolute -left-[19px] sm:-left-[25px] top-5 w-2.5 h-2.5 rounded-full border-2 border-paper bg-sig group-hover:scale-125 transition-transform" aria-hidden="true" />

            <!-- Cabecera del Hito -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-2 w-full min-w-0">
              <div class="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                <span class="font-mono text-[11px] text-faint tabular-nums shrink-0">{{ pad(idx + 1) }}</span>
                <span class="font-mono text-[10px] font-medium px-2 py-0.5 rounded-md border border-rule bg-paper/70 shrink-0" :class="getExpCategory(it.key).color">
                  {{ getExpCategory(it.key).label }}
                </span>
                <span class="font-mono text-[12px] font-medium text-ink break-words">
                  {{ it.org ?? it.label }}
                </span>
              </div>
              <div class="font-mono text-[11px] text-faint self-start sm:self-auto shrink-0">
                {{ formatExpPeriod(it) }}
              </div>
            </div>

            <!-- Título del Rol -->
            <h3 class="font-sans text-[16px] sm:text-[17px] font-semibold tracking-[-0.02em] text-ink mb-1.5 leading-snug break-words">
              {{ isEs ? (it.role || getExperienceLocalization(it.key)?.role || it.label) : (getExperienceLocalization(it.key)?.role || it.role || it.label) }}
            </h3>

            <!-- Resumen de Impacto -->
            <p class="font-sans text-[13.5px] text-dim leading-relaxed mb-3.5 break-words">
              {{ isEs ? (it.summary || getExperienceLocalization(it.key)?.summary) : (getExperienceLocalization(it.key)?.summary || it.summary) }}
            </p>

            <!-- Highlights Técnicos -->
            <div v-if="getExpHighlights(it.key).length" class="flex items-center gap-1.5 flex-wrap mb-3.5 font-mono text-[10.5px]">
              <span v-for="h in getExpHighlights(it.key)" :key="h" class="px-2 py-0.5 rounded-md bg-paper/70 border border-rule text-dim break-words">
                {{ h }}
              </span>
            </div>

            <!-- Pie del Hito: Stack + Proyecto Vinculado + Enlace al Dossier -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-rule w-full min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap min-w-0 w-full sm:w-auto flex-1">
                <span v-for="t in (it.techs ?? []).slice(0, 4)" :key="t.slug" class="px-2 py-0.5 rounded-md bg-paper/60 border border-rule font-mono text-[10.5px] text-dim">
                  {{ t.name }}
                </span>
                <NuxtLink
                  v-if="getExpLinkedProject(it.key)"
                  :to="`/projects/${getExpLinkedProject(it.key)!.slug}`"
                  class="font-mono text-[10.5px] font-medium text-ink px-2 py-0.5 rounded-md border border-rule-strong bg-surface-raised hover:border-sig transition-colors no-underline inline-flex items-center gap-1 max-w-full"
                  :title="isEs ? 'Ver proyecto relacionado' : 'View related project'"
                >
                  <AppIcon name="folder" :size="10" class="text-sig shrink-0" />
                  <span class="truncate">{{ getExpLinkedProject(it.key)!.title }} ↗</span>
                </NuxtLink>
              </div>

              <div class="flex items-center justify-end w-full sm:w-auto pt-1 sm:pt-0 shrink-0">
                <NuxtLink :to="it.to" class="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-dim group-hover:text-ink no-underline transition-colors">
                  <span>{{ tr.collection.technicalDetails }}</span>
                  <AppIcon name="arrow-right" :size="12" class="text-sig transition-transform duration-150 group-hover:translate-x-0.5" />
                </NuxtLink>
              </div>
            </div>
          </UiSpotlightCard>
        </div>
      </div>

      <!-- 2. Vista de Cuadrícula (Especializada por Colección con Revelación Progresiva) -->
      <ol
        v-else-if="viewMode === 'grid'"
        class="folder-items-grid grid gap-4 sm:gap-5 my-4 w-full list-none p-0 m-0"
        :class="{
          'grid-cols-1 md:grid-cols-2 xl:grid-cols-3': folder.head === 'projects',
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4': folder.head === 'stack' || folder.head === 'experience',
          'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6': folder.head !== 'projects' && folder.head !== 'stack' && folder.head !== 'experience',
        }"
      >
        <li v-for="(it, n) in folder.items" :key="it.key" class="w-full min-w-0">
          <!-- Tarjeta de Proyecto (Minimalista con Spotlight y Revelación en Hover) -->
          <UiSpotlightCard
            v-if="folder.head === 'projects'"
            class="h-full rounded-xl border border-rule bg-surface/60 hover:border-rule-strong transition-all duration-200 overflow-hidden"
          >
            <NuxtLink
              :to="it.to"
              class="project-card group flex flex-col h-full no-underline text-inherit focus:outline-none"
              :data-row="it.key"
            >
              <!-- Contenedor de Portada o Fallback Técnico Limpio -->
              <div class="relative w-full aspect-[16/10] bg-paper overflow-hidden border-b border-rule flex flex-col justify-between">
                <img v-if="it.cover" :src="it.cover" :alt="it.label" class="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" loading="lazy">
                <div v-else class="flex flex-col justify-between p-4 bg-surface-raised/60 relative overflow-hidden h-full w-full">
                  <div class="flex items-center justify-between font-mono text-[10px] text-faint z-10 pr-20">
                    <span>spec // {{ it.key }}</span>
                  </div>
                  <div class="flex flex-col items-center justify-center my-auto py-1 z-10 text-center">
                    <AppIcon :name="it.key === 'ynara-web' ? 'zap' : 'code'" :size="24" class="text-sig/80 mb-1.5" />
                    <span class="font-mono text-[11px] font-medium text-ink tracking-wider truncate max-w-full">{{ it.key === 'ynara-web' ? 'WEBGL / SHADERS / GLSL' : 'OBSIDIAN / AI VAULT' }}</span>
                    <span class="font-mono text-[10px] text-dim mt-0.5 truncate max-w-full">{{ it.key === 'ynara-web' ? '60 FPS · 4 Draw Calls' : '1,420 Notes · 850 Nodes' }}</span>
                  </div>
                  <div class="flex items-center justify-between font-mono text-[9.5px] text-faint pt-1 z-10">
                    <span>{{ it.key }}.ts</span>
                    <span>READY</span>
                  </div>
                </div>

                <!-- Píldora Flotante de Estado -->
                <div class="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20 font-mono text-[10px]">
                  <span class="px-2 py-0.5 rounded-full backdrop-blur-md bg-black/70 border border-white/10 text-white font-medium inline-flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full" :class="it.status === 'LIVE' ? 'bg-green' : 'bg-amber'" />
                    <span>{{ it.status ?? 'LIVE' }} · {{ it.year ?? it.meta }}</span>
                  </span>
                </div>
              </div>

              <!-- Cuerpo de la Tarjeta -->
              <div class="flex flex-col flex-1 p-4 sm:p-5 gap-2 min-w-0">
                <div class="flex items-center justify-between gap-2 min-w-0">
                  <h3 class="font-sans text-[16px] font-semibold tracking-[-0.02em] text-ink group-hover:text-sig transition-colors leading-snug truncate m-0">
                    {{ it.label }}
                  </h3>
                  <span class="font-mono text-[12px] text-dim group-hover:text-sig group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" aria-hidden="true">↗</span>
                </div>

                <p v-if="it.org && it.org.toLowerCase() !== it.label.toLowerCase()" class="font-mono text-[11px] text-faint truncate m-0">
                  {{ isEs ? (it.org || getProjectLocalization(it.key)?.orgDesc) : (getProjectLocalization(it.key)?.orgDesc || it.org) }}
                </p>

                <p v-if="it.summary" class="font-sans text-[13px] text-dim leading-relaxed line-clamp-2 m-0 break-words">
                  {{ isEs ? (it.summary || getProjectLocalization(it.key)?.summary) : (getProjectLocalization(it.key)?.summary || it.summary) }}
                </p>

                <!-- Footer con Chips y Acciones Rápidas -->
                <div class="flex items-center justify-between gap-2 pt-3 mt-auto border-t border-rule/70 w-full min-w-0">
                  <div v-if="it.techs && it.techs.length" class="flex flex-wrap gap-1 min-w-0">
                    <span v-for="t in it.techs.slice(0, 3)" :key="t.slug" class="px-2 py-0.5 rounded-md bg-paper/70 border border-rule font-mono text-[10px] text-dim">
                      {{ t.name }}
                    </span>
                    <span v-if="it.techs.length > 3" class="px-1.5 py-0.5 rounded-md bg-paper/50 font-mono text-[10px] text-faint">
                      +{{ it.techs.length - 3 }}
                    </span>
                  </div>

                  <div class="flex items-center gap-1.5 shrink-0">
                    <button
                      v-if="it.url"
                      type="button"
                      class="font-mono text-[10px] px-2 py-0.5 rounded-md border border-rule bg-paper/80 text-dim hover:border-rule-strong hover:text-ink inline-flex items-center gap-1 transition-colors cursor-pointer"
                      :title="isEs ? 'Visitar sitio en vivo' : 'Visit live site'"
                      @click.stop.prevent="openExternal(it.url)"
                    >
                      <span>Live</span>
                      <AppIcon name="external" :size="9" />
                    </button>
                    <button
                      v-if="it.repo"
                      type="button"
                      class="font-mono text-[10px] px-2 py-0.5 rounded-md border border-rule bg-paper/80 text-dim hover:border-rule-strong hover:text-ink inline-flex items-center gap-1 transition-colors cursor-pointer"
                      :title="isEs ? 'Ver código en GitHub' : 'View source on GitHub'"
                      @click.stop.prevent="openExternal(it.repo)"
                    >
                      <AppIcon name="code" :size="10" />
                    </button>
                  </div>
                </div>
              </div>
            </NuxtLink>
          </UiSpotlightCard>

          <!-- Tarjeta de Experiencia -->
          <UiSpotlightCard
            v-else-if="folder.head === 'experience'"
            class="h-full rounded-xl border border-rule bg-surface/60 hover:border-rule-strong transition-all duration-200"
          >
            <NuxtLink
              :to="it.to"
              class="group flex flex-col h-full p-4 sm:p-5 no-underline text-inherit min-w-0"
              :data-row="it.key"
            >
              <div class="flex items-center justify-between gap-2 mb-2 font-mono text-[11px] min-w-0">
                <span class="text-ink font-medium truncate">{{ it.org ?? it.label }}</span>
                <span class="text-faint shrink-0">{{ formatExpPeriod(it) }}</span>
              </div>
              <h3 class="font-sans text-[15.5px] font-semibold tracking-[-0.02em] text-ink group-hover:text-sig transition-colors leading-snug m-0 mb-2 line-clamp-2 break-words">
                {{ isEs ? (it.role || getExperienceLocalization(it.key)?.role || it.label) : (getExperienceLocalization(it.key)?.role || it.role || it.label) }}
              </h3>
              <p v-if="it.summary" class="font-sans text-[13px] text-dim leading-relaxed line-clamp-2 m-0 mb-3 break-words">
                {{ isEs ? (it.summary || getExperienceLocalization(it.key)?.summary) : (getExperienceLocalization(it.key)?.summary || it.summary) }}
              </p>
              <div class="flex items-center justify-between pt-3 mt-auto border-t border-rule/70 font-mono text-[11px] text-dim group-hover:text-ink">
                <span>{{ tr.collection.technicalDetails }}</span>
                <span class="text-sig transition-transform duration-150 group-hover:translate-x-0.5">→</span>
              </div>
            </NuxtLink>
          </UiSpotlightCard>

          <!-- Tarjeta de Stack -->
          <UiSpotlightCard
            v-else-if="folder.head === 'stack'"
            class="h-full rounded-xl border border-rule bg-surface/60 hover:border-rule-strong transition-all duration-200"
          >
            <NuxtLink
              :to="it.to"
              class="group flex flex-col h-full p-4 no-underline text-inherit"
              :data-row="it.key"
            >
              <div class="flex items-center justify-between gap-2 mb-2">
                <span v-if="it.category" class="px-2 py-0.5 rounded-md bg-paper/70 border border-rule font-mono text-[9.5px] text-dim uppercase">{{ it.category }}</span>
                <span v-if="it.since" class="font-mono text-[10.5px] text-faint">{{ it.since }}</span>
              </div>
              <h3 class="font-sans text-[16px] font-semibold tracking-[-0.02em] text-ink group-hover:text-sig transition-colors m-0 mb-1.5">
                {{ it.label }}
              </h3>
              <p v-if="it.note" class="font-sans text-[12.5px] text-dim leading-relaxed line-clamp-2 m-0 mb-3">
                {{ it.note }}
              </p>
              <div class="flex items-center justify-between pt-2.5 mt-auto border-t border-rule/70 font-mono text-[10.5px] text-dim group-hover:text-ink">
                <span>{{ tr.collection.filterRecords }}</span>
                <span class="text-sig transition-transform duration-150 group-hover:translate-x-0.5">→</span>
              </div>
            </NuxtLink>
          </UiSpotlightCard>

          <!-- Tarjeta de Artículos / Blog -->
          <UiSpotlightCard
            v-else-if="folder.head === 'articles'"
            class="h-full rounded-xl border border-rule bg-surface/60 hover:border-rule-strong transition-all duration-200"
          >
            <NuxtLink
              :to="it.to"
              class="group flex flex-col h-full p-4 sm:p-5 no-underline text-inherit min-w-0"
              :data-row="it.key"
            >
              <div class="flex items-center justify-between gap-2 mb-2 font-mono text-[10.5px] min-w-0">
                <span class="inline-flex items-center gap-1.5 text-green">
                  <span class="w-1.5 h-1.5 rounded-full bg-green" />
                  <span>{{ it.status ?? 'PUBLISHED' }}</span>
                </span>
                <span v-if="it.readingTimeMin" class="text-faint shrink-0">
                  {{ pad(it.readingTimeMin) }} min
                </span>
              </div>
              <h3 class="font-sans text-[16px] sm:text-[17px] font-semibold tracking-[-0.02em] text-ink group-hover:text-sig transition-colors leading-snug m-0 mb-2 line-clamp-2 break-words">
                {{ it.label }}
              </h3>
              <p v-if="it.summary" class="font-sans text-[13px] text-dim leading-relaxed line-clamp-3 m-0 mb-3 break-words">
                {{ it.summary }}
              </p>
              <div class="flex items-center justify-between pt-3 mt-auto border-t border-rule/70 font-mono text-[11px] text-dim group-hover:text-ink">
                <span>{{ isEs ? 'Leer artículo' : 'Read article' }}</span>
                <span class="text-sig transition-transform duration-150 group-hover:translate-x-0.5">→</span>
              </div>
            </NuxtLink>
          </UiSpotlightCard>

          <!-- Baldosa Estándar -->
          <NuxtLink v-else :to="it.to" class="tile rounded-xl" :class="it.kind" :data-row="it.key">
            <span class="n">{{ pad(n + 1) }}</span>
            <ExplorerBadge :kind="it.kind" :badge="it.badge" class="icono" />
            <span class="name">{{ it.label }}</span>
            <span class="meta">{{ it.desc ?? it.meta }}</span>
          </NuxtLink>
        </li>
      </ol>

      <!-- Vista de Tabla Técnica Compacta -->
      <div v-else-if="viewMode === 'table'" class="table-container rounded-xl overflow-hidden my-4">
        <table class="data-table">
          <thead>
            <tr>
              <th class="th-n">{{ tr.collection.tableIndex }}</th>
              <th class="th-name">{{ tr.collection.tableName }}</th>
              <th class="th-key">{{ tr.collection.tableSlug }}</th>
              <th class="th-meta">{{ tr.collection.tableMeta }}</th>
              <th class="th-kind">{{ isEs ? 'TIPO' : 'TYPE' }}</th>
              <th class="th-action">{{ isEs ? 'ACCIÓN' : 'ACTION' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(it, n) in folder.items" :key="it.key" class="t-row">
              <td class="td-n">{{ pad(n + 1) }}</td>
              <td class="td-name">
                <NuxtLink :to="it.to" class="t-link" :data-row="it.key">
                  <AppIcon :name="it.kind === 'folder' ? 'folder' : 'file'" :size="13" class="t-icon" />
                  <span class="t-label">{{ it.label }}</span>
                  <span v-if="it.badge" class="t-badge rounded">{{ it.badge }}</span>
                </NuxtLink>
              </td>
              <td class="td-key"><code>{{ it.key }}</code></td>
              <td class="td-meta">{{ it.meta }}</td>
              <td class="td-kind"><span class="badge-kind rounded">{{ it.kind }}</span></td>
              <td class="td-action">
                <NuxtLink :to="it.to" class="btn-open rounded-md">
                  <span>{{ isEs ? 'Abrir' : 'Open' }}</span>
                  <AppIcon name="chevron-right" :size="11" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="!folder.items.length" class="vacio">{{ isEs ? '00 registros encontrados para este filtro' : '00 records found for this filter' }}</p>
    </template>
  </section>
</template>

<style scoped>
/* Hints de Navegación y Guía Contextual */
.folder-header-hint {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--d-dim);
}
.folder-header-hint kbd {
  font-size: 9.5px;
  padding: 1px 4px;
  border: 1px solid var(--d-rule);
  background: var(--d-paper);
  border-radius: 2px;
  color: var(--d-sig);
}

.contextual-guide-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 14px 0 18px;
  padding: 8px 14px;
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
  border-left: 3px solid var(--d-sig);
  border-radius: 2px;
  font-family: var(--font-mono);
  transition: all var(--d-dur) ease;
}

.cgb-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--d-dim);
}

.cgb-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--d-sig);
  box-shadow: 0 0 6px var(--d-sig);
  flex-shrink: 0;
}

.cgb-label {
  font-weight: 800;
  color: var(--d-sig);
  letter-spacing: 0.04em;
  font-size: 10px;
  white-space: nowrap;
}

.cgb-text {
  flex: 1;
  min-width: 0;
}

.cgb-dismiss {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  background: transparent;
  border: 1px solid var(--d-rule);
  border-radius: 2px;
  padding: 3px 8px;
  font-family: inherit;
  font-size: 10px;
  color: var(--d-dim);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.cgb-dismiss:hover {
  border-color: var(--d-rule-strong);
  color: var(--d-ink);
  background: var(--d-hover);
}

.sw-h-hint {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--d-dim);
  font-weight: 400;
  margin-left: 8px;
}

.sw-h-hint kbd {
  font-size: 9.5px;
  padding: 1px 4px;
  border: 1px solid var(--d-rule);
  background: var(--d-paper);
  border-radius: 2px;
  color: var(--d-sig);
}

.folder-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Selector de Vista */
.view-toggle {
  display: inline-flex;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
}
.v-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  padding: 4px 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--d-dim);
  cursor: pointer;
  transition: all var(--d-dur) ease;
}
.v-btn:hover {
  color: var(--d-sig);
  background: var(--d-hover);
}
.v-btn.active {
  background: var(--d-hover);
  color: var(--d-sig);
}

/* Vista de Tabla Técnica Compacta */
.table-container {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  margin-top: 8px;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-text);
  font-size: 13px;
  text-align: left;
}
.data-table th {
  padding: 10px 14px;
  background: var(--d-paper);
  border-bottom: 1px solid var(--d-rule-strong);
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 800;
  color: var(--d-dim);
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.data-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--d-rule);
  vertical-align: middle;
}
.t-row:hover,
.t-row:focus-within {
  background: var(--d-hover);
}
.t-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--d-ink);
  text-decoration: none;
  font-weight: 600;
  transition: color var(--d-dur) ease;
}
.t-link:hover,
.t-row:hover .t-link {
  color: var(--d-sig);
}
.t-icon {
  color: var(--d-dim);
  flex-shrink: 0;
  transition: color var(--d-dur) ease;
}
.t-link:hover .t-icon,
.t-row:hover .t-icon {
  color: var(--d-sig);
}
.t-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--d-dim);
  border: 1px solid var(--d-rule);
  padding: 1px 4px;
  margin-left: 4px;
  transition: all var(--d-dur) ease;
}
.t-row:hover .t-badge {
  border-color: var(--d-sig);
  color: var(--d-sig);
}
.td-key code {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-dim);
}
.td-meta {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--d-dim);
}
.badge-kind {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  padding: 2px 6px;
  background: var(--d-paper);
  border: 1px solid var(--d-rule);
  color: var(--d-dim);
}
.btn-open {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--d-sig);
  text-decoration: none;
  padding: 3px 8px;
  border: 1px solid var(--d-rule);
  background: var(--d-paper);
  transition: all var(--d-dur) ease;
}
.btn-open:hover {
  background: var(--d-sig);
  color: var(--d-on-sig);
  border-color: var(--d-sig);
}


/* Facets */
.facet {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 8px 0 10px;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-sig);
  text-decoration: none;
  transition: all var(--d-dur) ease;
}
.facet:hover,
.facet:focus-visible {
  border-color: var(--d-sig);
  background: var(--d-hover);
  color: var(--d-sig-hover);
}
.facet-x {
  color: var(--d-dim);
  transition: color var(--d-dur) ease;
}
.facet:hover .facet-x,
.facet:focus-visible .facet-x {
  color: var(--d-sig-hover);
}

/* Grilla Clásica de Baldosas: fluida sin límites para llenar el ancho disponible */
.tiles-fallback-grid {
  list-style: none;
  margin: 0;
  padding: 12px 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(clamp(150px, 14vw, 210px), 1fr));
  gap: 12px;
  width: 100%;
}
.tile {
  position: relative;
  display: grid;
  grid-template-rows: auto auto auto;
  justify-items: center;
  gap: 2px;
  padding: 20px 12px 16px;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  color: var(--d-ink);
  text-decoration: none;
  text-align: center;
  transition: all var(--d-dur) ease;
}
.tile:hover,
.tile:focus-visible {
  background: var(--d-hover);
  border-color: var(--d-sig);
  transform: translateY(-2px);
}
.tile:hover .icono svg,
.tile:focus-visible .icono svg {
  stroke: var(--d-sig);
}
.tile:hover .name,
.tile:focus-visible .name {
  color: var(--d-sig);
}
.tile:hover .badge,
.tile:focus-visible .badge {
  color: var(--d-sig);
}
.n {
  position: absolute;
  top: 8px;
  left: 10px;
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-faint);
  font-variant-numeric: tabular-nums;
}
.icono { margin-bottom: 14px; }
.name {
  max-width: 100%;
  font-family: var(--font-text);
  font-size: var(--d-fs-name);
  font-weight: 600;
  line-height: 1.25;
  color: var(--d-ink);
  overflow-wrap: anywhere;
}
.meta {
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-dim);
}

/* ─── Tabla Técnica Compacta ───────────────────────────────────────────────── */
.table-container {
  margin-top: 16px;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  overflow-x: auto;
  width: 100%;
  -webkit-overflow-scrolling: touch;
}
.data-table {
  width: 100%;
  min-width: 580px;
  border-collapse: collapse;
  text-align: left;
  font-family: var(--font-mono);
  font-size: 12px;
}
.data-table th {
  padding: 10px 14px;
  background: var(--d-surface-raised);
  border-bottom: 1px solid var(--d-rule);
  color: var(--d-dim);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
}
.data-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--d-rule);
  vertical-align: middle;
}
.t-row:hover {
  background: var(--d-hover);
}
.td-n { color: var(--d-faint); width: 40px; }
.t-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--d-ink);
  font-family: var(--font-text);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}
.t-link:hover {
  color: var(--d-sig);
}
.t-icon { width: 20px; height: 24px; }
.td-key code {
  color: var(--d-dim);
  font-size: 11px;
}
.td-meta { color: var(--d-dim); }
.badge-kind {
  display: inline-block;
  padding: 2px 6px;
  background: var(--d-paper);
  border: 1px solid var(--d-rule);
  font-size: 10px;
  color: var(--d-dim);
  text-transform: uppercase;
}
.btn-open {
  color: var(--d-sig);
  text-decoration: none;
  font-weight: 700;
}
.btn-open:hover {
  text-decoration: underline;
}

.vacio {
  margin: 40px 0;
  text-align: center;
  font-family: var(--font-mono);
  color: var(--d-faint);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* INICIO: DASHBOARD EDITORIAL BRUTALISTA (ESTILO PÓSTER SUIZO)               */
/* ═══════════════════════════════════════════════════════════════════════════ */
.inicio-dashboard.poster-style {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

/* 1.1 Barra Superior de Blueprint & Metadatos */
.poster-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 16px;
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
  border-top: 2px solid var(--d-orange);
  font-family: var(--font-mono);
  font-size: 11px;
}
.pt-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.pt-mark {
  color: var(--d-orange);
  font-size: 14px;
}
.pt-role {
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--d-ink);
}
.pt-grid-coords {
  color: var(--d-faint);
  letter-spacing: 0.15em;
  font-size: 10px;
}
.pt-loc {
  color: var(--d-dim);
}
.pt-avail {
  font-weight: 800;
  color: var(--d-orange);
  letter-spacing: 0.05em;
}
.pt-crosses {
  color: var(--d-faint);
  letter-spacing: 0.2em;
  font-size: 10px;
}

/* 1.2 Hero Monumental de Cartelera */
.poster-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.85fr);
  gap: 24px;
  align-items: center;
  padding: 20px;
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
  position: relative;
  overflow: hidden;
}
.poster-hero::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-top: 24px solid var(--d-orange);
  border-left: 24px solid transparent;
  z-index: 5;
}

.poster-hero-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.poster-headline-wrap {
  margin: 0;
}
.poster-headline {
  margin: 0;
  display: flex;
  flex-direction: column;
  font-family: var(--font-poster);
  font-size: clamp(56px, 7.5vw, 102px);
  line-height: 0.88;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--d-ink);
}
.ph-row {
  display: block;
}
.ph-orange {
  color: var(--d-orange);
}
.ph-dot {
  display: inline-block;
  width: 0.22em;
  height: 0.22em;
  background: var(--d-ink);
  margin-left: 0.08em;
  vertical-align: baseline;
}

.poster-about {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--d-paper);
  border-left: 3px solid var(--d-orange);
}
.pa-tag-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pa-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: var(--d-ink);
}
.pa-hash {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--d-orange);
  letter-spacing: 0.1em;
}
.pa-text {
  margin: 0;
  font-family: var(--font-text);
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--d-dim);
}
.pa-globe-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 700;
  color: var(--d-ink);
  letter-spacing: 0.04em;
}
.pa-globe-icon {
  font-size: 13px;
}

.poster-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.poster-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  text-decoration: none;
  border-radius: 1px;
  transition: all 0.15s ease;
}
.poster-btn.primary {
  background: var(--d-orange);
  color: var(--d-on-sig);
  border: 1px solid var(--d-orange);
}
.poster-btn.primary:hover {
  background: var(--d-orange-deep);
  border-color: var(--d-orange-deep);
  color: var(--d-on-sig);
  box-shadow: 0 0 14px var(--d-orange-glow);
}
.poster-btn.secondary {
  background: var(--d-paper);
  color: var(--d-ink);
  border: 1px solid var(--d-rule-strong);
}
.poster-btn.secondary:hover {
  border-color: var(--d-orange);
  color: var(--d-orange);
  background: var(--d-hover);
}
.poster-btn.tertiary {
  background: var(--d-paper);
  color: var(--d-dim);
  border: 1px solid var(--d-rule);
}
.poster-btn.tertiary:hover {
  border-color: var(--d-rule-strong);
  color: var(--d-ink);
  background: var(--d-hover);
}
.poster-btn-arr {
  font-size: 13px;
  transition: transform 0.15s ease;
}
.poster-btn:hover .poster-btn-arr {
  transform: translateX(3px);
}

/* 1.2.B Retrato de Perfil de Mateo (Sin efectos 3D) */
.poster-hero-portrait {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
}
.portrait-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  background: var(--d-paper);
  border: 1px solid var(--d-rule);
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}
.portrait-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #000000;
  overflow: hidden;
  border-bottom: 1px solid var(--d-rule);
}
.portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.portrait-meta {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--d-surface);
}
.portrait-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.pm-name {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--d-ink);
  letter-spacing: 0.05em;
}
.pm-badge {
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 800;
  color: var(--d-green);
  letter-spacing: 0.04em;
}
.pm-role {
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 700;
  color: var(--d-orange);
  letter-spacing: 0.06em;
}
.pm-loc {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--d-dim);
  letter-spacing: 0.04em;
}

/* 1.25 Marquee Telemetría Continua */
.poster-ticker {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  padding: 8px 0;
  user-select: none;
  white-space: nowrap;
}
.ticker-track {
  display: inline-flex;
  align-items: center;
  gap: 24px;
  will-change: transform;
  animation: ticker-slide 55s linear infinite;
}
.poster-ticker:hover .ticker-track {
  animation-play-state: paused;
}
.ticker-item {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--d-dim);
  letter-spacing: 0.05em;
}
.ticker-dot {
  color: var(--d-orange);
  font-size: 7px;
}

/* Precision Corner Crop Marks (┌ ┐ └ ┘) — Calma Visual */
.corner-bracket {
  position: absolute;
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1;
  color: var(--d-faint);
  opacity: 0.25;
  transition: color var(--d-dur) ease, opacity var(--d-dur) ease;
  z-index: 5;
  pointer-events: none;
  user-select: none;
}
.corner-bracket.tl { top: 5px; left: 5px; }
.corner-bracket.tr { top: 5px; right: 5px; }
.corner-bracket.bl { bottom: 5px; left: 5px; }
.corner-bracket.br { bottom: 5px; right: 5px; }
.sw-card:hover .corner-bracket,
.bento-col:hover .corner-bracket {
  color: var(--d-orange);
  opacity: 0.85;
}
.bento-manifesto .corner-bracket {
  color: var(--d-faint);
  opacity: 0.25;
}
.bento-manifesto:hover .corner-bracket {
  color: var(--d-orange);
  opacity: 0.85;
}

/* Spotlight Cursor Effect */
.spotlight {
  position: relative;
  overflow: hidden;
}
.spotlight::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(360px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(255, 62, 0, 0.08), transparent 70%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.25s ease;
  z-index: 2;
}
.spotlight:hover::after {
  opacity: 1;
}
.bento-manifesto.spotlight::after {
  background: radial-gradient(360px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(0, 0, 0, 0.12), transparent 70%);
}

/* 1.3 Selected Work con Ribbon Vertical Naranja */
.selected-work-wrapper {
  width: 100%;
}
.sw-shell {
  display: flex;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
}
.sw-ribbon {
  flex: none;
  width: 44px;
  background: var(--d-orange);
  color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-family: var(--font-mono);
  font-weight: 900;
  font-size: 11px;
  letter-spacing: 0.16em;
  padding: 20px 0;
  user-select: none;
}
.sw-body {
  flex: 1;
  min-width: 0;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.sw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--d-rule);
  padding-bottom: 10px;
}
.sw-h-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.sw-h-num {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 800;
  color: var(--d-orange);
}
.sw-h-title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--d-ink);
  text-transform: uppercase;
}
.sw-h-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--d-orange);
  text-decoration: none;
}
.sw-h-link:hover {
  text-decoration: underline;
}

.sw-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(clamp(260px, 26vw, 360px), 1fr));
  gap: 16px;
}
.sw-card {
  display: flex;
  flex-direction: column;
  background: var(--d-paper);
  border: 1px solid var(--d-rule);
  text-decoration: none;
  color: inherit;
  position: relative;
  overflow: hidden;
  transition: transform 0.15s ease, border-color 0.15s ease;
}
.sw-card:hover {
  transform: translateY(-3px);
  border-color: var(--d-orange);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.25);
}
.sw-thumb-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9.5;
  background: #000000;
  overflow: hidden;
  border-bottom: 1px solid var(--d-rule);
}
.sw-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.25s ease;
}
.sw-card:hover .sw-img {
  transform: scale(1.03);
}
.sw-corner-notch {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0;
  height: 0;
  border-bottom: 14px solid var(--d-orange);
  border-left: 14px solid transparent;
  z-index: 4;
}
.sw-status-bar {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
}
.sw-badge {
  padding: 2px 7px;
  background: rgba(8, 8, 8, 0.88);
  backdrop-filter: blur(4px);
  border: 1px solid var(--d-green);
  color: var(--d-green);
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 800;
}
.sw-badge.wip {
  border-color: var(--d-orange);
  color: var(--d-orange);
}
.sw-year {
  padding: 2px 6px;
  background: rgba(8, 8, 8, 0.88);
  border: 1px solid var(--d-rule);
  color: var(--d-ink);
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 700;
}

.sw-meta {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.sw-title-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.sw-idx {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--d-orange);
}
.sw-title {
  margin: 0;
  font-family: var(--font-text);
  font-size: 16px;
  font-weight: 700;
  color: var(--d-ink);
}
.sw-org {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-faint);
}
.sw-desc {
  margin: 0;
  font-family: var(--font-text);
  font-size: 13px;
  line-height: 1.45;
  color: var(--d-dim);
  flex: 1;
}
.sw-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 4px;
}
.sw-chip {
  padding: 2px 7px;
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--d-dim);
}
.sw-cta {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--d-rule);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 800;
  color: var(--d-orange);
}

/* 1.4 Tríada Bento Editorial (Services / Manifesto / Tech Stack) */
.bento-triad-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  width: 100%;
}
.bento-col {
  padding: 16px 18px;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
.bento-col-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--d-rule);
  margin-bottom: 14px;
}
.bento-heading {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--d-ink);
}
.bento-heading-dark {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--d-orange);
}
.bento-cross {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--d-orange);
}

.bento-service-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.bento-service-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--d-rule);
  font-family: var(--font-mono);
  font-size: 11px;
}
.bento-service-list li:last-child {
  border-bottom: none;
}
.bs-n {
  font-weight: 800;
  color: var(--d-orange);
  width: 26px;
}
.bs-t {
  flex: 1;
  font-weight: 700;
  color: var(--d-ink);
}
.bs-p {
  font-weight: 800;
  color: var(--d-faint);
}

/* Columna 2: Manifiesto Constructivista Técnico (Base Grafito con Acentos Naranja Luminoso) */
.bento-manifesto {
  background: var(--d-surface);
  color: var(--d-ink);
  border: 1px solid var(--d-rule);
  position: relative;
  transition: all var(--d-dur) ease;
}
.bento-manifesto:hover {
  border-color: rgba(255, 62, 0, 0.45);
  box-shadow: 0 4px 24px rgba(255, 62, 0, 0.08);
}
.bento-manifesto .bento-col-head {
  border-bottom: 1px solid var(--d-rule);
}
.manifesto-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  z-index: 2;
}
.manifesto-quote {
  margin: 0;
  font-family: var(--font-poster);
  font-size: clamp(22px, 2.2vw, 28px);
  line-height: 1.1;
  letter-spacing: 0.02em;
  color: var(--d-ink);
  white-space: pre-line;
}
.manifesto-lead {
  margin: 0;
  font-family: var(--font-text);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--d-dim);
  white-space: pre-line;
}
.manifesto-footer {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 700;
  color: var(--d-orange);
  letter-spacing: 0.06em;
  border-top: 1px solid var(--d-rule);
  padding-top: 8px;
}
.manifesto-notch {
  position: absolute;
  bottom: -24px;
  right: -24px;
  width: 64px;
  height: 64px;
  background: var(--d-paper);
  transform: rotate(45deg);
  z-index: 3;
}

.bento-stack-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.bento-stack-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 0;
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 700;
  color: var(--d-ink);
  border-bottom: 1px dashed var(--d-rule);
}
.bento-stack-list li:last-child {
  border-bottom: none;
}
.sq-mark {
  color: var(--d-orange);
  font-size: 10px;
}

.mobile-only {
  display: none;
}

/* 1.5 Footer de Impacto Editorial */
.poster-footer {
  display: flex;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  position: relative;
  overflow: hidden;
}
.pf-ribbon {
  flex: none;
  width: 44px;
  background: var(--d-surface-raised);
  border-right: 1px solid var(--d-rule);
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-family: var(--font-mono);
  font-weight: 900;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  color: var(--d-dim);
  padding: 16px 0;
  user-select: none;
}
.pf-body {
  flex: 1;
  min-width: 0;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}
.pf-title {
  margin: 0;
  font-family: var(--font-poster);
  font-size: clamp(28px, 3.8vw, 48px);
  line-height: 0.95;
  color: var(--d-ink);
}
.pf-sub {
  margin: 6px 0 0;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-dim);
  font-weight: 700;
}
.pf-contact-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pf-c-tag {
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 800;
  color: var(--d-orange);
}
.pf-links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.pf-links li {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--d-ink);
}
.pf-links a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--d-ink);
  text-decoration: none;
  font-weight: 700;
  transition: color var(--d-dur) ease;
}
.pf-links a:hover {
  color: var(--d-orange);
  text-decoration: underline;
}

.pf-stamp-zone {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 32px;
  gap: 14px;
  border-left: 1px solid var(--d-rule);
  background: var(--d-paper);
}
.pf-stamp {
  width: 96px;
  height: 96px;
  color: var(--d-ink);
}
.pf-barcode-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.pf-barcode {
  height: 24px;
  width: 140px;
  background: repeating-linear-gradient(
    90deg,
    var(--d-ink) 0,
    var(--d-ink) 2px,
    transparent 2px,
    transparent 4px,
    var(--d-ink) 4px,
    var(--d-ink) 7px,
    transparent 7px,
    transparent 9px,
    var(--d-ink) 9px,
    var(--d-ink) 12px,
    transparent 12px,
    transparent 14px,
    var(--d-ink) 14px,
    var(--d-ink) 18px,
    transparent 18px,
    transparent 20px
  );
}
.pf-barcode-code {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: var(--d-dim);
}

/* ─── Media Queries Responsive para el Layout de Póster ───────────────────── */
@media (max-width: 960px) {
  .poster-hero {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .poster-hero-right {
    min-height: 300px;
  }
  .poster-avatar-stage {
    height: 320px;
  }
  .sw-ribbon,
  .pf-ribbon {
    display: none;
  }
  .poster-footer {
    flex-direction: column;
  }
  .pf-stamp-zone {
    border-left: none;
    border-top: 1px solid var(--d-rule);
    flex-direction: row;
    justify-content: space-around;
  }
}

@media (max-width: 640px) {
  .poster-topbar {
    flex-direction: column;
    align-items: flex-start;
  }
  .poster-actions {
    flex-direction: column;
    width: 100%;
  }
  .poster-btn {
    width: 100%;
    justify-content: space-between;
  }
  .bento-triad-grid {
    grid-template-columns: 1fr;
  }
}

/* ─── Tarjeta de Proyecto Especializada ────────────────────────────────────── */
.project-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  text-decoration: none;
  overflow: hidden;
  transition: all var(--d-dur) ease;
}
.project-card:hover {
  border-color: var(--d-sig);
  background: var(--d-hover);
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.project-thumb-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9.5;
  background: #000;
  overflow: hidden;
  border-bottom: 1px solid var(--d-rule);
}
.project-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}
.project-card:hover .project-thumb {
  transform: scale(1.02);
}
.project-thumb-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--d-surface-raised);
}

.project-status-bar {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  align-items: center;
}
.project-status-badge {
  padding: 3px 8px;
  background: rgba(9, 10, 15, 0.85);
  backdrop-filter: blur(4px);
  border: 1px solid var(--d-green);
  color: var(--d-green);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
}
.project-year-badge {
  padding: 3px 7px;
  background: rgba(9, 10, 15, 0.85);
  backdrop-filter: blur(4px);
  border: 1px solid var(--d-rule);
  color: var(--d-dim);
  font-family: var(--font-mono);
  font-size: 10px;
}

.project-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.project-title-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}
.p-num {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-faint);
  font-variant-numeric: tabular-nums;
}
.p-name {
  margin: 0;
  font-family: var(--font-text);
  font-size: 17px;
  font-weight: 700;
  color: var(--d-ink);
  letter-spacing: -0.01em;
}
.p-org {
  margin: 0 0 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-sig);
}
.p-summary {
  margin: 0 0 12px;
  font-family: var(--font-text);
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--d-dim);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.p-techs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: auto;
}
.p-tech-chip {
  padding: 2px 7px;
  border: 1px solid var(--d-rule);
  background: var(--d-paper);
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--d-ink);
}
.p-tech-chip.more {
  color: var(--d-faint);
}
.project-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--d-rule);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--d-sig);
  transition: color var(--d-dur) ease;
}
.cta-arrow {
  font-size: 14px;
  transition: transform var(--d-dur) ease, color var(--d-dur) ease;
}
.project-card:hover .project-cta,
.project-card:focus-visible .project-cta {
  color: var(--d-sig-hover);
}
.project-card:hover .cta-arrow,
.project-card:focus-visible .cta-arrow {
  transform: translateX(3px);
  color: var(--d-sig-hover);
}

/* ─── Tarjeta de Experiencia ───────────────────────────────────────────────── */
.exp-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 18px 16px 14px;
  border: 1px solid var(--d-rule);
  border-left: 3px solid var(--d-sig);
  background: var(--d-surface);
  text-decoration: none;
  transition: all var(--d-dur) ease;
}
.exp-card:hover {
  border-color: var(--d-sig);
  background: var(--d-hover);
  transform: translateY(-2px);
}
.exp-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.exp-org {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--d-sig);
}
.exp-period {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-faint);
}
.exp-role {
  margin: 0 0 8px;
  font-family: var(--font-text);
  font-size: 15px;
  font-weight: 700;
  color: var(--d-ink);
}
.exp-summary {
  margin: 0 0 12px;
  font-family: var(--font-text);
  font-size: 13px;
  line-height: 1.45;
  color: var(--d-dim);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.exp-techs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: auto;
  margin-bottom: 10px;
}
.exp-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--d-sig);
  border-top: 1px solid var(--d-rule);
  padding-top: 8px;
  transition: color var(--d-dur) ease;
}
.exp-card:hover .exp-cta,
.exp-card:focus-visible .exp-cta {
  color: var(--d-sig-hover);
}
.exp-card:hover .cta-arrow,
.exp-card:focus-visible .cta-arrow {
  transform: translateX(3px);
}

/* ─── Timeline de Experiencia ─────────────────────────────────────────────── */
.experience-timeline {
  display: flex;
  flex-direction: column;
}
.timeline-axis {
  background: linear-gradient(to bottom, var(--d-sig), var(--d-rule) 15%, var(--d-rule) 85%, var(--d-sig));
}
.timeline-node {
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
  border-left: 3px solid var(--d-sig);
  transition: all var(--d-dur) ease;
}
.timeline-node:hover {
  border-color: var(--d-sig);
  background: var(--d-hover);
  transform: translateX(3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}
.timeline-pin {
  box-shadow: 0 0 10px var(--d-sig-glow);
}
.tl-cta {
  transition: all var(--d-dur) ease;
}
.timeline-node:hover .tl-cta {
  color: var(--d-sig-hover);
}
.timeline-node:hover .cta-arrow {
  transform: translateX(4px);
}

/* ─── Blueprint Fallback de Proyecto ──────────────────────────────────────── */
.project-blueprint-fallback {
  aspect-ratio: 16 / 9.5;
  background: var(--d-surface-raised);
}
.quick-pill {
  transition: all var(--d-dur) ease;
}
.quick-pill:hover {
  border-color: var(--d-sig);
  color: var(--d-sig);
  background: var(--d-hover);
}

/* ─── Barra de Filtros de Proyectos ───────────────────────────────────────── */
.projects-filter-bar {
  border-left: 3px solid var(--d-sig);
}
.filter-pill {
  transition: all var(--d-dur) ease;
}

/* ─── Tarjeta de Stack ─────────────────────────────────────────────────────── */
.stack-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 16px 12px;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  text-decoration: none;
  transition: all var(--d-dur) ease;
}
.stack-card:hover {
  border-color: var(--d-sig);
  background: var(--d-hover);
  transform: translateY(-2px);
}
.stack-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 8px;
}
.stack-category {
  padding: 1px 6px;
  background: var(--d-surface-raised);
  border: 1px solid var(--d-rule);
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 700;
  color: var(--d-sig);
  text-transform: uppercase;
}
.stack-since {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--d-faint);
}
.stack-name {
  margin: 0 0 6px;
  font-family: var(--font-text);
  font-size: 16px;
  font-weight: 700;
  color: var(--d-ink);
}
.stack-note {
  margin: 0 0 10px;
  font-family: var(--font-text);
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--d-dim);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.stack-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 700;
  color: var(--d-sig);
  margin-top: auto;
  border-top: 1px solid var(--d-rule);
  padding-top: 8px;
  transition: color var(--d-dur) ease;
}
.stack-card:hover .stack-cta,
.stack-card:focus-visible .stack-cta {
  color: var(--d-sig-hover);
}
.stack-card:hover .cta-arrow,
.stack-card:focus-visible .cta-arrow {
  transform: translateX(3px);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* RESPONSIVE DESIGN & MOBILE PHONE OPTIMIZATION (<= 860px y <= 540px)        */
/* ═══════════════════════════════════════════════════════════════════════════ */
@media (max-width: 860px) {
  .inicio-dashboard.poster-style {
    gap: 16px;
  }

  /* Barra Superior de Coordenadas */
  .poster-topbar {
    padding: 8px 12px;
    font-size: 10.5px;
  }
  .pt-grid-coords,
  .pt-crosses {
    display: none;
  }

  /* Hero Section: En 1 columna, tipografía fluida adaptada a pantalla táctil */
  .poster-hero {
    grid-template-columns: 1fr;
    padding: 16px 14px;
    gap: 16px;
  }
  .poster-headline {
    font-size: clamp(38px, 10.5vw, 64px);
    line-height: 0.92;
  }
  .poster-about {
    padding: 14px 12px;
  }
  .pa-text {
    font-size: 13.5px;
    line-height: 1.5;
  }
  .poster-actions {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }
  .poster-btn {
    width: 100%;
    justify-content: center;
    padding: 12px 16px;
    font-size: 11.5px;
    min-height: 44px;
  }
  .poster-hero-portrait {
    max-width: 280px;
    margin: 0 auto;
  }

  /* Selected Work: El ribbon vertical de 44px se convierte en banner horizontal */
  .sw-shell {
    flex-direction: column;
  }
  .sw-ribbon {
    width: 100%;
    writing-mode: horizontal-tb;
    transform: none;
    padding: 8px 14px;
    font-size: 10.5px;
    letter-spacing: 0.12em;
    justify-content: flex-start;
  }
  .sw-body {
    padding: 14px 12px;
    gap: 14px;
  }
  .sw-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding-bottom: 8px;
  }
  .sw-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .sw-card {
    border-radius: 2px;
  }
  .sw-meta {
    padding: 12px;
  }
  .sw-cta {
    min-height: 38px;
  }

  /* Bento Grid: 1 columna natural */
  .bento-triad-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .bento-col {
    padding: 14px 14px;
  }
  .manifesto-quote {
    font-size: clamp(19px, 5.5vw, 24px);
  }

  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: inline !important;
  }

  /* Pie Editorial */
  .poster-footer {
    flex-direction: column;
    margin-bottom: calc(48px + env(safe-area-inset-bottom, 0px));
  }
  .pf-ribbon {
    width: 100%;
    writing-mode: horizontal-tb;
    transform: none;
    padding: 8px 14px;
    font-size: 10.5px;
    justify-content: flex-start;
    border-right: none;
    border-bottom: 1px solid var(--d-rule);
  }
  .pf-body {
    padding: 16px 14px;
    gap: 14px;
  }
  .pf-title {
    font-size: clamp(24px, 7vw, 36px);
  }
  .pf-stamp-zone {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--d-rule);
    padding: 14px;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
  }
  .pf-stamp {
    width: 90px;
    height: 90px;
  }

  /* Grid de Colecciones (Projects, Experience, Stack) */
  .folder-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .project-card,
  .exp-card,
  .stack-card {
    min-height: auto;
  }
}

@media (max-width: 540px) {
  .poster-topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .poster-headline {
    font-size: clamp(32px, 10vw, 44px);
  }
  .poster-hero-portrait {
    max-width: 230px;
  }
  .pf-stamp-zone {
    flex-direction: column;
    gap: 12px;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ESTILOS DEL DOSSIER EJECUTIVO EN MODO HIPERFOCO                           */
/* ═══════════════════════════════════════════════════════════════════════════ */
.hiperfoco-dossier {
  display: flex;
  flex-direction: column;
  gap: 40px;
  max-width: 760px;
  margin: 0 auto;
  padding: clamp(16px, 4vw, 36px) 16px;
  width: 100%;
  text-align: left;
}

.hd-header {
  text-align: left;
  border: none;
  padding-bottom: 0;
}
.hd-badge-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-dim);
  margin-bottom: 14px;
}
@media (max-width: 540px) {
  .hd-badge-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .hd-badge-row .hd-sep {
    display: none;
  }
}
.hd-status {
  color: var(--d-ink);
  font-weight: 700;
}
.hd-loc {
  color: var(--d-dim);
}

.hd-name {
  font-family: var(--font-text);
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
  color: var(--d-ink);
  text-align: left;
}
.hd-role {
  font-family: var(--font-mono);
  font-size: clamp(12px, 1.3vw, 14px);
  color: var(--d-dim);
  margin: 0 0 18px;
  text-align: left;
}

.hd-contact-bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  flex-wrap: wrap;
  font-family: var(--font-mono);
  font-size: 12px;
}
.hd-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--d-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color var(--d-dur) ease;
}
.hd-link:hover,
.hd-link:focus-visible {
  color: var(--d-sig);
}
.hd-sep {
  color: var(--d-faint);
}

.hd-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  text-align: left;
}
.hd-sec-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  border: none;
  padding: 0;
}
.hd-sec-title {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 800;
  color: var(--d-dim);
  letter-spacing: 0.08em;
  text-align: left;
  margin: 0;
  border: none;
}
.hd-sec-meta {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--d-faint);
}

.hd-lead {
  font-family: var(--font-text);
  font-size: clamp(14px, 1.3vw, 16px);
  line-height: 1.75;
  color: var(--d-ink);
  max-width: 68ch;
  margin: 0;
  text-align: left;
}
.hd-lead strong {
  color: var(--d-ink);
  font-weight: 700;
}

/* Nav Row Minimalista */
.hd-nav-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  font-family: var(--font-mono);
  font-size: 12.5px;
}
.hd-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--d-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: opacity var(--d-dur) ease;
}
.hd-nav-link:hover {
  opacity: 0.7;
}
.hnl-num {
  color: var(--d-dim);
}
.hnl-count {
  color: var(--d-faint);
  font-size: 11px;
}

/* Proyectos Limpios */
.hd-clean-projects {
  display: flex;
  flex-direction: column;
  gap: 28px;
  text-align: left;
  margin-top: 4px;
}
.hd-clean-proj {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  text-align: left;
}
.hd-cp-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  flex-wrap: wrap;
}
.hd-cp-num {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--d-dim);
}
.hd-cp-title {
  color: var(--d-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.hd-cp-title:hover {
  opacity: 0.7;
}
.hd-cp-year {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--d-dim);
  font-weight: 400;
}
.hd-cp-role {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--d-dim);
  font-weight: 400;
}
.hd-cp-desc {
  font-family: var(--font-text);
  font-size: 13.5px;
  color: var(--d-dim);
  margin: 0;
  max-width: 65ch;
  line-height: 1.5;
  text-align: left;
}
.hd-cp-meta {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-dim);
  flex-wrap: wrap;
}
.hd-cp-metric {
  color: var(--d-ink);
  font-weight: 600;
}
.hd-cp-stack {
  color: var(--d-faint);
}
.hd-cp-links {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  margin-top: 2px;
}
.hd-cp-link {
  color: var(--d-ink);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.hd-cp-link:hover {
  opacity: 0.7;
}

/* Split Columns Minimalista */
.hd-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  text-align: left;
}
@media (max-width: 768px) {
  .hd-split {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}
.hd-clean-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: flex;
  flex-direction: column;
  gap: 22px;
  text-align: left;
}
.hd-cl-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  font-size: 14px;
  color: var(--d-ink);
}
.hd-cl-top strong {
  font-weight: 700;
}
.hd-cl-top span {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-dim);
}
.hd-cl-sub {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--d-dim);
  margin: 3px 0 4px;
  text-align: left;
}
.hd-cl-body {
  font-family: var(--font-text);
  font-size: 13px;
  color: var(--d-ink);
  line-height: 1.5;
  margin: 0;
  text-align: left;
}

</style>
