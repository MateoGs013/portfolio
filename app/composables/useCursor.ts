/**
 * El puntero, compartido (Seguir, docs/diseno.md §2): un solo `pointermove` pasivo y una sola función
 * en el ticker de GSAP, que existen solo mientras haya alguien suscrito (la vista previa del inicio,
 * la burbuja «Ver caso»). La posición suavizada usa lerp .14, el valor del prototipo.
 */
import gsap from 'gsap'

const LERP = 0.14

export interface CursorFrame {
  /** Posición real del puntero, en px del viewport. */
  x: number
  y: number
  /** Posición suavizada (lerp .14 por cuadro). */
  sx: number
  sy: number
  /** Distancia en X entre el puntero y la posición suavizada: la velocidad para inclinar (±8° con ×.06). */
  vx: number
}

export type CursorListener = (frame: Readonly<CursorFrame>) => void

const frame: CursorFrame = { x: 0, y: 0, sx: 0, sy: 0, vx: 0 }
const listeners = new Set<CursorListener>()
let seen = false

function onMove(e: PointerEvent) {
  frame.x = e.clientX
  frame.y = e.clientY
  if (seen) return
  seen = true
  snap()
}

function tick() {
  const dx = frame.x - frame.sx
  frame.sx += dx * LERP
  frame.sy += (frame.y - frame.sy) * LERP
  frame.vx = dx
  listeners.forEach(listener => listener(frame))
}

/**
 * La posición suavizada salta a la real: al mostrar algo que estaba oculto, no viaja desde lejos.
 * Con un evento, la real se toma de él (el primer `pointerover`, antes de cualquier `pointermove`).
 */
function snap(at?: { clientX: number, clientY: number }) {
  if (at) {
    frame.x = at.clientX
    frame.y = at.clientY
    seen = true
  }
  frame.sx = frame.x
  frame.sy = frame.y
  frame.vx = 0
}

function subscribe(listener: CursorListener): () => void {
  if (listeners.size === 0) {
    window.addEventListener('pointermove', onMove, { passive: true })
    gsap.ticker.add(tick)
  }
  listeners.add(listener)
  return () => {
    if (!listeners.delete(listener) || listeners.size > 0) return
    window.removeEventListener('pointermove', onMove)
    gsap.ticker.remove(tick)
  }
}

export function useCursor() {
  const own = new Set<() => void>()

  /** Recibe un cuadro por tick mientras dure la suscripción. Devuelve cómo cortarla. */
  function follow(listener: CursorListener): () => void {
    if (import.meta.server) return () => {}
    const stop = subscribe(listener)
    const off = () => {
      own.delete(off)
      stop()
    }
    own.add(off)
    return off
  }

  // Lo que suscribió este componente se corta solo al desmontarlo.
  if (getCurrentScope()) onScopeDispose(() => [...own].forEach(off => off()))

  return { follow, snap, frame: frame as Readonly<CursorFrame> }
}
