<script setup lang="ts">
/**
 * La siguiente obra como escena (docs/diseno.md §2): a pantalla completa, con su portada en profundidad
 * (la imagen se mueve más lento que su marco, de −10 % a 6 %) y una sombra fuerte abajo para leer el
 * título sobre portadas claras. Mientras entra, la temperatura de la página pasa a la de la obra
 * siguiente (`tint`: la página la toma). Al tocarla, título y portada viajan al caso siguiente
 * (`data-travel="next"`). Al apuntarla el título se corre 1,5 rem.
 *
 * En Hiperfoco la escena no se ve (`data-hf="hide"`) y queda un enlace llano, que también viaja.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { ProjectSummary } from '~/lib/api'

const props = defineProps<{ next: ProjectSummary }>()
const emit = defineEmits<{ tint: [entering: boolean] }>()

const HEX = /^#[0-9a-f]{6}$/i

const { t, localeRoute } = useLocale()
const scene = useTemplateRef<HTMLElement>('scene')
const depth = useTemplateRef<HTMLElement>('depth')

const to = computed(() => localeRoute(`/projects/${props.next.slug}`))
const covers = computed(() => props.next.media.filter(m => m.role === 'COVER'))
const cover = computed(() => covers.value.find(m => m.kind === 'IMAGE') ?? covers.value[0])
const tint = computed(() => covers.value.find(m => m.tint)?.tint ?? undefined)
const plateStyle = computed(() => (tint.value && HEX.test(tint.value)
  ? { backgroundColor: `color-mix(in oklab, var(--surface), ${tint.value} 22%)` }
  : undefined))

useMotion(scene, ({ el, ambient }) => {
  if (!ambient) return
  if (depth.value) {
    gsap.fromTo(depth.value, { yPercent: -8 }, {
      yPercent: 5,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    })
  }
  ScrollTrigger.create({
    trigger: el,
    start: 'top 65%',
    onEnter: () => emit('tint', true),
    onLeaveBack: () => emit('tint', false),
  })
  return () => emit('tint', false)
})
</script>

<template>
  <nav :aria-label="t('case.next')">
    <!-- En registro la siguiente obra es un enlace llano, como en Hiperfoco: la escena es diseño. -->
    <div ref="scene" data-hf="hide" class="record:hidden">
      <NuxtLink
        :to="to"
        data-travel="next"
        :data-tint="tint"
        class="group relative block h-[clamp(28rem,85svh,56rem)] overflow-hidden text-white"
      >
        <!-- 124 % de alto y −12 % arriba: el recorrido del parallax nunca deja ver el borde. -->
        <div ref="depth" data-motion class="absolute inset-x-0 -top-[12%] h-[124%]">
          <MediaImage v-if="cover" :media="cover" decorative data-travel-cover sizes="100vw" class="size-full max-w-none object-cover brightness-42 blur-[2px]" />
          <div v-else data-travel-cover class="size-full bg-surface" :style="plateStyle" />
        </div>
        <div aria-hidden="true" class="absolute inset-0 bg-linear-to-t from-black/90 to-black/25 to-60%" />
        <div class="absolute right-pad bottom-[clamp(1.5rem,6vh,4rem)] left-pad">
          <span class="mb-4 block text-s text-white/75">{{ t('case.next') }}</span>
          <span class="block -ms-[0.04em] max-w-[12ch] text-display-case">
            <span data-travel-title class="transition-transform duration-900 ease-expo fine:group-hover:translate-x-6">{{ next.title }}</span>
          </span>
        </div>
      </NuxtLink>
    </div>

    <div data-hf="measure" class="hidden px-pad pb-section focus-mode:block record:block">
      <NuxtLink :to="to" data-travel="next" class="flex flex-col gap-2 border-t border-rule pt-6 text-ink">
        <span class="text-s text-dim">{{ t('case.next') }}</span>
        <span data-travel-title class="text-xl font-title">{{ next.title }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
