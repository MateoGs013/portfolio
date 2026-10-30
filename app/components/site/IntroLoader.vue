<script setup lang="ts">
/**
 * Cargador de la primera visita (Transformar, docs/diseno.md §2 y §6): la única entrada animada del
 * sitio, en el inicio y una vez por sesión. El SSR lo entrega siempre, oculto; solo se ve con
 * `html[data-intro]`, que pone el script del head antes del primer pintado (primera visita a `/`, sin
 * reduced motion ni Hiperfoco). Con JS apagado no aparece nunca.
 *
 * Las letras de `about.display_name` suben (1 s `expo.out`, 0,035 s por letra) mientras el contador
 * 0 → 100 y la barra avanzan en 1,5 s. A 1,6 s el nombre viaja con FLIP (1,15 s `expo.inOut`) hasta el
 * nombre del inicio, escalado por la razón de sus tamaños: el cargador usa el interlineado y el
 * tracking del nombre del inicio, así llega sin salto. El fondo se vuelve transparente y el resto de la
 * página aparece. Un click, una tecla o la rueda lo terminan (`tl.progress(1)`).
 *
 * Seguridad: una regla CSS lo oculta a los 4 s pase lo que pase (`intro-safety`, en pages/index.vue).
 * Si JS llega tarde, la línea de tiempo se acelera para terminar antes; si no llega a tiempo, se
 * omite. Escribe `mov-visited` en sessionStorage al montarse, haya corrido o no.
 */
import gsap from 'gsap'

const props = defineProps<{
  /** El nombre del inicio (about.display_name). */
  name: string
  /** La raíz del contenido del inicio: su h1 es el destino del viaje y el resto aparece después. */
  scope: HTMLElement | null
}>()

/** Debe coincidir con la demora de la regla de seguridad. */
const SAFETY_MS = 4000
/** Cuándo termina de verse el cargador, en segundos de su línea de tiempo. */
const VISIBLE_S = 2.75
/** Margen antes de la regla de seguridad y lo mínimo que vale la pena mostrar. */
const MARGIN_S = 0.15
const MIN_S = 1.2

const words = computed(() => props.name.split(/\s+/).filter(Boolean).map(word => [...word]))

const { isRecord } = useRecordView()
const { lenis } = useLenis()
const root = useTemplateRef<HTMLElement>('root')

onMounted(() => {
  try {
    sessionStorage.setItem('mov-visited', '1')
  }
  catch {
    // Sin almacenamiento de sesión el cargador corre en cada visita: no rompe nada.
  }
})

const rect = (el: Element) => el.getBoundingClientRect()
const fontSize = (el: Element) => Number.parseFloat(getComputedStyle(el).fontSize)

/** Lo que aparece después del viaje: la cabecera, el resto de la portada y las secciones siguientes. */
function restOf(scope: HTMLElement, target: HTMLElement): HTMLElement[] {
  const hero = target.closest('section')
  const header = document.querySelector<HTMLElement>('header[data-chrome]')
  const heroRest = hero ? [...hero.children].filter(child => !child.contains(target)) : []
  const sections = [...scope.children].filter(child => child !== hero)
  return [header, ...heroRest, ...sections].filter((el): el is HTMLElement => el instanceof HTMLElement)
}

// La escena se arma cuando la página ya tiene su raíz (la ref del padre llega después del montaje).
useMotion(() => (props.scope ? root.value : null), ({ el, ambient }) => {
  const html = document.documentElement
  if (!html.hasAttribute('data-intro')) return

  const end = () => html.removeAttribute('data-intro')
  const target = props.scope?.querySelector<HTMLElement>('h1')
  const loaderName = el.querySelector<HTMLElement>('[data-name]')
  const count = el.querySelector<HTMLElement>('[data-count]')
  const remaining = (SAFETY_MS - performance.now()) / 1000 - MARGIN_S
  const skip = !ambient || isRecord.value || !target || !loaderName || !count || !props.scope
    || !!window.location.hash || window.scrollY > 0 || remaining < MIN_S
  if (skip) {
    end()
    return
  }

  const rest = restOf(props.scope!, target!)
  const counter = { value: 0 }
  lenis.value?.stop()

  const tl = gsap.timeline({ onComplete: finish })
  tl.set([target, ...rest], { opacity: 0 }, 0)
    // Antes de JS el CSS las esconde con translateY(110%); GSAP lo leería como `y` en px: se anula.
    .fromTo(el.querySelectorAll('.ch'), { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.035 }, 0)
    .to(counter, { value: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => {
      count!.textContent = String(Math.round(counter.value))
    } }, 0)
    .fromTo(el.querySelector('[data-bar]'), { scaleX: 0 }, { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
    // Se mide al llegar: para entonces la fuente ya cargó y ninguno de los dos se movió.
    .to(loaderName!, {
      x: () => rect(target!).left - rect(loaderName!).left,
      y: () => rect(target!).top - rect(loaderName!).top,
      scale: () => fontSize(target!) / fontSize(loaderName!),
      duration: 1.15,
      ease: 'expo.inOut',
    }, 1.6)
    .to([count, el.querySelector('[data-bar]')], { opacity: 0, duration: 0.4 }, 1.6)
    .to(el.querySelector('[data-bg]'), { opacity: 0, duration: 0.6 }, 2.15)
    .to(rest, { opacity: 1, duration: 1, ease: 'power2.out', stagger: 0.08 }, 2.5)
    .set(target, { opacity: 1 }, VISIBLE_S)
    .set(loaderName, { opacity: 0 }, VISIBLE_S)
    // Transparente, ya no tapa: lo que se toca de acá en más es la página.
    .set(el, { pointerEvents: 'none' }, VISIBLE_S)
  tl.timeScale(Math.max(1, VISIBLE_S / remaining))

  const skipNow = () => tl.progress(1)
  const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const
  events.forEach(type => window.addEventListener(type, skipNow, { passive: true }))

  let done = false
  function finish() {
    if (done) return
    done = true
    events.forEach(type => window.removeEventListener(type, skipNow))
    gsap.set([target, ...rest], { clearProps: 'opacity' })
    end()
    lenis.value?.start()
  }

  return finish
})
</script>

<template>
  <div
    ref="root"
    aria-hidden="true"
    data-hf="hide"
    data-ornament
    class="fixed inset-0 z-60 hidden place-items-center print:hidden [[data-intro]_&]:grid [[data-intro]_&]:animate-[intro-safety_.4s_4s_both]"
  >
    <i data-bg class="absolute inset-0 bg-bg" />
    <p
      data-name
      class="relative -ml-[.045em] origin-top-left text-display-loader leading-(--text-display-name--line-height) tracking-(--text-display-name--letter-spacing) text-ink"
    >
      <span v-for="(word, w) in words" :key="w" class="block whitespace-nowrap">
        <span v-for="(ch, i) in word" :key="i" class="chm"><span class="ch inline-block [transform:translateY(110%)]">{{ ch }}</span></span>
      </span>
    </p>
    <span data-count class="absolute right-pad bottom-pad text-s text-dim tabular-nums">0</span>
    <i data-bar class="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-sig [transform:scaleX(0)]" />
  </div>
</template>
