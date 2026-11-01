<script setup lang="ts">
/**
 * Datos: las tecnologías (con «Importar desde el repositorio»), los enlaces extra del caso y las
 * métricas tipadas. Todo viaja en el mismo Guardar de la obra. Abajo, en solo lectura, dónde más
 * aparece la obra.
 */
import Links from '../data/Links.vue'
import Metrics from '../data/Metrics.vue'
import Repo from '../data/Repo.vue'
import Techs from '../data/Techs.vue'
import { useProject } from '../context'
import Relations from '../Relations.vue'

const { record } = useProject()
</script>

<template>
  <div class="grid gap-14">
    <div class="grid gap-8">
      <Techs />
      <Repo />
    </div>
    <Metrics />
    <Links />
    <Relations v-if="record" :project-id="record.id" />
  </div>
</template>
