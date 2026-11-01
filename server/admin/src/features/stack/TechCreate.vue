<script setup lang="ts">
/**
 * «Nueva tecnología» desde la lista: lo que la base pide para crearla (nombre, categoría y desde qué
 * año), con las mismas reglas que el servidor. Creada, se abre su ficha para el criterio y el color.
 */
import { computed, reactive } from 'vue'
import { fieldOf } from '../../models/validate'
import { enumOptions } from '../../stores/meta'
import Field from '../../ui/Field.vue'
import type { SelectOption } from '../../ui/field'
import Select from '../../ui/Select.vue'
import TextInput from '../../ui/TextInput.vue'
import CatalogCreate from '../orgs/CatalogCreate.vue'
import { stack } from './dict'
import { sinceIssues, techModel, yearOf } from './model'

const open = defineModel<boolean>('open', { default: false })

const thisYear = new Date().getFullYear()
const draft = reactive({ name: '', category: null as string | null, since: String(thisYear) })
const field = (name: string) => fieldOf('Tech', name)
const categories = computed<SelectOption<string>[]>(() => enumOptions('TechCategory').map(o => ({ value: o.value, label: o.label })))
const dirty = computed(() => !!draft.name.trim() || draft.category !== null || draft.since !== String(thisYear))

function reset(): void {
  Object.assign(draft, { name: '', category: null, since: String(thisYear) })
}

function payload(): Record<string, unknown> {
  return { name: draft.name.trim(), category: draft.category, since: yearOf(draft.since) }
}
</script>

<template>
  <CatalogCreate
    v-model:open="open"
    :model="techModel"
    :description="stack.createText"
    :fields="['name', 'category', 'since']"
    :dirty="dirty"
    :payload="payload"
    :validate="() => sinceIssues(draft.since)"
    @reset="reset"
  >
    <template #default="{ messageFor, busy }">
      <Field
        data-initial
        :label="field('name')?.label ?? ''"
        :hint="field('name')?.help"
        :error="messageFor('name')"
        required
      >
        <TextInput v-model="draft.name" :readonly="busy" autocomplete="off" />
      </Field>
      <div class="grid items-start gap-8.5 sm:grid-cols-[minmax(0,1fr)_10rem] sm:gap-x-8">
        <Field :label="field('category')?.label ?? ''" :hint="field('category')?.help" :error="messageFor('category')" required>
          <Select v-model="draft.category" :options="categories" :disabled="busy" />
        </Field>
        <Field :label="field('since')?.label ?? ''" :hint="stack.fields.sinceShort(thisYear)" :error="messageFor('since')" required>
          <TextInput v-model="draft.since" inputmode="numeric" autocomplete="off" :readonly="busy" />
        </Field>
      </div>
    </template>
  </CatalogCreate>
</template>
