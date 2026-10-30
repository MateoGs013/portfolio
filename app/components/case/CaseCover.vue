<script setup lang="ts">
/**
 * La captura que crece (Transformar, docs/diseno.md §2): la portada del caso como pantalla enmarcada.
 * Con desktop, puntero fino y movimiento, arranca a .88 con radio de 6 px y llega al borde con scrub
 * (de `top 85%` a `top 10%`) mientras la imagen se desliza adentro de 0 a −8 %. En táctil, por debajo de
 * 768 px, con reduced motion o en Hiperfoco queda estática.
 *
 * - `data-vt="cover"` en el marco: el par de la portada de la tarjeta, la fila o «Siguiente», con la
 *   misma imagen (la COVER IMAGE, eager y prioridad alta: es el LCP).
 * - La COVER VIDEO corre encima en autoplay y se funde sobre la captura cuando ya tiene cuadros.
 * - El marco reserva su caja con aspect-ratio (CLS 0). Sin portada, una placa con el título.
 * - El SSR ya pinta el estado inicial del crecimiento con las mismas condiciones, así no salta al hidratar.
 * - En registro, el campo `media` muestra todas las piezas de la obra como miniaturas.
 */
import gsap from 'gsap'
import type { Project } from '~/lib/api'

const props = defineProps<{ project: Project }>()

const HEX = /^#[0-9a-f]{6}$/i

const section = useTemplateRef<HTMLElement>('section')
const frame = useTemplateRef<HTMLElement>('frame')
const inner = useTemplateRef<HTMLElement>('inner')

const covers = computed(() => props.project.media.filter(m => m.role === 'COVER'))
const image = computed(() => covers.value.find(m => m.kind === 'IMAGE') ?? covers.value[0])
const video = computed(() => covers.value.find(m => m.kind === 'VIDEO'))
const tint = computed(() => image.value?.tint ?? video.value?.tint ?? null)
const plateStyle = computed(() => (tint.value && HEX.test(tint.value)
  ? { backgroundColor: `color-mix(in oklab, var(--surface), ${tint.value} 22%)` }
  : undefined))

useMotion(section, ({ el, ambient, desktop, fine }) => {
  const box = frame.value
  if (!ambient || !desktop || !fine || !box) return
  gsap.fromTo(box, { scale: 0.88, borderRadius: 6 }, {
    scale: 1,
    borderRadius: 0,
    ease: 'none',
    scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 10%', scrub: true },
  })
  if (inner.value) {
    gsap.fromTo(inner.value, { yPercent: 0 }, {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    })
  }
  return undefined
})

/** El estado inicial del crecimiento, en CSS y con las condiciones de la escena (sin Hiperfoco). */
const growing = 'md:motion-safe:fine:[:root:not([data-hyperfocus=true])_&]:[transform:scale(.88)] md:motion-safe:fine:[:root:not([data-hyperfocus=true])_&]:rounded-[6px]'
</script>

<template>
  <section ref="section" class="overflow-hidden focus-mode:px-pad record:overflow-visible record:px-pad">
    <RecordField collection="projects" k="media" :value="project.media" :record="project">
      <div
        ref="frame"
        data-vt="cover"
        data-motion
        :class="growing"
        class="relative aspect-[16/10] max-h-svh w-full origin-top overflow-hidden bg-surface will-change-transform focus-mode:rounded-[3px]"
      >
        <div ref="inner" data-motion class="absolute inset-x-0 top-0 h-[112%]">
          <MediaImage
            v-if="image"
            :media="image"
            loading="eager"
            fetchpriority="high"
            sizes="100vw"
            class="size-full object-cover object-top"
          />
        </div>
        <MediaVideo
          v-if="video"
          :media="video"
          mode="autoplay"
          class="absolute! inset-0 [&>video]:object-top [&>video]:opacity-0 [&>video]:transition-opacity [&>video]:duration-600 [&>video]:ease-expo data-playing:[&>video]:opacity-100"
        />
      </div>
    </RecordField>

    <div
      v-if="!project.media.length"
      data-vt="cover"
      aria-hidden="true"
      class="ed-only flex aspect-[16/10] max-h-svh w-full items-end bg-surface p-pad text-display-row text-ink focus-mode:rounded-[3px]"
      :style="plateStyle"
    >
      {{ project.title }}
    </div>
  </section>
</template>
