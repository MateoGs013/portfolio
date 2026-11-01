<script setup lang="ts">
/** #/obras[/:id[/:seccion]] y #/obras/nueva, provisorio hasta U1: el título real de la obra. */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { shell } from '../../shell/dict'
import Placeholder from '../../shell/Placeholder.vue'
import { useRecordTitle } from '../../shell/title'
import { options } from '../../stores/meta'

const route = useRoute()
const record = computed(() => options.value?.projects.find(p => p.id === Number(route.params['id']))?.title ?? null)
useRecordTitle(record)
</script>

<template>
  <Placeholder
    v-if="route.name === 'obra'"
    :title="record ?? shell.nav.projects"
    :back="{ label: shell.nav.projects, to: '/obras' }"
  />
  <Placeholder
    v-else-if="route.name === 'obra-nueva'"
    :title="shell.palette.newProject"
    :back="{ label: shell.nav.projects, to: '/obras' }"
  />
  <Placeholder v-else :title="shell.nav.projects" :count="options?.projects.length ?? null" />
</template>
