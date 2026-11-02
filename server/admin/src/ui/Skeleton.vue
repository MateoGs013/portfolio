<script setup lang="ts">
/**
 * Lugar reservado mientras llega el contenido, con la forma de lo que viene para que nada salte.
 * Quieto, sin pulso: la espera se anuncia una vez («Cargando contenido»).
 * - `rows`: las filas grandes de una lista como pantalla.
 * - `form`: rótulo y línea de campos.
 * - `text`: renglones de un párrafo.
 */
import { ui } from './dict'

withDefaults(defineProps<{
  variant?: 'rows' | 'form' | 'text'
  count?: number
}>(), { variant: 'rows', count: 5 })

/** Anchos que varían para que no parezca una grilla: el mismo orden en cada carga. */
const widths = ['w-3/5', 'w-2/5', 'w-1/2', 'w-2/3', 'w-1/3', 'w-[45%]']
</script>

<template>
  <div role="status" :aria-label="ui.states.loadingLabel">
    <span class="sr-only">{{ ui.states.loadingLabel }}</span>
    <ul v-if="variant === 'rows'" class="m-0 list-none border-t border-rule p-0" aria-hidden="true">
      <li v-for="n in count" :key="n" class="flex items-center justify-between gap-6 border-b border-rule pt-6 pb-6.5">
        <span class="h-7 rounded-media bg-surface" :class="widths[(n - 1) % widths.length]" />
        <span class="h-3.5 w-24 rounded-media bg-surface max-sm:hidden" />
      </li>
    </ul>
    <div v-else-if="variant === 'form'" class="grid max-w-[720px] gap-8.5" aria-hidden="true">
      <div v-for="n in count" :key="n" class="grid gap-3">
        <span class="h-3 w-24 rounded-media bg-surface" />
        <span class="h-10 border-b border-rule-strong" />
      </div>
    </div>
    <div v-else class="grid max-w-[68ch] gap-3" aria-hidden="true">
      <span v-for="n in count" :key="n" class="h-3.5 rounded-media bg-surface" :class="n === count ? 'w-2/5' : 'w-full'" />
    </div>
  </div>
</template>
