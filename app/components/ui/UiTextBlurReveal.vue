<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBenchoSound } from '~/composables/useBenchoSound'
import { useHyperfocus } from '~/composables/useHyperfocus'

const props = withDefaults(defineProps<{
  text: string
  as?: string
  split?: 'words' | 'letters'
  look?: 'blur' | 'rise' | 'fade'
  staggerMs?: number
  durationMs?: number
  replayOnClick?: boolean
}>(), {
  as: 'span',
  split: 'words',
  look: 'blur',
  staggerMs: 38,
  durationMs: 720,
  replayOnClick: false,
})

const { playSound } = useBenchoSound()
const { isHyperfocus } = useHyperfocus()

const replayKey = ref(0)

function onReplay() {
  if (!props.replayOnClick || isHyperfocus.value) return
  replayKey.value++
  playSound('press')
}

interface ParsedWord {
  word: string
  startIndex: number
  chars: Array<{ char: string; index: number }>
}

const words = computed<ParsedWord[]>(() => {
  const rawWords = props.text.split(' ')
  let globalCharIndex = 0

  return rawWords.map((word, wordIndex) => {
    const chars = [...word].map((char) => ({
      char,
      index: globalCharIndex++,
    }))

    return {
      word,
      startIndex: wordIndex,
      chars,
    }
  })
})
</script>

<template>
  <component
    :is="as"
    :key="replayKey"
    class="trv"
    :data-look="look"
    :data-clickable="replayOnClick || undefined"
    :role="replayOnClick ? 'button' : undefined"
    :tabindex="replayOnClick ? 0 : undefined"
    :style="{
      '--trv-dur': `${durationMs}ms`,
    }"
    @click="onReplay"
    @keydown.enter.prevent="onReplay"
    @keydown.space.prevent="onReplay"
  >
    <template v-for="(item, wIdx) in words" :key="wIdx">
      <span class="trv-word" aria-hidden="true">
        <!-- Split by letters -->
        <template v-if="split === 'letters'">
          <span
            v-for="c in item.chars"
            :key="c.index"
            class="trv-bit"
            :class="{ 'trv-instant': isHyperfocus }"
            :style="{ '--d': `${c.index * staggerMs}ms` }"
          >{{ c.char }}</span>
        </template>

        <!-- Split by words -->
        <template v-else>
          <span
            class="trv-bit"
            :class="{ 'trv-instant': isHyperfocus }"
            :style="{ '--d': `${item.startIndex * staggerMs}ms` }"
          >{{ item.word }}</span>
        </template>
      </span>
      <!-- Preserved Inter-word space -->
      <span v-if="wIdx < words.length - 1" class="trv-space" aria-hidden="true">&nbsp;</span>
    </template>

    <!-- Accessible Screen Reader Text -->
    <span class="sr-only">{{ text }}</span>
  </component>
</template>

<style scoped>
.trv {
  letter-spacing: -0.01em;
  color: inherit;
  display: inline;
  position: relative;
}

.trv[data-clickable] {
  cursor: pointer;
}

.trv-word {
  white-space: nowrap;
  display: inline-block;
}

.trv-space {
  display: inline;
}

.trv-bit {
  display: inline-block;
  animation: trv-blur var(--trv-dur, 720ms) cubic-bezier(0.16, 1, 0.3, 1) var(--d, 0s) both;
}

.trv[data-look="rise"] .trv-bit {
  animation-name: trv-rise;
}

.trv[data-look="fade"] .trv-bit {
  animation-name: trv-fade;
}

@keyframes trv-blur {
  0% {
    opacity: 0;
    filter: blur(8px);
    transform: translateY(0.3em);
  }
  100% {
    opacity: 1;
    filter: blur(0px);
    transform: translateY(0);
  }
}

@keyframes trv-rise {
  0% {
    opacity: 0;
    transform: translateY(0.6em);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes trv-fade {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

/* Hyperfocus or Reduced Motion instant display */
.trv-bit.trv-instant {
  animation: none !important;
  opacity: 1 !important;
  filter: none !important;
  transform: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .trv-bit {
    animation: none !important;
    opacity: 1 !important;
    filter: none !important;
    transform: none !important;
  }
}
</style>
