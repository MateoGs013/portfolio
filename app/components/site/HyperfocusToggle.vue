<script setup lang="ts">
// Hiperfoco (docs/diseno.md §5): un solo botón en los dos modos, con aria-pressed y el atajo H. Es el
// mismo nodo antes y después de alternar, así el foco no se pierde. El cuadro marca el estado sin color.
const { t } = useLocale()
const { isHyperfocus } = useHyperfocus()
const { toggleHyperfocus } = useSiteActions()
</script>

<template>
  <button
    type="button"
    class="group hit inline-flex min-h-6 cursor-pointer items-center gap-2 opacity-72 transition-opacity duration-300 hover:opacity-100 aria-pressed:opacity-100"
    :aria-pressed="isHyperfocus ? 'true' : 'false'"
    aria-keyshortcuts="h"
    v-on:click="toggleHyperfocus"
  >
    <span aria-hidden="true" class="size-[0.5em] border border-current transition-colors duration-300 group-aria-pressed:bg-current" />
    <RollText :text="t('focus.label')" />
  </button>
</template>
