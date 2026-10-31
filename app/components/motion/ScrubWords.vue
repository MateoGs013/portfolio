<script setup lang="ts">
/**
 * Palabras que se encienden al leerlas (Seguir, docs/diseno.md §2): opacidad .16 → 1 atada al scroll
 * (scrub), de `top 78%` a `bottom 42%`. Es ambiental: con reduced motion o Hiperfoco el texto queda
 * entero en 1 y no se parte. Lo que ya pasó el inicio al hidratar no se apaga: el texto nunca nace
 * tenue en pantalla.
 *
 * Las palabras siguen siendo texto real separado por espacios (aria none): el lector, la búsqueda y
 * el copiado leen la frase tal cual.
 */
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

withDefaults(defineProps<{
  text: string
  tag?: string
}>(), { tag: 'p' })

const START = 0.78

const root = useTemplateRef<HTMLElement>('root')

useMotion(root, ({ el, ambient, entering }) => {
  if (!ambient) return
  if (!entering && el.getBoundingClientRect().top < window.innerHeight * START) return

  const split = SplitText.create(el, { type: 'words', tag: 'span', wordsClass: 'sw', aria: 'none' })
  gsap.fromTo(split.words, { opacity: 0.16 }, {
    opacity: 1,
    ease: 'none',
    stagger: 0.1,
    // clamp(): cerca del final de la página `bottom 42%` puede quedar fuera del scroll posible y las
    // últimas palabras no se encenderían nunca; así terminan a más tardar al llegar al pie.
    scrollTrigger: { trigger: el, start: `top ${START * 100}%`, end: 'clamp(bottom 42%)', scrub: true },
  })

  return () => split.revert()
})
</script>

<template>
  <component :is="tag" :key="text" ref="root">{{ text }}</component>
</template>
