<script setup lang="ts">
/**
 * Un atajo escrito: `keys="mod+k"` se ve «⌘K» en Mac y «Ctrl K» en el resto. Va al lado de la acción,
 * nunca solo; el botón que la dispara lleva aria-keyshortcuts.
 */
import { computed } from 'vue'
import { usePlatform } from '../composables/usePlatform'

const props = withDefaults(defineProps<{
  keys: string
  /** Sobre el relleno del primario el borde y el texto toman el color de la tinta oscura. */
  onSig?: boolean
}>(), { onSig: false })

const NAMES: Record<string, string> = {
  esc: 'Esc',
  enter: 'Enter',
  tab: 'Tab',
  shift: 'Mayús',
  alt: 'Alt',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  home: 'Inicio',
  end: 'Fin',
  space: 'Espacio',
  backspace: 'Retroceso',
}

const { isMac, modLabel } = usePlatform()

const label = computed(() => {
  const parts = props.keys.split('+').map((key) => {
    const k = key.trim().toLowerCase()
    if (k === 'mod') return modLabel
    return NAMES[k] ?? key.trim().toUpperCase()
  })
  // En Mac los símbolos van pegados (⌘K); con palabras, separadas (Ctrl K).
  return isMac && parts[0] === modLabel ? parts.join('') : parts.join(' ')
})
</script>

<template>
  <kbd
    class="inline-flex h-5 min-w-5 items-center justify-center rounded-kbd border px-1.5 font-mono text-meta leading-none tracking-[-0.01em]"
    :class="onSig ? 'border-on-sig/30 text-on-sig/85' : 'border-rule-strong text-faint'"
  >{{ label }}</kbd>
</template>
