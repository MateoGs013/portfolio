<script setup lang="ts">
/**
 * Trayectoria (`#trayectoria`, destino de /experience): /api/experience de la más reciente a la más
 * vieja, con período, cargo, tipo (diccionario), institución, resumen y las obras ligadas, que viajan
 * como título del caso al tocarlas. En desktop el rótulo queda fijo; en registro (R) es la tabla de
 * Experience. Al llegar por el ancla, la sección recibe el foco sin mover el scroll.
 */
import gsap from 'gsap'
import type { Experience } from '~/lib/api'
import { period } from '~/lib/format'

const props = defineProps<{ experience: readonly Experience[] }>()

const route = useRoute()
const { t, lang, localeRoute, langAttr } = useLocale()
const { isRecord } = useRecordView()
const { scrollTo } = useLenis()

/** La API ya ordena por inicio descendente; se ordena igual por si cambia el criterio de la lista. */
const entries = computed(() => [...props.experience].sort((a, b) => b.startedAt.localeCompare(a.startedAt)))

/**
 * Tipo e institución debajo del cargo. El tipo se omite si el cargo ya lo nombra («Freelance · …»,
 * «Proyecto propio · …»): la línea no repite lo que se acaba de leer.
 */
function meta(e: Experience): string {
  const kind = t(`kind.${e.kind}`)
  const named = e.role.toLocaleLowerCase(lang.value).startsWith(kind.toLocaleLowerCase(lang.value))
  return [named ? null : kind, e.org?.name].filter(Boolean).join(' · ')
}

const ID = 'trayectoria'
const section = useTemplateRef<HTMLElement>('section')

/** Gestos del lector que sueltan el ancla: desde ahí el scroll es suyo. */
const USER_INPUT = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
let release: (() => void) | null = null

/**
 * El salto nativo al ancla ocurre antes de que carguen las fuentes, y la frase de arriba cambia de
 * alto al cambiar de fuente: durante dos segundos, cada vez que la página cambia de alto, la sección
 * se vuelve a anclar arriba, salvo que el lector ya haya hecho scroll o tocado algo.
 */
function holdAnchor(el: HTMLElement) {
  const observer = new ResizeObserver(() => scrollTo(el, { immediate: true }))
  const timer = setTimeout(() => release?.(), 2000)
  release = () => {
    observer.disconnect()
    clearTimeout(timer)
    USER_INPUT.forEach(type => window.removeEventListener(type, stop))
    release = null
  }
  const stop = () => release?.()
  USER_INPUT.forEach(type => window.addEventListener(type, stop, { passive: true }))
  observer.observe(document.body)
}

// Al llegar por el ancla (/experience redirige acá) la sección queda arriba y con el foco, así Tab
// sigue desde la trayectoria.
onMounted(() => {
  if (route.hash !== `#${ID}` || !section.value) return
  section.value.focus({ preventScroll: true })
  holdAnchor(section.value)
})

onBeforeUnmount(() => release?.())

/**
 * Cada fila sube al entrar (movimiento.html, `.exp li[data-reveal]`: y 40, 1 s `expo.out`, desde el
 * 92 %). Solo con movimiento ambiental; las que ya están en pantalla (al llegar por el ancla o al
 * volver) quedan quietas.
 */
const list = useTemplateRef<HTMLElement>('list')
useMotion(list, ({ el, ambient }) => {
  if (!ambient) return undefined
  const below = [...el.children].filter(li => li.getBoundingClientRect().top > window.innerHeight * 0.92)
  below.forEach(li => gsap.from(li, {
    y: 40,
    opacity: 0,
    duration: 1,
    ease: 'expo.out',
    scrollTrigger: { trigger: li, start: 'top 92%', once: true },
  }))
  return undefined
})
</script>

<template>
  <section
    :id="ID"
    ref="section"
    tabindex="-1"
    aria-labelledby="trayectoria-titulo"
    class="px-pad pt-section outline-none md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2.6fr)] md:gap-x-[clamp(2rem,5vw,6rem)] focus-mode:block record:block"
  >
    <h2 id="trayectoria-titulo" class="pb-5 text-s text-dim md:sticky md:top-24 md:self-start focus-mode:static">
      {{ t('about.timeline') }}
    </h2>

    <RecordTable v-if="isRecord" collection="experience" :rows="entries" :columns="['role', 'kind', 'org', 'startedAt', 'endedAt']" />

    <ol v-else ref="list" class="@container border-b border-rule">
      <li
        v-for="e in entries"
        :key="e.slug"
        :data-f="e.slug"
        data-motion
        class="grid gap-x-6 gap-y-1 border-t border-rule py-6 md:grid-cols-[9.5rem_minmax(0,1fr)] @min-[44rem]:grid-cols-[9.5rem_minmax(0,1fr)_minmax(0,1.3fr)] focus-mode:@min-[44rem]:grid-cols-[9.5rem_minmax(0,1fr)]"
      >
        <span class="text-s whitespace-nowrap text-dim tabular-nums">{{ period(e.startedAt, e.endedAt, lang) }}</span>
        <div class="flex flex-col gap-1">
          <h3 data-f="role" class="fv text-l font-title text-ink" :lang="langAttr(e, 'role')">
            {{ e.role }}
          </h3>
          <p v-if="meta(e)" class="text-s text-dim">
            {{ meta(e) }}
          </p>
          <p v-if="e.projects.length" class="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-s">
            <span class="text-faint">{{ t('about.works') }}</span>
            <NuxtLink
              v-for="p in e.projects"
              :key="p.slug"
              :to="localeRoute(`/projects/${p.slug}`)"
              data-travel="row"
              class="text-ink"
            >
              <RollText :text="p.title" travel />
            </NuxtLink>
          </p>
        </div>
        <p v-if="e.summary" class="mt-2 max-w-read text-s text-dim md:col-start-2 @min-[44rem]:col-start-3 @min-[44rem]:row-start-1 @min-[44rem]:mt-0 focus-mode:@min-[44rem]:col-start-2 focus-mode:@min-[44rem]:row-start-auto focus-mode:@min-[44rem]:mt-2" :lang="langAttr(e, 'summary')">
          {{ e.summary }}
        </p>
      </li>
    </ol>
  </section>
</template>
