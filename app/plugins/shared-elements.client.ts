/**
 * Elementos compartidos de las view transitions (docs/diseno.md §4, «Nombres únicos»). Lo que tocás
 * se transforma en la página: el título de una fila, una tarjeta o «Siguiente» viaja como `title`, su
 * portada como `cover` y la palabra del menú como `page-title`. Los nombres de destino son estáticos
 * (`[data-vt]` en motion.css); los de origen se ponen acá, en línea y solo para el par tocado:
 *
 * 1. Un click en captura (antes de que NuxtLink navegue) recuerda el `a[data-travel]` tocado.
 * 2. En `router.beforeEach`, con la página saliente todavía en pantalla: todo `[data-vt]` pasa a
 *    `view-transition-name: none` y recién después se nombra el par del enlace, si está en el viewport.
 *    Así nunca hay dos elementos con el mismo nombre y el navegador no saltea la transición.
 * 3. En `router.afterEach` (la foto vieja ya se tomó) se limpian todos los nombres puestos en línea:
 *    lo que vive fuera de la página (menú, vista previa) no puede llegar con nombre al estado nuevo.
 *
 * Vista previa del inicio (P1): la caja visible es `[data-preview]` y cada imagen de la tira lleva
 * `data-preview-cover="<ruta de la obra>"`; si la fila tocada no trae `[data-travel-cover]`, viaja la
 * imagen de la vista previa abierta que corresponde a esa ruta.
 */
import type { RouteLocationNormalized } from 'vue-router'
import type { VtName } from '~/composables/useMotion'

type Travel = 'row' | 'card' | 'next' | 'nav'

/** Qué nombre toma el título de cada origen. */
const TITLE_NAME: Record<Travel, VtName> = { row: 'title', card: 'title', next: 'title', nav: 'page-title' }

/** Un click viejo no nombra una navegación que llegó por otro lado (teclas, paleta, atrás). */
const CLICK_WINDOW_MS = 1500

const isTravel = (value: string | undefined): value is Travel => !!value && value in TITLE_NAME

function inViewport(el: Element): boolean {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth
}

/** Lo que recorta, no el texto: un `.roll` del menú trae su copia de abajo si se fotografía el span. */
function clipOf(title: HTMLElement, link: HTMLElement): HTMLElement {
  const inner = title.matches('.roll') ? title : title.querySelector<HTMLElement>('.roll')
  if (inner) return inner
  const outer = title.closest<HTMLElement>('.roll')
  return outer && link.contains(outer) ? outer : title
}

/** La imagen de la vista previa abierta para `path`, si está a la vista dentro de su caja. */
function previewCover(path: string): HTMLElement | null {
  const box = document.querySelector<HTMLElement>('[data-preview]')
  if (!box?.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return null
  const shot = [...box.querySelectorAll<HTMLElement>('[data-preview-cover]')].find(el => el.dataset.previewCover === path)
  if (!shot) return null
  const a = box.getBoundingClientRect()
  const b = shot.getBoundingClientRect()
  const visible = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
  return b.height > 0 && visible / b.height > 0.5 ? shot : null
}

const pathOf = (href: string) => new URL(href, window.location.href).pathname.replace(/(.)\/$/, '$1')

export default defineNuxtPlugin({
  name: 'shared-elements',
  setup() {
    if (!('startViewTransition' in document)) return

    const router = useRouter()
    const named = new Set<HTMLElement>()
    let touched: { link: HTMLAnchorElement, at: number } | null = null

    function setName(el: HTMLElement, name: VtName | 'none') {
      el.style.viewTransitionName = name
      named.add(el)
    }

    function clear() {
      named.forEach(el => el.style.removeProperty('view-transition-name'))
      named.clear()
    }

    /** El enlace tocado, solo si lleva a `to` y el click fue recién. */
    function takeTouched(to: RouteLocationNormalized): HTMLAnchorElement | null {
      const hit = touched
      touched = null
      if (!hit || performance.now() - hit.at > CLICK_WINDOW_MS || !hit.link.isConnected) return null
      return pathOf(hit.link.href) === to.path.replace(/(.)\/$/, '$1') ? hit.link : null
    }

    function namePair(link: HTMLAnchorElement, travel: Travel, to: RouteLocationNormalized) {
      // «Contacto» del menú baja a un ancla: no hay título de página que lo reciba.
      if (travel === 'nav' && to.hash) return
      const title = link.querySelector<HTMLElement>('[data-travel-title]') ?? (travel === 'nav' ? link : null)
      if (title) {
        const target = clipOf(title, link)
        if (inViewport(target)) setName(target, TITLE_NAME[travel])
      }
      if (travel === 'nav') return
      const cover = link.querySelector<HTMLElement>('[data-travel-cover]') ?? (travel === 'row' ? previewCover(to.path) : null)
      if (cover && inViewport(cover)) setName(cover, 'cover')
    }

    document.addEventListener('click', (e) => {
      const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[data-travel]') : null
      // Con modificadores el enlace abre otra pestaña: esta página no cambia.
      const plain = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
      touched = link && plain ? { link, at: performance.now() } : null
    }, true)

    router.beforeEach((to, from) => {
      const link = takeTouched(to)
      if (to.path === from.path) return
      clear()
      document.querySelectorAll<HTMLElement>('[data-vt]').forEach(el => setName(el, 'none'))
      const travel = link?.dataset.travel
      if (link && isTravel(travel)) namePair(link, travel, to)
    })

    router.afterEach(clear)
    router.onError(clear)
  },
})
