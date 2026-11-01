<script setup lang="ts">
/**
 * Lo que hay que revisar antes de guardar, todo junto arriba del formulario: cada mensaje lleva a su
 * campo (abre su sección). Cubre también las rutas que no tienen un campo a la vista.
 */
import type { FieldIssue } from '@shared/adminContracts'
import { collections } from './dict'

defineProps<{ issues: readonly FieldIssue[] }>()
defineEmits<{ go: [path: string] }>()

const t = collections.errors
</script>

<template>
  <section :aria-label="t.title(issues.length)" class="grid max-w-[760px] animate-enter gap-2.5 border-y border-rule py-5">
    <h2 class="m-0 flex items-center gap-2.5 text-row text-ink">
      <span class="size-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
      {{ t.title(issues.length) }}
    </h2>
    <ul class="m-0 grid list-none gap-1 p-0">
      <li v-for="issue in issues" :key="issue.path">
        <button
          type="button"
          class="rounded-control border-0 bg-transparent p-0 text-left text-body text-dim underline decoration-rule-strong underline-offset-4 transition-colors duration-120 ease-e hover:text-ink hover:decoration-ink"
          @click="$emit('go', issue.path)"
        >
          {{ issue.message }}
        </button>
      </li>
    </ul>
  </section>
</template>
