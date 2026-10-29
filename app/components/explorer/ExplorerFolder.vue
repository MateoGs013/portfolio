<script setup lang="ts">
import type { Folder } from '~/lib/explorer'
import ExplorerDossier from './dossier/ExplorerDossier.vue'
import ExplorerHome from './home/ExplorerHome.vue'
import ExplorerCollection from './collection/ExplorerCollection.vue'

defineProps<{
  folder: Folder
}>()

const uid = useId()
const { isHyperfocus } = useHyperfocus()
</script>

<template>
  <section class="carpeta max-w-[1140px] mx-auto w-full" :aria-labelledby="uid">
    <!-- 1. MODO HIPERFOCO: DOSSIER EJECUTIVO LINEAR 2026 -->
    <ExplorerDossier
      v-if="folder.head === 'db' && isHyperfocus"
      key="db-hyperfocus"
      :folder="folder"
    />

    <!-- 2. INICIO: DASHBOARD EDITORIAL SWISS (AWWWARDS 2026) -->
    <ExplorerHome
      v-else-if="folder.head === 'db'"
      key="db-poster"
      :folder="folder"
    />

    <!-- 3. COLECCIONES: VISTA DE CARPETA (folder.head !== 'db') -->
    <ExplorerCollection
      v-else
      key="collection"
      :folder="folder"
      :uid="uid"
    />
  </section>
</template>
