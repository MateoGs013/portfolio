<script setup lang="ts">
/**
 * Una cifra que rueda (Rodar, docs/diseno.md §2). El SSR trae el valor final, ya formateado con Intl
 * en el idioma de la página (y su unidad, si es una métrica).
 *
 * - Al entrar en pantalla cuenta desde 0 una sola vez (1,6 s `power3.out`). Es ambiental: con reduced
 *   motion o Hiperfoco no cuenta, y lo que ya estaba a la vista al cargar tampoco.
 * - Al cambiar el valor (un filtro) rueda hasta el nuevo en 500 ms: es respuesta a una acción, así
 *   que solo reduced motion lo apaga.
 *
 * Mientras rueda, el lector lee el valor final y no los intermedios.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Metric } from '~/lib/api'
import { metric } from '~/lib/format'

const props = withDefaults(defineProps<{
  value: number
  /** Unidad de métrica (`s`, `kb`, `usd_month`…); sin unidad es un conteo. */
  unit?: Metric['unit']
}>(), { unit: null })

const COUNT_S = 1.6
const ROLL_S = 0.5
const START = 0.9

const { lang } = useLocale()
const prefs = useMotionPrefs()
const root = useTemplateRef<HTMLElement>('root')

const shown = ref(props.value)
const animating = ref(false)

/** Los decimales del valor final: los intermedios no tienen más (el ancho no baila). */
const decimals = computed(() => {
  const [, fraction = ''] = String(props.value).split('.')
  return Math.min(fraction.length, 2)
})

const format = (n: number) => metric(Number(n.toFixed(decimals.value)), props.unit, lang.value)
const text = computed(() => format(shown.value))
const finalText = computed(() => format(props.value))

let counted = false
let rolling: gsap.core.Tween | null = null
let counting: gsap.core.Tween | null = null

function finish() {
  shown.value = props.value
  animating.value = false
}

const { add } = useMotion(root, ({ el, ambient, entering }) => {
  if (!ambient || counted) return
  if (!entering && el.getBoundingClientRect().top < window.innerHeight * START) {
    counted = true
    return
  }
  const counter = { v: 0 }
  const tween = counting = gsap.to(counter, {
    v: props.value,
    duration: COUNT_S,
    ease: 'power3.out',
    paused: true,
    onUpdate: () => {
      shown.value = counter.v
    },
    onComplete: finish,
  })
  ScrollTrigger.create({
    trigger: el,
    start: `top ${START * 100}%`,
    once: true,
    onEnter: () => {
      counted = true
      animating.value = true
      shown.value = 0
      tween.play()
    },
  })
  // Revertida a mitad de camino (registro, Hiperfoco, desmontar): queda el valor final.
  return finish
})

watch(() => props.value, (to) => {
  // Un cambio gana sobre el conteo de entrada que todavía no terminó.
  counting?.kill()
  rolling?.kill()
  counted = true
  if (!prefs.allowTransitions.value) return finish()
  const counter = { v: shown.value }
  animating.value = true
  rolling = add(() => gsap.to(counter, {
    v: to,
    duration: ROLL_S,
    ease: 'power3.out',
    onUpdate: () => {
      shown.value = counter.v
    },
    onComplete: finish,
  }))
})

onBeforeUnmount(() => rolling?.kill())
</script>

<template>
  <span ref="root" class="tabular-nums">
    <template v-if="animating"><span class="sr-only">{{ finalText }}</span><span aria-hidden="true">{{ text }}</span></template>
    <template v-else>{{ finalText }}</template>
  </span>
</template>
