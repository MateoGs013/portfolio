<script setup lang="ts">
/**
 * ExplorerLab — Awwwards & Bencho UI Creative Engineering Laboratory
 * Inspirado en la artesanía táctil de Bencho UI (bencho.dev) y los estándares de Awwwards Site of the Day.
 * Presenta cada componente como un espécimen interactivo de escala completa con controles en vivo,
 * telemetría física de resortes (stiffness, damping, mass) y síntesis acústica en Web Audio API.
 */
import { ref, computed } from 'vue'
import { usePortfolioLocale } from '~/composables/usePortfolioLocale'
import { useHyperfocus } from '~/composables/useHyperfocus'
import { useBenchoSound } from '~/composables/useBenchoSound'
import AppIcon from '~/components/ui/AppIcon.vue'
import UiBorderBeam from '~/components/ui/UiBorderBeam.vue'
import UiClickSpark from '~/components/ui/UiClickSpark.vue'
import UiAudioVisualizer from '~/components/ui/UiAudioVisualizer.vue'
import UiDecryptedText from '~/components/ui/UiDecryptedText.vue'
import UiFolderPreview from '~/components/ui/UiFolderPreview.vue'
import UiRollingCounter from '~/components/ui/UiRollingCounter.vue'
import UiWakeSlider from '~/components/ui/UiWakeSlider.vue'
import UiMagneticDots from '~/components/ui/UiMagneticDots.vue'
import UiSegmentedSwitch from '~/components/ui/UiSegmentedSwitch.vue'
import UiDock from '~/components/ui/UiDock.vue'
import UiSlideConfirm from '~/components/ui/UiSlideConfirm.vue'
import UiSharePill from '~/components/ui/UiSharePill.vue'
import UiCopyPill from '~/components/ui/UiCopyPill.vue'
import UiSweepButton from '~/components/ui/UiSweepButton.vue'
import UiTelemetryPill from '~/components/ui/UiTelemetryPill.vue'
import UiDotGlobe from '~/components/ui/UiDotGlobe.vue'
import UiCodeReveal from '~/components/ui/UiCodeReveal.vue'
import UiHoloCard from '~/components/ui/UiHoloCard.vue'
import UiDynamicIsland from '~/components/ui/UiDynamicIsland.vue'
import UiThinkingTrace from '~/components/ui/UiThinkingTrace.vue'
import UiTreeView, { type TreeNode } from '~/components/ui/UiTreeView.vue'
import UiCursorWorkList, { type CursorWorkItem } from '~/components/ui/UiCursorWorkList.vue'

const { isEs } = usePortfolioLocale()
const { isHyperfocus } = useHyperfocus()
const { soundEnabled, toggleSound, playSound } = useBenchoSound()

// Categorías de filtro
type LabCategory = 'all' | 'hero' | 'springs' | 'tactile' | 'spatial' | 'audio'
const activeCategory = ref<LabCategory>('all')
const searchQuery = ref('')
const copiedSnippet = ref<string | null>(null)

// Parámetros de la Hero Sandbox: Dynamic Island Workbench
const islandMode = ref('status')
const demoCounter = ref(382)
const demoWake = ref(68)
const demoBeamSpeed = ref(7.5)
const demoConfirmStatus = ref('')
const activeDockKey = ref('projects')

const categories = computed(() => [
  { value: 'all', label: isEs.value ? 'Todos (28)' : 'All (28)' },
  { value: 'hero', label: isEs.value ? 'Workbench Destacado' : 'Featured Workbench' },
  { value: 'springs', label: isEs.value ? 'Física & Resortes (08)' : 'Physics & Springs (08)' },
  { value: 'spatial', label: isEs.value ? 'Spatial 3D & Óptica (06)' : 'Spatial 3D & Optics (06)' },
  { value: 'tactile', label: isEs.value ? 'Controles Táctiles (08)' : 'Tactile Controls (08)' },
  { value: 'audio', label: isEs.value ? 'Audio & Trazas (06)' : 'Audio & Traces (06)' },
])

const demoFolderItems = [
  { id: 'p1', title: 'La Rúcula', subtitle: 'Menu-first QR · Live', badge: 'LIVE' },
  { id: 'p2', title: 'ARG Piscinas', subtitle: 'Prisma CMS · Live', badge: 'PROD' },
  { id: 'p3', title: 'Ynara IA', subtitle: 'Tesis Da Vinci', badge: 'WIP' },
]

const demoWorkListItems = computed<CursorWorkItem[]>(() => [
  {
    slug: 'la-rucula',
    num: '01',
    title: 'La Rúcula',
    role: 'Creative Developer',
    year: '2026',
    status: 'LIVE',
    cover: '/media/projects/la-rucula.png',
    to: '/projects/la-rucula',
    chips: ['Nuxt 4', 'GSAP', 'Tailwind'],
  },
  {
    slug: 'arg-piscinas',
    num: '02',
    title: 'ARG Piscinas',
    role: 'Fullstack Engineer',
    year: '2026',
    status: 'LIVE',
    cover: '/media/projects/arg-piscinas.png',
    to: '/projects/arg-piscinas',
    chips: ['Express 5', 'PostgreSQL 17', 'Prisma'],
  },
  {
    slug: 'ynara-ia',
    num: '03',
    title: 'Ynara AI',
    role: 'Product Architect',
    year: '2026',
    status: 'WIP',
    cover: '/media/projects/la-rucula.png',
    to: '/projects/ynara',
    chips: ['Python', 'FastAPI', 'pgvector'],
  },
])

const demoThinkingSteps = computed(() => isEs.value ? [
  'Oscilador Web Audio API inicializado a 880 Hz.',
  'Resolviendo resortes amortiguados de segundo orden en rAF.',
  'Proyectando arcos geodésicos con interpolación slerp.',
  'Verificando iluminación especular y modo Hiperfoco.',
] : [
  'Web Audio API oscillator initialized at 880 Hz.',
  'Solving second-order damped springs in rAF.',
  'Projecting 3D slerp lifted geodesic arcs.',
  'Verifying top-lit specular lighting and Zen Hyperfocus.',
])

const demoTreeRoot: TreeNode = {
  name: 'app/components/ui',
  meta: '28 primitives',
  kids: [
    {
      name: 'springs',
      kids: [
        { name: 'UiDynamicIsland.vue', meta: 'k=380 c=28' },
        { name: 'UiRollingCounter.vue', meta: 'odometer' },
        { name: 'UiWakeSlider.vue', meta: 'kinetic' },
        { name: 'UiMagneticDots.vue', meta: 'canvas' },
      ],
    },
    {
      name: 'spatial-3d',
      kids: [
        { name: 'UiHoloCard.vue', meta: 'foil 3D' },
        { name: 'UiDotGlobe.vue', meta: '3D slerp' },
        { name: 'UiCodeReveal.vue', meta: 'x-ray' },
      ],
    },
    {
      name: 'tactile',
      kids: [
        { name: 'UiSlideConfirm.vue', meta: 'commit 85%' },
        { name: 'UiCopyPill.vue', meta: 'check morph' },
        { name: 'UiSweepButton.vue', meta: 'specular' },
      ],
    },
  ],
}

const demoDockItems = [
  { key: 'home', label: 'db / root', icon: 'db' },
  { key: 'projects', label: 'projects (06)', icon: 'folder' },
  { key: 'stack', label: 'stack (22)', icon: 'code' },
  { key: 'lab', label: 'ui lab (28)', icon: 'cpu' },
]

function copyImport(componentName: string) {
  const snippet = `import { ${componentName} } from '~/components/ui'`
  if (import.meta.client && navigator.clipboard) {
    navigator.clipboard.writeText(snippet)
      .then(() => {
        copiedSnippet.value = componentName
        playSound('copied')
        setTimeout(() => {
          if (copiedSnippet.value === componentName) {
            copiedSnippet.value = null
          }
        }, 1800)
      })
      .catch(() => {
        copiedSnippet.value = componentName
      })
  }
}

function onSlideConfirmed() {
  demoConfirmStatus.value = isEs.value ? '¡Transmitido con éxito! · 200 OK' : 'Committed successfully! · 200 OK'
  playSound('chime')
  setTimeout(() => {
    demoConfirmStatus.value = ''
  }, 3200)
}
</script>

<template>
  <div class="explorer-lab w-full flex flex-col gap-10 sm:gap-14" role="region" :aria-label="isEs ? 'Laboratorio de Componentes UI' : 'UI Component Laboratory'">
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- CABECERA MONUMENTAL EDITORIAL: SWISS AWWWARDS 2026                      -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <header class="flex flex-col gap-6 border-b border-rule pb-8">
      <!-- Tagline y Controles de Audio Global -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          <span class="w-2 h-2 rounded-full bg-sig animate-pulse" />
          <span>{{ isEs ? '04 / LABORATORIO DE INTERACCIÓN & FÍSICAS' : '04 / INTERACTION LAB & PHYSICS' }}</span>
          <span class="text-faint">·</span>
          <UiDecryptedText text="SONZOGNI × BENCHO UI v2.0" class="text-ink font-semibold" />
          <span v-if="isHyperfocus" class="text-sig ml-2 font-bold">[ZEN HYPERFOCUS]</span>
        </div>

        <div class="flex items-center gap-2.5">
          <UiClickSpark :spark-count="6" :spark-size="5">
            <button
              type="button"
              class="inline-flex items-center gap-2 h-8 px-3.5 rounded-full border border-rule bg-surface/80 hover:bg-hover hover:border-rule-strong font-mono text-[11px] text-dim hover:text-ink transition-all cursor-pointer active:scale-[0.98]"
              :title="isEs ? 'Alternar síntesis acústica en Web Audio API' : 'Toggle Web Audio API procedural synthesis'"
              @click="toggleSound(); playSound('notch')"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="soundEnabled ? 'bg-green animate-pulse' : 'bg-faint'" />
              <span>{{ soundEnabled ? 'Audio ON (Web Audio)' : 'Audio Muted' }}</span>
            </button>
          </UiClickSpark>
        </div>
      </div>

      <!-- Titular Display Monumental Awwwards -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div class="flex flex-col gap-3 max-w-[54ch]">
          <h1 class="font-sans text-[clamp(32px,5.2vw,68px)] font-semibold tracking-[-0.04em] leading-[0.95] text-ink m-0">
            {{ isEs ? 'Físicas de resorte, óptica & micro-interacción.' : 'Spring physics, optics & micro-interactions.' }}
          </h1>
          <p class="font-sans text-[clamp(14px,1.2vw,16px)] text-dim leading-[1.55] m-0">
            <template v-if="isEs">
              Colección de 28 primitivas interactivas de autor diseñadas bajo el estándar de <strong class="text-ink font-medium">Bencho UI</strong>. Cada componente resuelve resortes amortiguados de segundo orden en tiempo real, síntesis procedural con Web Audio API y materiales ópticos contemporáneos.
            </template>
            <template v-else>
              Collection of 28 author-crafted interactive primitives built to <strong class="text-ink font-medium">Bencho UI</strong> standards. Every component integrates real-time 2nd-order damped spring solvers, Web Audio API synthesis, and contemporary optical materials.
            </template>
          </p>
        </div>

        <!-- Métricas Rápidas de Ingeniería -->
        <div class="flex flex-col gap-2 font-mono text-[11px] text-dim shrink-0 lg:text-right border-l lg:border-l-0 lg:border-r border-rule pl-4 lg:pl-0 lg:pr-4">
          <div><strong class="text-ink">28</strong> {{ isEs ? 'PRIMITIVAS DE AUTOR' : 'AUTHOR PRIMITIVES' }}</div>
          <div><strong class="text-ink">&lt; 16ms</strong> {{ isEs ? 'RESPUESTA FÍSICA' : 'FRAME LATENCY' }}</div>
          <div><strong class="text-ink">100%</strong> {{ isEs ? 'WEB AUDIO SINTETIZADO' : 'SYNTHESIZED AUDIO' }}</div>
        </div>
      </div>

      <!-- Barra de Filtros Segmentada -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-3">
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            v-for="cat in categories"
            :key="cat.value"
            type="button"
            class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border font-mono text-[11px] transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
            :class="activeCategory === cat.value
              ? 'border-sig bg-sig/10 text-sig font-semibold shadow-xs'
              : 'border-rule bg-surface/60 text-dim hover:text-ink hover:border-rule-strong hover:bg-hover'"
            @click="activeCategory = (cat.value as LabCategory); playSound('tock', { gap: 40 })"
          >
            <span>{{ cat.label }}</span>
          </button>
        </div>

        <!-- Búsqueda Instantánea -->
        <div class="relative w-full sm:w-64">
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="isEs ? 'Filtrar componentes...' : 'Filter primitives...'"
            class="w-full h-8 pl-8 pr-3 rounded-full border border-rule bg-surface/60 hover:bg-surface focus:bg-surface focus:border-sig text-ink font-mono text-[11px] outline-none transition-all placeholder:text-faint"
          >
          <AppIcon name="search" :size="12" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-dim pointer-events-none" />
        </div>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 1. CROWN JEWEL SHOWCASE: BENCHO DYNAMIC ISLAND SIMULATOR                -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <section
      v-if="activeCategory === 'all' || activeCategory === 'hero' || activeCategory === 'springs'"
      class="flex flex-col gap-4 border border-rule-strong rounded-2xl p-6 sm:p-8 bg-paper/60 backdrop-blur-xl relative overflow-hidden shadow-2xl"
      aria-label="Simulador de Isla Dinámica Bencho UI"
    >
      <UiBorderBeam
        :size="260"
        :duration="demoBeamSpeed"
        :border-width="1.8"
        color-from="#ff3e00"
        color-to="var(--d-ink, #ffffff)"
        class="pointer-events-none"
      />

      <!-- Retícula CAD milimétrica cenital -->
      <div
        class="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(var(--d-grid-cross,rgba(255,255,255,0.15))_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      <div class="flex flex-wrap items-center justify-between gap-4 z-10 border-b border-rule/70 pb-4">
        <div class="flex items-center gap-3">
          <span class="w-2.5 h-2.5 rounded-full bg-sig animate-pulse shadow-[0_0_10px_var(--d-sig,#ff3e00)]" />
          <div class="flex flex-col">
            <span class="font-sans text-[16px] sm:text-[18px] font-semibold text-ink tracking-tight">
              UiDynamicIsland · Specular Spring Simulator
            </span>
            <span class="font-mono text-[11px] text-dim">
              2nd-Order Damped Spring Engine (k = 380 N/m, c = 28 Ns/m, m = 0.9 kg)
            </span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <UiSegmentedSwitch
            v-model="islandMode"
            :options="[
              { value: 'status', label: '200 OK' },
              { value: 'sql', label: 'SQL Telemetry' },
              { value: 'ats', label: 'ATS Job' }
            ]"
          />

          <UiClickSpark :spark-count="7" :spark-size="6">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border font-mono text-[10.5px] font-medium transition-all cursor-pointer active:scale-[0.98]"
              :class="copiedSnippet === 'UiDynamicIsland'
                ? 'border-green bg-green/10 text-green'
                : 'border-rule bg-paper/80 text-dim hover:text-ink hover:border-rule-strong'"
              @click="copyImport('UiDynamicIsland')"
            >
              <AppIcon :name="copiedSnippet === 'UiDynamicIsland' ? 'check' : 'copy'" :size="11" />
              <span>{{ copiedSnippet === 'UiDynamicIsland' ? (isEs ? 'Copiado' : 'Copied') : 'import { UiDynamicIsland }' }}</span>
            </button>
          </UiClickSpark>
        </div>
      </div>

      <!-- Escenario Central Expansivo de la Isla -->
      <div class="min-h-[220px] sm:min-h-[260px] w-full flex flex-col items-center justify-center p-6 rounded-xl bg-surface/50 border border-rule/60 relative z-10 shadow-inner">
        <div class="py-4">
          <UiDynamicIsland
            collection="db"
            :record-count="28"
            :latency-ms="14"
          />
        </div>
        <span class="font-mono text-[11px] text-dim mt-4 select-none">
          {{ isEs ? 'Hacé clic sobre la cápsula para desplegar el resorte físico de segundo orden' : 'Click the pill capsule to trigger the 2nd-order physical spring' }}
        </span>
      </div>

      <!-- Barra Inferior de Parámetros Físicos en Tiempo Real -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 z-10 pt-2 font-mono text-[11px]">
        <div class="p-2.5 rounded-lg border border-rule bg-surface/40 flex flex-col gap-0.5">
          <span class="text-faint text-[9.5px]">STIFFNESS (k)</span>
          <span class="text-ink font-semibold">380 N/m</span>
        </div>
        <div class="p-2.5 rounded-lg border border-rule bg-surface/40 flex flex-col gap-0.5">
          <span class="text-faint text-[9.5px]">DAMPING (c)</span>
          <span class="text-ink font-semibold">28 Ns/m</span>
        </div>
        <div class="p-2.5 rounded-lg border border-rule bg-surface/40 flex flex-col gap-0.5">
          <span class="text-faint text-[9.5px]">MASS (m)</span>
          <span class="text-ink font-semibold">0.9 kg</span>
        </div>
        <div class="p-2.5 rounded-lg border border-rule bg-surface/40 flex flex-col gap-0.5">
          <span class="text-faint text-[9.5px]">RESPONSE TIME</span>
          <span class="text-green font-semibold">&lt; 16ms (60 FPS)</span>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 2. BENTO ARTIFACTS GRID: ARTEFACTOS FÍSICOS & ÓPTICOS EXPANDIDOS        -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
      <!-- ARTEFACTO 1: 3D Holographic Collector Specimen -->
      <section
        v-if="activeCategory === 'all' || activeCategory === 'spatial'"
        class="border border-rule rounded-2xl p-6 sm:p-7 bg-surface/40 backdrop-blur-md flex flex-col justify-between gap-6 transition-all hover:border-rule-strong"
      >
        <div class="flex items-center justify-between border-b border-rule/60 pb-3">
          <div class="flex flex-col gap-0.5">
            <span class="font-mono text-[10px] uppercase tracking-wider text-sig">3D Perspective 900px · Rainbow Foil</span>
            <h2 class="font-sans text-[17px] font-semibold text-ink m-0">UiHoloCard · Especímen Holográfico</h2>
          </div>
          <button
            type="button"
            class="h-7 px-2.5 rounded border border-rule font-mono text-[10px] text-dim hover:text-ink cursor-pointer"
            @click="copyImport('UiHoloCard')"
          >
            import
          </button>
        </div>

        <!-- Escenario 3D Expansivo de la Tarjeta Holográfica -->
        <div class="min-h-[280px] flex items-center justify-center p-4">
          <UiHoloCard :max-tilt="14" class="w-full max-w-[280px] rounded-2xl border border-white/20 bg-paper/95 p-5 shadow-2xl cursor-grab active:cursor-grabbing">
            <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between border-b border-rule/60 pb-2.5">
                <span class="font-mono text-[10px] uppercase tracking-wider text-sig font-bold">EDICIÓN ’26</span>
                <span class="w-2 h-2 rounded-full bg-green" />
              </div>
              <div class="flex flex-col gap-1">
                <span class="font-sans text-[18px] font-semibold text-ink leading-tight">Creative Engineer Specimen</span>
                <span class="font-mono text-[11px] text-dim">PostgreSQL 17 · Vue 3 · Nuxt 4</span>
              </div>
              <div class="pt-4 border-t border-rule/60 flex items-center justify-between font-mono text-[10px] text-faint">
                <span>PARANÁ, AR</span>
                <span class="text-ink font-semibold">0.99 LH / 100</span>
              </div>
            </div>
          </UiHoloCard>
        </div>

        <p class="font-mono text-[11px] text-dim m-0 text-center">
          {{ isEs ? 'Mové el cursor sobre la tarjeta para doblar la luz especular y la película arcoíris' : 'Move cursor over the card to bend specular light and rainbow foil reflection' }}
        </p>
      </section>

      <!-- ARTEFACTO 2: Kinetic Odometer & Wake Velocity Bar -->
      <section
        v-if="activeCategory === 'all' || activeCategory === 'springs'"
        class="border border-rule rounded-2xl p-6 sm:p-7 bg-surface/40 backdrop-blur-md flex flex-col justify-between gap-6 transition-all hover:border-rule-strong"
      >
        <div class="flex items-center justify-between border-b border-rule/60 pb-3">
          <div class="flex flex-col gap-0.5">
            <span class="font-mono text-[10px] uppercase tracking-wider text-sig">2nd-Order Momentum · Web Audio Ticks</span>
            <h2 class="font-sans text-[17px] font-semibold text-ink m-0">UiRollingCounter &amp; UiWakeSlider</h2>
          </div>
          <button
            type="button"
            class="h-7 px-2.5 rounded border border-rule font-mono text-[10px] text-dim hover:text-ink cursor-pointer"
            @click="copyImport('UiRollingCounter')"
          >
            import
          </button>
        </div>

        <!-- Escenario Interactivo Monumental del Odómetro -->
        <div class="min-h-[280px] flex flex-col items-center justify-center gap-6 p-4">
          <div class="flex flex-col items-center gap-2">
            <UiRollingCounter
              v-model="demoCounter"
              :digits="3"
              :bounce="50"
              :stagger="40"
              interactive
            />
            <span class="font-mono text-[11px] text-dim">
              {{ isEs ? 'Arrastrá los dígitos verticalmente para girar con inercia y audio tock' : 'Drag digits vertically to spin with momentum and tock audio' }}
            </span>
          </div>

          <div class="w-full max-w-[320px] pt-4 border-t border-rule/60 flex flex-col items-center gap-2">
            <UiWakeSlider
              v-model="demoWake"
              :bars="32"
              unit="ms"
            />
            <span class="font-mono text-[10px] text-faint">
              {{ isEs ? 'Barra cinética con inyección de energía por velocidad' : 'Kinetic bar injecting energy decaying exponentially' }}
            </span>
          </div>
        </div>

        <p class="font-mono text-[11px] text-dim m-0 text-center">
          {{ isEs ? 'Simulación física de odómetro analógico con motion blur y síntesis armónica' : 'Analog odometer physical simulation with motion blur and harmonic synthesis' }}
        </p>
      </section>

      <!-- ARTEFACTO 3: 3D Geodetic Dot Globe & Coordenadas -->
      <section
        v-if="activeCategory === 'all' || activeCategory === 'spatial'"
        class="border border-rule rounded-2xl p-6 sm:p-7 bg-surface/40 backdrop-blur-md flex flex-col justify-between gap-6 transition-all hover:border-rule-strong"
      >
        <div class="flex items-center justify-between border-b border-rule/60 pb-3">
          <div class="flex flex-col gap-0.5">
            <span class="font-mono text-[10px] uppercase tracking-wider text-sig">Canvas 3D · Geodesic Slerp Lift Arcs</span>
            <h2 class="font-sans text-[17px] font-semibold text-ink m-0">UiDotGlobe · Globo Geodésico 3D</h2>
          </div>
          <button
            type="button"
            class="h-7 px-2.5 rounded border border-rule font-mono text-[10px] text-dim hover:text-ink cursor-pointer"
            @click="copyImport('UiDotGlobe')"
          >
            import
          </button>
        </div>

        <div class="min-h-[280px] flex items-center justify-center p-4">
          <UiDotGlobe :size="200" home-city="Paraná, AR" class="cursor-grab active:cursor-grabbing" />
        </div>

        <div class="flex items-center justify-between font-mono text-[11px] text-dim border-t border-rule/60 pt-3">
          <span>PARANÁ, ARGENTINA</span>
          <span>31.73° S · 60.52° W</span>
          <span class="text-ink font-semibold">UTC-3</span>
        </div>
      </section>

      <!-- ARTEFACTO 4: Optical X-Ray Schematics Lens -->
      <section
        v-if="activeCategory === 'all' || activeCategory === 'spatial'"
        class="border border-rule rounded-2xl p-6 sm:p-7 bg-surface/40 backdrop-blur-md flex flex-col justify-between gap-6 transition-all hover:border-rule-strong"
      >
        <div class="flex items-center justify-between border-b border-rule/60 pb-3">
          <div class="flex flex-col gap-0.5">
            <span class="font-mono text-[10px] uppercase tracking-wider text-sig">Radial Lens Mask · Dual Layer Schematics</span>
            <h2 class="font-sans text-[17px] font-semibold text-ink m-0">UiCodeReveal · Lente de Rayos X</h2>
          </div>
          <button
            type="button"
            class="h-7 px-2.5 rounded border border-rule font-mono text-[10px] text-dim hover:text-ink cursor-pointer"
            @click="copyImport('UiCodeReveal')"
          >
            import
          </button>
        </div>

        <div class="min-h-[280px] flex items-center justify-center p-4">
          <UiCodeReveal :radius="110" class="w-full max-w-[340px]" />
        </div>

        <p class="font-mono text-[11px] text-dim m-0 text-center">
          {{ isEs ? 'Mové el cursor sobre la tarjeta para revelar el código PostgreSQL/Prisma subyacente' : 'Move cursor across the card to peel open the raw PostgreSQL/Prisma schema' }}
        </p>
      </section>

      <!-- ARTEFACTO 5: Slide to Confirm & Stateful Micro-Controls -->
      <section
        v-if="activeCategory === 'all' || activeCategory === 'tactile'"
        class="border border-rule rounded-2xl p-6 sm:p-7 bg-surface/40 backdrop-blur-md flex flex-col justify-between gap-6 transition-all hover:border-rule-strong"
      >
        <div class="flex items-center justify-between border-b border-rule/60 pb-3">
          <div class="flex flex-col gap-0.5">
            <span class="font-mono text-[10px] uppercase tracking-wider text-sig">Tactile 85% Commit Track · Specular Sweep</span>
            <h2 class="font-sans text-[17px] font-semibold text-ink m-0">UiSlideConfirm &amp; Tactile Actions</h2>
          </div>
          <button
            type="button"
            class="h-7 px-2.5 rounded border border-rule font-mono text-[10px] text-dim hover:text-ink cursor-pointer"
            @click="copyImport('UiSlideConfirm')"
          >
            import
          </button>
        </div>

        <div class="min-h-[280px] flex flex-col items-center justify-center gap-6 p-4">
          <!-- Slide Confirm -->
          <div class="flex flex-col items-center gap-2">
            <UiSlideConfirm
              :label="isEs ? 'Deslizá para confirmar commit' : 'Slide to commit transaction'"
              :confirmed-label="isEs ? 'Confirmado · 200 OK' : 'Committed · 200 OK'"
              @confirm="onSlideConfirmed"
            />
            <span v-if="demoConfirmStatus" class="font-mono text-[11px] text-green font-semibold animate-pulse">
              {{ demoConfirmStatus }}
            </span>
          </div>

          <!-- Micro-actions Cluster -->
          <div class="w-full pt-4 border-t border-rule/60 flex flex-wrap items-center justify-center gap-3">
            <UiCopyPill text="mateogabus@gmail.com" label="Copiar correo" copied-label="Correo copiado" />
            <UiSweepButton variant="primary">
              <span>{{ isEs ? 'Barrido Especular' : 'Specular Sweep' }}</span>
            </UiSweepButton>
            <UiSharePill title="Dossier Mateo Sonzogni" />
          </div>
        </div>

        <p class="font-mono text-[11px] text-dim m-0 text-center">
          {{ isEs ? 'Mecanismo de confirmación irreversible con umbral 85% y acorde chime armónico' : 'Irreversible commit slider with 85% threshold and Web Audio chime chord' }}
        </p>
      </section>

      <!-- ARTEFACTO 6: Autonomous AI Reasoning Trace -->
      <section
        v-if="activeCategory === 'all' || activeCategory === 'audio'"
        class="border border-rule rounded-2xl p-6 sm:p-7 bg-surface/40 backdrop-blur-md flex flex-col justify-between gap-6 transition-all hover:border-rule-strong"
      >
        <div class="flex items-center justify-between border-b border-rule/60 pb-3">
          <div class="flex flex-col gap-0.5">
            <span class="font-mono text-[10px] uppercase tracking-wider text-sig">Real-time Step Trace · Accordion Morph</span>
            <h2 class="font-sans text-[17px] font-semibold text-ink m-0">UiThinkingTrace · Eros AI Agent</h2>
          </div>
          <button
            type="button"
            class="h-7 px-2.5 rounded border border-rule font-mono text-[10px] text-dim hover:text-ink cursor-pointer"
            @click="copyImport('UiThinkingTrace')"
          >
            import
          </button>
        </div>

        <div class="min-h-[280px] flex items-center justify-center p-4">
          <div class="w-full max-w-[360px]">
            <UiThinkingTrace :steps="demoThinkingSteps" :pace="900" />
          </div>
        </div>

        <p class="font-mono text-[11px] text-dim m-0 text-center">
          {{ isEs ? 'Visualizador de pasos de inferencia IA en vivo con telemetría de milisegundos' : 'Live AI reasoning step accordion with millisecond execution telemetry' }}
        </p>
      </section>

      <!-- ARTEFACTO 7: Damped Vector Particle Field -->
      <section
        v-if="activeCategory === 'all' || activeCategory === 'springs'"
        class="border border-rule rounded-2xl p-6 sm:p-7 bg-surface/40 backdrop-blur-md flex flex-col justify-between gap-6 transition-all hover:border-rule-strong"
      >
        <div class="flex items-center justify-between border-b border-rule/60 pb-3">
          <div class="flex flex-col gap-0.5">
            <span class="font-mono text-[10px] uppercase tracking-wider text-sig">Vector Spring Field · Canvas Smoothstep</span>
            <h2 class="font-sans text-[17px] font-semibold text-ink m-0">UiMagneticDots · Campo Vectorial</h2>
          </div>
          <button
            type="button"
            class="h-7 px-2.5 rounded border border-rule font-mono text-[10px] text-dim hover:text-ink cursor-pointer"
            @click="copyImport('UiMagneticDots')"
          >
            import
          </button>
        </div>

        <div class="min-h-[280px] flex items-center justify-center p-4">
          <UiMagneticDots
            :width="300"
            :height="170"
            :pull="60"
            :radius="60"
            :spring="55"
            initial-shape="Lines"
            :spacing="13"
          />
        </div>

        <p class="font-mono text-[11px] text-dim m-0 text-center">
          {{ isEs ? 'Hacé clic sobre el campo para alternar entre Líneas y Puntos' : 'Click the field to toggle between Lines and Dotted particles' }}
        </p>
      </section>

      <!-- ARTEFACTO 8: 3D Folder Fan Spread -->
      <section
        v-if="activeCategory === 'all' || activeCategory === 'springs'"
        class="border border-rule rounded-2xl p-6 sm:p-7 bg-surface/40 backdrop-blur-md flex flex-col justify-between gap-6 transition-all hover:border-rule-strong"
      >
        <div class="flex items-center justify-between border-b border-rule/60 pb-3">
          <div class="flex flex-col gap-0.5">
            <span class="font-mono text-[10px] uppercase tracking-wider text-sig">Conic Polar Fan · Frosted Acrylic Flap</span>
            <h2 class="font-sans text-[17px] font-semibold text-ink m-0">UiFolderPreview · Abanico 3D</h2>
          </div>
          <button
            type="button"
            class="h-7 px-2.5 rounded border border-rule font-mono text-[10px] text-dim hover:text-ink cursor-pointer"
            @click="copyImport('UiFolderPreview')"
          >
            import
          </button>
        </div>

        <div class="min-h-[280px] flex items-center justify-center p-4">
          <UiFolderPreview :items="demoFolderItems" label="production/" count="03" compact />
        </div>

        <p class="font-mono text-[11px] text-dim m-0 text-center">
          {{ isEs ? 'Pasá el cursor para abrir la solapa y desplegar las tarjetas con origen polar' : 'Hover over the folder to pop the flap and fan out project cards in polar 3D' }}
        </p>
      </section>

      <!-- ARTEFACTO 9: macOS Raised Cosine Magnification Dock -->
      <section
        v-if="activeCategory === 'all' || activeCategory === 'springs'"
        class="border border-rule rounded-2xl p-6 sm:p-7 bg-surface/40 backdrop-blur-md flex flex-col justify-between gap-6 transition-all hover:border-rule-strong"
      >
        <div class="flex items-center justify-between border-b border-rule/60 pb-3">
          <div class="flex flex-col gap-0.5">
            <span class="font-mono text-[10px] uppercase tracking-wider text-sig">Cosine Magnification · Travelling Tooltip</span>
            <h2 class="font-sans text-[17px] font-semibold text-ink m-0">UiDock · Dock Táctil con Inercia</h2>
          </div>
          <button
            type="button"
            class="h-7 px-2.5 rounded border border-rule font-mono text-[10px] text-dim hover:text-ink cursor-pointer"
            @click="copyImport('UiDock')"
          >
            import
          </button>
        </div>

        <div class="min-h-[220px] flex items-center justify-center p-4">
          <UiDock v-model="activeDockKey" :items="demoDockItems" :magnify="1.3" />
        </div>

        <p class="font-mono text-[11px] text-dim m-0 text-center">
          {{ isEs ? 'Mové el cursor a lo largo del dock para experimentar la curva de magnificación de coseno elevado' : 'Glide cursor across dock to trigger the raised cosine magnification curve' }}
        </p>
      </section>

      <!-- ARTEFACTO 10: Real-time Web Audio Synthesizer & SQL Telemetry -->
      <section
        v-if="activeCategory === 'all' || activeCategory === 'audio'"
        class="border border-rule rounded-2xl p-6 sm:p-7 bg-surface/40 backdrop-blur-md flex flex-col justify-between gap-6 transition-all hover:border-rule-strong"
      >
        <div class="flex items-center justify-between border-b border-rule/60 pb-3">
          <div class="flex flex-col gap-0.5">
            <span class="font-mono text-[10px] uppercase tracking-wider text-sig">Web Audio API · Real-time SQL Readout</span>
            <h2 class="font-sans text-[17px] font-semibold text-ink m-0">UiAudioVisualizer &amp; UiTelemetryPill</h2>
          </div>
          <button
            type="button"
            class="h-7 px-2.5 rounded border border-rule font-mono text-[10px] text-dim hover:text-ink cursor-pointer"
            @click="copyImport('UiAudioVisualizer')"
          >
            import
          </button>
        </div>

        <div class="min-h-[220px] flex flex-col items-center justify-center gap-5 p-4">
          <div class="w-full max-w-[320px]">
            <UiAudioVisualizer compact />
          </div>
          <div class="pt-3 border-t border-rule/60 flex items-center justify-center">
            <UiTelemetryPill collection="projects" :count="28" :api-healthy="true" />
          </div>
        </div>

        <p class="font-mono text-[11px] text-dim m-0 text-center">
          {{ isEs ? 'Espectro de frecuencia armónica en Web Audio API con popover de consulta relacional' : 'Harmonic frequency spectrum on Web Audio API with relational query popover' }}
        </p>
      </section>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 3. AWWWARDS FULL-WIDTH PROJECT INDEX: DENNIS SNELLENBERG FLOATING PREVIEW-->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <section
      v-if="activeCategory === 'all' || activeCategory === 'hero' || activeCategory === 'spatial'"
      class="border border-rule-strong rounded-2xl p-6 sm:p-8 bg-paper/60 backdrop-blur-xl flex flex-col gap-6 shadow-2xl overflow-hidden"
      aria-label="Índice de Proyectos con Ventana Flotante por Resorte"
    >
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-4">
        <div class="flex flex-col gap-0.5">
          <span class="font-mono text-[10.5px] uppercase tracking-wider text-sig font-semibold">
            Dennis Snellenberg Style · Floating Spring Reel
          </span>
          <h2 class="font-sans text-[20px] sm:text-[24px] font-semibold text-ink m-0">
            UiCursorWorkList · Índice Arquitectónico Awwwards
          </h2>
        </div>
        <button
          type="button"
          class="h-7 px-3 rounded-md border border-rule font-mono text-[10.5px] text-dim hover:text-ink cursor-pointer"
          @click="copyImport('UiCursorWorkList')"
        >
          import { UiCursorWorkList }
        </button>
      </div>

      <div class="w-full">
        <UiCursorWorkList :items="demoWorkListItems" />
      </div>

      <p class="font-mono text-[11px] text-dim m-0 text-center">
        {{ isEs ? 'Al mover el cursor sobre las filas, la ventana flotante amortiguada con inclinación 3D sigue el puntero' : 'Hover rows to reveal the damped floating spring preview following the pointer with dynamic 3D tilt' }}
      </p>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 4. EXPLORADOR DEL SISTEMA DE ARCHIVOS (ÁRBOL DE COMPONENTES BENCHO)     -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <section class="border border-rule rounded-2xl p-6 sm:p-8 bg-surface/30 flex flex-col gap-5">
      <div class="flex items-center justify-between border-b border-rule pb-3">
        <div class="flex flex-col gap-0.5">
          <span class="font-mono text-[10px] uppercase tracking-wider text-sig">CAD Tree Geometry · Polite Keyboard</span>
          <h2 class="font-sans text-[18px] font-semibold text-ink m-0">UiTreeView · Arquitectura de Primitivas</h2>
        </div>
        <span class="font-mono text-[11px] text-dim">28 Primitives Registered</span>
      </div>

      <div class="py-2">
        <UiTreeView :root="demoTreeRoot" :initial-open="['app/components/ui', 'app/components/ui/springs', 'app/components/ui/spatial-3d']" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.explorer-lab {
  animation: lab-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes lab-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .explorer-lab {
    animation: none !important;
  }
}
</style>
