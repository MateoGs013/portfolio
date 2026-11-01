<script setup lang="ts">
/**
 * La navegación de secciones (NAV, shell/nav.ts): enlaces de 32 px en --dim, el actual en --ink con
 * aria-current y un indicador que viaja 300 ms detrás (solo transform). Catálogos queda plegado y se
 * abre solo si se está adentro. El contador aparece solo con pendientes.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useId } from '../composables/useId'
import Icon from '../ui/Icon.vue'
import { shell } from './dict'
import { isGroup, NAV, navPending, type NavLink } from './nav'

defineEmits<{ navigate: [] }>()

const route = useRoute()
const current = computed(() => route.meta.nav ?? null)
const groupId = useId('nav-group')

const CATALOGS_PREF = 'adm-nav-catalogos'
function readOpen(): boolean {
  try {
    return localStorage.getItem(CATALOGS_PREF) === 'open'
  }
  catch {
    return false
  }
}
const catalogsOpen = ref(readOpen())
const insideCatalogs = computed(() => NAV.some(entry => isGroup(entry) && entry.items.some(item => item.id === current.value)))
const showCatalogs = computed(() => catalogsOpen.value || insideCatalogs.value)

function toggleCatalogs(): void {
  // Adentro de un catálogo el grupo queda abierto: plegarlo escondería dónde se está.
  if (insideCatalogs.value) return
  catalogsOpen.value = !showCatalogs.value
  try {
    localStorage.setItem(CATALOGS_PREF, catalogsOpen.value ? 'open' : 'closed')
  }
  catch {
    // Se recuerda solo mientras dure la pestaña.
  }
}

/* ── Indicador ─────────────────────────────────────────── */

const root = ref<HTMLElement | null>(null)
const indicator = ref({ y: 0, h: 0, ready: false })

function place(): void {
  const el = root.value?.querySelector<HTMLElement>('[aria-current="page"]')
  if (!el || !root.value) {
    indicator.value = { ...indicator.value, h: 0 }
    return
  }
  const y = el.getBoundingClientRect().top - root.value.getBoundingClientRect().top
  // La primera vez se ubica sin viajar.
  indicator.value = { y, h: el.offsetHeight, ready: indicator.value.h > 0 }
}

let observer: ResizeObserver | null = null
onMounted(() => {
  place()
  observer = new ResizeObserver(place)
  if (root.value) observer.observe(root.value)
  void document.fonts?.ready.then(place)
})
onBeforeUnmount(() => observer?.disconnect())
watch([current, showCatalogs, navPending], () => void nextTick(place))

const indicatorStyle = computed(() => ({ transform: `translateY(${indicator.value.y}px)`, height: `${indicator.value.h}px`, opacity: indicator.value.h ? 1 : 0 }))

const linkClass = (link: NavLink) => [
  'relative z-1 flex h-8 items-center gap-2.5 rounded-control px-2.5 text-body no-underline transition-colors duration-120 ease-e hover:bg-surface hover:text-ink focus-visible:-outline-offset-2',
  link.id === current.value ? 'text-ink hover:bg-transparent' : 'text-dim',
]
</script>

<template>
  <nav ref="root" :aria-label="shell.nav.label" class="relative">
    <span
      class="pointer-events-none absolute inset-x-0 top-0 z-0 rounded-control bg-surface-2 shadow-[inset_2px_0_0_var(--sig)]"
      :class="indicator.ready ? 'transition-[transform,opacity] duration-300 ease-e' : ''"
      :style="indicatorStyle"
      aria-hidden="true"
    />
    <ul class="m-0 grid list-none gap-px p-0">
      <template v-for="entry in NAV" :key="isGroup(entry) ? entry.group : entry.id">
        <li v-if="isGroup(entry)" class="mt-4.5 mb-1">
          <button
            type="button"
            class="flex h-7 w-full items-center gap-1.5 rounded-control border-0 bg-transparent px-2.5 text-meta text-faint transition-colors duration-120 ease-e hover:text-dim"
            :aria-expanded="showCatalogs"
            :aria-disabled="insideCatalogs || undefined"
            :aria-controls="groupId"
            @click="toggleCatalogs"
          >
            {{ entry.label }}
            <Icon name="chevron-down" :size="14" class="transition-transform duration-200 ease-e" :class="showCatalogs ? '' : '-rotate-90'" />
          </button>
          <ul v-show="showCatalogs" :id="groupId" class="m-0 grid list-none gap-px p-0">
            <li v-for="item in entry.items" :key="item.id">
              <RouterLink :to="item.to" :class="linkClass(item)" :aria-current="item.id === current ? 'page' : undefined" @click="$emit('navigate')">
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>
        </li>
        <li v-else :class="entry.id === 'busqueda' ? 'mt-4.5' : ''">
          <RouterLink :to="entry.to" :class="linkClass(entry)" :aria-current="entry.id === current ? 'page' : undefined" @click="$emit('navigate')">
            {{ entry.label }}
            <span v-if="navPending[entry.id]" class="ml-auto text-meta text-faint tabular-nums">
              <span aria-hidden="true">{{ navPending[entry.id] }}</span>
              <span class="sr-only">{{ shell.nav.pending(navPending[entry.id]!) }}</span>
            </span>
          </RouterLink>
        </li>
      </template>
    </ul>
  </nav>
</template>
