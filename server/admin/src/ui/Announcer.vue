<script setup lang="ts">
/**
 * Las dos regiones aria-live del admin, montadas desde el arranque (una región que aparece junto con
 * su mensaje no se lee). Lo que se dice llega por announce() en ui/announce.ts.
 */
import { announcements } from './announce'
</script>

<template>
  <div class="sr-only">
    <div aria-live="polite" aria-atomic="true" data-announcer="polite">
      {{ announcements.polite }}
    </div>
    <div aria-live="assertive" aria-atomic="true" data-announcer="assertive">
      {{ announcements.assertive }}
    </div>
  </div>
</template>
