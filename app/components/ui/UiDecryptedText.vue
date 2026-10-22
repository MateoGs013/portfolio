<script setup lang="ts">
/**
 * UiDecryptedText — Texto Cifrado con Decodificación Secuencial
 * Inspirado en React Bits / Vue Bits (vue-bits.dev).
 * Decodifica una cadena letra por letra con glifos de ingeniería sin causar layout shift.
 * Seguro para SSR, accesibilidad (aria-label intacto) y modo Hiperfoco.
 */
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'
import { useBenchoSound } from '~/composables/useBenchoSound'

const props = withDefaults(defineProps<{
  text: string
  speed?: number
  characters?: string
  autoStart?: boolean
  replayOnHover?: boolean
}>(), {
  speed: 28,
  characters: '0123456789ABCDEF#_/*-+<>~',
  autoStart: true,
  replayOnHover: true,
})

const { isHyperfocus } = useHyperfocus()
const { playSound } = useBenchoSound()

const currentChars = ref<string[]>([...props.text])
const settledCount = ref(props.text.length)
let timer: ReturnType<typeof setInterval> | null = null

function triggerDecryption() {
  if (isHyperfocus.value || !import.meta.client) {
    currentChars.value = [...props.text]
    return
  }
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    currentChars.value = [...props.text]
    return
  }

  if (timer) clearInterval(timer)
  settledCount.value = 0
  const targetChars = [...props.text]
  const total = targetChars.length

  playSound('tock', { gap: 60 })

  timer = setInterval(() => {
    settledCount.value += 1

    currentChars.value = targetChars.map((target, idx) => {
      if (target === ' ' || target === '.' || target === '/' || target === '-') return target
      if (idx < settledCount.value) return target
      return props.characters[Math.floor(Math.random() * props.characters.length)] ?? '#'
    })

    if (settledCount.value >= total) {
      if (timer) clearInterval(timer)
      timer = null
      currentChars.value = [...props.text]
    }
  }, props.speed)
}

function onHover() {
  if (props.replayOnHover && !timer) {
    triggerDecryption()
  }
}

watch(() => props.text, () => {
  currentChars.value = [...props.text]
  triggerDecryption()
})

onMounted(() => {
  if (props.autoStart) {
    triggerDecryption()
  }
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <span
    class="decrypted-text font-mono inline-block tabular-nums select-none cursor-pointer"
    :aria-label="text"
    @mouseenter="onHover"
  >
    <span
      v-for="(ch, idx) in currentChars"
      :key="idx"
      class="inline-block transition-colors duration-100"
      :class="idx < settledCount ? 'text-ink font-semibold' : 'text-sig font-normal opacity-85'"
    >
      {{ ch }}
    </span>
  </span>
</template>
