<script setup lang="ts">
/**
 * Las dos regiones aria-live del admin, montadas desde el arranque (una región que aparece junto con
 * su mensaje no se lee). Lo que se dice llega por announce() en ui/announce.ts.
 */
import { announcements } from './announce'
import { layerTarget } from './topLayer'
</script>

<template>
  <!-- Con un diálogo modal abierto, lo de afuera es inerte: las regiones viajan adentro. -->
  <Teleport :to="layerTarget">
    <div class="sr-only">
      <div aria-live="polite" aria-atomic="true" data-announcer="polite">
        {{ announcements.polite }}
      </div>
      <div aria-live="assertive" aria-atomic="true" data-announcer="assertive">
        {{ announcements.assertive }}
      </div>
    </div>
  </Teleport>
</template>
