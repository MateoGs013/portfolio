<script setup lang="ts">
/**
 * Líneas que se revelan (Deslizar, docs/diseno.md §2): cada línea sube desde una máscara (`yPercent`
 * 115 → 0, 1,15 s `expo.out`, 0,085 s entre líneas) cuando el bloque pasa el 88 % del viewport.
 *
 * - El SSR entrega el texto entero y legible; lo que ya está en pantalla al hidratar no se parte ni se
 *   anima (tampoco al volver a armar por registro o Hiperfoco).
 * - Con reduced motion o Hiperfoco no se parte nunca.
 * - `autoSplit` vuelve a partir si cambia el ancho o cargan las fuentes; al terminar, el texto vuelve
 *   a ser un solo nodo (sin máscaras de por medio).
 * - `aria: 'none'`: las líneas conservan su texto real (con sus espacios), así el lector de pantalla lee
 *   el párrafo aunque nunca llegue a revelarse; un `aria-label` en un <p> no se anuncia en modo lectura.
 * - `:key` por texto: si cambia (otro idioma), Vue reemplaza el elemento en vez de parchar el DOM que
 *   SplitText reescribió, y la escena se arma sobre el nuevo.
 */
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

withDefaults(defineProps<{
  text: string
  /** La etiqueta del bloque: p, h2, dd… */
  tag?: string
}>(), { tag: 'p' })

/** El bloque empieza a revelarse cuando su borde superior cruza el 88 % del viewport. */
const START = 0.88

const root = useTemplateRef<HTMLElement>('root')

useMotion(root, ({ el, ambient, entering }) => {
  if (!ambient) return
  if (!entering && el.getBoundingClientRect().top < window.innerHeight * START) return

  let frame = 0
  const split = SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'rl',
    tag: 'span',
    aria: 'none',
    autoSplit: true,
    // Devolver el tween deja que SplitText lo rehaga con el mismo avance si vuelve a partir.
    onSplit: self => gsap.from(self.lines, {
      yPercent: 115,
      duration: 1.15,
      ease: 'expo.out',
      stagger: 0.085,
      scrollTrigger: { trigger: el, start: `top ${START * 100}%`, once: true },
      onComplete: () => {
        frame = requestAnimationFrame(() => self.revert())
      },
    }),
  })

  return () => {
    cancelAnimationFrame(frame)
    split.revert()
  }
})
</script>

<template>
  <!-- La máscara deja lugar a los descendentes, como la utilidad ln. -->
  <component :is="tag" :key="text" ref="root" class="[&_.rl-mask]:-mb-[.1em] [&_.rl-mask]:pb-[.1em]">{{ text }}</component>
</template>
