<script setup lang="ts">
/**
 * Elegir una empresa o tecnologías con búsqueda, y crear la que falta sin salir del formulario:
 * combobox ARIA (↑↓ recorren, Enter elige, Esc cierra) que, si lo escrito no existe, ofrece
 * «Crear «Acme»». Una empresa se crea con el nombre; una tecnología pide además categoría y año. Lo
 * creado queda elegido y el cliente avisa la escritura ('write'), así /meta y las listas se ponen al día.
 * `multiple` elige varias (tecnologías de una obra) y las muestra como fichas que se quitan.
 */
import { computed, nextTick, ref } from 'vue'
import { messageOf } from '../../api/errors'
import { useId } from '../../composables/useId'
import { announce } from '../../ui/announce'
import Field from '../../ui/Field.vue'
import { lineControl, lineState } from '../../ui/field'
import Icon from '../../ui/Icon.vue'
import IconButton from '../../ui/IconButton.vue'
import Spinner from '../../ui/Spinner.vue'
import { useEditorContext } from './context'
import { collections } from './dict'
import InlineTechForm from './InlineTechForm.vue'
import { createInline, normalizeName, optionsFor, type InlineKind, type InlineOption, type TechExtra } from './inlineCreate'

const props = withDefaults(defineProps<{
  kind: InlineKind
  label: string
  hint?: string
  path: string
  multiple?: boolean
}>(), { multiple: false })

const model = defineModel<number | null | number[]>({ default: null })

const t = collections.inline
const editor = useEditorContext()
const locked = computed(() => editor?.busy.value ?? false)
const id = useId('combo')
const listId = `${id}-list`
const optionId = (i: number) => `${id}-opt-${i}`

const created = ref<InlineOption[]>([])
const all = computed(() => {
  const known = optionsFor(props.kind)
  return [...known, ...created.value.filter(c => !known.some(k => k.id === c.id))]
})
const chosen = computed<number[]>(() => (Array.isArray(model.value) ? model.value : model.value === null ? [] : [model.value]))
const chosenOptions = computed(() => chosen.value.map(v => all.value.find(o => o.id === v)).filter((o): o is InlineOption => !!o))

const query = ref('')
const editing = ref(false)
const open = ref(false)
const active = ref(0)
const input = ref<HTMLInputElement | null>(null)

type Entry = { type: 'option', option: InlineOption } | { type: 'create', name: string }
const entries = computed<Entry[]>(() => {
  const q = normalizeName(query.value)
  const found = all.value
    .filter(o => !(props.multiple && chosen.value.includes(o.id)))
    .filter(o => !q || normalizeName(o.name).includes(q))
    .slice(0, 8)
    .map(option => ({ type: 'option' as const, option }))
  const exact = all.value.some(o => normalizeName(o.name) === q)
  return q && !exact ? [...found, { type: 'create', name: query.value.trim() }] : found
})

const shown = computed(() => (editing.value || props.multiple ? query.value : (chosenOptions.value[0]?.name ?? '')))

function openList(): void {
  if (locked.value) return
  open.value = true
  active.value = Math.min(active.value, Math.max(0, entries.value.length - 1))
}

function close(): void {
  open.value = false
  editing.value = false
  query.value = ''
  active.value = 0
}

function onInput(event: Event): void {
  query.value = (event.target as HTMLInputElement).value
  editing.value = true
  active.value = 0
  openList()
}

function pick(option: InlineOption): void {
  model.value = props.multiple ? [...chosen.value, option.id] : option.id
  close()
}

function unpick(value: number): void {
  model.value = props.multiple ? chosen.value.filter(v => v !== value) : null
  input.value?.focus()
}

/* ── Crear ──────────────────────────────────────────────── */

const pendingName = ref('')
const creating = ref(false)
const problem = ref('')

async function create(name: string, extra?: TechExtra): Promise<void> {
  creating.value = true
  problem.value = ''
  try {
    const option = await createInline(props.kind, name, extra)
    created.value = [...created.value, option]
    pendingName.value = ''
    pick(option)
    announce(t.created(option.name))
    input.value?.focus()
  }
  catch (err) {
    problem.value = messageOf(err)
  }
  finally {
    creating.value = false
  }
}

function choose(entry: Entry | undefined): void {
  if (!entry) return
  if (entry.type === 'option') return pick(entry.option)
  close()
  if (props.kind === 'org') void create(entry.name)
  else pendingName.value = entry.name
}

async function onKeydown(event: KeyboardEvent): Promise<void> {
  const last = entries.value.length - 1
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!open.value) return openList()
    active.value = event.key === 'ArrowDown' ? Math.min(last, active.value + 1) : Math.max(0, active.value - 1)
    await nextTick()
    document.getElementById(optionId(active.value))?.scrollIntoView({ block: 'nearest' })
  }
  else if (event.key === 'Enter' && open.value) {
    event.preventDefault()
    choose(entries.value[active.value])
  }
  else if (event.key === 'Escape' && open.value) {
    event.preventDefault()
    event.stopPropagation()
    close()
  }
  else if (event.key === 'Backspace' && props.multiple && !query.value && chosen.value.length) {
    unpick(chosen.value[chosen.value.length - 1]!)
  }
}

/** El foco se fue del campo (Tab, un clic afuera): la lista se cierra sin elegir. */
function onFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null
  if (!next || !(event.currentTarget as HTMLElement).contains(next)) close()
}

const activeId = computed(() => (open.value && entries.value.length ? optionId(active.value) : undefined))
const error = computed(() => problem.value || editor?.messageFor(props.path) || null)
</script>

<template>
  <div class="grid gap-5">
    <Field :data-field="path" :label="label" :hint="hint" :error="error">
      <template #default="{ id: inputId, describedBy }">
        <div class="grid gap-3">
          <ul v-if="multiple && chosenOptions.length" class="m-0 flex list-none flex-wrap gap-1.5 p-0" :aria-label="label">
            <li v-for="option in chosenOptions" :key="option.id" class="inline-flex h-7 items-center gap-1 rounded-full border border-rule-strong bg-surface pr-0.5 pl-3 text-label text-ink">
              {{ option.name }}
              <IconButton icon="close" size="sm" :label="t.remove(option.name)" :disabled="locked" class="size-6" @click="unpick(option.id)" />
            </li>
          </ul>
          <div class="relative" @focusout="onFocusOut">
            <input
              :id="inputId"
              ref="input"
              type="text"
              role="combobox"
              autocomplete="off"
              aria-autocomplete="list"
              :aria-expanded="open"
              :aria-controls="listId"
              :aria-activedescendant="activeId"
              :aria-describedby="describedBy"
              :aria-invalid="!!error || undefined"
              :readonly="locked"
              :value="shown"
              :placeholder="multiple || !chosenOptions.length ? t.placeholder : undefined"
              :class="[lineControl, lineState(!!error), 'h-10 pr-8 text-field']"
              @input="onInput"
              @keydown="onKeydown"
              @click="openList"
            >
            <span class="absolute top-1/2 right-0 flex -translate-y-1/2 items-center text-faint">
              <Spinner v-if="creating" :live="false" :label="t.creating" />
              <IconButton v-else-if="!multiple && chosenOptions.length" icon="close" size="sm" :label="t.clear" :disabled="locked" @click="unpick(chosen[0]!)" />
              <Icon v-else name="chevron-down" :size="16" />
            </span>
            <ul
              v-show="open"
              :id="listId"
              role="listbox"
              :aria-label="label"
              class="absolute top-full right-0 left-0 z-30 m-0 mt-1.5 max-h-72 list-none overflow-auto rounded-control border border-rule-strong bg-surface-2 p-1 shadow-dialog"
            >
              <li
                v-for="(entry, index) in entries"
                :id="optionId(index)"
                :key="entry.type === 'option' ? entry.option.id : 'create'"
                role="option"
                :aria-selected="index === active"
                class="flex h-9 cursor-pointer items-center gap-2.5 rounded-[4px] px-2.5 text-body text-ink aria-selected:bg-surface"
                @pointerdown.prevent
                @click="choose(entry)"
                @pointermove="active = index"
              >
                <template v-if="entry.type === 'option'">
                  <span class="min-w-0 truncate">{{ entry.option.name }}</span>
                  <span v-if="entry.option.hint" class="ml-auto shrink-0 text-label text-faint">{{ entry.option.hint }}</span>
                </template>
                <template v-else>
                  <Icon name="plus" :size="16" class="text-dim" />
                  {{ t.create(entry.name) }}
                </template>
              </li>
              <li v-if="!entries.length" role="presentation" class="px-2.5 py-2 text-body text-faint">
                {{ t.empty }}
              </li>
            </ul>
          </div>
        </div>
      </template>
    </Field>
    <InlineTechForm
      v-if="pendingName"
      :name="pendingName"
      :busy="creating"
      @create="create(pendingName, $event)"
      @cancel="pendingName = ''; input?.focus()"
    />
  </div>
</template>
