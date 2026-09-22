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
const cvAvailability = computed(() => isEs.value
  ? (getDocField('availability_status') || 'DISPONIBLE // CONTRATACIÓN DIRECTA 2026')
  : 'AVAILABLE // DIRECT HIRE 2026',
)
const cvBio = computed(() => isEs.value
  ? (getDocField('engineering_philosophy') || 'Desarrollo con criterio de diseño y foco en el producto entero: qué problema resuelve, cómo debería verse, cómo debería sentirse, cómo se construye y cómo llega a producción. No me posiciono solo como programador ni solo como diseñador; trabajo en la costura donde la arquitectura técnica se encuentra con la experiencia de usuario.')
  : 'Software engineer specialized in reactive frontend engineering, API architecture, and user experience. Pre-approved degree thesis at Da Vinci School with 382 commits leading system architecture for an on-premise AI assistant. Verifiable production track record with 10+ deliverables for clients across Spain and Argentina (La Rúcula Gastrobar, ARG Piscinas). Proficient in TypeScript, Vue 3, Nuxt 4, React, Next.js, Node.js, FastAPI, and PostgreSQL. End-to-end product design mindset.',
)
const cvGoal = computed(() => isEs.value
  ? (getDocField('professional_goal') || 'Consolidarme como desarrollador en un equipo con proyectos reales de mayor escala. A mediano plazo, liderazgo técnico: coordinar, organizar, comunicar y conectar perfiles de distintas áreas (diseño, producto, frontend y backend).')
  : 'Consolidate my impact as an engineer within a high-caliber team shipping large-scale production software. In the medium term, technical leadership: coordinating, organizing, and bridging disciplines across product, UI/UX, frontend, and backend architectures.',
)

const cvEmail = computed(() => props.detail?.contact?.email || 'mateogabus@gmail.com')
const cvGithub = computed(() => props.detail?.contact?.github || 'https://github.com/MateoGs013')
const cvGithubText = computed(() => cvGithub.value.replace(/^https?:\/\/(www\.)?/, ''))
const cvLinkedin = computed(() => props.detail?.contact?.linkedin || 'https://www.linkedin.com/in/mateo-sonzogni')
const cvLinkedinText = computed(() => cvLinkedin.value.replace(/^https?:\/\/(www\.)?/, ''))
const cvTimezone = computed(() => props.detail?.contact?.timezone || 'UTC-3')

const cvDownloadFileName = computed(() => {
  const lang = isEs.value ? 'ES' : 'EN'
  const style = mode.value === 'harvard' ? 'Harvard_ATS' : 'Moderno'
  return `Mateo_Sonzogni_CV_${style}_${lang}.pdf`
})

function printCV() {
  if (import.meta.client) {
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
        <!-- Botón de Descarga Directa PDF (Invoca el print calibrado a PDF para datos en vivo) -->
        <button
          type="button"
          class="cv-action-btn cv-download-btn"
          :title="isEs ? `Guardar o descargar PDF (${cvDownloadFileName})` : `Save or download PDF (${cvDownloadFileName})`"
          @click="printCV"
        >
          <DatosIcon name="download" :size="13" />
          <span>{{ isEs ? 'DESCARGAR PDF' : 'DOWNLOAD PDF' }}</span>
        </button>

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
            <span class="h-org">PEGASUZ &amp; FREELANCE</span>
            <span class="h-date">{{ isEs ? '2023 – Presente' : '2023 – Present' }}</span>
          </div>
          <div class="h-entry-sub">
            <span class="h-degree">{{ isEs ? 'Fundador & Consultor de Software' : 'Founder & Software Consultant' }}</span>
            <span class="h-loc">{{ isEs ? 'Remoto' : 'Remote' }}</span>
          </div>
          <ul class="h-bullets">
            <li v-if="isEs">Diseño e implementación de CMS multi-tenant propio con APIs REST desacopladas.</li>
            <li v-else>Designed and implemented proprietary multi-tenant headless CMS with decoupled REST APIs.</li>
            <li v-if="isEs">Entrega exitosa de aproximadamente 10 proyectos web llave en mano para clientes de diversos rubros.</li>
            <li v-else>Successful delivery of ~10 turnkey web solutions for clients across commercial and enterprise sectors.</li>
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
    <!-- ESTILO 2: MODERNO EDITORIAL (SWISS TECH & CREATIVE DEVELOPER PROFILE)  -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <article v-else class="cv-modern">
      <!-- 1. Cabecera Editorial Integrada -->
      <header class="m-masthead">
        <div class="m-masthead-main">
          <div class="m-meta-strip">
            <span class="m-kicker">{{ isEs ? 'EXPEDIENTE // CURRÍCULUM VITAE 2026' : 'PROFILE DOSSIER // CURRICULUM VITAE 2026' }}</span>
            <span class="m-sep-dot" aria-hidden="true">·</span>
            <span class="m-status-text">● {{ cvAvailability }}</span>
          </div>

          <h1 class="m-name">{{ cvName }}</h1>
          <p class="m-role">{{ cvRole }}</p>

          <p class="m-bio">{{ cvBio }}</p>
        </div>

        <div class="m-portrait-wrap">
          <img
            src="/media/profile/mateo-front.png"
            alt="Mateo Gabriel Sonzogni"
            class="m-portrait-img"
            loading="eager"
          >
          <span class="m-portrait-corner tl" aria-hidden="true">┌</span>
          <span class="m-portrait-corner tr" aria-hidden="true">┐</span>
          <span class="m-portrait-corner bl" aria-hidden="true">└</span>
          <span class="m-portrait-corner br" aria-hidden="true">┘</span>
        </div>
      </header>

      <!-- 2. Rejilla Asimétrica Editorial (2 Columnas Limpias) -->
      <div class="m-body-grid">
        <!-- Columna Lateral (30%) -->
        <aside class="m-side-col">
          <!-- Contacto -->
          <div class="m-panel">
            <h2 class="m-panel-title">{{ isEs ? '01 / CONTACTO DIRECTO' : '01 / DIRECT CONTACT' }}</h2>
            <ul class="m-contact-list">
              <li>
                <DatosIcon name="mail" :size="12" class="m-icon" />
                <a :href="`mailto:${cvEmail}`">{{ cvEmail }}</a>
              </li>
              <li>
                <DatosIcon name="code" :size="12" class="m-icon" />
                <a :href="cvGithub" target="_blank" rel="noopener noreferrer">{{ cvGithubText }}</a>
              </li>
              <li>
                <DatosIcon name="briefcase" :size="12" class="m-icon" />
                <a :href="cvLinkedin" target="_blank" rel="noopener noreferrer">{{ cvLinkedinText }}</a>
              </li>
              <li>
                <DatosIcon name="pin" :size="12" class="m-icon" />
                <span>{{ cvLocation }}</span>
              </li>
              <li>
                <DatosIcon name="clock" :size="12" class="m-icon" />
                <span>{{ cvTimezone }} ({{ isEs ? 'Remoto / Híbrido' : 'Remote / Hybrid' }})</span>
              </li>
            </ul>
          </div>

          <!-- Stack Tecnológico -->
          <div class="m-panel">
            <h2 class="m-panel-title">{{ isEs ? '02 / ARSENAL TÉCNICO' : '02 / TECHNICAL STACK' }}</h2>
            <div class="m-stack-group">
              <span class="m-sg-label">FRONTEND:</span>
              <span class="m-sg-val">Vue 3, Nuxt 4, React, Next.js, TypeScript, Tailwind, GSAP</span>
            </div>
            <div class="m-stack-group">
              <span class="m-sg-label">BACKEND &amp; DATA:</span>
              <span class="m-sg-val">Node.js, Express, FastAPI, Python, PostgreSQL 17, Prisma</span>
            </div>
            <div class="m-stack-group">
              <span class="m-sg-label">CLOUD &amp; TOOLS:</span>
              <span class="m-sg-val">Docker, CI/CD, Git, Linux, Figma UI/UX, Vitest, Lenis</span>
            </div>
          </div>

          <!-- Formación Académica -->
          <div class="m-panel">
            <h2 class="m-panel-title">{{ isEs ? '03 / FORMACIÓN TÉCNICA' : '03 / EDUCATION' }}</h2>
            <div class="m-edu-item">
              <div class="m-ei-top">
                <span class="m-ei-school">ESCUELA DA VINCI</span>
                <span class="m-ei-year">2024–2026</span>
              </div>
              <p class="m-ei-degree">{{ isEs ? 'Diseño y Desarrollo Web' : 'Web Design & Development' }}</p>
              <p class="m-ei-note">{{ isEs ? 'Tesis: Ynara (Lead Frontend & Arquitecto).' : 'Thesis: Ynara.' }}</p>
            </div>

            <div class="m-edu-item">
              <div class="m-ei-top">
                <span class="m-ei-school">CENTRO EDUCACIÓN TÉCNICA 30</span>
                <span class="m-ei-year">2017–2023</span>
              </div>
              <p class="m-ei-degree">{{ isEs ? 'Técnico en Programación (7 Años)' : 'Programming Technician (7 Years)' }}</p>
              <p class="m-ei-note">{{ isEs ? 'Algoritmia, redes y sistemas de software.' : 'Algorithms, networking, systems.' }}</p>
            </div>
          </div>

          <!-- Idiomas -->
          <div class="m-panel">
            <h2 class="m-panel-title">{{ isEs ? '04 / IDIOMAS' : '04 / LANGUAGES' }}</h2>
            <div class="m-lang-row">
              <span class="m-lr-lang">{{ isEs ? 'Español' : 'Spanish' }}</span>
              <span class="m-lr-level">{{ isEs ? 'Nativo' : 'Native' }}</span>
            </div>
            <div class="m-lang-row">
              <span class="m-lr-lang">{{ isEs ? 'Inglés' : 'English' }}</span>
              <span class="m-lr-level">{{ isEs ? 'B2 Profesional Técnico' : 'B2 Professional Technical' }}</span>
            </div>
          </div>
        </aside>

        <!-- Columna Principal (70%) -->
        <main class="m-main-col">
          <div class="m-main-head">
            <h2 class="m-main-title">{{ isEs ? 'EXPERIENCIA PROFESIONAL & SISTEMAS EN PRODUCCIÓN' : 'PROFESSIONAL EXPERIENCE & SHIPPED SYSTEMS' }}</h2>
            <span class="m-main-count">{{ isEs ? '04 ENTREGABLES' : '04 DELIVERABLES' }}</span>
          </div>

          <div class="m-exp-list">
            <!-- 01. Ynara -->
            <article class="m-exp-entry">
              <div class="m-ee-top-row">
                <div class="m-ee-org-wrap">
                  <h3 class="m-ee-org">Ynara AI Assistant</h3>
                  <span class="m-ee-badge">{{ isEs ? 'Tesis Da Vinci' : 'Da Vinci Thesis' }}</span>
                </div>
                <span class="m-ee-date">05/2026 – 07/2026</span>
              </div>
              <div class="m-ee-sub-row">
                <span class="m-ee-role">{{ isEs ? 'Arquitecto de Software & Lead Frontend' : 'Software Architect & Lead Frontend' }}</span>
                <span class="m-ee-loc">Buenos Aires, Argentina</span>
              </div>
              <p class="m-ee-desc">
                {{ isEs
                  ? 'Asistente de IA on-premise adaptativo en rioplatense con inferencia local y persistencia vectorial sobre PostgreSQL + pgvector.'
                  : 'On-premise adaptive AI assistant with local inference and persistent vector memory over PostgreSQL + pgvector.'
                }}
              </p>
              <ul class="m-ee-bullets">
                <li>{{ isEs ? 'Lideré la arquitectura técnica y el frontend con 382 commits en 6 semanas de desarrollo intensivo.' : 'Led system architecture and reactive frontend with 382 commits over 6 weeks of engineering.' }}</li>
                <li>{{ isEs ? 'Construí la aplicación en Next.js y FastAPI logrando latencias semánticas sub-100ms en entornos locales.' : 'Engineered Next.js client and FastAPI pipeline achieving sub-100ms semantic response times.' }}</li>
              </ul>
              <div class="m-ee-chips">
                <span>FastAPI</span>
                <span>Next.js</span>
                <span>PostgreSQL</span>
                <span>pgvector</span>
                <span>Python</span>
                <span>TypeScript</span>
              </div>
            </article>

            <!-- 02. La Rúcula -->
            <article class="m-exp-entry">
              <div class="m-ee-top-row">
                <div class="m-ee-org-wrap">
                  <h3 class="m-ee-org">La Rúcula Gastrobar</h3>
                </div>
                <span class="m-ee-date">03/2026 – 07/2026</span>
              </div>
              <div class="m-ee-sub-row">
                <span class="m-ee-role">{{ isEs ? 'Freelance · Full Stack & Diseñador UI' : 'Freelance · Full Stack & UI Designer' }}</span>
                <span class="m-ee-loc">Cádiz, {{ isEs ? 'España' : 'Spain' }}</span>
              </div>
              <p class="m-ee-desc">
                {{ isEs
                  ? 'Sitio web editorial menu-first optimizado para escaneo QR de comensales en mesa, con arquitectura de cache offline.'
                  : 'Editorial menu-first web app optimized for table-side QR scanning with cached offline resilience.'
                }}
              </p>
              <ul class="m-ee-bullets">
                <li>{{ isEs ? 'Puntuación Lighthouse de 99 en Performance y 100 en SEO y Accesibilidad con bundle final de apenas 42 KB.' : 'Achieved 99 Performance and 100 SEO & Accessibility Lighthouse scores with a compact 42 KB bundle.' }}</li>
                <li>{{ isEs ? 'Integración con CMS propio y fallback en cache para operación continua ante caídas de conectividad.' : 'Integrated offline caching fallbacks ensuring uninterrupted service during network outages.' }}</li>
              </ul>
              <div class="m-ee-chips">
                <span>Vue 3</span>
                <span>Vite</span>
                <span>Tailwind CSS</span>
                <span>GSAP</span>
                <span>Lenis</span>
              </div>
            </article>

            <!-- 03. ARG Piscinas -->
            <article class="m-exp-entry">
              <div class="m-ee-top-row">
                <div class="m-ee-org-wrap">
                  <h3 class="m-ee-org">ARG Piscinas</h3>
                </div>
                <span class="m-ee-date">01/2026 – 07/2026</span>
              </div>
              <div class="m-ee-sub-row">
                <span class="m-ee-role">{{ isEs ? 'Freelance · Desarrollador Full Stack' : 'Freelance · Full Stack Developer' }}</span>
                <span class="m-ee-loc">Andalucía, {{ isEs ? 'España' : 'Spain' }}</span>
              </div>
              <p class="m-ee-desc">
                {{ isEs
                  ? 'Plataforma corporativa multi-idioma (ES/EN/DE) con panel de control autónomo para carga de obras de arquitectura y blog.'
                  : 'Multilingual corporate web platform (ES/EN/DE) with custom CMS dashboard for architectural projects and blog.'
                }}
              </p>
              <ul class="m-ee-bullets">
                <li>{{ isEs ? 'Modelado relacional y tipado estricto de extremo a extremo con Prisma ORM, Node.js y TypeScript.' : 'Modeled relational schema and end-to-end type safety with Prisma ORM, Node.js, and TypeScript.' }}</li>
              </ul>
              <div class="m-ee-chips">
                <span>Vue 3</span>
                <span>Node.js</span>
                <span>Prisma</span>
                <span>Tailwind CSS</span>
                <span>TypeScript</span>
              </div>
            </article>

            <!-- 04. Pegasuz & Freelance -->
            <article class="m-exp-entry">
              <div class="m-ee-top-row">
                <div class="m-ee-org-wrap">
                  <h3 class="m-ee-org">Pegasuz &amp; Freelance</h3>
                </div>
                <span class="m-ee-date">2023 – {{ isEs ? 'Presente' : 'Present' }}</span>
              </div>
              <div class="m-ee-sub-row">
                <span class="m-ee-role">{{ isEs ? 'Fundador & Consultor de Software' : 'Founder & Software Consultant' }}</span>
                <span class="m-ee-loc">{{ isEs ? 'Remoto' : 'Remote' }}</span>
              </div>
              <p class="m-ee-desc">
                {{ isEs
                  ? 'Diseño de CMS multi-tenant propio y entrega exitosa de aproximadamente 10 proyectos web llave en mano para diversos rubros.'
                  : 'Proprietary multi-tenant headless CMS and successful delivery of ~10 turnkey web solutions for diverse clients.'
                }}
              </p>
            </article>
          </div>

          <!-- Objetivo Profesional -->
          <div class="m-goal-box">
            <h3 class="m-gb-title">{{ isEs ? 'OBJETIVO PROFESIONAL' : 'CAREER OBJECTIVE' }}</h3>
            <p class="m-gb-text">{{ cvGoal }}</p>
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

/* ─── ESTILO 2: MODERNO EDITORIAL (SWISS TECH) ────────────────────────────── */
.cv-modern {
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  background: var(--d-paper);
  color: var(--d-ink);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Cabecera Editorial Integrada */
.m-masthead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 18px;
  border-bottom: 1.5px solid var(--d-rule-strong);
}

.m-masthead-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.m-meta-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  margin-bottom: 6px;
}

.m-kicker {
  font-weight: 800;
  color: var(--d-sig);
  letter-spacing: 0.08em;
}

.m-sep-dot {
  color: var(--d-rule-strong);
}

.m-status-text {
  font-weight: 700;
  color: var(--d-green);
  letter-spacing: 0.04em;
}

.m-name {
  margin: 0 0 4px;
  font-family: var(--font-text);
  font-size: clamp(26px, 3vw, 34px);
  font-weight: 800;
  color: var(--d-ink);
  letter-spacing: -0.025em;
  line-height: 1.15;
}

.m-role {
  margin: 0 0 10px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-weight: 700;
  color: var(--d-dim);
  letter-spacing: -0.01em;
}

.m-bio {
  margin: 0;
  font-family: var(--font-text);
  font-size: 14px;
  line-height: 1.6;
  color: var(--d-ink);
}

/* Retrato Editorial con Marcadores de Esquina */
.m-portrait-wrap {
  position: relative;
  width: 135px;
  height: 135px;
  flex-shrink: 0;
  padding: 4px;
  border: 1px solid var(--d-rule-strong);
  background: var(--d-surface);
}

.m-portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}

.m-portrait-corner {
  position: absolute;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1;
  color: var(--d-sig);
  pointer-events: none;
}
.m-portrait-corner.tl { top: -4px; left: -4px; }
.m-portrait-corner.tr { top: -4px; right: -4px; }
.m-portrait-corner.bl { bottom: -4px; left: -4px; }
.m-portrait-corner.br { bottom: -4px; right: -4px; }

/* Rejilla Asimétrica */
.m-body-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 32px;
  align-items: start;
}

/* Columna Lateral */
.m-side-col {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.m-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.m-panel-title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--d-sig);
  border-bottom: 1px solid var(--d-rule);
  padding-bottom: 4px;
}

.m-contact-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.4;
}

.m-contact-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--d-dim);
}

.m-contact-list a {
  color: var(--d-ink);
  text-decoration: none;
}

.m-contact-list a:hover {
  color: var(--d-sig);
  text-decoration: underline;
}

.m-icon {
  color: var(--d-sig);
  flex-shrink: 0;
}

.m-stack-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.m-sg-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 800;
  color: var(--d-faint);
  letter-spacing: 0.04em;
}

.m-sg-val {
  font-family: var(--font-text);
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--d-ink);
}

.m-edu-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.m-ei-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px;
}

.m-ei-school {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--d-ink);
}

.m-ei-year {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--d-dim);
}

.m-ei-degree {
  margin: 0;
  font-family: var(--font-text);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--d-sig);
}

.m-ei-note {
  margin: 0;
  font-family: var(--font-text);
  font-size: 11.5px;
  color: var(--d-dim);
  line-height: 1.35;
}

.m-lang-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-family: var(--font-mono);
  font-size: 11.5px;
  margin-bottom: 2px;
}

.m-lr-lang {
  font-weight: 700;
  color: var(--d-ink);
}

.m-lr-level {
  color: var(--d-dim);
  font-size: 10.5px;
}

/* Columna Principal */
.m-main-col {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.m-main-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  border-bottom: 1px solid var(--d-rule);
  padding-bottom: 4px;
}

.m-main-title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--d-ink);
}

.m-main-count {
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 700;
  color: var(--d-sig);
}

.m-exp-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.m-exp-entry {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 18px;
  border-bottom: 1px dashed var(--d-rule);
}
.m-exp-entry:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.m-ee-top-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.m-ee-org-wrap {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.m-ee-org {
  margin: 0;
  font-family: var(--font-text);
  font-size: 15px;
  font-weight: 700;
  color: var(--d-ink);
}

.m-ee-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--d-sig);
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
  padding: 1px 6px;
}

.m-ee-sub-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}

.m-ee-role {
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 700;
  color: var(--d-sig);
}

.m-ee-loc {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--d-faint);
}

.m-ee-date {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-faint);
}

.m-ee-desc {
  margin: 0;
  font-family: var(--font-text);
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--d-dim);
}

.m-ee-bullets {
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-family: var(--font-text);
  font-size: 13px;
  line-height: 1.5;
  color: var(--d-ink);
}

.m-ee-bullets li {
  position: relative;
  padding-left: 12px;
}

.m-ee-bullets li::before {
  content: '▪';
  position: absolute;
  left: 0;
  color: var(--d-sig);
  font-size: 10px;
}

.m-ee-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 10px;
}

.m-ee-chips span {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 1.5px 6px;
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
  color: var(--d-dim);
}

/* Objetivo Profesional */
.m-goal-box {
  border-left: 2px solid var(--d-sig);
  padding: 10px 16px;
  background: var(--d-surface);
  margin-top: 8px;
}

.m-gb-title {
  margin: 0 0 4px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--d-sig);
}

.m-gb-text {
  margin: 0;
  font-family: var(--font-text);
  font-size: 13px;
  line-height: 1.5;
  color: var(--d-ink);
}

/* ─── Responsive & Print Rules ─────────────────────────────────────────────── */
@media screen and (max-width: 680px) {
  .m-body-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .m-masthead {
    flex-direction: column;
    gap: 16px;
  }
  .cv-harvard {
    padding: 20px 16px;
    box-shadow: none;
  }
  .h-entry-header,
  .h-entry-sub {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  .h-bullets {
    padding-left: 14px;
  }
  .cv-actions {
    width: 100%;
    display: flex;
    gap: 8px;
  }
  .cv-action-btn {
    flex: 1;
    justify-content: center;
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

  /* Harvard ATS print (1 Página Exacta) */
  .cv-harvard {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100% !important;
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

  /* Modern print (1 Página Exacta y Equilibrada) */
  .cv-modern {
    display: flex !important;
    flex-direction: column !important;
    gap: 7.5pt !important;
    background: #ffffff !important;
    color: #111827 !important;
    border: none !important;
    box-shadow: none !important;
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .cv-modern .m-masthead {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    justify-content: space-between !important;
    gap: 18pt !important;
    padding-bottom: 8pt !important;
    margin-bottom: 6pt !important;
    border-bottom: 1.5pt solid #111827 !important;
  }
  .cv-modern .m-masthead-main {
    flex: 1 !important;
    min-width: 0 !important;
  }
  .cv-modern .m-name {
    color: #111827 !important;
    font-size: 21.5pt !important;
    font-weight: 800 !important;
    margin: 0 0 2pt !important;
    line-height: 1.15 !important;
  }
  .cv-modern .m-role {
    color: #e03600 !important;
    font-size: 10.2pt !important;
    font-weight: 700 !important;
    margin: 0 0 4pt !important;
  }
  .cv-modern .m-bio {
    color: #374151 !important;
    font-size: 9.3pt !important;
    line-height: 1.55 !important;
  }
  .cv-modern .m-meta-strip {
    font-size: 7.8pt !important;
    margin-bottom: 3.5pt !important;
  }
  .cv-modern .m-kicker {
    color: #e03600 !important;
  }
  .cv-modern .m-status-text {
    color: #16a34a !important;
  }
  .cv-modern .m-portrait-wrap {
    width: 135px !important;
    height: 135px !important;
    flex-shrink: 0 !important;
    padding: 3.5px !important;
    border: 1px solid #d1d5db !important;
    background: #ffffff !important;
  }
  .cv-modern .m-body-grid {
    display: grid !important;
    grid-template-columns: 218px 1fr !important;
    gap: 20pt !important;
  }
  .cv-modern .m-side-col {
    gap: 12pt !important;
  }
  .cv-modern .m-panel {
    gap: 4.5pt !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .cv-modern .m-panel-title {
    color: #e03600 !important;
    border-bottom: 0.75pt solid #d1d5db !important;
    font-size: 8.8pt !important;
    padding-bottom: 3pt !important;
  }
  .cv-modern .m-contact-list {
    font-size: 8.5pt !important;
    gap: 5.5pt !important;
    line-height: 1.4 !important;
  }
  .cv-modern .m-contact-list li {
    color: #374151 !important;
  }
  .cv-modern .m-contact-list a {
    color: #111827 !important;
  }
  .cv-modern .m-icon {
    color: #e03600 !important;
  }
  .cv-modern .m-stack-group {
    gap: 2.5pt !important;
    margin-bottom: 4.5pt !important;
  }
  .cv-modern .m-sg-label {
    font-size: 7.6pt !important;
    color: #6b7280 !important;
  }
  .cv-modern .m-sg-val {
    font-size: 8.5pt !important;
    line-height: 1.4 !important;
    color: #111827 !important;
  }
  .cv-modern .m-edu-item {
    gap: 2.5pt !important;
    margin-bottom: 6pt !important;
  }
  .cv-modern .m-ei-school {
    font-size: 8.8pt !important;
    color: #111827 !important;
  }
  .cv-modern .m-ei-year {
    font-size: 7.6pt !important;
    color: #6b7280 !important;
  }
  .cv-modern .m-ei-degree {
    font-size: 8.8pt !important;
    color: #e03600 !important;
  }
  .cv-modern .m-ei-note {
    font-size: 7.6pt !important;
    color: #4b5563 !important;
  }
  .cv-modern .m-lang-row {
    font-size: 8.5pt !important;
    margin-bottom: 2pt !important;
  }
  .cv-modern .m-lr-lang {
    color: #111827 !important;
  }
  .cv-modern .m-lr-level {
    color: #6b7280 !important;
    font-size: 7.6pt !important;
  }
  .cv-modern .m-main-col {
    gap: 11pt !important;
  }
  .cv-modern .m-main-head {
    border-bottom: 0.75pt solid #d1d5db !important;
    padding-bottom: 3pt !important;
  }
  .cv-modern .m-main-title {
    color: #111827 !important;
    font-size: 8.8pt !important;
  }
  .cv-modern .m-main-count {
    color: #e03600 !important;
    font-size: 7.8pt !important;
  }
  .cv-modern .m-exp-list {
    gap: 9.5pt !important;
  }
  .cv-modern .m-exp-entry {
    gap: 3pt !important;
    padding-bottom: 8pt !important;
    border-bottom: 0.5pt dashed #e5e7eb !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .cv-modern .m-ee-top-row,
  .cv-modern .m-ee-sub-row {
    display: flex !important;
    justify-content: space-between !important;
    align-items: baseline !important;
    gap: 8pt !important;
  }
  .cv-modern .m-ee-org {
    color: #111827 !important;
    font-size: 10.2pt !important;
  }
  .cv-modern .m-ee-badge {
    color: #e03600 !important;
    font-size: 7.2pt !important;
    border: 0.5pt solid #e5e7eb !important;
    background: #f9fafb !important;
    padding: 1pt 4pt !important;
  }
  .cv-modern .m-ee-loc {
    color: #6b7280 !important;
    font-size: 7.8pt !important;
  }
  .cv-modern .m-ee-role {
    color: #e03600 !important;
    font-size: 8.8pt !important;
  }
  .cv-modern .m-ee-date {
    color: #6b7280 !important;
    font-size: 7.8pt !important;
  }
  .cv-modern .m-ee-desc {
    color: #374151 !important;
    font-size: 8.8pt !important;
    line-height: 1.42 !important;
  }
  .cv-modern .m-ee-bullets {
    font-size: 8.5pt !important;
    line-height: 1.4 !important;
    color: #1f2937 !important;
    gap: 3pt !important;
    margin-top: 3pt !important;
  }
  .cv-modern .m-ee-bullets li::before {
    color: #e03600 !important;
  }
  .cv-modern .m-ee-chips {
    gap: 2.5pt !important;
    margin-top: 4.5pt !important;
  }
  .cv-modern .m-ee-chips span {
    font-size: 7pt !important;
    padding: 1pt 4pt !important;
    background: #f3f4f6 !important;
    border: 0.5pt solid #e5e7eb !important;
    color: #374151 !important;
  }
  .cv-modern .m-goal-box {
    border-left: 2.5pt solid #e03600 !important;
    background: #f9fafb !important;
    padding: 8pt 10pt !important;
    margin-top: 6pt !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .cv-modern .m-gb-title {
    font-size: 7.8pt !important;
    color: #e03600 !important;
    margin-bottom: 2pt !important;
  }
  .cv-modern .m-gb-text {
    font-size: 8.3pt !important;
    line-height: 1.4 !important;
    color: #1f2937 !important;
  }
}
</style>
