<script setup lang="ts">
/** #/empresas[/:id], provisorio hasta U3. */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { shell } from '../../shell/dict'
import Placeholder from '../../shell/Placeholder.vue'
import { useRecordTitle } from '../../shell/title'
import { options } from '../../stores/meta'

const route = useRoute()
const record = computed(() => options.value?.orgs.find(o => o.id === Number(route.params['id']))?.name ?? null)
useRecordTitle(record)
</script>

<template>
  <Placeholder
    v-if="route.params['id']"
    :title="record ?? shell.nav.orgs"
    :back="{ label: shell.nav.orgs, to: '/empresas' }"
  />
  <Placeholder v-else :title="shell.nav.orgs" :count="options?.orgs.length ?? null" />
</template>
