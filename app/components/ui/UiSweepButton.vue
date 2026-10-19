<script setup lang="ts">
import { useBenchoSound } from '~/composables/useBenchoSound'

const props = withDefaults(defineProps<{
  to?: string
  href?: string
  speed?: number
  glow?: number
  corner?: number
  line?: boolean
}>(), {
  to: undefined,
  href: undefined,
  speed: 4.5,
  glow: 38,
  corner: 10,
  line: true,
})

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()

const { playSound } = useBenchoSound()

function onPress(e: MouseEvent) {
  playSound('press')
  emit('click', e)
}
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="swb group inline-flex items-center justify-center gap-2 h-9 px-4 font-sans text-[13px] font-medium no-underline select-none cursor-pointer"
    :data-line="line || undefined"
    :style="{
      '--swb-lap': `${props.speed}s`,
      '--swb-glow': String(props.glow / 100),
      '--swb-r': `${props.corner}px`,
    }"
    @click="onPress"
  >
    <slot />
  </NuxtLink>

  <a
    v-else-if="href"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    class="swb group inline-flex items-center justify-center gap-2 h-9 px-4 font-sans text-[13px] font-medium no-underline select-none cursor-pointer"
    :data-line="line || undefined"
    :style="{
      '--swb-lap': `${props.speed}s`,
      '--swb-glow': String(props.glow / 100),
      '--swb-r': `${props.corner}px`,
    }"
    @click="onPress"
  >
    <slot />
  </a>

  <button
    v-else
    type="button"
    class="swb group inline-flex items-center justify-center gap-2 h-9 px-4 font-sans text-[13px] font-medium no-underline select-none cursor-pointer"
    :data-line="line || undefined"
    :style="{
      '--swb-lap': `${props.speed}s`,
      '--swb-glow': String(props.glow / 100),
      '--swb-r': `${props.corner}px`,
    }"
    @click="onPress"
  >
    <slot />
  </button>
</template>

<style scoped>
/* Bencho sweep-button (.swb) exact @property conic-gradient mask */
@property --swb-turn {
  syntax: "<angle>";
  inherits: true;
  initial-value: 0deg;
}

.swb {
  --a: var(--swb-glow, 0.38);
  isolation: isolate;
  border-radius: var(--swb-r, 10px);
  background: var(--d-ink);
  color: var(--d-paper);
  border: 1px solid color-mix(in srgb, var(--d-ink) 85%, transparent);
  animation: swb-turn var(--swb-lap, 4.5s) linear infinite;
  letter-spacing: -0.01em;
  transition: scale 0.22s cubic-bezier(0.24, 1.34, 0.38, 1);
  position: relative;
  overflow: hidden;
}

.swb:hover {
  scale: 0.985;
}

.swb:active {
  scale: 0.96;
}

@keyframes swb-turn {
  to {
    --swb-turn: 360deg;
  }
}

.swb::before,
.swb::after {
  content: "";
  z-index: -1;
  border-radius: inherit;
  pointer-events: none;
  position: absolute;
  inset: 0;
}

.swb::before {
  background:
    radial-gradient(45% 120% at 20% 0%, rgba(255, 62, 0, var(--a)), transparent 75%),
    radial-gradient(45% 120% at 80% 100%, rgba(255, 140, 60, var(--a)), transparent 75%);
  -webkit-mask-image: conic-gradient(
    from var(--swb-turn),
    transparent 0deg,
    transparent 120deg,
    #000 200deg,
    #000 250deg,
    transparent 330deg
  );
  mask-image: conic-gradient(
    from var(--swb-turn),
    transparent 0deg,
    transparent 120deg,
    #000 200deg,
    #000 250deg,
    transparent 330deg
  );
  filter: saturate(1.25);
  transition: opacity 0.22s;
}

@media (prefers-reduced-motion: reduce) {
  .swb {
    animation: none !important;
  }
}
</style>
