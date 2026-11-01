<script setup lang="ts">
/**
 * Datos, provisorio hasta U7 (tecnologías, enlaces, métricas e importación del repositorio): cuenta lo
 * que tiene la obra, que se conserva en cada guardado, y lleva al panel actual. Abajo, en solo
 * lectura, dónde más aparece la obra (Relations, que U7 conserva).
 */
import { computed } from 'vue'
import Button from '../../../ui/Button.vue'
import EmptyState from '../../../ui/EmptyState.vue'
import { useProject } from '../context'
import { projectsText } from '../dict'
import Relations from '../Relations.vue'

const t = projectsText.placeholder
const { form, record } = useProject()
const summary = computed(() => t.summary(form.value.techIds.length, form.value.links.length, record.value?.metrics.length ?? 0))
</script>

<template>
  <div class="grid gap-12">
    <EmptyState :title="t.data" :text="`${summary}. ${t.dataText}`">
      <Button href="/admin/" external data-field="techIds">
        {{ t.open }}
      </Button>
    </EmptyState>
    <Relations v-if="record" :project-id="record.id" />
  </div>
</template>
