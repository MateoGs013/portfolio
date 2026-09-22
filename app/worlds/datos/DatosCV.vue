<script setup lang="ts">
// Componente de Currículum Vitae Dual — Mateo Gabriel Sonzogni
// 1. Modo Harvard ATS (académico, blanco y negro, sin foto, máxima legibilidad para ATS y reclutadores)
// 2. Modo Moderno Editorial (estética suiza contemporánea de alta fidelidad con retrato integrado,
//    retícula asimétrica limpia y jerarquía tipográfica sin marcos cerrados ni cajas fragmentadas)
// Consumo dinámico de PostgreSQL (documento about, proyectos y experiencia) con descarga/impresión A4 en 1 página.

import type { Detail } from './explorer'
import DatosIcon from './DatosIcon.vue'

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
  ? (getDocField('engineering_philosophy') || 'Desarrollo con criterio de diseño y foco en el producto entero: qué problema resuelve, cómo debería verse, cómo debería sentirse, cómo se construye y cómo llega a producción. No me posiciono solo como programador ni solo como diseñador; trabajo en la costura donde la arquitectura técnica se encuentra con la experiencia de usuario.')
  : 'Software engineer specialized in reactive frontend engineering, API architecture, and user experience. Pre-approved degree thesis at Da Vinci School with 382 commits leading system architecture for an on-premise AI assistant. Verifiable production track record with 10+ deliverables for clients across Spain and Argentina (La Rúcula Gastrobar, ARG Piscinas). Proficient in TypeScript, Vue 3, Nuxt 4, React, Next.js, Node.js, FastAPI, and PostgreSQL. End-to-end product design mindset.',
)

const cvEmail = computed(() => props.detail?.contact?.email || 'mateogabus@gmail.com')
const cvGithub = computed(() => props.detail?.contact?.github || 'https://github.com/MateoGs013')
const cvGithubText = computed(() => cvGithub.value.replace(/^https?:\/\/(www\.)?/, ''))
const cvLinkedin = computed(() => props.detail?.contact?.linkedin || 'https://www.linkedin.com/in/mateo-sonzogni')
const cvLinkedinText = computed(() => cvLinkedin.value.replace(/^https?:\/\/(www\.)?/, ''))
const cvTimezone = computed(() => props.detail?.contact?.timezone || 'UTC-3')

interface CVDeliverable {
  slug: string
  title: string
  badge?: string
  date: string
  role: string
  location: string
  description: string
  bullets: string[]
  tags: string[]
}

const cvDeliverables = computed<CVDeliverable[]>(() => {
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
          'Lideré la arquitectura técnica y el frontend reactivo con 382 commits en 6 semanas.',
          'Diseñé pipelines de inferencia y memoria vectorial en Next.js y FastAPI con latencia sub-100ms.',
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
          'Desarrollo de punta a punta: arquitectura de sistemas, diseño en Figma y despliegue a producción.',
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
        'Engineered Next.js client and FastAPI pipeline achieving sub-100ms semantic response times locally.',
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
        'End-to-end turnkey web solutions combining Figma UI design and production-ready full-stack software.',
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
  <section class="cv-wrapper" :class="`mode-${mode}`">
    <!-- Barra de Herramientas del CV -->
    <header class="cv-toolbar no-print">
      <div class="cv-selector" role="group" :aria-label="isEs ? 'Estilo de Currículum Vitae' : 'Resume format style'">
        <button
          type="button"
          class="cv-btn"
          :class="{ active: mode === 'modern' }"
          :title="isEs ? 'Ver CV moderno editorial con fotografía técnica' : 'View modern editorial tech resume with photo'"
          @click="mode = 'modern'"
        >
          <DatosIcon name="user" :size="13" class="cv-btn-icon" />
          <span>{{ isEs ? 'MODERNO + FOTO' : 'MODERN + PHOTO' }}</span>
        </button>
        <button
          type="button"
          class="cv-btn"
          :class="{ active: mode === 'harvard' }"
          :title="isEs ? 'Ver CV formato clásico Harvard ATS en blanco y negro' : 'View classic black & white Harvard ATS resume'"
          @click="mode = 'harvard'"
        >
          <DatosIcon name="academic" :size="13" class="cv-btn-icon" />
          <span>HARVARD ATS</span>
        </button>
      </div>

      <div class="cv-actions">
        <!-- Botón de Descarga Directa PDF -->
        <a
          :href="cvPdfUrl"
          :download="cvDownloadFileName"
          class="cv-action-btn cv-download-btn"
          :title="isEs ? `Descargar archivo PDF (${cvDownloadFileName})` : `Download PDF file (${cvDownloadFileName})`"
        >
          <DatosIcon name="download" :size="13" />
          <span>{{ isEs ? 'DESCARGAR PDF' : 'DOWNLOAD PDF' }}</span>
        </a>

        <!-- Botón de Impresión Navegador -->
        <button
          type="button"
          class="cv-action-btn cv-print-btn"
          :title="isEs ? 'Imprimir en papel o guardar como PDF desde el navegador (Ctrl+P)' : 'Print to paper or save as PDF via browser (Ctrl+P)'"
          @click="printCV"
        >
          <DatosIcon name="printer" :size="13" />
          <span>{{ isEs ? 'IMPRIMIR' : 'PRINT' }}</span>
        </button>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- ESTILO 1: HARVARD ATS (CLÁSICO ACADÉMICO / CORPORATIVO INTERNACIONAL) -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <article v-if="mode === 'harvard'" class="cv-harvard">
      <!-- Encabezado Harvard -->
      <header class="h-header">
        <h1 class="h-name">{{ cvName }}</h1>
        <p class="h-role">{{ cvRole }}</p>
        <div class="h-contact">
          <span>{{ cvLocation }}</span>
          <span class="h-sep">|</span>
          <a :href="`mailto:${cvEmail}`">{{ cvEmail }}</a>
          <span class="h-sep">|</span>
          <a :href="cvGithub" target="_blank" rel="noopener noreferrer">{{ cvGithubText }}</a>
          <span class="h-sep">|</span>
          <a :href="cvLinkedin" target="_blank" rel="noopener noreferrer">{{ cvLinkedinText }}</a>
          <span class="h-sep">|</span>
          <span>{{ isEs ? 'Disponibilidad Inmediata · Remoto / Híbrido' : 'Immediate Availability · Remote / Hybrid' }}</span>
        </div>
      </header>

      <!-- Resumen Profesional -->
      <section class="h-section">
        <h2 class="h-title">{{ isEs ? 'RESUMEN PROFESIONAL' : 'PROFESSIONAL SUMMARY' }}</h2>
        <p class="h-summary">
          {{ cvBio }}
        </p>
      </section>

      <!-- Educación -->
      <section class="h-section">
        <h2 class="h-title">{{ isEs ? 'EDUCACIÓN' : 'EDUCATION' }}</h2>

        <div class="h-entry">
          <div class="h-entry-header">
            <span class="h-org">ESCUELA DA VINCI</span>
            <span class="h-date">{{ isEs ? '2024 – 2026 (En curso)' : '2024 – 2026 (In progress)' }}</span>
          </div>
          <div class="h-entry-sub">
            <span class="h-degree">{{ isEs ? 'Tecnicatura Superior en Diseño y Desarrollo Web' : 'Associate Degree in Web Design & Development' }}</span>
            <span class="h-loc">Buenos Aires, Argentina</span>
          </div>
          <ul class="h-bullets">
            <li v-if="isEs">Tesis de graduación preaprobada: <em>Ynara</em> (Asistente de IA adaptativo on-premise con memoria vectorial).</li>
            <li v-else>Pre-approved degree thesis: <em>Ynara</em> (Adaptive on-premise AI assistant with vector memory).</li>
            <li v-if="isEs">Formación intensiva en arquitecturas web modernas, patrones de concurrencia, bases de datos relacionales y diseño UI/UX.</li>
            <li v-else>Intensive training in modern web architectures, concurrency patterns, relational databases, and UI/UX design.</li>
          </ul>
        </div>

        <div class="h-entry">
          <div class="h-entry-header">
            <span class="h-org">CENTRO DE EDUCACIÓN TÉCNICA N.º 30 (CET 30)</span>
            <span class="h-date">2017 – 2023</span>
          </div>
          <div class="h-entry-sub">
            <span class="h-degree">{{ isEs ? 'Técnico en Programación' : 'Computer Programming Technician (7-Year Technical Program)' }}</span>
            <span class="h-loc">Cipolletti, Río Negro, Argentina</span>
          </div>
          <ul class="h-bullets">
            <li v-if="isEs">Formación técnica de 7 años en lógica algorítmica, estructuras de datos, redes, sistemas operativos y desarrollo de software.</li>
            <li v-else>7-year comprehensive technical training in algorithmic logic, data structures, networking, operating systems, and software engineering.</li>
          </ul>
        </div>
      </section>

      <!-- Experiencia Profesional -->
      <section class="h-section">
        <h2 class="h-title">{{ isEs ? 'EXPERIENCIA PROFESIONAL & PROYECTOS' : 'PROFESSIONAL EXPERIENCE & PROJECTS' }}</h2>

        <div class="h-entry">
          <div class="h-entry-header">
            <span class="h-org">YNARA AI ASSISTANT {{ isEs ? '(TESIS DA VINCI)' : '(DA VINCI THESIS)' }}</span>
            <span class="h-date">05/2026 – 07/2026</span>
          </div>
          <div class="h-entry-sub">
            <span class="h-degree">{{ isEs ? 'Arquitecto de Software & Lead Frontend' : 'Software Architect & Lead Frontend' }}</span>
            <span class="h-loc">Buenos Aires, Argentina</span>
          </div>
          <ul class="h-bullets">
            <li v-if="isEs">Lideré la arquitectura técnica y el frontend con 382 commits a lo largo de 6 semanas de desarrollo intensivo.</li>
            <li v-else>Led system architecture and reactive frontend with 382 commits over 6 weeks of intensive engineering.</li>
            <li v-if="isEs">Diseñé pipelines de inferencia y memoria vectorial persistente con PostgreSQL, pgvector y FastAPI.</li>
            <li v-else>Engineered inference pipelines and persistent vector memory with PostgreSQL, pgvector, and FastAPI.</li>
            <li v-if="isEs">Construí la aplicación web con Next.js y TypeScript, logrando tiempos de respuesta inferiores a 100ms en local.</li>
            <li v-else>Built the web client with Next.js and TypeScript, achieving sub-100ms response times in local environments.</li>
          </ul>
        </div>

        <div class="h-entry">
          <div class="h-entry-header">
            <span class="h-org">LA RÚCULA GASTROBAR</span>
            <span class="h-date">03/2026 – 07/2026</span>
          </div>
          <div class="h-entry-sub">
            <span class="h-degree">{{ isEs ? 'Desarrollador Full Stack & Diseñador UI' : 'Full Stack Developer & UI Designer' }}</span>
            <span class="h-loc">Chiclana de la Frontera, {{ isEs ? 'España' : 'Spain' }}</span>
          </div>
          <ul class="h-bullets">
            <li v-if="isEs">Diseñé y programé un sitio editorial menu-first optimizado para escaneo QR de clientes en mesa.</li>
            <li v-else>Designed and engineered an editorial menu-first web app optimized for table-side QR scanning.</li>
            <li v-if="isEs">Integré arquitectura con fallback offline en cache para garantizar servicio continuo ante caídas de conectividad.</li>
            <li v-else>Integrated cached offline fallbacks ensuring seamless continuous service during connectivity drops.</li>
            <li v-if="isEs">Puntuación Lighthouse de 99 en Performance y 100 en SEO y Accesibilidad con bundle final de apenas 42 KB.</li>
            <li v-else>Achieved 99 Performance and 100 SEO &amp; Accessibility Lighthouse scores with a compact 42 KB production bundle.</li>
          </ul>
        </div>

        <div class="h-entry">
          <div class="h-entry-header">
            <span class="h-org">ARG PISCINAS</span>
            <span class="h-date">01/2026 – 07/2026</span>
          </div>
          <div class="h-entry-sub">
            <span class="h-degree">{{ isEs ? 'Desarrollador Full Stack' : 'Full Stack Developer' }}</span>
            <span class="h-loc">Andalucía, {{ isEs ? 'España' : 'Spain' }}</span>
          </div>
          <ul class="h-bullets">
            <li v-if="isEs">Desarrollé una plataforma corporativa multi-idioma (Español, Inglés y Alemán) con panel de control a medida.</li>
            <li v-else>Engineered a multilingual corporate web platform (Spanish, English, German) with custom administrative CMS.</li>
            <li v-if="isEs">Modelé esquemas relacionales y tipado estricto de punta a punta con Prisma ORM y Node.js.</li>
            <li v-else>Modeled relational schemas and end-to-end type safety using Prisma ORM and Node.js.</li>
          </ul>
        </div>

        <div class="h-entry">
          <div class="h-entry-header">
            <span class="h-org">{{ isEs ? 'DESARROLLO FREELANCE' : 'FREELANCE DEVELOPMENT' }}</span>
            <span class="h-date">{{ isEs ? '2023 – Presente' : '2023 – Present' }}</span>
          </div>
          <div class="h-entry-sub">
            <span class="h-degree">{{ isEs ? 'Desarrollador Full Stack' : 'Full Stack Developer' }}</span>
            <span class="h-loc">{{ isEs ? 'Remoto' : 'Remote' }}</span>
          </div>
          <ul class="h-bullets">
            <li v-if="isEs">Desarrollo integral de soluciones de software a medida con APIs REST y arquitecturas modulares.</li>
            <li v-else>End-to-end development of custom software solutions with decoupled REST APIs and scalable architectures.</li>
            <li v-if="isEs">Entrega exitosa de aproximadamente 10 proyectos web llave en mano para clientes de diversos rubros.</li>
            <li v-else>Successful delivery of ~10 turnkey web solutions for clients across diverse sectors.</li>
          </ul>
        </div>
      </section>

      <!-- Habilidades Técnicas -->
      <section class="h-section">
        <h2 class="h-title">{{ isEs ? 'HABILIDADES TÉCNICAS' : 'TECHNICAL SKILLS' }}</h2>
        <div class="h-skills">
          <p><strong>{{ isEs ? 'Lenguajes' : 'Languages' }}:</strong> TypeScript, JavaScript (ESNext), Python, PHP, SQL, HTML5, CSS3.</p>
          <p><strong>{{ isEs ? 'Frontend & Frameworks' : 'Frontend & Frameworks' }}:</strong> Vue 3, Nuxt 4, React, Next.js, Tailwind CSS, GSAP, Lenis, Three.js.</p>
          <p><strong>{{ isEs ? 'Backend & APIs' : 'Backend & APIs' }}:</strong> Node.js, Express, FastAPI, Laravel, RESTful APIs, Middleware Pipelines.</p>
          <p><strong>{{ isEs ? 'Bases de Datos & Cloud' : 'Databases & Cloud' }}:</strong> PostgreSQL (pgvector), Prisma ORM, MongoDB, Firebase, Supabase, Docker.</p>
          <p><strong>{{ isEs ? 'Herramientas & Metodologías' : 'Tools & Methodologies' }}:</strong> Git/GitHub, Vite, Figma UI/UX, Vitest, Playwright, CI/CD, {{ isEs ? 'Accesibilidad WCAG' : 'WCAG Accessibility' }}.</p>
          <p><strong>{{ isEs ? 'Idiomas' : 'Languages' }}:</strong> {{ isEs ? 'Español (Nativo), Inglés (B2 Profesional / Técnico).' : 'Spanish (Native), English (B2 Professional / Technical).' }}</p>
        </div>
      </section>
    </article>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- ESTILO 2: IDE / TERMINAL (MODERNO CODE EDITOR) -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <article v-else class="cv-modern">
      <div class="ide-container">
        <!-- Sidebar -->
        <aside class="ide-sidebar">
          <div class="ide-window-controls">
            <span class="ide-dot red" aria-hidden="true" />
            <span class="ide-dot yellow" aria-hidden="true" />
            <span class="ide-dot green" aria-hidden="true" />
            <span class="ide-file-title">package.json</span>
          </div>

          <div class="ide-sidebar-inner">
            <div class="ide-tree-block">
              <div class="ide-sidebar-header">
                <span class="ide-tree-root">~/curriculum</span>
              </div>
              
              <div class="ide-tree">
                <div class="ide-tree-group">
                  <div class="ide-tree-folder">
                    <span class="ide-tree-bullet">▼</span> src/
                  </div>
                  <ul class="ide-tree-files">
                    <li><span class="ide-tree-bullet">·</span> profile.ts</li>
                    <li><span class="ide-tree-bullet">·</span> experience.vue</li>
                    <li><span class="ide-tree-bullet">·</span> stack.py</li>
                    <li><span class="ide-tree-bullet">·</span> education.sql</li>
                  </ul>
                </div>
                <div class="ide-tree-group">
                  <div class="ide-tree-folder">
                    <span class="ide-tree-bullet">▼</span> config/
                  </div>
                  <ul class="ide-tree-files">
                    <li><span class="ide-tree-bullet">·</span> contact.env</li>
                    <li><span class="ide-tree-bullet">·</span> nuxt.config.ts</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="ide-divider" />

            <div class="ide-photo-wrap">
              <img
                src="/media/profile/mateo-front.png"
                alt="Mateo Gabriel Sonzogni"
                class="ide-photo"
                loading="eager"
              >
            </div>

            <div class="ide-divider" />

            <!-- Formación / Education -->
            <div class="ide-sidebar-section">
              <div class="ide-comment">// {{ isEs ? 'formación técnica' : 'education' }}</div>
              <div class="ide-edu-item">
                <div class="ide-edu-school">ESCUELA DA VINCI</div>
                <div class="ide-edu-degree">{{ isEs ? 'Diseño y Desarrollo Web' : 'Web Design & Dev' }} (2024–2026)</div>
                <div class="ide-edu-sub">{{ isEs ? 'Tesis: Ynara (Lead Front & Arq.)' : 'Thesis: Ynara (Lead Front & Arch)' }}</div>
              </div>
              <div class="ide-edu-item">
                <div class="ide-edu-school">CET N.º 30</div>
                <div class="ide-edu-degree">{{ isEs ? 'Técnico en Programación' : 'Programming Tech' }} (2017–2023)</div>
                <div class="ide-edu-sub">{{ isEs ? 'Plan integral de 7 años' : '7-year technical program' }}</div>
              </div>
            </div>

            <div class="ide-divider" />

            <!-- Stats & Idiomas -->
            <div class="ide-sidebar-section">
              <div class="ide-comment">// {{ isEs ? 'métricas & idiomas' : 'metrics & languages' }}</div>
              <ul class="ide-key-val">
                <li><span>{{ isEs ? 'Español' : 'Spanish' }}</span> <span class="ide-highlight">{{ isEs ? 'Nativo' : 'Native' }}</span></li>
                <li><span>{{ isEs ? 'Inglés' : 'English' }}</span> <span class="ide-highlight">{{ isEs ? 'B2 Profesional' : 'B2 Professional' }}</span></li>
                <li><span>{{ isEs ? 'Experiencia' : 'Experience' }}</span> <span class="ide-highlight">{{ isEs ? '+3 años' : '3+ yrs' }}</span></li>
                <li><span>{{ isEs ? 'Proyectos' : 'Projects' }}</span> <span class="ide-highlight">~10 apps</span></li>
                <li><span>{{ isEs ? 'Disponibilidad' : 'Availability' }}</span> <span class="ide-highlight">{{ isEs ? 'Inmediata' : 'Immediate' }}</span></li>
                <li><span>{{ isEs ? 'Zona Horaria' : 'Timezone' }}</span> <span class="ide-highlight">{{ cvTimezone }}</span></li>
              </ul>
            </div>

            <div class="ide-divider" />

            <!-- Contact -->
            <div class="ide-sidebar-section">
              <div class="ide-comment">// {{ isEs ? 'contacto' : 'contact' }}</div>
              <ul class="ide-contact-list">
                <li><a :href="`mailto:${cvEmail}`">{{ cvEmail }}</a></li>
                <li><a :href="cvGithub" target="_blank" rel="noopener noreferrer">@{{ cvGithubText.replace('github.com/', '') }}</a></li>
                <li><a :href="cvLinkedin" target="_blank" rel="noopener noreferrer">in/mateo-sonzogni</a></li>
                <li><span class="ide-loc">{{ cvLocation }}</span></li>
              </ul>
            </div>
          </div>
        </aside>

        <!-- Main Editor -->
        <main class="ide-main">
          <div class="ide-tabs">
            <div class="ide-tab active">cv.ts</div>
            <div class="ide-tab">README.md</div>
          </div>

          <div class="ide-editor-content">
            <header class="ide-header">
              <div class="ide-comment">// curriculum vitae — mateo sonzogni, 2026</div>
              <h1 class="ide-name">{{ cvName }}</h1>
              <p class="ide-role">{{ cvRole }}</p>
            </header>

            <div class="ide-hr" />

            <!-- Profile -->
            <div class="ide-section">
              <div class="ide-comment">// profile</div>
              <p class="ide-text">{{ cvBio }}</p>
            </div>

            <div class="ide-hr" />

            <!-- Experience & Projects -->
            <div class="ide-section">
              <div class="ide-comment">// {{ isEs ? 'experiencia profesional & proyectos en producción' : 'professional experience & shipped projects' }}</div>
              
              <div v-for="item in cvDeliverables" :key="item.slug" class="ide-exp-item">
                <div class="ide-exp-top-row">
                  <div class="ide-exp-title-wrap">
                    <span class="ide-exp-title">{{ item.title }}</span>
                    <span v-if="item.badge" class="ide-exp-badge">{{ item.badge }}</span>
                  </div>
                  <span class="ide-exp-date">{{ item.date }}</span>
                </div>
                <div class="ide-exp-sub-row">
                  <span class="ide-exp-role">{{ item.role }}</span>
                  <span class="ide-exp-loc">{{ item.location }}</span>
                </div>
                <p class="ide-exp-desc">{{ item.description }}</p>
                <ul v-if="item.bullets?.length" class="ide-exp-bullets">
                  <li v-for="(bullet, bIdx) in item.bullets" :key="bIdx">{{ bullet }}</li>
                </ul>
                <div v-if="item.tags?.length" class="ide-exp-tags">
                  <span v-for="tag in item.tags" :key="tag" class="ide-tag">#{{ tag }}</span>
                </div>
              </div>
            </div>

            <div class="ide-hr" />

            <!-- Stack -->
            <div class="ide-section">
              <div class="ide-comment">// {{ isEs ? 'stack tecnológico' : 'tech stack' }}</div>
              <div class="ide-stack-group">
                <span class="ide-stack-label">frontend</span>
                <span class="ide-stack-val">: "Vue 3 · Nuxt 4 · React · Next.js · TypeScript · Tailwind · GSAP"</span>
              </div>
              <div class="ide-stack-group">
                <span class="ide-stack-label">backend </span>
                <span class="ide-stack-val">: "Node.js · Express · FastAPI · Python · PostgreSQL (pgvector) · Prisma"</span>
              </div>
              <div class="ide-stack-group">
                <span class="ide-stack-label">cloud/ops</span>
                <span class="ide-stack-val">: "Docker · Coolify VPS · Linux · CI/CD · Git · Figma UI/UX · Vitest"</span>
              </div>
            </div>

          </div>
        </main>
      </div>
    </article>
  </section>
</template>

<style scoped>
.cv-wrapper {
  width: 100%;
}

/* ─── Barra de Herramientas del CV ─────────────────────────────────────────── */
.cv-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  margin-bottom: 20px;
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
}
.cv-selector {
  display: inline-flex;
  border: 1px solid var(--d-rule);
  background: var(--d-paper);
}
.cv-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: none;
  border: none;
  color: var(--d-dim);
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--d-dur) ease;
}
.cv-btn:hover {
  color: var(--d-ink);
  background: var(--d-hover);
}
.cv-btn.active {
  background: var(--d-sig);
  color: #ffffff;
}
.cv-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cv-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--d-paper);
  border: 1px solid var(--d-rule-strong);
  color: var(--d-ink);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--d-dur) ease;
}
.cv-action-btn:hover {
  background: var(--d-hover);
  color: var(--d-sig);
  border-color: var(--d-sig);
}
.cv-download-btn {
  background: var(--d-sig);
  color: #ffffff;
  border-color: var(--d-sig);
}
.cv-download-btn:hover {
  background: #c53000;
  color: #ffffff;
}

/* ─── ESTILO 1: HARVARD ATS ────────────────────────────────────────────────── */
.cv-harvard {
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  background: #ffffff;
  color: #000000;
  padding: 40px 48px;
  font-family: 'Times New Roman', Times, Georgia, serif;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.cv-harvard a {
  color: #000000;
  text-decoration: underline;
}

.h-header {
  text-align: center;
  border-bottom: 2px solid #000000;
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.h-name {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.h-role {
  margin: 0 0 6px;
  font-size: 14px;
  font-style: italic;
  font-family: 'Times New Roman', Times, Georgia, serif;
}
.h-contact {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
}
.h-sep {
  color: #666666;
  user-select: none;
}

.h-section {
  margin-bottom: 16px;
}
.h-title {
  margin: 0 0 8px;
  font-size: 13.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid #000000;
  padding-bottom: 2px;
}
.h-summary {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
  text-align: justify;
}

.h-entry {
  margin-bottom: 10px;
}
.h-entry-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13px;
  font-weight: 700;
}
.h-org {
  text-transform: uppercase;
}
.h-date {
  font-weight: 400;
  font-size: 12px;
}
.h-entry-sub {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 12.5px;
  font-style: italic;
  margin-bottom: 3px;
}
.h-degree {
  font-weight: 400;
}
.h-loc {
  font-style: normal;
  font-size: 11.5px;
  color: #333333;
}
.h-bullets {
  margin: 4px 0 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.45;
}
.h-bullets li {
  margin-bottom: 2px;
}

.h-skills p {
  margin: 0 0 4px;
  font-size: 12px;
  line-height: 1.45;
}
.h-skills strong {
  font-weight: 700;
}

/* ─── ESTILO 2: IDE / TERMINAL (MODERNO CODE EDITOR) ────────────────────────────── */
.cv-modern {
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
}

.ide-container {
  display: flex;
  background: var(--d-paper);
  border: 1px solid var(--d-rule-strong);
  color: var(--d-ink);
  font-family: var(--font-mono);
  font-size: 11px;
}

.ide-sidebar {
  width: 260px;
  background: var(--d-surface);
  border-right: 1px solid var(--d-rule-strong);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.ide-window-controls {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid var(--d-rule-strong);
  background: var(--d-surface-raised);
}

.ide-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.ide-dot.red { background: #ff5f56; }
.ide-dot.yellow { background: #ffbd2e; }
.ide-dot.green { background: #27c93f; }

.ide-file-title {
  margin-left: auto;
  color: var(--d-sig);
  font-size: 11px;
}

.ide-sidebar-inner {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ide-tree-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ide-sidebar-header {
  color: var(--d-sig);
  font-size: 11.5px;
}

.ide-tree {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ide-tree-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ide-tree-folder {
  color: var(--d-sig);
}

.ide-tree-bullet {
  color: var(--d-dim);
  margin-right: 4px;
}

.ide-tree-files {
  list-style: none;
  padding: 0 0 0 14px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--d-dim);
}

.ide-divider {
  height: 1px;
  background: var(--d-rule-strong);
}

.ide-hr {
  height: 1px;
  background: var(--d-rule-strong);
  margin: 18px 0;
}

.ide-photo-wrap {
  width: 100%;
}
.ide-photo {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  object-position: center top;
  filter: grayscale(20%);
}

.ide-sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ide-edu-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
}
.ide-edu-school {
  color: var(--d-ink);
  font-weight: 700;
  font-size: 11px;
}
.ide-edu-degree {
  color: var(--d-sig);
  font-size: 10.5px;
}
.ide-edu-sub {
  color: var(--d-dim);
  font-size: 10px;
}

.ide-comment {
  color: var(--d-dim);
  font-style: italic;
  margin-bottom: 4px;
}

.ide-key-val {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--d-dim);
}

.ide-key-val li {
  display: flex;
  justify-content: space-between;
}

.ide-highlight {
  color: var(--d-sig);
}

.ide-contact-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ide-contact-list a, .ide-loc {
  color: var(--d-dim);
  text-decoration: none;
}
.ide-contact-list a:hover {
  color: var(--d-ink);
  text-decoration: underline;
}

/* Editor Main */
.ide-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--d-paper);
}

.ide-tabs {
  display: flex;
  border-bottom: 1px solid var(--d-rule-strong);
  background: var(--d-surface);
}

.ide-tab {
  padding: 10px 16px;
  color: var(--d-dim);
  border-right: 1px solid var(--d-rule-strong);
}
.ide-tab.active {
  background: var(--d-paper);
  color: var(--d-sig);
  border-top: 2px solid var(--d-sig);
  margin-top: -1px;
}

.ide-editor-content {
  padding: 24px 32px;
  flex: 1;
}

.ide-header {
  display: flex;
  flex-direction: column;
}

.ide-name {
  margin: 12px 0 4px;
  font-size: 26px;
  font-weight: 700;
  color: var(--d-ink);
  font-family: var(--font-mono);
  letter-spacing: -0.02em;
}

.ide-name::after {
  content: ' _';
  color: var(--d-sig);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.ide-role {
  margin: 0;
  color: var(--d-sig);
  font-size: 12.5px;
  font-weight: 600;
}

.ide-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ide-text {
  margin: 0;
  color: var(--d-dim);
  font-size: 12px;
  line-height: 1.55;
}

.ide-exp-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--d-rule);
}
.ide-exp-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.ide-exp-top-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.ide-exp-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ide-exp-title {
  color: var(--d-ink);
  font-weight: 700;
  font-size: 14px;
}

.ide-exp-badge {
  color: var(--d-sig);
  border: 1px solid var(--d-rule-strong);
  background: var(--d-surface-raised);
  padding: 1px 6px;
  font-size: 9.5px;
  border-radius: 2px;
}

.ide-exp-date {
  color: var(--d-dim);
  font-size: 11px;
  flex-shrink: 0;
}

.ide-exp-sub-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.ide-exp-role {
  color: var(--d-sig);
  font-size: 12px;
  font-weight: 500;
}

.ide-exp-loc {
  color: var(--d-dim);
  font-size: 10.5px;
}

.ide-exp-desc {
  margin: 2px 0 0;
  color: var(--d-dim);
  font-size: 11.5px;
  line-height: 1.5;
}

.ide-exp-bullets {
  margin: 4px 0 0;
  padding-left: 14px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ide-exp-bullets li {
  position: relative;
  color: var(--d-dim);
  font-size: 11px;
  line-height: 1.45;
}

.ide-exp-bullets li::before {
  content: '·';
  position: absolute;
  left: -10px;
  color: var(--d-sig);
  font-weight: bold;
}

.ide-exp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 4px;
}

.ide-tag {
  color: var(--d-dim);
  background: var(--d-surface-raised);
  border: 1px solid var(--d-rule);
  padding: 1px 6px;
  font-size: 10px;
  border-radius: 2px;
}

.ide-stack-group {
  display: flex;
  gap: 12px;
  color: var(--d-dim);
}

.ide-stack-label {
  color: var(--d-sig);
  width: 65px;
}
.ide-stack-val {
  color: var(--d-dim);
}

/* ─── Responsive Screen Rules ─────────────────────────────────────────────── */
@media screen and (max-width: 820px) {
  /* Toolbar móvil y tablet */
  .cv-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 10px 12px;
  }
  .cv-selector {
    width: 100%;
    display: flex;
  }
  .cv-btn {
    flex: 1;
    justify-content: center;
    font-size: 11px;
    padding: 7px 6px;
  }
  .cv-actions {
    width: 100%;
    display: flex;
    gap: 8px;
  }
  .cv-action-btn {
    flex: 1;
    justify-content: center;
    font-size: 10.5px;
    padding: 7px 6px;
  }

  /* Harvard ATS móvil */
  .cv-harvard {
    padding: 16px 14px;
    box-shadow: none;
  }
  .h-contact {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px 6px;
    font-size: 11.5px;
  }
  .h-entry-header,
  .h-entry-sub {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  /* Modern IDE móvil y tablet */
  .ide-container {
    flex-direction: column;
  }
  .ide-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--d-rule-strong);
  }
  .ide-photo-wrap {
    width: 110px;
    margin: 0 auto;
  }
  .ide-editor-content {
    padding: 18px 16px;
  }
  .ide-name {
    font-size: 22px;
  }
}

@media screen and (max-width: 520px) {
  .ide-editor-content {
    padding: 14px 12px;
  }
  .ide-name {
    font-size: 19px;
  }
  .ide-role {
    font-size: 11.5px;
  }
  .ide-tabs {
    overflow-x: auto;
  }
  .ide-tab {
    padding: 8px 12px;
    font-size: 11px;
  }
  .ide-exp-top-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  .ide-exp-title {
    font-size: 13px;
  }
  .ide-exp-title-wrap {
    flex-wrap: wrap;
  }
  .ide-exp-sub-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
  }
  .ide-exp-bullets {
    padding-left: 12px;
  }
  .ide-stack-group {
    flex-direction: column;
    gap: 2px;
  }
  .ide-stack-label {
    width: auto;
  }
  .ide-key-val li {
    font-size: 11px;
  }
}

@media print {
  .cv-toolbar {
    display: none !important;
  }
  .cv-wrapper {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
  }

  /* Harvard ATS print (1 Página Exacta con márgenes A4) */
  .cv-harvard {
    border: none !important;
    box-shadow: none !important;
    width: 210mm !important;
    min-height: 297mm !important;
    padding: 12mm 16mm !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    background: #ffffff !important;
    color: #000000 !important;
  }
  .cv-harvard * {
    color: #000000 !important;
  }
  .cv-harvard .h-header {
    border-bottom: 1.25pt solid #000000 !important;
    padding-bottom: 4pt !important;
    margin-bottom: 6pt !important;
    text-align: center !important;
  }
  .cv-harvard .h-name {
    font-size: 18pt !important;
    font-weight: 700 !important;
    letter-spacing: 0.03em !important;
    margin-bottom: 2pt !important;
  }
  .cv-harvard .h-role {
    font-size: 9.5pt !important;
    margin-bottom: 2pt !important;
  }
  .cv-harvard .h-contact {
    font-size: 8.5pt !important;
    gap: 5pt !important;
  }
  .cv-harvard .h-section {
    margin-bottom: 5pt !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .cv-harvard .h-title {
    font-size: 9.5pt !important;
    border-bottom: 0.75pt solid #000000 !important;
    padding-bottom: 1.5pt !important;
    margin-top: 5pt !important;
    margin-bottom: 3pt !important;
  }
  .cv-harvard .h-summary {
    font-size: 8.25pt !important;
    line-height: 1.35 !important;
    margin: 0 !important;
  }
  .cv-harvard .h-entry {
    margin-bottom: 3.5pt !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .cv-harvard .h-entry-header {
    font-size: 8.5pt !important;
    line-height: 1.3 !important;
  }
  .cv-harvard .h-entry-sub {
    font-size: 8pt !important;
    margin-bottom: 1pt !important;
    line-height: 1.25 !important;
  }
  .cv-harvard .h-bullets {
    font-size: 8pt !important;
    line-height: 1.3 !important;
    margin-top: 1pt !important;
    margin-bottom: 0 !important;
    padding-left: 12pt !important;
  }
  .cv-harvard .h-bullets li {
    margin-bottom: 1pt !important;
  }
  .cv-harvard .h-skills p {
    font-size: 8pt !important;
    line-height: 1.3 !important;
    margin: 0 0 2pt !important;
  }

  /* Modern print (1 Página Completa A4 - 210mm x 297mm Exactos, Full-bleed, Estética IDE Terminal Dark) */
  .cv-modern {
    background: #09090b !important;
    color: #f4f4f5 !important;
    border: none !important;
    box-shadow: none !important;
    width: 210mm !important;
    height: 297mm !important;
    max-height: 297mm !important;
    padding: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
  .cv-modern .ide-container {
    background: #09090b !important;
    border: none !important;
    color: #f4f4f5 !important;
    display: grid !important;
    grid-template-columns: 66mm 144mm !important;
    width: 210mm !important;
    height: 297mm !important;
    max-height: 297mm !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .cv-modern .ide-sidebar {
    background: #121215 !important;
    border-right: 0.75pt solid rgba(255, 255, 255, 0.15) !important;
    width: 66mm !important;
    height: 297mm !important;
    max-height: 297mm !important;
    display: flex !important;
    flex-direction: column !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
  .cv-modern .ide-window-controls {
    background: #19191e !important;
    border-bottom: 0.5pt solid rgba(255, 255, 255, 0.15) !important;
    height: 9.5mm !important;
    padding: 0 7mm !important;
    display: flex !important;
    align-items: center !important;
    gap: 4.5pt !important;
    box-sizing: border-box !important;
  }
  .cv-modern .ide-dot {
    width: 5.5pt !important;
    height: 5.5pt !important;
    border-radius: 50% !important;
  }
  .cv-modern .ide-dot.red { background: #ff5f56 !important; }
  .cv-modern .ide-dot.yellow { background: #ffbd2e !important; }
  .cv-modern .ide-dot.green { background: #27c93f !important; }
  .cv-modern .ide-file-title {
    color: #ff3e00 !important;
    font-weight: 700 !important;
    font-size: 7.5pt !important;
    margin-left: auto !important;
  }
  .cv-modern .ide-sidebar-inner {
    height: calc(297mm - 9.5mm) !important;
    padding: 6.5mm 7mm 7mm !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    flex: 1 !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
  .cv-modern .ide-tree-block {
    display: flex !important;
    flex-direction: column !important;
    gap: 2pt !important;
  }
  .cv-modern .ide-sidebar-header {
    color: #ff3e00 !important;
    font-weight: 700 !important;
    font-size: 7.8pt !important;
    margin-bottom: 2pt !important;
  }
  .cv-modern .ide-tree {
    display: flex !important;
    flex-direction: column !important;
    gap: 2pt !important;
  }
  .cv-modern .ide-tree-group {
    display: flex !important;
    flex-direction: column !important;
    gap: 1pt !important;
  }
  .cv-modern .ide-tree-folder {
    color: #ff3e00 !important;
    font-size: 7.4pt !important;
    font-weight: 700 !important;
  }
  .cv-modern .ide-tree-bullet {
    color: #929298 !important;
  }
  .cv-modern .ide-tree-files {
    font-size: 6.9pt !important;
    gap: 1pt !important;
    padding-left: 7pt !important;
    margin: 0 !important;
    list-style: none !important;
    display: flex !important;
    flex-direction: column !important;
    color: #929298 !important;
  }
  .cv-modern .ide-divider {
    background: rgba(255, 255, 255, 0.15) !important;
    height: 0.5pt !important;
    margin: 0 !important;
  }
  .cv-modern .ide-photo-wrap {
    width: 100% !important;
    margin: 0 !important;
  }
  .cv-modern .ide-photo {
    width: 100% !important;
    aspect-ratio: 1 !important;
    height: auto !important;
    object-fit: cover !important;
    object-position: center top !important;
    filter: grayscale(20%) !important;
    border: none !important;
    display: block !important;
  }
  .cv-modern .ide-sidebar-section {
    display: flex !important;
    flex-direction: column !important;
    gap: 1.8pt !important;
  }
  .cv-modern .ide-edu-item {
    display: flex !important;
    flex-direction: column !important;
    gap: 0.8pt !important;
    margin-bottom: 1.5pt !important;
  }
  .cv-modern .ide-edu-school {
    color: #f4f4f5 !important;
    font-weight: 700 !important;
    font-size: 7.4pt !important;
  }
  .cv-modern .ide-edu-degree {
    color: #ff3e00 !important;
    font-size: 6.9pt !important;
  }
  .cv-modern .ide-edu-sub {
    color: #929298 !important;
    font-size: 6.5pt !important;
  }
  .cv-modern .ide-comment {
    color: #929298 !important;
    font-size: 6.9pt !important;
    margin-bottom: 1pt !important;
    font-style: italic !important;
  }
  .cv-modern .ide-key-val {
    gap: 1.8pt !important;
    font-size: 6.9pt !important;
    display: flex !important;
    flex-direction: column !important;
    padding: 0 !important;
    margin: 0 !important;
    list-style: none !important;
  }
  .cv-modern .ide-key-val li {
    display: flex !important;
    justify-content: space-between !important;
  }
  .cv-modern .ide-key-val li span {
    color: #929298 !important;
  }
  .cv-modern .ide-highlight {
    color: #ff3e00 !important;
    font-weight: 700 !important;
  }
  .cv-modern .ide-contact-list {
    gap: 1.8pt !important;
    font-size: 6.8pt !important;
    display: flex !important;
    flex-direction: column !important;
    padding: 0 !important;
    margin: 0 !important;
    list-style: none !important;
  }
  .cv-modern .ide-contact-list a,
  .cv-modern .ide-loc {
    color: #929298 !important;
    text-decoration: none !important;
  }

  /* Main Editor */
  .cv-modern .ide-main {
    background: #09090b !important;
    padding: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    width: 144mm !important;
    height: 297mm !important;
    max-height: 297mm !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
  .cv-modern .ide-tabs {
    background: #121215 !important;
    border-bottom: 0.5pt solid rgba(255, 255, 255, 0.15) !important;
    display: flex !important;
    height: 9.5mm !important;
    box-sizing: border-box !important;
  }
  .cv-modern .ide-tab {
    color: #929298 !important;
    border-right: 0.5pt solid rgba(255, 255, 255, 0.15) !important;
    padding: 0 10pt !important;
    height: 9.5mm !important;
    display: flex !important;
    align-items: center !important;
    font-size: 7.5pt !important;
    box-sizing: border-box !important;
  }
  .cv-modern .ide-tab.active {
    background: #09090b !important;
    color: #ff3e00 !important;
    border-top: 1.5pt solid #ff3e00 !important;
    font-weight: 700 !important;
  }
  .cv-modern .ide-editor-content {
    height: calc(297mm - 9.5mm) !important;
    padding: 6.5mm 11mm 7.5mm !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    flex: 1 !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
  .cv-modern .ide-header {
    display: flex !important;
    flex-direction: column !important;
    gap: 1pt !important;
  }
  .cv-modern .ide-name {
    color: #f4f4f5 !important;
    font-size: 19pt !important;
    margin: 1.5pt 0 1pt !important;
    line-height: 1.15 !important;
    font-weight: 700 !important;
  }
  .cv-modern .ide-name::after {
    content: ' _' !important;
    color: #ff3e00 !important;
    display: inline !important;
  }
  .cv-modern .ide-role {
    color: #ff3e00 !important;
    font-size: 9pt !important;
    font-weight: 700 !important;
    margin: 0 !important;
  }
  .cv-modern .ide-hr {
    background: rgba(255, 255, 255, 0.15) !important;
    height: 0.5pt !important;
    margin: 0 !important;
  }
  .cv-modern .ide-section {
    display: flex !important;
    flex-direction: column !important;
    gap: 2pt !important;
  }
  .cv-modern .ide-text {
    color: #929298 !important;
    font-size: 7.9pt !important;
    line-height: 1.38 !important;
    margin: 0 !important;
  }
  .cv-modern .ide-exp-item {
    display: flex !important;
    flex-direction: column !important;
    gap: 1.5pt !important;
    margin-bottom: 4pt !important;
    padding-bottom: 3.5pt !important;
    border-bottom: 0.5pt dashed rgba(255, 255, 255, 0.12) !important;
    break-inside: avoid !important;
  }
  .cv-modern .ide-exp-item:last-child {
    border-bottom: none !important;
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
  }
  .cv-modern .ide-exp-top-row,
  .cv-modern .ide-exp-sub-row {
    display: flex !important;
    justify-content: space-between !important;
    align-items: baseline !important;
    gap: 6pt !important;
  }
  .cv-modern .ide-exp-title {
    color: #f4f4f5 !important;
    font-weight: 700 !important;
    font-size: 9.1pt !important;
  }
  .cv-modern .ide-exp-badge {
    color: #ff3e00 !important;
    font-size: 6.6pt !important;
    border: 0.5pt solid rgba(255, 255, 255, 0.15) !important;
    background: #19191e !important;
    padding: 0.5pt 3pt !important;
    border-radius: 2px !important;
    margin-left: 4pt !important;
  }
  .cv-modern .ide-exp-date {
    color: #929298 !important;
    font-size: 7.3pt !important;
  }
  .cv-modern .ide-exp-role {
    color: #ff3e00 !important;
    font-size: 8.1pt !important;
    font-weight: 600 !important;
  }
  .cv-modern .ide-exp-loc {
    color: #929298 !important;
    font-size: 7.3pt !important;
  }
  .cv-modern .ide-exp-desc {
    color: #929298 !important;
    font-size: 7.6pt !important;
    line-height: 1.34 !important;
    margin: 0 !important;
  }
  .cv-modern .ide-exp-bullets {
    padding-left: 10pt !important;
    gap: 1pt !important;
    margin: 1.5pt 0 0 !important;
    list-style: none !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .cv-modern .ide-exp-bullets li {
    font-size: 7.4pt !important;
    line-height: 1.3 !important;
    color: #929298 !important;
    position: relative !important;
  }
  .cv-modern .ide-exp-bullets li::before {
    content: '·' !important;
    position: absolute !important;
    left: -8pt !important;
    color: #ff3e00 !important;
    font-weight: bold !important;
    font-size: 9pt !important;
  }
  .cv-modern .ide-exp-tags {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 2.5pt !important;
    margin-top: 1.5pt !important;
  }
  .cv-modern .ide-tag {
    font-size: 6.6pt !important;
    padding: 0.75pt 3pt !important;
    background: #19191e !important;
    border: 0.5pt solid rgba(255, 255, 255, 0.1) !important;
    color: #929298 !important;
    border-radius: 2px !important;
  }
  .cv-modern .ide-stack-group {
    display: flex !important;
    gap: 6pt !important;
    font-size: 7.3pt !important;
    line-height: 1.35 !important;
  }
  .cv-modern .ide-stack-label {
    color: #ff3e00 !important;
    font-weight: 700 !important;
    width: 58px !important;
    flex-shrink: 0 !important;
  }
  .cv-modern .ide-stack-val {
    color: #929298 !important;
  }
}
</style>
