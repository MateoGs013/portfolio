<script setup lang="ts">
// Componente de Currículum Vitae Dual — Mateo Gabriel Sonzogni
// Soporta conmutación reactiva entre:
// 1. Modo Harvard ATS (académico, blanco y negro, sin foto, máxima legibilidad para reclutadores y sistemas ATS)
// 2. Modo Moderno (diseño tecnológico contemporáneo con fotografía de perfil, dos columnas y chips técnicos)
// Incluye botón de exportación/impresión a PDF con estilos @media print y localización completa (ES / EN).

import DatosIcon from './DatosIcon.vue'

const { isEs } = usePortfolioLocale()
const { isHyperfocus } = useHyperfocus()
const mode = ref<'harvard' | 'modern'>('modern')

watch(isHyperfocus, (val) => {
  if (val) {
    mode.value = 'harvard'
  }
}, { immediate: true })

const cvDownloadFileName = computed(() => {
  const lang = isEs.value ? 'ES' : 'EN'
  const style = mode.value === 'harvard' ? 'Harvard_ATS' : 'Moderno'
  return `Mateo_Sonzogni_CV_${style}_${lang}.pdf`
})

const cvDownloadHref = computed(() => {
  return `/cv/${cvDownloadFileName.value}`
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
          :title="isEs ? 'Ver CV moderno en dos columnas con fotografía técnica' : 'View modern two-column tech resume with photo'"
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
          :href="cvDownloadHref"
          :download="cvDownloadFileName"
          class="cv-action-btn cv-download-btn"
          :title="isEs ? `Descargar archivo PDF oficial (${cvDownloadFileName})` : `Download official PDF file (${cvDownloadFileName})`"
        >
          <DatosIcon name="download" :size="13" />
          <span>{{ isEs ? 'DESCARGAR PDF' : 'DOWNLOAD PDF' }}</span>
        </a>

        <!-- Botón de Impresión / Guardado Navegador -->
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
        <h1 class="h-name">MATEO GABRIEL SONZOGNI</h1>
        <p class="h-role">{{ isEs ? 'Desarrollador Frontend & Full Stack · Creative Developer' : 'Frontend & Full Stack Developer · Creative Developer' }}</p>
        <div class="h-contact">
          <span>Río Negro, Argentina</span>
          <span class="h-sep">|</span>
          <a href="mailto:mateogabus@gmail.com">mateogabus@gmail.com</a>
          <span class="h-sep">|</span>
          <a href="https://github.com/MateoGs013" target="_blank" rel="noopener noreferrer">github.com/MateoGs013</a>
          <span class="h-sep">|</span>
          <a href="https://www.linkedin.com/in/mateo-sonzogni" target="_blank" rel="noopener noreferrer">linkedin.com/in/mateo-sonzogni</a>
          <span class="h-sep">|</span>
          <span>{{ isEs ? 'Disponibilidad Inmediata · Remoto / Híbrido' : 'Immediate Availability · Remote / Hybrid' }}</span>
        </div>
      </header>

      <!-- Resumen Profesional -->
      <section class="h-section">
        <h2 class="h-title">{{ isEs ? 'RESUMEN PROFESIONAL' : 'PROFESSIONAL SUMMARY' }}</h2>
        <p class="h-summary">
          <template v-if="isEs">
            Desarrollador de software especializado en frontend reactivo, arquitectura de APIs y experiencia de usuario. Tesis de grado preaprobada en Escuela Da Vinci con 382 commits liderando la arquitectura de un asistente de inteligencia artificial on-premise. Experiencia comprobable en producción con más de 10 proyectos entregados para clientes en España y Argentina (La Rúcula Gastrobar, ARG Piscinas). Dominio de TypeScript, Vue 3, Nuxt 4, React, Next.js, Node.js, FastAPI y PostgreSQL. Criterio de diseño orientado a producto de punta a punta.
          </template>
          <template v-else>
            Software engineer specialized in reactive frontend engineering, API architecture, and user experience. Pre-approved degree thesis at Da Vinci School with 382 commits leading system architecture for an on-premise AI assistant. Verifiable production track record with 10+ deliverables for clients across Spain and Argentina (La Rúcula Gastrobar, ARG Piscinas). Proficient in TypeScript, Vue 3, Nuxt 4, React, Next.js, Node.js, FastAPI, and PostgreSQL. End-to-end product design mindset.
          </template>
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
    <!-- ESTILO 2: MODERNO CON FOTO (TECH & CREATIVE PROFILE)                  -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <article v-else class="cv-modern">
      <aside class="m-sidebar">
        <!-- Foto de Perfil de Mateo (Sin efectos 3D) -->
        <div class="m-photo-container">
          <img
            src="/media/profile/mateo-front.png"
            alt="Mateo Gabriel Sonzogni"
            class="m-photo"
            loading="eager"
          >
          <div class="m-status-pill">
            <span class="m-status-dot" />
            <span>{{ isEs ? 'DISPONIBLE // 2026' : 'AVAILABLE // 2026' }}</span>
          </div>
        </div>

        <!-- Contacto Directo -->
        <div class="m-block">
          <h3 class="m-heading">{{ isEs ? 'CONTACTO' : 'CONTACT' }}</h3>
          <ul class="m-contact-list">
            <li>
              <span class="m-icon"><DatosIcon name="mail" :size="13" /></span>
              <a href="mailto:mateogabus@gmail.com">mateogabus@gmail.com</a>
            </li>
            <li>
              <span class="m-icon"><DatosIcon name="code" :size="13" /></span>
              <a href="https://github.com/MateoGs013" target="_blank" rel="noopener noreferrer">github.com/MateoGs013</a>
            </li>
            <li>
              <span class="m-icon"><DatosIcon name="briefcase" :size="13" /></span>
              <a href="https://www.linkedin.com/in/mateo-sonzogni" target="_blank" rel="noopener noreferrer">linkedin.com/in/mateo-sonzogni</a>
            </li>
            <li>
              <span class="m-icon"><DatosIcon name="pin" :size="13" /></span>
              <span>Río Negro, Patagonia Argentina</span>
            </li>
            <li>
              <span class="m-icon"><DatosIcon name="clock" :size="13" /></span>
              <span>UTC-3 ({{ isEs ? 'Disponible Remoto / Híbrido' : 'Available Remote / Hybrid' }})</span>
            </li>
          </ul>
        </div>

        <!-- Idiomas -->
        <div class="m-block">
          <h3 class="m-heading">{{ isEs ? 'IDIOMAS' : 'LANGUAGES' }}</h3>
          <div class="m-lang-row">
            <span class="m-lang-name">{{ isEs ? 'Español' : 'Spanish' }}</span>
            <span class="m-lang-level">{{ isEs ? 'Nativo' : 'Native' }}</span>
          </div>
          <div class="m-lang-row">
            <span class="m-lang-name">{{ isEs ? 'Inglés' : 'English' }}</span>
            <span class="m-lang-level">{{ isEs ? 'B2 Profesional Técnico' : 'B2 Professional Technical' }}</span>
          </div>
        </div>

        <!-- Arsenal Tecnológico -->
        <div class="m-block">
          <h3 class="m-heading">CORE STACK</h3>
          <div class="m-chips">
            <span class="m-chip">Vue 3</span>
            <span class="m-chip">Nuxt 4</span>
            <span class="m-chip">TypeScript</span>
            <span class="m-chip">React</span>
            <span class="m-chip">Next.js</span>
            <span class="m-chip">FastAPI</span>
            <span class="m-chip">Python</span>
            <span class="m-chip">Node.js</span>
            <span class="m-chip">PostgreSQL 17</span>
            <span class="m-chip">Prisma</span>
            <span class="m-chip">Tailwind CSS</span>
            <span class="m-chip">GSAP</span>
            <span class="m-chip">Figma</span>
          </div>
        </div>

        <!-- Competencias Nucleares -->
        <div class="m-block">
          <h3 class="m-heading">{{ isEs ? 'COMPETENCIAS' : 'KEY SKILLS' }}</h3>
          <ul class="m-list">
            <li>Full-Cycle Engineering</li>
            <li>{{ isEs ? 'Arquitectura de Datos Relacional' : 'Relational Data Architecture' }}</li>
            <li>{{ isEs ? 'Diseño UI/UX de Alta Fidelidad' : 'High-Fidelity UI/UX Design' }}</li>
            <li>{{ isEs ? 'Optimización de Rendimiento & SEO' : 'Performance & SEO Optimization' }}</li>
            <li>{{ isEs ? 'Desarrollo de APIs REST Tipadas' : 'Type-Safe REST API Engineering' }}</li>
          </ul>
        </div>

        <!-- Metodologías y Prácticas de Ingeniería -->
        <div class="m-block">
          <h3 class="m-heading">{{ isEs ? 'METODOLOGÍAS & PRÁCTICAS' : 'ENGINEERING PRACTICES' }}</h3>
          <ul class="m-list">
            <li>{{ isEs ? 'CI/CD & Flujo Git Colaborativo' : 'CI/CD & Git Team Workflow' }}</li>
            <li>{{ isEs ? 'Arquitectura Limpia & Modular' : 'Clean & Modular Architecture' }}</li>
            <li>{{ isEs ? 'Contratos Tipados (TS + Prisma)' : 'End-to-End Type Safety (TS + Prisma)' }}</li>
            <li>{{ isEs ? 'Optimización Web (Lighthouse 95+)' : 'Web Performance (Lighthouse 95+)' }}</li>
          </ul>
        </div>
      </aside>

      <!-- Columna Principal -->
      <main class="m-content">
        <!-- Encabezado Principal -->
        <header class="m-header">
          <span class="m-tag">{{ isEs ? 'EXPEDIENTE // CURRÍCULUM VITAE' : 'PROFILE DOSSIER // CURRICULUM VITAE' }}</span>
          <h1 class="m-name">Mateo Gabriel Sonzogni</h1>
          <p class="m-subtitle">{{ isEs ? 'Desarrollador Frontend & Full Stack · Creative Developer' : 'Frontend & Full Stack Developer · Creative Developer' }}</p>
          <p class="m-bio">
            <template v-if="isEs">
              Desarrollo con criterio de diseño y foco en el producto entero: qué problema resuelve, cómo debería verse, cómo debería sentirse, cómo se construye y cómo llega a producción. No me posiciono solo como programador ni solo como diseñador; trabajo en la costura donde la arquitectura técnica se encuentra con la experiencia de usuario.
            </template>
            <template v-else>
              I build software with sharp design judgment and end-to-end product vision: what challenge it solves, how it should look and feel, how it gets architected, and how it reaches production. I don't position myself merely as a coder or designer; I operate right where technical infrastructure meets human experience.
            </template>
          </p>
        </header>

        <!-- Trayectoria Profesional -->
        <section class="m-section">
          <div class="m-sec-title">
            <span class="m-sec-num">01</span>
            <h2>{{ isEs ? 'EXPERIENCIA PROFESIONAL & PROYECTOS' : 'PROFESSIONAL EXPERIENCE & PROJECTS' }}</h2>
          </div>

          <div class="m-card">
            <div class="m-card-top">
              <span class="m-card-role">{{ isEs ? 'Tesis en equipo · Contribuidor Principal (382 commits)' : 'Team Degree Thesis · Lead Contributor (382 commits)' }}</span>
              <span class="m-card-date">2026</span>
            </div>
            <h3 class="m-card-org">{{ isEs ? 'Ynara — Asistente de IA Adaptativo con Memoria Vectorial' : 'Ynara — Adaptive AI Assistant with Vector Memory' }}</h3>
            <p class="m-card-desc">
              <template v-if="isEs">
                Tesis preaprobada en Escuela Da Vinci. Asistente on-premise con inferencia local, embeddings y base de conocimiento relacional sobre PostgreSQL + pgvector. Lideré el desarrollo del frontend en Next.js y el pipeline de backend en FastAPI.
              </template>
              <template v-else>
                Pre-approved degree thesis at Da Vinci School. On-premise assistant featuring local inference, embeddings, and relational knowledge graph over PostgreSQL + pgvector. Led frontend development in Next.js and backend pipeline in FastAPI.
              </template>
            </p>
            <ul class="m-card-bullets">
              <li v-if="isEs">Inferencia local y persistencia vectorial con PostgreSQL + pgvector; latencia semántica &lt; 100ms.</li>
              <li v-else>Local inference &amp; vector persistence with PostgreSQL + pgvector; sub-100ms semantic query latency.</li>
            </ul>
            <div class="m-card-tags">
              <span class="m-tag-sm">FastAPI</span>
              <span class="m-tag-sm">Next.js</span>
              <span class="m-tag-sm">PostgreSQL</span>
              <span class="m-tag-sm">Python</span>
              <span class="m-tag-sm">TypeScript</span>
            </div>
          </div>

          <div class="m-card">
            <div class="m-card-top">
              <span class="m-card-role">{{ isEs ? 'Freelance · Diseño y Desarrollo Web' : 'Freelance · Web Design & Engineering' }}</span>
              <span class="m-card-date">2026</span>
            </div>
            <h3 class="m-card-org">La Rúcula Gastrobar (Cádiz, {{ isEs ? 'España' : 'Spain' }})</h3>
            <p class="m-card-desc">
              <template v-if="isEs">
                Web menu-first para comensales en mesa por código QR. Integrada con el CMS Pegasuz propio y fallback local. Puntuación Lighthouse 99 en Performance y 100 en SEO. En producción.
              </template>
              <template v-else>
                Menu-first web app for restaurant dining via table-side QR codes. Integrated with proprietary Pegasuz CMS and local cache fallback. Lighthouse 99 Performance and 100 SEO scores. In production.
              </template>
            </p>
            <ul class="m-card-bullets">
              <li v-if="isEs">Fallback offline en caché para operación continua ante cortes de red; bundle de producción optimizado a 42 KB.</li>
              <li v-else>Cached offline fallback architecture ensuring uninterrupted dining service; lean 42 KB bundle.</li>
            </ul>
            <div class="m-card-tags">
              <span class="m-tag-sm">Vue 3</span>
              <span class="m-tag-sm">Vite</span>
              <span class="m-tag-sm">Tailwind CSS</span>
              <span class="m-tag-sm">GSAP</span>
              <span class="m-tag-sm">Lenis</span>
            </div>
          </div>

          <div class="m-card">
            <div class="m-card-top">
              <span class="m-card-role">{{ isEs ? 'Freelance · Frontend y Backend a Medida' : 'Freelance · Custom Frontend & Backend' }}</span>
              <span class="m-card-date">2026</span>
            </div>
            <h3 class="m-card-org">ARG Piscinas (Andalucía, {{ isEs ? 'España' : 'Spain' }})</h3>
            <p class="m-card-desc">
              <template v-if="isEs">
                Sitio corporativo multi-idioma con panel de administración propio para edición autónoma de proyectos y blog. Tipado de extremo a extremo con Prisma y Node.js.
              </template>
              <template v-else>
                Multilingual corporate web platform with dedicated admin dashboard for autonomous project management and blog. End-to-end type safety with Prisma and Node.js.
              </template>
            </p>
            <ul class="m-card-bullets">
              <li v-if="isEs">Esquema relacional y contratos tipados de punta a punta con Prisma ORM y TypeScript.</li>
              <li v-else>Relational data schema and strict end-to-end type safety with Prisma ORM and TypeScript.</li>
            </ul>
            <div class="m-card-tags">
              <span class="m-tag-sm">Vue 3</span>
              <span class="m-tag-sm">Node.js</span>
              <span class="m-tag-sm">Prisma</span>
              <span class="m-tag-sm">Tailwind</span>
            </div>
          </div>

          <div class="m-card">
            <div class="m-card-top">
              <span class="m-card-role">{{ isEs ? 'Fundador & Desarrollador' : 'Founder & Developer' }}</span>
              <span class="m-card-date">{{ isEs ? '2024 – Act.' : '2024 – Present' }}</span>
            </div>
            <h3 class="m-card-org">{{ isEs ? 'Pegasuz — CMS Multi-tenant Propio' : 'Pegasuz — Proprietary Multi-Tenant CMS' }}</h3>
            <p class="m-card-desc">
              <template v-if="isEs">
                Infraestructura de contenidos API-first que alimenta los sitios de clientes en producción con contratos de datos blindados.
              </template>
              <template v-else>
                API-first headless content infrastructure powering production client platforms with bulletproof data contracts.
              </template>
            </p>
            <ul class="m-card-bullets">
              <li v-if="isEs">Motor desacoplado que centraliza contenidos para múltiples clientes en producción con contratos blindados.</li>
              <li v-else>Decoupled multi-tenant engine centralizing production client delivery with rigid schema contracts.</li>
            </ul>
          </div>
        </section>

        <!-- Formación Académica -->
        <section class="m-section">
          <div class="m-sec-title">
            <span class="m-sec-num">02</span>
            <h2>{{ isEs ? 'FORMACIÓN ACADÉMICA' : 'EDUCATION & DEGREES' }}</h2>
          </div>

          <div class="m-edu-grid">
            <div class="m-card">
              <span class="m-card-date">{{ isEs ? '2024 – 2026 (Promoción 2026)' : '2024 – 2026 (Class of 2026)' }}</span>
              <h3 class="m-card-org">{{ isEs ? 'Diseño y Desarrollo Web' : 'Web Design & Development' }}</h3>
              <p class="m-edu-sub">Escuela Da Vinci · Buenos Aires</p>
              <p class="m-card-desc">
                <template v-if="isEs">
                  UI/UX, tipografía, dirección de arte digital, patrones de frontend reactivo, arquitecturas cliente-servidor y bases de datos. Tesis preaprobada: Ynara.
                </template>
                <template v-else>
                  UI/UX, typography, digital art direction, reactive frontend patterns, client-server architectures, and relational databases. Pre-approved thesis: Ynara.
                </template>
              </p>
            </div>

            <div class="m-card">
              <span class="m-card-date">{{ isEs ? '2017 – 2023 (Graduado)' : '2017 – 2023 (Graduated)' }}</span>
              <h3 class="m-card-org">{{ isEs ? 'Técnico en Programación' : 'Computer Programming Technician' }}</h3>
              <p class="m-edu-sub">CET N.º 30 · Río Negro</p>
              <p class="m-card-desc">
                <template v-if="isEs">
                  Formación técnica de 7 años en algoritmos, estructuras de datos, lógica de bajo nivel, redes y metodologías de ingeniería.
                </template>
                <template v-else>
                  7-year technical education covering algorithms, data structures, low-level logic, networking, and software engineering methodologies.
                </template>
              </p>
            </div>
          </div>
        </section>

        <!-- Meta Profesional -->
        <section class="m-section">
          <div class="m-sec-title">
            <span class="m-sec-num">03</span>
            <h2>{{ isEs ? 'OBJETIVO PROFESIONAL' : 'CAREER OBJECTIVE' }}</h2>
          </div>
          <div class="m-card highlight">
            <p class="m-card-desc">
              <template v-if="isEs">
                Consolidarme como desarrollador en un equipo con proyectos reales de mayor escala. A mediano plazo, liderazgo técnico: coordinar, organizar, comunicar y conectar perfiles de distintas áreas (diseño, producto, frontend y backend).
              </template>
              <template v-else>
                Consolidate my impact as an engineer within a high-caliber team shipping large-scale production software. In the medium term, technical leadership: coordinating, organizing, and bridging disciplines across product, UI/UX, frontend, and backend architectures.
              </template>
            </p>
          </div>
        </section>
      </main>
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
  white-space: nowrap;
}
.cv-action-btn:hover {
  border-color: var(--d-sig);
  color: var(--d-sig);
  background: var(--d-hover);
}
.cv-download-btn {
  background: var(--d-surface-raised);
  border-color: var(--d-sig);
  color: var(--d-sig);
}
.cv-download-btn:hover {
  background: var(--d-sig);
  color: #000000;
  border-color: var(--d-sig);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ESTILOS HARVARD ATS (CLÁSICO ACADÉMICO / MONOCROMO)                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
.cv-harvard {
  background: #ffffff;
  color: #111111;
  padding: clamp(24px, 4vw, 48px);
  border: 1px solid var(--d-rule);
  font-family: Georgia, 'Times New Roman', Times, serif;
  line-height: 1.45;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-width: 900px;
  margin: 0 auto;
}

.h-header {
  text-align: center;
  margin-bottom: 20px;
  border-bottom: 1.5px solid #111111;
  padding-bottom: 14px;
}
.h-name {
  margin: 0 0 4px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #000000;
  text-transform: uppercase;
}
.h-role {
  margin: 0 0 6px;
  font-size: 13.5px;
  font-style: italic;
  color: #333333;
}
.h-contact {
  font-size: 12px;
  color: #222222;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.h-contact a {
  color: #111111;
  text-decoration: underline;
}
.h-sep {
  color: #888888;
}

.h-section {
  margin-bottom: 18px;
}
.h-title {
  margin: 0 0 8px;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-bottom: 1px solid #222222;
  padding-bottom: 2px;
  color: #000000;
}
.h-summary {
  margin: 0;
  font-size: 12.5px;
  text-align: justify;
  line-height: 1.5;
  color: #111111;
}

.h-entry {
  margin-bottom: 12px;
}
.h-entry-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-weight: 700;
  font-size: 13px;
  color: #000000;
}
.h-entry-sub {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-style: italic;
  font-size: 12px;
  color: #333333;
  margin-bottom: 4px;
}
.h-date, .h-loc {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.h-bullets {
  margin: 4px 0 0;
  padding-left: 18px;
  font-size: 12px;
  color: #111111;
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
  color: #000000;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ESTILOS MODERNO (TECH + FOTOGRAFÍA + DOS COLUMNAS)                        */
/* ═══════════════════════════════════════════════════════════════════════════ */
.cv-modern {
  display: grid;
  grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
  gap: 24px;
  width: 100%;
}

/* Sidebar Moderno */
.m-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.m-photo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
  padding: 16px;
  text-align: center;
}
.m-photo {
  width: 100%;
  max-width: 220px;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border: 1px solid var(--d-rule-strong);
  margin-bottom: 12px;
}
.m-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--d-paper);
  border: 1px solid var(--d-green);
  color: var(--d-green);
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
}
.m-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--d-green);
  box-shadow: 0 0 6px var(--d-green);
}

.m-block {
  padding: 16px;
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
}
.m-heading {
  margin: 0 0 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--d-sig);
  border-bottom: 1px solid var(--d-rule);
  padding-bottom: 6px;
}

.m-contact-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 11.5px;
}
.m-contact-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--d-dim);
  overflow-wrap: anywhere;
}
.m-icon {
  color: var(--d-sig);
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.m-contact-list a {
  color: var(--d-ink);
  text-decoration: none;
}
.m-contact-list a:hover {
  color: var(--d-sig);
  text-decoration: underline;
}

.m-lang-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-family: var(--font-mono);
  font-size: 11.5px;
  margin-bottom: 6px;
}
.m-lang-name {
  color: var(--d-ink);
  font-weight: 700;
}
.m-lang-level {
  color: var(--d-dim);
  font-size: 10.5px;
}

.m-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.m-chip {
  padding: 3px 8px;
  background: var(--d-paper);
  border: 1px solid var(--d-rule);
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--d-ink);
}

.m-lang-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  font-size: 12.5px;
  margin-bottom: 4px;
}
.m-lang-name {
  font-family: var(--font-text);
  font-weight: 600;
  color: var(--d-ink);
}
.m-lang-level {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--d-dim);
}

.m-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: var(--font-text);
  font-size: 12.5px;
  color: var(--d-dim);
}
.m-list li::before {
  content: '▸ ';
  color: var(--d-sig);
  font-weight: bold;
}

/* Columna Principal Moderna */
.m-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.m-header {
  padding: 24px;
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
  border-left: 4px solid var(--d-sig);
}
.m-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--d-sig);
}
.m-name {
  margin: 6px 0 4px;
  font-family: var(--font-text);
  font-size: clamp(24px, 2.5vw, 34px);
  font-weight: 700;
  color: var(--d-ink);
  letter-spacing: -0.02em;
}
.m-subtitle {
  margin: 0 0 14px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--d-dim);
}
.m-bio {
  margin: 0;
  font-family: var(--font-text);
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--d-ink);
}

.m-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.m-sec-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  border-bottom: 1px solid var(--d-rule);
  padding-bottom: 6px;
}
.m-sec-num {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--d-sig);
}
.m-sec-title h2 {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--d-ink);
  text-transform: uppercase;
}

.m-card {
  padding: 16px 18px;
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
  border-left: 3px solid var(--d-rule-strong);
  transition: all var(--d-dur) ease;
}
.m-card:hover {
  border-left-color: var(--d-sig);
  background: var(--d-hover);
}
.m-card.highlight {
  border-left-color: var(--d-green);
}
.m-card-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.m-card-role {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--d-sig);
}
.m-card-date {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-faint);
  white-space: nowrap;
}
.m-card-org {
  margin: 0 0 6px;
  font-family: var(--font-text);
  font-size: 15.5px;
  font-weight: 700;
  color: var(--d-ink);
}
.m-edu-sub {
  margin: 0 0 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-sig);
}
.m-card-desc {
  margin: 0;
  font-family: var(--font-text);
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--d-dim);
}
.m-card-bullets {
  list-style: none;
  padding: 0;
  margin: 6px 0 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-family: var(--font-text);
  font-size: 13px;
  color: var(--d-dim);
}
.m-card-bullets li::before {
  content: '▸ ';
  color: var(--d-sig);
  font-weight: bold;
}
.m-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
}
.m-tag-sm {
  padding: 2px 6px;
  background: var(--d-paper);
  border: 1px solid var(--d-rule);
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--d-ink);
}

.m-edu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

/* ─── Responsive & Print Rules ─────────────────────────────────────────────── */
@media (max-width: 860px) {
  .cv-modern {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .cv-harvard {
    padding: 16px 14px;
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
    display: grid !important;
    grid-template-columns: 215px 1fr !important;
    gap: 15px !important;
    background: #ffffff !important;
    color: #111827 !important;
    border: none !important;
    box-shadow: none !important;
  }
  .cv-modern .m-sidebar {
    gap: 8px !important;
  }
  .cv-modern .m-photo-container {
    background: #f8f9fa !important;
    border: 1px solid #e5e7eb !important;
    padding: 8px !important;
  }
  .cv-modern .m-photo {
    width: 96px !important;
    height: 96px !important;
    max-width: 96px !important;
    margin: 0 auto 5px !important;
    border: 1px solid #d1d5db !important;
  }
  .cv-modern .m-status-pill {
    background: #ffffff !important;
    border: 1px solid #16a34a !important;
    color: #16a34a !important;
    font-size: 8.5px !important;
    padding: 2px 8px !important;
  }
  .cv-modern .m-block {
    background: #f8f9fa !important;
    border: 1px solid #e5e7eb !important;
    padding: 8.5px 11px !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .cv-modern .m-heading {
    color: #e03600 !important;
    border-bottom: 1px solid #e5e7eb !important;
    font-size: 10px !important;
    font-weight: 700 !important;
    letter-spacing: 0.05em !important;
    margin-bottom: 5px !important;
    padding-bottom: 2.5px !important;
  }
  .cv-modern .m-contact-list {
    font-size: 9.5px !important;
    gap: 4.5px !important;
    line-height: 1.35 !important;
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
  .cv-modern .m-lang-row {
    display: flex !important;
    justify-content: space-between !important;
    align-items: baseline !important;
    font-size: 9.5px !important;
    margin-bottom: 3px !important;
  }
  .cv-modern .m-lang-name {
    font-weight: 600 !important;
    color: #111827 !important;
  }
  .cv-modern .m-lang-level {
    color: #4b5563 !important;
  }
  .cv-modern .m-chips {
    gap: 3.5px !important;
  }
  .cv-modern .m-chip {
    background: #ffffff !important;
    border: 1px solid #d1d5db !important;
    color: #111827 !important;
    font-size: 8.5px !important;
    padding: 2px 5.5px !important;
  }
  .cv-modern .m-list {
    color: #374151 !important;
    font-size: 9.5px !important;
    line-height: 1.38 !important;
    padding-left: 11px !important;
  }
  .cv-modern .m-content {
    gap: 6px !important;
  }
  .cv-modern .m-header {
    background: #f8f9fa !important;
    border: 1px solid #e5e7eb !important;
    border-left: 3.5px solid #e03600 !important;
    padding: 10px 14px !important;
    margin-bottom: 0 !important;
  }
  .cv-modern .m-tag {
    font-size: 8.5px !important;
    letter-spacing: 0.08em !important;
  }
  .cv-modern .m-name {
    color: #111827 !important;
    font-size: 20px !important;
    margin: 2px 0 3px !important;
  }
  .cv-modern .m-subtitle {
    color: #e03600 !important;
    font-size: 10.5px !important;
    margin: 0 0 4px !important;
  }
  .cv-modern .m-bio {
    color: #374151 !important;
    font-size: 10px !important;
    line-height: 1.38 !important;
    margin: 0 !important;
  }
  .cv-modern .m-sec-title {
    border-bottom: 1px solid #e5e7eb !important;
    padding-bottom: 2.5px !important;
    margin-bottom: 4.5px !important;
  }
  .cv-modern .m-sec-title h2 {
    color: #111827 !important;
    font-size: 10px !important;
    letter-spacing: 0.05em !important;
  }
  .cv-modern .m-sec-num {
    color: #e03600 !important;
    font-size: 9.5px !important;
  }
  .cv-modern .m-card {
    background: #ffffff !important;
    border: 1px solid #e5e7eb !important;
    border-left: 2.5px solid #cbd5e1 !important;
    padding: 7px 11px !important;
    margin-bottom: 4.5px !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .cv-modern .m-card.highlight {
    border-left-color: #16a34a !important;
  }
  .cv-modern .m-card-role {
    color: #e03600 !important;
    font-size: 9px !important;
  }
  .cv-modern .m-card-date {
    color: #6b7280 !important;
    font-size: 8.5px !important;
  }
  .cv-modern .m-card-org {
    color: #111827 !important;
    font-size: 12px !important;
    margin: 0 0 2px !important;
  }
  .cv-modern .m-card-desc {
    color: #374151 !important;
    font-size: 10px !important;
    line-height: 1.38 !important;
  }
  .cv-modern .m-card-bullets {
    list-style: none !important;
    padding: 0 !important;
    margin: 2.5px 0 0 !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 1.5px !important;
    font-size: 8.5px !important;
    line-height: 1.28 !important;
    color: #374151 !important;
  }
  .cv-modern .m-card-bullets li::before {
    content: '▸ ' !important;
    color: #e03600 !important;
    font-weight: bold !important;
  }
  .cv-modern .m-card-tags {
    margin-top: 4px !important;
    gap: 3px !important;
  }
  .cv-modern .m-tag-sm {
    background: #f3f4f6 !important;
    border: 1px solid #e5e7eb !important;
    color: #374151 !important;
    font-size: 8px !important;
    padding: 1px 4px !important;
  }
  .cv-modern .m-section {
    gap: 4px !important;
    margin-bottom: 0 !important;
  }
  .cv-modern .m-edu-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 7px !important;
  }
  .cv-modern .m-edu-grid .m-card {
    margin-bottom: 0 !important;
  }
}
</style>
