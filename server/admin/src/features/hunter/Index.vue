<script setup lang="ts">
/** #/busqueda/vacantes[/:id[/:etapa]], provisorio hasta H1 (escanear, analizar, adaptar el CV y postular). */
import { useRoute } from 'vue-router'
import { shell } from '../../shell/dict'
import Placeholder from '../../shell/Placeholder.vue'

const route = useRoute()
</script>

<template>
  <Placeholder
    v-if="route.params['id']"
    :title="shell.nav.jobs"
    :back="{ label: shell.nav.jobs, to: '/busqueda/vacantes' }"
  />
  <Placeholder v-else :title="shell.nav.jobs" />
</template>
