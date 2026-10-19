// Composable de Decodificación Tipográfica ("Hacker / Scramble Text")
// Anima una cadena de texto pasando por glifos aleatorios de alta tecnología antes de resolverla.
// Seguro para SSR (siempre inicia con el texto final para SEO e indexación).

import { computed, onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { useHyperfocus } from './useHyperfocus'

const GLYPHS = '0123456789ABCDEF#_/*-+<>~'

export function useScrambleText(targetText: MaybeRefOrGetter<string>, durationMs = 350) {
  const text = computed(() => toValue(targetText))
  const displayText = ref(text.value)
  const { isHyperfocus } = useHyperfocus()
  let frameId: number | null = null

  function shouldSkipScramble(): boolean {
    if (!import.meta.client || typeof window === 'undefined') return true
    if (isHyperfocus.value) return true
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return reducedMotion
  }

  function scramble() {
    if (!import.meta.client) return
    if (frameId) {
      cancelAnimationFrame(frameId)
      frameId = null
    }

    const target = text.value

    if (shouldSkipScramble()) {
      displayText.value = target
      return
    }

    const totalLength = target.length
    const startTime = performance.now()

    function update(now: number) {
      // Si entra en Hyperfocus durante la decodificación, resolver inmediatamente
      if (shouldSkipScramble()) {
        displayText.value = target
        frameId = null
        return
      }

      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)

      // Cantidad de caracteres que ya se han resuelto a su valor definitivo
      const settledCount = Math.floor(progress * totalLength)

      let result = ''
      for (let i = 0; i < totalLength; i++) {
        const char = target[i]!
        if (char === ' ' || char === '\n' || char === '.') {
          result += char
        }
        else if (i < settledCount) {
          result += char
        }
        else {
          result += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        }
      }

      displayText.value = result

      if (progress < 1) {
        frameId = requestAnimationFrame(update)
      }
      else {
        displayText.value = target
        frameId = null
      }
    }

    frameId = requestAnimationFrame(update)
  }

  // Al cambiar el texto original, actualizar el texto mostrado con efecto de decodificación
  watch(text, (val) => {
    displayText.value = val
    scramble()
  })

  // Si Hyperfocus se activa, cancelar animación y resolver de inmediato al texto final
  watch(isHyperfocus, (val) => {
    if (val) {
      if (frameId && import.meta.client) {
        cancelAnimationFrame(frameId)
        frameId = null
      }
      displayText.value = text.value
    }
  })

  onBeforeUnmount(() => {
    if (frameId && import.meta.client) {
      cancelAnimationFrame(frameId)
      frameId = null
    }
  })

  return {
    displayText,
    scramble,
  }
}
