<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useBenchoSound } from '~/composables/useBenchoSound'
import { useHyperfocus } from '~/composables/useHyperfocus'

const DEFAULT_CODE = `// ==========================================
// PRISMA 7 SCHEMA — STRICT RELATIONAL MODEL
// ==========================================
model Project {
  id          String       @id @default(uuid())
  slug        String       @unique
  title       String
  summary     String
  status      Status       @default(PRODUCTION)
  stack       Technology[] @relation("ProjectTech")
  createdAt   DateTime     @default(now())
}

-- POSTGRESQL 17 CTE & JSONB AGGREGATION
WITH project_stack AS (
  SELECT p.id, p.slug, p.title,
         jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name)) AS stack
  FROM "Project" p
  JOIN "_ProjectTech" pt ON pt."A" = p.id
  JOIN "Technology" t ON t.id = pt."B"
  WHERE p.status = 'PRODUCTION'
  GROUP BY p.id, p.slug, p.title
)
SELECT * FROM project_stack ORDER BY title ASC;`

const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  code?: string
  radius?: number
}>(), {
  title: 'Relational Schema X-Ray',
  subtitle: 'Move cursor to inspect underlying Prisma & SQL',
  code: DEFAULT_CODE,
  radius: 135,
})

const { playSound } = useBenchoSound()
const { isHyperfocus } = useHyperfocus()

const cardRef = ref<HTMLElement | null>(null)
const isHovering = ref(false)
const isExpanded = ref(false)

// Smooth cursor coordinates (starts with a subtle teaser lens in bottom-right)
const targetX = ref(210)
const targetY = ref(125)
const smoothX = ref(210)
const smoothY = ref(125)
const currentRadius = ref(54)

let rafId = 0
let burstTimer: number | null = null

function updateSpring() {
  if (!import.meta.client) return

  // Smooth interpolation: 0.28 factor from Bencho
  smoothX.value += (targetX.value - smoothX.value) * 0.28
  smoothY.value += (targetY.value - smoothY.value) * 0.28

  const targetR = isExpanded.value ? 650 : isHovering.value ? props.radius : 54
  currentRadius.value += (targetR - currentRadius.value) * 0.22

  const dx = Math.abs(targetX.value - smoothX.value)
  const dy = Math.abs(targetY.value - smoothY.value)
  const dr = Math.abs(targetR - currentRadius.value)

  if (isHovering.value || isExpanded.value || dr > 0.5 || dx > 0.5 || dy > 0.5) {
    rafId = requestAnimationFrame(updateSpring)
  }
  else {
    rafId = 0
  }
}

function startLoop() {
  if (!rafId && import.meta.client) {
    rafId = requestAnimationFrame(updateSpring)
  }
}

function onPointerMove(e: PointerEvent) {
  if (!cardRef.value || isHyperfocus.value) return
  const rect = cardRef.value.getBoundingClientRect()
  targetX.value = e.clientX - rect.left
  targetY.value = e.clientY - rect.top

  if (!isHovering.value) {
    isHovering.value = true
    smoothX.value = targetX.value
    smoothY.value = targetY.value
    playSound('tock', { gap: 120 })
  }
  startLoop()
}

function onPointerLeave() {
  if (isExpanded.value) return
  isHovering.value = false
  if (cardRef.value) {
    const rect = cardRef.value.getBoundingClientRect()
    targetX.value = rect.width * 0.72
    targetY.value = rect.height * 0.68
  }
  startLoop()
}

function toggleShockwave() {
  playSound('expand')
  isExpanded.value = !isExpanded.value

  if (isExpanded.value) {
    if (burstTimer) clearTimeout(burstTimer)
    burstTimer = window.setTimeout(() => {
      isExpanded.value = false
      startLoop()
    }, 2800)
  }
  startLoop()
}

const highlightedLines = computed(() => {
  return props.code.split('\n').map((raw) => {
    const escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // Comments
    if (escaped.trim().startsWith('//') || escaped.trim().startsWith('--')) {
      return `<span class="cdr-token-comment">${escaped}</span>`
    }

    // Single-pass tokenizer so inserted span attributes are never corrupted
    return escaped.replace(
      /("[^"]*"|\b(?:model|enum|type|datasource|generator|SELECT|FROM|WHERE|JOIN|GROUP BY|ORDER BY|WITH|AS|AND|OR)\b|@id|@default|@unique|@relation|\b(?:uuid|now|String|DateTime|Status|PRODUCTION)\b)/g,
      (match) => {
        if (match.startsWith('"')) {
          return `<span class="cdr-token-str">${match}</span>`
        }
        if (/^(?:model|enum|type|datasource|generator|SELECT|FROM|WHERE|JOIN|GROUP BY|ORDER BY|WITH|AS|AND|OR)$/.test(match)) {
          return `<span class="cdr-token-kw">${match}</span>`
        }
        return `<span class="cdr-token-attr">${match}</span>`
      },
    )
  })
})

onMounted(() => {
  if (cardRef.value) {
    const rect = cardRef.value.getBoundingClientRect()
    targetX.value = rect.width * 0.72
    targetY.value = rect.height * 0.68
    smoothX.value = targetX.value
    smoothY.value = targetY.value
  }
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (burstTimer) clearTimeout(burstTimer)
})
</script>

<template>
  <div
    ref="cardRef"
    class="cdr relative rounded-2xl border border-rule overflow-hidden select-none cursor-crosshair bg-card text-ink transition-shadow duration-300"
    :style="{
      '--x': `${smoothX}px`,
      '--y': `${smoothY}px`,
      '--r': `${currentRadius}px`,
    }"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
    @click="toggleShockwave"
  >
    <!-- Base Layer (UI Preview / Slot) -->
    <div class="cdr-base p-5">
      <slot>
        <div class="flex items-start justify-between gap-4 mb-3">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sig/10 text-sig font-mono text-[10px] font-semibold uppercase tracking-wider mb-2">
              <span class="w-1.5 h-1.5 rounded-full bg-sig animate-pulse" />
              Prisma 7 &bull; PostgreSQL 17
            </div>
            <h4 class="text-sm font-semibold text-ink tracking-tight font-sans">
              {{ title }}
            </h4>
            <p class="text-xs text-mute font-sans mt-0.5">
              {{ subtitle }}
            </p>
          </div>
          <span class="shrink-0 text-[10px] font-mono px-2 py-1 rounded bg-rule/50 text-faint border border-rule">
            X-RAY LENS
          </span>
        </div>

        <!-- Spec preview mock items -->
        <div class="grid grid-cols-2 gap-2 mt-4">
          <div class="p-2.5 rounded-lg border border-rule bg-paper/60 flex flex-col justify-between">
            <span class="font-mono text-[10px] text-mute uppercase">Table Entity</span>
            <span class="font-mono text-xs font-semibold text-ink mt-1">Project &bull; Core</span>
            <span class="font-mono text-[10px] text-faint mt-1">UUID Primary Key</span>
          </div>
          <div class="p-2.5 rounded-lg border border-rule bg-paper/60 flex flex-col justify-between">
            <span class="font-mono text-[10px] text-mute uppercase">Index Strategy</span>
            <span class="font-mono text-xs font-semibold text-ink mt-1">B-Tree ON (slug)</span>
            <span class="font-mono text-[10px] text-sig mt-1">Zero-Latency Scan</span>
          </div>
        </div>
      </slot>
    </div>

    <!-- Underneath X-Ray Code Layer -->
    <div class="cdr-xray absolute inset-0 p-5 pointer-events-none" aria-hidden="true">
      <div class="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <span class="font-mono text-[10px] font-bold text-sig uppercase tracking-wider flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          UNDERLYING ORM DEFINITION
        </span>
        <span class="font-mono text-[9px] text-white/50">
          X:{{ Math.round(smoothX) }} Y:{{ Math.round(smoothY) }}
        </span>
      </div>

      <!-- eslint-disable-next-line vue/no-v-html -->
      <pre class="font-mono text-[11px] leading-relaxed text-zinc-300 overflow-hidden"><code v-for="(line, idx) in highlightedLines" :key="idx" class="block" v-html="line" /></pre>
    </div>

    <!-- Surgical Target Ring Overlay -->
    <div
      v-if="!isHyperfocus && currentRadius > 10"
      class="cdr-ring-wrapper absolute inset-0 pointer-events-none"
      aria-hidden="true"
    >
      <div
        class="cdr-ring"
        :style="{
          left: `${smoothX}px`,
          top: `${smoothY}px`,
          width: `${currentRadius * 2}px`,
          height: `${currentRadius * 2}px`,
        }"
      >
        <span class="cdr-cross cdr-cross-t" />
        <span class="cdr-cross cdr-cross-b" />
        <span class="cdr-cross cdr-cross-l" />
        <span class="cdr-cross cdr-cross-r" />
        <span class="cdr-coord font-mono text-[9px]">
          &plusmn;{{ Math.round(currentRadius) }}px
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cdr {
  touch-action: none;
}

.cdr-base {
  position: relative;
  z-index: 1;
}

.cdr-xray {
  z-index: 2;
  background-color: #0b0c0e;
  color: #e4e4e7;
  -webkit-mask-image: radial-gradient(circle var(--r) at var(--x) var(--y), #000 45%, rgba(0, 0, 0, 0.75) 65%, transparent 100%);
  mask-image: radial-gradient(circle var(--r) at var(--x) var(--y), #000 45%, rgba(0, 0, 0, 0.75) 65%, transparent 100%);
}

/* Syntax Highlighting inside X-Ray */
:deep(.cdr-token-comment) {
  color: #71717a;
  font-style: italic;
}

:deep(.cdr-token-kw) {
  color: #ff3e00;
  font-weight: 600;
}

:deep(.cdr-token-attr) {
  color: #38bdf8;
}

:deep(.cdr-token-str) {
  color: #34d399;
}

/* Surgical Reticle Ring */
.cdr-ring {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid rgba(255, 62, 0, 0.65);
  box-shadow: 0 0 16px rgba(255, 62, 0, 0.25), inset 0 0 12px rgba(255, 62, 0, 0.12);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cdr-cross {
  position: absolute;
  background-color: rgba(255, 62, 0, 0.8);
}

.cdr-cross-t {
  top: -6px;
  left: 50%;
  width: 1px;
  height: 12px;
  transform: translateX(-50%);
}

.cdr-cross-b {
  bottom: -6px;
  left: 50%;
  width: 1px;
  height: 12px;
  transform: translateX(-50%);
}

.cdr-cross-l {
  left: -6px;
  top: 50%;
  width: 12px;
  height: 1px;
  transform: translateY(-50%);
}

.cdr-cross-r {
  right: -6px;
  top: 50%;
  width: 12px;
  height: 1px;
  transform: translateY(-50%);
}

.cdr-coord {
  position: absolute;
  bottom: 8px;
  right: 12px;
  color: rgba(255, 62, 0, 0.85);
  letter-spacing: -0.02em;
}

@media (prefers-reduced-motion: reduce) {
  .cdr-ring {
    display: none !important;
  }
}
</style>
