<script setup lang="ts">
// Renderizador de valores para hojas técnicas y tablas.
// Soporta relaciones, filtros, links externos, activos multimedia (con visor lightbox),
// pasos de proceso de ingeniería y métricas de rendimiento.
import type { Cell, MediaItem } from './explorer'

const props = defineProps<{
  cell: Cell
  /** Nombre del campo, para el título del filtro. */
  name?: string
  /** El link va en tinta y no en azul: es el nombre del record, no una relación. */
  plain?: boolean
}>()

const activeMedia = ref<MediaItem | null>(null)
const copiedInline = ref(false)

async function copyInline(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copiedInline.value = true
    setTimeout(() => { copiedInline.value = false }, 2000)
  }
  catch {
    // Fallback silencioso
  }
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <!-- 1. Piezas Multimedia / Capturas Técnicas con Lightbox -->
  <div v-if="cell.media && cell.media.length" class="media-inspector">
    <div class="media-grid">
      <figure
        v-for="m in cell.media"
        :key="m.id"
        class="media-card"
        tabindex="0"
        role="button"
        :aria-label="`Inspeccionar captura: ${m.alt}`"
        @click="activeMedia = m"
        @keydown.enter="activeMedia = m"
      >
        <div class="media-thumb-wrap">
          <img :src="m.src" :alt="m.alt" class="media-thumb" loading="lazy">
          <div class="media-overlay">
            <span class="zoom-icon">⊕ EXPANDIR</span>
          </div>
        </div>
        <figcaption class="media-meta">
          <span class="m-role">{{ m.role }}</span>
          <span class="m-dim">{{ m.width }}×{{ m.height }}</span>
          <span v-if="m.bytes" class="m-bytes">{{ formatBytes(m.bytes) }}</span>
        </figcaption>
      </figure>
    </div>

    <!-- Modal Lightbox Técnico -->
    <Teleport to="body">
      <div
        v-if="activeMedia"
        class="lightbox-backdrop"
        role="dialog"
        aria-modal="true"
        @click.self="activeMedia = null"
        @keydown.esc="activeMedia = null"
      >
        <div class="lightbox-chassis">
          <header class="lightbox-header">
            <div class="lh-left">
              <span class="lh-badge">{{ activeMedia.role }}</span>
              <span class="lh-name">{{ activeMedia.alt }}</span>
            </div>
            <div class="lh-right">
              <span class="lh-meta">{{ activeMedia.width }} × {{ activeMedia.height }} PX · {{ formatBytes(activeMedia.bytes) }}</span>
              <button
                type="button"
                class="lightbox-close"
                aria-label="Cerrar visor"
                @click="activeMedia = null"
              >
                ✕ ESC
              </button>
            </div>
          </header>

          <div class="lightbox-body">
            <img :src="activeMedia.src" :alt="activeMedia.alt" class="lightbox-img">
          </div>
        </div>
      </div>
    </Teleport>
  </div>

  <!-- 2. Pasos de Proceso de Ingeniería (Stepper Articulado) -->
  <div v-else-if="cell.steps && cell.steps.length" class="process-stepper">
    <div v-for="s in cell.steps" :key="s.order" class="step-card">
      <div class="step-header">
        <span class="step-pip">0{{ s.order }}</span>
        <span class="step-title">{{ s.title }}</span>
      </div>
      <p class="step-body">{{ s.body }}</p>
    </div>
  </div>

  <!-- 3. Panel de Métricas Técnicas (Lighthouse, Latencia, Bundle) -->
  <div v-else-if="cell.metrics && Object.keys(cell.metrics).length" class="metrics-panel">
    <div class="metrics-grid">
      <div v-for="(val, k) in cell.metrics" :key="k" class="metric-pill">
        <span class="m-label">{{ k }}</span>
        <span class="m-value">
          <template v-if="typeof val === 'object' && val !== null">
            <span v-for="(subVal, subKey) in val" :key="subKey" class="sub-metric">
              {{ subKey }}: {{ subVal }}
            </span>
          </template>
          <template v-else>
            {{ val }}
          </template>
        </span>
      </div>
    </div>
  </div>

  <!-- 4. Relaciones de Lista (Techs, Links, Relaciones Inversas) -->
  <span v-else-if="cell.items" class="items">
    <template v-for="(it, i) in cell.items" :key="i">
      <span v-if="i" class="sep" aria-hidden="true">·</span>
      <NuxtLink v-if="it.to" :to="it.to" class="rel">{{ it.label }}<span v-if="it.meta" class="im"> {{ it.meta }}</span></NuxtLink>
      <NuxtLink v-else-if="it.facet" :to="it.facet" class="facet" :title="`filtrar ${name ?? ''} = ${it.label}`">{{ it.label }}</NuxtLink>
      <a v-else-if="it.href" :href="it.href" target="_blank" rel="noopener noreferrer" class="ext">{{ it.label }}<span v-if="it.meta" class="im"> {{ it.meta }}</span> ↗</a>
      <span v-else>{{ it.label }}</span>
    </template>
  </span>

  <!-- 5. Enlace a Registro Relacionado Único -->
  <NuxtLink v-else-if="cell.to" :to="cell.to" class="rel" :class="{ plain }">
    {{ cell.value }} <span aria-hidden="true">›</span>
  </NuxtLink>

  <!-- 6. Enlace URL Externo / Correo Electrónico -->
  <span v-else-if="cell.href && cell.href.startsWith('mailto:')" class="email-value-wrap">
    <a :href="cell.href" class="ext mail-link">
      {{ cell.value }}
    </a>
    <button
      type="button"
      class="quick-copy-btn"
      :title="`Copiar ${cell.value} al portapapeles`"
      @click="copyInline(String(cell.value))"
    >
      {{ copiedInline ? '✓ COPIADO' : '📋 COPIAR' }}
    </button>
  </span>
  <a v-else-if="cell.href" :href="cell.href" target="_blank" rel="noopener noreferrer" class="ext">
    {{ cell.value }} ↗
  </a>

  <!-- 7. Filtro Facetado de Tabla -->
  <NuxtLink v-else-if="cell.facet" :to="cell.facet" class="facet" :title="`filtrar ${name ?? ''} = ${cell.value}`">
    {{ cell.value }}
  </NuxtLink>

  <!-- 8. Valor Nulo Explícito -->
  <span v-else-if="cell.value === null" class="nul">NULL</span>

  <!-- 9. Texto o Bloque Narrativo Estándar -->
  <template v-else>
    {{ cell.value }}
  </template>
</template>

<style scoped>
.items { display: flex; flex-wrap: wrap; gap: 4px 8px; }
.sep { color: var(--d-faint); }
.im { margin-left: 5px; color: var(--d-dim); font-size: var(--d-fs-ui); }
a { color: var(--d-sig); text-decoration: none; }
a:hover { color: var(--d-sig-hover); text-decoration: underline; }
.rel.plain { color: var(--d-ink); }
.facet { color: var(--d-ink); text-decoration: underline dotted var(--d-faint); text-underline-offset: 3px; }
.facet:hover { color: var(--d-sig); text-decoration: underline solid var(--d-sig); }
.ext { text-decoration: underline; text-decoration-color: var(--d-rule); }
.nul { font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-dim); }

.email-value-wrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.mail-link {
  font-weight: 600;
  color: var(--d-sig);
}
.quick-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  color: var(--d-dim);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--d-dur) ease;
}
.quick-copy-btn:hover {
  border-color: var(--d-sig);
  color: var(--d-sig);
  background: var(--d-hover);
}

/* ─── Media Inspector ──────────────────────────────────────────────────────── */
.media-inspector {
  width: 100%;
  margin-top: 4px;
}
.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(clamp(240px, 20vw, 360px), 1fr));
  gap: 16px;
  width: 100%;
}
.media-card {
  margin: 0;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  cursor: pointer;
  transition: border-color var(--d-dur) ease, transform var(--d-dur) ease;
}
.media-card:hover, .media-card:focus-visible {
  border-color: var(--d-sig);
  transform: translateY(-2px);
  outline: none;
}
.media-thumb-wrap {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: #000;
}
.media-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.media-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--d-dur) ease;
}
.media-card:hover .media-overlay, .media-card:focus-visible .media-overlay {
  opacity: 1;
}
.zoom-icon {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid var(--d-sig);
}
.media-meta {
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  border-top: 1px solid var(--d-rule);
  color: var(--d-dim);
}
.m-role { color: var(--d-sig); font-weight: 700; }
.m-dim { color: var(--d-ink); }

/* Lightbox Modal */
.lightbox-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.lightbox-chassis {
  width: 100%;
  max-width: min(96vw, 1600px);
  max-height: 92vh;
  background: var(--d-paper);
  border: 1px solid var(--d-rule-strong);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.lightbox-header {
  height: 44px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--d-rule);
  background: var(--d-surface);
}
.lh-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.lh-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 800;
  color: var(--d-sig);
  border: 1px solid var(--d-sig);
  padding: 2px 6px;
}
.lh-name {
  font-family: var(--font-text);
  font-size: 13px;
  color: var(--d-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lh-right { display: flex; align-items: center; gap: 16px; }
.lh-meta { font-family: var(--font-mono); font-size: 11px; color: var(--d-dim); }
.lightbox-close {
  background: none;
  border: 1px solid var(--d-rule);
  color: var(--d-ink);
  padding: 4px 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  cursor: pointer;
}
.lightbox-close:hover { border-color: var(--d-sig); color: var(--d-sig); }
.lightbox-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}
.lightbox-img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

/* ─── Process Stepper ──────────────────────────────────────────────────────── */
.process-stepper {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(clamp(250px, 24vw, 380px), 1fr));
  gap: 14px;
  width: 100%;
  margin-top: 6px;
}
.step-card {
  padding: 12px 14px;
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
  border-left: 3px solid var(--d-sig);
}
.step-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.step-pip {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--d-sig);
}
.step-title {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--d-ink);
  text-transform: uppercase;
}
.step-body {
  margin: 0;
  font-family: var(--font-text);
  font-size: 13.5px;
  line-height: 1.45;
  color: var(--d-dim);
}

/* ─── Metrics Panel ────────────────────────────────────────────────────────── */
.metrics-panel {
  width: 100%;
  margin-top: 4px;
}
.metrics-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.metric-pill {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 12px;
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
  min-width: 110px;
}
.m-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--d-dim);
  text-transform: uppercase;
}
.m-value {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--d-green);
}
.sub-metric {
  display: block;
  font-size: 11px;
  color: var(--d-ink);
}
</style>
