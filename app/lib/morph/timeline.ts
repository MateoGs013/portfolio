/**
 * La coreografía del morph de R (docs/diseno.md §2.1), sobre el plan de flip.ts. Ningún texto cambia
 * de ancho en vuelo: cada valor viaja (traslación y escala por la razón de font-size, con color y peso
 * interpolados y el ancho fijo) o, si cambia de cortes, de familia o de texto, se disuelve a través
 * de un fantasma. De diseño a registro (~1,3 s): los ornamentos se apagan subiendo 6 px (0–0,3 s),
 * los valores salen desde 0,05 s (14 ms entre cada uno, tope 220 ms, 0,95 s expo.inOut), las líneas
 * se trazan desde 0,18 s (22 ms por fila), los rótulos se descubren cuando su valor va por la mitad
 * y las comillas llegan a 0,75 s. De vuelta: los rótulos se tapan hacia la derecha, las líneas se
 * recogen y lo del diseño sube 10 px desde 0,5 s. En Hiperfoco todo junto, en 250 ms.
 */
import gsap from 'gsap'
import { ROW, type Plan, type Snap } from './flip'

export interface Timing {
  dur: number
  ease: string
  step: number
  maxStagger: number
  /** Escala del acompañamiento (1, o 250/950 ms en Hiperfoco). */
  scale: number
}

export const MORPH: Timing = { dur: 0.95, ease: 'expo.inOut', step: 0.014, maxStagger: 0.22, scale: 1 }
export const MORPH_FOCUS: Timing = { dur: 0.25, ease: 'power3.inOut', step: 0, maxStagger: 0, scale: 0.25 / 0.95 }

export interface Morph {
  tl: gsap.core.Timeline
  /** Se cumple al terminar (también si se adelanta con `progress(1)`), ya sin la capa. */
  done: Promise<void>
}

/** Atributos que una copia no puede llevar: nombres de view transition, anclas, foco, campos. */
const STRIP_ATTRS = ['id', 'tabindex', 'data-vt', 'data-f', 'data-row', 'data-card', 'data-view', 'data-tint', 'data-travel', 'data-travel-title', 'data-travel-cover', 'data-ornament', 'data-flip-id', 'data-peek-anchor', 'data-peek-group', 'data-preview-cover', 'data-hf']
const STRIP_CLASSES = ['f', 'fv', 'fk', 'ft', 'flip', 'ed-only', 'rec-only', 'null']

/**
 * Una copia que ya no es parte de la página. De diseño a registro el `<html>` ya dice registro: se le
 * sacan las variantes `record:`, que antes no regían. De vuelta, la capa lleva `data-vista` y las
 * conserva. Las marcas de lectura (`.ed-only`, `.fk`…) se sacan para que ninguna regla la oculte.
 */
function clean(root: Element, on: boolean) {
  for (const node of [root, ...root.querySelectorAll('*')]) {
    STRIP_ATTRS.forEach(name => node.removeAttribute(name))
    node.classList.remove(...STRIP_CLASSES)
    if (on) [...node.classList].filter(c => /(^|:)record:/.test(c)).forEach(c => node.classList.remove(c))
    if (node instanceof HTMLElement || node instanceof SVGElement) node.style.setProperty('view-transition-name', 'none')
    if (node instanceof HTMLVideoElement) {
      node.removeAttribute('autoplay')
      node.pause()
    }
  }
}

const ghostDisplay = (display: string) => (display === 'inline' ? 'inline-block' : display.startsWith('table') || display === 'list-item' ? 'block' : display)

function ghostOf(source: Element, s: Snap, layer: HTMLElement, origin: DOMRect, on: boolean): HTMLElement {
  const g = source.cloneNode(true) as HTMLElement
  clean(g, on)
  Object.assign(g.style, {
    ...s.style,
    position: 'absolute',
    left: `${s.rect.left - origin.left}px`,
    top: `${s.rect.top - origin.top}px`,
    width: `${s.width}px`,
    height: `${s.height}px`,
    margin: '0',
    maxWidth: 'none',
    boxSizing: 'border-box',
    display: ghostDisplay(s.display),
    transformOrigin: '0 0',
    transition: 'none',
  })
  // Las líneas de las filas las dibujan las capas de línea, no las copias.
  g.style.setProperty('--rs', '0')
  layer.append(g)
  // Lo que se veía escalado (la captura que crece) se copia con su escala.
  const sx = s.rect.width / (s.width || 1)
  const sy = s.rect.height / (s.height || 1)
  if (Math.abs(sx - 1) > 0.01 || Math.abs(sy - 1) > 0.01) gsap.set(g, { scaleX: sx, scaleY: sy })
  return g
}

function createLayer(on: boolean): HTMLElement {
  const layer = document.createElement('div')
  layer.dataset.morphLayer = ''
  layer.setAttribute('aria-hidden', 'true')
  layer.inert = true
  if (!on) layer.dataset.vista = 'registro'
  Object.assign(layer.style, {
    position: 'absolute', left: '0', top: '0', width: '100%', height: `${document.documentElement.scrollHeight}px`,
    margin: '0', overflow: 'clip', pointerEvents: 'none', zIndex: '30',
  })
  document.body.append(layer)
  return layer
}

/** Estilos en línea que el vuelo necesita y que se devuelven al terminar. */
function locker() {
  const saved: [HTMLElement, string, string][] = []
  return {
    lock(el: HTMLElement, styles: Record<string, string>) {
      for (const [prop, value] of Object.entries(styles)) {
        saved.push([el, prop, el.style.getPropertyValue(prop)])
        el.style.setProperty(prop, value)
      }
    },
    release() {
      saved.reverse().forEach(([el, prop, value]) => (value ? el.style.setProperty(prop, value) : el.style.removeProperty(prop)))
      saved.length = 0
    },
  }
}

const byPosition = (a: DOMRect, b: DOMRect) => a.top - b.top || a.left - b.left

export function buildMorph(root: HTMLElement, plan: Plan, on: boolean, t: Timing): Morph {
  const tl = gsap.timeline({ paused: true })
  const layer = createLayer(on)
  const origin = layer.getBoundingClientRect()
  const styles = locker()
  const at = (s: number) => s * t.scale
  const stagger = (i: number, step: number, cap: number) => (t.step ? Math.min(i * step, cap) : 0)

  // 1 · Lo que se va: de diseño se apaga subiendo; de registro se tapa hacia la derecha.
  plan.leaving.forEach(({ el, snap }, i) => {
    const g = ghostOf(el, snap, layer, origin, on)
    const d = stagger(i, 0.006, 0.12)
    if (on) tl.to(g, { opacity: 0, y: '-=6', duration: at(0.32), ease: 'power2.out' }, d)
    else tl.fromTo(g, { clipPath: 'inset(0 0% 0 0)' }, { clipPath: 'inset(0 0 0 100%)', duration: at(0.38), ease: 'power3.in' }, d)
  })
  plan.lines.forEach(({ rect, color, bottom }, i) => {
    const line = document.createElement('i')
    Object.assign(line.style, {
      position: 'absolute', left: `${rect.left - origin.left}px`, top: `${(bottom ? rect.bottom - 1 : rect.top) - origin.top}px`,
      width: `${rect.width}px`, height: '1px', background: color, transformOrigin: '100% 50%',
    })
    layer.append(line)
    tl.to(line, { scaleX: 0, duration: at(0.5), ease: 'power3.in' }, stagger(i, 0.012, 0.15))
  })

  // 2 · Lo que se queda: viaja desde donde estaba. Cada fila recuerda cuándo sale su primer valor.
  const rowDelay = new Map<Element, number>()
  const pairs = [...plan.pairs].sort((a, b) => byPosition(a.to.rect, b.to.rect))
  pairs.forEach((p, i) => {
    const d = at(on ? 0.05 : 0.12) + stagger(i, t.step, t.maxStagger)
    for (let n = p.el.closest(ROW); n; n = n.parentElement?.closest(ROW) ?? null) if (!rowDelay.has(n)) rowDelay.set(n, d)
    const s0 = p.from.snap
    const s1 = p.to
    styles.lock(p.el, { 'transition': 'none', 'will-change': 'transform, opacity' })
    if (p.el.tagName === 'IMG') {
      tl.fromTo(p.el, { x: s0.rect.left - s1.rect.left, y: s0.rect.top - s1.rect.top, scaleX: s0.rect.width / s1.rect.width, scaleY: s0.rect.height / s1.rect.height, transformOrigin: '0 0' },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: t.dur, ease: t.ease, clearProps: 'transform,transformOrigin' }, d)
      return
    }
    const k = s0.fontSize / s1.fontSize
    const baseline = (s: Snap, scale: number) => (scale * (s.lineHeight - s.fontSize)) / 2
    const dy = s0.rect.top + baseline(s0, 1) - s1.rect.top - baseline(s1, k)
    if (!p.cross) {
      // Viaje: el ancho queda fijo; solo cambian la transformación, el color y el peso.
      styles.lock(p.el, { 'width': `${s1.width}px`, 'white-space': 'nowrap' })
      tl.fromTo(p.el, { x: s0.rect.left - s1.rect.left, y: dy, scale: k, transformOrigin: '0 0', color: s0.style.color, fontWeight: s0.style.fontWeight },
        { x: 0, y: 0, scale: 1, color: s1.style.color, fontWeight: s1.style.fontWeight, duration: t.dur, ease: t.ease, clearProps: 'transform,transformOrigin,color,fontWeight' }, d)
      // Un subrayado escalado sería una barra: aparece cuando el valor ya casi llegó.
      if (s1.underline && !s0.underline) {
        tl.fromTo(p.el, { textDecorationColor: 'transparent' }, { textDecorationColor: s1.underline, duration: t.dur * 0.3, ease: 'power1.out', clearProps: 'textDecorationColor' }, d + t.dur * 0.7)
      }
      return
    }
    // Fantasma: el aspecto anterior viaja y se apaga antes de que aparezca el nodo real.
    const g = ghostOf(p.from.clone, s0, layer, origin, on)
    const base = s0.rect.width / (s0.width || 1)
    const gy = s1.rect.top + baseline(s1, 1) - s0.rect.top - baseline(s0, 1 / k)
    tl.to(g, { x: s1.rect.left - s0.rect.left, y: gy, scale: base / k, duration: t.dur, ease: t.ease }, d)
      .to(g, { opacity: 0, duration: t.dur * 0.34, ease: 'power1.in' }, d + t.dur * 0.12)
      .fromTo(p.el, { opacity: 0, y: 6 * Math.sign(-dy || 1) }, { opacity: 1, y: 0, duration: t.dur * 0.5, ease: 'power2.out', clearProps: 'opacity,transform' }, d + t.dur * 0.5)
  })
  plan.stayers.forEach(({ el, from, to }) => {
    styles.lock(el, { transition: 'none' })
    tl.fromTo(el, { x: from.left - to.left, y: from.top - to.top }, { x: 0, y: 0, duration: t.dur, ease: t.ease, clearProps: 'transform' }, at(on ? 0.05 : 0.12))
  })

  // 3 · Lo que llega: líneas que se trazan y rótulos que se descubren, o el diseño que sube.
  if (on) {
    plan.rows.sort((a, b) => byPosition(a.getBoundingClientRect(), b.getBoundingClientRect())).forEach((row, i) => {
      tl.fromTo(row, { '--rs': 0 }, { '--rs': 1, duration: at(0.85), ease: 'expo.out', clearProps: '--rs' }, at(0.18) + stagger(i, 0.022, 0.3))
    })
    plan.arriving.forEach((el, i) => {
      const row = el.closest(ROW)
      const start = row && rowDelay.has(row) ? rowDelay.get(row)! + t.dur * 0.5 : at(0.3) + stagger(i, 0.01, 0.2)
      tl.fromTo(el, { clipPath: 'inset(-2px 100% -2px 0)' }, { clipPath: 'inset(-2px 0% -2px 0)', duration: at(0.6), ease: 'expo.out', clearProps: 'clipPath' }, start)
    })
  }
  else {
    plan.arriving.forEach((el, i) => {
      styles.lock(el, { transition: 'none' })
      tl.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: at(0.7), ease: 'expo.out', clearProps: 'opacity,transform' }, at(0.5) + stagger(i, 0.025, 0.3))
    })
  }
  if (plan.borders.length) {
    tl.from(plan.borders, { borderTopColor: 'transparent', borderBottomColor: 'transparent', duration: at(0.6), ease: 'power1.out', clearProps: 'borderTopColor,borderBottomColor' }, at(0.45))
  }

  root.classList.add('quotes-off')
  tl.call(() => root.classList.remove('quotes-off'), [], on ? at(0.75) : 0)

  const done = new Promise<void>((resolve) => {
    tl.eventCallback('onComplete', () => {
      layer.remove()
      root.classList.remove('quotes-off')
      styles.release()
      plan.inlined.forEach(el => el.style.removeProperty('display'))
      resolve()
    })
  })
  return { tl, done }
}
