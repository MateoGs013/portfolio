<script setup lang="ts">
// Rodar (docs/diseno.md §2): dos copias apiladas que se intercambian al apuntar o enfocar el enlace o
// botón que contiene el texto. La copia es contenido generado sin texto alternativo: el lector la saltea.
// `travel` marca el contenedor que recorta como lo que viaja (la palabra del menú → título de página).
defineProps<{
  text: string
  travel?: boolean
}>()
</script>

<template>
  <span class="roll" :data-travel-title="travel ? '' : undefined"><span :data-t="text">{{ text }}</span></span>
</template>
