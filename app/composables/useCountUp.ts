import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'
import { useHyperfocus } from './useHyperfocus'

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export interface UseCountUpOptions {
  duration?: number
  decimals?: number
  from?: number
  startOnHydration?: boolean
}

/**
 * Composable SSR-safe para interpolación numérica tabular ("CountUp").
 * Garantiza que en SSR el valor emitido en el HTML sea exactamente el target final (evitando CLS y FOUC).
 * En hidratación cliente o mutaciones del target, interpola suavemente con curva cubic-bezier
 * a menos que el usuario tenga `prefers-reduced-motion: reduce` o modo Hyperfocus activo.
 */
export function useCountUp(
  target: MaybeRefOrGetter<number>,
  durationOrOptions?: number | UseCountUpOptions,
) {
  const options = typeof durationOrOptions === 'number'
    ? { duration: durationOrOptions }
    : (durationOrOptions ?? {})

  const duration = options.duration ?? 380
  const decimals = options.decimals ?? 0
  const startOnHydration = options.startOnHydration ?? true

  const targetValue = computed(() => toValue(target))

  // SSR Safe: Inicia con el valor real para que el HTML renderizado en servidor sea exacto
  const currentValue = ref(targetValue.value)
  const isAnimating = ref(false)

  const { isHyperfocus } = useHyperfocus()
  let rafId: number | null = null

  function formatNumber(val: number): string {
    if (decimals === 0) {
      return Math.round(val).toLocaleString()
    }
    return val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  const formatted = computed(() => formatNumber(currentValue.value))

  function shouldSkipAnimation(): boolean {
    if (!import.meta.client || typeof window === 'undefined') return true
    if (isHyperfocus.value) return true
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return reducedMotion
  }

  function animate(fromVal: number, toVal: number) {
    if (!import.meta.client) {
      currentValue.value = toVal
      return
    }

    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    if (shouldSkipAnimation() || duration <= 0) {
      currentValue.value = toVal
      isAnimating.value = false
      return
    }

    const startTime = performance.now()
    isAnimating.value = true

    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)

      const nextVal = fromVal + (toVal - fromVal) * eased
      currentValue.value = decimals === 0 ? Math.round(nextVal) : Number(nextVal.toFixed(decimals))

      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      }
      else {
        currentValue.value = toVal
        isAnimating.value = false
        rafId = null
      }
    }

    rafId = requestAnimationFrame(step)
  }

  // En hidratación cliente, iniciar interpolación desde 0 o valor base si startOnHydration es true
  onMounted(() => {
    if (startOnHydration && !shouldSkipAnimation()) {
      const fromVal = options.from ?? 0
      currentValue.value = fromVal
      animate(fromVal, targetValue.value)
    }
  })

  // Reaccionar cuando cambie el target
  watch(targetValue, (newVal, oldVal) => {
    if (newVal === oldVal) return
    const startVal = currentValue.value
    animate(startVal, newVal)
  })

  // Si Hyperfocus se activa durante una animación en progreso, resolver inmediatamente
  watch(isHyperfocus, (val) => {
    if (val && rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
      currentValue.value = targetValue.value
      isAnimating.value = false
    }
  })

  onBeforeUnmount(() => {
    if (rafId !== null && import.meta.client) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  })

  return Object.assign(currentValue, {
    formatted,
    isAnimating,
  })
}
