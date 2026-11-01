<script setup lang="ts">
/**
 * Búsqueda laboral: Vacantes, Publicaciones y Tendencias como pestañas arriba de cada lista. Cada una
 * es su propia dirección (la ruta es el estado), así que son enlaces con aria-current, no tabs de
 * panel. El subrayado en --sig viaja 300 ms (solo transform). Dentro de un registro no se muestran:
 * el registro ocupa la pantalla con su «← Vacantes».
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { shell } from './dict'
import { SEARCH_TABS } from './nav'

const route = useRoute()
const inRecord = computed(() => !!route.params['id'])
const activeTo = computed(() => SEARCH_TABS.find(tab => route.path.startsWith(tab.to))?.to ?? null)

const bar = ref<HTMLElement | null>(null)
const underline = ref({ x: 0, w: 0, ready: false })

function place(): void {
  const el = bar.value?.querySelector<HTMLElement>('[aria-current="page"]')
  if (!el) return
  underline.value = { x: el.offsetLeft, w: el.offsetWidth, ready: underline.value.w > 0 }
}

let observer: ResizeObserver | null = null
onMounted(() => {
  place()
  observer = new ResizeObserver(place)
  if (bar.value) observer.observe(bar.value)
  void document.fonts?.ready.then(place)
})
onBeforeUnmount(() => observer?.disconnect())
watch([activeTo, inRecord], () => void nextTick(place))

/** Mide 100 px y escala: así viaja solo con transform. */
const underlineStyle = computed(() => ({
  transform: `translateX(${underline.value.x}px) scaleX(${underline.value.w / 100})`,
  opacity: underline.value.w ? 1 : 0,
}))
</script>

<template>
  <div>
    <nav
      v-show="!inRecord"
      ref="bar"
      :aria-label="shell.nav.search"
      class="relative mx-4 mt-6 flex gap-7 overflow-x-auto border-b border-rule [scrollbar-width:none] md:mx-10 md:mt-8 xl:mx-16 xl:mt-10"
    >
      <RouterLink
        v-for="tab in SEARCH_TABS"
        :key="tab.to"
        :to="tab.to"
        :aria-current="tab.to === activeTo ? 'page' : undefined"
        class="shrink-0 pt-2 pb-3 text-row font-[420] whitespace-nowrap no-underline transition-colors duration-120 ease-e hover:text-ink focus-visible:-outline-offset-2"
        :class="tab.to === activeTo ? 'text-ink' : 'text-faint'"
      >
        {{ tab.label }}
      </RouterLink>
      <span
        class="pointer-events-none absolute bottom-0 left-0 h-0.5 w-[100px] origin-left bg-sig"
        :class="underline.ready ? 'transition-transform duration-300 ease-e' : ''"
        :style="underlineStyle"
        aria-hidden="true"
      />
    </nav>
    <RouterView />
  </div>
</template>
