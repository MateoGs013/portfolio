<script setup lang="ts">
// Componente de Currículum Vitae Dual — Mateo Gabriel Sonzogni
// Orquestador de modos: Harvard ATS (académico / corporate) vs Modern IDE (terminal / code editor)
// Consumo dinámico de datos, conmutación reactiva, Hyperfocus binding y exportación print/PDF A4.

import type { Detail } from '~/lib/explorer'
import type { CvDeliverable } from './types'
import AppIcon from '~/components/ui/AppIcon.vue'
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
const cvBio = computed(() => isEs.value
  ? 'Desarrollador de software especializado en ingeniería frontend reactiva, arquitectura de APIs y experiencia de usuario. Tesis de grado preaprobada en Escuela Da Vinci con 382 commits liderando la arquitectura de un asistente de IA on-premise. Trayectoria verificable en producción con más de 10 entregables para clientes en España y Argentina (La Rúcula Gastrobar, ARG Piscinas). Dominio de TypeScript, Vue 3, Nuxt 4, React, Next.js, Node.js, FastAPI y PostgreSQL. Criterio integral de producto y diseño de punta a punta.'
  : 'Software engineer specialized in reactive frontend engineering, API architecture, and user experience. Pre-approved degree thesis at Da Vinci School with 382 commits leading system architecture for an on-premise AI assistant. Verifiable production track record with 10+ deliverables for clients across Spain and Argentina (La Rúcula Gastrobar, ARG Piscinas). Proficient in TypeScript, Vue 3, Nuxt 4, React, Next.js, Node.js, FastAPI, and PostgreSQL. End-to-end product design mindset.',
)

const cvEmail = computed(() => props.detail?.contact?.email || 'mateogabus@gmail.com')
const cvGithub = computed(() => props.detail?.contact?.github || 'https://github.com/MateoGs013')
const cvGithubText = computed(() => cvGithub.value.replace(/^https?:\/\/(www\.)?/, ''))
const cvLinkedin = computed(() => props.detail?.contact?.linkedin || 'https://www.linkedin.com/in/mateo-sonzogni')
const cvLinkedinText = computed(() => cvLinkedin.value.replace(/^https?:\/\/(www\.)?/, ''))
const cvTimezone = computed(() => props.detail?.contact?.timezone || 'UTC-3')

const cvDeliverables = computed<CvDeliverable[]>(() => {
  if (isEs.value) {
    return [
      {
        slug: 'ynara',
        title: 'Ynara AI Assistant',
        badge: 'Tesis Da Vinci',
        date: '05/2026 – 07/2026',
        role: 'Arquitecto de Software & Lead Frontend',
        location: 'Buenos Aires, Argentina',
        description: 'Asistente de IA on-premise adaptativo con inferencia local y persistencia vectorial sobre PostgreSQL + pgvector.',
        bullets: [
          'Lideré la arquitectura técnica y el frontend reactivo con 382 commits a lo largo de 6 semanas.',
          'Diseñé pipelines de inferencia y memoria vectorial persistente en Next.js y FastAPI con latencia sub-100ms en local.',
        ],
        tags: ['FastAPI', 'Next.js', 'PostgreSQL', 'pgvector', 'TypeScript', 'Python'],
      },
      {
        slug: 'la-rucula',
        title: 'La Rúcula Gastrobar',
        badge: 'Freelance',
        date: '03/2026 – 07/2026',
        role: 'Desarrollador Full Stack & Diseñador UI',
        location: 'Cádiz, España',
        description: 'Sitio editorial menu-first optimizado para escaneo QR de clientes en mesa con arquitectura de caché offline.',
        bullets: [
          'Puntuación Lighthouse de 99 en Performance y 100 en SEO y Accesibilidad con bundle de 42 KB.',
          'Integración con CMS propio y fallback en caché para operación continua ante caídas de red.',
        ],
        tags: ['Vue 3', 'Vite', 'Tailwind CSS', 'GSAP', 'Lenis'],
      },
      {
        slug: 'arg-piscinas',
        title: 'ARG Piscinas',
        badge: 'Freelance',
        date: '01/2026 – 07/2026',
        role: 'Desarrollador Full Stack',
        location: 'Andalucía, España',
        description: 'Plataforma corporativa multi-idioma (ES/EN/DE) con panel de control autónomo para carga de obras y blog.',
        bullets: [
          'Modelado relacional y tipado estricto de extremo a extremo con Prisma ORM, Node.js y TypeScript.',
        ],
        tags: ['Vue 3', 'Node.js', 'Prisma', 'Tailwind CSS', 'TypeScript'],
      },
      {
        slug: 'freelance',
        title: 'Freelance',
        badge: 'Freelance',
        date: '2023 – Presente',
        role: 'Desarrollador Full Stack',
        location: 'Remoto',
        description: 'Desarrollo de software y soluciones web llave en mano para clientes de diversos rubros con arquitectura integral y APIs REST.',
        bullets: [
          'Desarrollo de punta a punta: arquitectura de sistemas, diseño en Figma y despliegue a producción en ~10 proyectos reales.',
        ],
        tags: ['TypeScript', 'Vue 3', 'Node.js', 'PostgreSQL', 'Docker'],
      },
    ]
  }

  return [
    {
      slug: 'ynara',
      title: 'Ynara AI Assistant',
      badge: 'Da Vinci Thesis',
      date: '05/2026 – 07/2026',
      role: 'Software Architect & Lead Frontend',
      location: 'Buenos Aires, Argentina',
      description: 'Adaptive on-premise AI assistant with local inference and persistent vector memory over PostgreSQL + pgvector.',
      bullets: [
        'Led technical architecture and reactive frontend with 382 commits across 6 weeks of engineering.',
        'Engineered inference pipelines and persistent vector memory with Next.js and FastAPI achieving sub-100ms response times locally.',
      ],
      tags: ['FastAPI', 'Next.js', 'PostgreSQL', 'pgvector', 'TypeScript', 'Python'],
    },
    {
      slug: 'la-rucula',
      title: 'La Rúcula Gastrobar',
      badge: 'Freelance',
      date: '03/2026 – 07/2026',
      role: 'Full Stack Developer & UI Designer',
      location: 'Cadiz, Spain',
      description: 'Editorial menu-first web app optimized for table-side QR scanning with cached offline resilience.',
      bullets: [
        'Achieved 99 Performance and 100 SEO & Accessibility Lighthouse scores with a compact 42 KB bundle.',
        'Integrated proprietary CMS and cached offline fallbacks ensuring uninterrupted service during outages.',
      ],
      tags: ['Vue 3', 'Vite', 'Tailwind CSS', 'GSAP', 'Lenis'],
    },
    {
      slug: 'arg-piscinas',
      title: 'ARG Piscinas',
      badge: 'Freelance',
      date: '01/2026 – 07/2026',
      role: 'Full Stack Developer',
      location: 'Andalucia, Spain',
      description: 'Multilingual corporate web platform (ES/EN/DE) with custom CMS dashboard for projects and blog.',
      bullets: [
        'Modeled relational schemas and end-to-end type safety using Prisma ORM, Node.js, and TypeScript.',
      ],
      tags: ['Vue 3', 'Node.js', 'Prisma', 'Tailwind CSS', 'TypeScript'],
    },
    {
      slug: 'freelance',
      title: 'Freelance',
      badge: 'Freelance',
      date: '2023 – Present',
      role: 'Full Stack Developer',
      location: 'Remote',
      description: 'Full-stack software development and turnkey web solutions for diverse clients with end-to-end architecture and REST APIs.',
      bullets: [
        'End-to-end turnkey web solutions combining Figma UI design and production deployments across ~10 real-world projects.',
      ],
      tags: ['TypeScript', 'Vue 3', 'Node.js', 'PostgreSQL', 'Docker'],
    },
  ]
})

const cvDownloadBaseName = computed(() => {
  const lang = isEs.value ? 'ES' : 'EN'
  if (mode.value === 'harvard') {
    return `CV-${lang}-Mateo-Sonzogni-ATS`
  }
  return `CV-${lang}-Mateo-Sonzogni`
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
    <!-- Barra de Herramientas del CV -->
    <header class="cv-toolbar flex items-center justify-between gap-3 px-4 py-2.5 mb-5 bg-surface border border-rule max-[820px]:flex-col max-[820px]:items-stretch max-[820px]:gap-2.5 max-[820px]:p-3 no-print">
      <div class="cv-selector inline-flex border border-rule bg-paper max-[820px]:w-full" role="group" :aria-label="isEs ? 'Estilo de Currículum Vitae' : 'Resume format style'">
        <button
          type="button"
          class="cv-btn group inline-flex items-center gap-1.5 px-3.5 py-1.5 border-0 font-mono text-[11.5px] font-bold cursor-pointer transition-colors duration-150 max-[820px]:flex-1 max-[820px]:justify-center max-[820px]:text-[11px] max-[820px]:py-2"
          :class="mode === 'modern' ? 'bg-sig text-on-sig' : 'bg-transparent text-dim hover:text-ink hover:bg-hover'"
          :title="isEs ? 'Ver CV moderno editorial con fotografía técnica' : 'View modern editorial tech resume with photo'"
          @click="mode = 'modern'"
        >
          <AppIcon name="user" :size="13" class="cv-btn-icon shrink-0 transition-colors duration-150 group-hover:text-sig group-[.bg-sig]:text-on-sig" />
          <span>{{ isEs ? 'MODERNO + FOTO' : 'MODERN + PHOTO' }}</span>
        </button>
        <button
          type="button"
          class="cv-btn group inline-flex items-center gap-1.5 px-3.5 py-1.5 border-0 font-mono text-[11.5px] font-bold cursor-pointer transition-colors duration-150 max-[820px]:flex-1 max-[820px]:justify-center max-[820px]:text-[11px] max-[820px]:py-2"
          :class="mode === 'harvard' ? 'bg-sig text-on-sig' : 'bg-transparent text-dim hover:text-ink hover:bg-hover'"
          :title="isEs ? 'Ver CV formato clásico Harvard ATS en blanco y negro' : 'View classic black & white Harvard ATS resume'"
          @click="mode = 'harvard'"
        >
          <AppIcon name="academic" :size="13" class="cv-btn-icon shrink-0 transition-colors duration-150 group-hover:text-sig group-[.bg-sig]:text-on-sig" />
          <span>HARVARD ATS</span>
        </button>
      </div>

      <div class="cv-actions flex items-center gap-2 max-[820px]:w-full">
        <!-- Botón de Descarga Directa PDF -->
        <a
          :href="cvPdfUrl"
          :download="cvDownloadFileName"
          class="cv-action-btn cv-download-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-sig border border-sig text-on-sig font-mono text-[11px] font-bold no-underline cursor-pointer transition-colors duration-150 hover:bg-sig-hover max-[820px]:flex-1 max-[820px]:justify-center max-[820px]:text-[10.5px] max-[820px]:py-2"
          :title="isEs ? `Descargar archivo PDF (${cvDownloadFileName})` : `Download PDF file (${cvDownloadFileName})`"
        >
          <AppIcon name="download" :size="13" />
          <span>{{ isEs ? 'DESCARGAR PDF' : 'DOWNLOAD PDF' }}</span>
        </a>

        <!-- Botón de Impresión Navegador -->
        <button
          type="button"
          class="cv-action-btn cv-print-btn group inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper border border-rule-strong text-ink font-mono text-[11px] font-bold no-underline cursor-pointer transition-colors duration-150 hover:bg-hover hover:text-sig hover:border-sig max-[820px]:flex-1 max-[820px]:justify-center max-[820px]:text-[10.5px] max-[820px]:py-2"
          :title="isEs ? 'Imprimir en papel o guardar como PDF desde el navegador (Ctrl+P)' : 'Print to paper or save as PDF via browser (Ctrl+P)'"
          @click="printCV"
        >
          <AppIcon name="printer" :size="13" class="group-hover:text-sig transition-colors duration-150" />
          <span>{{ isEs ? 'IMPRIMIR' : 'PRINT' }}</span>
        </button>
      </div>
    </header>

    <!-- Harvard ATS View -->
    <CvHarvardAts
      v-if="mode === 'harvard'"
      :name="cvName"
      :role="cvRole"
      :location="cvLocation"
      :bio="cvBio"
      :email="cvEmail"
      :github="cvGithub"
      :github-text="cvGithubText"
      :linkedin="cvLinkedin"
      :linkedin-text="cvLinkedinText"
      :is-es="isEs"
    />

    <!-- Modern IDE / Code Editor View -->
    <CvModernIde
      v-else
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
  </section>
</template>
