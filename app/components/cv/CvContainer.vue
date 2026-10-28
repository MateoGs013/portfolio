<script setup lang="ts">
// Componente de Currículum Vitae Dual — Mateo Gabriel Sonzogni
// Orquestador de modos: Harvard ATS (académico / corporate) vs Modern IDE (terminal / code editor)
// Consumo dinámico de datos, conmutación reactiva, Hyperfocus binding y exportación print/PDF A4.

import type { Detail } from '~/lib/explorer'
import type { CvDeliverable } from './types'
import AppIcon from '~/components/ui/AppIcon.vue'
import UiSegmentedSwitch from '~/components/ui/UiSegmentedSwitch.vue'
import CvHarvardAts from './CvHarvardAts.vue'
import CvModernIde from './CvModernIde.vue'

const props = defineProps<{
  detail?: Detail
}>()

const { isEs } = usePortfolioLocale()
const { isHyperfocus } = useHyperfocus()
const mode = ref<'harvard' | 'modern'>('modern')

watch(isHyperfocus, (val) => {
  if (val) {
    mode.value = 'harvard'
  }
}, { immediate: true })

function getDocField(name: string): string | null {
  const row = props.detail?.rows?.find(r => r.name === name)
  return (row && typeof row.value === 'string' && row.value.trim()) ? row.value : null
}

const cvName = computed(() => getDocField('name') || 'MATEO GABRIEL SONZOGNI')
const cvRole = computed(() => isEs.value
  ? (getDocField('role') || 'Desarrollador Frontend & Full Stack · Creative Developer')
  : 'Frontend & Full Stack Developer · Creative Developer',
)
const cvLocation = computed(() => isEs.value
  ? (getDocField('location') || 'Río Negro, Patagonia Argentina')
  : 'Río Negro, Patagonia, Argentina',
)
const cvBio = computed(() => {
  if (isEs.value) {
    const customBio = getDocField('engineering_philosophy') || getDocField('bio')
    if (customBio) return customBio
    return 'Desarrollador de software especializado en ingeniería frontend reactiva, arquitectura de APIs y experiencia de usuario. Tesis de grado preaprobada en Escuela Da Vinci con 382 commits liderando la arquitectura de un asistente de IA on-premise. Trayectoria verificable en producción con más de 10 entregables para clientes en España y Argentina (La Rúcula Gastrobar, ARG Piscinas). Dominio de TypeScript, Vue 3, Nuxt 4, React, Next.js, Node.js, FastAPI y PostgreSQL. Criterio integral de producto y diseño de punta a punta.'
  }
  return 'Software engineer specialized in reactive frontend engineering, API architecture, and user experience. Pre-approved degree thesis at Da Vinci School with 382 commits leading system architecture for an on-premise AI assistant. Verifiable production track record with 10+ deliverables for clients across Spain and Argentina (La Rúcula Gastrobar, ARG Piscinas). Proficient in TypeScript, Vue 3, Nuxt 4, React, Next.js, Node.js, FastAPI, and PostgreSQL. End-to-end product design mindset.'
})

const cvEmail = computed(() => props.detail?.contact?.email || 'mateogabus@gmail.com')
const cvGithub = computed(() => props.detail?.contact?.github || 'https://github.com/MateoGs013')
const cvGithubText = computed(() => cvGithub.value.replace(/^https?:\/\/(www\.)?/, ''))
const cvLinkedin = computed(() => props.detail?.contact?.linkedin || 'https://www.linkedin.com/in/mateo-sonzogni')
const cvLinkedinText = computed(() => cvLinkedin.value.replace(/^https?:\/\/(www\.)?/, ''))
const cvTimezone = computed(() => props.detail?.contact?.timezone || 'UTC-3')

const cvDeliverables = computed<CvDeliverable[]>(() => {
  const dbProjects = props.detail?.projects || []
  const findDb = (slugKeywords: string[]) =>
    dbProjects.find(p => slugKeywords.some(k => p.slug?.toLowerCase().includes(k) || p.title?.toLowerCase().includes(k)))

  const pYnara = findDb(['ynara'])
  const pRucula = findDb(['rucula', 'la-rucula'])
  const pArg = findDb(['argpiscinas', 'arg-piscinas', 'arg piscinas'])
  const pEros = findDb(['eros'])

  if (isEs.value) {
    return [
      {
        slug: 'ynara',
        title: pYnara?.title || 'Ynara AI Assistant',
        badge: 'Tesis Da Vinci',
        date: '05/2026 – 07/2026',
        role: 'Arquitecto de Software & Lead Frontend',
        location: 'Buenos Aires, Argentina',
        description: 'Asistente de IA on-premise adaptativo con inferencia local y persistencia vectorial sobre PostgreSQL + pgvector.',
        bullets: [
          'Lideré la arquitectura técnica y el frontend reactivo con 382 commits a lo largo de 6 semanas.',
          'Diseñé pipelines de inferencia y memoria vectorial persistente en Next.js y FastAPI con latencia sub-100ms en local.',
        ],
        tags: Array.isArray(pYnara?.techs) && pYnara.techs.length ? pYnara.techs.map(t => t.name) : ['FastAPI', 'Next.js', 'PostgreSQL', 'pgvector', 'TypeScript', 'Python'],
      },
      {
        slug: 'la-rucula',
        title: pRucula?.title || 'La Rúcula Gastrobar',
        badge: 'Producción',
        date: '03/2026 – 07/2026',
        role: 'Desarrollador Full Stack & Diseñador UI',
        location: 'Cádiz, España',
        description: 'Sitio editorial menu-first optimizado para escaneo QR de clientes en mesa con arquitectura de caché offline.',
        bullets: [
          'Puntuación Lighthouse de 99 en Performance y 100 en SEO y Accesibilidad con bundle final de 42 KB.',
          'Integración con CMS propio y fallback en caché offline para operación continua ante caídas de red.',
        ],
        tags: Array.isArray(pRucula?.techs) && pRucula.techs.length ? pRucula.techs.map(t => t.name) : ['Vue 3', 'Vite', 'Tailwind CSS', 'GSAP', 'Lenis'],
      },
      {
        slug: 'arg-piscinas',
        title: pArg?.title || 'ARG Piscinas',
        badge: 'Producción',
        date: '01/2026 – 07/2026',
        role: 'Desarrollador Full Stack',
        location: 'Andalucía, España',
        description: 'Plataforma corporativa multi-idioma (ES/EN/DE) con panel de control autónomo para carga de obras y blog.',
        bullets: [
          'Plataforma corporativa multi-idioma (ES/EN/DE) con panel de control autónomo para carga de obras y blog.',
          'Modelado relacional y tipado estricto de extremo a extremo con Prisma ORM, Node.js y TypeScript.',
        ],
        tags: Array.isArray(pArg?.techs) && pArg.techs.length ? pArg.techs.map(t => t.name) : ['Vue 3', 'Node.js', 'Prisma', 'Tailwind CSS', 'TypeScript'],
      },
      {
        slug: 'eros',
        title: pEros?.title || 'Eros Career OS',
        badge: 'Producción',
        date: '2026',
        role: 'Arquitecto de Software & Automatización',
        location: 'Remoto',
        description: 'Sistema multiagente autónomo para búsqueda de empleo tech y generación de propuestas.',
        bullets: [
          'Sistema multiagente con scoring semántico, análisis de vacantes y orquestación con Google Gemini.',
          'Servicios backend en FastAPI, SQLite persistente y despacho reactivo con bot de Telegram.',
        ],
        tags: ['FastAPI', 'Python', 'SQLite', 'Gemini AI', 'n8n'],
      },
      {
        slug: 'freelance',
        title: 'Desarrollo Freelance',
        badge: 'Producción',
        date: '2023 – Presente',
        role: 'Desarrollador Full Stack',
        location: 'Remoto',
        description: 'Desarrollo de software y soluciones web llave en mano para clientes de diversos rubros con arquitectura integral y APIs REST.',
        bullets: [
          'Desarrollo integral de punta a punta: arquitectura de sistemas, diseño UI en Figma y despliegue a producción en ~10 proyectos reales.',
          'Diseño y consumo de APIs REST modulares con micro-interacciones, tipado estricto y testing automatizado.',
        ],
        tags: ['TypeScript', 'Vue 3', 'Node.js', 'PostgreSQL', 'Docker'],
      },
    ]
  }

  return [
    {
      slug: 'ynara',
      title: pYnara?.title || 'Ynara AI Assistant',
      badge: 'Da Vinci Thesis',
      date: '05/2026 – 07/2026',
      role: 'Software Architect & Lead Frontend',
      location: 'Buenos Aires, Argentina',
      description: 'Adaptive on-premise AI assistant with local inference and persistent vector memory over PostgreSQL + pgvector.',
      bullets: [
        'Led technical architecture and reactive frontend with 382 commits across 6 weeks of engineering.',
        'Engineered inference pipelines and persistent vector memory with Next.js and FastAPI achieving sub-100ms response times locally.',
      ],
      tags: Array.isArray(pYnara?.techs) && pYnara.techs.length ? pYnara.techs.map(t => t.name) : ['FastAPI', 'Next.js', 'PostgreSQL', 'pgvector', 'TypeScript', 'Python'],
    },
    {
      slug: 'la-rucula',
      title: pRucula?.title || 'La Rúcula Gastrobar',
      badge: 'Production',
      date: '03/2026 – 07/2026',
      role: 'Full Stack Developer & UI Designer',
      location: 'Cadiz, Spain',
      description: 'Editorial menu-first web app optimized for table-side QR scanning with cached offline resilience.',
      bullets: [
        'Achieved 99 Performance and 100 SEO & Accessibility Lighthouse scores with a compact 42 KB bundle.',
        'Integrated proprietary CMS and cached offline fallbacks ensuring uninterrupted service during outages.',
      ],
      tags: Array.isArray(pRucula?.techs) && pRucula.techs.length ? pRucula.techs.map(t => t.name) : ['Vue 3', 'Vite', 'Tailwind CSS', 'GSAP', 'Lenis'],
    },
    {
      slug: 'arg-piscinas',
      title: pArg?.title || 'ARG Piscinas',
      badge: 'Production',
      date: '01/2026 – 07/2026',
      role: 'Full Stack Developer',
      location: 'Andalucia, Spain',
      description: 'Multilingual corporate web platform (ES/EN/DE) with custom CMS dashboard for projects and blog.',
      bullets: [
        'Multilingual corporate web platform (ES/EN/DE) with custom CMS dashboard for projects and blog.',
        'Modeled relational schemas and end-to-end type safety using Prisma ORM, Node.js, and TypeScript.',
      ],
      tags: Array.isArray(pArg?.techs) && pArg.techs.length ? pArg.techs.map(t => t.name) : ['Vue 3', 'Node.js', 'Prisma', 'Tailwind CSS', 'TypeScript'],
    },
    {
      slug: 'eros',
      title: pEros?.title || 'Eros Career OS',
      badge: 'Production',
      date: '2026',
      role: 'Software Architect & Automation',
      location: 'Remote',
      description: 'Autonomous multi-agent system for tech job hunting, semantic scoring, and proposal delivery.',
      bullets: [
        'Multi-agent pipeline with semantic vacancy matching and LLM orchestration using Google Gemini.',
        'Backend services with FastAPI, persistent SQLite, and reactive dispatching through Telegram bot.',
      ],
      tags: ['FastAPI', 'Python', 'SQLite', 'Gemini AI', 'n8n'],
    },
    {
      slug: 'freelance',
      title: 'Freelance Solutions',
      badge: 'Production',
      date: '2023 – Present',
      role: 'Full Stack Developer',
      location: 'Remote',
      description: 'Full-stack software development and turnkey web solutions for diverse clients with end-to-end architecture and REST APIs.',
      bullets: [
        'End-to-end turnkey web solutions combining Figma UI design and production deployments across ~10 real-world projects.',
        'Engineered decoupled REST APIs with micro-interactions, strict type-safety, and automated test coverage.',
      ],
      tags: ['TypeScript', 'Vue 3', 'Node.js', 'PostgreSQL', 'Docker'],
    },
  ]
})

const cvDownloadBaseName = computed(() => {
  const lang = isEs.value ? 'ES' : 'EN'
  return `CV-${lang}-Mateo-Sonzogni-ATS`
})

const cvDownloadFileName = computed(() => `${cvDownloadBaseName.value}.pdf`)
const cvPdfUrl = computed(() => `/cv/${cvDownloadFileName.value}`)

let originalDocTitle = ''

function handleBeforePrint() {
  if (import.meta.client) {
    originalDocTitle = document.title
    document.title = cvDownloadBaseName.value
  }
}

function handleAfterPrint() {
  if (import.meta.client && originalDocTitle) {
    document.title = originalDocTitle
  }
}

onMounted(() => {
  window.addEventListener('beforeprint', handleBeforePrint)
  window.addEventListener('afterprint', handleAfterPrint)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeprint', handleBeforePrint)
  window.removeEventListener('afterprint', handleAfterPrint)
})

function printCV() {
  if (import.meta.client) {
    handleBeforePrint()
    window.print()
  }
}
</script>

<template>
  <section class="cv-wrapper w-full" :class="`mode-${mode}`">
    <!-- Barra de Herramientas del CV (Segmented Switch + Export Actions) -->
    <header class="cv-toolbar flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 mb-5 bg-surface/70 border border-rule rounded-xl no-print">
      <div class="flex items-center gap-2.5">
        <span class="font-mono text-[10.5px] text-dim uppercase tracking-wider hidden sm:inline">{{ isEs ? 'Formato:' : 'Format:' }}</span>
        <UiSegmentedSwitch
          v-model="mode"
          :options="[
            { value: 'modern', label: isEs ? 'Moderno + Foto' : 'Modern + Photo', shortLabel: isEs ? 'Moderno' : 'Modern' },
            { value: 'harvard', label: 'Harvard ATS (A4)', shortLabel: 'ATS (A4)' },
          ]"
          :aria-label="isEs ? 'Formato de CV' : 'CV format'"
          size="sm"
        />
        <span class="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-sig/10 text-sig border border-sig/20">
          <span class="w-1.5 h-1.5 rounded-full bg-sig" />
          {{ isEs ? '1 PÁGINA A4' : '1 PAGE A4' }}
        </span>
      </div>

      <div class="cv-actions flex items-center gap-2 max-sm:w-full">
        <!-- Botón de Descarga Directa PDF -->
        <a
          :href="cvPdfUrl"
          :download="cvDownloadFileName"
          class="cv-action-btn inline-flex items-center justify-center gap-1.5 h-8 px-3 bg-paper/80 hover:bg-hover border border-rule hover:border-rule-strong text-ink font-mono text-[11px] font-semibold no-underline cursor-pointer transition-all active:scale-[0.98] rounded-lg max-sm:flex-1"
          :title="isEs ? `Descargar archivo PDF (${cvDownloadFileName})` : `Download PDF file (${cvDownloadFileName})`"
        >
          <AppIcon name="download" :size="12" class="text-sig" />
          <span>{{ isEs ? 'Descargar PDF' : 'Download PDF' }}</span>
        </a>

        <!-- Botón de Impresión Navegador -->
        <button
          type="button"
          class="cv-action-btn group inline-flex items-center justify-center gap-1.5 h-8 px-3 bg-paper/80 hover:bg-hover border border-rule hover:border-rule-strong text-ink font-mono text-[11px] font-semibold no-underline cursor-pointer transition-all active:scale-[0.98] rounded-lg max-sm:flex-1"
          :title="isEs ? 'Imprimir en papel o guardar como PDF (Ctrl+P)' : 'Print or save as PDF (Ctrl+P)'"
          @click="printCV"
        >
          <AppIcon name="printer" :size="12" class="text-dim group-hover:text-ink" />
          <span>{{ isEs ? 'Imprimir' : 'Print' }}</span>
        </button>
      </div>
    </header>

    <!-- Harvard ATS View (Siempre visible al imprimir para garantizar el Invariante #6 de 1 página A4 ATS) -->
    <div :class="mode === 'harvard' ? 'block' : 'hidden print:block'">
      <CvHarvardAts
        :name="cvName"
        :role="cvRole"
        :location="cvLocation"
        :bio="cvBio"
        :email="cvEmail"
        :github="cvGithub"
        :github-text="cvGithubText"
        :linkedin="cvLinkedin"
        :linkedin-text="cvLinkedinText"
        :deliverables="cvDeliverables"
        :is-es="isEs"
      />
    </div>

    <!-- Modern IDE / Code Editor View (Vista interactiva en pantalla, oculta en impresión A4) -->
    <div v-if="mode === 'modern'" class="print:hidden">
      <CvModernIde
        :name="cvName"
        :role="cvRole"
        :location="cvLocation"
        :bio="cvBio"
        :email="cvEmail"
        :github="cvGithub"
        :github-text="cvGithubText"
        :linkedin="cvLinkedin"
        :timezone="cvTimezone"
        :deliverables="cvDeliverables"
        :is-es="isEs"
      />
    </div>
  </section>
</template>
