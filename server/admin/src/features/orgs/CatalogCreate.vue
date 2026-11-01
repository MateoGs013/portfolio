<script setup lang="ts">
/**
 * El alta de un catálogo desde su lista («Nueva empresa», «Nueva tecnología»): un diálogo con lo que
 * la base pide para crearla (los campos llegan por el slot), validado con el esquema antes de mandar
 * y con los errores del servidor en su campo. Creada, el diálogo se cierra y se abre su ficha para
 * completar el resto. Mientras crea no se cierra; con algo escrito, tocar el fondo no lo descarta.
 */
import type { FieldIssue } from '@shared/adminContracts'
import { computed, ref, shallowRef, watch } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { api } from '../../api/client'
import { ApiError, FieldErrors, messageOf, SessionError } from '../../api/errors'
import { phrases } from '../../models/labels'
import type { AdminRecord, AnyModel } from '../../models/types'
import { validatePayload } from '../../models/validate'
import { toast } from '../../stores/toasts'
import Button from '../../ui/Button.vue'
import Dialog from '../../ui/Dialog.vue'
import { ui } from '../../ui/dict'
import { catalog } from './dict'

const props = defineProps<{
  model: AnyModel
  description: string
  /** El body del POST con lo escrito. */
  payload: () => Record<string, unknown>
  /** Reglas propias, además del esquema (el año de una tecnología). */
  validate?: () => FieldIssue[]
  /** Las rutas que muestra el slot: un error en otra ruta se muestra debajo de todo. */
  fields: readonly string[]
  /** Hay algo escrito: tocar el fondo no cierra. */
  dirty: boolean
}>()

const emit = defineEmits<{ reset: [] }>()
const open = defineModel<boolean>('open', { default: false })

const router = useRouter()
const say = computed(() => phrases(props.model.noun))
const formId = `crear-${props.model.key}`
const busy = ref(false)
const issues = shallowRef<FieldIssue[]>([])
const problem = ref('')
let next: RouteLocationRaw | null = null

/** La dirección sale del nombre: un error en `slug` (otra con el mismo nombre) se lee en el nombre. */
const pathOf = (path: string) => (path === 'slug' && !props.fields.includes('slug') ? 'name' : path)
function messageFor(path: string): string | null {
  return issues.value.find(issue => pathOf(issue.path) === path)?.message ?? null
}
const stray = computed(() => issues.value.filter(issue => !props.fields.includes(pathOf(issue.path))))

watch(open, (value) => {
  if (!value) return
  issues.value = []
  problem.value = ''
  next = null
  emit('reset')
})

// Al corregir un campo, su error se va (los demás quedan hasta el próximo intento).
watch(() => props.payload(), (now, before) => {
  if (!issues.value.length || !before) return
  const changed = (path: string) => JSON.stringify(now[path]) !== JSON.stringify(before[path])
  issues.value = issues.value.filter(issue => !changed(pathOf(issue.path)))
}, { deep: true })

async function submit(): Promise<void> {
  if (busy.value) return
  problem.value = ''
  const payload = props.payload()
  const found = [...validatePayload(props.model.schema, payload, { creating: true }), ...(props.validate?.() ?? [])]
  issues.value = found
  if (found.length) return
  busy.value = true
  try {
    const created = await api.post<AdminRecord>(props.model.path, payload)
    toast(say.value.created)
    next = props.model.routes.record(created.id)
    open.value = false
  }
  catch (err) {
    if (err instanceof FieldErrors) issues.value = err.issues
    // La dirección sale del nombre: otra con la misma dirección es otra con el mismo nombre.
    else if (err instanceof ApiError && err.code === 'conflict' && !props.fields.includes('slug')) issues.value = [{ path: 'name', message: catalog.create.taken(say.value.another) }]
    else if (!(err instanceof SessionError)) problem.value = messageOf(err)
  }
  finally {
    busy.value = false
  }
}

/** La ficha se abre recién cerrado el diálogo; al llegar, el foco va a su título. */
function onClose(): void {
  const to = next
  next = null
  if (to) void router.push(to)
}
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="say.create"
    :description="description"
    :dismissible="!dirty"
    :locked="busy"
    initial-focus="[data-initial] input, [data-initial] select"
    @close="onClose"
  >
    <form :id="formId" class="grid gap-8.5" novalidate :aria-busy="busy" @submit.prevent="submit">
      <slot :message-for="messageFor" :busy="busy" />
      <p class="m-0 text-label text-faint">
        {{ catalog.create.rest }}
      </p>
      <div v-if="stray.length || problem" role="alert" class="grid gap-1 text-label text-danger">
        <p v-for="issue in stray" :key="issue.path" class="m-0">
          {{ issue.message }}
        </p>
        <p v-if="problem" class="m-0">
          {{ problem }}
        </p>
      </div>
    </form>
    <template #footer>
      <Button :disabled="busy" @click="open = false">
        {{ ui.actions.cancel }}
      </Button>
      <Button variant="primary" type="submit" :form="formId" :loading="busy" :loading-label="catalog.create.creating">
        {{ catalog.create.submit }}
      </Button>
    </template>
  </Dialog>
</template>
