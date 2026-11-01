<script setup lang="ts">
/** #/busqueda/publicaciones[/:id], provisorio hasta H2. */
import { useRoute } from 'vue-router'
import { shell } from '../../shell/dict'
import Placeholder from '../../shell/Placeholder.vue'

const route = useRoute()
</script>

<template>
  <Placeholder
    v-if="route.params['id']"
    :title="shell.nav.posts"
    :back="{ label: shell.nav.posts, to: '/busqueda/publicaciones' }"
  />
  <Placeholder v-else :title="shell.nav.posts" />
</template>
