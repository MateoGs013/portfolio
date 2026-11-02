<script setup lang="ts">
/**
 * Raíz del admin nuevo: la vista de la ruta dentro del shell (o sola, el ingreso y el Muestrario),
 * la reautenticación y, desde el arranque, las regiones vivas, los avisos y las confirmaciones.
 */
import { onBeforeUnmount } from 'vue'
import { RouterView } from 'vue-router'
import { installShortcuts } from './composables/useShortcuts'
import AppShell from './shell/AppShell.vue'
import ReauthDialog from './shell/ReauthDialog.vue'
import Announcer from './ui/Announcer.vue'
import ConfirmHost from './ui/ConfirmHost.vue'
import Toaster from './ui/Toaster.vue'

onBeforeUnmount(installShortcuts())
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <component :is="Component" v-if="route.meta.bare" />
    <AppShell v-else>
      <component :is="Component" />
    </AppShell>
  </RouterView>
  <ReauthDialog />
  <Announcer />
  <Toaster />
  <ConfirmHost />
</template>
