<script setup lang="ts">
/**
 * Vista provisoria de un área que todavía no llegó al panel nuevo: su título (el de la sección o el
 * del registro), la cifra real que da /meta y el acceso al panel actual. La reemplaza el dueño de cada
 * features/<área>/Index.vue; S1 verifica que no quede ninguna (este componente no puede usarse fuera
 * de esas entradas).
 */
import { RouterLink } from 'vue-router'
import Button from '../ui/Button.vue'
import { ui } from '../ui/dict'
import EmptyState from '../ui/EmptyState.vue'
import Icon from '../ui/Icon.vue'
import { shell } from './dict'
import { TRAVEL_NAME } from './transition'

withDefaults(defineProps<{
  title: string
  /** La cifra al lado del título (cuántas obras), si la sección es una colección. */
  count?: number | null
  /** Una línea de contexto con datos reales. */
  lead?: string | null
  /** En un registro: «← Obras». */
  back?: { label: string, to: string } | null
}>(), { count: null, lead: null, back: null })
</script>

<template>
  <section class="px-4 pt-10 pb-20 md:px-10 md:pt-12 xl:px-16 xl:pt-14">
    <RouterLink
      v-if="back"
      :to="back.to"
      class="mb-3.5 inline-flex items-center gap-2 rounded-control text-row font-[420] text-faint no-underline transition-colors duration-120 ease-e hover:text-ink"
    >
      <Icon name="arrow-left" :size="14" />
      {{ back.label }}
    </RouterLink>
    <header class="flex max-w-[1080px] flex-wrap items-baseline gap-x-4 gap-y-2">
      <h1
        class="m-0 min-w-0 animate-rise text-balance wrap-break-word"
        :class="back ? 'text-heading' : 'text-display'"
        :style="back ? { viewTransitionName: TRAVEL_NAME } : undefined"
      >
        {{ title }}
      </h1>
      <span v-if="count !== null" class="animate-rise text-title font-[420] text-faint tabular-nums stagger [--i:1]">{{ count }}</span>
    </header>
    <p v-if="lead" class="mt-3.5 mb-0 max-w-[60ch] animate-rise text-lead text-dim stagger [--i:2]">
      {{ lead }}
    </p>
    <div class="mt-11 max-w-[1080px] animate-rise stagger [--i:3]">
      <EmptyState :title="shell.placeholder.title" :text="shell.placeholder.text">
        <Button href="/admin/" external>
          {{ ui.app.openCurrent }}
        </Button>
      </EmptyState>
    </div>
  </section>
</template>
