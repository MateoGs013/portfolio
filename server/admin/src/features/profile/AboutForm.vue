<script setup lang="ts">
/**
 * Sobre mí: los bloques fijos del esquema en sus grupos, el retrato con su subida y su descripción
 * en los dos idiomas (el bloque de imagen trae consigo el que se llama como él con `_alt`), y los
 * bloques libres al final.
 */
import type { DocBlock } from '@shared/docSchema'
import { computed } from 'vue'
import DocBlockField from './DocBlockField.vue'
import DocGroups from './DocGroups.vue'
import FreeBlocks from './FreeBlocks.vue'
import PortraitField from './PortraitField.vue'
import { profile } from './dict'
import type { DocEditor } from './useDocEditor'

const props = defineProps<{ editor: DocEditor }>()

const EMPTY = { value: '', en: '' } as const
const schema = computed(() => props.editor.record.value?.schema ?? [])
const image = computed(() => schema.value.find(b => b.type === 'image') ?? null)
const altBlock = computed(() => (image.value ? schema.value.find(b => b.name === `${image.value!.name}_alt`) ?? null : null))
const missing = computed(() => new Set(props.editor.record.value?.missing ?? []))

/** La ruta guardada de la imagen (la API la manda tal cual, sin inglés). */
function srcOf(block: DocBlock): string {
  const value = props.editor.record.value?.fields.find(f => f.name === block.name)?.value
  return typeof value === 'string' ? value : ''
}

const fieldOf = (name: string) => props.editor.form.value.fields[name] ?? EMPTY
</script>

<template>
  <div class="grid gap-16">
    <DocGroups :editor="editor" :groups="profile.docs.about.groups" :within="altBlock ? [altBlock.name] : []">
      <template #block="{ block }">
        <PortraitField
          v-if="block.type === 'image'"
          :block="block"
          :alt-block="altBlock"
          :src="srcOf(block)"
          :alt-missing="!!altBlock && missing.has(altBlock.name)"
          :alt="altBlock ? fieldOf(altBlock.name) : EMPTY"
          @update:alt="altBlock && editor.setBlock(altBlock.name, $event)"
          @uploaded="editor.adopt($event)"
        />
        <DocBlockField
          v-else
          :model-value="fieldOf(block.name)"
          :block="block"
          :missing="missing.has(block.name)"
          @update:model-value="editor.setBlock(block.name, $event)"
        />
      </template>
    </DocGroups>
    <FreeBlocks :model-value="editor.form.value.free" @update:model-value="editor.setFree($event)" />
  </div>
</template>
