<script lang="ts">
/**
 * El único lugar del admin con Martian Mono (junto con Kbd): slug, clave de métrica, URL e id, a
 * 12 o 13 px y en minúscula. check-admin-style rechaza font-mono en cualquier otro archivo; un campo
 * que necesita la familia (TextInput mono) importa estas clases.
 */
export const monoClass = {
  meta: 'font-mono text-meta tracking-[-0.01em]',
  label: 'font-mono text-label tracking-[-0.01em]',
} as const

export type MonoSize = keyof typeof monoClass
</script>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: MonoSize
  /** `code` para un valor que se copia tal cual; `span` para un identificador en una línea. */
  as?: 'span' | 'code'
}>(), { size: 'meta', as: 'span' })
</script>

<template>
  <component :is="as" :class="monoClass[size]" translate="no">
    <slot />
  </component>
</template>
