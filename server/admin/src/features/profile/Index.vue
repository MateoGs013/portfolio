<script setup lang="ts">
/** #/perfil/sobre-mi y #/perfil/contacto, provisorio hasta U4. */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { shell } from '../../shell/dict'
import Placeholder from '../../shell/Placeholder.vue'
import { useRecordTitle } from '../../shell/title'

const route = useRoute()
const record = computed(() => (route.params['doc'] === 'contacto' ? shell.nav.contact : shell.nav.about))
useRecordTitle(record)
</script>

<template>
  <Placeholder :title="record" />
</template>
