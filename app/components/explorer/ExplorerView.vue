<script setup lang="ts">
// Portafolio Técnico Mateo Sonzogni — Explorador de Datos Relacionales
// La raíz es la base de datos completa; las colecciones son carpetas; los registros son hojas técnicas.
// Navegación por teclado continua (flechas, Enter, Backspace, Esc, /, Cmd+K).
import ExplorerDetail from './ExplorerDetail.vue'
import ExplorerFolder from './ExplorerFolder.vue'
import ExplorerGoto from './ExplorerGoto.vue'
import ExplorerGuide from './ExplorerGuide.vue'
import AppIcon, { type IconName } from '~/components/ui/AppIcon.vue'
import { pad, resolveExplorer, type Explorer } from '~/lib/explorer'
import { routeFor } from '~/lib/path'

const api = useApi()
const route = useRoute()
const router = useRouter()
const { path, query } = useExplorerRoute()

// Selector reactivo de Tema (Obsidian Dark / Technical Paper)
const theme = ref<'dark' | 'light'>('dark')
const guideOpen = ref(false)

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  if (import.meta.client) {
    localStorage.setItem('portfolio-theme', theme.value)
    document.documentElement.setAttribute('data-theme', theme.value)
  }
}

// Idioma y Modo Hiperfoco
const { toggleLocale, isEs } = usePortfolioLocale()
const { isHyperfocus, toggleHyperfocus } = useHyperfocus()

// Reloj dinámico en tiempo real (UTC-3 Patagonia, Argentina)
const utcTime = ref('')
let clockTimer: ReturnType<typeof setInterval> | null = null

function updateClock() {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }
  utcTime.value = `${new Intl.DateTimeFormat('es-AR', options).format(now)} UTC-3`
}

onMounted(() => {
  if (import.meta.client) {
    updateClock()
    clockTimer = setInterval(updateClock, 1000)

    const saved = localStorage.getItem('portfolio-theme') as 'dark' | 'light' | null
    if (saved) {
      theme.value = saved
      document.documentElement.setAttribute('data-theme', saved)
    }
    else {
      document.documentElement.setAttribute('data-theme', 'dark')
    }

    // Orientación inicial no invasiva: abrir tras 1.8s únicamente si es desktop amplio y primera visita
    const guideSeen = localStorage.getItem('portfolio-guide-seen')
    if (!guideSeen && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setTimeout(() => {
        guideOpen.value = true
        localStorage.setItem('portfolio-guide-seen', 'true')
      }, 1800)
    }
  }
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
})

useHead({
  htmlAttrs: { 'data-portfolio': 'mateo-sonzogni' },
  meta: [{ name: 'theme-color', content: computed(() => (theme.value === 'dark' ? '#080808' : '#f7f6f2')) }],
  title: computed(() => ['mateo sonzogni', ...path.value].join(' / ')),
})
usePreloadFonts('datos')

const nuxtApp = useNuxtApp()
const { data: ex, error } = await useAsyncData<Explorer>(
  computed(() => `explorer${route.fullPath}`),
  () => resolveExplorer(api, path.value, route.query),
  {
    getCachedData(key) {
      return nuxtApp.isHydrating ? nuxtApp.payload.data[key] : nuxtApp.static.data[key]
    }
  }
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
    case '1':
      e.preventDefault()
      go(routeFor(['projects']))
      break
    case '2':
      e.preventDefault()
      go(routeFor(['experience']))
      break
    case '3':
      e.preventDefault()
      go(routeFor(['stack']))
      break
    case '4':
      e.preventDefault()
      go(routeFor(['about']))
      break
    case '5':
      e.preventDefault()
      go(routeFor(['contact']))
      break
    case '0':
      e.preventDefault()
      go(routeFor([]))
      break

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

    case 'h':
    case 'H':
      e.preventDefault()
      toggleHyperfocus()
      break

    case 'Backspace':
      if (ex.value.up) {
        e.preventDefault()
        go(ex.value.up, path.value[path.value.length - 1])
      }
      break

    case '?':
      e.preventDefault()
      guideOpen.value = !guideOpen.value
      break

    case 'Escape':
      if (guideOpen.value) {
        e.preventDefault()
        guideOpen.value = false
      }
      else if (gotoOpen.value) {
        e.preventDefault()
        gotoOpen.value = false
      }
      else if (isHyperfocus.value) {
        e.preventDefault()
        toggleHyperfocus()
      }
      else if (ex.value.up) {
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
  shortLabel: string
  to: Parameters<typeof routeFor>[0]
  badge: string
  keyHint: string
  icon: IconName
  desc: string
}

const navSections = computed<NavSection[]>(() => [
  { root: '', label: isEs.value ? 'db / raíz' : 'db / root', shortLabel: isEs.value ? 'Inicio' : 'Home', to: [], badge: 'SYS', keyHint: '0', icon: 'db', desc: isEs.value ? 'Resumen del sistema y arquitectura' : 'System overview & architecture' },
  { root: 'projects', label: isEs.value ? '01 · proyectos' : '01 · projects', shortLabel: isEs.value ? 'Proyectos' : 'Projects', to: ['projects'], badge: '06', keyHint: '1', icon: 'folder', desc: isEs.value ? 'Aplicaciones en producción' : 'Production applications' },
  { root: 'experience', label: isEs.value ? '02 · experiencia' : '02 · experience', shortLabel: 'Exp', to: ['experience'], badge: '07', keyHint: '2', icon: 'briefcase', desc: isEs.value ? 'Trayectoria profesional y roles' : 'Career history & roles' },
  { root: 'stack', label: isEs.value ? '03 · stack' : '03 · stack', shortLabel: 'Stack', to: ['stack'], badge: '22', keyHint: '3', icon: 'code', desc: isEs.value ? 'Tecnologías y lenguajes' : 'Technologies & languages' },
  { root: 'about', label: isEs.value ? '04 · sobre mí' : '04 · about me', shortLabel: isEs.value ? 'CV' : 'About', to: ['about'], badge: '13', keyHint: '4', icon: 'file', desc: isEs.value ? 'Perfil bio, formación y principios' : 'Bio, resume & principles' },
  { root: 'contact', label: isEs.value ? '05 · contacto' : '05 · contact', shortLabel: isEs.value ? 'Contacto' : 'Contact', to: ['contact'], badge: '06', keyHint: '5', icon: 'mail', desc: isEs.value ? 'Canales y disponibilidad' : 'Channels & availability' },
])

const currentRoot = computed(() => path.value[0] ?? '')
</script>

<template>
  <div class="datos flex flex-col h-dvh text-ink font-sans text-[13px] leading-normal tabular-nums bg-paper">
    <div class="ventana flex-1 min-h-0 w-full flex flex-col bg-paper [background-image:radial-gradient(var(--d-grid-cross)_1.2px,transparent_1.2px)] [background-size:32px_32px]">
      <!-- Barra Superior de Herramientas -->
      <header class="barra flex-none flex items-center gap-3 min-h-[52px] px-3.5 border-b border-rule bg-surface">
        <nav class="historia flex gap-1" aria-label="Historial">
          <button
            type="button"
            class="nav-btn inline-flex items-center justify-center w-[30px] h-[30px] border border-rule bg-paper text-ink text-sm no-underline cursor-pointer transition-colors duration-150 hover:border-sig hover:bg-hover hover:text-sig"
            aria-label="atrás"
            @click="router.back()"
          >
            <AppIcon name="arrow-left" :size="13" />
          </button>
          <button
            type="button"
            class="nav-btn inline-flex items-center justify-center w-[30px] h-[30px] border border-rule bg-paper text-ink text-sm no-underline cursor-pointer transition-colors duration-150 hover:border-sig hover:bg-hover hover:text-sig"
            aria-label="adelante"
            @click="router.forward()"
          >
            <AppIcon name="arrow-right" :size="13" />
          </button>
          <NuxtLink
            v-if="ex?.up"
            :to="ex.up"
            class="nav-btn inline-flex items-center justify-center w-[30px] h-[30px] border border-rule bg-paper text-ink text-sm no-underline cursor-pointer transition-colors duration-150 hover:border-sig hover:bg-hover hover:text-sig"
            aria-label="subir un nivel"
          >
            <AppIcon name="arrow-up" :size="13" />
          </NuxtLink>
          <span
            v-else
            class="nav-btn off inline-flex items-center justify-center w-[30px] h-[30px] border border-rule bg-paper text-faint opacity-40 cursor-default"
            aria-hidden="true"
          >
            <AppIcon name="arrow-up" :size="13" />
          </span>
        </nav>

        <!-- Ruta / Breadcrumb -->
        <nav class="ruta flex-1 flex items-center min-w-0 h-[30px] px-2.5 border border-rule bg-paper whitespace-nowrap overflow-hidden text-[12.5px] font-mono" aria-label="Ruta">
          <template v-for="(seg, i) in segments" :key="seg.label + i">
            <span v-if="i" class="sep text-faint px-2" aria-hidden="true">/</span>
            <NuxtLink v-if="i < segments.length - 1" :to="seg.to" class="text-sig hover:underline hover:text-sig-hover py-1.5">{{ seg.label }}</NuxtLink>
            <span v-else class="here text-ink font-bold" aria-current="page">{{ seg.label }}</span>
          </template>
        </nav>

        <!-- Botón de Búsqueda Rápida / Goto -->
        <button
          class="goto-btn flex-[0_1_240px] min-w-[140px] flex items-center gap-2 h-[30px] px-2 border border-rule bg-paper text-dim text-left cursor-pointer transition-colors duration-150 hover:border-sig hover:text-ink max-sm:hidden"
          type="button"
          :title="isEs ? 'Abrir paleta de comandos (⌘K o /)' : 'Open command palette (⌘K or /)'"
          @click="gotoOpen = true"
        >
          <AppIcon name="search" :size="12" class="goto-search-icon text-dim shrink-0" />
          <span class="goto-k text-sig font-bold font-mono text-[11px]">{{ isEs ? 'ir a' : 'goto' }}</span>
          <span class="goto-ph flex-1 min-w-0 text-faint text-[12px] overflow-hidden text-ellipsis whitespace-nowrap">{{ isEs ? 'proyecto, tecnología, sección…' : 'project, tech, section…' }}</span>
          <kbd class="font-mono text-[10px] text-dim border border-rule px-1.5 py-0.5 rounded-[2px]">/</kbd>
        </button>

        <!-- Acciones Rápidas del Sistema: Idioma, Hiperfoco, Reloj UTC-3, Telemetría y Tema -->
        <div class="barra-derecha flex items-center gap-2 shrink-0 ml-auto">
          <!-- Switch de Idioma ES / EN -->
          <button
            type="button"
            class="lang-btn inline-flex items-center gap-1 h-[30px] px-2 border border-rule bg-paper font-mono text-[11px] font-bold text-dim cursor-pointer hover:border-sig hover:text-ink transition-colors duration-150"
            :title="isEs ? 'Switch interface to English' : 'Cambiar interfaz a Español'"
            :aria-label="isEs ? 'Switch to English' : 'Cambiar a Español'"
            @click="toggleLocale"
          >
            <span class="lang-code" :class="{ 'text-sig font-bold': isEs }">ES</span>
            <span class="lang-sep text-faint">/</span>
            <span class="lang-code" :class="{ 'text-sig font-bold': !isEs }">EN</span>
          </button>

          <!-- Toggle de Modo Hiperfoco -->
          <button
            type="button"
            class="tool-btn focus-btn inline-flex items-center justify-center w-[30px] h-[30px] border border-rule bg-paper text-dim cursor-pointer transition-colors duration-150 hover:border-sig hover:text-sig hover:bg-hover"
            :class="{ '!border-sig !text-sig !bg-sig/10': isHyperfocus }"
            :title="isHyperfocus ? (isEs ? 'Desactivar Modo Hiperfoco (H)' : 'Disable Hyperfocus (H)') : (isEs ? 'Activar Modo Hiperfoco (H)' : 'Enable Hyperfocus (H)')"
            :aria-label="isHyperfocus ? 'Desactivar hiperfoco' : 'Activar hiperfoco'"
            @click="toggleHyperfocus"
          >
            <AppIcon name="zap" :size="13" />
          </button>

          <!-- Botón de Guía y Orientación Rápida -->
          <button
            type="button"
            class="tool-btn help-btn inline-flex items-center justify-center w-[30px] h-[30px] border border-rule bg-paper text-dim cursor-pointer transition-colors duration-150 hover:border-sig hover:text-sig hover:bg-hover"
            :class="{ '!border-sig !text-sig !bg-sig/10': guideOpen }"
            :title="guideOpen ? (isEs ? 'Cerrar guía (?)' : 'Close guide (?)') : (isEs ? 'Guía rápida y atajos (?)' : 'Quick guide & shortcuts (?)')"
            :aria-label="isEs ? 'Guía rápida' : 'Quick guide'"
            @click="guideOpen = !guideOpen"
          >
            <AppIcon name="help" :size="13" />
          </button>

          <!-- Estado del Sistema Consolidado (PG-17 + Latencia + Hora Patagonia UTC-3) -->
          <div
            class="sys-status-badge hidden sm:flex items-center gap-1.5 h-[30px] px-2 border border-rule bg-paper font-mono text-[10.5px] text-dim"
            :title="`PostgreSQL 17 ACID (${ex?.request.ms ?? 0}ms) · Hora local: ${utcTime || 'UTC-3'} (Patagonia, Argentina)`"
          >
            <span class="sys-dot w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_6px_var(--d-green)] animate-pulse" />
            <span class="sys-engine text-ink font-semibold">PG-17</span>
            <span class="sys-sep text-faint">·</span>
            <span class="sys-ms text-sig font-bold">{{ ex?.request.ms ?? 0 }}ms</span>
            <span class="sys-sep text-faint">·</span>
            <span class="sys-time text-dim">{{ utcTime?.split(' ')[0] || '12:00:00' }}</span>
          </div>

          <button
            type="button"
            class="tool-btn theme-btn inline-flex items-center justify-center w-[30px] h-[30px] border border-rule bg-paper text-dim cursor-pointer transition-colors duration-150 hover:border-sig hover:text-sig hover:bg-hover"
            :aria-label="theme === 'dark' ? 'Cambiar a modo claro (papel técnico)' : 'Cambiar a modo oscuro (obsidiana)'"
            :title="`Cambiar a modo ${theme === 'dark' ? 'claro (papel)' : 'oscuro (obsidiana)'}`"
            @click="toggleTheme"
          >
            <AppIcon v-if="theme === 'dark'" name="sun" :size="14" />
            <AppIcon v-else name="moon" :size="14" />
          </button>
        </div>
      </header>

      <!-- Barra de Notificación / Indicador de Modo Hiperfoco -->
      <div v-if="isHyperfocus" class="hiperfoco-banner px-4 py-2 bg-sig text-white border-b border-sig flex items-center justify-center text-xs font-mono font-bold" role="status" aria-live="polite">
        <div class="hb-center flex items-center gap-3">
          <span class="hb-title tracking-wider">{{ isEs ? 'HIPERFOCO // LECTURA ZEN' : 'HYPERFOCUS // ZEN READING' }}</span>
          <span class="hb-sep text-white/60">·</span>
          <button
            type="button"
            class="hb-exit-btn inline-flex items-center gap-1.5 px-2 py-0.5 bg-black/30 border border-white/40 text-white text-[11px] font-mono cursor-pointer hover:bg-black/50 rounded-[2px]"
            :title="isEs ? 'Desactivar Modo Hiperfoco (H o Esc)' : 'Exit Hyperfocus Mode (H or Esc)'"
            @click="toggleHyperfocus"
          >
            <span>{{ isEs ? 'SALIR' : 'EXIT' }}</span>
            <kbd class="text-[9.5px] opacity-75">H / ESC</kbd>
          </button>
        </div>
      </div>

      <!-- Cuerpo de la Ventana: Sidebar Explorador + Escenario Central -->
      <div class="cuerpo-ventana flex-1 min-h-0 grid grid-cols-[240px_1fr] max-lg:grid-cols-1 overflow-hidden">
        <aside class="sidebar w-[240px] max-lg:hidden flex flex-col border-r border-rule bg-surface overflow-y-auto" aria-label="Explorador de Archivos">
          <div class="sidebar-header p-3 px-3.5 border-b border-rule flex items-center justify-between font-mono text-[11px]">
            <span class="sidebar-tag text-sig font-bold tracking-wider text-[10px]">{{ isEs ? 'EXPLORADOR' : 'EXPLORER' }}</span>
            <span class="sidebar-status text-faint text-[10px]">PG-17 // DB</span>
          </div>

          <nav class="sidebar-tree p-2 flex flex-col gap-1" aria-label="Secciones del sistema">
            <NuxtLink
              v-for="s in navSections"
              :key="s.root"
              :to="routeFor(s.to)"
              class="sidebar-item flex items-center gap-2.5 px-2.5 py-2 rounded-[2px] text-dim text-[12px] font-medium no-underline transition-colors duration-150 hover:bg-hover hover:text-ink group"
              :class="{ 'active !bg-sig !text-white font-semibold hover:!bg-sig hover:!text-white': currentRoot === s.root }"
              :title="`${s.desc} — Atajo [${s.keyHint}]`"
            >
              <AppIcon :name="s.icon" :size="14" class="sidebar-icon shrink-0" />
              <span class="sidebar-label flex-1 truncate">{{ s.label }}</span>
              <kbd class="sidebar-k font-mono text-[10px] opacity-60 group-hover:opacity-100 border border-current px-1 py-0.5 rounded-[2px]">{{ s.keyHint }}</kbd>
              <span class="sidebar-badge font-mono text-[10px] px-1.5 py-0.5 bg-paper text-dim border border-rule rounded-[2px]" :class="{ '!bg-white/20 !text-white !border-transparent': currentRoot === s.root }">{{ s.badge }}</span>
            </NuxtLink>
          </nav>

          <div class="sidebar-footer mt-auto p-3 border-t border-rule bg-surface-raised flex flex-col gap-1.5 font-mono text-[10px]">
            <div class="sf-row flex items-center gap-1.5">
              <span class="sf-dot w-1.5 h-1.5 rounded-full bg-green" />
              <span class="sf-status text-green font-bold">{{ isEs ? 'DISPONIBLE // 2026' : 'AVAILABLE // 2026' }}</span>
            </div>
            <div class="sf-info flex justify-between items-center text-faint">
              <span>{{ isEs ? 'MOTOR: POSTGRESQL 17' : 'ENGINE: POSTGRESQL 17' }}</span>
              <button
                type="button"
                class="sf-guide-btn bg-transparent border-0 p-0 text-sig hover:underline cursor-pointer"
                :title="isEs ? 'Abrir guía rápida de navegación (?)' : 'Open quick navigation guide (?)'"
                @click="guideOpen = !guideOpen"
              >
                {{ isEs ? 'GUÍA RÁPIDA (?)' : 'QUICK GUIDE (?)' }}
              </button>
            </div>
          </div>
        </aside>

        <main id="contenido" class="exp flex-1 min-w-0 min-h-0 overflow-y-auto p-5 max-md:p-3 focus:outline-none" tabindex="-1">
          <div v-if="error" class="pane w-full">
            <ExplorerDetail
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
          <div v-else-if="ex" ref="pane" :key="route.fullPath" class="pane w-full" :class="dir">
            <ExplorerFolder v-if="folder" :folder="folder" />
            <ExplorerDetail v-else-if="detail" :detail="detail" :prev="ex.prev" :next="ex.next" />
          </div>
        </main>
      </div>

      <!-- Barra de Estado Inferior -->
      <footer class="estado flex-none h-[30px] px-3.5 border-t border-rule bg-surface flex items-center justify-between text-[11px] font-mono text-dim select-none max-lg:hidden">
        <span v-if="ex" class="medida">{{ pad(ex.request.count) }} {{ ex.request.count === 1 ? 'record' : 'records' }}</span>
        <span v-if="ex" class="req">{{ ex.request.line }} · {{ ex.request.status }} · {{ ex.request.ms }} ms</span>
        <span class="keys flex items-center gap-3" aria-hidden="true">
          <template v-if="hoja && (ex?.prev || ex?.next)"><kbd class="border border-rule px-1 py-0.5 rounded-[2px]">←</kbd><kbd class="border border-rule px-1 py-0.5 rounded-[2px]">→</kbd> {{ isEs ? 'vecino' : 'adjacent' }}</template>
          <template v-else-if="!hoja"><kbd class="border border-rule px-1 py-0.5 rounded-[2px]">←</kbd><kbd class="border border-rule px-1 py-0.5 rounded-[2px]">↑</kbd><kbd class="border border-rule px-1 py-0.5 rounded-[2px]">↓</kbd><kbd class="border border-rule px-1 py-0.5 rounded-[2px]">→</kbd> {{ isEs ? 'navegar' : 'navigate' }} <kbd class="border border-rule px-1 py-0.5 rounded-[2px]">↵</kbd> {{ isEs ? 'abrir' : 'open' }}</template>
          <template v-if="ex?.up"><kbd class="border border-rule px-1 py-0.5 rounded-[2px]">⌫</kbd> {{ isEs ? 'volver' : 'back' }}</template>
          <kbd class="border border-rule px-1 py-0.5 rounded-[2px]">0-5</kbd> {{ isEs ? 'secciones' : 'sections' }}
          <kbd class="border border-rule px-1 py-0.5 rounded-[2px]">/</kbd> {{ isEs ? 'ir a' : 'goto' }}
          <kbd class="border border-rule px-1 py-0.5 rounded-[2px]">H</kbd> {{ isEs ? 'hiperfoco' : 'hyperfocus' }}
          <button
            type="button"
            class="keys-guide-btn bg-transparent border-0 p-0 text-dim hover:text-sig cursor-pointer flex items-center gap-1 font-mono text-[11px]"
            :title="isEs ? 'Abrir guía rápida (?)' : 'Open quick guide (?)'"
            @click="guideOpen = !guideOpen"
          >
            <kbd class="border border-rule px-1 py-0.5 rounded-[2px]">?</kbd> {{ isEs ? 'guía' : 'guide' }}
          </button>
        </span>
      </footer>

      <!-- Barra de Navegación Inferior Móvil (Thumb-friendly Bottom App Bar) -->
      <nav class="mobile-nav lg:hidden flex-none h-14 bg-surface border-t border-rule flex items-center justify-around z-20" aria-label="Navegación rápida móvil">
        <NuxtLink
          v-for="s in navSections"
          :key="s.root"
          :to="routeFor(s.to)"
          class="mobile-nav-item flex flex-col items-center justify-center flex-1 h-full text-dim no-underline transition-colors duration-150 relative"
          :class="{ 'active !text-sig font-bold': currentRoot === s.root }"
        >
          <AppIcon :name="s.icon" :size="18" class="mn-icon" />
          <span class="mn-label text-[10px] font-mono mt-0.5">{{ s.shortLabel }}</span>
          <span v-if="currentRoot === s.root" class="mn-indicator absolute bottom-0 inset-x-4 h-0.5 bg-sig rounded-full" aria-hidden="true" />
        </NuxtLink>
      </nav>
    </div>

    <!-- Modal de Búsqueda Rápida / Goto -->
    <ExplorerGoto v-if="gotoOpen" @close="gotoOpen = false" />

    <!-- Guía de Orientación Rápida Flotante (No Invasiva) -->
    <ExplorerGuide :open="guideOpen" @close="guideOpen = false" />
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

/* La ventana: consola fluida de ancho completo con retícula blueprint */
.ventana {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  border: none;
  background-color: var(--d-paper);
  background-image: radial-gradient(var(--d-grid-cross) 1.2px, transparent 1.2px);
  background-size: 32px 32px;
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

/* Barra Derecha: Telemetría, Reloj y Tema */
.barra-derecha {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.sys-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  background: var(--d-paper);
  border: 1px solid var(--d-rule);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-dim);
  user-select: none;
  transition: all var(--d-dur) ease;
}
.sys-status-badge:hover {
  border-color: var(--d-rule-strong);
  color: var(--d-ink);
}
.sys-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--d-green);
  box-shadow: 0 0 6px var(--d-green);
  flex-shrink: 0;
}
.sys-engine {
  font-weight: 800;
  color: var(--d-ink);
}
.sys-sep {
  color: var(--d-faint);
  font-size: 10px;
}
.sys-ms {
  color: var(--d-dim);
}
.sys-time {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--d-ink);
}

.tool-btn {
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
.tool-btn:hover {
  border-color: var(--d-sig);
  color: var(--d-sig);
}

.focus-btn.active {
  border-color: var(--d-sig);
  color: var(--d-sig);
  background: var(--d-hover);
  box-shadow: 0 0 8px var(--d-sig-glow);
}

.help-btn.active {
  border-color: var(--d-sig);
  color: var(--d-sig);
  background: var(--d-hover);
  box-shadow: 0 0 8px var(--d-sig-glow);
}

.lang-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 30px;
  padding: 0 8px;
  background: var(--d-paper);
  border: 1px solid var(--d-rule);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--d-dim);
  cursor: pointer;
  transition: all var(--d-dur) ease;
}
.lang-btn:hover {
  border-color: var(--d-sig);
}
.lang-code.active {
  color: var(--d-sig);
}
.lang-sep {
  color: var(--d-faint);
  margin: 0 1px;
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
  flex: 0 0 264px;
  width: 264px;
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
  flex-shrink: 0;
  opacity: 0.7;
  color: var(--d-dim);
  transition: all var(--d-dur) ease;
}
.sidebar-item:hover .sidebar-icon,
.sidebar-item.active .sidebar-icon {
  opacity: 1;
  color: var(--d-sig);
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

.sidebar-k {
  font-size: 9.5px;
  padding: 1px 4px;
  min-width: 14px;
  border: 1px solid var(--d-rule);
  background: var(--d-paper);
  color: var(--d-faint);
  border-radius: 2px;
  margin: 0;
  line-height: 1.1;
  text-align: center;
  transition: all var(--d-dur) ease;
}
.sidebar-item:hover .sidebar-k,
.sidebar-item.active .sidebar-k {
  border-color: var(--d-sig);
  color: var(--d-sig);
  background: var(--d-hover);
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

.sf-guide-btn {
  background: transparent;
  border: 1px solid var(--d-rule);
  border-radius: 2px;
  color: var(--d-sig);
  font-family: inherit;
  font-size: 9.5px;
  font-weight: 700;
  padding: 3px 6px;
  cursor: pointer;
  text-align: left;
  transition: all var(--d-dur) ease;
  margin-top: 2px;
}
.sf-guide-btn:hover {
  background: var(--d-hover);
  border-color: var(--d-sig);
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

.keys-guide-btn {
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: 11px;
  color: var(--d-dim);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  cursor: pointer;
  border-radius: 2px;
  transition: color var(--d-dur) ease;
}
.keys-guide-btn:hover {
  color: var(--d-sig);
}
.keys-guide-btn:hover kbd {
  border-color: var(--d-sig);
  color: var(--d-sig);
}

/* Mobile Bottom App Navigation (Oculto en Desktop) */
.mobile-nav {
  display: none;
}

@media screen and (max-width: 900px) {
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
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* NATIVE MOBILE SMARTPHONE EXPERIENCE (<= 768px)                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
@media screen and (max-width: 768px) {
  .sidebar {
    display: none !important;
  }

  /* Barra Superior de Herramientas Compacta y Móvil */
  .barra {
    padding: 0 8px;
    gap: 6px;
    min-height: 44px;
    max-width: 100vw;
    box-sizing: border-box;
    overflow: hidden;
  }
  .historia {
    gap: 3px;
  }
  .nav-btn {
    width: 30px;
    height: 30px;
  }
  .ruta {
    height: 30px;
    padding: 0 6px;
    font-size: 11px;
    min-width: 0;
    max-width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .goto-btn {
    flex: none;
    height: 30px;
    padding: 0 6px;
    min-width: 0;
  }
  .barra-derecha {
    gap: 6px;
    flex-shrink: 0;
  }
  .tool-btn,
  .lang-btn,
  .theme-btn {
    height: 30px;
  }
  .tool-btn,
  .theme-btn {
    width: 30px;
  }
  .lang-btn {
    padding: 0 6px;
    font-size: 10px;
  }
  .telemetria-badge,
  .clock-badge,
  .sys-status-badge {
    display: none !important;
  }

  .cuerpo-ventana {
    flex-direction: column;
    overflow: visible;
    max-width: 100vw;
  }

  .exp {
    padding: 8px 8px calc(76px + env(safe-area-inset-bottom, 0px)) !important;
    overflow: visible;
    perspective: none;
    max-width: 100vw;
  }

  /* Barra de Estado inferior se oculta en mobile en favor del Tab Bar */
  .estado {
    display: none !important;
  }

  /* Fixed Bottom Tab Bar: Ergonomía del pulgar, Safe Area, Blurring */
  .mobile-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: calc(54px + env(safe-area-inset-bottom, 0px));
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: rgba(10, 10, 10, 0.94);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid var(--d-rule-strong);
    z-index: 100;
    align-items: stretch;
    justify-content: space-around;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
  }
  html[data-theme="light"] .mobile-nav {
    background: rgba(247, 246, 242, 0.96);
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  }

  .mobile-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    color: var(--d-dim);
    text-decoration: none;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.02em;
    position: relative;
    padding: 6px 2px;
    transition: all var(--d-dur) ease;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .mobile-nav-item:active {
    background: var(--d-hover);
    transform: scale(0.96);
  }
  .mobile-nav-item.active {
    color: var(--d-sig);
  }
  .mn-icon {
    font-size: 17px;
    transition: transform 0.15s ease;
  }
  .mobile-nav-item.active .mn-icon {
    transform: translateY(-1px);
    color: var(--d-sig);
  }
  .mn-indicator {
    position: absolute;
    top: 0;
    left: 18%;
    right: 18%;
    height: 2px;
    background: var(--d-sig);
    border-radius: 0 0 2px 2px;
  }
}

@media screen and (max-width: 480px) {
  .historia .nav-btn:nth-child(2),
  .historia .nav-btn:nth-child(3) {
    display: none;
  }
  .ruta {
    max-width: 100px;
  }
  .focus-btn {
    display: none !important;
  }
  .barra {
    gap: 4px;
    padding: 0 5px;
  }
}

/* ─── Banner Superior de Modo Hiperfoco ────────────────────────────────────── */
.hiperfoco-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  background: transparent;
  color: var(--d-dim);
  font-family: var(--font-mono);
  font-size: 11px;
  z-index: 10;
}
.hb-center {
  display: flex;
  align-items: center;
  gap: 12px;
}
.hb-title {
  color: var(--d-dim);
  font-weight: 700;
  letter-spacing: 0.06em;
}
.hb-sep {
  color: var(--d-faint);
}
.hb-exit-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  background: transparent;
  border: none;
  color: var(--d-ink);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
  transition: opacity var(--d-dur) ease;
}
.hb-exit-btn:hover {
  opacity: 0.7;
}
.hb-exit-btn kbd {
  background: transparent;
  border: none;
  font-size: 10px;
  color: var(--d-dim);
}

@media print {
  .datos,
  .ventana,
  .cuerpo-ventana,
  .exp,
  .pane {
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    background: transparent !important;
    overflow: visible !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    box-shadow: none !important;
  }
}
</style>
