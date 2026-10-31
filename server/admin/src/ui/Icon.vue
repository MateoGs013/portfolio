<script setup lang="ts">
import { computed } from 'vue'
import { PATHS, type IconName } from './icons'

const props = withDefaults(defineProps<{
  name: IconName
  /** Lado en px: 16 en botones, 14 en texto chico. */
  size?: 14 | 16 | 18 | 20
}>(), { size: 16 })

// El punteado de «arrastrar» se dibuja con trazo grueso y redondo.
const strokeWidth = computed(() => (props.name === 'drag' ? 3 : 1.75))
const paths = computed(() => PATHS[props.name])
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    class="shrink-0"
  >
    <path v-for="d in paths" :key="d" :d="d" />
  </svg>
</template>
