/**
 * Atajos del sitio (docs/diseno.md §7) y los verbos que comparten con la cabecera y la paleta. Un solo
 * listener en `window`, que monta layouts/default.vue. Las teclas de una letra se apagan desde la paleta
 * (cookie `pf-keys`); Ctrl/⌘K y Esc sobre una capa abierta siguen andando siempre.
 */
import type { RouteLocationRaw } from 'vue-router'
import { prefersReducedMotion } from './useSound'

// El hook 'site:overlay' y su tipo SiteOverlay viven en useLenis.ts (una sola declaración).

export const KEYS_COOKIE = 'pf-keys'
export const CONTACT_ID = 'contacto'

const YEAR = 60 * 60 * 24 * 365
const plain = (value: string | null) => value ?? ''

/** Una capa que Esc cierra antes de salir del Hiperfoco: paleta, menú, popover. */
export interface EscapeLayer {
  isOpen: () => boolean
  close: () => void
}

const layers = new Set<EscapeLayer>()

/** Registra una capa mientras el componente está montado; Esc cierra la última abierta. */
export function useEscapeLayer(layer: EscapeLayer) {
  onMounted(() => layers.add(layer))
  onBeforeUnmount(() => layers.delete(layer))
}

function closeTopLayer(): boolean {
  const open = [...layers].filter(layer => layer.isOpen())
  open.at(-1)?.close()
  return open.length > 0
}

/** Atajos de una tecla: encendidos salvo que la cookie diga `off`. */
export function useShortcuts() {
  const cookie = useCookie<string | null>(KEYS_COOKIE, { maxAge: YEAR, sameSite: 'lax', path: '/', encode: plain, decode: plain })
  const on = useState<boolean>(KEYS_COOKIE, () => cookie.value !== 'off')

  function setShortcuts(next: boolean) {
    on.value = next
    cookie.value = next ? null : 'off'
  }

  return { shortcutsOn: readonly(on), setShortcuts }
}

/** Estado de la paleta «Ir a». `requested` monta el componente diferido la primera vez que se pide. */
export function usePalette() {
  const open = useState('site-palette-open', () => false)
  const requested = useState('site-palette-requested', () => false)

  function openPalette() {
    requested.value = true
    open.value = true
  }

  const closePalette = () => { open.value = false }
  const togglePalette = () => (open.value ? closePalette() : openPalette())

  return { open: readonly(open), requested: readonly(requested), openPalette, closePalette, togglePalette }
}

/** Hay una view transition en curso. Sin `:active-view-transition`, el selector no se entiende y no hay. */
function viewTransitionActive(): boolean {
  try {
    return document.documentElement.matches(':active-view-transition')
  }
  catch {
    return false
  }
}

const recordBlocked = () => import.meta.client && (document.documentElement.hasAttribute('data-intro') || viewTransitionActive())

/** Los verbos del sitio: los usan las teclas, la cabecera y la paleta, con su anuncio y su sonido. */
export function useSiteActions() {
  const router = useRouter()
  const route = useRoute()
  const { t, lang, setLang, localeRoute } = useLocale()
  const focus = useHyperfocus()
  const theme = useTheme()
  const record = useRecordView()
  const sound = useSound()
  const keys = useShortcuts()
  const { announce } = useAnnounce()

  const go = (to: RouteLocationRaw) => router.push(localeRoute(to))

  /** El contacto es el pie de cada página: se baja hasta él y recibe el foco. */
  async function goToContact() {
    if (route.hash === `#${CONTACT_ID}`) document.getElementById(CONTACT_ID)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    else await router.push({ path: route.path, query: route.query, hash: `#${CONTACT_ID}` })
    document.getElementById(CONTACT_ID)?.focus({ preventScroll: true })
  }

  /** Un nivel arriba: caso → obra, artículo → artículos, CV → sobre mí. */
  function parentRoute(): RouteLocationRaw | null {
    if (/^\/projects\/[^/]+\/?$/.test(route.path)) return '/projects'
    if (/^\/articles\/[^/]+\/?$/.test(route.path)) return '/articles'
    // Como Esc y «Volver»: se cierra la hoja y se conserva el resto de la query (vista, idioma).
    if (route.path === '/about' && route.query.cv !== undefined) {
      const { cv: _cv, ...query } = route.query
      return { path: '/about', query }
    }
    return null
  }

  /** El cambio en sí (view transition, cookie, lectura en su lugar) es de useHyperfocus. */
  function toggleHyperfocus() {
    const next = !focus.target()
    sound.tick(1400)
    void focus.setHyperfocus(next)
    announce(t(next ? 'focus.on' : 'focus.off'))
  }

  function toggleTheme() {
    theme.toggleTheme()
    announce(t(theme.theme.value === 'light' ? 'shell.theme.nowLight' : 'shell.theme.nowDark'))
  }

  function toggleSound() {
    sound.toggleSound()
    announce(t(sound.soundOn.value ? 'shell.sound.nowOn' : 'shell.sound.nowOff'))
  }

  function toggleShortcuts() {
    keys.setShortcuts(!keys.shortcutsOn.value)
    announce(t(keys.shortcutsOn.value ? 'shell.shortcuts.nowOn' : 'shell.shortcuts.nowOff'))
  }

  const toggleLang = () => setLang(lang.value === 'es' ? 'en' : 'es')

  /**
   * R se ignora mientras corre el morph (busy), durante la entrada del inicio (`data-intro`) y con una
   * view transition en curso (página, Hiperfoco, CV): el morph mediría una página a medio cambiar.
   */
  function toggleRecord() {
    if (record.busy.value || recordBlocked()) return
    sound.tick(2000)
    return record.toggleRecord()
  }

  return { go, goToContact, parentRoute, toggleHyperfocus, toggleTheme, toggleSound, toggleShortcuts, toggleLang, toggleRecord }
}

const EDITABLE = 'input, textarea, select, [role="combobox"], [contenteditable]:not([contenteditable="false"])'

function isEditable(target: EventTarget | null): boolean {
  return target instanceof Element && (target.closest(EDITABLE) !== null || (target as HTMLElement).isContentEditable)
}

/** Un diálogo que ya se está cerrando (`data-closing`, la paleta en su animación de salida) no cuenta. */
const dialogOpen = () => document.querySelector('dialog[open]:not([data-closing]), [role="dialog"][aria-modal="true"]:not(dialog)') !== null

/** j/k: foco a la siguiente o anterior fila o tarjeta visible de la página. Mover el foco no navega. */
function moveFocus(step: 1 | -1) {
  const items = [...document.querySelectorAll<HTMLElement>('#contenido :is([data-row], [data-card])')]
    .filter(el => el.getClientRects().length > 0)
  if (!items.length) return
  const active = document.activeElement
  const current = items.findIndex(el => el === active || el.contains(active))
  const index = current === -1 ? (step > 0 ? 0 : items.length - 1) : Math.min(items.length - 1, Math.max(0, current + step))
  const item = items[index]!
  const target = item.matches('a, button, [tabindex]') ? item : item.querySelector<HTMLElement>('a, button')
  target?.focus()
}

export function useHotkeys() {
  const actions = useSiteActions()
  const palette = usePalette()
  const keys = useShortcuts()
  const focus = useHyperfocus()

  const pages: Record<string, RouteLocationRaw> = {
    1: '/',
    2: '/projects',
    3: '/about',
    5: { path: '/about', query: { cv: 'ats' } },
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.defaultPrevented || e.isComposing) return
    const key = e.key

    if ((e.ctrlKey || e.metaKey) && !e.altKey && key.toLowerCase() === 'k') {
      e.preventDefault()
      palette.togglePalette()
      return
    }
    if (dialogOpen()) return
    if (key === 'Escape') {
      // Cerrar una capa abierta anda en cualquier contexto; salir del Hiperfoco no, con foco en un campo.
      if (closeTopLayer()) e.preventDefault()
      else if (keys.shortcutsOn.value && focus.target() && !isEditable(e.target)) actions.toggleHyperfocus()
      return
    }
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || !keys.shortcutsOn.value || isEditable(e.target)) return

    const handled = run(key)
    if (handled) e.preventDefault()
  }

  /** Teclas que siempre hacen algo (sin importar la letra en mayúscula). */
  const verbs: Record<string, () => unknown> = {
    4: actions.goToContact,
    j: () => moveFocus(1),
    k: () => moveFocus(-1),
    r: actions.toggleRecord,
    h: actions.toggleHyperfocus,
    '/': palette.openPalette,
  }

  /** La acción de cada tecla; devuelve false si la tecla no es un atajo o no aplica acá. */
  function run(key: string): boolean {
    const page = pages[key]
    const verb = verbs[key.length === 1 ? key.toLowerCase() : key]
    if (page) void actions.go(page)
    else if (verb) verb()
    else if (key === 'Backspace') {
      const parent = actions.parentRoute()
      if (!parent) return false
      void actions.go(parent)
    }
    else if (key === 'Enter') {
      // Una fila o tarjeta que no es enlace abre el enlace que contiene; un enlace ya abre solo.
      const active = document.activeElement
      if (!active?.matches('[data-row], [data-card]') || active.matches('a, button')) return false
      active.querySelector<HTMLElement>('a')?.click()
    }
    else return false
    return true
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}
