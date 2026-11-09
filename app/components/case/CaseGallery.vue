<script setup lang="ts">
/**
 * Piezas de la galería (GALLERY, en su `order`), cada una en su marco con el pie de la base como
 * figcaption. Los marcos reservan la proporción real de la pieza (CLS 0).
 *
 * - Pieza de escritorio: se ve entera, en su marco exacto; lo que se mueve es la pieza con su pie, de
 *   +40 a −40 px (Seguir, parallax con scrub). Agrandar la imagen adentro del marco para moverla la
 *   recortaría por los cuatro lados aun quieta.
 * - Video: corre solo mientras se ve (MediaVideo `in-view`), con su botón de pausa.
 * - `phones`: las de viewport MOBILE, en teléfonos lado a lado que suben a distinto ritmo según la
 *   paridad de su índice.
 *
 * El parallax es ambiental: solo desde 768 px, sin reduced motion y sin Hiperfoco. En registro la
 * galería no se ve: sus piezas están en el campo `media`.
 */
import gsap from 'gsap'
import type { Media } from '~/lib/api'

const props = withDefaults(defineProps<{
  items: Media[]
  phones?: boolean
}>(), { phones: false })

const { langAttr } = useLocale()
const root = useTemplateRef<HTMLElement>('root')

const ratio = (m: Media) => ({ aspectRatio: `${m.width} / ${m.height}` })
/** Px que sube una pieza de escritorio mientras cruza la pantalla, de +40 a −40. */
const SHOT_DRIFT = 40
/** El teléfono impar arranca más abajo y sube más: los dos se cruzan al pasar. */
const phoneRange = (i: number) => (i % 2 ? { from: 90, to: -30 } : { from: 20, to: -10 })

useMotion(root, ({ el, ambient, desktop }) => {
  if (!ambient || !desktop) return
  const scrub = (trigger: Element) => ({ trigger, start: 'top bottom', end: 'bottom top', scrub: true })
  if (props.phones) {
    el.querySelectorAll<HTMLElement>('[data-phone]').forEach((phone) => {
      const { from, to } = phoneRange(Number(phone.dataset.phone))
      gsap.fromTo(phone, { y: from }, { y: to, ease: 'none', scrollTrigger: scrub(el) })
    })
    return
  }
  el.querySelectorAll<HTMLElement>('[data-parallax]').forEach((shot) => {
    gsap.fromTo(shot, { y: SHOT_DRIFT }, { y: -SHOT_DRIFT, ease: 'none', scrollTrigger: scrub(shot.parentElement ?? shot) })
  })
  return undefined
})
</script>

<template>
  <div v-if="items.length" ref="root" class="ed-only">
    <div v-if="phones" class="flex flex-wrap justify-center gap-[clamp(1rem,4vw,3rem)]">
      <figure v-for="(m, i) in items" :key="m.src" :data-phone="i" data-motion class="m-0 w-[min(17rem,40vw)]">
        <div
          class="overflow-hidden rounded-[clamp(1.2rem,2.4vw,2.2rem)] border border-rule bg-surface shadow-[0_24px_60px_color-mix(in_oklab,var(--bg)_20%,rgb(0_0_0/0.28))]"
          :style="ratio(m)"
        >
          <MediaVideo v-if="m.kind === 'VIDEO'" :media="m" class="size-full" />
          <MediaImage v-else :media="m" sizes="(min-width: 48rem) 17rem, 40vw" class="size-full object-cover object-top" />
        </div>
        <figcaption v-if="m.caption" class="mt-3 text-center text-xs text-dim" :lang="langAttr(m, 'caption')">
          {{ m.caption }}
        </figcaption>
      </figure>
    </div>

    <div v-else class="flex flex-col gap-[clamp(2.5rem,8vh,5rem)]">
      <figure v-for="m in items" :key="m.src" class="m-0">
        <div data-parallax data-motion>
          <div class="relative overflow-hidden rounded-[3px] bg-surface" :style="ratio(m)">
            <MediaVideo v-if="m.kind === 'VIDEO'" :media="m" class="absolute! inset-0" />
            <MediaImage
              v-else
              :media="m"
              sizes="(min-width: 48rem) 62vw, 100vw"
              class="absolute inset-0 size-full object-cover"
            />
          </div>
          <figcaption v-if="m.caption" class="mt-3 text-xs text-dim" :lang="langAttr(m, 'caption')">
            {{ m.caption }}
          </figcaption>
        </div>
      </figure>
    </div>
  </div>
</template>
