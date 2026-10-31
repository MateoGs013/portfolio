<script setup lang="ts">
/**
 * Raíz del admin nuevo. Monta desde el arranque las regiones vivas, los avisos y las confirmaciones.
 * La navegación y las vistas llegan con el shell (A1); hasta entonces esta pantalla manda al panel
 * actual. El Muestrario (#/muestrario) existe solo en desarrollo: el build lo deja afuera.
 */
import { defineAsyncComponent, onBeforeUnmount, ref } from 'vue'
import Announcer from './ui/Announcer.vue'
import Button from './ui/Button.vue'
import ConfirmHost from './ui/ConfirmHost.vue'
import { ui } from './ui/dict'
import Toaster from './ui/Toaster.vue'

const Muestrario = import.meta.env.DEV ? defineAsyncComponent(() => import('./ui/Muestrario.vue')) : null

const hash = ref(location.hash)
const onHash = () => (hash.value = location.hash)
addEventListener('hashchange', onHash)
onBeforeUnmount(() => removeEventListener('hashchange', onHash))

const showMuestrario = () => !!Muestrario && hash.value.startsWith('#/muestrario')
</script>

<template>
  <component :is="Muestrario" v-if="Muestrario && showMuestrario()" />
  <main v-else class="grid min-h-dvh content-center px-4 py-14 sm:px-16">
    <div class="grid max-w-[1080px] gap-5">
      <p class="m-0 text-label text-faint">
        {{ ui.app.name }} · {{ ui.app.area }}
      </p>
      <h1 class="m-0 animate-rise text-display">
        {{ ui.app.building }}
      </h1>
      <p class="m-0 max-w-[60ch] animate-rise text-lead text-dim stagger [--i:2]">
        {{ ui.app.buildingText }}
      </p>
      <div class="mt-4 flex animate-rise flex-wrap gap-2 stagger [--i:4]">
        <Button variant="primary" size="lg" href="/admin/">
          {{ ui.app.openCurrent }}
        </Button>
      </div>
    </div>
  </main>
  <Announcer />
  <Toaster />
  <ConfirmHost />
</template>
