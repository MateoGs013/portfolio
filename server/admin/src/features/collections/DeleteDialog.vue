<script setup lang="ts">
/**
 * Eliminar un registro. Si la colección lo admite (empresas y tecnologías), primero pide
 * GET /:id/impact y lista lo que lo usa, con la opción de pasárselo a otro registro (DELETE
 * ?reassignTo=) o dejarlo sin este dato. El foco empieza en Cancelar; mientras borra, no se cierra.
 */
import type { AdminImpact, DeleteResult, ImpactItem } from '@shared/adminContracts'
import { computed, ref, shallowRef, watch } from 'vue'
import { api } from '../../api/client'
import { messageOf } from '../../api/errors'
import { forgetRecord, readCollection } from '../../composables/useCollection'
import { phrases } from '../../models/labels'
import type { AdminRecord, AnyModel } from '../../models/types'
import { toast } from '../../stores/toasts'
import Button from '../../ui/Button.vue'
import Dialog from '../../ui/Dialog.vue'
import { ui } from '../../ui/dict'
import Field from '../../ui/Field.vue'
import type { SelectOption } from '../../ui/field'
import Select from '../../ui/Select.vue'
import Skeleton from '../../ui/Skeleton.vue'
import { collections } from './dict'

const props = defineProps<{
  model: AnyModel
  record: AdminRecord
}>()

const emit = defineEmits<{ deleted: [result: DeleteResult | null] }>()
const open = defineModel<boolean>('open', { default: false })

const t = collections.remove
const say = computed(() => phrases(props.model.noun))
const impact = shallowRef<AdminImpact | null>(null)
const others = shallowRef<SelectOption<number>[]>([])
const target = ref<number | null>(0)
const loading = ref(false)
const removing = ref(false)
const problem = ref('')

const groups = computed(() => {
  const found = impact.value
  if (!found) return []
  const all: [string, ImpactItem[]][] = [[t.projects, found.projects], [t.experiences, found.experiences], [t.articles, found.articles]]
  return all.filter(([, items]) => items.length)
})

async function inspect(): Promise<void> {
  impact.value = null
  problem.value = ''
  target.value = 0
  if (!props.model.impact) return
  loading.value = true
  try {
    const [found, list] = await Promise.all([
      api.get<AdminImpact>(`${props.model.path}/${props.record.id}/impact`),
      readCollection(props.model),
    ])
    impact.value = found
    others.value = [
      { value: 0, label: t.reassignNone },
      ...list.filter(r => r.id !== props.record.id).map(r => ({ value: r.id, label: props.model.title(r) })),
    ]
  }
  catch (err) {
    problem.value = messageOf(err)
  }
  finally {
    loading.value = false
  }
}

watch(open, (value) => {
  if (value) void inspect()
}, { immediate: true })

async function remove(): Promise<void> {
  removing.value = true
  problem.value = ''
  try {
    const reassignTo = impact.value?.total && target.value ? target.value : undefined
    const result = await api.delete<DeleteResult | null>(`${props.model.path}/${props.record.id}`, { query: { reassignTo } })
    forgetRecord(props.model.path, props.record.id)
    toast(result?.moved ? `${say.value.deleted}. ${t.moved(result.moved)}` : say.value.deleted)
    open.value = false
    emit('deleted', result)
  }
  catch (err) {
    problem.value = messageOf(err)
  }
  finally {
    removing.value = false
  }
}
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="say.removeTitle"
    :description="model.title(record)"
    initial-focus="[data-cancel]"
    :dismissible="false"
    :locked="removing"
  >
    <div class="grid gap-5">
      <Skeleton v-if="loading" variant="text" :count="3" />
      <template v-else-if="impact">
        <p v-if="!impact.total" class="m-0 text-body text-dim">
          {{ t.nothing }}
        </p>
        <template v-else>
          <p class="m-0 text-body text-ink">
            {{ t.uses(impact.total) }}
          </p>
          <div v-for="[group, items] in groups" :key="group" class="grid gap-1.5">
            <h3 class="m-0 text-label font-[420] text-dim">
              {{ group }}
            </h3>
            <ul class="m-0 grid list-none gap-1 p-0">
              <li v-for="item in items" :key="item.id" class="border-b border-rule pb-1.5 text-body text-ink">
                {{ item.title }}
              </li>
            </ul>
          </div>
          <Field :label="t.reassign" :hint="t.reassignHint">
            <Select v-model="target" :options="others" :placeholder="false" :disabled="removing" />
          </Field>
        </template>
      </template>
      <p class="m-0 text-label text-faint">
        {{ t.irreversible }}
      </p>
      <p v-if="problem" role="alert" class="m-0 text-label text-danger">
        {{ problem }}
      </p>
    </div>
    <template #footer>
      <Button data-cancel :disabled="removing" @click="open = false">
        {{ ui.actions.cancel }}
      </Button>
      <Button variant="danger" :loading="removing" :disabled="loading || (!!model.impact && !impact)" :loading-label="say.removeTitle" @click="remove">
        {{ say.removeTitle }}
      </Button>
    </template>
  </Dialog>
</template>
