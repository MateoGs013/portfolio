<script setup lang="ts">
/** La oferta de un borrador que quedó sin guardar: «Recuperar cambios del 05/11 14:02» o descartarlo. */
import type { DraftOffer } from '../../composables/useDraft'
import Button from '../../ui/Button.vue'
import { collections, shortStamp } from './dict'

defineProps<{ offer: DraftOffer }>()
defineEmits<{ recover: [], dismiss: [] }>()

const t = collections.draft
</script>

<template>
  <section
    :aria-label="t.title"
    class="grid max-w-[760px] animate-enter gap-3 border-y border-rule py-5"
  >
    <div class="grid gap-1">
      <h2 class="m-0 flex items-center gap-2.5 text-row text-ink">
        <span class="size-1.5 shrink-0 rounded-full bg-wip" aria-hidden="true" />
        {{ t.title }}
      </h2>
      <p class="m-0 text-body text-dim">
        {{ t.text }}
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <Button @click="$emit('recover')">
        {{ t.recover(shortStamp(offer.savedAt)) }}
      </Button>
      <Button variant="ghost" @click="$emit('dismiss')">
        {{ t.dismiss }}
      </Button>
    </div>
  </section>
</template>
