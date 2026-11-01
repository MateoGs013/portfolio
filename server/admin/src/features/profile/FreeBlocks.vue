<script setup lang="ts">
/**
 * Los bloques libres del documento: datos de más que se leen en el registro del sitio (R). Cada uno
 * tiene nombre editable, tipo (texto corto, texto largo o lista), su texto en los dos idiomas y
 * «Quitar». Quitar y agregar se aplican al guardar; Descartar devuelve lo que había.
 */
import { computed, nextTick } from 'vue'
import { controlFor } from '../collections/paths'
import BilingualField from '../collections/BilingualField.vue'
import { useEditorContext } from '../collections/context'
import Button from '../../ui/Button.vue'
import Field from '../../ui/Field.vue'
import type { SelectOption } from '../../ui/field'
import IconButton from '../../ui/IconButton.vue'
import Select from '../../ui/Select.vue'
import TextInput from '../../ui/TextInput.vue'
import { announce } from '../../ui/announce'
import { profile } from './dict'
import { blankFree, blockName, isFreeType, readableName, type FreeForm, type FreeType } from './model'

const blocks = defineModel<FreeForm[]>({ required: true })

const t = profile.free
const editor = useEditorContext()
const locked = computed(() => editor?.busy.value ?? false)
const types: SelectOption<FreeType>[] = (Object.keys(t.types) as FreeType[]).map(value => ({ value, label: t.types[value] }))

const titleOf = (block: FreeForm) => readableName(block.name) || t.untitled

function update(index: number, patch: Partial<FreeForm>): void {
  blocks.value = blocks.value.map((block, i) => (i === index ? { ...block, ...patch } : block))
}

/** Al salir del nombre queda como lo acepta la base: «Horario de atención» → horario_de_atencion. */
function tidyName(index: number): void {
  const block = blocks.value[index]
  if (!block) return
  const name = blockName(block.name)
  if (name !== block.name) update(index, { name })
}

function setType(index: number, type: FreeType | null): void {
  if (type && isFreeType(type)) update(index, { type })
}

async function add(): Promise<void> {
  blocks.value = [...blocks.value, blankFree()]
  announce(t.added)
  await nextTick()
  controlFor(`free[${blocks.value.length - 1}].name`)?.focus()
}

function remove(index: number): void {
  const block = blocks.value[index]
  if (!block) return
  blocks.value = blocks.value.filter((_, i) => i !== index)
  announce(t.removed(titleOf(block)))
}
</script>

<template>
  <section aria-labelledby="free-blocks-title" class="grid gap-7 border-t border-rule pt-10">
    <div class="grid gap-2">
      <h2 id="free-blocks-title" class="m-0 text-title">
        {{ t.title }}
      </h2>
      <p class="m-0 max-w-[60ch] text-body text-dim">
        {{ t.lead }}
      </p>
    </div>
    <p v-if="!blocks.length" class="m-0 text-body text-faint">
      {{ t.empty }}
    </p>
    <ul v-else class="m-0 grid list-none gap-12 p-0">
      <li
        v-for="(block, index) in blocks"
        :key="block.uid"
        :data-field="`free[${index}]`"
        class="grid animate-enter gap-7"
      >
        <div class="flex items-start gap-6">
          <div class="grid min-w-0 flex-1 items-start gap-x-10 gap-y-7 sm:grid-cols-[minmax(0,1fr)_14rem]">
            <Field
              :data-field="`free[${index}].name`"
              :label="t.name"
              :hint="t.nameHint"
              :error="editor?.messageFor(`free[${index}].name`) ?? null"
            >
              <TextInput
                :model-value="block.name"
                mono
                autocomplete="off"
                :readonly="locked"
                @update:model-value="update(index, { name: $event })"
                @blur="tidyName(index)"
              />
            </Field>
            <Field :data-field="`free[${index}].type`" :label="t.type" :error="editor?.messageFor(`free[${index}].type`) ?? null">
              <Select
                :model-value="block.type"
                :options="types"
                :placeholder="false"
                :disabled="locked"
                @update:model-value="setType(index, $event)"
              />
            </Field>
          </div>
          <IconButton icon="trash" :label="t.remove(titleOf(block))" :disabled="locked" class="mt-8 shrink-0" @click="remove(index)" />
        </div>
        <BilingualField
          :es="block.value"
          :en="block.en"
          :label="titleOf(block)"
          :path="`free[${index}].value`"
          :en-path="`free[${index}].en`"
          :kind="block.type === 'string' ? 'text' : 'prose'"
          :rows="block.type === 'list' ? 3 : 4"
          :max="block.type === 'text' ? 4000 : null"
          @update:es="update(index, { value: $event })"
          @update:en="update(index, { en: $event })"
        />
      </li>
    </ul>
    <div>
      <Button icon="plus" :disabled="locked" @click="add">
        {{ t.add }}
      </Button>
    </div>
  </section>
</template>
