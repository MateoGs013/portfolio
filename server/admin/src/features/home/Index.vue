<script setup lang="ts">
/** #/inicio, provisorio hasta U5: el resumen con las cifras reales de /meta. */
import { computed } from 'vue'
import Placeholder from '../../shell/Placeholder.vue'
import { shell } from '../../shell/dict'
import { summary } from '../../stores/meta'

const s = shell.placeholder.summary
const lead = computed(() => {
  const counts = summary.value
  if (!counts) return null
  return [s.projects(counts.projects.visible), s.experience(counts.experience.total), s.articles(counts.articles.published)].join(' · ')
})
</script>

<template>
  <Placeholder :title="shell.nav.home" :lead="lead" />
</template>
