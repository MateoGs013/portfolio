<script setup lang="ts">
// Tema: el botón dice lo que hace (cambiar al otro tema) y muestra el ícono de ese tema. En el menú
// angosto el rótulo también se ve; en la cabecera ancha queda el ícono solo.
const { t } = useLocale()
const { theme } = useTheme()
const { toggleTheme } = useSiteActions()

const toLight = computed(() => theme.value === 'dark')
const label = computed(() => t(toLight.value ? 'shell.theme.toLight' : 'shell.theme.toDark'))
</script>

<template>
  <button
    type="button"
    class="inline-flex min-h-6 min-w-6 cursor-pointer items-center gap-2 opacity-72 transition-opacity duration-300 hover:opacity-100"
    :aria-label="label"
    v-on:click="toggleTheme"
  >
    <AppIcon :name="toLight ? 'sun' : 'moon'" :size="16" />
    <span class="md:hidden">{{ label }}</span>
  </button>
</template>
