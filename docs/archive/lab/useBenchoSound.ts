import { ref } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'

export type BenchoSoundName =
  | 'tock'
  | 'press'
  | 'expand'
  | 'copied'
  | 'notch'
  | 'slide'
  | 'poke'
  | 'pop'
  | 'click'
  | 'off'
  | 'chime'
  | 'swoop'
  | 'drag'

interface TonePart {
  hz: number
  to?: number
  glide?: number
  ms: number
  gain?: number
  wave?: OscillatorType
  cut?: number
  atk?: number
  at?: number
  lin?: boolean
}

// Recetas acústicas exactas extraídas de bencho.dev (sound-Q67qmSVK.js)
const RECIPES: Record<BenchoSoundName, TonePart[]> = {
  tock: [{ hz: 250, ms: 28, gain: 0.045, wave: 'triangle', cut: 1700, atk: 10 }],
  press: [{ hz: 168, ms: 95, gain: 0.028, wave: 'sine', cut: 480, atk: 14 }],
  expand: [
    { hz: 196, to: 174, ms: 360, gain: 0.042, wave: 'sine', cut: 880, atk: 36 },
    { hz: 294, to: 262, ms: 300, gain: 0.014, wave: 'sine', cut: 1100, atk: 48, at: 24 },
  ],
  copied: [
    { hz: 880, ms: 70, gain: 0.026, wave: 'sine', cut: 2400, atk: 4 },
    { hz: 1175, ms: 150, gain: 0.02, wave: 'sine', cut: 2600, atk: 4, at: 55 },
  ],
  notch: [{ hz: 230, ms: 49, gain: 0.048, wave: 'sine', cut: 820, atk: 6 }],
  slide: [{ hz: 309, ms: 325, gain: 0.054, wave: 'sine', cut: 820, atk: 48 }],
  poke: [{ hz: 380, ms: 20, gain: 0.047, wave: 'triangle', cut: 1700, atk: 5 }],
  pop: [{ hz: 680, to: 930, ms: 34, gain: 0.05, wave: 'sine', atk: 3 }],
  click: [{ hz: 196, to: 130, ms: 150, gain: 0.07, wave: 'sine', cut: 900 }],
  off: [{ hz: 330, to: 247, ms: 88, gain: 0.03, wave: 'sine', cut: 720, atk: 8 }],
  chime: [{ hz: 220, ms: 271, gain: 0.046, wave: 'sine', cut: 820, atk: 90 }],
  swoop: [{ hz: 214, to: 124, ms: 241, gain: 0.065, wave: 'sine', cut: 560, atk: 90 }],
  drag: [{ hz: 174, to: 155, ms: 250, gain: 0.034, wave: 'sine', cut: 640, atk: 28 }],
}

const STORAGE_KEY = 'portfolio-bencho-sound'
const soundEnabled = ref(true)
let audioCtx: AudioContext | null = null
let initialized = false
const lastPlayed: Record<string, number> = {}

function initStorage() {
  if (initialized || !import.meta.client) return
  initialized = true
  try {
    soundEnabled.value = localStorage.getItem(STORAGE_KEY) !== 'off'
  }
  catch {
    soundEnabled.value = true
  }
}

function getAudioContext(): AudioContext | null {
  if (!import.meta.client) return null
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    audioCtx ??= new Ctx()
    if (audioCtx.state !== 'running') {
      audioCtx.resume().catch(() => {})
    }
    return audioCtx
  }
  catch {
    return null
  }
}

export function useBenchoSound() {
  initStorage()
  const { isHyperfocus } = useHyperfocus()

  function playSound(
    name: BenchoSoundName,
    options?: { at?: number; gap?: number; gain?: number },
  ) {
    if (!import.meta.client || !soundEnabled.value || isHyperfocus.value) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const parts = RECIPES[name]
    if (!parts) return

    if (options?.gap) {
      const now = performance.now()
      if (now - (lastPlayed[name] ?? -Infinity) < options.gap) return
      lastPlayed[name] = now
    }

    const ctx = getAudioContext()
    if (!ctx || ctx.state !== 'running') return

    const pitchScale = options?.at === undefined
      ? 1
      : 0.75 + Math.min(1, Math.max(0, options.at)) * 0.75
    const gainScale = options?.gain ?? 1
    const baseTime = ctx.currentTime

    for (const part of parts) {
      const t0 = baseTime + (part.at ?? 0) / 1000
      const t1 = t0 + part.ms / 1000
      const glideEnd = part.glide ? t0 + part.glide / 1000 : t1

      const osc = ctx.createOscillator()
      osc.type = part.wave ?? 'sine'
      osc.frequency.setValueAtTime(part.hz * pitchScale, t0)
      if (part.to) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, part.to * pitchScale), glideEnd)
      }

      const gain = ctx.createGain()
      const atkSec = Math.min((part.atk ?? 4) / 1000, (part.ms / 1000) * 0.6)
      gain.gain.setValueAtTime(0.0001, t0)
      const peakGain = Math.max(0.0002, (part.gain ?? 0.05) * gainScale)
      if (part.lin) {
        gain.gain.linearRampToValueAtTime(peakGain, t0 + atkSec)
      }
      else {
        gain.gain.exponentialRampToValueAtTime(peakGain, t0 + atkSec)
      }
      gain.gain.exponentialRampToValueAtTime(0.0001, t1)

      let node: AudioNode = osc
      if (part.cut) {
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = part.cut
        osc.connect(filter)
        node = filter
      }

      node.connect(gain).connect(ctx.destination)
      osc.start(t0)
      osc.stop(t1 + 0.02)
    }
  }

  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, soundEnabled.value ? 'on' : 'off')
      }
      catch {
        // ignore storage error
      }
    }
    if (soundEnabled.value) {
      playSound('click')
    }
  }

  return {
    soundEnabled,
    playSound,
    toggleSound,
  }
}
