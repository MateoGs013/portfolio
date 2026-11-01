<script setup lang="ts">
/** #/busqueda/tendencias[/:id], provisorio hasta H2. */
import { useRoute } from 'vue-router'
import { shell } from '../../shell/dict'
import Placeholder from '../../shell/Placeholder.vue'

const route = useRoute()
</script>

<template>
  <Placeholder
    v-if="route.params['id']"
    :title="shell.nav.trends"
    :back="{ label: shell.nav.trends, to: '/busqueda/tendencias' }"
  />
  <Placeholder v-else :title="shell.nav.trends" />
</template>
