<script lang="ts">
/** Tonos del punto de estado. El color nunca va solo: siempre lo acompaña una palabra. */
export type StatusTone = 'ok' | 'wip' | 'danger' | 'sig' | 'neutral'

export const dotClass: Record<StatusTone, string> = {
  ok: 'bg-ok',
  wip: 'bg-wip',
  danger: 'bg-danger',
  sig: 'bg-sig',
  neutral: 'bg-faint',
}
</script>

<script setup lang="ts">
withDefaults(defineProps<{
  tone?: StatusTone
  /** La palabra que dice el estado («Publicada», «Cambios sin guardar»). */
  label: string
  /** Texto del rótulo: --dim por defecto, --ink si es lo principal de la fila. */
  strong?: boolean
}>(), { tone: 'neutral', strong: false })
</script>

<template>
  <span class="inline-flex items-center gap-2 text-label" :class="strong ? 'text-ink' : 'text-dim'">
    <span class="size-1.5 shrink-0 rounded-full" :class="dotClass[tone]" aria-hidden="true" />
    {{ label }}
  </span>
</template>
