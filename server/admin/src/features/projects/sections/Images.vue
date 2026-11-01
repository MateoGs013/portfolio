<script setup lang="ts">
/**
 * Imágenes, provisorio hasta U7 (subida, portada, texto alternativo y reemplazo): dice cuántas tiene
 * la obra y lleva al panel actual, donde se cargan mientras tanto. Lleva `data-field="media"`, así la
 * checklist de publicación («Tiene una imagen de portada») llega acá.
 */
import { computed } from 'vue'
import Button from '../../../ui/Button.vue'
import EmptyState from '../../../ui/EmptyState.vue'
import { useProject } from '../context'
import { projectsText } from '../dict'

const t = projectsText.placeholder
const { record } = useProject()
const count = computed(() => record.value?.media.length ?? 0)
</script>

<template>
  <EmptyState :title="t.images" :text="t.imagesText(count)">
    <Button href="/admin/" external data-field="media">
      {{ t.open }}
    </Button>
  </EmptyState>
</template>
