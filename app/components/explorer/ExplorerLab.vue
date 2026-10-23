<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePortfolioLocale } from '~/composables/usePortfolioLocale'
import { useHyperfocus } from '~/composables/useHyperfocus'
import { useBenchoSound } from '~/composables/useBenchoSound'
import AppIcon from '~/components/ui/AppIcon.vue'
import UiSpotlightCard from '~/components/ui/UiSpotlightCard.vue'
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
import UiHubDiagram from '~/components/ui/UiHubDiagram.vue'
import UiCodeReveal from '~/components/ui/UiCodeReveal.vue'
import UiHoloCard from '~/components/ui/UiHoloCard.vue'
import UiBlueprintCard from '~/components/ui/UiBlueprintCard.vue'
import UiDynamicIsland from '~/components/ui/UiDynamicIsland.vue'
import UiThinkingTrace from '~/components/ui/UiThinkingTrace.vue'
import UiTreeView, { type TreeNode } from '~/components/ui/UiTreeView.vue'
import UiTextBlurReveal from '~/components/ui/UiTextBlurReveal.vue'
import UiProgressiveBlur from '~/components/ui/UiProgressiveBlur.vue'
import UiResizablePanels from '~/components/ui/UiResizablePanels.vue'
import UiCursorWorkList, { type CursorWorkItem } from '~/components/ui/UiCursorWorkList.vue'

const { isEs } = usePortfolioLocale()
const { isHyperfocus } = useHyperfocus()
const { soundEnabled, toggleSound, playSound } = useBenchoSound()

// Categorías y filtros
type Category = 'all' | 'springs' | 'tactile' | 'spatial' | 'surfaces' | 'audio'
const activeCategory = ref<Category>('all')
const searchQuery = ref('')
const copiedSnippet = ref<string | null>(null)

const categories = computed(() => {
  const allCount = catalog.length
  const springsCount = catalog.filter(c => c.category === 'springs').length
  const tactileCount = catalog.filter(c => c.category === 'tactile').length
  const spatialCount = catalog.filter(c => c.category === 'spatial').length
  const surfacesCount = catalog.filter(c => c.category === 'surfaces').length
  const audioCount = catalog.filter(c => c.category === 'audio').length

  return [
    { value: 'all', label: isEs.value ? `Todos (${allCount})` : `All (${allCount})`, count: allCount },
    { value: 'springs', label: isEs.value ? `Física & Resortes (${springsCount})` : `Springs & Physics (${springsCount})`, count: springsCount },
    { value: 'tactile', label: isEs.value ? `Controles Táctiles (${tactileCount})` : `Tactile Controls (${tactileCount})`, count: tactileCount },
    { value: 'spatial', label: isEs.value ? `Spatial 3D & Canvas (${spatialCount})` : `Spatial 3D & Canvas (${spatialCount})`, count: spatialCount },
    { value: 'surfaces', label: isEs.value ? `Superficies & Lentes (${surfacesCount})` : `Surfaces & Optics (${surfacesCount})`, count: surfacesCount },
    { value: 'audio', label: isEs.value ? `Audio & Trazas (${audioCount})` : `Audio & Traces (${audioCount})`, count: audioCount },
  ]
})

// Componentes catalogados con metadatos
interface CatalogItem {
  id: string
  name: string
  tag: string
  category: Category
  descEs: string
  descEn: string
  file: string
  tags: string[]
}

const catalog: CatalogItem[] = [
  // 1. Física & Resortes
  {
    id: 'rolling-counter',
    name: 'UiRollingCounter',
    tag: 'SPRING ODOMETER · 2ND ORDER',
    category: 'springs',
    descEs: 'Contador odómetro numérico con física de resortes, motion blur dinámico y drag vertical interactivo con inercia.',
    descEn: 'Numeric odometer counter with spring physics, dynamic motion blur, and interactive vertical drag with inertia.',
    file: 'UiRollingCounter.vue',
    tags: ['Springs', 'Odometer', 'Motion Blur', 'Audio tock'],
  },
  {
    id: 'wake-slider',
    name: 'UiWakeSlider',
    tag: 'KINETIC BAR SLIDER · E-DECAY',
    category: 'springs',
    descEs: 'Slider de barras sin thumb táctil donde arrastrar inyecta energía cinética que decae exponencialmente.',
    descEn: 'Thumbless tactile bar slider where dragging injects kinetic energy decaying exponentially via rAF.',
    file: 'UiWakeSlider.vue',
    tags: ['Kinetic', 'Audio notch', 'Springs', 'Energy Decay'],
  },
  {
    id: 'magnetic-dots',
    name: 'UiMagneticDots',
    tag: 'VECTOR SPRING FIELD · CANVAS',
    category: 'springs',
    descEs: 'Campo de partículas amortiguadas en Canvas que reacciona al puntero con falloff suave y deformación elíptica.',
    descEn: 'Damped particle field on HTML5 Canvas reacting to pointer with smoothstep falloff and elliptical stretch.',
    file: 'UiMagneticDots.vue',
    tags: ['Canvas 2D', 'Vector Field', 'Damped Springs'],
  },
  {
    id: 'folder-preview',
    name: 'UiFolderPreview',
    tag: '3D FOLDER SPREAD · FROSTED FLAP',
    category: 'springs',
    descEs: 'Carpeta con abanico 3D de tarjetas con origen polar y solapa esmerilada con perspectiva cónica.',
    descEn: 'Folder with 3D polar fan card spread and frosted flap with conic perspective transform.',
    file: 'UiFolderPreview.vue',
    tags: ['3D Fan', 'Backdrop Blur', 'Audio slide/poke'],
  },
  {
    id: 'dock',
    name: 'UiDock',
    tag: 'RAISED COSINE MAGNIFICATION',
    category: 'springs',
    descEs: 'Dock estilo macOS con curva de magnificación de coseno elevado, tooltip viajero continuo y dot activo.',
    descEn: 'macOS-inspired dock with raised cosine magnification curve, travelling tooltip pill, and active dot.',
    file: 'UiDock.vue',
    tags: ['Cosine Magnification', 'Travelling Tooltip', 'Audio drag'],
  },
  {
    id: 'segmented-switch',
    name: 'UiSegmentedSwitch',
    tag: 'SLIDING ACTIVE PILL · SPRING CUBIC',
    category: 'springs',
    descEs: 'Control segmentado táctil con fondo activo deslizante que calcula transformaciones matriciales 3D.',
    descEn: 'Tactile segmented control with sliding active pill calculating 3D translate matrix on click.',
    file: 'UiSegmentedSwitch.vue',
    tags: ['Morphing Pill', 'Accessible Tablist', 'Audio notch'],
  },
  {
    id: 'resizable-panels',
    name: 'UiResizablePanels',
    tag: 'TACTILE SPLIT · SPRING SNAP',
    category: 'springs',
    descEs: 'Divisor de paneles interactivo con resistencia elástica, snap magnético bajo el umbral y control por teclado.',
    descEn: 'Interactive split pane divider with spring resistance, magnetic snap shut under threshold, and keyboard navigation.',
    file: 'UiResizablePanels.vue',
    tags: ['Split Panels', 'Spring Snap', 'Keyboard Accessible'],
  },

  // 2. Controles Táctiles
  {
    id: 'slide-confirm',
    name: 'UiSlideConfirm',
    tag: 'SLIDE TO COMMIT · TRAVEL FILL',
    category: 'tactile',
    descEs: 'Control de deslizamiento para confirmación que rellena la pista al 85% y emite confirmación con chime armónico.',
    descEn: 'Slide-to-confirm mechanism filling the track past 85% travel and emitting confirmation with chime tone.',
    file: 'UiSlideConfirm.vue',
    tags: ['Slide to Confirm', 'Non-teleporting grab', 'Audio chime'],
  },
  {
    id: 'share-pill',
    name: 'UiSharePill',
    tag: 'PARTING AVATARS · MORPHING PILL',
    category: 'tactile',
    descEs: 'Píldora colaborativa con avatares que se separan físicamente al pasar el cursor y botón de copiado con check.',
    descEn: 'Collaborative pill with parting node avatars, travelling tooltip, and checkmark morphing copy button.',
    file: 'UiSharePill.vue',
    tags: ['Parting Nodes', 'Checkmark morph', 'Audio pop'],
  },
  {
    id: 'copy-pill',
    name: 'UiCopyPill',
    tag: 'STATEFUL HALF-SECOND COPY',
    category: 'tactile',
    descEs: 'Botón de copiado con morfismo en 3 fases: reposo, copiado (check animado) y retorno automático.',
    descEn: 'Stateful copy button morphing smoothly across idle, copied with animated checkmark, and reset.',
    file: 'UiCopyPill.vue',
    tags: ['Clipboard API', 'SVG Dashoffset', 'Polite ARIA'],
  },
  {
    id: 'click-spark',
    name: 'UiClickSpark',
    tag: 'GEOMETRIC PARTICLE BURST',
    category: 'tactile',
    descEs: 'Ráfaga radial de chispas geométricas en Canvas al hacer clic, con pool de partículas y audio procedural pop.',
    descEn: 'Radial geometric spark burst on HTML5 canvas with particle pool and procedural Web Audio pop.',
    file: 'UiClickSpark.vue',
    tags: ['Canvas Particles', 'RequestAnimationFrame', 'Audio pop'],
  },
  {
    id: 'sweep-button',
    name: 'UiSweepButton',
    tag: 'SPECULAR RIM SWEEP · ACTIVE SCALE',
    category: 'tactile',
    descEs: 'Botón con barrido de luz especular en borde y respuesta táctil en menos de 16 milisegundos.',
    descEn: 'Button with specular rim sweep animation and tactile response under 16 milliseconds.',
    file: 'UiSweepButton.vue',
    tags: ['Specular Sweep', 'Linear 2026', 'Tactile Scale'],
  },
  {
    id: 'telemetry-pill',
    name: 'UiTelemetryPill',
    tag: 'MONOSPACE SQL/REST READOUT',
    category: 'tactile',
    descEs: 'Píldora de barra de estado con lectura en vivo de telemetría y micro-popover con query PostgreSQL y botón de copia.',
    descEn: 'Status bar telemetry pill with live query readout and upward popover inspecting raw PostgreSQL query.',
    file: 'UiTelemetryPill.vue',
    tags: ['SQL Inspector', 'Pop-over', 'Copy Query'],
  },

  // 3. Spatial 3D & Canvas
  {
    id: 'dot-globe',
    name: 'UiDotGlobe',
    tag: '3D DOTTED SPHERE · SLERP ARCS',
    category: 'spatial',
    descEs: 'Globo terráqueo tridimensional en Canvas con rotación con inercia y arcos geodésicos proyectados desde Argentina.',
    descEn: '3D dotted sphere on Canvas with inertia rotation and lifted slerp arcs projected from Patagonia, Argentina.',
    file: 'UiDotGlobe.vue',
    tags: ['Canvas 3D', 'Slerp Lifted Arcs', 'Drag Inertia'],
  },
  {
    id: 'hub-diagram',
    name: 'UiHubDiagram',
    tag: 'RADIAL PACKET TRANSMISSION',
    category: 'spatial',
    descEs: 'Diagrama radial SVG de arquitectura técnica con disparo de paquetes cinéticos en spokes sobre hover.',
    descEn: 'Radial SVG technical diagram firing kinetic packet streaks across spokes upon hovering node pills.',
    file: 'UiHubDiagram.vue',
    tags: ['SVG Geometry', 'Packet Streaks', 'Spoke Highlight'],
  },
  {
    id: 'code-reveal',
    name: 'UiCodeReveal',
    tag: 'X-RAY LENS MASK · DUAL LAYER',
    category: 'spatial',
    descEs: 'Tarjeta de doble capa con lente de rayos X que revela el código TypeScript/Prisma subyacente bajo el cursor.',
    descEn: 'Dual-layer card with smooth x-ray circular mask revealing syntax-highlighted code beneath pointer.',
    file: 'UiCodeReveal.vue',
    tags: ['CSS Mask Radial', 'Dual Layer', 'Interactive Lens'],
  },
  {
    id: 'holo-card',
    name: 'UiHoloCard',
    tag: 'DAMPED 3D TILT · FOIL GLARE',
    category: 'spatial',
    descEs: 'Tarjeta con inclinación 3D amortiguada (resorte exponencial), lámina iridiscente y resplandor especular.',
    descEn: '3D damped spring tilt card with iridiscent holographic rainbow foil and specular cursor glare.',
    file: 'UiHoloCard.vue',
    tags: ['Perspective 900px', 'Holographic Foil', 'Specular Rim'],
  },
  {
    id: 'blueprint-card',
    name: 'UiBlueprintCard',
    tag: 'ARCHITECTURAL CAD WIREFRAME',
    category: 'spatial',
    descEs: 'Contenedor que dibuja retícula de puntos CAD, guías de cota milimétrica y wipe-in antes de fijar el contenido.',
    descEn: 'CAD architectural container drawing dot grid, guide rulers, and wireframe wipe before card reveal.',
    file: 'UiBlueprintCard.vue',
    tags: ['CAD Grid', 'Blueprint Reveal', 'Dimension Guide'],
  },
  {
    id: 'cursor-work-list',
    name: 'UiCursorWorkList',
    tag: 'AWWWARDS KINETIC HOVER REEL',
    category: 'spatial',
    descEs: 'Lista interactiva de proyectos con carrete vertical de imágenes que sigue al cursor con física de resorte y tilt.',
    descEn: 'Interactive work list with vertical image reel tracking cursor via damped spring physics and tilt.',
    file: 'UiCursorWorkList.vue',
    tags: ['Awwwards', 'Kinetic Reel', 'Spring Follow'],
  },

  // 4. Superficies & Lentes
  {
    id: 'spotlight-card',
    name: 'UiSpotlightCard',
    tag: 'CURSOR-TRACKING RADIAL SPOTLIGHT',
    category: 'surfaces',
    descEs: 'Contenedor con haz de luz radial sutil que sigue al cursor e ilumina el borde solo en la proximidad.',
    descEn: 'Container with subtle radial spotlight following cursor and illuminating surface border nearby.',
    file: 'UiSpotlightCard.vue',
    tags: ['CSS Variables', 'Radial Gradient', 'Zero Layout Shift'],
  },
  {
    id: 'border-beam',
    name: 'UiBorderBeam',
    tag: 'LASER BEAM · CONIC GRADIENT',
    category: 'surfaces',
    descEs: 'Haz de luz perimetral tipo láser que viaja por el contorno de la tarjeta mediante conic-gradient y máscara.',
    descEn: 'Travelling laser perimeter beam circling card contour using conic-gradient, drop shadow, and mask.',
    file: 'UiBorderBeam.vue',
    tags: ['Conic Gradient', 'Laser Border', 'Hyperfocus Aware'],
  },
  {
    id: 'dynamic-island',
    name: 'UiDynamicIsland',
    tag: 'SPRING DYNAMIC ISLAND · K=380',
    category: 'surfaces',
    descEs: 'Píldora flotante cuyo ancho, alto y border-radius se deforman en simultáneo con un resorte de segundo orden.',
    descEn: 'Floating island whose width, height, and border-radius spring smoothly together on 2nd-order damped physics.',
    file: 'UiDynamicIsland.vue',
    tags: ['2nd-order Springs', 'Morphing Island', 'PostgreSQL Readout'],
  },
  {
    id: 'progressive-blur',
    name: 'UiProgressiveBlur',
    tag: 'OPTICAL 6-LAYER GRADIENT BLUR',
    category: 'surfaces',
    descEs: 'Pila de 6 capas de desenfoque progresivo con máscaras difuminadas que disuelven los bordes de scroll ópticamente.',
    descEn: '6-layer progressive optical blur stack with feathered mask bands dissolving scroll edges like a camera lens.',
    file: 'UiProgressiveBlur.vue',
    tags: ['Camera Lens Blur', 'Feathered Masks', 'Backdrop Filter'],
  },

  // 5. Audio & Trazas
  {
    id: 'audio-visualizer',
    name: 'UiAudioVisualizer',
    tag: 'WEB AUDIO API · SOUNDBENCH',
    category: 'audio',
    descEs: 'Consola interactiva de síntesis de audio procedural: ecualizador en vivo y pads para disparar las 7 notas.',
    descEn: 'Interactive procedural audio synthesis console: live equalizer bars and trigger pads for 7 sound notes.',
    file: 'UiAudioVisualizer.vue',
    tags: ['Web Audio API', 'Equalizer', 'Procedural Synthesis'],
  },
  {
    id: 'thinking-trace',
    name: 'UiThinkingTrace',
    tag: 'AI REASONING TIMELINE · SHINE',
    category: 'audio',
    descEs: 'Línea de tiempo de razonamiento estructurado con shimmer animado, pasos progresivos y botón de replay.',
    descEn: 'Structured AI reasoning timeline with animated gradient shimmer, progressive steps, and replay action.',
    file: 'UiThinkingTrace.vue',
    tags: ['Thinking Steps', 'Shimmer Shine', 'Collapsible Drawer'],
  },
  {
    id: 'decrypted-text',
    name: 'UiDecryptedText',
    tag: 'CIPHER DECODER · ZERO CLS',
    category: 'audio',
    descEs: 'Decodificador de texto monoespaciado en el lugar con glifos aleatorios temporales y cero layout shift.',
    descEn: 'In-place monospace cipher text decoder with randomized temporary glyphs and zero layout shift.',
    file: 'UiDecryptedText.vue',
    tags: ['Cipher Decoder', 'Zero CLS', 'Audio tock'],
  },
  {
    id: 'tree-view',
    name: 'UiTreeView',
    tag: 'INTERACTIVE ARCHITECTURE TREE',
    category: 'audio',
    descEs: 'Árbol jerárquico interactivo con guías verticales punteadas, animación de expansión y navegación por teclado.',
    descEn: 'Interactive hierarchical tree with dashed vertical guides, smooth expansion stagger, and keyboard navigation.',
    file: 'UiTreeView.vue',
    tags: ['Tree View', 'Dashed Guides', 'Audio press'],
  },
  {
    id: 'text-blur-reveal',
    name: 'UiTextBlurReveal',
    tag: 'KINETIC BLUR-TO-FOCUS TYPOGRAPHY',
    category: 'audio',
    descEs: 'Revelación tipográfica cinética palabra por palabra con desenfoque óptico escalonado y respeto a reduced-motion.',
    descEn: 'Kinetic word-by-word typographic reveal with staggered optical blur and reduced-motion safety.',
    file: 'UiTextBlurReveal.vue',
    tags: ['Text Blur', 'Staggered Delay', 'Reduced Motion Safe'],
  },
]

// Filtrado reactivo por categoría y búsqueda
const filteredCatalog = computed(() => {
  return catalog.filter(item => {
    const matchesCategory = activeCategory.value === 'all' || item.category === activeCategory.value
    if (!matchesCategory) return false

    if (!searchQuery.value.trim()) return true
    const q = searchQuery.value.toLowerCase().trim()
    return (
      item.name.toLowerCase().includes(q) ||
      item.tag.toLowerCase().includes(q) ||
      item.descEs.toLowerCase().includes(q) ||
      item.descEn.toLowerCase().includes(q) ||
      item.tags.some(t => t.toLowerCase().includes(q))
    )
  })
})

// Variables interactivas para los playgrounds
const demoCounter = ref(418)
const demoWake = ref(68)
const demoBeamSpeed = ref(8)
const demoDecryptedReplay = ref(0)
const demoConfirmStatus = ref('')
const demoDockKey = ref('projects')
const demoSegment = ref('frontend')
const demoSegmentOptions = computed(() => [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'ai', label: 'Eros AI' },
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
    role: 'Design Eng',
    year: '2026',
    status: 'LIVE',
    cover: '/media/projects/la-rucula.png',
    to: '/projects/la-rucula',
    chips: ['Nuxt 4', 'GSAP'],
  },
  {
    slug: 'arg-piscinas',
    num: '02',
    title: 'ARG Piscinas',
    role: 'Fullstack CMS',
    year: '2026',
    status: 'LIVE',
    cover: '/media/projects/arg-piscinas.png',
    to: '/projects/arg-piscinas',
    chips: ['Express 5', 'PostgreSQL 17'],
  },
])

const demoThinkingSteps = computed(() => isEs.value ? [
  'Inicializando osciladores Web Audio API (frecuencia portadora 880 Hz).',
  'Resolviendo resortes amortiguados de segundo orden en requestAnimationFrame.',
  'Proyectando arcos geodésicos con interpolación slerp tridimensional.',
  'Verificando consistencia visual en 4 temas y modo hiperfoco.',
] : [
  'Initializing Web Audio API oscillators (carrier frequency 880 Hz).',
  'Solving second-order damped springs in requestAnimationFrame.',
  'Projecting 3D slerp lifted geodesic arcs across coordinates.',
  'Verifying visual consistency across 4 themes and Zen hyperfocus.',
])

const demoTreeRoot: TreeNode = {
  name: 'app/components/ui',
  meta: '31 primitives',
  kids: [
    {
      name: 'springs',
      kids: [
        { name: 'UiRollingCounter.vue', meta: 'odometer' },
        { name: 'UiWakeSlider.vue', meta: 'kinetic' },
        { name: 'UiMagneticDots.vue', meta: 'canvas' },
      ],
    },
    {
      name: 'spatial-3d',
      kids: [
        { name: 'UiDotGlobe.vue', meta: '3D slerp' },
        { name: 'UiHubDiagram.vue', meta: 'packets' },
        { name: 'UiCodeReveal.vue', meta: 'x-ray' },
      ],
    },
    {
      name: 'surfaces',
      kids: [
        { name: 'UiBorderBeam.vue', meta: 'laser' },
        { name: 'UiSpotlightCard.vue', meta: 'radial' },
      ],
    },
  ],
}

const demoDockItems = [
  { key: 'home', label: 'db / root', icon: 'db' },
  { key: 'projects', label: 'projects (06)', icon: 'folder' },
  { key: 'stack', label: 'stack (22)', icon: 'code' },
  { key: 'lab', label: 'ui lab (31)', icon: 'cpu' },
]

function copyImport(componentName: string) {
  const snippet = `import { ${componentName} } from '~/components/ui'`
  if (import.meta.client && navigator.clipboard) {
    navigator.clipboard.writeText(snippet)
      .then(() => {
        copiedSnippet.value = componentName
        playSound('pop')
        setTimeout(() => {
          if (copiedSnippet.value === componentName) {
            copiedSnippet.value = null
          }
        }, 1800)
      })
      .catch(() => {
        copiedSnippet.value = componentName
        setTimeout(() => {
          if (copiedSnippet.value === componentName) {
            copiedSnippet.value = null
          }
        }, 1800)
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
  <div class="explorer-lab w-full flex flex-col gap-6" role="region" :aria-label="isEs ? 'Laboratorio de Componentes UI' : 'UI Component Laboratory'">
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- CABECERA PRINCIPAL: LINEAR 2026 EDITORIAL                             -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <header class="lab-header flex flex-col gap-4 pb-5 border-b border-rule">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-sig">
            <span class="w-2 h-2 rounded-full bg-sig shrink-0" />
            <span>{{ isEs ? '07 · LABORATORIO DE INTERFACES // SONZOGNI × BENCHO UI v2.0' : '07 · UI INTERACTION LAB // SONZOGNI × BENCHO UI v2.0' }}</span>
          </span>
          <span class="px-2 py-0.5 rounded-full bg-surface-raised border border-rule font-mono text-[10px] text-dim shrink-0">
            {{ catalog.length }} Primitives
          </span>
          <span v-if="isHyperfocus" class="px-2 py-0.5 rounded-full bg-sig/10 border border-sig text-sig font-mono text-[10px] font-semibold shrink-0">
            ZEN HYPERFOCUS
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-rule bg-surface/80 hover:bg-hover hover:border-rule-strong font-mono text-[11px] text-dim hover:text-ink transition-colors cursor-pointer"
            :title="isEs ? 'Alternar audio procedimental' : 'Toggle procedural audio'"
            @click="toggleSound"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="soundEnabled ? 'bg-green' : 'bg-faint'" />
            <span>{{ soundEnabled ? 'Audio ON' : 'Audio OFF' }}</span>
          </button>
        </div>
      </div>

      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div class="flex flex-col gap-1.5 max-w-[760px]">
          <h1 class="font-sans text-[clamp(22px,2.6vw,32px)] font-semibold tracking-[-0.03em] leading-tight text-ink m-0">
            {{ isEs ? 'Catálogo de Físicas, Óptica & Micro-interacciones' : 'Physics, Optics & Micro-interactions Catalog' }}
          </h1>
          <p class="font-sans text-[13.5px] leading-relaxed text-dim m-0">
            {{ isEs
              ? 'Colección de 31 componentes interactivos de autor inspirados en Bencho UI y Vue Bits. Cada bloque incorpora resortes amortiguados de segundo orden, síntesis acústica en Web Audio API, máscaras de difracción óptica y soporte estricto para modo hiperfoco y accesibilidad.'
              : 'Collection of 31 author-crafted interactive components inspired by Bencho UI and Vue Bits. Every primitive embeds 2nd-order damped springs, Web Audio API procedural synthesis, optical diffraction masks, and strict compliance with Zen hyperfocus and screen readers.'
            }}
          </p>
        </div>

        <!-- Barra de búsqueda rápida -->
        <div class="relative w-full md:w-64 shrink-0">
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="isEs ? 'Buscar componente (ej: spring, audio)...' : 'Search component (e.g. spring, audio)...'"
            class="lab-search-input w-full h-8.5 pl-8 pr-3 rounded-lg border border-rule bg-surface/60 hover:bg-surface focus:bg-surface focus:border-sig text-ink font-mono text-[11px] outline-none transition-all placeholder:text-faint"
          >
          <AppIcon name="search" :size="13" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-dim pointer-events-none" />
        </div>
      </div>

      <!-- Barra de Filtros por Categoría -->
      <div class="flex flex-wrap items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
        <button
          v-for="cat in categories"
          :key="cat.value"
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border font-mono text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
          :class="activeCategory === cat.value
            ? 'border-sig bg-sig/10 text-sig font-semibold'
            : 'border-rule bg-surface/60 text-dim hover:text-ink hover:border-rule-strong hover:bg-hover'"
          @click="activeCategory = (cat.value as Category); playSound('tock', { gap: 40 })"
        >
          <span>{{ cat.label }}</span>
        </button>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- GRILLA PRINCIPAL DE COMPONENTES INTERACTIVOS                          -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div v-if="filteredCatalog.length > 0" class="lab-grid grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        v-for="item in filteredCatalog"
        :key="item.id"
        class="lab-card-wrapper"
      >
        <UiSpotlightCard class="surface-10k rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full border border-rule transition-all duration-200 hover:border-rule-strong">
          <!-- Top Bar de la Tarjeta del Componente -->
          <div class="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-rule/60">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-1.5 h-1.5 rounded-full bg-sig shrink-0" />
              <h2 class="font-sans text-[15px] font-semibold tracking-tight text-ink m-0 truncate">
                {{ item.name }}
              </h2>
              <span class="font-mono text-[10px] text-faint hidden sm:inline truncate">
                {{ item.file }}
              </span>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                class="copy-import-btn inline-flex items-center gap-1 px-2 py-0.5 rounded border font-mono text-[10px] transition-all cursor-pointer"
                :class="copiedSnippet === item.name
                  ? 'border-green bg-green/10 text-green font-semibold'
                  : 'border-rule bg-paper/60 text-dim hover:text-ink hover:border-rule-strong hover:bg-hover active:scale-[0.97]'"
                :title="isEs ? 'Copiar importación' : 'Copy import statement'"
                @click="copyImport(item.name)"
              >
                <AppIcon v-if="copiedSnippet === item.name" name="check" :size="10" />
                <AppIcon v-else name="copy" :size="10" />
                <span>{{ copiedSnippet === item.name ? (isEs ? 'Copiado' : 'Copied') : 'import' }}</span>
              </button>
            </div>
          </div>

          <!-- Escenario Interactivo Live (Playground) -->
          <div class="lab-stage flex-1 min-h-[170px] w-full flex items-center justify-center p-3 rounded-lg bg-paper/40 border border-rule/40 overflow-hidden relative">
            
            <!-- 1. UiBorderBeam -->
            <template v-if="item.id === 'border-beam'">
              <div class="relative w-full max-w-[280px] p-4 rounded-xl border border-rule bg-surface/80 flex flex-col gap-2">
                <UiBorderBeam :duration="demoBeamSpeed" :border-width="1.8" :size="180" />
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[10px] uppercase tracking-wider text-sig">Laser Beam</span>
                  <span class="font-mono text-[10.5px] text-dim">{{ demoBeamSpeed }}s</span>
                </div>
                <span class="font-sans text-[13px] font-semibold text-ink">Conic Traveling Laser</span>
                <div class="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    class="px-2 py-0.5 rounded bg-paper border border-rule text-dim hover:text-ink font-mono text-[10px] cursor-pointer"
                    @click="demoBeamSpeed = demoBeamSpeed === 4 ? 8 : demoBeamSpeed === 8 ? 12 : 4; playSound('notch')"
                  >
                    {{ isEs ? 'Velocidad: ' : 'Speed: ' }}{{ demoBeamSpeed }}s
                  </button>
                </div>
              </div>
            </template>

            <!-- 2. UiClickSpark -->
            <template v-else-if="item.id === 'click-spark'">
              <UiClickSpark spark-color="var(--d-sig, #ff3e00)" :spark-count="14" class="w-full h-full flex flex-col items-center justify-center py-4">
                <button
                  type="button"
                  class="px-4 py-2 rounded-lg bg-ink text-paper font-sans text-[12.5px] font-medium shadow-xs hover:opacity-90 active:scale-[0.96] transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <AppIcon name="sparkles" :size="13" />
                  <span>{{ isEs ? 'Hacer clic para detonar chispas' : 'Click to burst sparks' }}</span>
                </button>
                <span class="font-mono text-[10px] text-dim mt-2">
                  {{ isEs ? 'Partículas geométricas + Web Audio pop' : 'Geometric particles + Web Audio pop' }}
                </span>
              </UiClickSpark>
            </template>

            <!-- 3. UiAudioVisualizer -->
            <template v-else-if="item.id === 'audio-visualizer'">
              <div class="w-full max-w-[340px]">
                <UiAudioVisualizer compact />
              </div>
            </template>

            <!-- 4. UiDecryptedText -->
            <template v-else-if="item.id === 'decrypted-text'">
              <div :key="demoDecryptedReplay" class="flex flex-col items-center gap-2 text-center py-2">
                <UiDecryptedText
                  text="POSTGRESQL 17 · HYPERFOCUS 2026"
                  class="font-mono text-[15px] sm:text-[17px] font-bold tracking-wider text-ink"
                  cursor="_"
                  :speed="45"
                  hover-replay
                />
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-rule bg-paper text-dim hover:text-ink font-mono text-[10.5px] cursor-pointer active:scale-[0.98]"
                  @click="demoDecryptedReplay++"
                >
                  <AppIcon name="refresh" :size="11" />
                  <span>{{ isEs ? 'Re-decodificar' : 'Replay cipher' }}</span>
                </button>
              </div>
            </template>

            <!-- 5. UiRollingCounter -->
            <template v-else-if="item.id === 'rolling-counter'">
              <div class="flex flex-col items-center gap-2 py-1">
                <UiRollingCounter v-model="demoCounter" :digits="4" :bounce="45" interactive />
                <span class="font-mono text-[10.5px] text-dim">
                  {{ isEs ? 'Arrastrá los números verticalmente para girar' : 'Drag numbers vertically to spin odometer' }}
                </span>
              </div>
            </template>

            <!-- 6. UiWakeSlider -->
            <template v-else-if="item.id === 'wake-slider'">
              <div class="w-full max-w-[280px] flex flex-col gap-2 py-1">
                <UiWakeSlider v-model="demoWake" :bars="28" :label="isEs ? 'Potencia cinética' : 'Kinetic energy'" />
                <span class="font-mono text-[10px] text-dim text-center">
                  {{ isEs ? 'Inyecta energía por velocidad con audio notch' : 'Injects velocity energy with notch audio' }}
                </span>
              </div>
            </template>

            <!-- 7. UiMagneticDots -->
            <template v-else-if="item.id === 'magnetic-dots'">
              <div class="flex flex-col items-center gap-2 py-1">
                <UiMagneticDots :width="230" :height="120" initial-shape="Lines" :spacing="14" />
                <span class="font-mono text-[10px] text-dim">
                  {{ isEs ? 'Hacé clic sobre el campo para alternar Líneas / Puntos' : 'Click field to toggle Lines / Dots' }}
                </span>
              </div>
            </template>

            <!-- 8. UiFolderPreview -->
            <template v-else-if="item.id === 'folder-preview'">
              <UiFolderPreview :items="demoFolderItems" label="production/" count="03" compact />
            </template>

            <!-- 9. UiDock -->
            <template v-else-if="item.id === 'dock'">
              <div class="py-2">
                <UiDock v-model="demoDockKey" :items="demoDockItems" :magnify="1.3" />
              </div>
            </template>

            <!-- 9b. UiSegmentedSwitch -->
            <template v-else-if="item.id === 'segmented-switch'">
              <div class="flex flex-col items-center gap-2.5 py-2">
                <UiSegmentedSwitch
                  v-model="demoSegment"
                  :options="demoSegmentOptions"
                />
                <span class="font-mono text-[10px] text-dim">
                  {{ isEs ? 'Píldora activa deslizante con físicas de resorte' : 'Sliding active pill with spring physics' }}
                </span>
              </div>
            </template>

            <!-- 10. UiSlideConfirm -->
            <template v-else-if="item.id === 'slide-confirm'">
              <div class="flex flex-col items-center gap-2 py-1">
                <UiSlideConfirm
                  :label="isEs ? 'Deslizá para confirmar' : 'Slide to commit'"
                  :confirmed-label="isEs ? 'Confirmado · 200 OK' : 'Committed · 200 OK'"
                  @confirm="onSlideConfirmed"
                />
                <span v-if="demoConfirmStatus" class="font-mono text-[11px] text-green animate-pulse">
                  {{ demoConfirmStatus }}
                </span>
              </div>
            </template>

            <!-- 11. UiSharePill -->
            <template v-else-if="item.id === 'share-pill'">
              <div class="py-2">
                <UiSharePill title="Dossier Mateo Sonzogni" />
              </div>
            </template>

            <!-- 12. UiCopyPill -->
            <template v-else-if="item.id === 'copy-pill'">
              <div class="flex items-center gap-3 py-2">
                <UiCopyPill text="mateogabus@gmail.com" label="Copiar email" copied-label="Email copiado" />
                <UiCopyPill text="git clone https://github.com/MateoGs013/portfolio.git" label="Copiar git repo" copied-label="Repo copiado" />
              </div>
            </template>

            <!-- 13. UiSweepButton -->
            <template v-else-if="item.id === 'sweep-button'">
              <div class="flex items-center gap-2.5 py-2">
                <UiSweepButton variant="primary">
                  <span>{{ isEs ? 'Acción Primaria' : 'Primary Action' }}</span>
                </UiSweepButton>
                <UiSweepButton variant="secondary">
                  <span>{{ isEs ? 'Inspeccionar' : 'Inspect' }}</span>
                </UiSweepButton>
              </div>
            </template>

            <!-- 14. UiTelemetryPill -->
            <template v-else-if="item.id === 'telemetry-pill'">
              <div class="py-2">
                <UiTelemetryPill collection="projects" :count="6" :api-healthy="true" />
              </div>
            </template>

            <!-- 15. UiDotGlobe -->
            <template v-else-if="item.id === 'dot-globe'">
              <div class="py-1">
                <UiDotGlobe :size="160" home-city="Paraná, AR" />
              </div>
            </template>

            <!-- 16. UiHubDiagram -->
            <template v-else-if="item.id === 'hub-diagram'">
              <div class="w-full flex items-center justify-center py-1">
                <UiHubDiagram :spread="85" :height="170" core-label="PG-17" />
              </div>
            </template>

            <!-- 17. UiCodeReveal -->
            <template v-else-if="item.id === 'code-reveal'">
              <div class="w-full max-w-[280px]">
                <UiCodeReveal :radius="100" />
              </div>
            </template>

            <!-- 18. UiHoloCard -->
            <template v-else-if="item.id === 'holo-card'">
              <UiHoloCard :max-tilt="12" class="w-full max-w-[240px] rounded-xl border border-white/15 bg-paper/90 p-3.5 shadow-sm">
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <span class="font-mono text-[9.5px] uppercase tracking-wider text-sig">Design Engineer</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-green" />
                  </div>
                  <span class="font-sans text-[13.5px] font-semibold text-ink">Tactile Spring Card</span>
                  <span class="font-mono text-[9.5px] text-dim">Mueve el cursor para inclinar en 3D</span>
                </div>
              </UiHoloCard>
            </template>

            <!-- 19. UiBlueprintCard -->
            <template v-else-if="item.id === 'blueprint-card'">
              <UiBlueprintCard class="w-full max-w-[260px] p-3.5 rounded-xl border border-rule bg-paper/90">
                <div class="flex flex-col gap-1">
                  <span class="font-mono text-[10px] text-sig">CAD BLUEPRINT</span>
                  <span class="font-sans text-[13px] font-semibold text-ink">Architectural Trace</span>
                  <span class="font-mono text-[10px] text-dim">Cotado milimétrico automático</span>
                </div>
              </UiBlueprintCard>
            </template>

            <!-- 20. UiDynamicIsland -->
            <template v-else-if="item.id === 'dynamic-island'">
              <div class="py-2">
                <UiDynamicIsland collection="db" :record-count="31" :latency-ms="14" />
              </div>
            </template>

            <!-- 21. UiThinkingTrace -->
            <template v-else-if="item.id === 'thinking-trace'">
              <div class="w-full max-w-[320px]">
                <UiThinkingTrace :steps="demoThinkingSteps" :pace="900" />
              </div>
            </template>

            <!-- 22. UiTreeView -->
            <template v-else-if="item.id === 'tree-view'">
              <div class="py-1">
                <UiTreeView :root="demoTreeRoot" :initial-open="['app/components/ui', 'app/components/ui/springs']" />
              </div>
            </template>

            <!-- 23. UiTextBlurReveal -->
            <template v-else-if="item.id === 'text-blur-reveal'">
              <div class="text-center py-2">
                <UiTextBlurReveal
                  text="Interfaces construidas con convicción y criterio de artesanía."
                  class="font-sans text-[14px] font-medium leading-relaxed text-ink"
                  split="words"
                  :stagger-ms="40"
                  replay-on-click
                />
              </div>
            </template>

            <!-- 24. UiSpotlightCard -->
            <template v-else-if="item.id === 'spotlight-card'">
              <div class="w-full flex items-center justify-center py-2">
                <UiSpotlightCard class="w-full max-w-[280px] p-4 rounded-xl border border-rule bg-surface/80 flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <span class="font-mono text-[9.5px] uppercase tracking-wider text-sig">Radial Spotlight</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-sig" />
                  </div>
                  <span class="font-sans text-[13.5px] font-semibold text-ink">Cursor Proximity Glow</span>
                  <span class="font-mono text-[10px] text-dim">Mové el cursor sobre la tarjeta para revelar el haz de luz</span>
                </UiSpotlightCard>
              </div>
            </template>

            <!-- 25. UiProgressiveBlur -->
            <template v-else-if="item.id === 'progressive-blur'">
              <div class="relative w-full max-w-[280px] h-36 rounded-xl border border-rule bg-surface/80 overflow-hidden flex flex-col justify-between p-3.5 select-none">
                <div class="space-y-1 font-mono text-[10px] text-dim">
                  <div class="text-ink font-semibold">Optical Camera-Depth Vignette</div>
                  <div>6 capas progresivas con máscaras difuminadas.</div>
                  <div>Disuelve los bordes del scroll de forma analógica.</div>
                  <div class="text-sig">100% fijo sobre el borde de salida.</div>
                </div>
                <UiProgressiveBlur position="bottom" :height="44" :strength="50" />
              </div>
            </template>

            <!-- 26. UiResizablePanels -->
            <template v-else-if="item.id === 'resizable-panels'">
              <div class="w-full max-w-[320px] h-36 rounded-xl border border-rule bg-surface/80 overflow-hidden">
                <UiResizablePanels :initial-width="120" :min-width="90" :max-width="180" :shut-threshold="60">
                  <template #sidebar>
                    <div class="h-full p-2.5 font-mono text-[9.5px] text-dim flex flex-col gap-1 border-r border-rule bg-paper/50">
                      <span class="text-sig font-bold">SIDEBAR</span>
                      <span>01 · proy</span>
                      <span>02 · stack</span>
                      <span>03 · exp</span>
                    </div>
                  </template>
                  <template #default>
                    <div class="h-full p-2.5 font-mono text-[10px] text-ink flex flex-col justify-between bg-surface/40">
                      <div>
                        <div class="font-semibold text-[11px]">Contenido Principal</div>
                        <div class="text-dim text-[9.5px] mt-1">Arrastrá el divisor para redimensionar o colapsar con resorte.</div>
                      </div>
                      <div class="text-faint text-[9px]">Soporta ← / → y Enter</div>
                    </div>
                  </template>
                </UiResizablePanels>
              </div>
            </template>

            <!-- 27. UiCursorWorkList -->
            <template v-else-if="item.id === 'cursor-work-list'">
              <div class="w-full max-w-[320px] py-1">
                <UiCursorWorkList :items="demoWorkListItems" />
              </div>
            </template>

            <!-- Fallback Genérico para los demás componentes de la librería -->
            <template v-else>
              <div class="flex flex-col items-center gap-1.5 text-center py-2">
                <span class="font-mono text-[11px] font-semibold text-sig">{{ item.tag }}</span>
                <span class="font-sans text-[13px] text-ink font-medium">{{ item.name }}</span>
                <span class="font-mono text-[10px] text-dim">{{ item.file }}</span>
              </div>
            </template>
          </div>

          <!-- Pie con Especificaciones y Tags -->
          <div class="mt-3 pt-2.5 border-t border-rule/60 flex flex-col gap-2">
            <p class="font-sans text-[12.5px] leading-snug text-dim m-0">
              {{ isEs ? item.descEs : item.descEn }}
            </p>

            <div class="flex flex-wrap items-center gap-1">
              <span
                v-for="t in item.tags"
                :key="t"
                class="px-1.5 py-0.2 rounded bg-paper/60 border border-rule font-mono text-[9px] text-dim"
              >
                {{ t }}
              </span>
            </div>
          </div>
        </UiSpotlightCard>
      </div>
    </div>

    <!-- Empty State si no hay resultados en la búsqueda -->
    <div
      v-else
      class="w-full py-16 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-rule rounded-xl bg-paper/40"
    >
      <AppIcon name="search" :size="24" class="text-dim" />
      <span class="font-sans text-[14px] font-semibold text-ink">
        {{ isEs ? 'No se encontraron componentes' : 'No components found' }}
      </span>
      <p class="font-mono text-[11px] text-dim m-0">
        {{ isEs ? `Ninguna primitiva coincide con "${searchQuery}".` : `No primitive matches "${searchQuery}".` }}
      </p>
      <button
        type="button"
        class="mt-2 px-3 py-1 rounded-md border border-rule bg-surface font-mono text-[11px] text-ink hover:bg-hover cursor-pointer"
        @click="searchQuery = ''; activeCategory = 'all'"
      >
        {{ isEs ? 'Restablecer filtros' : 'Reset filters' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.explorer-lab {
  min-height: 100%;
}

.surface-10k {
  background-color: var(--d-surface);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
