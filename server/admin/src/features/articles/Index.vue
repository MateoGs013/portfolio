<script setup lang="ts">
/** #/articulos[/:id] y #/articulos/nuevo, provisorio hasta U6. */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { shell } from '../../shell/dict'
import Placeholder from '../../shell/Placeholder.vue'
import { useRecordTitle } from '../../shell/title'
import { options } from '../../stores/meta'

const route = useRoute()
const record = computed(() => {
  if (route.name === 'articulo-nuevo') return shell.palette.newArticle
  return options.value?.articles.find(a => a.id === Number(route.params['id']))?.title ?? null
})
useRecordTitle(record)
</script>

<template>
  <Placeholder
    v-if="route.name !== 'articulos'"
    :title="record ?? shell.nav.articles"
    :back="{ label: shell.nav.articles, to: '/articulos' }"
  />
  <Placeholder v-else :title="shell.nav.articles" :count="options?.articles.length ?? null" />
</template>
