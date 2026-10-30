<script setup lang="ts">
/**
 * El acceso al CV Harvard ATS. Cerrado: «Ver CV» (data-vt="cv-sheet"), la disponibilidad de contact,
 * las descargas y la copia que solo se imprime (Ctrl+P en /about imprime el CV). Abierto
 * (`/about?cv=ats`): la hoja en lugar del cuerpo, una sola superficie; Esc (CvSheet) y Backspace
 * (useHotkeys) vuelven a /about.
 *
 * Abrir y cerrar es la misma página con otra query, y Nuxt solo anima cambios de página: la
 * transformación la arma este bloque. Con la página saliente en pantalla empieza una view transition
 * cuyo update deja seguir la navegación y espera la superficie nueva; ahí la página se ancla (arriba
 * para la hoja, en «Ver CV» al volver) y el foco va al título de la hoja o vuelve al enlace. El enlace
 * crece hasta la hoja sin telón; con reduced motion es un corte directo con el mismo anclaje y foco.
 */
import type { RouteLocationNormalized } from 'vue-router'

const props = defineProps<{ open: boolean }>()

const route = useRoute()
const router = useRouter()
const nuxtApp = useNuxtApp()
const { t, localeRoute } = useLocale()
const { allowTransitions } = useMotionPrefs()
const { lenis, scrollTo } = useLenis()
const { data: contact } = await useDoc('contact')

const isSheet = (r: RouteLocationNormalized) => r.query.cv === 'ats'

/** La misma página con la hoja abierta o cerrada, conservando el resto de la query (lang, vista). */
const toggleTo = computed(() => {
  const { cv: _cv, ...query } = route.query
  return localeRoute({ path: route.path, query: props.open ? query : { ...query, cv: 'ats' } })
})

const heading = useTemplateRef<HTMLElement>('heading')
const link = useTemplateRef<{ $el: HTMLElement }>('link')

/** Hasta ~0,6 s a que aparezca la superficie nueva (la hoja espera su /api/cv, ya en el payload). */
async function appeared(open: boolean): Promise<HTMLElement | null> {
  // Con setTimeout y no con requestAnimationFrame: durante el update de una view transition el
  // navegador no pinta y puede no dar cuadros.
  for (let tick = 0; tick < 40; tick++) {
    await nextTick()
    const el = open ? heading.value : link.value?.$el
    if (el?.isConnected && (!open || document.querySelector('[data-vt="cv-sheet"]'))) return el
    await new Promise(resolve => setTimeout(resolve, 16))
  }
  return null
}

/** La hoja se lee desde arriba; al volver, «Ver CV» queda en pantalla y recupera el foco. */
async function land(open: boolean) {
  const target = await appeared(open)
  // Lenis guarda el alto de la página anterior: sin medir de nuevo, el salto se corta en ese límite.
  lenis.value?.resize()
  if (open) scrollTo(0, { immediate: true })
  else if (target) scrollTo(target, { immediate: true, offset: -window.innerHeight * 0.35 })
  target?.focus({ preventScroll: true })
}

const toggles = (to: RouteLocationNormalized, from: RouteLocationNormalized) =>
  to.path === from.path && isSheet(to) !== isSheet(from)

/** Cierra el update de la view transition en curso cuando la superficie nueva ya está anclada. */
let landed: (() => void) | null = null
let stops: (() => void)[] = []

onMounted(() => {
  stops = [
    router.beforeResolve((to, from) => {
      if (!toggles(to, from) || !allowTransitions.value || !document.startViewTransition) return
      return new Promise<void>((proceed) => {
        const transition = document.startViewTransition(() => new Promise<void>((done) => {
          landed = done
          proceed()
        }))
        transition.finished.catch(() => {})
        // Lenis se detiene mientras dura y los ScrollTrigger miden de nuevo al terminar (motion.client).
        void nuxtApp.callHook('page:view-transition:start', transition)
      })
    }),
    router.afterEach(async (to, from, failure) => {
      if (!toggles(to, from)) return
      if (!failure) await land(isSheet(to))
      landed?.()
      landed = null
    }),
  ]
})

onBeforeUnmount(() => {
  stops.forEach(stop => stop())
  landed?.()
  landed = null
})
</script>

<template>
  <!-- La hoja ya es su propia región (CvContainer): este bloque no agrega otra con el mismo nombre. -->
  <div v-if="open" class="px-pad pt-[clamp(6rem,16vh,9rem)] pb-section print:p-0">
    <div class="no-print mx-auto mb-10 flex w-full max-w-[210mm] flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
      <h1 id="cv-titulo" ref="heading" tabindex="-1" class="text-xl text-ink">
        {{ t('cv.title') }}
      </h1>
      <NuxtLink :to="toggleTo" aria-keyshortcuts="Escape Backspace" class="text-s text-dim transition-colors duration-300 hover:text-ink focus-visible:text-ink">
        <span class="roll"><span :data-t="t('about.closeCv')">{{ t('about.closeCv') }}</span></span>
      </NuxtLink>
    </div>
    <CvContainer />
  </div>

  <section
    v-else
    aria-labelledby="cv-titulo"
    class="px-pad pt-section md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2.6fr)] md:gap-x-[clamp(2rem,5vw,6rem)] focus-mode:block print:block"
  >
    <h2 id="cv-titulo" class="pb-5 text-s text-dim md:sticky md:top-24 md:self-start focus-mode:static">
      {{ t('cv.title') }}
    </h2>
    <div class="flex flex-col gap-6">
      <NuxtLink
        ref="link"
        :to="toggleTo"
        data-vt="cv-sheet"
        aria-keyshortcuts="5"
        class="group flex print:hidden flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-y border-rule py-[clamp(1.2rem,3vh,2rem)] text-ink"
      >
        <span class="text-display-row">
          <span class="inline-block transition-transform duration-700 ease-expo group-focus-visible:translate-x-[1.2rem] fine:group-hover:translate-x-[1.2rem] motion-reduce:transition-none">{{ t('about.viewCv') }}</span>
        </span>
        <span class="text-s text-dim">{{ t('about.cvFormat') }}</span>
      </NuxtLink>
      <RecordField collection="contact" k="availability" :value="docText(contact, 'availability')" :record="contact">
        <template #default="{ fv }">
          <p class="max-w-read text-s text-dim">
            <span class="text-faint">{{ t('about.availability') }}</span>
            <span :class="fv" class="ms-3">{{ docText(contact, 'availability') }}</span>
          </p>
        </template>
      </RecordField>
      <CvDownloads />
    </div>
    <!-- Ctrl+P en /about imprime el CV, no la página (print.css). -->
    <CvContainer print-only />
  </section>
</template>
