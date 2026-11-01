<script setup lang="ts">
/**
 * Una fila de la bandeja: un enlace entero (Tab la alcanza, Enter la abre) con la frase de lo que falta
 * y, debajo, qué consecuencia tiene. Entra escalonada; al apuntarla, las hermanas de su lista bajan a
 * .28 y la frase se corre 14 px, como las filas del sitio. «Ir» y la flecha solo acompañan.
 */
import { RouterLink } from 'vue-router'
import Icon from '../../ui/Icon.vue'
import { dotClass, type StatusTone } from '../../ui/StatusDot.vue'
import { home } from './dict'

defineProps<{
  to: string
  headline: string
  message: string
  tone: StatusTone
  /** Posición en la pantalla, para el escalonado de la entrada. */
  index: number
}>()
</script>

<template>
  <li
    class="animate-rise stagger transition-opacity duration-500 ease-e group-hover/list:not-hover:not-focus-within:opacity-28 group-has-[a:focus-visible]/list:not-has-[a:focus-visible]:opacity-28"
    :style="{ '--i': Math.min(index, 14) }"
  >
    <RouterLink
      :to="to"
      class="group/row grid grid-cols-[6px_minmax(0,1fr)_auto] items-baseline gap-x-4 border-b border-rule py-5 text-ink no-underline focus-visible:-outline-offset-2 max-sm:grid-cols-[6px_minmax(0,1fr)] max-sm:gap-x-3"
    >
      <span class="size-1.5 -translate-y-1 self-baseline rounded-full" :class="dotClass[tone]" aria-hidden="true" />
      <span class="min-w-0 transition-transform duration-700 ease-e group-hover/row:translate-x-3.5 group-focus-visible/row:translate-x-3.5">
        <span class="block text-title font-[520] tracking-[-0.015em] text-balance wrap-break-word">{{ headline }}</span>
        <span class="mt-1 block max-w-[72ch] text-body text-faint">{{ message }}</span>
      </span>
      <span class="inline-flex items-center gap-1.5 text-label text-faint transition-colors duration-120 ease-e group-hover/row:text-ink max-sm:hidden" aria-hidden="true">
        {{ home.pending.go }}
        <Icon name="arrow-right" :size="14" />
      </span>
    </RouterLink>
  </li>
</template>
