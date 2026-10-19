<script setup lang="ts">
// Portafolio Técnico Mateo Sonzogni — Explorador de Datos Relacionales
// La raíz es la base de datos completa; las colecciones son carpetas; los registros son hojas técnicas.
// Navegación por teclado continua (flechas, Enter, Backspace, Esc, /, Cmd+K).
import ExplorerDetail from './ExplorerDetail.vue'
import ExplorerFolder from './ExplorerFolder.vue'
import ExplorerGoto from './ExplorerGoto.vue'
import ExplorerGuide from './ExplorerGuide.vue'
import AppIcon, { type IconName } from '~/components/ui/AppIcon.vue'
import UiLineSidebar, { type LineSidebarItem } from '~/components/ui/UiLineSidebar.vue'
import UiTelemetryPill from '~/components/ui/UiTelemetryPill.vue'
import { useBenchoSound } from '~/composables/useBenchoSound'
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

// Idioma, Modo Hiperfoco y Sonido Táctil Bencho
const { toggleLocale, isEs } = usePortfolioLocale()
const { isHyperfocus, toggleHyperfocus } = useHyperfocus()
const { soundEnabled, toggleSound } = useBenchoSound()

// Reloj dinámico en tiempo real (UTC-3 Patagonia, Argentina)
const utcTime = ref('')
let clockTimer: ReturnType<typeof setInterval> | null = null
let guideTimer: ReturnType<typeof setTimeout> | null = null

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
      guideTimer = setTimeout(() => {
        guideOpen.value = true
        localStorage.setItem('portfolio-guide-seen', 'true')
      }, 1800)
    }
  }
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (guideTimer) clearTimeout(guideTimer)
})

useHead({
  htmlAttrs: { 'data-portfolio': 'mateo-sonzogni' },
  meta: [{ name: 'theme-color', content: computed(() => (theme.value === 'dark' ? '#080808' : '#f7f6f2')) }],
  title: computed(() => ['mateo sonzogni', ...path.value].join(' / ')),
})
usePreloadFonts('datos')

const nuxtApp = useNuxtApp()

const { data: schemaSummary } = await useAsyncData(
  'schema-summary',
  () => api.schema(),
  {
    getCachedData(key) {
      return nuxtApp.isHydrating ? nuxtApp.payload.data[key] : nuxtApp.static.data[key]
    }
  }
)

const liveCounts = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {}
  if (schemaSummary.value?.data) {
    for (const item of schemaSummary.value.data) {
      map[item.key] = item.count
    }
  }
  const extraCounts = (schemaSummary.value as unknown as { counts?: Record<string, number> })?.counts
  if (extraCounts) {
    Object.assign(map, extraCounts)
  }
  return map
})

const { data: ex, error } = await useAsyncData<Explorer>(
  computed(() => `explorer${route.fullPath}`),
  () => {
    const q = { ...route.query }
    if (typeof route.query.org === 'string') {
      q.org = route.query.org
    }
    return resolveExplorer(api, path.value, q, schemaSummary.value)
  },
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

const detailSummary = computed(() => {
  if (!detail.value) return null
  const summaryRow = detail.value.rows.find(r => ['summary', 'brief', 'tagline', 'note', 'about_text'].includes(r.name))
  return summaryRow?.value || `${detail.value.name} — Dossier de ingeniería y especificación técnica en el portafolio de Mateo Sonzogni.`
})

useSeoMeta({
  title: computed(() => detail.value ? `${detail.value.name} — Mateo Sonzogni` : ['mateo sonzogni', ...path.value].join(' / ')),
  ogTitle: computed(() => detail.value ? `${detail.value.name} — Mateo Sonzogni` : ['mateo sonzogni', ...path.value].join(' / ')),
  description: computed(() => detailSummary.value || 'Portafolio técnico y base de datos relacional de ingeniería de Mateo Sonzogni.'),
  ogDescription: computed(() => detailSummary.value || 'Portafolio técnico y base de datos relacional de ingeniería de Mateo Sonzogni.'),
  ogType: computed(() => (detail.value?.type === 'Article' ? 'article' : 'website')),
})

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
      go(routeFor(['articles']))
      break
    case '5':
      e.preventDefault()
      go(routeFor(['about']))
      break
    case '6':
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
  { root: 'projects', label: isEs.value ? '01 · proyectos' : '01 · projects', shortLabel: isEs.value ? 'Proy' : 'Work', to: ['projects'], badge: pad(liveCounts.value.projects ?? 6), keyHint: '1', icon: 'folder', desc: isEs.value ? 'Aplicaciones en producción' : 'Production applications' },
  { root: 'experience', label: isEs.value ? '02 · experiencia' : '02 · experience', shortLabel: 'Exp', to: ['experience'], badge: pad(liveCounts.value.experience ?? 6), keyHint: '2', icon: 'briefcase', desc: isEs.value ? 'Trayectoria profesional y roles' : 'Career history & roles' },
  { root: 'stack', label: isEs.value ? '03 · stack' : '03 · stack', shortLabel: 'Stack', to: ['stack'], badge: pad(liveCounts.value.stack ?? 22), keyHint: '3', icon: 'code', desc: isEs.value ? 'Tecnologías y lenguajes' : 'Technologies & languages' },
  { root: 'articles', label: isEs.value ? '04 · artículos' : '04 · articles', shortLabel: 'Blog', to: ['articles'], badge: pad(liveCounts.value.articles ?? 0), keyHint: '4', icon: 'file', desc: isEs.value ? 'Publicaciones técnicas y blog de ingeniería' : 'Technical articles & engineering blog' },
  { root: 'about', label: isEs.value ? '05 · sobre mí' : '05 · about me', shortLabel: 'CV', to: ['about'], badge: pad(liveCounts.value.about ?? 13), keyHint: '5', icon: 'user', desc: isEs.value ? 'Perfil bio, formación y principios' : 'Bio, resume & principles' },
  { root: 'contact', label: isEs.value ? '06 · contacto' : '06 · contact', shortLabel: isEs.value ? 'Mail' : 'Contact', to: ['contact'], badge: pad(liveCounts.value.contact ?? 7), keyHint: '6', icon: 'mail', desc: isEs.value ? 'Canales y disponibilidad' : 'Channels & availability' },
])

const currentRoot = computed(() => path.value[0] ?? '')

const lineSidebarItems = computed<LineSidebarItem[]>(() =>
  navSections.value.map(s => ({
    key: s.root,
    num: s.root === '' ? '00' : s.keyHint.padStart(2, '0'),
    label: s.label.replace(/^0\d\s*·\s*/, ''),
    count: s.badge,
    to: routeFor(s.to),
    shortcut: s.keyHint,
    isRoot: s.root === '',
  })),
)

const activeQueryFilters = computed(() => {
  const filters: Record<string, string | undefined> = {}
  for (const [key, val] of Object.entries(route.query)) {
    if (typeof val === 'string') {
      filters[key] = val
    }
  }
  return filters
})
</script>

<template>
  <div class="datos flex flex-col h-dvh text-ink font-sans text-[13px] leading-normal tabular-nums bg-paper">
    <div class="ventana flex-1 min-h-0 w-full flex flex-col bg-paper [background-image:radial-gradient(var(--d-grid-cross)_1.2px,transparent_1.2px)] [background-size:32px_32px]">
      <!-- Barra Superior de Herramientas (Linear / Bencho.dev Minimal Shell) -->
      <header class="barra flex-none flex items-center justify-between gap-1.5 sm:gap-2.5 min-h-[46px] sm:min-h-[48px] px-2.5 sm:px-4 border-b border-rule bg-surface/75 backdrop-blur-md w-full max-w-full overflow-hidden">
        <nav class="historia flex gap-1" aria-label="Historial">
          <button
            type="button"
            class="nav-btn inline-flex items-center justify-center w-7 h-7 rounded-md border border-rule bg-paper/70 text-dim text-sm no-underline cursor-pointer transition-all duration-150 hover:border-rule-strong hover:bg-hover hover:text-ink active:scale-[0.96]"
            aria-label="atrás"
            @click="router.back()"
          >
            <AppIcon name="arrow-left" :size="13" />
          </button>
          <button
            type="button"
            class="nav-btn hidden sm:inline-flex items-center justify-center w-7 h-7 rounded-md border border-rule bg-paper/70 text-dim text-sm no-underline cursor-pointer transition-all duration-150 hover:border-rule-strong hover:bg-hover hover:text-ink active:scale-[0.96]"
            aria-label="adelante"
            @click="router.forward()"
          >
            <AppIcon name="arrow-right" :size="13" />
          </button>
          <NuxtLink
            v-if="ex?.up"
            :to="ex.up"
            class="nav-btn inline-flex items-center justify-center w-7 h-7 rounded-md border border-rule bg-paper/70 text-dim text-sm no-underline cursor-pointer transition-all duration-150 hover:border-rule-strong hover:bg-hover hover:text-ink active:scale-[0.96]"
            aria-label="subir un nivel"
          >
            <AppIcon name="arrow-up" :size="13" />
          </NuxtLink>
          <span
            v-else
            class="nav-btn off inline-flex items-center justify-center w-7 h-7 rounded-md border border-rule bg-paper/40 text-faint opacity-35 cursor-default"
            aria-hidden="true"
          >
            <AppIcon name="arrow-up" :size="13" />
          </span>
        </nav>

        <!-- Ruta / Breadcrumb -->
        <nav class="ruta flex-1 flex items-center min-w-0 h-7 px-2.5 rounded-md border border-rule bg-paper/60 whitespace-nowrap overflow-hidden text-[11px] sm:text-[12px] font-mono truncate" aria-label="Ruta">
          <span class="w-1.5 h-1.5 rounded-full bg-sig mr-2 shrink-0 opacity-85" aria-hidden="true" />
          <template v-for="(seg, i) in segments" :key="seg.label + i">
            <span v-if="i" class="sep text-faint px-1.5" aria-hidden="true">/</span>
            <NuxtLink v-if="i < segments.length - 1" :to="seg.to" class="text-dim hover:text-ink no-underline transition-colors py-1">{{ seg.label }}</NuxtLink>
            <span v-else class="here text-ink font-medium" aria-current="page">{{ seg.label }}</span>
          </template>
        </nav>

        <!-- Botón de Búsqueda Rápida / Goto (Estilo Linear ⌘K) -->
        <button
          class="goto-btn group flex-[0_1_230px] min-w-[140px] hidden sm:flex items-center gap-2 h-7 px-2.5 rounded-md border border-rule bg-paper/60 text-dim text-left cursor-pointer transition-all duration-150 hover:border-rule-strong hover:bg-hover/60 hover:text-ink active:scale-[0.99]"
          type="button"
          :title="isEs ? 'Abrir paleta de comandos (⌘K o /)' : 'Open command palette (⌘K or /)'"
          @click="gotoOpen = true"
        >
          <AppIcon name="search" :size="12" class="goto-search-icon text-faint shrink-0 group-hover:text-ink transition-colors duration-150" />
          <span class="goto-ph flex-1 min-w-0 text-dim text-[11.5px] overflow-hidden text-ellipsis whitespace-nowrap">{{ isEs ? 'Buscar proyecto, stack…' : 'Search project, stack…' }}</span>
          <kbd class="font-mono text-[10px] text-faint bg-surface px-1.5 py-0.5 rounded border border-rule group-hover:text-ink transition-colors duration-150">/</kbd>
        </button>

        <!-- Acciones Rápidas del Sistema: Idioma, Hiperfoco, Reloj UTC-3, Telemetría y Tema -->
        <div class="barra-derecha flex items-center gap-1.5 shrink-0 ml-auto">
          <!-- Switch de Idioma ES / EN -->
          <button
            type="button"
            class="lang-btn inline-flex items-center gap-1 h-7 px-2 rounded-md border border-rule bg-paper/60 font-mono text-[10.5px] font-medium text-dim cursor-pointer hover:border-rule-strong hover:text-ink active:scale-[0.97] transition-all duration-150"
            :title="isEs ? 'Switch interface to English' : 'Cambiar interfaz a Español'"
            :aria-label="isEs ? 'Switch to English' : 'Cambiar a Español'"
            @click="toggleLocale"
          >
            <span class="lang-code" :class="{ 'text-ink font-semibold': isEs }">ES</span>
            <span class="lang-sep text-faint">/</span>
            <span class="lang-code" :class="{ 'text-ink font-semibold': !isEs }">EN</span>
          </button>

          <!-- Toggle de Modo Hiperfoco -->
          <button
            type="button"
            class="tool-btn focus-btn hidden sm:inline-flex items-center justify-center w-7 h-7 rounded-md border border-rule bg-paper/60 text-dim cursor-pointer transition-all duration-150 hover:border-rule-strong hover:text-ink hover:bg-hover active:scale-[0.96]"
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
            class="tool-btn help-btn hidden sm:inline-flex items-center justify-center w-7 h-7 rounded-md border border-rule bg-paper/60 text-dim cursor-pointer transition-all duration-150 hover:border-rule-strong hover:text-ink hover:bg-hover active:scale-[0.96]"
            :class="{ '!border-sig !text-sig !bg-sig/10': guideOpen }"
            :title="guideOpen ? (isEs ? 'Cerrar guía (?)' : 'Close guide (?)') : (isEs ? 'Guía rápida y atajos (?)' : 'Quick guide & shortcuts (?)')"
            :aria-label="isEs ? 'Guía rápida' : 'Quick guide'"
            @click="guideOpen = !guideOpen"
          >
            <AppIcon name="help" :size="13" />
          </button>

          <!-- Estado del Sistema Consolidado (PG-17 + Latencia + Hora Patagonia UTC-3) -->
          <div
            class="sys-status-badge hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-rule bg-paper/60 font-mono text-[10.5px] text-dim"
            :title="`PostgreSQL 17 ACID (${ex?.request.ms ?? 0}ms) · Hora local: ${utcTime || 'UTC-3'} (Patagonia, Argentina)`"
          >
            <span class="sys-dot w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_5px_var(--d-green)]" />
            <span class="sys-engine text-ink font-medium">PG-17</span>
            <span class="sys-sep text-faint">·</span>
            <span class="sys-ms text-dim">{{ ex?.request.ms ?? 0 }}ms</span>
            <span class="sys-sep text-faint">·</span>
            <span class="sys-time text-faint">{{ utcTime?.split(' ')[0] || '12:00:00' }}</span>
          </div>

          <button
            type="button"
            class="tool-btn sound-btn hidden sm:inline-flex items-center justify-center w-7 h-7 rounded-md border border-rule bg-paper/60 text-dim cursor-pointer transition-all duration-150 hover:border-rule-strong hover:text-ink hover:bg-hover active:scale-[0.96]"
            :class="{ '!text-ink': soundEnabled, 'opacity-50': !soundEnabled }"
            :aria-label="soundEnabled ? (isEs ? 'Silenciar audio táctil' : 'Mute tactile audio') : (isEs ? 'Activar audio táctil' : 'Enable tactile audio')"
            :title="soundEnabled ? (isEs ? 'Audio táctil Bencho: ON (click para silenciar)' : 'Bencho tactile audio: ON') : (isEs ? 'Audio táctil Bencho: OFF (click para activar)' : 'Bencho tactile audio: OFF')"
            @click="toggleSound"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path v-if="soundEnabled" d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <line v-else x1="22" y1="9" x2="16" y2="15" />
            </svg>
          </button>

          <button
            type="button"
            class="tool-btn theme-btn inline-flex items-center justify-center w-7 h-7 rounded-md border border-rule bg-paper/60 text-dim cursor-pointer transition-all duration-150 hover:border-rule-strong hover:text-ink hover:bg-hover active:scale-[0.96]"
            :aria-label="theme === 'dark' ? 'Cambiar a modo claro (papel técnico)' : 'Cambiar a modo oscuro (obsidiana)'"
            :title="`Cambiar a modo ${theme === 'dark' ? 'claro (papel)' : 'oscuro (obsidiana)'}`"
            @click="toggleTheme"
          >
            <AppIcon v-if="theme === 'dark'" name="sun" :size="13" />
            <AppIcon v-else name="moon" :size="13" />
          </button>
        </div>
      </header>

      <!-- Barra de Notificación / Indicador de Modo Hiperfoco -->
      <div v-if="isHyperfocus" class="hiperfoco-banner px-4 py-2 bg-sig text-on-sig border-b border-sig flex items-center justify-center text-xs font-mono font-bold" role="status" aria-live="polite">
        <div class="hb-center flex items-center gap-3">
          <span class="hb-title tracking-wider">{{ isEs ? 'HIPERFOCO // LECTURA ZEN' : 'HYPERFOCUS // ZEN READING' }}</span>
          <span class="hb-sep opacity-60">·</span>
          <button
            type="button"
            class="hb-exit-btn inline-flex items-center gap-1.5 px-2 py-0.5 bg-black/25 dark:bg-white/20 border border-current text-on-sig text-[11px] font-mono cursor-pointer hover:opacity-80 rounded-[2px]"
            :title="isEs ? 'Desactivar Modo Hiperfoco (H o Esc)' : 'Exit Hyperfocus Mode (H or Esc)'"
            @click="toggleHyperfocus"
          >
            <span>{{ isEs ? 'SALIR' : 'EXIT' }}</span>
            <kbd class="text-[9.5px] opacity-80">H / ESC</kbd>
          </button>
        </div>
      </div>

      <!-- Cuerpo de la Ventana: Sidebar Explorador + Escenario Central -->
      <div class="cuerpo-ventana flex-1 min-h-0 grid grid-cols-[224px_1fr] max-lg:grid-cols-1 overflow-hidden">
        <aside class="sidebar w-[224px] max-lg:hidden flex flex-col border-r border-rule bg-surface/40 overflow-y-auto" aria-label="Explorador de Archivos">
          <div class="sidebar-header px-3.5 pt-3.5 pb-2 flex items-center justify-between font-mono text-[10px] tracking-widest uppercase text-faint">
            <span>{{ isEs ? 'Workspace' : 'Workspace' }}</span>
            <span>PG-17</span>
          </div>

          <nav class="sidebar-tree px-2 py-1 flex flex-col" aria-label="Secciones del sistema">
            <UiLineSidebar
              :items="lineSidebarItems"
              :active-key="currentRoot"
              :reach="52"
              :length="48"
            />
          </nav>

          <div class="sidebar-footer mt-auto px-3.5 py-3 border-t border-rule flex items-center justify-between font-mono text-[10.5px] text-faint">
            <span class="inline-flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-green/80" />
              <span>{{ isEs ? 'Activo · 2026' : 'Active · 2026' }}</span>
            </span>
            <button
              type="button"
              class="bg-transparent border-0 p-0 text-dim hover:text-ink transition-colors cursor-pointer font-mono text-[10.5px]"
              :title="isEs ? 'Abrir guía rápida de navegación (?)' : 'Open quick navigation guide (?)'"
              @click="guideOpen = !guideOpen"
            >
              {{ isEs ? 'Atajos (?)' : 'Keys (?)' }}
            </button>
          </div>
        </aside>

        <main id="contenido" class="exp flex-1 min-w-0 min-h-0 overflow-y-auto p-3 md:p-6 focus:outline-none" tabindex="-1">
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
      <footer class="estado flex-none h-[30px] px-4 border-t border-rule bg-surface/60 flex items-center justify-between text-[11px] font-mono text-faint select-none max-lg:hidden">
        <span v-if="ex" class="medida text-dim">{{ pad(ex.request.count) }} {{ ex.request.count === 1 ? 'record' : 'records' }}</span>
        <UiTelemetryPill
          v-if="ex"
          :collection="currentRoot || 'db'"
          :record-slug="path[1] || null"
          :filters="activeQueryFilters"
          :count="ex.request.count"
          :api-healthy="ex.request.status === 200"
        />
        <span class="keys flex items-center gap-3" aria-hidden="true">
          <template v-if="hoja && (ex?.prev || ex?.next)"><kbd class="px-1 py-0.5 rounded bg-paper/60 border border-rule">←</kbd><kbd class="px-1 py-0.5 rounded bg-paper/60 border border-rule">→</kbd> {{ isEs ? 'vecino' : 'adjacent' }}</template>
          <template v-else-if="!hoja"><kbd class="px-1 py-0.5 rounded bg-paper/60 border border-rule">↑↓</kbd> {{ isEs ? 'navegar' : 'navigate' }} <kbd class="px-1 py-0.5 rounded bg-paper/60 border border-rule">↵</kbd> {{ isEs ? 'abrir' : 'open' }}</template>
          <template v-if="ex?.up"><kbd class="px-1 py-0.5 rounded bg-paper/60 border border-rule">⌫</kbd> {{ isEs ? 'volver' : 'back' }}</template>
          <span><kbd class="px-1 py-0.5 rounded bg-paper/60 border border-rule">0-6</kbd> {{ isEs ? 'secciones' : 'sections' }}</span>
          <span><kbd class="px-1 py-0.5 rounded bg-paper/60 border border-rule">/</kbd> {{ isEs ? 'buscar' : 'search' }}</span>
          <span><kbd class="px-1 py-0.5 rounded bg-paper/60 border border-rule">H</kbd> {{ isEs ? 'hiperfoco' : 'hyperfocus' }}</span>
          <button
            type="button"
            class="keys-guide-btn bg-transparent border-0 p-0 text-dim hover:text-ink cursor-pointer flex items-center gap-1 font-mono text-[11px]"
            :title="isEs ? 'Abrir guía rápida (?)' : 'Open quick guide (?)'"
            @click="guideOpen = !guideOpen"
          >
            <kbd class="px-1 py-0.5 rounded bg-paper/60 border border-rule">?</kbd>
          </button>
        </span>
      </footer>

      <!-- Barra de Navegación Inferior Móvil Estilo App Nativa -->
      <nav class="mobile-nav lg:hidden flex-none fixed bottom-0 inset-x-0 z-50 h-[60px] pb-[env(safe-area-inset-bottom,0)] bg-surface/90 backdrop-blur-xl border-t border-rule flex items-center justify-around px-1 shadow-[0_-8px_24px_rgba(0,0,0,0.35)]" aria-label="Navegación rápida móvil">
        <NuxtLink
          v-for="s in navSections"
          :key="s.root"
          :to="routeFor(s.to)"
          class="mobile-nav-item flex flex-col items-center justify-center flex-1 h-full text-dim no-underline transition-all duration-150 relative group py-1"
          :class="{ 'active !text-ink font-medium': currentRoot === s.root }"
        >
          <!-- Indicador superior activo quirúrgico -->
          <span
            v-if="currentRoot === s.root"
            class="mn-indicator absolute top-0 inset-x-4 h-[2px] bg-sig rounded-full"
            aria-hidden="true"
          />
          <div
            class="mn-icon-wrap flex items-center justify-center w-8 h-6 rounded-full transition-all duration-150"
            :class="currentRoot === s.root ? 'text-sig' : 'text-dim group-hover:text-ink'"
          >
            <AppIcon :name="s.icon" :size="16" class="mn-icon" />
          </div>
          <span class="mn-label text-[10px] font-mono mt-0.5 tracking-tight transition-colors" :class="currentRoot === s.root ? 'text-ink font-semibold' : 'text-dim group-hover:text-ink'">
            {{ s.shortLabel }}
          </span>
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
}
.historia { display: flex; gap: 4px; }

kbd {
  display: inline-block;
  min-width: 18px;
  margin: 0 2px;
  padding: 1px 4px;
  border-radius: 4px;
  line-height: 1.25;
  text-align: center;
}

.exp {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  padding: var(--d-inset) var(--d-inset) 32px;
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

/* Sidebar Explorador de Archivos (Linear Minimalist) */
.sidebar {
  flex: 0 0 224px;
  width: 224px;
  border-right: 1px solid var(--d-rule);
  display: flex;
  flex-direction: column;
  user-select: none;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--d-rule) transparent;
}

.sidebar-tree {
  flex: 1;
}

/* Barra de estado */
.estado {
  flex: none;
}
.medida { flex: none; font-family: var(--font-mono); font-size: 11px; white-space: nowrap; }
.req { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }
.keys { flex: none; margin-left: auto; display: flex; gap: 10px; align-items: center; flex-shrink: 0; }

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
    width: 28px;
    height: 28px;
  }
  .ruta {
    flex: 1;
    height: 28px;
    padding: 0 8px;
    font-size: 11px;
    min-width: 0;
    max-width: none;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .goto-btn {
    display: none !important;
  }
  .barra-derecha {
    gap: 5px;
    flex-shrink: 0;
  }
  .focus-btn,
  .help-btn {
    display: none !important;
  }
  .lang-btn {
    height: 28px;
    padding: 0 6px;
    font-size: 10.5px;
  }
  .theme-btn {
    width: 28px;
    height: 28px;
  }
  .telemetria-badge,
  .clock-badge,
  .sys-status-badge {
    display: none !important;
  }

  .cuerpo-ventana {
    flex-direction: column;
    overflow: hidden;
    max-width: 100%;
    width: 100%;
  }

  .exp {
    padding: 10px 10px calc(76px + env(safe-area-inset-bottom, 0px)) !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    perspective: none;
    max-width: 100%;
    width: 100%;
    box-sizing: border-box;
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
