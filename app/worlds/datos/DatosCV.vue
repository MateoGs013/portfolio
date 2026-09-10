<script setup lang="ts">
// Componente de Currículum Vitae Dual — Mateo Gabriel Sonzogni
// Soporta conmutación reactiva entre:
// 1. Modo Harvard ATS (académico, blanco y negro, sin foto, máxima legibilidad para reclutadores y sistemas ATS)
// 2. Modo Moderno (diseño tecnológico contemporáneo con fotografía de perfil, dos columnas y chips técnicos)
// Incluye botón de exportación/impresión a PDF con estilos @media print.

const mode = ref<'harvard' | 'modern'>('modern')

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
      <div class="cv-selector" role="group" aria-label="Estilo de Currículum Vitae">
        <button
          type="button"
          class="cv-btn"
          :class="{ active: mode === 'modern' }"
          title="Ver CV moderno en dos columnas con fotografía técnica"
          @click="mode = 'modern'"
        >
          <span class="cv-btn-icon">👤</span>
          <span>MODERNO + FOTO</span>
        </button>
        <button
          type="button"
          class="cv-btn"
          :class="{ active: mode === 'harvard' }"
          title="Ver CV formato clásico Harvard ATS en blanco y negro"
          @click="mode = 'harvard'"
        >
          <span class="cv-btn-icon">🏛️</span>
          <span>HARVARD ATS</span>
        </button>
      </div>

      <div class="cv-actions">
        <button
          type="button"
          class="cv-print-btn"
          title="Imprimir o guardar como PDF (Ctrl+P)"
          @click="printCV"
        >
          <span>🖨️ IMPRIMIR / PDF</span>
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
        <p class="h-role">Desarrollador Frontend &amp; Full Stack · Creative Developer</p>
        <div class="h-contact">
          <span>Río Negro, Argentina</span>
          <span class="h-sep">|</span>
          <a href="mailto:mateogabus@gmail.com">mateogabus@gmail.com</a>
          <span class="h-sep">|</span>
          <a href="https://github.com/MateoGs013" target="_blank" rel="noopener noreferrer">github.com/MateoGs013</a>
          <span class="h-sep">|</span>
          <span>Disponibilidad Inmediata · Remoto / Híbrido</span>
        </div>
      </header>

      <!-- Resumen Profesional -->
      <section class="h-section">
        <h2 class="h-title">PROFESSIONAL SUMMARY</h2>
        <p class="h-summary">
          Desarrollador de software especializado en frontend reactivo, arquitectura de APIs y experiencia de usuario. Tesis de grado preaprobada en Escuela Da Vinci con 382 commits liderando la arquitectura de un asistente de inteligencia artificial on-premise. Experiencia comprobable en producción con más de 10 proyectos entregados para clientes en España y Argentina (La Rúcula Gastrobar, ARG Piscinas). Dominio de TypeScript, Vue 3, Nuxt 4, React, Next.js, Node.js, FastAPI y PostgreSQL. Criterio de diseño orientado a producto de punta a punta.
        </p>
      </section>

      <!-- Educación -->
      <section class="h-section">
        <h2 class="h-title">EDUCATION</h2>

        <div class="h-entry">
          <div class="h-entry-header">
            <span class="h-org">ESCUELA DA VINCI</span>
            <span class="h-date">2024 – 2026 (En curso)</span>
          </div>
          <div class="h-entry-sub">
            <span class="h-degree">Tecnicatura Superior en Diseño y Desarrollo Web</span>
            <span class="h-loc">Buenos Aires, Argentina</span>
          </div>
          <ul class="h-bullets">
            <li>Tesis de graduación preaprobada: <em>Ynara</em> (Asistente de IA adaptativo on-premise con memoria vectorial).</li>
            <li>Formación intensiva en arquitecturas web modernas, patrones de concurrencia, bases de datos relacionales y diseño UI/UX.</li>
          </ul>
        </div>

        <div class="h-entry">
          <div class="h-entry-header">
            <span class="h-org">CENTRO DE EDUCACIÓN TÉCNICA N.º 30 (CET 30)</span>
            <span class="h-date">2017 – 2023</span>
          </div>
          <div class="h-entry-sub">
            <span class="h-degree">Técnico en Programación</span>
            <span class="h-loc">Cipolletti, Río Negro, Argentina</span>
          </div>
          <ul class="h-bullets">
            <li>Formación técnica de 7 años en lógica algorítmica, estructuras de datos, redes, sistemas operativos y desarrollo de software.</li>
          </ul>
        </div>
      </section>

      <!-- Experiencia Profesional -->
      <section class="h-section">
        <h2 class="h-title">PROFESSIONAL EXPERIENCE</h2>

        <div class="h-entry">
          <div class="h-entry-header">
            <span class="h-org">YNARA AI ASSISTANT (TESIS DA VINCI)</span>
            <span class="h-date">05/2026 – 07/2026</span>
          </div>
          <div class="h-entry-sub">
            <span class="h-degree">Arquitecto de Software &amp; Lead Frontend</span>
            <span class="h-loc">Buenos Aires, Argentina</span>
          </div>
          <ul class="h-bullets">
            <li>Lideré la arquitectura técnica y el frontend con 382 commits a lo largo de 6 semanas de desarrollo intensivo.</li>
            <li>Diseñé pipelines de inferencia y memoria vectorial persistente con PostgreSQL, pgvector y FastAPI.</li>
            <li>Construí la aplicación web con Next.js y TypeScript, logrando tiempos de respuesta inferiores a 100ms en local.</li>
          </ul>
        </div>

        <div class="h-entry">
          <div class="h-entry-header">
            <span class="h-org">LA RÚCULA GASTROBAR</span>
            <span class="h-date">03/2026 – 07/2026</span>
          </div>
          <div class="h-entry-sub">
            <span class="h-degree">Desarrollador Full Stack &amp; Diseñador UI</span>
            <span class="h-loc">Chiclana de la Frontera, España</span>
          </div>
          <ul class="h-bullets">
            <li>Diseñé y programé un sitio editorial menu-first optimizado para escaneo QR de clientes en mesa.</li>
            <li>Integré arquitectura con fallback offline en cache para garantizar servicio continuo ante caídas de conectividad.</li>
            <li>Puntuación Lighthouse de 99 en Performance y 100 en SEO y Accesibilidad con bundle final de apenas 42 KB.</li>
          </ul>
        </div>

        <div class="h-entry">
          <div class="h-entry-header">
            <span class="h-org">ARG PISCINAS</span>
            <span class="h-date">01/2026 – 07/2026</span>
          </div>
          <div class="h-entry-sub">
            <span class="h-degree">Desarrollador Full Stack</span>
            <span class="h-loc">Andalucía, España</span>
          </div>
          <ul class="h-bullets">
            <li>Desarrollé una plataforma corporativa multi-idioma (Español, Inglés y Alemán) con panel de control a medida.</li>
            <li>Modelé esquemas relacionales y tipado estricto de punta a punta con Prisma ORM y Node.js.</li>
          </ul>
        </div>

        <div class="h-entry">
          <div class="h-entry-header">
            <span class="h-org">PEGASUZ &amp; FREELANCE</span>
            <span class="h-date">2023 – Presente</span>
          </div>
          <div class="h-entry-sub">
            <span class="h-degree">Fundador &amp; Consultor de Software</span>
            <span class="h-loc">Remoto</span>
          </div>
          <ul class="h-bullets">
            <li>Diseño e implementación de CMS multi-tenant propio con APIs REST desacopladas.</li>
            <li>Entrega exitosa de aproximadamente 10 proyectos web llave en mano para clientes de diversos rubros.</li>
          </ul>
        </div>
      </section>

      <!-- Habilidades Técnicas -->
      <section class="h-section">
        <h2 class="h-title">TECHNICAL SKILLS</h2>
        <div class="h-skills">
          <p><strong>Lenguajes:</strong> TypeScript, JavaScript (ESNext), Python, PHP, SQL, HTML5, CSS3.</p>
          <p><strong>Frontend &amp; Frameworks:</strong> Vue 3, Nuxt 4, React, Next.js, Tailwind CSS, GSAP, Lenis, Three.js.</p>
          <p><strong>Backend &amp; APIs:</strong> Node.js, Express, FastAPI, Laravel, RESTful APIs, Middleware Pipelines.</p>
          <p><strong>Bases de Datos &amp; Cloud:</strong> PostgreSQL (pgvector), Prisma ORM, MongoDB, Firebase, Supabase, Docker.</p>
          <p><strong>Herramientas &amp; Metodologías:</strong> Git/GitHub, Vite, Figma UI/UX, Vitest, Playwright, CI/CD, Accesibilidad WCAG.</p>
          <p><strong>Idiomas:</strong> Español (Nativo), Inglés (B2 Profesional / Técnico).</p>
        </div>
      </section>
    </article>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- ESTILO 2: MODERNO CON FOTO (TECH & CREATIVE PROFILE)                  -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <article v-else class="cv-modern">
      <!-- Columna Lateral (Sidebar del CV) -->
      <aside class="m-sidebar">
        <!-- Foto de Perfil de Mateo -->
        <div class="m-photo-container">
          <img
            src="/media/profile/mateo-front.png"
            alt="Mateo Gabriel Sonzogni"
            class="m-photo"
            loading="eager"
          >
          <div class="m-status-pill">
            <span class="m-status-dot" />
            <span>DISPONIBLE // 2026</span>
          </div>
        </div>

        <!-- Contacto Directo -->
        <div class="m-block">
          <h3 class="m-heading">CONTACTO</h3>
          <ul class="m-contact-list">
            <li>
              <span class="m-icon">✉</span>
              <a href="mailto:mateogabus@gmail.com">mateogabus@gmail.com</a>
            </li>
            <li>
              <span class="m-icon">‹/›</span>
              <a href="https://github.com/MateoGs013" target="_blank" rel="noopener noreferrer">github.com/MateoGs013</a>
            </li>
            <li>
              <span class="m-icon">📍</span>
              <span>Río Negro, Patagonia Argentina</span>
            </li>
            <li>
              <span class="m-icon">🕒</span>
              <span>UTC-3 (Disponible Remoto / Híbrido)</span>
            </li>
          </ul>
        </div>

        <!-- Idiomas -->
        <div class="m-block">
          <h3 class="m-heading">IDIOMAS</h3>
          <div class="m-lang-row">
            <span class="m-lang-name">Español</span>
            <span class="m-lang-level">Nativo</span>
          </div>
          <div class="m-lang-row">
            <span class="m-lang-name">Inglés</span>
            <span class="m-lang-level">B2 Profesional Técnico</span>
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
          <h3 class="m-heading">COMPETENCIAS</h3>
          <ul class="m-list">
            <li>Full-Cycle Engineering</li>
            <li>Arquitectura de Datos Relacional</li>
            <li>Diseño UI/UX de Alta Fidelidad</li>
            <li>Optimización de Rendimiento &amp; SEO</li>
            <li>Desarrollo de APIs REST Tipadas</li>
          </ul>
        </div>
      </aside>

      <!-- Columna Principal -->
      <main class="m-content">
        <!-- Encabezado Principal -->
        <header class="m-header">
          <span class="m-tag">PROFILE DOSSIER // CURRICULUM VITAE</span>
          <h1 class="m-name">Mateo Gabriel Sonzogni</h1>
          <p class="m-subtitle">Desarrollador Frontend &amp; Full Stack · Creative Developer</p>
          <p class="m-bio">
            Desarrollo con criterio de diseño y foco en el producto entero: qué problema resuelve, cómo debería verse, cómo debería sentirse, cómo se construye y cómo llega a producción. No me posiciono solo como programador ni solo como diseñador; trabajo en la costura donde la arquitectura técnica se encuentra con la experiencia de usuario.
          </p>
        </header>

        <!-- Trayectoria Profesional -->
        <section class="m-section">
          <div class="m-sec-title">
            <span class="m-sec-num">01</span>
            <h2>EXPERIENCIA PROFESIONAL &amp; PROYECTOS</h2>
          </div>

          <div class="m-card">
            <div class="m-card-top">
              <span class="m-card-role">Tesis en equipo · Contribuidor Principal (382 commits)</span>
              <span class="m-card-date">2026</span>
            </div>
            <h3 class="m-card-org">Ynara — Asistente de IA Adaptativo con Memoria Vectorial</h3>
            <p class="m-card-desc">
              Tesis preaprobada en Escuela Da Vinci. Asistente on-premise con inferencia local, embeddings y base de conocimiento relacional sobre PostgreSQL + pgvector. Lideré el desarrollo del frontend en Next.js y el pipeline de backend en FastAPI.
            </p>
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
              <span class="m-card-role">Freelance · Diseño y Desarrollo Web</span>
              <span class="m-card-date">2026</span>
            </div>
            <h3 class="m-card-org">La Rúcula Gastrobar (Cádiz, España)</h3>
            <p class="m-card-desc">
              Web menu-first para comensales en mesa por código QR. Integrada con el CMS Pegasuz propio y fallback local. Puntuación Lighthouse 99 en Performance y 100 en SEO. En producción.
            </p>
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
              <span class="m-card-role">Freelance · Frontend y Backend a Medida</span>
              <span class="m-card-date">2026</span>
            </div>
            <h3 class="m-card-org">ARG Piscinas (Andalucía, España)</h3>
            <p class="m-card-desc">
              Sitio corporativo multi-idioma con panel de administración propio para edición autónoma de proyectos y blog. Tipado de extremo a extremo con Prisma y Node.js.
            </p>
            <div class="m-card-tags">
              <span class="m-tag-sm">Vue 3</span>
              <span class="m-tag-sm">Node.js</span>
              <span class="m-tag-sm">Prisma</span>
              <span class="m-tag-sm">Tailwind</span>
            </div>
          </div>

          <div class="m-card">
            <div class="m-card-top">
              <span class="m-card-role">Fundador &amp; Desarrollador</span>
              <span class="m-card-date">2024 – Act.</span>
            </div>
            <h3 class="m-card-org">Pegasuz — CMS Multi-tenant Propio</h3>
            <p class="m-card-desc">
              Infraestructura de contenidos API-first que alimenta los sitios de clientes en producción con contratos de datos blindados.
            </p>
          </div>
        </section>

        <!-- Formación Académica -->
        <section class="m-section">
          <div class="m-sec-title">
            <span class="m-sec-num">02</span>
            <h2>FORMACIÓN ACADÉMICA</h2>
          </div>

          <div class="m-edu-grid">
            <div class="m-card">
              <span class="m-card-date">2024 – 2026 (Promoción 2026)</span>
              <h3 class="m-card-org">Diseño y Desarrollo Web</h3>
              <p class="m-edu-sub">Escuela Da Vinci · Buenos Aires</p>
              <p class="m-card-desc">
                UI/UX, tipografía, dirección de arte digital, patrones de frontend reactivo, arquitecturas cliente-servidor y bases de datos. Tesis preaprobada: Ynara.
              </p>
            </div>

            <div class="m-card">
              <span class="m-card-date">2017 – 2023 (Graduado)</span>
              <h3 class="m-card-org">Técnico en Programación</h3>
              <p class="m-edu-sub">CET N.º 30 · Río Negro</p>
              <p class="m-card-desc">
                Formación técnica de 7 años en algoritmos, estructuras de datos, lógica de bajo nivel, redes y metodologías de ingeniería.
              </p>
            </div>
          </div>
        </section>

        <!-- Meta Profesional -->
        <section class="m-section">
          <div class="m-sec-title">
            <span class="m-sec-num">03</span>
            <h2>OBJETIVO PROFESIONAL</h2>
          </div>
          <div class="m-card highlight">
            <p class="m-card-desc">
              Consolidarme como desarrollador en un equipo con proyectos reales de mayor escala. A mediano plazo, liderazgo técnico: coordinar, organizar, comunicar y conectar perfiles de distintas áreas (diseño, producto, frontend y backend).
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
.cv-btn-icon {
  font-size: 12px;
}
.cv-print-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--d-paper);
  border: 1px solid var(--d-rule-strong);
  color: var(--d-ink);
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--d-dur) ease;
}
.cv-print-btn:hover {
  border-color: var(--d-sig);
  color: var(--d-sig);
  background: var(--d-hover);
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
  align-items: baseline;
  gap: 8px;
  color: var(--d-dim);
  overflow-wrap: anywhere;
}
.m-icon {
  color: var(--d-sig);
  flex-shrink: 0;
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
  }
}

@media print {
  .no-print, .barra, .sidebar, .estado, .historia, .theme-btn, .telemetria-badge {
    display: none !important;
  }
  body, html, .datos, .ventana, .cuerpo-ventana, .exp {
    background: #ffffff !important;
    color: #000000 !important;
    padding: 0 !important;
    margin: 0 !important;
    height: auto !important;
    overflow: visible !important;
    border: none !important;
    box-shadow: none !important;
  }
  .cv-wrapper {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .cv-harvard {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    max-width: 100% !important;
  }
  .cv-modern {
    background: #ffffff !important;
    color: #000000 !important;
  }
}
</style>
