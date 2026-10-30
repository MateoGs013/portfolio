<script setup lang="ts">
// Paleta «Ir a» (Ctrl/⌘K o /): un <dialog> modal con un combobox que filtra un listbox por
// aria-activedescendant. El foco queda en el campo (Tab no sale) y vuelve al disparador al cerrar. Un solo
// resaltado viaja entre opciones (300 ms power3.out; la primera vez aparece sin viajar), con tinta al
// 3,5 %: más fuerte, el --sig-text del ítem activo baja de AA. Se monta la primera vez que se pide
// (layouts/default.vue) y avisa con 'site:overlay' para que Lenis se detenga.
import { gsap } from 'gsap'
import type { RouteLocationRaw } from 'vue-router'
import type { Lang } from '~/lib/dict'
import { prefersReducedMotion } from '~/composables/useSound'

type Group = 'pages' | 'works' | 'actions'

interface Entry {
  id: string
  group: Group
  label: string
  hint?: string
  kbd?: string
  lang?: Lang
  to?: RouteLocationRaw
  run?: () => unknown
}

const nuxtApp = useNuxtApp()
const { t, lang } = useLocale()
const palette = usePalette()
const actions = useSiteActions()
const projects = useProjects()
const { isHyperfocus } = useHyperfocus()
const { theme } = useTheme()
const { soundOn, tick } = useSound()
const { shortcutsOn } = useShortcuts()

const dialog = ref<HTMLDialogElement>()
const input = ref<HTMLInputElement>()
const scroller = ref<HTMLElement>()
const highlight = ref<HTMLElement>()
const query = ref('')
const active = ref(0)

let returnTo: HTMLElement | null = null
let pending: Entry | null = null
let shown = false
let instantNext = true

const other = computed<Lang>(() => (lang.value === 'es' ? 'en' : 'es'))
const groupLabel = (group: Group) => t(group === 'pages' ? 'shell.palette.pages' : group === 'works' ? 'nav.work' : 'shell.palette.actions')

const entries = computed<Entry[]>(() => {
  const works = projects.data.value ?? []
  return [
    { id: 'home', group: 'pages', label: t('nav.home'), to: '/' },
    { id: 'work', group: 'pages', label: t('nav.work'), to: '/projects', hint: works.length ? t('shell.palette.count', { n: works.length }) : undefined },
    { id: 'about', group: 'pages', label: t('nav.about'), to: '/about' },
    { id: 'contact', group: 'pages', label: t('nav.contact'), run: actions.goToContact },
    { id: 'cv', group: 'pages', label: t('nav.cv'), to: { path: '/about', query: { cv: 'ats' } } },
    { id: 'articles', group: 'pages', label: t('nav.articles'), to: '/articles' },
    ...works.map((p): Entry => ({ id: `work-${p.slug}`, group: 'works', label: p.title, hint: String(p.year), to: `/projects/${p.slug}` })),
    { id: 'focus', group: 'actions', label: t(isHyperfocus.value ? 'shell.focus.leave' : 'shell.focus.enter'), kbd: shortcutsOn.value ? 'H' : undefined, run: actions.toggleHyperfocus },
    { id: 'theme', group: 'actions', label: t(theme.value === 'dark' ? 'shell.theme.toLight' : 'shell.theme.toDark'), run: actions.toggleTheme },
    { id: 'lang', group: 'actions', label: t(`shell.autonym.${other.value}`), lang: other.value, hint: t('shell.lang'), run: actions.toggleLang },
    { id: 'sound', group: 'actions', label: t(soundOn.value ? 'shell.sound.turnOff' : 'shell.sound.turnOn'), hint: soundOn.value ? undefined : t('shell.sound.hint'), run: actions.toggleSound },
    { id: 'keys', group: 'actions', label: t('shell.shortcuts', { state: t(shortcutsOn.value ? 'shell.yes' : 'shell.no') }), run: actions.toggleShortcuts },
  ]
})

/** Sin tildes ni mayúsculas: «sobre mi» encuentra «Sobre mí». */
const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

const results = computed(() => {
  const q = fold(query.value.trim())
  if (!q) return entries.value
  return entries.value.filter(e => fold(`${e.label} ${groupLabel(e.group)} ${e.hint ?? ''}`).includes(q))
})

const groups = computed(() => (['pages', 'works', 'actions'] as const)
  .map(group => ({ group, label: groupLabel(group), items: results.value.flatMap((entry, index) => (entry.group === group ? [{ entry, index }] : [])) }))
  .filter(g => g.items.length > 0))

const optionId = (entry: Entry) => `site-palette-${entry.id}`
const activeId = computed(() => (results.value[active.value] ? optionId(results.value[active.value]!) : undefined))

/** Lleva el resaltado a la opción activa: viaja salvo la primera vez, al filtrar o con reduced motion. */
function placeHighlight(instant: boolean) {
  const box = highlight.value
  const el = activeId.value ? document.getElementById(activeId.value) : null
  if (!box) return
  if (!el) {
    gsap.set(box, { opacity: 0 })
    shown = false
    return
  }
  el.scrollIntoView({ block: 'nearest' })
  const to = { x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight, opacity: 1 }
  if (instant || !shown || prefersReducedMotion()) {
    gsap.killTweensOf(box)
    gsap.set(box, to)
  }
  else {
    gsap.to(box, { ...to, duration: isHyperfocus.value ? 0.22 : 0.3, ease: 'power3.out', overwrite: true })
  }
  shown = true
}

watch(results, () => {
  active.value = 0
  instantNext = true
})
watch([active, results], () => {
  placeHighlight(instantNext)
  instantNext = false
}, { flush: 'post' })

let closing = false

async function show() {
  const box = dialog.value
  if (!box) return
  // Ctrl+K durante la animación de cierre: se corta y la caja vuelve sin cerrarse.
  if (box.open && closing) {
    closing = false
    pending = null
    gsap.killTweensOf(box)
    gsap.set(box, { clearProps: 'opacity,transform' })
    input.value?.focus()
    return
  }
  if (box.open) return
  returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : null
  query.value = ''
  active.value = 0
  shown = false
  void nuxtApp.callHook('site:overlay', { open: true })
  box.showModal()
  input.value?.focus()
  await nextTick()
  placeHighlight(true)
  if (!prefersReducedMotion()) gsap.fromTo(box, { opacity: 0, y: -10, scale: 0.975 }, { opacity: 1, y: 0, scale: 1, duration: isHyperfocus.value ? 0.2 : 0.32, ease: 'expo.out' })
}

/** Solo anima y cierra: la limpieza vive en el evento close, que también cubre los cierres nativos. */
function hide() {
  const box = dialog.value
  if (!box?.open || closing) return
  if (prefersReducedMotion()) return box.close()
  closing = true
  gsap.to(box, { opacity: 0, y: -6, scale: 0.985, duration: isHyperfocus.value ? 0.12 : 0.16, ease: 'power2.in', overwrite: true, onComplete: () => box.close() })
}

function onClose() {
  const box = dialog.value
  closing = false
  if (box) {
    gsap.killTweensOf(box)
    gsap.set(box, { clearProps: 'opacity,transform' })
  }
  if (palette.open.value) palette.closePalette()
  void nuxtApp.callHook('site:overlay', { open: false })
  const entry = pending
  pending = null
  // Una acción devuelve el foco al disparador; una navegación lo deja a la página nueva.
  if (!entry?.to && entry?.id !== 'contact') returnTo?.focus()
  returnTo = null
  if (entry?.to) void actions.go(entry.to)
  else void entry?.run?.()
}

watch(palette.open, isOpen => (isOpen ? show() : hide()))
onMounted(() => {
  if (palette.open.value) void show()
})
onBeforeUnmount(() => {
  if (dialog.value?.open) void nuxtApp.callHook('site:overlay', { open: false })
})

function choose(entry: Entry | undefined) {
  if (!entry) return
  pending = entry
  palette.closePalette()
}

function move(step: 1 | -1) {
  const n = results.value.length
  if (!n) return
  active.value = (active.value + step + n) % n
  tick(2600)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') move(e.key === 'ArrowDown' ? 1 : -1)
  else if (e.key === 'Enter') choose(results.value[active.value])
  else if (e.key === 'Escape') palette.closePalette()
  // Trampa de foco: el campo es lo único enfocable; las opciones se recorren con las flechas.
  else if (e.key !== 'Tab') return
  e.preventDefault()
}

/** Un click en el fondo (fuera de la caja) cierra; adentro, el destino es un hijo del diálogo. */
function onDialogClick(e: MouseEvent) {
  if (e.target === dialog.value) palette.closePalette()
}
</script>

<template>
  <dialog
    ref="dialog"
    :aria-label="t('shell.goto')"
    aria-modal="true"
    class="inset-x-0 mx-auto mt-[13vh] mb-auto w-[min(36rem,calc(100vw-2rem))] max-w-none overflow-hidden rounded-[10px] border border-rule bg-surface p-0 text-ink shadow-[0_30px_90px_rgb(0_0_0/0.45)] backdrop:bg-bg/55 backdrop:backdrop-blur-[5px]"
    v-on:cancel.prevent="palette.closePalette()"
    v-on:click="onDialogClick"
    v-on:close="onClose"
  >
    <div class="flex flex-col">
      <input
        ref="input"
        v-model="query"
        type="text"
        role="combobox"
        :aria-expanded="results.length > 0 ? 'true' : 'false'"
        aria-controls="site-palette-list"
        aria-autocomplete="list"
        :aria-activedescendant="activeId"
        :aria-label="t('shell.palette.search')"
        :placeholder="t('shell.palette.search')"
        autocomplete="off"
        spellcheck="false"
        class="w-full border-b border-rule bg-transparent px-[1.1rem] py-4 text-m text-ink outline-none placeholder:text-faint"
        v-on:keydown="onKeydown"
      >
      <!-- El listbox es el que se desplaza: el resaltado vive adentro y se mueve con las opciones. -->
      <div
        id="site-palette-list"
        ref="scroller"
        role="listbox"
        data-lenis-prevent
        :aria-label="t('shell.palette.results')"
        class="relative max-h-[min(23rem,52vh)] overflow-auto overscroll-contain p-[0.35rem]"
        :class="{ hidden: !results.length }"
      >
        <span ref="highlight" aria-hidden="true" class="pointer-events-none absolute top-0 left-0 size-0 rounded-md bg-ink/[0.035] opacity-0 ring-1 ring-rule ring-inset" />
        <div v-for="g in groups" :key="g.group" role="group" :aria-labelledby="`site-palette-g-${g.group}`">
          <div :id="`site-palette-g-${g.group}`" class="px-[0.7rem] pt-[0.65rem] pb-[0.3rem] text-xs text-faint">
            {{ g.label }}
          </div>
          <div
            v-for="{ entry, index } in g.items"
            :id="optionId(entry)"
            :key="entry.id"
            role="option"
            :aria-selected="index === active ? 'true' : 'false'"
            class="relative z-[1] flex cursor-pointer items-baseline justify-between gap-4 rounded-md px-[0.7rem] py-[0.55rem] text-dim aria-selected:text-sig-text"
            v-on:pointermove="active = index"
            v-on:click="choose(entry)"
          >
            <span :lang="entry.lang">{{ entry.label }}</span>
            <kbd v-if="entry.kbd" class="rounded-[4px] border border-rule px-[0.32rem] py-[0.18rem] font-mono text-xs leading-none text-faint">{{ entry.kbd }}</kbd>
            <small v-else-if="entry.hint" class="text-xs whitespace-nowrap text-faint">{{ entry.hint }}</small>
          </div>
        </div>
      </div>
      <p v-if="!results.length" class="px-[1.05rem] py-5 text-m text-faint">
        {{ t('shell.palette.empty') }}
      </p>
      <p aria-hidden="true" class="flex flex-wrap gap-x-[1.1rem] gap-y-1 border-t border-rule px-4 py-[0.6rem] text-xs text-faint">
        <span><kbd class="font-mono">↑</kbd> <kbd class="font-mono">↓</kbd> {{ t('shell.palette.move') }}</span>
        <span><kbd class="font-mono">Enter</kbd> {{ t('shell.palette.open') }}</span>
        <span><kbd class="font-mono">Esc</kbd> {{ t('shell.palette.close') }}</span>
      </p>
    </div>
  </dialog>
</template>
