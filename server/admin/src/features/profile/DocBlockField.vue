<script setup lang="ts">
/**
 * Un bloque fijo del documento con su rótulo y su ayuda del esquema, nunca con su nombre técnico ni
 * su tipo, y sin control para quitarlo:
 * - texto corto, texto largo y lista: español e inglés (BilingualField), la lista un elemento por renglón;
 * - email y dirección web: un solo valor, «Igual en los dos idiomas»;
 * - PDF del CV: un archivo por idioma (CvPathField).
 * Si la base todavía no lo tiene, «Falta completar»: se crea al guardarlo con algo escrito.
 */
import type { DocBlock } from '@shared/docSchema'
import { computed } from 'vue'
import Field from '../../ui/Field.vue'
import StatusDot from '../../ui/StatusDot.vue'
import TextInput from '../../ui/TextInput.vue'
import BilingualField from '../collections/BilingualField.vue'
import { useEditorContext } from '../collections/context'
import CvPathField from './CvPathField.vue'
import { profile } from './dict'
import type { BlockForm } from './model'

const props = defineProps<{
  block: DocBlock
  /** La base todavía no tiene este bloque. */
  missing: boolean
}>()

const model = defineModel<BlockForm>({ required: true })

const editor = useEditorContext()
const locked = computed(() => editor?.busy.value ?? false)
const path = computed(() => `fields.${props.block.name}`)
const translated = computed(() => ['string', 'text', 'list'].includes(props.block.type))
const prose = computed(() => props.block.type === 'text' || props.block.type === 'list')
const rows = computed(() => (props.block.type === 'list' ? Math.max(2, model.value.value.split('\n').length) : 4))
const empty = computed(() => !model.value.value.trim() && !model.value.en.trim())

const es = computed({
  get: () => model.value.value,
  set: (value: string) => (model.value = { ...model.value, value }),
})
const en = computed({
  get: () => model.value.en,
  set: (value: string) => (model.value = { ...model.value, en: value }),
})
</script>

<template>
  <div :data-field="path" class="grid gap-3">
    <p v-if="missing && empty" class="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <StatusDot tone="wip" :label="profile.missing" strong />
      <span class="text-label text-faint">{{ profile.missingHint }}</span>
    </p>
    <BilingualField
      v-if="translated"
      v-model:es="es"
      v-model:en="en"
      :label="block.label"
      :hint="block.help"
      :path="`${path}.value`"
      :en-path="`${path}.en`"
      :kind="prose ? 'prose' : 'text'"
      :rows="rows"
      :max="block.type === 'text' ? 4000 : null"
    />
    <CvPathField
      v-else-if="block.type === 'localizedPath'"
      v-model:es="es"
      v-model:en="en"
      :block="block"
    />
    <Field
      v-else
      :data-field="`${path}.value`"
      :label="block.label"
      :hint="block.help"
      :error="editor?.messageFor(`${path}.value`) ?? null"
    >
      <template #aux>
        <span>{{ profile.same }}</span>
      </template>
      <TextInput
        v-model="es"
        :type="block.type === 'email' ? 'email' : 'url'"
        :inputmode="block.type === 'email' ? 'email' : 'url'"
        :autocomplete="block.type === 'email' ? 'email' : 'url'"
        :mono="block.type === 'url'"
        :readonly="locked"
      />
    </Field>
  </div>
</template>
