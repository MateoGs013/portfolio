/**
 * Sonido opcional (docs/diseno.md §6): un tic de 70 ms, apagado por defecto y recordado en la cookie
 * `pf-sound`. Suena solo en los cinco gestos (R, H, copiar el email, mover el resaltado de la paleta y
 * abrir un Asomar) y nunca con Hiperfoco ni con reduced motion.
 */
export const SOUND_COOKIE = 'pf-sound'

const YEAR = 60 * 60 * 24 * 365

/** La cookie viaja tal cual (pf-sound=on), sin el JSON que useCookie pone por defecto. */
const plain = (value: string | null) => value ?? ''

/** `prefers-reduced-motion: reduce`, leído en el momento (en el servidor, siempre false). */
export function prefersReducedMotion(): boolean {
  return import.meta.client && matchMedia('(prefers-reduced-motion: reduce)').matches
}

let audio: AudioContext | null = null

export function useSound() {
  const cookie = useCookie<string | null>(SOUND_COOKIE, { maxAge: YEAR, sameSite: 'lax', path: '/', encode: plain, decode: plain })
  const on = useState<boolean>(SOUND_COOKIE, () => cookie.value === 'on')
  const { isHyperfocus } = useHyperfocus()

  function setSound(next: boolean) {
    on.value = next
    cookie.value = next ? 'on' : null
  }

  const toggleSound = () => setSound(!on.value)

  /** Un tic senoidal corto; `freq` distingue el gesto. Sin audio disponible, silencio. */
  function tick(freq = 1700) {
    if (!import.meta.client || !on.value || isHyperfocus.value || prefersReducedMotion()) return
    try {
      audio ??= new AudioContext()
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      const t = audio.currentTime
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.045, t + 0.004)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
      osc.connect(gain).connect(audio.destination)
      osc.start(t)
      osc.stop(t + 0.08)
    }
    catch {
      // El navegador no deja crear audio (política de autoplay o sin Web Audio): el gesto sigue mudo.
    }
  }

  return { soundOn: readonly(on), setSound, toggleSound, tick }
}
