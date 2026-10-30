<script setup lang="ts">
// El email del pie (docs/diseno.md §2, «Rodar»): un enlace mailto real en la escala monumental y, aparte,
// el botón «Copiar email». Al copiar, las letras salen hacia arriba y vuelven desde abajo (12 ms entre
// letras) y se anuncia «Copiado». El slot va a la izquierda del botón, sobre el email. Las letras
// partidas son aria-hidden: el nombre del enlace es el email.
import { gsap } from 'gsap'
import { prefersReducedMotion } from '~/composables/useSound'

const props = defineProps<{ email: string }>()

const { t } = useLocale()
const { announce } = useAnnounce()
const { tick } = useSound()
const { isHyperfocus } = useHyperfocus()

const mail = ref<HTMLAnchorElement>()
const copied = ref(false)
const letters = computed(() => [...props.email])
/** Sin cortes y sin desbordar a 320 px: el tamaño baja si el email no entra (0,58 em por letra, con aire). */
const fit = computed(() => ({ fontSize: `min(var(--text-display-mail), calc(100cqi / ${(letters.value.length * 0.58).toFixed(2)}))` }))

let roll: gsap.core.Timeline | null = null
let reset: ReturnType<typeof setTimeout> | undefined

function rollLetters() {
  const chars = mail.value?.querySelectorAll('[data-ch]')
  if (!chars?.length || prefersReducedMotion()) return
  roll?.progress(1).kill()
  // En Hiperfoco las transiciones se acortan (docs/diseno.md §6): unos 220 ms en total y sin escalonado.
  const quick = isHyperfocus.value
  const stagger = quick ? 0 : 0.012
  roll = gsap.timeline()
    .to(chars, { yPercent: -110, duration: quick ? 0.1 : 0.45, ease: 'expo.in', stagger })
    .set(chars, { yPercent: 110 })
    .to(chars, { yPercent: 0, duration: quick ? 0.12 : 0.7, ease: 'expo.out', stagger })
}

async function copy() {
  try {
    await navigator.clipboard.writeText(props.email)
  }
  catch {
    announce(t('shell.copyFailed'))
    return
  }
  announce(t('shell.copied'))
  tick(2400)
  rollLetters()
  copied.value = true
  clearTimeout(reset)
  reset = setTimeout(() => { copied.value = false }, 2000)
}

onBeforeUnmount(() => {
  roll?.kill()
  clearTimeout(reset)
})
</script>

<template>
  <div class="[container-type:inline-size]">
    <div class="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
      <slot />
      <button
        type="button"
        class="inline-flex min-h-6 cursor-pointer items-center text-s text-dim transition-[color] duration-300 hover:text-ink"
        v-on:click="copy"
      >
        <RollText :text="copied ? t('shell.copied') : t('shell.copyEmail')" />
      </button>
    </div>
    <a
      ref="mail"
      v-magnet="0.12"
      :href="`mailto:${email}`"
      class="mt-4 inline-block max-w-full whitespace-nowrap text-display-mail text-ink"
      :style="fit"
    >
      <span class="sr-only">{{ email }}</span>
      <span aria-hidden="true"><span v-for="(c, i) in letters" :key="i" class="chm"><span data-ch class="inline-block">{{ c }}</span></span></span>
    </a>
  </div>
</template>
