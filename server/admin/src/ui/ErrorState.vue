<script setup lang="ts">
/**
 * No se pudo cargar: qué pasó en español (el mensaje del error clasificado) y Reintentar. Se anuncia
 * al aparecer (role=alert) y no se va solo.
 */
import Button from './Button.vue'
import { ui } from './dict'

withDefaults(defineProps<{
  title?: string
  message: string
  retrying?: boolean
  /** Sin botón cuando reintentar no sirve (por ejemplo, un registro que ya no existe). */
  retry?: boolean
}>(), { title: ui.states.errorTitle, retrying: false, retry: true })

defineEmits<{ retry: [] }>()
</script>

<template>
  <div role="alert" class="grid max-w-[60ch] gap-3 border-t border-rule py-10">
    <h2 class="m-0 flex items-center gap-2.5 text-title">
      <span class="size-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
      {{ title }}
    </h2>
    <p class="m-0 text-lead text-dim">
      {{ message }}
    </p>
    <div class="mt-3 flex flex-wrap gap-2">
      <Button v-if="retry" :loading="retrying" :loading-label="ui.states.loading" @click="$emit('retry')">
        {{ ui.actions.retry }}
      </Button>
      <slot />
    </div>
  </div>
</template>
