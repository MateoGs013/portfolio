<script setup lang="ts">
/**
 * Facetas de Obra (docs/diseno.md §8): facetar es cambiar la URL. Cada estado es un enlace real que
 * conserva el resto de la query (idioma, vista, tecnología), así que funciona sin JS y se comparte.
 * Una tecnología activa (`?stack=`, a la que se llega desde el caso) muestra su nombre con un enlace
 * que la quita. El subrayado del estado activo es un solo trazo que se desliza (FLIP, 300 ms
 * `power3.out`; 220 ms en Hiperfoco) y que el SSR ya pinta en su lugar.
 */
import { Flip } from 'gsap/Flip'
import type { ProjectStatus, ProjectSummary } from '~/lib/api'

const props = defineProps<{
  /** El estado de la query, en minúscula (`live`); cualquier otro valor se lee como «Todas». */
  status?: string
  /** El slug de la tecnología de la query. */
  stack?: string
  /** Las obras que se muestran: de ahí sale el nombre de la tecnología activa. */
  projects: readonly ProjectSummary[]
}>()

const STATUSES: readonly ProjectStatus[] = ['LIVE', 'WIP', 'ARCHIVED']

const route = useRoute()
const { t, localeRoute } = useLocale()
const prefs = useMotionPrefs()

const active = computed(() => STATUSES.find(s => s.toLowerCase() === props.status) ?? null)

/** El nombre de la tecnología, tal como lo trae la API; si ninguna obra la usa, su slug. */
const stackName = computed(() => {
  if (!props.stack) return null
  for (const p of props.projects) {
    const tech = p.techs.find(item => item.slug === props.stack)
    if (tech) return tech.name
  }
  return props.stack
})

/** La query actual con `key` en `value` (o sin `key`): la página no pierde ningún otro parámetro. */
function withQuery(key: 'status' | 'stack', value?: string) {
  const { [key]: _drop, ...rest } = route.query
  return localeRoute({ path: '/projects', query: value ? { ...rest, [key]: value } : rest })
}

/** Facetas que llegan por enlace (desde el registro) y no tienen control propio: «Todas» las quita. */
const HIDDEN_FACETS = ['year', 'featured', 'org'] as const
const hiddenActive = computed(() => HIDDEN_FACETS.some(key => route.query[key] != null))

/** «Todas»: sin estado ni facetas ocultas; conserva idioma, vista y tecnología (que tiene su chip). */
const allTo = computed(() => {
  const query = Object.fromEntries(Object.entries(route.query)
    .filter(([key]) => key !== 'status' && !(HIDDEN_FACETS as readonly string[]).includes(key)))
  return localeRoute({ path: '/projects', query })
})

const facets = computed(() => [
  { id: 'all', label: t('work.all'), to: allTo.value, current: active.value === null && !hiddenActive.value },
  ...STATUSES.map(s => ({ id: s, label: t(`status.${s}`), to: withQuery('status', s.toLowerCase()), current: active.value === s })),
])

const root = useTemplateRef<HTMLElement>('root')
const { add } = useMotion(root, () => undefined)

// El trazo vive dentro del enlace activo; al cambiar viaja desde el anterior (mismo data-flip-id).
watch(active, () => {
  const line = root.value?.querySelector<HTMLElement>('[data-flip-id]')
  if (!line || !prefs.allowTransitions.value) return
  const state = Flip.getState(line)
  const duration = prefs.hyperfocus.value ? 0.22 : 0.3
  void nextTick(() => {
    const next = root.value?.querySelector<HTMLElement>('[data-flip-id]')
    if (next) add(() => Flip.from(state, { targets: next, duration, ease: 'power3.out', scale: true }))
  })
}, { flush: 'pre' })
</script>

<template>
  <nav ref="root" :aria-label="t('work.filters')">
    <ul class="flex flex-wrap items-baseline gap-x-6 gap-y-3 text-s">
      <li v-for="f in facets" :key="f.id">
        <NuxtLink
          :to="f.to"
          :aria-current="f.current ? 'page' : undefined"
          class="relative inline-block text-dim no-underline transition-colors duration-300 ease-expo hover:text-ink aria-[current=page]:text-ink"
        >
          <RollText :text="f.label" />
          <span
            v-if="f.current"
            data-flip-id="work-facet"
            aria-hidden="true"
            class="absolute inset-x-0 -bottom-1 h-px origin-left bg-ink"
          />
        </NuxtLink>
      </li>
      <li v-if="stack && stackName" class="ms-2 border-s border-rule ps-6">
        <NuxtLink
          :to="withQuery('stack')"
          class="inline-flex items-center gap-2 text-ink no-underline"
        >
          <RollText :text="t('work.stack', { name: stackName })" />
          <span class="sr-only">{{ t('work.clearStack') }}</span>
          <AppIcon name="close" :size="12" class="text-dim" />
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
