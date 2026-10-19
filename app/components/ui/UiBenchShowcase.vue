<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePortfolioLocale } from '~/composables/usePortfolioLocale'
import { useBenchoSound } from '~/composables/useBenchoSound'
import UiSpotlightCard from './UiSpotlightCard.vue'
import UiFolderPreview from './UiFolderPreview.vue'
import UiRollingCounter from './UiRollingCounter.vue'
import UiThinkingTrace from './UiThinkingTrace.vue'
import UiMagneticDots from './UiMagneticDots.vue'
import UiWakeSlider from './UiWakeSlider.vue'
import UiTreeView, { type TreeNode } from './UiTreeView.vue'
import UiDock from './UiDock.vue'
import UiSegmentedSwitch from './UiSegmentedSwitch.vue'
import UiSlideConfirm from './UiSlideConfirm.vue'
import UiSharePill from './UiSharePill.vue'
import UiHoloCard from './UiHoloCard.vue'

const router = useRouter()
const { isEs } = usePortfolioLocale()
const { soundEnabled, toggleSound } = useBenchoSound()

const activeCategory = ref<'springs' | 'tactile' | 'traces'>('springs')
const commitCount = ref(382)
const wakeValue = ref(72)
const activeDockKey = ref('projects')

const categoryOptions = computed(() => [
  { value: 'springs', label: isEs.value ? 'Resortes & 3D' : 'Springs & 3D' },
  { value: 'tactile', label: isEs.value ? 'Controles Táctiles' : 'Tactile Controls' },
  { value: 'traces', label: isEs.value ? 'Trazas & Árbol' : 'Traces & Tree' },
])

const folderItems = computed(() => [
  {
    id: 'la-rucula',
    title: 'La Rúcula',
    subtitle: 'Menu-first QR · Live',
    badge: 'LIVE',
  },
  {
    id: 'arg-piscinas',
    title: 'ARG Piscinas',
    subtitle: 'Trilingüe · Prisma CMS',
    badge: 'LIVE',
  },
  {
    id: 'ynara',
    title: 'Ynara IA',
    subtitle: 'Tesis Da Vinci · 382c',
    badge: 'WIP',
  },
])

const thinkingSteps = computed(() => isEs.value
  ? [
      'Consultando esquema relacional en PostgreSQL 17 (latencia < 28ms).',
      'Hidratando 24 primitivas con resortes amortiguados de 2.º orden.',
      'Sintetizando respuesta acústica procedural en Web Audio API.',
      'Verificando iluminación especular cenital y modo Hiperfoco.',
    ]
  : [
      'Querying relational schema in PostgreSQL 17 (latency < 28ms).',
      'Hydrating 24 primitives with 2nd-order damped springs.',
      'Synthesizing procedural acoustic feedback via Web Audio API.',
      'Verifying top-lit specular lighting and Zen Hyperfocus mode.',
    ])

const treeRoot = computed<TreeNode>(() => ({
  name: 'sonzogni-bencho-ui',
  meta: '24 primitives',
  kids: [
    {
      name: 'springs',
      kids: [
        { name: 'UiRollingCounter.vue', meta: 'odometer', to: '/projects/ynara' },
        { name: 'UiWakeSlider.vue', meta: 'kinetic', to: '/projects' },
        { name: 'UiDynamicIsland.vue', meta: 'k=380', to: '/' },
      ],
    },
    {
      name: 'spatial-3d',
      kids: [
        { name: 'UiHubDiagram.vue', meta: 'packets', to: '/stack' },
        { name: 'UiCodeReveal.vue', meta: 'x-ray', to: '/projects/la-rucula' },
        { name: 'UiDotGlobe.vue', meta: '3D slerp', to: '/contact' },
      ],
    },
    { name: 'useBenchoSound.ts', meta: 'WebAudio' },
  ],
}))

const dockItems = computed(() => [
  { key: 'home', label: isEs.value ? 'Inicio (db)' : 'Home (db)', icon: 'db', to: '/' },
  { key: 'projects', label: isEs.value ? 'Proyectos (06)' : 'Projects (06)', icon: 'folder', to: '/projects' },
  { key: 'experience', label: isEs.value ? 'Experiencia (06)' : 'Experience (06)', icon: 'briefcase', to: '/experiences' },
  { key: 'stack', label: 'Stack (22)', icon: 'code', to: '/stack' },
  { key: 'about', label: 'CV Harvard ATS', icon: 'user', to: '/about' },
  { key: 'contact', label: isEs.value ? 'Contacto' : 'Contact', icon: 'mail', to: '/contact' },
])

function onSelectFolderCard(item: { id: string }) {
  if (item.id) {
    router.push(`/projects/${item.id}`)
  }
}

function onSelectTreeNode(_path: string, node: TreeNode) {
  if (node.to) {
    router.push(node.to)
  }
}

function onSelectDock(key: string) {
  activeDockKey.value = key
  const found = dockItems.value.find(i => i.key === key)
  if (found?.to) {
    router.push(found.to)
  }
}
</script>

<template>
  <section class="bench-showcase flex flex-col gap-3.5" aria-label="Librería de Componentes Interactivos">
    <!-- Encabezado con selector de categoría con resorte y switch de audio -->
    <div class="flex flex-wrap items-center justify-between gap-2.5">
      <div class="flex items-center gap-2.5">
        <span class="font-mono text-[11px] font-semibold text-sig">04</span>
        <h2 class="font-sans text-[15px] sm:text-[16px] font-semibold tracking-tight text-ink m-0">
          {{ isEs ? 'Librería Propia // Sonzogni × Bencho UI v2.0' : 'Custom Library // Sonzogni × Bencho UI v2.0' }}
        </h2>
        <span class="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-raised border border-rule font-mono text-[10px] text-dim">
          <span>24 bloques Vue 3</span>
          <span class="text-faint">·</span>
          <span>Spring Physics + Web Audio</span>
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <UiSegmentedSwitch
          v-model="activeCategory"
          :options="categoryOptions"
          :aria-label="isEs ? 'Categoría de componentes' : 'Component category'"
        />

        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-rule bg-surface/80 hover:bg-hover hover:border-rule-strong font-mono text-[10.5px] text-dim hover:text-ink transition-colors cursor-pointer"
          :title="isEs ? 'Alternar síntesis acústica procedural (Web Audio API)' : 'Toggle procedural acoustic synthesis (Web Audio API)'"
          @click="toggleSound"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="soundEnabled ? 'bg-green' : 'bg-faint'" />
          <span>{{ soundEnabled ? 'Audio ON' : 'Audio OFF' }}</span>
        </button>
      </div>
    </div>

    <!-- Pestaña 1: Resortes & 3D -->
    <div v-if="activeCategory === 'springs'" class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      <!-- 1. Folder 3D Fan (.fdr-*) -->
      <UiSpotlightCard class="surface-10k rounded-xl p-4 flex flex-col justify-between min-h-[224px]">
        <div class="flex items-center justify-between gap-2 mb-1">
          <div class="flex items-center gap-2">
            <span class="font-sans text-[13px] font-medium text-ink">UiFolderPreview</span>
            <span class="font-mono text-[10px] text-faint">.fdr-*</span>
          </div>
          <span class="px-1.5 py-0.5 rounded bg-paper/70 border border-rule font-mono text-[9.5px] text-dim uppercase">Hover · 3D</span>
        </div>

        <div class="flex-1 flex items-center justify-center py-1">
          <UiFolderPreview
            :items="folderItems"
            label="projects/"
            count="03"
            compact
            @select="onSelectFolderCard"
          />
        </div>

        <p class="font-mono text-[10.5px] text-dim m-0 text-center">
          {{ isEs ? 'Pasá el cursor para desplegar el abanico 3D' : 'Hover to fan out 3D project cards' }}
        </p>
      </UiSpotlightCard>

      <!-- 2. Rolling Counter Odometer (.rct-*) + Wake Slider (.wks-*) -->
      <UiSpotlightCard class="surface-10k rounded-xl p-4 flex flex-col justify-between min-h-[224px]">
        <div class="flex items-center justify-between gap-2 mb-1">
          <div class="flex items-center gap-2">
            <span class="font-sans text-[13px] font-medium text-ink">UiRollingCounter &amp; Wake</span>
            <span class="font-mono text-[10px] text-faint">.rct / .wks</span>
          </div>
          <span class="px-1.5 py-0.5 rounded bg-paper/70 border border-rule font-mono text-[9.5px] text-dim uppercase">Drag · Hold</span>
        </div>

        <div class="flex-1 flex flex-col items-center justify-center gap-3.5 py-1">
          <UiRollingCounter
            v-model="commitCount"
            :digits="3"
            :bounce="48"
            :stagger="42"
            interactive
          />

          <div class="w-full pt-2 border-t border-rule flex flex-col items-center">
            <UiWakeSlider
              v-model="wakeValue"
              :bars="28"
              :wake="65"
              unit="ms"
            />
          </div>
        </div>

        <p class="font-mono text-[10.5px] text-dim m-0 text-center">
          {{ isEs ? 'Odómetro con inercia + barra de estela cinética' : 'Odometer with inertia + kinetic wake slider' }}
        </p>
      </UiSpotlightCard>

      <!-- 3. Magnetic Dots Field (.mdg-*) -->
      <UiSpotlightCard class="surface-10k rounded-xl p-4 flex flex-col justify-between min-h-[224px]">
        <div class="flex items-center justify-between gap-2 mb-1">
          <div class="flex items-center gap-2">
            <span class="font-sans text-[13px] font-medium text-ink">UiMagneticDots</span>
            <span class="font-mono text-[10px] text-faint">.mdg</span>
          </div>
          <span class="px-1.5 py-0.5 rounded bg-paper/70 border border-rule font-mono text-[9.5px] text-dim uppercase">Hover · Click</span>
        </div>

        <div class="flex-1 flex items-center justify-center py-1">
          <UiMagneticDots
            :width="225"
            :height="136"
            :pull="55"
            :radius="55"
            :spring="52"
            initial-shape="Lines"
            :spacing="12"
          />
        </div>

        <p class="font-mono text-[10.5px] text-dim m-0 text-center">
          {{ isEs ? 'Campo de resortes (click alterna Líneas / Puntos)' : 'Spring field (click toggles Lines / Dots)' }}
        </p>
      </UiSpotlightCard>
    </div>

    <!-- Pestaña 2: Controles Táctiles ($10k Micro-interactions) -->
    <div v-else-if="activeCategory === 'tactile'" class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      <!-- 4. Slide to Confirm (.sld-*) -->
      <UiSpotlightCard class="surface-10k rounded-xl p-4 flex flex-col justify-between min-h-[224px]">
        <div class="flex items-center justify-between gap-2 mb-1">
          <div class="flex items-center gap-2">
            <span class="font-sans text-[13px] font-medium text-ink">UiSlideConfirm</span>
            <span class="font-mono text-[10px] text-faint">.sld-*</span>
          </div>
          <span class="px-1.5 py-0.5 rounded bg-paper/70 border border-rule font-mono text-[9.5px] text-dim uppercase">Drag · Morph</span>
        </div>

        <div class="flex-1 flex items-center justify-center py-2">
          <UiSlideConfirm
            :label="isEs ? 'Deslizá para confirmar' : 'Slide to confirm'"
            :confirmed-label="isEs ? 'Confirmado · 200 OK' : 'Confirmed · 200 OK'"
            :width="248"
          />
        </div>

        <p class="font-mono text-[10.5px] text-dim m-0 text-center">
          {{ isEs ? 'El tirador se expande hacia atrás rellenando la pista' : 'Handle morphs backward to fill the track on commit' }}
        </p>
      </UiSpotlightCard>

      <!-- 5. Share Pill (.shp-*) -->
      <UiSpotlightCard class="surface-10k rounded-xl p-4 flex flex-col justify-between min-h-[224px]">
        <div class="flex items-center justify-between gap-2 mb-1">
          <div class="flex items-center gap-2">
            <span class="font-sans text-[13px] font-medium text-ink">UiSharePill</span>
            <span class="font-mono text-[10px] text-faint">.shp-*</span>
          </div>
          <span class="px-1.5 py-0.5 rounded bg-paper/70 border border-rule font-mono text-[9.5px] text-dim uppercase">Hover · Expand</span>
        </div>

        <div class="flex-1 flex items-center justify-center py-2">
          <UiSharePill
            url="https://mateosonzogni.com"
            :title="isEs ? 'Compartir' : 'Share'"
          />
        </div>

        <p class="font-mono text-[10.5px] text-dim m-0 text-center">
          {{ isEs ? 'Avatares con separación elástica + tooltip viajero' : 'Parting avatar stack + single travelling tooltip' }}
        </p>
      </UiSpotlightCard>

      <!-- 6. Magnifying Dock (.gdock-*) -->
      <UiSpotlightCard class="surface-10k rounded-xl p-4 flex flex-col justify-between min-h-[224px]">
        <div class="flex items-center justify-between gap-2 mb-1">
          <div class="flex items-center gap-2">
            <span class="font-sans text-[13px] font-medium text-ink">UiDock</span>
            <span class="font-mono text-[10px] text-faint">.gdock-*</span>
          </div>
          <span class="px-1.5 py-0.5 rounded bg-paper/70 border border-rule font-mono text-[9.5px] text-dim uppercase">Cosine · Hover</span>
        </div>

        <div class="flex-1 flex items-center justify-center w-full py-4">
          <UiDock
            v-model="activeDockKey"
            :items="dockItems"
            :magnify="1.36"
            :spread="2"
            :lift="8"
            @select="onSelectDock"
          />
        </div>

        <p class="font-mono text-[10.5px] text-dim m-0 text-center">
          {{ isEs ? 'Magnificación por coseno elevado + tooltip viajero' : 'Raised-cosine magnification + travelling tooltip' }}
        </p>
      </UiSpotlightCard>
    </div>

    <!-- Pestaña 3: Trazas, Árbol & Foil 3D -->
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      <!-- 7. AI Thinking Trace (.thk-*) -->
      <UiSpotlightCard class="surface-10k rounded-xl p-4 flex flex-col justify-between min-h-[224px]">
        <div class="flex items-center justify-between gap-2 mb-1">
          <div class="flex items-center gap-2">
            <span class="font-sans text-[13px] font-medium text-ink">UiThinkingTrace</span>
            <span class="font-mono text-[10px] text-faint">.thk-*</span>
          </div>
          <span class="px-1.5 py-0.5 rounded bg-paper/70 border border-rule font-mono text-[9.5px] text-dim uppercase">Press · Fold</span>
        </div>

        <div class="flex-1 flex items-center justify-center w-full py-1">
          <UiThinkingTrace
            :steps="thinkingSteps"
            :pace="850"
            :title-thinking="isEs ? 'Razonando traza...' : 'Thinking...'"
            :title-done="isEs ? 'Razonado en' : 'Thought for'"
          />
        </div>

        <p class="font-mono text-[10.5px] text-dim m-0 text-center">
          {{ isEs ? 'Traza de razonamiento con pliegue medido' : 'Reasoning trace with measured height fold' }}
        </p>
      </UiSpotlightCard>

      <!-- 8. Animated File Tree (.tre-*) -->
      <UiSpotlightCard class="surface-10k rounded-xl p-4 flex flex-col justify-between min-h-[224px]">
        <div class="flex items-center justify-between gap-2 mb-1">
          <div class="flex items-center gap-2">
            <span class="font-sans text-[13px] font-medium text-ink">UiTreeView</span>
            <span class="font-mono text-[10px] text-faint">.tre-*</span>
          </div>
          <span class="px-1.5 py-0.5 rounded bg-paper/70 border border-rule font-mono text-[9.5px] text-dim uppercase">Press · Tree</span>
        </div>

        <div class="flex-1 flex items-center justify-center w-full py-1">
          <UiTreeView
            :root="treeRoot"
            :initial-open="['sonzogni-bencho-ui', 'sonzogni-bencho-ui/springs']"
            initial-selected="sonzogni-bencho-ui/springs/UiRollingCounter.vue"
            @select="onSelectTreeNode"
          />
        </div>

        <p class="font-mono text-[10.5px] text-dim m-0 text-center">
          {{ isEs ? 'Árbol interactivo con guías y stagger' : 'Interactive tree with guides and stagger' }}
        </p>
      </UiSpotlightCard>

      <!-- 9. Holographic 3D Tilt Card (.mb-holo-*) -->
      <UiSpotlightCard class="surface-10k rounded-xl p-4 flex flex-col justify-between min-h-[224px]">
        <div class="flex items-center justify-between gap-2 mb-1">
          <div class="flex items-center gap-2">
            <span class="font-sans text-[13px] font-medium text-ink">UiHoloCard</span>
            <span class="font-mono text-[10px] text-faint">.mb-holo-*</span>
          </div>
          <span class="px-1.5 py-0.5 rounded bg-paper/70 border border-rule font-mono text-[9.5px] text-dim uppercase">3D Foil · Glare</span>
        </div>

        <div class="flex-1 flex items-center justify-center py-2">
          <UiHoloCard :max-tilt="14" class="w-full max-w-[230px] rounded-xl border border-white/15 bg-paper/90 p-3.5">
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <span class="font-mono text-[9.5px] uppercase tracking-wider text-sig">Sonzogni · 2026</span>
                <span class="w-1.5 h-1.5 rounded-full bg-green" />
              </div>
              <span class="font-sans text-[14px] font-semibold text-ink">Design Engineer Pass</span>
              <span class="font-mono text-[10px] text-dim">Perspective 900px · Specular Foil</span>
            </div>
          </UiHoloCard>
        </div>

        <p class="font-mono text-[10.5px] text-dim m-0 text-center">
          {{ isEs ? 'Inclinación 3D amortiguada + lámina holográfica' : 'Damped 3D tilt + holographic foil & glare' }}
        </p>
      </UiSpotlightCard>
    </div>
  </section>
</template>
