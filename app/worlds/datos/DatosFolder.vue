<script setup lang="ts">
// Una carpeta abierta: la base con sus tablas, o una colección con sus registros.
// Ofrece selector de vista (Baldosas en cuadrícula ☷ vs. Tabla técnica ☰),
// facets de filtrado activo y acceso directo por teclado.
import DatosCabecera from './DatosCabecera.vue'
import DatosIcono from './DatosIcono.vue'
import { pad, type Folder } from './explorer'

defineProps<{ folder: Folder }>()
const uid = useId()

const viewMode = ref<'grid' | 'table'>('grid')
</script>

<template>
  <section class="carpeta" :aria-labelledby="uid">
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 1. INICIO: DASHBOARD EJECUTIVO & SHOWCASE EN VIVO (folder.head === 'db') -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div v-if="folder.head === 'db'" class="inicio-dashboard">
      <!-- Tarjeta Hero de Identidad & Disponibilidad -->
      <article class="hero-id-card">
        <div class="hero-id-avatar-wrap">
          <img src="/media/profile/mateo-front.png" alt="Mateo Gabriel Sonzogni" class="hero-id-photo">
          <span class="hero-id-status-badge">● DISPONIBLE</span>
        </div>

        <div class="hero-id-info">
          <div class="hero-id-topbar">
            <span class="hero-id-tag">SYSTEM // VERIFIED PROFILE</span>
            <span class="hero-id-loc">RÍO NEGRO, AR · UTC-3</span>
          </div>

          <h1 class="hero-id-name" data-anchor>Mateo Gabriel Sonzogni</h1>
          <p class="hero-id-role">Desarrollador Frontend &amp; Full Stack · Creative Developer</p>
          <p class="hero-id-desc">
            Ingeniería de software orientada a producto de punta a punta: modelado relacional en PostgreSQL 17, arquitecturas de APIs tipadas (TypeScript / Python), e interfaces reactivas y fluidas con Vue 3, Nuxt 4, React y animaciones espaciales.
          </p>

          <!-- Acciones Principales Directas -->
          <div class="hero-id-actions">
            <NuxtLink to="/about" class="dossier-btn primary" title="Abrir currículum completo en formato Harvard ATS o Moderno con foto">
              <span>📄 ABRIR CV COMPLETO (HARVARD / MODERNO)</span>
              <span class="dossier-btn-arrow" aria-hidden="true">›</span>
            </NuxtLink>
            <NuxtLink to="/projects" class="dossier-btn secondary" title="Explorar todas las aplicaciones en producción">
              <span>📁 VER TODOS LOS PROYECTOS (06)</span>
              <span class="dossier-btn-arrow" aria-hidden="true">›</span>
            </NuxtLink>
            <NuxtLink to="/contact" class="dossier-btn tertiary" title="Canales de contacto directo">
              <span>✉ CONTACTAR</span>
              <span class="dossier-btn-arrow" aria-hidden="true">›</span>
            </NuxtLink>
          </div>
        </div>
      </article>

      <!-- Showcase de Producción Destacada (3 Proyectos Reales) -->
      <section class="showcase-section">
        <div class="showcase-header">
          <div class="sh-left">
            <span class="sh-num">01</span>
            <h2 class="sh-title">PRODUCCIÓN DESTACADA // SELECCIÓN TÉCNICA</h2>
          </div>
          <NuxtLink to="/projects" class="sh-all-link">
            <span>VER TODOS LOS PROYECTOS (06)</span>
            <span aria-hidden="true">›</span>
          </NuxtLink>
        </div>

        <div class="showcase-grid">
          <!-- 1. La Rúcula -->
          <NuxtLink to="/projects/la-rucula" class="project-card" data-row="la-rucula">
            <div class="project-thumb-wrap">
              <img src="/media/projects/la-rucula.jpg" alt="La Rúcula Gastrobar" class="project-thumb" loading="lazy">
              <div class="project-status-bar">
                <span class="project-status-badge">● LIVE</span>
                <span class="project-year-badge">2026</span>
              </div>
            </div>
            <div class="project-info">
              <div class="project-title-row">
                <span class="p-num">01</span>
                <h3 class="p-name">La Rúcula Gastrobar</h3>
              </div>
              <p class="p-org">La Rúcula Gastrobar (Chiclana de la Frontera, ES)</p>
              <p class="p-summary">
                Sitio editorial menu-first optimizado para comensales en mesa mediante QR. Lighthouse 99 en Performance y 100 en SEO. En producción.
              </p>
              <div class="p-techs">
                <span class="p-tech-chip">Vue 3</span>
                <span class="p-tech-chip">Vite</span>
                <span class="p-tech-chip">Tailwind CSS</span>
                <span class="p-tech-chip">GSAP</span>
                <span class="p-tech-chip">Lenis</span>
              </div>
              <div class="project-cta">
                <span>ABRIR ARCHIVO TÉCNICO</span>
                <span class="cta-arrow" aria-hidden="true">›</span>
              </div>
            </div>
          </NuxtLink>

          <!-- 2. ARG Piscinas -->
          <NuxtLink to="/projects/argpiscinas" class="project-card" data-row="argpiscinas">
            <div class="project-thumb-wrap">
              <img src="/media/projects/argpiscinas.jpg" alt="ARG Piscinas" class="project-thumb" loading="lazy">
              <div class="project-status-bar">
                <span class="project-status-badge">● LIVE</span>
                <span class="project-year-badge">2026</span>
              </div>
            </div>
            <div class="project-info">
              <div class="project-title-row">
                <span class="p-num">02</span>
                <h3 class="p-name">ARG Piscinas</h3>
              </div>
              <p class="p-org">ARG Piscinas (Andalucía, ES)</p>
              <p class="p-summary">
                Plataforma corporativa multi-idioma (ES/EN/DE) con panel de control autónomo para carga de obras. Tipado integral con Prisma y Node.js.
              </p>
              <div class="p-techs">
                <span class="p-tech-chip">Vue 3</span>
                <span class="p-tech-chip">Node.js</span>
                <span class="p-tech-chip">Prisma</span>
                <span class="p-tech-chip">Tailwind CSS</span>
              </div>
              <div class="project-cta">
                <span>ABRIR ARCHIVO TÉCNICO</span>
                <span class="cta-arrow" aria-hidden="true">›</span>
              </div>
            </div>
          </NuxtLink>

          <!-- 3. Ynara -->
          <NuxtLink to="/projects/ynara" class="project-card" data-row="ynara">
            <div class="project-thumb-wrap">
              <img src="/media/projects/ynara-mtucqc2j.png" alt="Ynara Asistente de IA" class="project-thumb" loading="lazy">
              <div class="project-status-bar">
                <span class="project-status-badge">● WIP</span>
                <span class="project-year-badge">2026</span>
              </div>
            </div>
            <div class="project-info">
              <div class="project-title-row">
                <span class="p-num">03</span>
                <h3 class="p-name">Ynara</h3>
              </div>
              <p class="p-org">Tesis Escuela Da Vinci (Preaprobada 2026)</p>
              <p class="p-summary">
                Asistente personal de IA adaptativo on-premise en rioplatense, con memoria cifrada vectorial sobre Postgres y pgvector. 382 commits.
              </p>
              <div class="p-techs">
                <span class="p-tech-chip">FastAPI</span>
                <span class="p-tech-chip">Next.js</span>
                <span class="p-tech-chip">PostgreSQL</span>
                <span class="p-tech-chip">Python</span>
                <span class="p-tech-chip">TypeScript</span>
              </div>
              <div class="project-cta">
                <span>ABRIR ARCHIVO TÉCNICO</span>
                <span class="cta-arrow" aria-hidden="true">›</span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Telemetría del Sistema & Certificaciones -->
      <section class="telemetria-section">
        <div class="tel-grid">
          <div class="tel-card">
            <span class="tel-k">DATABASE ENGINE</span>
            <span class="tel-v">PostgreSQL 17 ACID</span>
            <span class="tel-sub">Tipado estricto de punta a punta</span>
          </div>
          <div class="tel-card">
            <span class="tel-k">TRAYECTORIA REAL</span>
            <span class="tel-v">≈ 10 Proyectos</span>
            <span class="tel-sub">Clientes en España y Argentina</span>
          </div>
          <div class="tel-card">
            <span class="tel-k">FORMACIÓN TÉCNICA</span>
            <span class="tel-v">Tesis Preaprobada</span>
            <span class="tel-sub">Da Vinci (2026) · CET 30 (2023)</span>
          </div>
          <div class="tel-card">
            <span class="tel-k">DISPONIBILIDAD</span>
            <span class="tel-v">Inmediata</span>
            <span class="tel-sub">Remoto · Híbrido · Presencial</span>
          </div>
        </div>
      </section>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 2. COLECCIONES: VISTA DE CARPETA (folder.head !== 'db')                 -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <template v-else>
      <!-- Cabecera de Carpeta -->
      <DatosCabecera :id="uid" kind="folder" :badge="pad(folder.count)" :name="folder.head" :line="folder.line">
        <div class="folder-header-actions">
          <!-- Filtros Activos Facetados -->
          <template v-if="folder.facets.length">
            <NuxtLink
              v-for="f in folder.facets"
              :key="f.key"
              :to="f.remove"
              class="facet"
              :title="`quitar el filtro ${f.key}`"
            >
              <span class="facet-kv">{{ f.key }} = {{ f.value }}</span>
              <span class="facet-x" aria-hidden="true">×</span>
            </NuxtLink>
          </template>

          <!-- Selector de Vista (Baldosas vs Tabla) -->
          <div v-if="folder.items.length" class="view-toggle" role="group" aria-label="Modo de visualización">
            <button
              type="button"
              class="v-btn"
              :class="{ active: viewMode === 'grid' }"
              title="Vista de baldosas en cuadrícula"
              @click="viewMode = 'grid'"
            >
              ☷ GRILLA
            </button>
            <button
              type="button"
              class="v-btn"
              :class="{ active: viewMode === 'table' }"
              title="Vista de tabla técnica compacta"
              @click="viewMode = 'table'"
            >
              ☰ TABLA
            </button>
          </div>
        </div>
      </DatosCabecera>

      <!-- Vista de Cuadrícula (Especializada por Colección) -->
      <ol
        v-if="viewMode === 'grid'"
        class="grid"
        :class="{
          'projects-grid': folder.head === 'projects',
          'cards-grid': folder.head === 'stack' || folder.head === 'experience',
        }"
      >
        <li v-for="(it, n) in folder.items" :key="it.key">
          <!-- Tarjeta de Proyecto -->
          <NuxtLink
            v-if="folder.head === 'projects'"
            :to="it.to"
            class="project-card"
            :data-row="it.key"
          >
            <div class="project-thumb-wrap">
              <img v-if="it.cover" :src="it.cover" :alt="it.label" class="project-thumb" loading="lazy">
              <div v-else class="project-thumb-fallback">
                <DatosIcono kind="file" :badge="it.badge" />
              </div>
              <div class="project-status-bar">
                <span class="project-status-badge">● {{ it.status ?? 'LIVE' }}</span>
                <span class="project-year-badge">{{ it.year ?? it.meta }}</span>
              </div>
            </div>

            <div class="project-info">
              <div class="project-title-row">
                <span class="p-num">{{ pad(n + 1) }}</span>
                <h3 class="p-name">{{ it.label }}</h3>
              </div>
              <p v-if="it.org" class="p-org">{{ it.org }}</p>
              <p v-if="it.summary" class="p-summary">{{ it.summary }}</p>
              <div v-if="it.techs && it.techs.length" class="p-techs">
                <span v-for="t in it.techs.slice(0, 4)" :key="t.slug" class="p-tech-chip">{{ t.name }}</span>
                <span v-if="it.techs.length > 4" class="p-tech-chip more">+{{ it.techs.length - 4 }}</span>
              </div>
              <div class="project-cta">
                <span>ABRIR DOSSIER TÉCNICO</span>
                <span class="cta-arrow" aria-hidden="true">›</span>
              </div>
            </div>
          </NuxtLink>

          <!-- Tarjeta de Experiencia -->
          <NuxtLink
            v-else-if="folder.head === 'experience'"
            :to="it.to"
            class="exp-card"
            :data-row="it.key"
          >
            <div class="exp-card-header">
              <span class="exp-org">{{ it.org ?? it.label }}</span>
              <span class="exp-period">{{ it.meta }}</span>
            </div>
            <h3 class="exp-role">{{ it.role ?? it.label }}</h3>
            <p v-if="it.summary" class="exp-summary">{{ it.summary }}</p>
            <div v-if="it.techs && it.techs.length" class="exp-techs">
              <span v-for="t in it.techs.slice(0, 3)" :key="t.slug" class="p-tech-chip">{{ t.name }}</span>
            </div>
            <div class="exp-cta">
              <span>DETALLES TÉCNICOS ›</span>
            </div>
          </NuxtLink>

          <!-- Tarjeta de Stack -->
          <NuxtLink
            v-else-if="folder.head === 'stack'"
            :to="it.to"
            class="stack-card"
            :data-row="it.key"
          >
            <div class="stack-card-header">
              <span v-if="it.category" class="stack-category">{{ it.category }}</span>
              <span v-if="it.since" class="stack-since">desde {{ it.since }}</span>
            </div>
            <h3 class="stack-name">{{ it.label }}</h3>
            <p v-if="it.note" class="stack-note">{{ it.note }}</p>
            <div class="stack-cta">
              <span>FILTRAR REGISTROS ›</span>
            </div>
          </NuxtLink>

          <!-- Baldosa Estándar -->
          <NuxtLink v-else :to="it.to" class="tile" :class="it.kind" :data-row="it.key">
            <span class="n">{{ pad(n + 1) }}</span>
            <DatosIcono :kind="it.kind" :badge="it.badge" class="icono" />
            <span class="name">{{ it.label }}</span>
            <span class="meta">{{ it.desc ?? it.meta }}</span>
          </NuxtLink>
        </li>
      </ol>

      <!-- Vista de Tabla Técnica Compacta -->
      <div v-else-if="viewMode === 'table'" class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th class="th-n">#</th>
              <th class="th-name">REGISTRO / NOMBRE</th>
              <th class="th-key">SLUG</th>
              <th class="th-meta">METADATO</th>
              <th class="th-kind">TIPO</th>
              <th class="th-action">ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(it, n) in folder.items" :key="it.key" class="t-row">
              <td class="td-n">{{ pad(n + 1) }}</td>
              <td class="td-name">
                <NuxtLink :to="it.to" class="t-link" :data-row="it.key">
                  <DatosIcono :kind="it.kind" :badge="it.badge" class="t-icon" />
                  <span class="t-label">{{ it.label }}</span>
                </NuxtLink>
              </td>
              <td class="td-key"><code>{{ it.key }}</code></td>
              <td class="td-meta">{{ it.meta }}</td>
              <td class="td-kind"><span class="badge-kind">{{ it.kind }}</span></td>
              <td class="td-action">
                <NuxtLink :to="it.to" class="btn-open">ABRIR ›</NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="!folder.items.length" class="vacio">00 records encontrados para este filtro</p>
    </template>
  </section>
</template>

<style scoped>
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
  color: var(--d-ink);
  background: var(--d-hover);
}
.v-btn.active {
  background: var(--d-rule);
  color: var(--d-sig);
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
.facet:hover { border-color: var(--d-ink); background: var(--d-hover); }
.facet-x { color: var(--d-dim); }
.facet:hover .facet-x { color: var(--d-ink); }

/* Grilla Clásica de Baldosas: fluida sin límites para llenar el ancho disponible */
.grid {
  list-style: none;
  margin: 0;
  padding: 20px 0 0;
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
  padding: 26px 12px 18px;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  color: var(--d-ink);
  text-decoration: none;
  text-align: center;
  transition: all var(--d-dur) ease;
}
.tile:hover {
  background: var(--d-hover);
  border-color: var(--d-sig);
  transform: translateY(-2px);
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
/* INICIO: DASHBOARD EJECUTIVO & SHOWCASE EN VIVO                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
.inicio-dashboard {
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 100%;
}

/* 1. Hero ID Card */
.hero-id-card {
  display: flex;
  gap: 24px;
  padding: 24px;
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
  border-left: 4px solid var(--d-sig);
}
.hero-id-avatar-wrap {
  flex: none;
  width: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.hero-id-photo {
  width: 130px;
  height: 130px;
  object-fit: cover;
  border: 1px solid var(--d-rule-strong);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}
.hero-id-status-badge {
  margin-top: 8px;
  padding: 3px 8px;
  background: var(--d-paper);
  border: 1px solid var(--d-green);
  color: var(--d-green);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.hero-id-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.hero-id-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}
.hero-id-tag {
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--d-sig);
}
.hero-id-loc {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--d-faint);
}

.hero-id-name {
  margin: 2px 0 4px;
  font-family: var(--font-text);
  font-size: clamp(22px, 2.5vw, 32px);
  font-weight: 700;
  color: var(--d-ink);
  letter-spacing: -0.02em;
}
.hero-id-role {
  margin: 0 0 10px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--d-dim);
  font-weight: 600;
}
.hero-id-desc {
  margin: 0 0 18px;
  font-family: var(--font-text);
  font-size: 14px;
  line-height: 1.55;
  color: var(--d-dim);
}

.hero-id-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: auto;
}

/* 2. Showcase Destacado */
.showcase-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.showcase-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--d-rule);
  padding-bottom: 8px;
}
.sh-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.sh-num {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--d-sig);
}
.sh-title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--d-ink);
  text-transform: uppercase;
}
.sh-all-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--d-sig);
  text-decoration: none;
}
.sh-all-link:hover {
  text-decoration: underline;
}

.showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(clamp(280px, 28vw, 420px), 1fr));
  gap: 18px;
}

/* 3. Telemetría de la Infraestructura */
.telemetria-section {
  padding-top: 4px;
}
.tel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.tel-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
}
.tel-k {
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--d-faint);
  text-transform: uppercase;
}
.tel-v {
  font-family: var(--font-mono);
  font-size: 13.5px;
  font-weight: 700;
  color: var(--d-ink);
}
.tel-sub {
  font-family: var(--font-text);
  font-size: 11.5px;
  color: var(--d-dim);
}

@media (max-width: 768px) {
  .hero-id-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .hero-id-avatar-wrap {
    width: 100%;
    flex-direction: row;
    gap: 14px;
  }
  .hero-id-photo {
    width: 90px;
    height: 90px;
  }
}
.dossier-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
  border-radius: 1px;
  transition: all var(--d-dur) ease;
}
.dossier-btn.primary {
  background: var(--d-sig);
  color: #ffffff;
  border: 1px solid var(--d-sig);
}
.dossier-btn.primary:hover {
  background: var(--d-sig-hover);
  border-color: var(--d-sig-hover);
  box-shadow: 0 0 12px var(--d-sig-glow);
}
.dossier-btn.secondary {
  background: var(--d-paper);
  color: var(--d-ink);
  border: 1px solid var(--d-rule-strong);
}
.dossier-btn.secondary:hover {
  border-color: var(--d-sig);
  color: var(--d-sig);
  background: var(--d-hover);
}
.dossier-btn.tertiary {
  background: var(--d-paper);
  color: var(--d-dim);
  border: 1px solid var(--d-rule);
}
.dossier-btn.tertiary:hover {
  border-color: var(--d-rule-strong);
  color: var(--d-ink);
  background: var(--d-hover);
}
.dossier-btn-arrow {
  font-size: 13px;
  line-height: 1;
}

/* ─── Variantes de Cuadrícula ──────────────────────────────────────────────── */
.grid.projects-grid {
  grid-template-columns: repeat(auto-fill, minmax(clamp(280px, 28vw, 440px), 1fr));
  gap: 18px;
}
.grid.cards-grid {
  grid-template-columns: repeat(auto-fill, minmax(clamp(230px, 22vw, 340px), 1fr));
  gap: 14px;
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
  padding: 16px 18px 14px;
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
  margin-bottom: 12px;
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
}
.cta-arrow {
  font-size: 14px;
  transition: transform var(--d-dur) ease;
}
.project-card:hover .cta-arrow {
  transform: translateX(3px);
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
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--d-sig);
  border-top: 1px solid var(--d-rule);
  padding-top: 8px;
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
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 700;
  color: var(--d-sig);
  margin-top: auto;
  border-top: 1px solid var(--d-rule);
  padding-top: 8px;
}
</style>
