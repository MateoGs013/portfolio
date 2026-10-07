<script setup lang="ts">
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
}>()
</script>

<template>
  <article class="cv-harvard">
    <!-- Encabezado Harvard -->
    <header class="h-header">
      <h1 class="h-name">{{ name }}</h1>
      <p class="h-role">{{ role }}</p>
      <div class="h-contact">
        <span>{{ location }}</span>
        <span class="h-sep">|</span>
        <a :href="`mailto:${email}`">{{ email }}</a>
        <span class="h-sep">|</span>
        <a :href="github" target="_blank" rel="noopener noreferrer">{{ githubText }}</a>
        <span class="h-sep">|</span>
        <a :href="linkedin" target="_blank" rel="noopener noreferrer">{{ linkedinText }}</a>
        <span class="h-sep">|</span>
        <span>{{ isEs ? 'Disponibilidad Inmediata · Remoto / Híbrido' : 'Immediate Availability · Remote / Hybrid' }}</span>
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
}
</style>
