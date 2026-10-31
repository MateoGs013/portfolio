<script setup lang="ts">
// Utilidades de la cabecera: idioma, tema, Hiperfoco e «Ir a». Un solo <details>, que funciona sin JS:
// debajo de 768 px es un menú; desde 768 px su contenido se ve siempre y el resumen se oculta (con
// ::details-content; un navegador sin él conserva el menú, que sigue andando).
const route = useRoute()
const { t } = useLocale()
const { openPalette } = usePalette()

const menu = ref<HTMLDetailsElement>()
const summary = ref<HTMLElement>()
const open = ref(false)
const shortcut = ref('Ctrl K')

function close(refocus = true) {
  if (!menu.value?.open) return
  const hadFocus = menu.value.contains(document.activeElement)
  menu.value.open = false
  if (refocus && hadFocus) summary.value?.focus()
}

useEscapeLayer({ isOpen: () => !!menu.value?.open && getComputedStyle(summary.value!).display !== 'none', close })

/** En el menú angosto, el foco vuelve al resumen antes de abrir: la paleta lo devuelve ahí al cerrarse. */
function goto() {
  close()
  openPalette()
}

function onPointerDown(e: PointerEvent) {
  if (menu.value && !menu.value.contains(e.target as Node)) close(false)
}

watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onPointerDown)
  else document.removeEventListener('pointerdown', onPointerDown)
})
// Cambiar de idioma desde el menú cierra el panel: si el foco estaba adentro, vuelve al resumen.
watch(() => route.fullPath, () => close(true))

onMounted(() => {
  if (/Mac|iPhone|iPad/.test(navigator.platform)) shortcut.value = '⌘K'
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))
</script>

<template>
  <details
    ref="menu"
    class="relative supports-[selector(::details-content)]:md:[&::details-content]:[content-visibility:visible]"
    v-on:toggle="open = !!menu?.open"
  >
    <summary
      ref="summary"
      :aria-label="t('shell.prefs')"
      class="-m-1.5 inline-flex size-11 cursor-pointer list-none items-center justify-center rounded-sm [&::-webkit-details-marker]:hidden supports-[selector(::details-content)]:md:hidden"
    >
      <AppIcon :name="open ? 'close' : 'menu'" :size="18" />
    </summary>
    <div
      class="absolute end-0 top-full mt-3 flex w-max flex-col items-start gap-5 whitespace-nowrap border border-rule bg-bg p-5 text-ink md:static md:mt-0 md:w-auto md:flex-row md:items-center md:gap-[clamp(1rem,2.4vw,2rem)] md:border-0 md:bg-transparent md:p-0 md:text-inherit"
    >
      <LangSwitch />
      <ThemeToggle />
      <HyperfocusToggle />
      <button
        type="button"
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K /"
        class="hit inline-flex min-h-6 cursor-pointer items-center gap-2.5 opacity-72 transition-opacity duration-300 [word-spacing:0.14em] hover:opacity-100"
        v-on:click="goto"
      >
        <!-- «Ir a» es corto: con el espacio de la fuente a este tamaño se leía «Ira». -->
        <RollText :text="t('shell.goto')" />
        <kbd aria-hidden="true" class="hidden font-mono text-xs leading-none [word-spacing:normal] md:inline">{{ shortcut }}</kbd>
      </button>
    </div>
  </details>
</template>

