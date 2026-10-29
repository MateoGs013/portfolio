<script setup lang="ts">
import type { CvDeliverable } from './types'

defineProps<{
  name: string
  role: string
  location: string
  bio: string
  email: string
  github: string
  githubText: string
  linkedin: string
  linkedinText: string
  isEs: boolean
  deliverables?: CvDeliverable[]
}>()
</script>

<template>
  <article class="cv-harvard" :class="{ 'is-es': isEs }">
    <!-- Encabezado Harvard -->
    <header class="h-header">
      <h1 class="h-name">{{ name }}</h1>
      <p class="h-role">{{ role }}</p>
      <div class="h-contact">
        <div class="h-contact-row">
          <span>{{ location }}</span>
          <span class="h-sep">•</span>
          <a :href="`mailto:${email}`">{{ email }}</a>
          <span class="h-sep">•</span>
          <a :href="github" target="_blank" rel="noopener noreferrer">{{ githubText }}</a>
          <span class="h-sep">•</span>
          <a :href="linkedin" target="_blank" rel="noopener noreferrer">{{ linkedinText }}</a>
        </div>
        <div class="h-contact-sub">
          <span>{{ isEs ? 'Remoto / Híbrido · Disponibilidad Inmediata' : 'Remote / Hybrid · Immediate Availability' }}</span>
        </div>
      </div>
    </header>

    <!-- Resumen Profesional -->
    <section class="h-section">
      <h2 class="h-title">{{ isEs ? 'RESUMEN PROFESIONAL' : 'PROFESSIONAL SUMMARY' }}</h2>
      <p class="h-summary">
        {{ bio }}
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

      <template v-if="deliverables && deliverables.length">
        <div v-for="d in deliverables" :key="d.slug" class="h-entry">
          <div class="h-entry-header">
            <span class="h-org">
              {{ d.title.toUpperCase() }}
              <span v-if="d.badge && (d.badge.toLowerCase().includes('tesis') || d.badge.toLowerCase().includes('thesis'))" class="h-badge font-normal"> ({{ d.badge }})</span>
            </span>
            <span class="h-date">{{ d.date }}</span>
          </div>
          <div class="h-entry-sub">
            <span class="h-degree">{{ d.role }}</span>
            <span class="h-loc">{{ d.location }}</span>
          </div>
          <ul class="h-bullets">
            <li v-for="(b, bIdx) in d.bullets" :key="bIdx">{{ b }}</li>
          </ul>
        </div>
      </template>

      <template v-else>
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
            <li v-if="isEs">Lideré la arquitectura técnica y el frontend reactivo con 382 commits a lo largo de 6 semanas de desarrollo intensivo.</li>
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
            <span class="h-loc">Cádiz, {{ isEs ? 'España' : 'Spain' }}</span>
          </div>
          <ul class="h-bullets">
            <li v-if="isEs">Diseñé y programé un sitio editorial menu-first optimizado para escaneo QR de clientes en mesa.</li>
            <li v-else>Designed and engineered an editorial menu-first web app optimized for table-side QR scanning.</li>
            <li v-if="isEs">Integré arquitectura con fallback offline en caché para garantizar servicio continuo ante caídas de conectividad.</li>
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
            <li v-if="isEs">Modelé esquemas relacionales y tipado estricto de extremo a extremo con Prisma ORM, Node.js y TypeScript.</li>
            <li v-else>Modeled relational schemas and end-to-end type safety using Prisma ORM, Node.js, and TypeScript.</li>
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
            <li v-if="isEs">Entrega exitosa de aproximadamente 10 proyectos web llave en mano combinando diseño en Figma y despliegue a producción.</li>
            <li v-else>Successful delivery of ~10 turnkey web solutions combining Figma UI design and production deployments.</li>
          </ul>
        </div>
      </template>
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
</template>

<style scoped>
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
  flex-direction: column;
  align-items: center;
  gap: 3px;
  font-size: 12.5px;
}
.h-contact-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
.h-contact-sub {
  font-size: 11.5px;
  color: #333333;
  font-style: italic;
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

@media screen and (max-width: 820px) {
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
}

@media print {
  /* 1. Declaración estricta de página A4 con márgenes CSS únicos y balanceados */
  @page {
    size: A4 portrait;
    margin: 10mm 12mm 10mm 12mm;
  }

  /* 2. Reseteo del canvas del navegador (100% blanco puro anti-márgenes negros) */
  html, body {
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    background-color: #ffffff !important;
    color: #000000 !important;
    color-scheme: light !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* 3. Contenedor principal sin clipping artificial con compensación vertical simétrica */
  .cv-harvard {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding-top: 3.5mm !important;
    padding-bottom: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: #ffffff !important;
    color: #000000 !important;
    font-family: 'Times New Roman', Times, 'Liberation Serif', Georgia, serif !important;
    page-break-after: avoid !important;
    break-after: avoid !important;
  }

  .cv-harvard * {
    color: #000000 !important;
    box-sizing: border-box !important;
  }

  /* 4. Encabezado de Identidad */
  .cv-harvard .h-header {
    text-align: center !important;
    border-bottom: 1.2pt solid #000000 !important;
    padding-bottom: 4pt !important;
    margin-bottom: 7pt !important;
  }
  .cv-harvard .h-name {
    font-size: 19.5pt !important;
    font-weight: 700 !important;
    letter-spacing: 0.03em !important;
    line-height: 22.5pt !important;
    margin: 0 0 1.8pt !important;
    text-transform: uppercase !important;
  }
  .cv-harvard .h-role {
    font-size: 10.2pt !important;
    font-style: italic !important;
    line-height: 12.8pt !important;
    margin: 0 0 1.8pt !important;
  }
  .cv-harvard .h-contact {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 1.5pt !important;
    font-size: 9pt !important;
    line-height: 12pt !important;
  }
  .cv-harvard .h-contact-row {
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 5pt !important;
  }
  .cv-harvard .h-contact-sub {
    font-size: 8.6pt !important;
    line-height: 11.2pt !important;
    font-style: italic !important;
    color: #222222 !important;
  }
  .cv-harvard .h-sep {
    color: #000000 !important;
    padding: 0 1.5pt !important;
  }

  /* 5. Secciones Semánticas */
  .cv-harvard .h-section {
    margin-top: 0 !important;
    margin-bottom: 7pt !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .cv-harvard.is-es .h-section {
    margin-bottom: 7.8pt !important;
  }
  .cv-harvard .h-title {
    font-size: 11pt !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    border-bottom: 0.85pt solid #000000 !important;
    padding-bottom: 1.5pt !important;
    margin-top: 5pt !important;
    margin-bottom: 3.2pt !important;
    line-height: 13.2pt !important;
  }
  .cv-harvard .h-summary {
    font-size: 9.3pt !important;
    line-height: 12.6pt !important;
    margin: 0 !important;
    text-align: justify !important;
  }

  /* 6. Entradas (Educación y Proyectos) */
  .cv-harvard .h-entry {
    margin-top: 0 !important;
    margin-bottom: 4.8pt !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .cv-harvard.is-es .h-entry {
    margin-bottom: 5.2pt !important;
  }
  .cv-harvard .h-entry-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: baseline !important;
    font-size: 10pt !important;
    line-height: 12.6pt !important;
    margin: 0 !important;
  }
  .cv-harvard .h-org {
    font-weight: 700 !important;
    text-transform: uppercase !important;
  }
  .cv-harvard .h-date {
    font-weight: 400 !important;
    font-size: 9.3pt !important;
    white-space: nowrap !important;
  }
  .cv-harvard .h-entry-sub {
    display: flex !important;
    justify-content: space-between !important;
    align-items: baseline !important;
    font-size: 9.3pt !important;
    font-style: italic !important;
    line-height: 12pt !important;
    margin-top: 0 !important;
    margin-bottom: 1.5pt !important;
  }
  .cv-harvard .h-degree {
    font-weight: 400 !important;
  }
  .cv-harvard .h-loc {
    font-style: normal !important;
    font-size: 9pt !important;
    white-space: nowrap !important;
  }

  /* 7. Viñetas */
  .cv-harvard .h-bullets {
    font-size: 9.2pt !important;
    line-height: 12.3pt !important;
    margin-top: 1pt !important;
    margin-bottom: 0 !important;
    padding-left: 12pt !important;
    list-style-type: disc !important;
  }
  .cv-harvard .h-bullets li {
    margin-top: 0 !important;
    margin-bottom: 1.8pt !important;
    text-align: justify !important;
  }
  .cv-harvard.is-es .h-bullets li {
    margin-bottom: 2pt !important;
  }

  /* 8. Habilidades Técnicas */
  .cv-harvard .h-skills p {
    font-size: 9.1pt !important;
    line-height: 12.3pt !important;
    margin-top: 0 !important;
    margin-bottom: 2.4pt !important;
  }
  .cv-harvard .h-skills strong {
    font-size: 9.3pt !important;
    font-weight: 700 !important;
  }
}
</style>
