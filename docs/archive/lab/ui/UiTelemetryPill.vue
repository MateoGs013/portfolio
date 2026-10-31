<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import UiCopyPill from './UiCopyPill.vue'

interface Props {
  collection: string
  recordSlug?: string | null
  filters?: Record<string, string | undefined>
  count?: number
  apiHealthy?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  recordSlug: null,
  filters: () => ({}),
  count: undefined,
  apiHealthy: true,
})

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)

const activeFilters = computed(() => {
  if (!props.filters) return []
  return Object.entries(props.filters).filter(([_, v]) => v !== undefined && v !== '' && v !== null)
})

const sqlQuery = computed(() => {
  if (props.recordSlug) {
    return `SELECT * FROM ${props.collection} WHERE slug = '${props.recordSlug}' LIMIT 1;`
  }

  if (activeFilters.value.length > 0) {
    const whereClause = activeFilters.value
      .map(([k, v]) => `${k} = '${v}'`)
      .join(' AND ')
    return `SELECT * FROM ${props.collection} WHERE ${whereClause} ORDER BY sort_order ASC;`
  }

  return `SELECT * FROM ${props.collection} ORDER BY sort_order ASC;`
})

const restPath = computed(() => {
  if (props.recordSlug) {
    return `/api/${props.collection}/${props.recordSlug}`
  }

  if (activeFilters.value.length > 0) {
    const params = new URLSearchParams()
    for (const [k, v] of activeFilters.value) {
      params.append(k, String(v))
    }
    return `/api/${props.collection}?${params.toString()}`
  }

  return `/api/${props.collection}`
})

const readoutText = computed(() => {
  if (props.recordSlug) {
    return `GET /api/${props.collection}/${props.recordSlug} · 200 OK`
  }

  let filterStr = ''
  if (activeFilters.value.length > 0) {
    const firstTwo = activeFilters.value.slice(0, 2).map(([k, v]) => `${k}='${v}'`).join(' & ')
    filterStr = ` WHERE ${firstTwo}`
  }

  const rows = props.count !== undefined
    ? ` · ${props.count} ${props.count === 1 ? 'row' : 'rows'}`
    : ''

  return `SELECT * FROM ${props.collection}${filterStr}${rows}`
})

function togglePopover() {
  isOpen.value = !isOpen.value
}

function closePopover() {
  if (isOpen.value) {
    isOpen.value = false
    triggerRef.value?.focus()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    e.preventDefault()
    closePopover()
  }
}

function handlePointerDownOutside(e: PointerEvent) {
  if (!isOpen.value || !containerRef.value) return
  if (!containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  if (import.meta.client && typeof document !== 'undefined') {
    document.addEventListener('pointerdown', handlePointerDownOutside)
    document.addEventListener('keydown', handleKeydown)
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', handlePointerDownOutside)
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="ui-telemetry-pill relative inline-block font-mono text-xs select-none"
  >
    <!-- Status Bar Pill Button -->
    <button
      ref="triggerRef"
      type="button"
      role="button"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      aria-label="Toggle SQL & REST telemetry inspector"
      class="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-mono transition-all duration-150 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--d-sig)] active:scale-[0.98]"
      :class="[
        isOpen
          ? 'bg-[var(--d-surface-raised)] border-[var(--d-rule-strong)] text-[var(--d-ink)]'
          : 'bg-[var(--d-surface)] hover:bg-[var(--d-hover)] border-[var(--d-rule)] text-[var(--d-dim)] hover:text-[var(--d-ink)]',
      ]"
      @click="togglePopover"
    >
      <!-- LED Status Indicator Dot -->
      <span
        class="relative flex h-2 w-2 shrink-0 items-center justify-center"
        aria-hidden="true"
      >
        <span
          class="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
          :class="apiHealthy ? 'bg-[var(--d-green)]' : 'bg-[var(--d-amber)]'"
        />
        <span
          class="relative inline-flex h-1.5 w-1.5 rounded-full"
          :class="apiHealthy ? 'bg-[var(--d-green)]' : 'bg-[var(--d-amber)]'"
        />
      </span>

      <!-- Telemetry Readout text -->
      <span class="truncate max-w-[240px] sm:max-w-[340px] md:max-w-md">
        {{ readoutText }}
      </span>

      <!-- Chevron Indicator -->
      <svg
        class="w-3 h-3 shrink-0 opacity-60 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M4 6l4 4 4-4" />
      </svg>
    </button>

    <!-- Upward Micro-Popover Dialog -->
    <div
      v-if="isOpen"
      role="dialog"
      aria-label="Relational Telemetry Inspector"
      class="ui-telemetry-popover absolute bottom-full mb-2 left-0 sm:left-auto sm:right-0 w-[min(92vw,440px)] p-3 rounded-lg bg-[var(--d-surface)]/95 backdrop-blur-md border border-[var(--d-rule-strong)] shadow-2xl z-50 text-xs font-mono space-y-3"
    >
      <!-- Popover Header / Status -->
      <div class="flex items-center justify-between pb-2 border-b border-[var(--d-rule)]">
        <div class="flex items-center gap-2">
          <span
            class="inline-block w-2 h-2 rounded-full"
            :class="apiHealthy ? 'bg-[var(--d-green)]' : 'bg-[var(--d-amber)]'"
          />
          <span class="font-semibold tracking-tight text-[var(--d-ink)]">
            {{ apiHealthy ? 'ONLINE · PostgreSQL 17' : 'FALLBACK SNAPSHOT' }}
          </span>
        </div>
        <span class="text-[10px] text-[var(--d-dim)] uppercase tracking-wider">
          Prisma 7 · REST API
        </span>
      </div>

      <!-- Active Relational Filters -->
      <div
        v-if="activeFilters.length > 0"
        class="space-y-1"
      >
        <div class="text-[10px] uppercase text-[var(--d-dim)] tracking-wider">
          Active Relational Filters
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="[key, val] in activeFilters"
            :key="key"
            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--d-surface-raised)] border border-[var(--d-rule)] text-[11px] text-[var(--d-ink)]"
          >
            <span class="text-[var(--d-dim)]">{{ key }}:</span>
            <span class="font-medium text-[var(--d-sig)]">{{ val }}</span>
          </span>
        </div>
      </div>

      <!-- PostgreSQL Query Section -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase text-[var(--d-dim)] tracking-wider">
            PostgreSQL Query
          </span>
          <UiCopyPill
            :text="sqlQuery"
            label="Copy SQL"
            copied-label="Copied"
          />
        </div>
        <pre class="p-2 rounded bg-[var(--d-paper)] border border-[var(--d-rule)] text-[11px] text-[var(--d-ink)] overflow-x-auto whitespace-pre-wrap break-all select-all leading-relaxed"><code>{{ sqlQuery }}</code></pre>
      </div>

      <!-- REST API Endpoint Section -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase text-[var(--d-dim)] tracking-wider">
            REST Endpoint
          </span>
          <UiCopyPill
            :text="restPath"
            label="Copy Path"
            copied-label="Copied"
          />
        </div>
        <pre class="p-2 rounded bg-[var(--d-paper)] border border-[var(--d-rule)] text-[11px] text-[var(--d-dim)] overflow-x-auto whitespace-pre-wrap break-all select-all leading-relaxed"><code>{{ restPath }}</code></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-telemetry-popover {
  animation: telemetry-reveal 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes telemetry-reveal {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-telemetry-popover {
    animation: none;
  }
}
</style>
