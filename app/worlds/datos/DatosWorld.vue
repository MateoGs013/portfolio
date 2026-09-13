<script setup lang="ts">
// Portafolio Técnico Mateo Sonzogni — Explorador de Datos Relacionales
// La raíz es la base de datos completa; las colecciones son carpetas; los registros son hojas técnicas.
// Navegación por teclado continua (flechas, Enter, Backspace, Esc, /, Cmd+K).
import DatosDetail from './DatosDetail.vue'
import DatosFolder from './DatosFolder.vue'
import DatosGoto from './DatosGoto.vue'
import { pad, resolveExplorer, type Explorer } from './explorer'
import { routeFor } from '~/lib/path'

const api = useApi()
const route = useRoute()
const router = useRouter()
const { path, query } = useMundo()

// Selector reactivo de Tema (Obsidian Dark / Technical Paper)
const theme = ref<'dark' | 'light'>('dark')

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  if (import.meta.client) {
    localStorage.setItem('portfolio-theme', theme.value)
    document.documentElement.setAttribute('data-theme', theme.value)
  }
}

onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem('portfolio-theme') as 'dark' | 'light' | null
    if (saved) {
      theme.value = saved
      document.documentElement.setAttribute('data-theme', saved)
    }
    else {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }
})

useHead({
  htmlAttrs: { 'data-portfolio': 'mateo-sonzogni' },
  meta: [{ name: 'theme-color', content: computed(() => (theme.value === 'dark' ? '#090a0f' : '#f1f3f5')) }],
  title: computed(() => ['mateo sonzogni', ...path.value].join(' / ')),
})
usePreloadFonts('datos')

const { data: ex, error } = await useAsyncData<Explorer>(
  computed(() => `explorer${route.fullPath}`),
  () => resolveExplorer(api, path.value, route.query),
)

// Manejo de errores HTTP
if (import.meta.server && error.value) {
  const event = useRequestEvent()
  if (event) setResponseStatus(event, error.value.statusCode ?? 500)
}

const folder = computed(() => ex.value?.folder ?? null)
const detail = computed(() => ex.value?.detail ?? null)
const hoja = computed(() => !!detail.value && !folder.value)

// Breadcrumbs de ruta
const segments = computed(() => [
  { label: 'db', to: routeFor([]) },
  ...path.value.map((seg, i) => ({ label: seg, to: routeFor(path.value.slice(0, i + 1), query.value) })),
])

// Movimiento de panel
const dir = ref<'' | 'deeper' | 'up' | 'lateral'>('')
watch(() => ex.value?.level, (now, before) => {
  if (now === undefined || before === undefined) return
  dir.value = now > before ? 'deeper' : now < before ? 'up' : 'lateral'
})

const gotoOpen = ref(false)
const pane = ref<HTMLElement | null>(null)

/** Las filas que el teclado recorre en el panel actual, en orden de lectura. */
const rows = () => Array.from(pane.value?.querySelectorAll<HTMLElement>('[data-row]') ?? [])

const viaTeclado = ref(false)
let cameFrom: string | null = null
watch(ex, async () => {
  if (!viaTeclado.value) return
  viaTeclado.value = false
  await nextTick()
  const back = cameFrom ? rows().find(r => r.dataset.row === cameFrom) : undefined
  cameFrom = null
  ;(back ?? pane.value?.querySelector<HTMLElement>('[data-anchor]'))?.focus({ preventScroll: false })
}, { flush: 'post' })

function go(to: Parameters<typeof navigateTo>[0], from?: string) {
  viaTeclado.value = true
  cameFrom = from ?? null
  navigateTo(to)
}

function onKey(e: KeyboardEvent) {
  if (gotoOpen.value || !ex.value) return
  const t = e.target as HTMLElement | null
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  if (e.altKey || e.metaKey || e.ctrlKey) {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); gotoOpen.value = true }
    return
  }

  switch (e.key) {
    case '/':
      e.preventDefault()
      gotoOpen.value = true
      break

    case 'ArrowDown':
    case 'ArrowUp':
    case 'ArrowLeft':
    case 'ArrowRight': {
      const forward = e.key === 'ArrowDown' || e.key === 'ArrowRight'
      const vertical = e.key === 'ArrowDown' || e.key === 'ArrowUp'
      if (hoja.value) {
        const vecino = forward ? ex.value.next : ex.value.prev
        if (vecino) { e.preventDefault(); go(vecino.to) }
        return
      }
      const list = rows()
      if (!list.length) return
      e.preventDefault()
      const cols = Math.max(1, list.filter(r => r.offsetTop === list[0]!.offsetTop).length)
      const step = vertical ? cols : 1
      const at = list.findIndex(r => r === t || r.contains(t))
      const to = at < 0 ? (forward ? 0 : list.length - 1) : Math.min(Math.max(at + (forward ? step : -step), 0), list.length - 1)
      list[to]?.focus()
      break
    }

    case 'Enter': {
      const row = t?.closest<HTMLElement>('[data-row]')
      if (!row) return
      viaTeclado.value = true
      if (t?.tagName === 'A') return
      e.preventDefault()
      ;(row.tagName === 'A' ? row : row.querySelector('a'))?.click()
      break
    }

    case 'Backspace':
    case 'Escape':
      if (ex.value.up) {
        e.preventDefault()
        go(ex.value.up, path.value[path.value.length - 1])
      }
      break
  }
}

onMounted(() => addEventListener('keydown', onKey))
onBeforeUnmount(() => removeEventListener('keydown', onKey))
interface NavSection {
  root: string
  label: string
  to: Parameters<typeof routeFor>[0]
  badge: string
  icon: string
  desc: string
}

const navSections: NavSection[] = [
  { root: '', label: 'db / raíz', to: [], badge: 'SYS', icon: '⛁', desc: 'Resumen del sistema y arquitectura' },
  { root: 'projects', label: '01 · proyectos', to: ['projects'], badge: '06', icon: '📁', desc: 'Aplicaciones en producción' },
  { root: 'experience', label: '02 · experiencia', to: ['experience'], badge: '07', icon: '📁', desc: 'Trayectoria profesional y roles' },
  { root: 'stack', label: '03 · stack', to: ['stack'], badge: '22', icon: '📁', desc: 'Tecnologías y lenguajes' },
  { root: 'about', label: '04 · sobre mí', to: ['about'], badge: '13', icon: '📄', desc: 'Perfil bio, formación y principios' },
  { root: 'contact', label: '05 · contacto', to: ['contact'], badge: '06', icon: '📄', desc: 'Canales y disponibilidad' },
]

const currentRoot = computed(() => path.value[0] ?? '')
</script>

<template>
  <div class="datos">
    <div class="ventana">
      <!-- Barra Superior de Herramientas -->
      <header class="barra">
        <nav class="historia" aria-label="Historial">
          <button type="button" class="nav-btn" aria-label="atrás" @click="router.back()">←</button>
          <button type="button" class="nav-btn" aria-label="adelante" @click="router.forward()">→</button>
          <NuxtLink v-if="ex?.up" :to="ex.up" class="nav-btn" aria-label="subir un nivel">↑</NuxtLink>
          <span v-else class="nav-btn off" aria-hidden="true">↑</span>
        </nav>

        <!-- Ruta / Breadcrumb -->
        <nav class="ruta" aria-label="Ruta">
          <template v-for="(seg, i) in segments" :key="seg.label + i">
            <span v-if="i" class="sep" aria-hidden="true">/</span>
            <NuxtLink v-if="i < segments.length - 1" :to="seg.to">{{ seg.label }}</NuxtLink>
            <span v-else class="here" aria-current="page">{{ seg.label }}</span>
          </template>
        </nav>

        <!-- Botón de Búsqueda Rápida / Goto -->
        <button class="goto-btn" type="button" title="Abrir paleta de comandos (⌘K o /)" @click="gotoOpen = true">
          <span class="goto-k">ir a</span>
          <span class="goto-ph">proyecto, tecnología, etapa…</span>
          <kbd>/</kbd>
        </button>

        <!-- Acciones Rápidas del Sistema: Telemetría y Tema -->
        <div class="barra-derecha">
          <div class="telemetria-badge" title="Conexión activa a base de datos">
            <span class="tele-dot" />
            <span class="tele-text">PG-17</span>
            <span class="tele-ms">{{ ex?.request.ms ?? 0 }}ms</span>
          </div>

          <button
            type="button"
            class="theme-btn"
            :aria-label="theme === 'dark' ? 'Cambiar a modo claro (papel técnico)' : 'Cambiar a modo oscuro (obsidiana)'"
            :title="`Cambiar a modo ${theme === 'dark' ? 'claro (papel)' : 'oscuro (obsidiana)'}`"
            @click="toggleTheme"
          >
            <span v-if="theme === 'dark'" aria-hidden="true">☼</span>
            <span v-else aria-hidden="true">☾</span>
          </button>
        </div>
      </header>

      <!-- Cuerpo de la Ventana: Sidebar Explorador + Escenario Central -->
      <div class="cuerpo-ventana">
        <aside class="sidebar" aria-label="Explorador de Archivos">
          <div class="sidebar-header">
            <span class="sidebar-tag">EXPLORADOR</span>
            <span class="sidebar-status">PG-17 // DB</span>
          </div>

          <nav class="sidebar-tree" aria-label="Secciones del sistema">
            <NuxtLink
              v-for="s in navSections"
              :key="s.root"
              :to="routeFor(s.to)"
              class="sidebar-item"
              :class="{ active: currentRoot === s.root }"
              :title="s.desc"
            >
              <span class="sidebar-icon" aria-hidden="true">{{ s.icon }}</span>
              <span class="sidebar-label">{{ s.label }}</span>
              <span class="sidebar-badge">{{ s.badge }}</span>
            </NuxtLink>
          </nav>

          <div class="sidebar-footer">
            <div class="sf-row">
              <span class="sf-dot" />
              <span class="sf-status">DISPONIBLE // 2026</span>
            </div>
            <div class="sf-info">
              <span>ENGINE: POSTGRESQL 17</span>
              <a href="/admin" target="_blank" class="sf-admin-link" title="Abrir Consola de Administración Técnica">ADMIN CONSOLE ↗</a>
            </div>
          </div>
        </aside>

        <main id="contenido" class="exp" tabindex="-1">
          <div v-if="error" class="pane">
            <DatosDetail
              :detail="{
                kind: 'document',
                name: `error ${error.statusCode ?? 500}`,
                type: 'response',
                updated: null,
                rows: [
                  { name: 'status', type: 'int', value: String(error.statusCode ?? 500) },
                  { name: 'message', type: 'string', value: error.statusMessage ?? error.message },
                  { name: 'request', type: 'string', value: (error.data as { request?: string } | undefined)?.request ?? null },
                ],
              }"
            />
          </div>
          <div v-else-if="ex" ref="pane" :key="route.fullPath" class="pane" :class="dir">
            <DatosFolder v-if="folder" :folder="folder" />
            <DatosDetail v-else-if="detail" :detail="detail" :prev="ex.prev" :next="ex.next" />
          </div>
        </main>
      </div>

      <!-- Barra de Estado Inferior -->
      <footer class="estado">
        <span v-if="ex" class="medida">{{ pad(ex.request.count) }} {{ ex.request.count === 1 ? 'record' : 'records' }}</span>
        <span v-if="ex" class="req">{{ ex.request.line }} · {{ ex.request.status }} · {{ ex.request.ms }} ms</span>
        <span class="keys" aria-hidden="true">
          <template v-if="hoja && (ex?.prev || ex?.next)"><kbd>←</kbd><kbd>→</kbd> vecino</template>
          <template v-else-if="!hoja"><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> navegar <kbd>↵</kbd> abrir</template>
          <template v-if="ex?.up"><kbd>⌫</kbd> volver</template>
          <kbd>/</kbd> ir a
        </span>
      </footer>
    </div>

    <!-- Modal de Búsqueda Rápida / Goto -->
    <DatosGoto v-if="gotoOpen" @close="gotoOpen = false" />
  </div>
</template>

<style scoped>
.datos {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  padding: var(--d-frame);
  color: var(--d-ink);
  font-family: var(--font-text);
  font-size: var(--d-fs-ui);
  line-height: var(--d-lh);
  font-variant-numeric: tabular-nums;
  background-color: var(--d-paper);
}
.ruta, .req, kbd { font-family: var(--font-mono); font-size: var(--d-fs-mono); }

/* La ventana: consola fluida de ancho completo, sin límite artificial */
.ventana {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--d-rule-strong);
  background: var(--d-paper);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
}

.barra {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 0 var(--d-inset);
  border-bottom: 1px solid var(--d-rule);
  background: var(--d-surface);
}
.historia { display: flex; gap: 4px; }
.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--d-rule);
  background: var(--d-paper);
  color: var(--d-ink);
  font: inherit;
  font-size: 14px;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--d-dur) ease;
}
.nav-btn:hover { border-color: var(--d-sig); background: var(--d-hover); color: var(--d-sig); }
.nav-btn.off { color: var(--d-faint); opacity: 0.4; cursor: default; }
.nav-btn.off:hover { border-color: var(--d-rule); background: var(--d-paper); color: var(--d-faint); }

/* Barra de dirección */
.ruta {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--d-rule);
  background: var(--d-paper);
  white-space: nowrap;
  overflow: hidden;
  font-size: 12.5px;
}
.ruta a { color: var(--d-sig); text-decoration: none; padding: 6px 0; }
.ruta a:hover { text-decoration: underline; color: var(--d-sig-hover); }
.sep { color: var(--d-faint); padding: 0 9px; }
.here { color: var(--d-ink); font-weight: 700; }

.goto-btn {
  flex: 0 1 240px;
  min-width: 140px;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 8px 0 10px;
  border: 1px solid var(--d-rule);
  background: var(--d-paper);
  font: inherit;
  color: var(--d-dim);
  text-align: left;
  cursor: pointer;
  transition: all var(--d-dur) ease;
}
.goto-btn:hover { border-color: var(--d-sig); color: var(--d-ink); }
.goto-k { font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-sig); font-weight: 700; }
.goto-ph { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--d-faint); font-size: 12px; }

/* Barra Derecha: Telemetría y Tema */
.barra-derecha {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.telemetria-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  background: var(--d-paper);
  border: 1px solid var(--d-rule);
  font-family: var(--font-mono);
  font-size: 11px;
}
.tele-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--d-green);
  box-shadow: 0 0 6px var(--d-green);
}
.tele-text {
  font-weight: 800;
  color: var(--d-ink);
}
.tele-ms {
  color: var(--d-dim);
}

.theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: var(--d-paper);
  border: 1px solid var(--d-rule);
  color: var(--d-ink);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--d-dur) ease;
}
.theme-btn:hover {
  border-color: var(--d-sig);
  color: var(--d-sig);
}

kbd {
  display: inline-block;
  min-width: 18px;
  margin: 0 2px;
  padding: 1px 4px 0;
  border: 1px solid var(--d-rule);
  border-radius: 2px;
  line-height: 1.3;
  text-align: center;
  color: var(--d-dim);
  background: var(--d-surface);
}

.exp {
  flex: 1;
  min-height: 0;
  padding: var(--d-inset) var(--d-inset) 28px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--d-rule) transparent;
  perspective: 1200px;
  perspective-origin: 50% 40%;
}
.exp:focus { outline: none; }
.pane { animation: var(--d-dur) var(--d-ease) both; }
.pane.deeper { animation-name: acercar; }
.pane.up { animation-name: alejar; }
.pane.lateral { animation-name: correr; }
@keyframes acercar { from { transform: translateZ(calc(var(--d-z) * -1)); opacity: 0; } }
@keyframes alejar { from { transform: translateZ(var(--d-z)); opacity: 0; } }
@keyframes correr { from { transform: translateX(12px); opacity: 0; } }

/* Cuerpo de la Ventana: Split Horizontal Explorador + Contenido */
.cuerpo-ventana {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

/* Sidebar Explorador de Archivos */
.sidebar {
  flex: 0 0 240px;
  width: 240px;
  background: var(--d-surface);
  border-right: 1px solid var(--d-rule);
  display: flex;
  flex-direction: column;
  user-select: none;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--d-rule) transparent;
}

.sidebar-header {
  padding: 12px 14px 10px;
  border-bottom: 1px solid var(--d-rule);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--d-surface-raised);
}
.sidebar-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--d-sig);
}
.sidebar-status {
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--d-dim);
}

.sidebar-tree {
  flex: 1;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  color: var(--d-dim);
  text-decoration: none;
  font-family: var(--font-mono);
  font-size: 12px;
  border-left: 3px solid transparent;
  transition: all var(--d-dur) ease;
}
.sidebar-item:hover {
  background: var(--d-hover);
  color: var(--d-ink);
}
.sidebar-item.active {
  background: var(--d-hover);
  color: var(--d-ink);
  font-weight: 700;
  border-left-color: var(--d-sig);
}

.sidebar-icon {
  font-size: 13px;
  flex-shrink: 0;
  opacity: 0.85;
}
.sidebar-item.active .sidebar-icon {
  opacity: 1;
}

.sidebar-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sidebar-badge {
  font-size: 10px;
  padding: 1px 5px;
  border: 1px solid var(--d-rule);
  background: var(--d-paper);
  color: var(--d-dim);
  border-radius: 2px;
  font-variant-numeric: tabular-nums;
}
.sidebar-item.active .sidebar-badge {
  border-color: var(--d-sig);
  color: var(--d-sig);
  background: var(--d-surface-raised);
}

.sidebar-footer {
  padding: 12px 14px;
  border-top: 1px solid var(--d-rule);
  background: var(--d-surface-raised);
  font-family: var(--font-mono);
  font-size: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sf-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.sf-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--d-green);
  box-shadow: 0 0 5px var(--d-green);
}
.sf-status {
  font-weight: 700;
  color: var(--d-green);
}
.sf-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: var(--d-faint);
}
.sf-admin-link {
  color: var(--d-dim);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.15s;
  margin-top: 2px;
}
.sf-admin-link:hover {
  color: var(--d-sig);
}

/* Barra de estado */
.estado {
  flex: none;
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 34px;
  padding: 0 var(--d-inset);
  border-top: 1px solid var(--d-rule);
  background: var(--d-surface);
  color: var(--d-dim);
}
.medida { flex: none; font-family: var(--font-mono); font-size: 11px; white-space: nowrap; }
.req { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }
.keys { flex: none; margin-left: auto; display: flex; gap: 10px; align-items: center; flex-shrink: 0; }

@media (max-width: 900px) {
  .datos { height: auto; min-height: 100dvh; padding: 0; }
  .ventana { border-left: none; border-right: none; }
  .goto-btn {
    padding: 3px 8px;
    gap: 4px;
    font-size: 11px;
    min-width: 0;
  }
  .goto-btn .goto-ph,
  .goto-btn kbd {
    display: none;
  }
  .goto-btn .goto-k::after {
    content: ' ⌕';
  }
  .cuerpo-ventana {
    flex-direction: column;
    overflow: visible;
  }
  .sidebar {
    flex: none;
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--d-rule);
    overflow-x: auto;
    overflow-y: hidden;
  }
  .sidebar-header, .sidebar-footer {
    display: none;
  }
  .sidebar-tree {
    flex-direction: row;
    padding: 6px 10px;
    gap: 6px;
  }
  .sidebar-item {
    padding: 6px 10px;
    border-left: none;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
  }
  .sidebar-item.active {
    border-left: none;
    border-bottom-color: var(--d-sig);
  }
  .exp { overflow: visible; perspective: none; padding-bottom: 24px; }
  .keys { display: none; }
}

@media (max-width: 600px) {
  .telemetria-badge { display: none; }
  .barra { padding: 0 10px; gap: 6px; }
  .estado { padding: 0 10px; gap: 8px; }
}
</style>
