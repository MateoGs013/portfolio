<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'

export interface SegmentedOption {
  value: string
  label: string
  ariaLabel?: string
  shortcut?: string
}

interface Props {
  modelValue: string
  options: SegmentedOption[]
  ariaLabel?: string
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Segmented Control',
  size: 'sm',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const instanceId = useId()
const { isHyperfocus } = useHyperfocus()
const prefersReducedMotion = ref(false)
const buttonRefs = ref<Array<HTMLButtonElement | null>>([])

let mediaQueryList: MediaQueryList | null = null
const onMediaChange = (e: MediaQueryListEvent) => {
  prefersReducedMotion.value = e.matches
}

onMounted(() => {
  if (import.meta.client && typeof window !== 'undefined') {
    mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mediaQueryList.matches
    mediaQueryList.addEventListener?.('change', onMediaChange)
  }
})

onBeforeUnmount(() => {
  if (mediaQueryList) {
    mediaQueryList.removeEventListener?.('change', onMediaChange)
  }
})

const activeIndex = computed(() => {
  return props.options.findIndex(opt => opt.value === props.modelValue)
})

const indicatorStyle = computed(() => {
  const count = props.options.length
  if (count === 0) return { display: 'none' }

  const index = activeIndex.value >= 0 ? activeIndex.value : 0
  const widthPercent = 100 / count

  return {
    width: `${widthPercent}%`,
    transform: `translate3d(calc(${index * 100}%), 0, 0)`,
    opacity: activeIndex.value >= 0 ? '1' : '0',
  }
})

function selectOption(value: string) {
  if (value !== props.modelValue) {
    emit('update:modelValue', value)
  }
}

function onKeydown(e: KeyboardEvent, currentIndex: number) {
  let nextIndex: number | null = null

  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    nextIndex = (currentIndex + 1) % props.options.length
  }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    nextIndex = (currentIndex - 1 + props.options.length) % props.options.length
  }
  else if (e.key === 'Home') {
    e.preventDefault()
    nextIndex = 0
  }
  else if (e.key === 'End') {
    e.preventDefault()
    nextIndex = props.options.length - 1
  }

  if (nextIndex !== null) {
    const nextOpt = props.options[nextIndex]
    if (nextOpt) {
      selectOption(nextOpt.value)
      buttonRefs.value[nextIndex]?.focus()
    }
  }
}
</script>

<template>
  <div
    role="tablist"
    :aria-label="ariaLabel"
    class="ui-segmented-switch relative inline-flex items-center select-none bg-[var(--d-surface)] border border-[var(--d-rule)]"
    :class="[
      size === 'sm' ? 'h-7 p-0.5 rounded-md text-xs' : 'h-8.5 p-1 rounded-lg text-sm',
    ]"
  >
    <!-- Sliding active indicator pill -->
    <div
      class="ui-segmented-indicator pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 rounded-[calc(var(--radius,6px)-2px)] bg-[var(--d-surface-raised)] border border-[var(--d-rule-strong)] shadow-xs"
      :class="[
        size === 'md' ? 'top-1 bottom-1 left-1' : '',
        (prefersReducedMotion || isHyperfocus) ? '!transition-none' : 'transition-transform duration-240',
      ]"
      :style="indicatorStyle"
      aria-hidden="true"
    />

    <!-- Option buttons -->
    <button
      v-for="(opt, idx) in options"
      :id="`seg-tab-${instanceId}-${opt.value}`"
      :ref="(el) => { buttonRefs[idx] = el as HTMLButtonElement }"
      :key="opt.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === opt.value"
      :aria-label="opt.ariaLabel || opt.label"
      :tabindex="modelValue === opt.value ? 0 : -1"
      class="ui-segmented-tab relative z-10 flex-1 h-full inline-flex items-center justify-center font-mono font-medium outline-none rounded-[inherit] transition-colors duration-150 active:scale-[0.97] focus-visible:ring-1 focus-visible:ring-[var(--d-sig)] cursor-pointer"
      :class="[
        size === 'sm' ? 'px-2' : 'px-3',
        modelValue === opt.value
          ? 'text-[var(--d-ink)] font-semibold'
          : 'text-[var(--d-dim)] hover:text-[var(--d-ink)]',
      ]"
      @click="selectOption(opt.value)"
      @keydown="(e) => onKeydown(e, idx)"
    >
      <span class="truncate">{{ opt.label }}</span>
      <span
        v-if="opt.shortcut"
        class="ml-1 text-[10px] font-mono opacity-40 uppercase tracking-tighter"
        aria-hidden="true"
      >
        {{ opt.shortcut }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.ui-segmented-indicator {
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .ui-segmented-indicator {
    transition: none !important;
  }
}
</style>
