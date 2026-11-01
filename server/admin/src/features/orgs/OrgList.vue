<script setup lang="ts">
/**
 * Empresas como pantalla: filas grandes con la ciudad, el sitio y cuántas obras y experiencias la
 * nombran; filtros por uso y por ciudad (el CV la usa). «Nueva empresa» (o N, o ?nueva=1 desde la
 * paleta) pide el nombre y abre la ficha creada.
 */
import { computed, ref } from 'vue'
import { useCollection } from '../../composables/useCollection'
import { phrases } from '../../models/labels'
import { fieldOf } from '../../models/validate'
import Button from '../../ui/Button.vue'
import Field from '../../ui/Field.vue'
import TextInput from '../../ui/TextInput.vue'
import Explorer from '../collections/Explorer.vue'
import CatalogCreate from './CatalogCreate.vue'
import { orgs } from './dict'
import { orgModel, type AdminOrg } from './model'
import { useCatalogCreate } from './useCatalogCreate'

const { items } = useCollection<AdminOrg>(orgModel)
const creating = useCatalogCreate()
const say = phrases(orgModel.noun)
const nameField = computed(() => fieldOf('Org', 'name'))
const name = ref('')

const lead = computed(() => {
  const list = items.value ?? []
  return orgs.lead(list.length, list.filter(o => o._count.projects).length, list.filter(o => o._count.experiences).length)
})
</script>

<template>
  <Explorer :model="orgModel" :lead="lead">
    <template #actions>
      <Button variant="primary" icon="plus" shortcut="n" @click="creating = true">
        {{ say.create }}
      </Button>
    </template>
  </Explorer>
  <CatalogCreate
    v-model:open="creating"
    :model="orgModel"
    :description="orgs.createText"
    :fields="['name']"
    :dirty="!!name.trim()"
    :payload="() => ({ name: name.trim() })"
    @reset="name = ''"
  >
    <template #default="{ messageFor, busy }">
      <Field
        data-initial
        :label="nameField?.label ?? ''"
        :hint="nameField?.help"
        :error="messageFor('name')"
        required
      >
        <TextInput v-model="name" :readonly="busy" autocomplete="off" />
      </Field>
    </template>
  </CatalogCreate>
</template>
