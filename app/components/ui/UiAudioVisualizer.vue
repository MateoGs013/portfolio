<script setup lang="ts">
/**
 * UiAudioVisualizer — Consola Acústica Procedural Web Audio API
 * Sintetizador interactivo que demuestra el motor de audio táctil de Bencho UI.
 * Permite disparar y visualizar en tiempo real cada evento acústico (`slide`, `poke`, `tock`, `press`, `chime`, `pop`).
 */
import { ref, onBeforeUnmount } from 'vue'
import { usePortfolioLocale } from '~/composables/usePortfolioLocale'
import { useBenchoSound, type BenchoSoundName } from '~/composables/useBenchoSound'

const { isEs } = usePortfolioLocale()
const { soundEnabled, toggleSound, playSound } = useBenchoSound()

const lastSound = ref<string>('idle')
const activeBars = ref<number[]>([12, 18, 28, 16, 22, 14, 20, 10])
let pulseTimer: ReturnType<typeof setTimeout> | null = null

const soundList: Array<{ key: BenchoSoundName; label: string; freq: string }> = [
  { key: 'poke', label: 'Poke', freq: '680Hz' },
  { key: 'tock', label: 'Tock', freq: '520Hz' },
  { key: 'press', label: 'Press', freq: '440Hz' },
  { key: 'slide', label: 'Slide', freq: '220→480Hz' },
  { key: 'notch', label: 'Notch', freq: '800Hz' },
  { key: 'chime', label: 'Chime', freq: '1200Hz' },
  { key: 'pop', label: 'Pop', freq: '920Hz' },
]

function triggerSound(kind: BenchoSoundName) {
  lastSound.value = kind
  playSound(kind)

  // Pulso en las barras del visualizador
  activeBars.value = activeBars.value.map(() => Math.floor(Math.random() * 26 + 10))

  if (pulseTimer) clearTimeout(pulseTimer)
  pulseTimer = setTimeout(() => {
    activeBars.value = [10, 14, 18, 12, 16, 10, 14, 8]
  }, 220)
}

onBeforeUnmount(() => {
  if (pulseTimer) clearTimeout(pulseTimer)
})
</script>

<template>
  <div class="audio-bench rounded-xl border border-rule bg-surface/70 backdrop-blur-md p-4 flex flex-col gap-3.5 select-none">
    <!-- Cabecera de la consola de audio -->
    <div class="flex items-center justify-between gap-2 border-b border-rule/70 pb-2.5">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full" :class="soundEnabled ? 'bg-green animate-pulse' : 'bg-faint'" />
        <span class="font-sans text-[12.5px] font-semibold text-ink">
          {{ isEs ? 'Síntesis Acústica Web Audio' : 'Web Audio Acoustic Synthesis' }}
        </span>
        <span class="font-mono text-[9.5px] px-1.5 py-0.2 rounded bg-paper/80 border border-rule text-dim">
          &lt;4ms
        </span>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-2 py-0.8 rounded-md border font-mono text-[10px] cursor-pointer transition-colors"
        :class="soundEnabled
          ? 'border-green/40 bg-green/10 text-green hover:bg-green/20'
          : 'border-rule bg-paper/80 text-dim hover:text-ink'"
        @click="toggleSound"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path v-if="soundEnabled" d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <line v-else x1="22" y1="9" x2="16" y2="15" />
        </svg>
        <span>{{ soundEnabled ? 'ON' : 'MUTE' }}</span>
      </button>
    </div>

    <!-- Visualizador de Barras en Tiempo Real -->
    <div class="h-10 bg-paper/80 rounded-lg border border-rule flex items-center justify-center gap-1.5 px-3">
      <span
        v-for="(height, idx) in activeBars"
        :key="idx"
        class="w-1.5 bg-sig rounded-full transition-all duration-150"
        :style="{ height: `${soundEnabled ? height : 4}px`, opacity: soundEnabled ? 0.85 : 0.25 }"
      />
      <span class="ml-3 font-mono text-[10px] text-faint tabular-nums">
        TRIGGER: <span class="text-ink font-semibold uppercase">{{ lastSound }}</span>
      </span>
    </div>

    <!-- Pistas / Botones de Disparo Táctil -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
      <button
        v-for="snd in soundList"
        :key="snd.key"
        type="button"
        class="flex flex-col items-center justify-center py-2 px-2 rounded-lg border border-rule bg-paper/60 hover:bg-hover hover:border-rule-strong active:scale-[0.96] text-ink font-mono text-[11px] cursor-pointer transition-all"
        :class="{ '!border-sig !text-sig !bg-sig/10': lastSound === snd.key }"
        @click="triggerSound(snd.key)"
      >
        <span class="font-semibold">{{ snd.label }}</span>
        <span class="text-[9px] text-dim">{{ snd.freq }}</span>
      </button>
    </div>
  </div>
</template>
