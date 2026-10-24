<script setup lang="ts">
// Portafolio Técnico Mateo Sonzogni — Explorador de Datos Relacionales
// La raíz es la base de datos completa; las colecciones son carpetas; los registros son hojas técnicas.
// Navegación por teclado continua (flechas, Enter, Backspace, Esc, /, Cmd+K).
import ExplorerDetail from './ExplorerDetail.vue'
import ExplorerFolder from './ExplorerFolder.vue'
import ExplorerGoto from './ExplorerGoto.vue'
import ExplorerGuide from './ExplorerGuide.vue'
import ExplorerLab from './ExplorerLab.vue'
import AppIcon, { type IconName } from '~/components/ui/AppIcon.vue'
import UiDynamicIsland from '~/components/ui/UiDynamicIsland.vue'
import UiProgressiveBlur from '~/components/ui/UiProgressiveBlur.vue'
import UiSidebarIsland, { type SidebarIslandItem } from '~/components/ui/UiSidebarIsland.vue'
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

const { data: ex, error, status } = await useAsyncData<Explorer>(
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

const { startLoading, finishLoading } = useRouteLoader()
watch(status, (newStatus) => {
  if (newStatus === 'pending') {
    startLoading(route.path)
  }
  else if (newStatus === 'success' || newStatus === 'error') {
    finishLoading()
  }
})

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
const mobileMenuOpen = ref(false)
const pane = ref<HTMLElement | null>(null)

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false
})

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
    case '7':
      e.preventDefault()
      go(routeFor(['lab']))
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
      else if (mobileMenuOpen.value) {
        e.preventDefault()
        mobileMenuOpen.value = false
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
  { root: 'lab', label: isEs.value ? '07 · lab ui' : '07 · ui lab', shortLabel: 'Lab', to: ['lab'], badge: '28', keyHint: '7', icon: 'cpu', desc: isEs.value ? 'Laboratorio de componentes y físicas' : 'Component laboratory & spring physics' },
])

const currentRoot = computed(() => path.value[0] ?? '')

const lineSidebarItems = computed<SidebarIslandItem[]>(() =>
  navSections.value.map(s => ({
    key: s.root,
    num: s.root === '' ? '00' : s.keyHint.padStart(2, '0'),
    label: s.label.replace(/^0\d\s*·\s*/, ''),
    count: s.badge,
    to: routeFor(s.to),
    shortcut: s.keyHint,
    isRoot: s.root === '',
    icon: s.icon,
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
    <div class="ventana flex-1 min-h-0 w-full flex flex-col bg-paper relative">
      <!-- Topbar Arquitectónico Full-Width (Linear 2026 h-12) -->
      <header class="barra flex-none h-12 border-b border-rule bg-paper/85 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-2 z-20">
        <!-- Modo Normal: Navegación, Breadcrumb, Búsqueda y Herramientas -->
        <template v-if="!isHyperfocus">
          <div class="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
            <nav class="historia flex gap-1 shrink-0" aria-label="Historial">
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

            <!-- Menú Móvil Táctil (lg:hidden) -->
            <button
              type="button"
              class="lg:hidden inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-rule bg-paper/80 font-mono text-[11px] text-dim hover:text-ink hover:border-rule-strong active:scale-[0.96] transition-all cursor-pointer shrink-0"
              :title="isEs ? 'Abrir menú de navegación' : 'Open navigation menu'"
              :aria-label="isEs ? 'Menú de navegación' : 'Navigation menu'"
              @click="mobileMenuOpen = true"
            >
              <AppIcon name="menu" :size="12" class="text-sig" />
              <span class="uppercase font-semibold tracking-wider text-[10.5px]">{{ currentRoot || 'db' }}</span>
            </button>

            <!-- Ruta / Breadcrumb -->
            <nav class="ruta flex items-center min-w-0 h-7 px-2.5 rounded-md border border-rule bg-paper/60 whitespace-nowrap overflow-hidden text-[11px] sm:text-[12px] font-mono truncate max-w-[280px] sm:max-w-none" aria-label="Ruta">
              <span class="w-1.5 h-1.5 rounded-full bg-sig mr-2 shrink-0 opacity-85" aria-hidden="true" />
              <template v-for="(seg, i) in segments" :key="seg.label + i">
                <span v-if="i" class="sep text-faint px-1.5" aria-hidden="true">/</span>
                <NuxtLink v-if="i < segments.length - 1" :to="seg.to" class="text-dim hover:text-ink no-underline transition-colors py-1">{{ seg.label }}</NuxtLink>
                <span v-else class="here text-ink font-medium" aria-current="page">{{ seg.label }}</span>
              </template>
            </nav>

            <!-- Botón de Búsqueda Rápida / Goto (Estilo Linear ⌘K) -->
            <button
              class="goto-btn group flex-[0_1_220px] min-w-[135px] hidden md:flex items-center gap-2 h-7 px-2.5 rounded-md border border-rule bg-paper/60 text-dim text-left cursor-pointer transition-all duration-150 hover:border-rule-strong hover:bg-hover/60 hover:text-ink active:scale-[0.99]"
              type="button"
              :title="isEs ? 'Abrir paleta de comandos (⌘K o /)' : 'Open command palette (⌘K or /)'"
              @click="gotoOpen = true"
            >
              <AppIcon name="search" :size="12" class="goto-search-icon text-faint shrink-0 group-hover:text-ink transition-colors duration-150" />
              <span class="goto-ph flex-1 min-w-0 text-dim text-[11.5px] overflow-hidden text-ellipsis whitespace-nowrap">{{ isEs ? 'Buscar proyecto, stack…' : 'Search project, stack…' }}</span>
              <kbd class="font-mono text-[10px] text-faint bg-surface px-1.5 py-0.5 rounded border border-rule group-hover:text-ink transition-colors duration-150">/</kbd>
            </button>
          </div>

          <!-- Acciones Rápidas del Sistema + Dynamic Island Bencho -->
          <div class="barra-derecha flex items-center gap-1.5 shrink-0 ml-auto">
            <!-- Búsqueda Rápida Móvil (md:hidden) -->
            <button
              type="button"
              class="md:hidden inline-flex items-center justify-center w-7 h-7 rounded-md border border-rule bg-paper/60 text-dim cursor-pointer transition-all duration-150 hover:border-rule-strong hover:text-ink hover:bg-hover active:scale-[0.96]"
              :title="isEs ? 'Buscar (⌘K o /)' : 'Search (⌘K or /)'"
              :aria-label="isEs ? 'Buscar' : 'Search'"
              @click="gotoOpen = true"
            >
              <AppIcon name="search" :size="12" />
            </button>

            <!-- Dynamic Island Interactiva 1:1 Bencho (Telemetría PG-17) -->
            <div class="hidden xl:flex items-center">
              <UiDynamicIsland
                :collection="currentRoot || 'db'"
                :record-slug="path[1] || null"
                :record-count="ex?.request.count ?? 8"
                :api-healthy="ex?.request.status === 200"
                :latency-ms="ex?.request.ms ?? 11"
              />
            </div>

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

            <!-- Toggle de Audio Táctil -->
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

            <!-- Selector de Tema Claro / Oscuro -->
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
        </template>

        <!-- Topbar Zen en Modo Hiperfoco: Sin colisiones, minimalismo puro -->
        <template v-else>
          <div class="zen-topbar w-full flex items-center justify-between">
            <div class="flex items-center gap-2.5 font-mono text-[11.5px]">
              <span class="w-2 h-2 rounded-full bg-sig animate-pulse shrink-0" />
              <span class="font-semibold text-ink tracking-wider uppercase">MATEO SONZOGNI // {{ isEs ? 'LECTURA ZEN' : 'ZEN READING' }}</span>
              <span class="text-dim hidden sm:inline">· {{ folder ? (isEs ? 'DOSSIER EJECUTIVO 2026' : 'EXECUTIVE DOSSIER 2026') : (detail?.name ?? 'DOSSIER') }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-paper border border-sig text-sig font-mono text-[11px] font-semibold hover:bg-sig hover:text-on-sig transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                :title="isEs ? 'Desactivar Modo Hiperfoco (H o Esc)' : 'Exit Hyperfocus Mode (H or Esc)'"
                @click="toggleHyperfocus"
              >
                <span>{{ isEs ? 'SALIR' : 'EXIT' }}</span>
                <kbd class="px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 text-[10px]">H / ESC</kbd>
              </button>
            </div>
          </div>
        </template>
      </header>

      <!-- Cuerpo de la Ventana: Sidebar Estructural Integrado + Canvas Principal -->
      <div class="cuerpo-ventana flex-1 min-h-0 flex flex-row overflow-hidden relative">
        <!-- Sidebar Linear / Bencho Rail Integrado -->
        <UiSidebarIsland
          :items="lineSidebarItems"
          :active-key="currentRoot"
          @open-guide="guideOpen = true"
        />

        <!-- Canvas Central: Contenedor con Desenfoque Progresivo Fijo (Bencho UI Optical Lens) -->
        <div class="canvas-viewport flex-1 min-w-0 h-full relative overflow-hidden flex flex-col">
          <!-- Contenido Central Scrollable -->
          <main
            id="contenido"
            class="exp flex-1 min-w-0 h-full overflow-y-auto focus:outline-none"
            tabindex="-1"
          >
            <div v-if="error" class="pane w-full max-w-[1240px] mx-auto">
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
            <div v-else-if="ex" ref="pane" :key="route.fullPath" class="pane w-full max-w-[1240px] mx-auto pb-14" :class="dir">
              <ExplorerLab v-if="currentRoot === 'lab'" />
              <ExplorerFolder v-else-if="folder" :folder="folder" />
              <ExplorerDetail v-else-if="detail" :detail="detail" :prev="ex.prev" :next="ex.next" />
            </div>
          </main>

          <!-- Desenfoque Progresivo Fijo en el Borde Inferior (Bencho Optical Lens) -->
          <UiProgressiveBlur position="bottom" :height="42" :strength="48" />
        </div>
      </div>

      <!-- Barra de Estado Inferior Integrada en el Marco (Desktop) -->
      <footer class="estado flex-none h-7 border-t border-rule bg-surface/70 backdrop-blur-md px-3.5 hidden lg:flex items-center justify-between text-[11px] font-mono text-dim select-none z-20">
        <div class="flex items-center gap-3">
          <span v-if="ex" class="medida text-dim">{{ pad(ex.request.count) }} {{ ex.request.count === 1 ? 'record' : 'records' }}</span>
          <UiTelemetryPill
            v-if="ex"
            :collection="currentRoot || 'db'"
            :record-slug="path[1] || null"
            :filters="activeQueryFilters"
            :count="ex.request.count"
            :api-healthy="ex.request.status === 200"
          />
        </div>
        <div class="keys flex items-center gap-3" aria-hidden="true">
          <template v-if="hoja && (ex?.prev || ex?.next)"><kbd class="px-1 py-0.5 rounded bg-paper/60 border border-rule">←</kbd><kbd class="px-1 py-0.5 rounded bg-paper/60 border border-rule">→</kbd> {{ isEs ? 'vecino' : 'adjacent' }}</template>
          <template v-else-if="!hoja"><kbd class="px-1 py-0.5 rounded bg-paper/60 border border-rule">↑↓</kbd> {{ isEs ? 'navegar' : 'navigate' }} <kbd class="px-1 py-0.5 rounded bg-paper/60 border border-rule">↵</kbd> {{ isEs ? 'abrir' : 'open' }}</template>
          <template v-if="ex?.up"><kbd class="px-1 py-0.5 rounded bg-paper/60 border border-rule">⌫</kbd> {{ isEs ? 'volver' : 'back' }}</template>
          <span><kbd class="px-1 py-0.5 rounded bg-paper/60 border border-rule">0-7</kbd> {{ isEs ? 'secciones' : 'sections' }}</span>
          <span><kbd class="px-1 py-0.5 rounded bg-paper/60 border border-rule">⌘B</kbd> sidebar</span>
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
        </div>
      </footer>

    <!-- Modal Drawer de Navegación Móvil (Linear 2026 / Bencho UI) -->
    <Teleport to="body">
      <Transition name="m-drawer">
        <div
          v-if="mobileMenuOpen"
          class="fixed inset-0 z-[120] flex flex-col justify-end sm:justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          :aria-label="isEs ? 'Menú de navegación' : 'Navigation menu'"
          @click.self="mobileMenuOpen = false"
        >
          <div class="w-full max-w-[420px] mx-auto bg-paper border border-rule-strong rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 max-h-[88vh] overflow-y-auto">
            <!-- Cabecera del Drawer -->
            <div class="flex items-center justify-between pb-3 border-b border-rule">
              <div class="flex items-center gap-2 font-mono text-[11px]">
                <span class="w-1.5 h-1.5 rounded-full bg-sig" />
                <span class="font-bold text-ink uppercase tracking-wider">MATEO SONZOGNI // SISTEMA</span>
              </div>
              <button
                type="button"
                class="inline-flex items-center justify-center w-7 h-7 rounded-md border border-rule bg-paper text-dim hover:text-ink hover:border-rule-strong active:scale-[0.96] cursor-pointer"
                :aria-label="isEs ? 'Cerrar menú' : 'Close menu'"
                @click="mobileMenuOpen = false"
              >
                <AppIcon name="close" :size="12" />
              </button>
            </div>

            <!-- Acceso Directo de Búsqueda ⌘K -->
            <button
              type="button"
              class="flex items-center gap-2.5 h-9 px-3 rounded-xl border border-rule bg-surface/80 text-dim text-left cursor-pointer hover:border-rule-strong hover:text-ink transition-all active:scale-[0.99]"
              @click="mobileMenuOpen = false; gotoOpen = true"
            >
              <AppIcon name="search" :size="13" class="text-faint" />
              <span class="flex-1 text-[12px] font-sans text-dim">{{ isEs ? 'Buscar proyecto, stack, artículo…' : 'Search projects, stack, articles…' }}</span>
              <kbd class="font-mono text-[10px] text-faint bg-paper px-1.5 py-0.5 rounded border border-rule">⌘K</kbd>
            </button>

            <!-- Secciones de Navegación (00 a 07) -->
            <div class="flex flex-col gap-1 py-1" role="menu">
              <NuxtLink
                v-for="s in navSections"
                :key="s.root"
                :to="routeFor(s.to)"
                class="flex items-center justify-between p-2.5 rounded-xl border no-underline transition-all active:scale-[0.98]"
                :class="currentRoot === s.root
                  ? 'bg-sig/10 border-sig/40 text-ink shadow-xs'
                  : 'bg-paper/40 border-transparent text-dim hover:bg-hover hover:text-ink hover:border-rule'"
                role="menuitem"
                @click="mobileMenuOpen = false"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 transition-colors"
                    :class="currentRoot === s.root
                      ? 'bg-sig border-sig text-on-sig font-bold'
                      : 'bg-paper border-rule text-dim'"
                  >
                    <AppIcon :name="s.icon" :size="13" />
                  </div>
                  <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="font-mono text-[10.5px] font-bold" :class="currentRoot === s.root ? 'text-sig' : 'text-dim'">
                        {{ s.root === '' ? '00' : s.keyHint.padStart(2, '0') }}.
                      </span>
                      <span class="font-sans text-[13px] font-semibold text-ink truncate capitalize">
                        {{ s.label.replace(/^0\d\s*·\s*/, '') }}
                      </span>
                    </div>
                    <span class="font-sans text-[11px] text-faint truncate">{{ s.desc }}</span>
                  </div>
                </div>
                <span class="font-mono text-[10.5px] px-2 py-0.5 rounded-md border shrink-0 ml-2" :class="currentRoot === s.root ? 'bg-sig/20 border-sig/40 text-sig font-bold' : 'bg-surface border-rule text-dim'">
                  {{ s.badge }}
                </span>
              </NuxtLink>
            </div>

            <!-- Barra de Controles Rápidos del Sistema -->
            <div class="pt-3 border-t border-rule flex items-center justify-between gap-2">
              <!-- Idioma -->
              <button
                type="button"
                class="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2 rounded-lg border border-rule bg-paper font-mono text-[11px] text-dim hover:text-ink active:scale-[0.97]"
                @click="toggleLocale"
              >
                <span :class="{ 'text-ink font-bold': isEs }">ES</span>
                <span class="text-faint">/</span>
                <span :class="{ 'text-ink font-bold': !isEs }">EN</span>
              </button>

              <!-- Tema -->
              <button
                type="button"
                class="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2 rounded-lg border border-rule bg-paper font-mono text-[11px] text-dim hover:text-ink active:scale-[0.97]"
                @click="toggleTheme"
              >
                <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="12" />
                <span>{{ theme === 'dark' ? (isEs ? 'Claro' : 'Light') : (isEs ? 'Oscuro' : 'Dark') }}</span>
              </button>

              <!-- Audio Táctil -->
              <button
                type="button"
                class="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2 rounded-lg border border-rule bg-paper font-mono text-[11px] text-dim hover:text-ink active:scale-[0.97]"
                :class="{ '!text-sig !border-sig/40': soundEnabled }"
                @click="toggleSound"
              >
                <span class="text-[10px]">SFX</span>
                <span>{{ soundEnabled ? 'ON' : 'OFF' }}</span>
              </button>

              <!-- Hiperfoco -->
              <button
                type="button"
                class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-rule bg-paper text-dim hover:text-ink active:scale-[0.97]"
                :class="{ '!text-sig !border-sig !bg-sig/10': isHyperfocus }"
                :title="isEs ? 'Modo Hiperfoco' : 'Hyperfocus Mode'"
                @click="mobileMenuOpen = false; toggleHyperfocus()"
              >
                <AppIcon name="zap" :size="13" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>

    <!-- Modal de Búsqueda Rápida / Goto -->
    <ExplorerGoto v-if="gotoOpen" @close="gotoOpen = false" />

    <!-- Guía de Orientación Rápida Flotante -->
    <ExplorerGuide :open="guideOpen" @close="guideOpen = false" />
  </div>
</template>

<style scoped>
.datos {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  padding: 0;
  color: var(--d-ink);
  font-family: var(--font-text);
  font-size: var(--d-fs-ui);
  line-height: var(--d-lh);
  font-variant-numeric: tabular-nums;
  background-color: var(--d-paper);
}
.ruta, .req, kbd { font-family: var(--font-mono); font-size: var(--d-fs-mono); }

/* La ventana: marco estructural de pantalla completa con retícula blueprint sutil */
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

/* Espacio Central de Visualización */
.cuerpo-ventana {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.canvas-viewport {
  flex: 1;
  min-width: 0;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.exp {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  padding: 24px 32px 48px 32px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--d-rule) transparent;
  perspective: 1200px;
  perspective-origin: 50% 40%;
}
@media screen and (max-width: 1023px) {
  .exp {
    padding: 20px 20px 48px 20px;
  }
}
.exp:focus { outline: none; }
.pane { animation: var(--d-dur) var(--d-ease) both; }
.pane.deeper { animation-name: acercar; }
.pane.up { animation-name: alejar; }
.pane.lateral { animation-name: correr; }
@keyframes acercar { from { transform: translateZ(calc(var(--d-z) * -1)); opacity: 0; } }
@keyframes alejar { from { transform: translateZ(var(--d-z)); opacity: 0; } }
@keyframes correr { from { transform: translateX(12px); opacity: 0; } }

/* Barra de estado inferior */
.estado {
  flex: none;
}
.medida { flex: none; font-family: var(--font-mono); font-size: 11px; white-space: nowrap; }
.req { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }
.keys { flex: none; margin-left: auto; display: flex; gap: 10px; align-items: center; flex-shrink: 0; }

/* Transición del Drawer Móvil */
.m-drawer-enter-active,
.m-drawer-leave-active {
  transition: opacity 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}
.m-drawer-enter-active > div,
.m-drawer-leave-active > div {
  transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease;
}
.m-drawer-enter-from,
.m-drawer-leave-to {
  opacity: 0;
}
.m-drawer-enter-from > div {
  transform: translateY(16px) scale(0.98);
  opacity: 0;
}
.m-drawer-leave-to > div {
  transform: translateY(12px) scale(0.98);
  opacity: 0;
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
  .barra {
    padding: 0 10px;
    gap: 6px;
    height: 48px;
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
    gap: 6px;
    flex-shrink: 0;
  }
  .focus-btn,
  .help-btn {
    display: none !important;
  }
  .lang-btn {
    height: 28px;
    padding: 0 8px;
    font-size: 11px;
  }
  .theme-btn {
    width: 28px;
    height: 28px;
  }

  .cuerpo-ventana {
    flex-direction: column;
    overflow: hidden;
    max-width: 100%;
    width: 100%;
  }

  .canvas-viewport {
    width: 100%;
    max-width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .exp {
    padding: 16px 14px calc(24px + env(safe-area-inset-bottom, 0px)) 14px !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    perspective: none;
    max-width: 100%;
    width: 100%;
    box-sizing: border-box;
  }

  /* Barra de Estado inferior se oculta en mobile */
  .estado {
    display: none !important;
  }
}

@media screen and (max-width: 480px) {
  .historia .nav-btn:nth-child(2),
  .historia .nav-btn:nth-child(3) {
    display: none;
  }
  .ruta {
    max-width: 140px;
  }
  .focus-btn {
    display: none !important;
  }
  .barra {
    gap: 4px;
    padding: 0 8px;
  }
}

@media print {
  .datos,
  .ventana,
  .cuerpo-ventana,
  .canvas-viewport,
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
