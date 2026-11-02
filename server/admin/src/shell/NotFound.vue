<script setup lang="ts">
/** Una dirección del admin que no existe: lo dice y lleva al inicio. */
import Button from '../ui/Button.vue'
import { shell } from './dict'
</script>

<template>
  <section class="px-4 pt-10 pb-20 md:px-10 md:pt-12 xl:px-16 xl:pt-14">
    <h1 class="m-0 max-w-[1080px] animate-rise text-display text-balance">
      {{ shell.notFound.title }}
    </h1>
    <p class="mt-3.5 mb-0 max-w-[60ch] animate-rise text-lead text-dim stagger [--i:2]">
      {{ shell.notFound.text }}
    </p>
    <div class="mt-8 animate-rise stagger [--i:3]">
      <Button href="#/inicio" variant="primary">
        {{ shell.notFound.home }}
      </Button>
    </div>
  </section>
</template>
