<script setup lang="ts">
/**
 * Las pestañas Sobre mí y Contacto. Cada documento es su dirección (#/perfil/sobre-mi, la ruta es el
 * estado), así que son enlaces con aria-current y no pestañas de panel; el subrayado en --sig viaja
 * 300 ms entre ellos, solo con transform. Si hay cambios sin guardar, la guarda del editor pregunta.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { DOC_ROUTES, profile, type DocRoute } from './dict'

const props = defineProps<{ current: DocRoute }>()

const links = computed(() => (Object.keys(DOC_ROUTES) as DocRoute[]).map(route => ({
  route,
  label: profile.docs[DOC_ROUTES[route]].title,
  to: `/perfil/${route}`,
})))

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
watch(() => props.current, () => void nextTick(place))

const underlineStyle = computed(() => ({
  transform: `translateX(${underline.value.x}px) scaleX(${underline.value.w / 100})`,
  opacity: underline.value.w ? 1 : 0,
}))
</script>

<template>
  <nav
    ref="bar"
    :aria-label="profile.tabs"
    class="relative flex max-w-[1080px] gap-7 overflow-x-auto border-b border-rule [scrollbar-width:none]"
  >
    <RouterLink
      v-for="link in links"
      :key="link.route"
      :to="link.to"
      :aria-current="link.route === current ? 'page' : undefined"
      class="shrink-0 pt-2 pb-3 text-row font-[420] whitespace-nowrap no-underline transition-colors duration-120 ease-e hover:text-ink focus-visible:-outline-offset-2"
      :class="link.route === current ? 'text-ink' : 'text-faint'"
    >
      {{ link.label }}
    </RouterLink>
    <span
      class="pointer-events-none absolute bottom-0 left-0 h-0.5 w-[100px] origin-left bg-sig"
      :class="underline.ready ? 'transition-transform duration-300 ease-e' : ''"
      :style="underlineStyle"
      aria-hidden="true"
    />
  </nav>
</template>
