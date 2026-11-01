<script setup lang="ts">
/** #/trayectoria[/:id], #/trayectoria/cv y #/trayectoria/nueva, provisorio hasta U2. */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { shell } from '../../shell/dict'
import Placeholder from '../../shell/Placeholder.vue'
import { useRecordTitle } from '../../shell/title'
import { options } from '../../stores/meta'

const route = useRoute()
const record = computed(() => {
  if (route.name === 'trayectoria-cv') return shell.nav.cvView
  if (route.name === 'experiencia-nueva') return shell.palette.newExperience
  return options.value?.experiences.find(e => e.id === Number(route.params['id']))?.title ?? null
})
useRecordTitle(record)
</script>

<template>
  <Placeholder
    v-if="route.name !== 'trayectoria'"
    :title="record ?? shell.nav.experience"
    :back="{ label: shell.nav.experience, to: '/trayectoria' }"
  />
  <Placeholder v-else :title="shell.nav.experience" :count="options?.experiences.length ?? null" />
</template>
