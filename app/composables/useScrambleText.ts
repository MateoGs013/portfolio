// Composable de Decodificación Tipográfica ("Hacker / Scramble Text")
// Anima una cadena de texto pasando por glifos aleatorios de alta tecnología antes de resolverla.
// Seguro para SSR (siempre inicia con el texto final para SEO e indexación).

const GLYPHS = '0123456789ABCDEF#_/*-+<>~'

export function useScrambleText(targetText: MaybeRefOrGetter<string>, durationMs = 350) {
  const text = computed(() => toValue(targetText))
  const displayText = ref(text.value)
  let frameId: number | null = null

  function scramble() {
    if (!import.meta.client) return
    if (frameId) cancelAnimationFrame(frameId)

    const target = text.value
    const totalLength = target.length
    const startTime = performance.now()

    function update(now: number) {
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

  onBeforeUnmount(() => {
    if (frameId && import.meta.client) {
      cancelAnimationFrame(frameId)
    }
  })

  return {
    displayText,
    scramble,
  }
}
