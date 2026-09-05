<script setup lang="ts">
// Nuxt monta el mundo una sola vez (`key` fija): navegar dentro de DATOS
// no remonta el explorador, solo cambia la ruta que lee.
import DatosWorld from '~/worlds/datos/DatosWorld.vue'

definePageMeta({ layout: 'mundo', key: 'datos' })
</script>

<template>
  <DatosWorld />
</template>
