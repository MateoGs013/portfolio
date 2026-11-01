<script setup lang="ts">
/** #/tecnologias[/:id], provisorio hasta U3. */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { shell } from '../../shell/dict'
import Placeholder from '../../shell/Placeholder.vue'
import { useRecordTitle } from '../../shell/title'
import { options } from '../../stores/meta'

const route = useRoute()
const record = computed(() => options.value?.techs.find(t => t.id === Number(route.params['id']))?.name ?? null)
useRecordTitle(record)
</script>

<template>
  <Placeholder
    v-if="route.params['id']"
    :title="record ?? shell.nav.stack"
    :back="{ label: shell.nav.stack, to: '/tecnologias' }"
  />
  <Placeholder v-else :title="shell.nav.stack" :count="options?.techs.length ?? null" />
</template>
