<script setup lang="ts">
// Hoja técnica de especificación de un registro o documento.
// Presenta cabecera unificada, navegación entre registros vecinos (prev/next),
// campos estructurados con tipos de datos a la vista y visor colapsable de JSON crudo de la API.
import DatosCabecera from './DatosCabecera.vue'
import DatosCV from './DatosCV.vue'
import DatosValor from './DatosValor.vue'
import DatosVentanaArchivo from './DatosVentanaArchivo.vue'
import { pad, type Detail, type Vecino } from './explorer'
import { routeFor } from '~/lib/path'

const props = defineProps<{
  detail: Detail
  prev?: Vecino | null
  next?: Vecino | null
}>()

const uid = useId()
const showRawJson = ref(false)
const showRawFields = ref(false)
const copied = ref(false)

const isAbout = computed(() => props.detail.name.toLowerCase() === 'about' || props.detail.type.includes('about'))
const isProject = computed(() => props.detail.type.includes('projects') || props.detail.type.includes('Project'))
const isContact = computed(() => props.detail.name.toLowerCase() === 'contact' || props.detail.type.includes('contact'))

const canonicalFilePath = computed(() => {
  const t = props.detail.type.toLowerCase()
  const n = props.detail.name.toLowerCase().replace(/\s+/g, '-')
  if (t.includes('project')) return `file://portfolio/projects/${n}.ts`
  if (t.includes('about')) return `file://portfolio/profile/mateo-cv.md`
  if (t.includes('contact')) return `file://portfolio/contact/channels.json`
  if (t.includes('tech') || t.includes('stack')) return `file://portfolio/stack/${n}.ts`
  if (t.includes('experience')) return `file://portfolio/experience/${n}.ts`
  return `file://portfolio/${n}.json`
})

const raw = computed(() => (props.detail.rawRecord as Record<string, unknown> | undefined) ?? {})
const projectUrl = computed(() => typeof raw.value.url === 'string' && raw.value.url ? raw.value.url : null)
const projectRepo = computed(() => typeof raw.value.repo === 'string' && raw.value.repo ? raw.value.repo : null)
const projectStatus = computed(() => typeof raw.value.status === 'string' ? raw.value.status : 'LIVE')
const projectYear = computed(() => raw.value.year ? String(raw.value.year) : null)
const projectRole = computed(() => typeof raw.value.role === 'string' ? raw.value.role : null)
const projectOrg = computed(() => {
  if (raw.value.org && typeof raw.value.org === 'object' && 'name' in raw.value.org) {
    return String((raw.value.org as { name?: unknown }).name)
  }
  return null
})

const emailRow = computed(() => props.detail.rows.find(r => r.name === 'email'))
const copiedEmail = ref(false)

async function copyEmail() {
  if (!emailRow.value?.value) return
  try {
    await navigator.clipboard.writeText(String(emailRow.value.value))
    copiedEmail.value = true
    setTimeout(() => { copiedEmail.value = false }, 2500)
  }
  catch {}
}

const { path: mundoPath } = useMundo()
const parentRoute = computed(() => routeFor(mundoPath.value.slice(0, -1)))

const line = computed(() => [
  ...props.detail.type.split(' · '),
  ...(props.detail.updated ? [`updatedAt ${props.detail.updated}`] : []),
  `${pad(props.detail.rows.length)} campos`,
])

const jsonContent = computed(() => {
  return JSON.stringify(props.detail.rawRecord ?? props.detail, null, 2)
})

async function copyJson() {
  try {
    await navigator.clipboard.writeText(jsonContent.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
  catch {
    // Fallback silencioso
  }
}
</script>

<template>
  <DatosVentanaArchivo
    :title="detail.name"
    :path="canonicalFilePath"
    :badge="detail.type"
    :parent-url="parentRoute"
  >
    <article class="hoja" :aria-labelledby="uid">
      <DatosCabecera :id="uid" kind="file" :badge="pad(detail.rows.length)" :name="detail.name" :line="line">
        <div class="hoja-acciones">
          <!-- Toggle para ver CV vs Campos técnicos si es About -->
          <button
            v-if="isAbout"
            type="button"
            class="raw-btn"
            :class="{ active: showRawFields }"
            title="Alternar entre la vista de CV y la tabla de campos técnicos"
            @click="showRawFields = !showRawFields"
          >
            <span>{{ showRawFields ? '📄 VISTA CV' : '☰ ESQUEMA CAMPOS' }}</span>
          </button>

          <!-- Botón de Inspección de JSON Crudo -->
          <button
            type="button"
            class="raw-btn"
            :class="{ active: showRawJson }"
            title="Inspeccionar respuesta cruda de la API REST"
            @click="showRawJson = !showRawJson"
          >
            <span class="raw-icon">{ }</span>
            <span>{{ showRawJson ? 'CERRAR JSON' : 'RAW JSON' }}</span>
          </button>

          <!-- Navegación entre vecinos -->
          <nav v-if="prev || next" class="vecinos" aria-label="Registros vecinos">
            <NuxtLink v-if="prev" :to="prev.to" class="vecino" rel="prev" title="Registro anterior">
              <span aria-hidden="true">‹</span> {{ prev.label }}
            </NuxtLink>
            <span v-else class="vecino off" aria-hidden="true">‹</span>

            <NuxtLink v-if="next" :to="next.to" class="vecino" rel="next" title="Registro siguiente">
              {{ next.label }} <span aria-hidden="true">›</span>
            </NuxtLink>
            <span v-else class="vecino off" aria-hidden="true">›</span>
          </nav>
        </div>
      </DatosCabecera>

      <!-- 1. Si es documento About y no está en modo campos: Renderizar DatosCV -->
      <DatosCV v-if="isAbout && !showRawFields" />

      <!-- De lo contrario, renderizar el flujo estándar -->
      <template v-else>
        <!-- Barra de Acción Hero de Proyecto -->
        <div v-if="isProject" class="project-hero-bar">
          <div class="ph-meta">
            <span class="ph-status">● {{ projectStatus }}</span>
            <span v-if="projectYear" class="ph-pill">{{ projectYear }}</span>
            <span v-if="projectOrg" class="ph-pill org">{{ projectOrg }}</span>
            <span v-if="projectRole" class="ph-pill role">{{ projectRole }}</span>
          </div>

          <div class="ph-actions">
            <a
              v-if="projectUrl"
              :href="projectUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="ph-btn primary"
            >
              <span>↗ VISITAR SITIO EN VIVO</span>
            </a>
            <a
              v-if="projectRepo"
              :href="projectRepo"
              target="_blank"
              rel="noopener noreferrer"
              class="ph-btn secondary"
            >
              <span>‹/› CÓDIGO FUENTE EN GITHUB</span>
            </a>
          </div>
        </div>

        <!-- Barra de Acción Rápida de Contacto -->
        <div v-if="isContact" class="contact-hero-bar">
          <div class="ch-info">
            <span class="ch-badge">● DISPONIBLE // CONTRATACIÓN DIRECTA</span>
            <span class="ch-desc">Respondo habitualmente en menos de 24 horas laborables.</span>
          </div>
          <div class="ch-actions">
            <button type="button" class="ch-btn copy" @click="copyEmail">
              <span>{{ copiedEmail ? '✓ ¡EMAIL COPIADO!' : '📋 COPIAR EMAIL DIRECTO' }}</span>
            </button>
            <a
              v-if="emailRow?.value"
              :href="`mailto:${emailRow.value}`"
              class="ch-btn primary"
            >
              <span>✉ ENVIAR CORREO ↗</span>
            </a>
          </div>
        </div>

        <!-- Drawer de Inspección JSON Crudo -->
        <div v-if="showRawJson" class="raw-drawer">
          <div class="raw-toolbar">
            <span class="raw-endpoint">GET /api/{{ detail.name.toLowerCase().replace(/\s+/g, '-') }}</span>
            <button type="button" class="copy-btn" @click="copyJson">
              {{ copied ? '¡COPIADO AL PORTAPAPELES! ✓' : 'COPIAR PAYLOAD JSON' }}
            </button>
          </div>
          <pre class="raw-code"><code>{{ jsonContent }}</code></pre>
        </div>

        <!-- Lista de Campos Técnicos -->
        <dl class="campos">
          <div
            v-for="row in detail.rows"
            :key="row.name"
            class="campo"
            :class="{
              wide: row.wide || row.items || row.media || row.steps || row.metrics,
              narrative: row.name === 'brief' || row.name === 'outcome' || row.name === 'story' || row.name === 'summary' || row.name === 'note',
            }"
          >
            <dt class="nombre" :title="row.label ? `campo: ${row.name}` : undefined">
              <span class="nombre-label">{{ row.label ?? row.name }}</span>
              <span v-if="row.label && row.label !== row.name" class="nombre-key"> · {{ row.name }}</span>
            </dt>
            <dd class="valor">
              <DatosValor :cell="row" :name="row.name" />
            </dd>
            <dd class="tipo">{{ row.type }}</dd>
          </div>
        </dl>
      </template>
    </article>
  </DatosVentanaArchivo>
</template>

<style scoped>
.hoja {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px 48px;
  align-content: start;
}

.hoja-acciones {
  display: flex;
  align-items: center;
  gap: 10px;
}

.raw-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  color: var(--d-dim);
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--d-dur) ease;
}
.raw-btn:hover, .raw-btn.active {
  border-color: var(--d-sig);
  color: var(--d-sig);
  background: var(--d-hover);
}
.raw-icon { font-weight: 900; }

.vecinos { display: flex; align-items: center; gap: 6px; font-family: var(--font-text); font-size: var(--d-fs-ui); flex-wrap: wrap; }
.vecino {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 280px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  color: var(--d-dim);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all var(--d-dur) ease;
}
.vecino:hover { border-color: var(--d-sig); color: var(--d-sig); background: var(--d-hover); }
.vecino.off { color: var(--d-faint); opacity: 0.5; cursor: default; }

/* ─── Drawer JSON Crudo ────────────────────────────────────────────────────── */
.raw-drawer {
  background: var(--d-surface);
  border: 1px solid var(--d-rule-strong);
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  width: 100%;
}
.raw-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: var(--d-surface-raised);
  border-bottom: 1px solid var(--d-rule);
}
.raw-endpoint {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-sig);
  font-weight: 700;
}
.copy-btn {
  background: none;
  border: 1px solid var(--d-rule);
  color: var(--d-ink);
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all var(--d-dur) ease;
}
.copy-btn:hover {
  border-color: var(--d-sig);
  color: var(--d-sig);
}
.raw-code {
  margin: 0;
  padding: 14px 16px;
  max-height: 360px;
  overflow: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
  color: var(--d-ink);
  background: var(--d-paper);
}

/* ─── Campos ───────────────────────────────────────────────────────────────── */
.campos { margin: 0; width: 100%; }
.campo {
  display: grid;
  grid-template-columns: minmax(130px, 200px) minmax(0, 1fr) auto;
  grid-template-areas: "nombre valor tipo";
  justify-content: stretch;
  gap: 8px 24px;
  align-items: baseline;
  min-height: 42px;
  padding: 14px 0;
  border-bottom: 1px solid var(--d-rule);
  width: 100%;
}
.campo.wide {
  grid-template-columns: minmax(130px, 200px) minmax(0, 1fr);
  grid-template-areas: "nombre tipo" "valor valor";
  justify-content: stretch;
  gap: 8px 24px;
  width: 100%;
}
.campo.narrative .valor {
  border-left: 2px solid var(--d-sig);
  padding-left: 14px;
  color: var(--d-ink);
  line-height: 1.6;
}
.nombre { grid-area: nombre; margin: 0; font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-dim); font-weight: 700; }
.tipo {
  grid-area: tipo;
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-dim);
  overflow-wrap: anywhere;
}
.campo.wide .tipo { text-align: right; }
.valor {
  grid-area: valor;
  margin: 0;
  font-family: var(--font-text);
  font-size: var(--d-fs-value);
  line-height: var(--d-lh);
  overflow-wrap: anywhere;
}
.campo.wide .valor { width: 100%; max-width: none; }
.campo.wide:not(:has(.items)) .valor { font-size: var(--d-fs-read); }

/* ─── Hero Bar de Proyecto ─────────────────────────────────────────────────── */
.project-hero-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 18px;
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
  border-left: 4px solid var(--d-sig);
}
.ph-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.ph-status {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--d-green);
  letter-spacing: 0.05em;
}
.ph-pill {
  padding: 3px 8px;
  background: var(--d-paper);
  border: 1px solid var(--d-rule);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-ink);
}
.ph-pill.org {
  color: var(--d-sig);
  font-weight: 700;
}
.ph-pill.role {
  color: var(--d-dim);
}
.ph-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.ph-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 700;
  text-decoration: none;
  transition: all var(--d-dur) ease;
}
.ph-btn.primary {
  background: var(--d-sig);
  color: #ffffff;
  border: 1px solid var(--d-sig);
  box-shadow: 0 0 14px var(--d-sig-glow);
}
.ph-btn.primary:hover {
  background: var(--d-sig-hover);
  border-color: var(--d-sig-hover);
}
.ph-btn.secondary {
  background: var(--d-paper);
  color: var(--d-ink);
  border: 1px solid var(--d-rule-strong);
}
.ph-btn.secondary:hover {
  border-color: var(--d-sig);
  color: var(--d-sig);
  background: var(--d-hover);
}

/* ─── Hero Bar de Contacto ─────────────────────────────────────────────────── */
.contact-hero-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 18px;
  background: var(--d-surface);
  border: 1px solid var(--d-rule);
  border-left: 4px solid var(--d-green);
}
.ch-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ch-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--d-green);
  letter-spacing: 0.05em;
}
.ch-desc {
  font-family: var(--font-text);
  font-size: 13.5px;
  color: var(--d-dim);
}
.ch-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.ch-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--d-dur) ease;
}
.ch-btn.copy {
  background: var(--d-paper);
  color: var(--d-ink);
  border: 1px solid var(--d-rule-strong);
}
.ch-btn.copy:hover {
  border-color: var(--d-sig);
  color: var(--d-sig);
  background: var(--d-hover);
}
.ch-btn.primary {
  background: var(--d-green);
  color: #ffffff;
  border: 1px solid var(--d-green);
}
.ch-btn.primary:hover {
  background: #059669;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
}

.nombre-label {
  color: var(--d-ink);
}
.nombre-key {
  font-size: 10px;
  color: var(--d-faint);
  font-weight: 400;
}

@media (max-width: 768px) {
  .hoja-acciones { flex-wrap: wrap; width: 100%; gap: 8px; }
  .vecinos { width: 100%; justify-content: space-between; }
  .vecino { max-width: none; flex: 1 1 auto; }
  .project-hero-bar, .contact-hero-bar { flex-direction: column; align-items: flex-start; }
  .campo, .campo.wide {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "nombre tipo" "valor valor";
    gap: 6px 12px;
  }
  .campo .tipo { text-align: right; }
}
</style>
