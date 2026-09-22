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
    <!-- ESTILO 2: IDE / TERMINAL (MODERNO CODE EDITOR) -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- ESTILO 2: IDE / TERMINAL (MODERNO CODE EDITOR) -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <article v-else class="cv-modern">
      <div class="ide-container">
        <!-- Sidebar -->
        <aside class="ide-sidebar">
          <div class="ide-window-controls">
            <span class="ide-dot red" aria-hidden="true"></span>
            <span class="ide-dot yellow" aria-hidden="true"></span>
            <span class="ide-dot green" aria-hidden="true"></span>
            <span class="ide-file-title">profile.json</span>
          </div>

          <div class="ide-sidebar-inner">
            <div class="ide-sidebar-header">
              <span class="ide-tree-root">~/curriculum</span>
            </div>
            
            <div class="ide-tree">
              <div class="ide-tree-group">
                <div class="ide-tree-folder">
                  <span class="ide-tree-bullet">•</span> src/
                </div>
                <ul class="ide-tree-files">
                  <li><span class="ide-tree-bullet">•</span> profile.go</li>
                  <li><span class="ide-tree-bullet">•</span> experience.go</li>
                  <li><span class="ide-tree-bullet">•</span> stack.go</li>
                  <li><span class="ide-tree-bullet">•</span> education.go</li>
                </ul>
              </div>
              <div class="ide-tree-group">
                <div class="ide-tree-folder">
                  <span class="ide-tree-bullet">•</span> config/
                </div>
                <ul class="ide-tree-files">
                  <li><span class="ide-tree-bullet">•</span> contact.env</li>
                  <li><span class="ide-tree-bullet">•</span> links.toml</li>
                </ul>
              </div>
            </div>

            <div class="ide-divider"></div>

            <div class="ide-photo-wrap">
              <img
                src="/media/profile/mateo-front.png"
                alt="Mateo Gabriel Sonzogni"
                class="ide-photo"
                loading="eager"
              >
            </div>

            <div class="ide-divider"></div>

            <div class="ide-sidebar-section">
              <div class="ide-comment">// stats</div>
              <ul class="ide-key-val">
                <li><span>Languages</span> <span class="ide-highlight">4</span></li>
                <li><span>Experience</span> <span class="ide-highlight">3+ yrs</span></li>
                <li><span>Availability</span> <span class="ide-highlight">Immediate</span></li>
                <li><span>Timezone</span> <span class="ide-highlight">{{ cvTimezone }}</span></li>
              </ul>
            </div>

            <div class="ide-divider"></div>

            <div class="ide-sidebar-section">
              <div class="ide-comment">// contact</div>
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
            <div class="ide-tab active">cv.go</div>
            <div class="ide-tab">README.md</div>
          </div>

          <div class="ide-editor-content">
            <div class="ide-comment">// curriculum vitae — mateo sonzogni, 2026</div>
            <h1 class="ide-name">{{ cvName }}</h1>
            <p class="ide-role">{{ isEs ? 'Arquitecto Backend & Frontend Reactivo' : 'Backend & Reactive Frontend Architect' }}</p>

            <div class="ide-hr"></div>

            <!-- Profile -->
            <div class="ide-section">
              <div class="ide-comment">// profile</div>
              <p class="ide-text">{{ cvBio }}</p>
            </div>

            <div class="ide-hr"></div>

            <!-- Experience -->
            <div class="ide-section">
              <div class="ide-comment">// experience</div>
              
              <div class="ide-exp-item">
                <h3 class="ide-exp-role">{{ isEs ? 'Arquitecto de Software & Lead Frontend' : 'Software Architect & Lead Frontend' }}</h3>
                <div class="ide-exp-meta">
                  <span class="ide-exp-org"><span class="ide-bullet">•</span> Ynara AI Assistant (Tesis)</span>
                  <span class="ide-exp-date">2026</span>
                </div>
                <p class="ide-text">{{ isEs ? 'Asistente de IA on-premise adaptativo con memoria vectorial persistente y tiempos de respuesta sub-100ms. Construido con FastAPI, Next.js y PostgreSQL + pgvector.' : 'Adaptive on-premise AI assistant with persistent vector memory and sub-100ms response times. Built with FastAPI, Next.js, and PostgreSQL + pgvector.' }}</p>
              </div>

              <div class="ide-exp-item">
                <h3 class="ide-exp-role">{{ isEs ? 'Desarrollador Full Stack' : 'Full Stack Developer' }}</h3>
                <div class="ide-exp-meta">
                  <span class="ide-exp-org"><span class="ide-bullet">•</span> La Rúcula Gastrobar & ARG Piscinas</span>
                  <span class="ide-exp-date">2026</span>
                </div>
                <p class="ide-text">{{ isEs ? 'Sitio editorial optimizado con caché offline y plataforma corporativa multi-idioma. 99 Lighthouse Performance. Tech stack: Vue 3, Prisma ORM, Node.js.' : 'Editorial web app with offline cache and multilingual corporate platform. 99 Lighthouse Performance. Tech stack: Vue 3, Prisma ORM, Node.js.' }}</p>
              </div>

              <div class="ide-exp-item">
                <h3 class="ide-exp-role">{{ isEs ? 'Fundador & Consultor de Software' : 'Founder & Software Consultant' }}</h3>
                <div class="ide-exp-meta">
                  <span class="ide-exp-org"><span class="ide-bullet">•</span> Pegasuz & Freelance</span>
                  <span class="ide-exp-date">2023 – {{ isEs ? 'now' : 'now' }}</span>
                </div>
                <p class="ide-text">{{ isEs ? 'Diseño de CMS multi-tenant propio y entrega de ~10 proyectos llave en mano.' : 'Proprietary multi-tenant CMS and successful delivery of ~10 turnkey web projects.' }}</p>
              </div>
            </div>

            <div class="ide-hr"></div>

            <!-- Stack -->
            <div class="ide-section">
              <div class="ide-comment">// stack</div>
              <div class="ide-stack-group">
                <span class="ide-stack-label">frontend</span>
                <span class="ide-stack-val">: "Vue 3 - Nuxt 4 - React - TS"</span>
              </div>
              <div class="ide-stack-group">
                <span class="ide-stack-label">backend </span>
                <span class="ide-stack-val">: "Node.js - Python - PostgreSQL"</span>
              </div>
              <div class="ide-stack-group">
                <span class="ide-stack-label">infra   </span>
                <span class="ide-stack-val">: "Docker - Coolify VPS - Linux"</span>
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
  max-width: 920px;
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
  width: 250px;
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
  color: var(--d-amber);
  font-size: 11px;
}

.ide-sidebar-inner {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ide-sidebar-header {
  color: var(--d-amber);
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
  color: var(--d-amber);
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
  color: var(--d-amber);
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
  color: var(--d-amber);
  border-top: 2px solid var(--d-amber);
  margin-top: -1px;
}

.ide-editor-content {
  padding: 24px 32px;
  flex: 1;
}

.ide-name {
  margin: 12px 0 4px;
  font-size: 28px;
  font-weight: 700;
  color: var(--d-ink);
  font-family: var(--font-mono);
  letter-spacing: -0.02em;
}

.ide-name::after {
  content: ' _';
  color: var(--d-amber);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.ide-role {
  margin: 0;
  color: var(--d-amber);
  font-size: 12.5px;
}

.ide-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ide-text {
  margin: 0;
  color: var(--d-dim);
  font-size: 12.5px;
  line-height: 1.6;
}

.ide-exp-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ide-exp-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
}

.ide-exp-role {
  margin: 0;
  color: var(--d-amber);
  font-size: 13px;
  font-weight: normal;
}

.ide-exp-meta {
  display: flex;
  justify-content: space-between;
  color: var(--d-dim);
  font-size: 11.5px;
  margin-bottom: 2px;
}

.ide-bullet {
  color: var(--d-rule-strong);
}

.ide-stack-group {
  display: flex;
  gap: 12px;
  color: var(--d-dim);
}

.ide-stack-label {
  color: var(--d-amber);
  width: 65px;
}
.ide-stack-val {
  color: var(--d-dim);
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
    background: #ffffff !important;
    color: #111827 !important;
    border: none !important;
    box-shadow: none !important;
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .cv-modern .ide-container {
    background: #ffffff !important;
    border: none !important;
    color: #111827 !important;
    font-size: 8pt !important;
    display: flex !important;
    flex-direction: row !important;
    height: 100% !important;
  }
  .cv-modern .ide-sidebar {
    background: #f8f9fa !important;
    border-right: 0.5pt solid #d1d5db !important;
    width: 210px !important;
    flex-shrink: 0 !important;
  }
  .cv-modern .ide-window-controls {
    background: #f3f4f6 !important;
    border-bottom: 0.5pt solid #d1d5db !important;
    padding: 8pt 10pt !important;
  }
  .cv-modern .ide-file-title {
    color: #111827 !important;
    font-weight: 700 !important;
  }
  .cv-modern .ide-sidebar-inner {
    padding: 10pt !important;
    gap: 12pt !important;
  }
  .cv-modern .ide-sidebar-header {
    color: #111827 !important;
    font-weight: 700 !important;
  }
  .cv-modern .ide-tree-folder {
    color: #111827 !important;
    font-weight: 700 !important;
  }
  .cv-modern .ide-tree-files,
  .cv-modern .ide-tree-bullet {
    color: #4b5563 !important;
  }
  .cv-modern .ide-divider {
    background: #e5e7eb !important;
  }
  .cv-modern .ide-photo-wrap {
    width: 135px !important;
    margin: 0 auto !important;
  }
  .cv-modern .ide-photo {
    width: 135px !important;
    height: 135px !important;
    object-fit: cover !important;
    border: 0.5pt solid #d1d5db !important;
  }
  .cv-modern .ide-comment {
    color: #6b7280 !important;
    margin-bottom: 2pt !important;
  }
  .cv-modern .ide-key-val {
    color: #4b5563 !important;
    gap: 4pt !important;
  }
  .cv-modern .ide-highlight {
    color: #111827 !important;
    font-weight: 700 !important;
  }
  .cv-modern .ide-contact-list {
    gap: 4pt !important;
  }
  .cv-modern .ide-contact-list a,
  .cv-modern .ide-loc {
    color: #4b5563 !important;
  }
  .cv-modern .ide-main {
    background: #ffffff !important;
    flex: 1 !important;
    padding: 0 !important;
  }
  .cv-modern .ide-tabs {
    background: #f8f9fa !important;
    border-bottom: 0.5pt solid #d1d5db !important;
  }
  .cv-modern .ide-tab {
    color: #6b7280 !important;
    border-right: 0.5pt solid #d1d5db !important;
    padding: 8pt 12pt !important;
  }
  .cv-modern .ide-tab.active {
    background: #ffffff !important;
    color: #111827 !important;
    border-top: 1.5pt solid #111827 !important;
    font-weight: 700 !important;
  }
  .cv-modern .ide-editor-content {
    padding: 16pt 24pt !important;
  }
  .cv-modern .ide-name {
    color: #111827 !important;
    font-size: 21pt !important;
    margin: 6pt 0 2pt !important;
  }
  .cv-modern .ide-role {
    color: #111827 !important;
    font-size: 9.5pt !important;
    font-weight: 700 !important;
  }
  .cv-modern .ide-hr {
    background: #e5e7eb !important;
    margin: 12pt 0 !important;
  }
  .cv-modern .ide-section {
    gap: 4pt !important;
  }
  .cv-modern .ide-text {
    color: #374151 !important;
    font-size: 9.5pt !important;
    line-height: 1.45 !important;
  }
  .cv-modern .ide-exp-list {
    gap: 12pt !important;
  }
  .cv-modern .ide-exp-item {
    gap: 2pt !important;
    margin-bottom: 6pt !important;
  }
  .cv-modern .ide-exp-role {
    color: #111827 !important;
    font-weight: 700 !important;
    font-size: 10pt !important;
    margin: 0 !important;
  }
  .cv-modern .ide-exp-meta {
    color: #4b5563 !important;
    font-size: 8.5pt !important;
  }
  .cv-modern .ide-stack-group {
    gap: 8pt !important;
  }
  .cv-modern .ide-stack-label {
    color: #111827 !important;
    font-weight: 700 !important;
    width: 65px !important;
  }
  .cv-modern .ide-stack-val {
    color: #374151 !important;
  }
}
</style>
