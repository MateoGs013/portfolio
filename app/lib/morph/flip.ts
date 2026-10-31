/**
 * Medir y emparejar para «ver como registro» (tecla R, docs/diseno.md §2.1; `morph()` de demo.html).
 *
 * Vue no conserva los nodos entre las dos lecturas (un campo sin `shared` cambia su slot por
 * RecordValue), así que el viaje no empareja elementos sino claves: la cadena de `[data-f]` del valor
 * (`techs`, `la-rucula/title`) y su orden dentro del campo. `captureBefore` mide con la página todavía
 * en su estado viejo; `classify`, ya cambiada y anclada, decide qué viaja, qué se va, qué llega y qué
 * solo se corre. Todo se mide en el viewport (±½ pantalla): lo que no se ve no se anima.
 */

/** Los nodos que viajan: valores de una línea o de un bloque y miniaturas. */
export const TRAVELER = '.fv:not(.fv-list), .flip'
/** Las filas del registro: llevan su línea en `--rs` y nunca viajan ni se van enteras. */
export const ROW = '.f, thead > tr'

/** Propiedades que un fantasma copia en línea: las heredadas y las que dependen del contexto. */
const GHOST_PROPS = [
  'color', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariationSettings', 'fontFeatureSettings',
  'fontVariantNumeric', 'letterSpacing', 'wordSpacing', 'lineHeight', 'textAlign', 'textTransform', 'whiteSpace',
  'overflowWrap', 'opacity',
] as const

type GhostProp = (typeof GHOST_PROPS)[number]

export interface Snap {
  /** Caja visible en el viewport (con transformaciones). */
  rect: DOMRect
  /** Caja de layout, sin transformaciones. */
  width: number
  height: number
  fontSize: number
  lineHeight: number
  lines: number
  display: string
  style: Record<GhostProp, string>
  /** Bordes visibles (color), para las líneas que se recogen. */
  borderTop: string | null
  borderBottom: string | null
  /** Color del subrayado, si lo tiene: un enlace que llega escalado no lo muestra hasta posarse. */
  underline: string | null
  text: string
}

export interface Traveler {
  el: HTMLElement
  snap: Snap
  /** Copia del aspecto viejo, por si el valor tiene que disolverse (fantasma). */
  clone: HTMLElement
}

export interface Before {
  on: boolean
  travelers: Map<string, Traveler>
  /** Cajas medidas (solo con animación): los candidatos a irse o a correrse. */
  boxes: Map<Element, Snap>
  /** Todo lo que tenía caja antes, en cualquier parte de la página. */
  seen: WeakSet<Element>
  /** Líneas del registro que se recogen al volver al diseño. */
  rows: DOMRect[]
}

const hasBox = (el: Element) => el.getClientRects().length > 0
const band = () => window.innerHeight * 0.5
export const inBand = (r: DOMRect) => (r.width > 0 || r.height > 0) && r.bottom > -band() && r.top < window.innerHeight + band()
const visibleBorder = (width: string, style: string, color: string) =>
  parseFloat(width) > 0 && style !== 'none' && style !== 'hidden' && !/rgba\(.*,\s*0\)$|transparent/.test(color) ? color : null

export function snap(el: Element, rect = el.getBoundingClientRect()): Snap {
  const cs = getComputedStyle(el)
  const fontSize = parseFloat(cs.fontSize) || 16
  const lineHeight = parseFloat(cs.lineHeight) || fontSize * 1.2
  const html = el instanceof HTMLElement ? el : null
  const width = html?.offsetWidth || rect.width
  const height = html?.offsetHeight || rect.height
  // Alto del contenido, sin relleno: un dd con pb-7 sigue siendo una línea.
  const content = html?.clientHeight ? html.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) : rect.height
  const style = Object.fromEntries(GHOST_PROPS.map(p => [p, cs[p]])) as Record<GhostProp, string>
  return {
    rect, width, height, fontSize, lineHeight, style,
    lines: Math.max(1, Math.round(content / lineHeight)),
    display: cs.display,
    borderTop: visibleBorder(cs.borderTopWidth, cs.borderTopStyle, cs.borderTopColor),
    borderBottom: visibleBorder(cs.borderBottomWidth, cs.borderBottomStyle, cs.borderBottomColor),
    underline: cs.textDecorationLine.includes('underline') ? cs.textDecorationColor : null,
    text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
  }
}

/** La cadena de campos de un nodo (`la-rucula/title`), del más externo al propio. */
function fieldPath(el: Element, root: Element): string | null {
  const path: string[] = []
  for (let n: Element | null = el.closest('[data-f]'); n && root.contains(n); n = n.parentElement?.closest('[data-f]') ?? null) {
    path.unshift((n as HTMLElement).dataset.f!)
  }
  return path.length ? path.join('/') : null
}

/** Cada nodo que viaja con su clave: el campo y su orden dentro del campo, en orden de documento. */
export function travelerKeys(root: HTMLElement): Map<string, HTMLElement> {
  const counts = new Map<string, number>()
  const keys = new Map<string, HTMLElement>()
  root.querySelectorAll<HTMLElement>(TRAVELER).forEach((el) => {
    if (el.parentElement?.closest(TRAVELER)) return
    const path = fieldPath(el, root)
    if (!path) return
    const n = counts.get(path) ?? 0
    counts.set(path, n + 1)
    keys.set(`${path}#${n}`, el)
  })
  return keys
}

/** El estado de partida. Sin animación (`full` false) solo hacen falta los valores, para anclar. */
export function captureBefore(root: HTMLElement, on: boolean, full: boolean): Before {
  const travelers = new Map<string, Traveler>()
  for (const [key, el] of travelerKeys(root)) {
    const rect = el.getBoundingClientRect()
    // Todos, no solo los visibles: un valor que entra o sale de la pantalla también viaja.
    if (hasBox(el)) travelers.set(key, { el, snap: snap(el, rect), clone: full ? el.cloneNode(true) as HTMLElement : el })
  }
  const boxes = new Map<Element, Snap>()
  const seen = new WeakSet<Element>()
  const rows: DOMRect[] = []
  if (full) {
    for (const el of root.querySelectorAll('*')) {
      if (!(el instanceof HTMLElement || el instanceof SVGSVGElement) || !hasBox(el)) continue
      seen.add(el)
      const rect = el.getBoundingClientRect()
      if (!inBand(rect)) continue
      boxes.set(el, snap(el, rect))
      // De registro a diseño: las líneas de las filas visibles se recogen hacia la derecha.
      if (!on && el.matches(ROW)) rows.push(rect)
    }
  }
  return { on, travelers, boxes, seen, rows }
}

export interface Pair {
  key: string
  el: HTMLElement
  from: Traveler
  to: Snap
  /** Cambia de cortes de línea, de familia o de texto: se disuelve en lugar de viajar. */
  cross: boolean
}

export interface Plan {
  pairs: Pair[]
  /** Valores en línea que vuelan como inline-block; lo devuelve buildMorph al terminar. */
  inlined: HTMLElement[]
  /** Lo que se va: copias que se apagan o se tapan. */
  leaving: { el: Element, snap: Snap }[]
  /** Bordes de lo que se fue sin copia (filas, fichas): líneas que se recogen. */
  lines: { rect: DOMRect, color: string, bottom: boolean }[]
  /** Lo que se queda pero se corre: solo traslación. */
  stayers: { el: HTMLElement, from: DOMRect, to: DOMRect }[]
  /** Lo que llega: rótulos, NULL, miniaturas, bloques de diseño. */
  arriving: HTMLElement[]
  /** Elementos nuevos con borde: el borde aparece de transparente. */
  borders: HTMLElement[]
  /** Filas del registro en pantalla (de diseño a registro): se trazan con `--rs`. */
  rows: HTMLElement[]
}

const hasDirectText = (el: Element) => [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
const isLeaf = (el: Element) => !el.firstElementChild || hasDirectText(el) || el.matches('img, svg, video, picture, canvas')

/** Lo más alto que cumple `test` sin que lo cumpla su padre: una sola copia por bloque. */
function topLevel<T extends Element>(els: T[], test: (el: Element) => boolean): T[] {
  return els.filter(el => !(el.parentElement && test(el.parentElement)))
}

function memo(fn: (el: Element) => boolean): (el: Element) => boolean {
  const cache = new Map<Element, boolean>()
  return (el) => {
    let value = cache.get(el)
    if (value === undefined) cache.set(el, value = fn(el))
    return value
  }
}

/** Después del cambio y del ancla: arma el plan del morph. `keys` es `travelerKeys(root)` de ahora. */
export function classify(root: HTMLElement, before: Before, keys: Map<string, HTMLElement>): Plan {
  const pairs: Pair[] = []
  const inlined: HTMLElement[] = []
  for (const [key, from] of before.travelers) {
    const el = keys.get(key)
    if (!el || !hasBox(el) || (!inBand(el.getBoundingClientRect()) && !inBand(from.snap.rect))) continue
    // Una transformación no mueve un elemento en línea: vuela como inline-block (misma caja, una línea).
    if (getComputedStyle(el).display === 'inline' && el.getClientRects().length === 1) {
      el.style.display = 'inline-block'
      inlined.push(el)
    }
    const to = snap(el)
    const cross = from.snap.lines > 1 || to.lines > 1 || from.snap.style.fontFamily !== to.style.fontFamily
      || from.snap.text !== to.text || !!el.querySelector('.ed-only, .rec-only')
    pairs.push({ key, el, from, to, cross })
  }
  const oldNodes = pairs.map(p => p.from.el)
  const newNodes = pairs.map(p => p.el)
  const blocked = (el: Element, nodes: Element[]) => nodes.some(n => n === el || el.contains(n) || n.contains(el))

  // Lo que se va: no tiene caja ahora y no lleva ni está adentro de un valor que viaja.
  const gone = (el: Element) => !root.contains(el) || !hasBox(el)
  const leaves = memo(el => before.boxes.has(el) && el !== root && !el.matches(ROW) && gone(el) && !blocked(el, oldNodes))
  const old = [...before.boxes.keys()]
  const leaving = topLevel(old.filter(leaves), leaves).map(el => ({ el, snap: before.boxes.get(el)! }))
  const inLeaving = (el: Element) => leaving.some(({ el: unit }) => unit.contains(el))

  const lines: Plan['lines'] = before.rows.map(rect => ({ rect, color: 'var(--rule)', bottom: false }))
  for (const el of old) {
    const s = before.boxes.get(el)!
    if ((!s.borderTop && !s.borderBottom) || !gone(el) || inLeaving(el)) continue
    if (s.borderTop) lines.push({ rect: s.rect, color: s.borderTop, bottom: false })
    if (s.borderBottom) lines.push({ rect: s.rect, color: s.borderBottom, bottom: true })
  }

  // Lo que se queda y se corre: hojas visibles en los dos estados, sin valores adentro.
  const traveling = (el: Element) => !!(el.closest(TRAVELER) || el.querySelector(TRAVELER))
  const isStayer = memo(el => el instanceof HTMLElement && before.boxes.has(el) && !gone(el) && isLeaf(el) && !traveling(el))
  const stayers = topLevel(old.filter(isStayer), isStayer).flatMap((el) => {
    const from = before.boxes.get(el)!.rect
    const to = el.getBoundingClientRect()
    return Math.abs(to.left - from.left) > 0.5 || Math.abs(to.top - from.top) > 0.5 ? [{ el: el as HTMLElement, from, to }] : []
  })

  // Lo que llega: no tenía caja antes, y no lleva ni está adentro de un valor que viaja.
  const now = [...root.querySelectorAll<HTMLElement>('*')].filter(el => el instanceof HTMLElement && hasBox(el) && inBand(el.getBoundingClientRect()))
  const isNew = (el: Element) => el instanceof HTMLElement && el !== root && !before.seen.has(el) && hasBox(el)
  const arrives = memo(el => isNew(el) && !el.matches(ROW) && !blocked(el, newNodes))
  const arriving = topLevel(now.filter(arrives), arrives)
  const borders = now.filter((el) => {
    if (!isNew(el) || arriving.some(unit => unit.contains(el))) return false
    const s = getComputedStyle(el)
    return !!(visibleBorder(s.borderTopWidth, s.borderTopStyle, s.borderTopColor) || visibleBorder(s.borderBottomWidth, s.borderBottomStyle, s.borderBottomColor))
  })
  const rows = before.on ? now.filter(el => el.matches(ROW)) : []

  return { pairs, inlined, leaving, lines, stayers, arriving, borders, rows }
}
