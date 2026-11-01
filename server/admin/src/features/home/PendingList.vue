<script setup lang="ts">
/**
 * La bandeja agrupada por tipo (PDF del CV, sin publicar, imágenes, inglés, métricas, CV, perfil):
 * cada grupo con su cifra y sus filas-enlace, que llevan al campo exacto (`?campo=`). El escalonado
 * sigue de un grupo al siguiente, así la pantalla entra como una sola lista.
 */
import { computed } from 'vue'
import { home, PENDING_GROUPS } from './dict'
import PendingRow from './PendingRow.vue'
import type { PendingGroup } from './usePending'

const props = defineProps<{ groups: PendingGroup[] }>()

const tones = Object.fromEntries(PENDING_GROUPS.map(g => [g.id, g.tone]))

/** El primer índice de cada grupo dentro de la pantalla entera. */
const offsets = computed(() => props.groups.reduce<number[]>((acc, g, i) => [...acc, i === 0 ? 0 : acc[i - 1]! + props.groups[i - 1]!.items.length + 1], []))
</script>

<template>
  <div class="grid gap-11">
    <section v-for="(group, g) in groups" :key="group.id" :aria-labelledby="`pendientes-${group.id}`" :data-group="group.id">
      <h3
        :id="`pendientes-${group.id}`"
        class="m-0 flex animate-rise items-baseline gap-2.5 stagger text-row font-[560]"
        :style="{ '--i': Math.min(offsets[g] ?? 0, 14) }"
        :aria-label="home.pending.group(group.label, group.items.length)"
      >
        {{ group.label }}
        <span class="text-label font-[420] text-faint tabular-nums" aria-hidden="true">{{ group.items.length }}</span>
      </h3>
      <ul class="group/list m-0 mt-2 list-none border-t border-rule p-0">
        <PendingRow
          v-for="(item, i) in group.items"
          :key="`${item.kind}:${item.route}`"
          :to="item.route"
          :headline="item.headline"
          :message="item.message"
          :tone="tones[group.id] ?? 'neutral'"
          :index="(offsets[g] ?? 0) + i + 1"
          :data-kind="item.kind"
          :data-pending-field="item.field"
        />
      </ul>
    </section>
  </div>
</template>
