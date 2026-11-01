<script setup lang="ts">
/**
 * Los bloques fijos del documento en grupos con título (Presentación, Retrato…), en el orden del
 * esquema que manda GET /docs/:key. Un bloque que el esquema sume y ningún grupo nombre va al final,
 * en «Otros datos»: el formulario nunca deja un bloque fijo sin control. Cada grupo entra escalonado.
 * El slot #block deja que el formulario dibuje a su modo un bloque (el retrato); sin él, DocBlockField.
 */
import type { DocBlock } from '@shared/docSchema'
import { computed } from 'vue'
import DocBlockField from './DocBlockField.vue'
import { profile, type FormGroup } from './dict'
import type { DocEditor } from './useDocEditor'

const props = withDefaults(defineProps<{
  editor: DocEditor
  groups: readonly FormGroup[]
  /** Bloques que dibuja otro (la descripción del retrato va con el retrato). */
  within?: readonly string[]
}>(), { within: () => [] })

defineSlots<{ block?: (scope: { block: DocBlock }) => unknown }>()

interface Shown {
  id: string
  title: string
  blocks: DocBlock[]
}

const shown = computed<Shown[]>(() => {
  const schema = props.editor.record.value?.schema ?? []
  const byName = new Map(schema.filter(b => !props.within.includes(b.name)).map(b => [b.name, b]))
  const placed = new Set(props.groups.flatMap(g => g.blocks))
  const out = props.groups
    .map(g => ({ id: g.id, title: g.title, blocks: g.blocks.map(name => byName.get(name)).filter((b): b is DocBlock => !!b) }))
    .filter(g => g.blocks.length)
  const rest = schema.filter(b => !placed.has(b.name) && byName.has(b.name))
  return rest.length ? [...out, { id: 'otros', title: profile.otherGroup, blocks: rest }] : out
})

const EMPTY = { value: '', en: '' } as const

const missing = computed(() => new Set(props.editor.record.value?.missing ?? []))
</script>

<template>
  <section
    v-for="(group, index) in shown"
    :key="group.id"
    :aria-labelledby="`grupo-${group.id}`"
    class="grid animate-rise gap-8.5 stagger"
    :style="{ '--i': index + 1 }"
  >
    <h2 :id="`grupo-${group.id}`" class="m-0 text-title">
      {{ group.title }}
    </h2>
    <template v-for="block in group.blocks" :key="block.name">
      <slot name="block" :block="block">
        <DocBlockField
          :model-value="editor.form.value.fields[block.name] ?? EMPTY"
          :block="block"
          :missing="missing.has(block.name)"
          @update:model-value="editor.setBlock(block.name, $event)"
        />
      </slot>
    </template>
  </section>
</template>
