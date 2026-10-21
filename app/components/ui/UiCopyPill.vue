<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useBenchoSound } from '~/composables/useBenchoSound'

const props = withDefaults(defineProps<{
  text: string
  label?: string
  copiedLabel?: string
  variant?: 'pill' | 'field'
}>(), {
  label: 'Copy',
  copiedLabel: 'Copied',
  variant: 'pill',
})

const copied = ref(false)
let timeoutId: ReturnType<typeof setTimeout> | null = null
const { playSound } = useBenchoSound()

const displayChars = computed(() => {
  const str = copied.value ? props.copiedLabel : props.label
  return [...str]
})

async function handleCopy(e: MouseEvent) {
  if (copied.value) return
  try {
    if (import.meta.client && e.isTrusted && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(props.text)
    }
    else if (import.meta.client) {
      const textarea = document.createElement('textarea')
      textarea.value = props.text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copied.value = true
    playSound('copied')

    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      copied.value = false
      timeoutId = null
    }, 1600)
  }
  catch {
    // Fallback silencioso
  }
}

onBeforeUnmount(() => {
  if (timeoutId) clearTimeout(timeoutId)
})
</script>

<template>
  <button
    type="button"
    class="cpy inline-flex items-center gap-2 rounded-lg border px-2.5 h-8 font-mono text-[11px] font-medium select-none cursor-pointer transition-all duration-200 focus-visible:outline-2 focus-visible:outline-sig focus-visible:outline-offset-2 active:scale-[0.97]"
    :class="copied
      ? 'border-green/40 bg-green/10 text-green'
      : 'border-rule bg-surface-raised/80 text-ink/85 hover:text-ink hover:border-rule-strong hover:bg-hover'"
    :data-done="copied || undefined"
    :aria-label="copied ? copiedLabel : `${label}: ${text}`"
    @click.stop="handleCopy"
  >
    <!-- Bencho copy-field SVG exacto: dos páginas que se fusionan + tilde con pathLength=1 -->
    <span class="cpy-icon-box relative grid place-items-center w-4 h-4 shrink-0" aria-hidden="true">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <g class="cpy-pages">
          <rect x="8" y="8" width="14" height="14" rx="2" />
          <path class="cpy-back" d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </g>
        <path
          class="cpy-tick"
          d="M20 6 9 17l-5-5"
          pathLength="1"
          stroke-width="2.4"
        />
      </svg>
    </span>

    <!-- Caracteres con barrido de brillo (cpy-sheen) de izquierda a derecha -->
    <span class="cpy-line inline-flex items-center leading-none" aria-hidden="true">
      <span
        v-for="(ch, idx) in displayChars"
        :key="`${copied}-${idx}`"
        class="cpy-ch"
        :style="{ '--i': idx }"
      >{{ ch }}</span>
    </span>

    <span class="sr-only" aria-live="polite">
      {{ copied ? copiedLabel : label }}
    </span>
  </button>
</template>

<style scoped>
/* Bencho copy-field (.cpy-*) exact mechanics */
.cpy-ch {
  white-space: pre;
}

.cpy[data-done] .cpy-ch {
  animation: cpy-sheen 0.42s ease calc(var(--i, 0) * 16ms);
}

@keyframes cpy-sheen {
  0%, 100% {
    opacity: 1;
  }
  45% {
    opacity: 0.32;
  }
}

/* THE TWO PAGES BECOME ONE: back page slides onto front, pair fades, check draws itself */
.cpy-back {
  transition: translate 0.22s cubic-bezier(0.22, 1, 0.36, 1) 0.16s;
}

.cpy-pages {
  transition: opacity 0.16s 0.16s;
}

.cpy-tick {
  stroke-dasharray: 1;
  stroke-dashoffset: 1px;
  transition: stroke-dashoffset 0.16s;
}

.cpy[data-done] .cpy-back {
  transition: translate 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  translate: 6px 6px;
}

.cpy[data-done] .cpy-pages {
  opacity: 0;
  transition: opacity 0.16s 0.2s;
}

.cpy[data-done] .cpy-tick {
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 0.24s cubic-bezier(0.22, 1, 0.36, 1) 0.22s;
}

@media (prefers-reduced-motion: reduce) {
  .cpy-back,
  .cpy-pages,
  .cpy-tick {
    transition-duration: 0.01ms !important;
    transition-delay: 0s !important;
  }
  .cpy[data-done] .cpy-ch {
    animation: none !important;
  }
}
</style>
