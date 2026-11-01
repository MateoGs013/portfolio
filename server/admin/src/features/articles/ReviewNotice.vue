<script setup lang="ts">
/**
 * El aviso de un borrador que armó «Publicar en el blog» (Búsqueda laboral · Publicaciones): qué
 * revisar antes de publicarlo. Se cierra con «Entendido» y no vuelve mientras dure el editor.
 */
import Button from '../../ui/Button.vue'
import { articles } from './dict'

defineEmits<{ dismiss: [] }>()

const t = articles.review
</script>

<template>
  <section :aria-label="t.title" class="mb-10 grid animate-enter gap-3 border-y border-rule py-5">
    <div class="grid gap-1">
      <h2 class="m-0 flex items-center gap-2.5 text-row text-ink">
        <span class="size-1.5 shrink-0 rounded-full bg-wip" aria-hidden="true" />
        {{ t.title }}
      </h2>
      <p class="m-0 max-w-[68ch] text-body text-dim">
        {{ t.text }}
      </p>
    </div>
    <div>
      <Button variant="ghost" @click="$emit('dismiss')">
        {{ t.dismiss }}
      </Button>
    </div>
  </section>
</template>
