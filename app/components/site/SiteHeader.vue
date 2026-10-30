<script setup lang="ts">
// Cabecera del prototipo: el nombre a la izquierda; Obra, Sobre mí y Contacto, siempre visibles y
// renderizados por el SSR; y las utilidades. En los dos temas se mezcla por diferencia como el prototipo:
// blanco sobre el fondo se lee como --ink y sobre una captura oscura se invierte, así la cabecera fija se lee
// encima de portadas y galerías. axe no aplica la mezcla al texto: su regla color-contrast se excluye para
// header[data-chrome] y el contraste se mide con scripts/check-contrast.mjs. Con el menú angosto abierto
// vuelve a la mezcla normal para que el panel se lea. Contacto es el pie. El DOM sigue el orden visual
// (nombre, navegación, utilidades) para que Tab recorra lo que se ve; en angosto la grilla los acomoda.
import { CONTACT_ID } from '~/composables/useHotkeys'

const route = useRoute()
const router = useRouter()
const { t, localeRoute, langAttr } = useLocale()
const { goToContact } = useSiteActions()
const about = useDoc('about')

const brand = computed(() => docText(about.data.value, 'display_name'))
const home = computed(() => localeRoute('/'))
const contactHref = computed(() => router.resolve({ path: route.path, query: route.query, hash: `#${CONTACT_ID}` }).href)

const links = computed(() => [
  { path: '/projects', label: t('nav.work') },
  { path: '/about', label: t('nav.about') },
].map(link => ({
  ...link,
  to: localeRoute(link.path),
  // La página misma es «page»; un caso dentro de Obra es «true» (la sección actual).
  current: route.path === link.path ? 'page' as const : route.path.startsWith(`${link.path}/`) ? 'true' as const : undefined,
})))

/** Un click común baja al pie y le da el foco; con modificadores el enlace hace lo suyo. */
function onContact(e: MouseEvent) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  void goToContact()
}
</script>

<template>
  <header
    data-chrome
    class="fixed inset-x-0 top-0 z-40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 px-pad py-[calc(var(--pad)*0.6)] text-s text-white mix-blend-difference has-[details[open]]:text-ink has-[details[open]]:mix-blend-normal md:flex md:justify-between"
  >
    <NuxtLink
      :to="home"
      :aria-current="route.path === '/' ? 'page' : undefined"
      :lang="langAttr(about.data.value, 'display_name')"
      class="w-fit font-display"
    >
      {{ brand ?? t('nav.home') }}
    </NuxtLink>

    <nav :aria-label="t('nav.label')" class="col-span-2 row-start-2 md:ms-auto">
      <ul class="flex gap-[clamp(1rem,2.4vw,2rem)]">
        <li v-for="link in links" :key="link.path">
          <NuxtLink
            :to="link.to"
            data-travel="nav"
            :aria-current="link.current"
            class="inline-flex min-h-6 items-center opacity-72 transition-opacity duration-300 hover:opacity-100 aria-[current]:opacity-100"
          >
            <RollText :text="link.label" travel />
          </NuxtLink>
        </li>
        <li>
          <a
            :href="contactHref"
            class="inline-flex min-h-6 items-center opacity-72 transition-opacity duration-300 hover:opacity-100"
            v-on:click="onContact"
          >
            <RollText :text="t('nav.contact')" />
          </a>
        </li>
      </ul>
    </nav>

    <SiteUtilities class="col-start-2 row-start-1" />
  </header>
</template>
