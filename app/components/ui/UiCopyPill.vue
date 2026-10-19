<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

interface Props {
  text: string
  label?: string
  copiedLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Copy',
  copiedLabel: 'Copied',
})

const isCopied = ref(false)
let timeoutId: ReturnType<typeof setTimeout> | null = null

async function handleCopy() {
  if (!import.meta.client) return

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(props.text)
    }
    else {
      // Fallback seguro para entornos sin Clipboard API activa
      const textarea = document.createElement('textarea')
      textarea.value = props.text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    isCopied.value = true

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Estado "copiado" activo durante 1800ms según criterio Bencho UI
    timeoutId = setTimeout(() => {
      isCopied.value = false
      timeoutId = null
    }, 1800)
  }
  catch (err) {
    console.error('Failed to copy to clipboard', err)
  }
}

onBeforeUnmount(() => {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
})
</script>

<template>
  <button
    type="button"
    :aria-label="isCopied ? copiedLabel : `${label}: ${text}`"
    class="ui-copy-pill inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-[var(--d-sig)] cursor-pointer select-none"
    :class="[
      isCopied
        ? 'bg-[var(--d-green)]/10 text-[var(--d-green)] border-[var(--d-green)]/35'
        : 'bg-[var(--d-surface)] text-[var(--d-dim)] hover:text-[var(--d-ink)] hover:bg-[var(--d-hover)] border-[var(--d-rule)]',
    ]"
    @click="handleCopy"
  >
    <!-- Crisp Copy Icon (Idle state) -->
    <svg
      v-if="!isCopied"
      class="w-3.5 h-3.5 shrink-0 opacity-75"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>

    <!-- Animated Checkmark SVG (Copied state) -->
    <svg
      v-else
      class="w-3.5 h-3.5 shrink-0 text-[var(--d-green)]"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path class="copy-checkmark-path" d="M3 8.5L6.5 12L13 4.5" />
    </svg>

    <!-- Accessible screen reader announcement -->
    <span class="sr-only" aria-live="polite">
      {{ isCopied ? copiedLabel : '' }}
    </span>

    <span class="truncate">{{ isCopied ? copiedLabel : label }}</span>
  </button>
</template>

<style scoped>
.copy-checkmark-path {
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  animation: draw-check 260ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes draw-check {
  to {
    stroke-dashoffset: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .copy-checkmark-path {
    animation: none;
    stroke-dashoffset: 0;
  }
}
</style>
