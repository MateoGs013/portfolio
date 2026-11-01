<script setup lang="ts" generic="TRecord extends AdminRecord">
/**
 * La lista de una colección como pantalla (dirección elegida en la demo): título en display con su
 * cifra, filtros como texto con conteo (?filtro=), búsqueda sin acentos (?buscar=, se enfoca con «/»)
 * y filas grandes que entran escalonadas. Un Tab entra a la lista, ↑↓ o j/k recorren y Enter abre:
 * el título de la fila viaja al encabezado del editor. N crea uno nuevo si la colección se crea acá.
 */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCollection } from '../../composables/useCollection'
import { onShortcut } from '../../composables/useShortcuts'
import { phrases } from '../../models/labels'
import type { AdminRecord, Model, ModelFilter } from '../../models/types'
import { markTravel } from '../../shell/transition'
import Button from '../../ui/Button.vue'
import EmptyState from '../../ui/EmptyState.vue'
import ErrorState from '../../ui/ErrorState.vue'
import Icon from '../../ui/Icon.vue'
import Listbox from '../../ui/Listbox.vue'
import type { ListboxItem } from '../../ui/listbox'
import Skeleton from '../../ui/Skeleton.vue'
import TextInput from '../../ui/TextInput.vue'
import { useId } from '../../composables/useId'
import { collections } from './dict'

const props = defineProps<{
  model: Model<TRecord, object>
  /** Una línea debajo del título, con datos reales. */
  lead?: string
}>()

const route = useRoute()
const router = useRouter()
const { items, loading, error, reload } = useCollection<TRecord>(props.model)
const say = computed(() => phrases(props.model.noun))
const t = collections.list
const title = computed(() => props.model.noun.many.charAt(0).toLocaleUpperCase('es') + props.model.noun.many.slice(1))

const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
const queryText = (name: string) => (typeof route.query[name] === 'string' ? route.query[name] as string : '')

/* ── Filtros y búsqueda en la ruta ─────────────────────── */

const filters = computed<readonly ModelFilter<TRecord>[]>(() => props.model.filters ?? [])
const filter = computed(() => filters.value.find(f => f.id === queryText('filtro')) ?? filters.value[0] ?? null)
const search = ref(queryText('buscar'))
watch(() => route.query['buscar'], () => {
  if (queryText('buscar') !== search.value) search.value = queryText('buscar')
})
watch(search, (value) => {
  const buscar = value.trim() || undefined
  if ((buscar ?? '') !== queryText('buscar')) void router.replace({ query: { ...route.query, buscar } })
})

function setFilter(id: string): void {
  const first = filters.value[0]?.id
  void router.replace({ query: { ...route.query, filtro: id === first ? undefined : id } })
}

function showAll(): void {
  search.value = ''
  void router.replace({ query: {} })
}

const counts = computed(() => Object.fromEntries(filters.value.map(f => [f.id, (items.value ?? []).filter(r => f.test(r)).length])))

const visible = computed<TRecord[]>(() => {
  const words = normalize(search.value).split(/\s+/).filter(Boolean)
  const m = props.model
  return (items.value ?? []).filter((record) => {
    if (filter.value && !filter.value.test(record)) return false
    if (!words.length) return true
    const haystack = normalize([m.title(record), m.metaLine(record), m.keywords?.(record) ?? ''].join(' '))
    return words.every(w => haystack.includes(w))
  })
})

const rows = computed<ListboxItem[]>(() => visible.value.map(record => ({
  key: record.id,
  title: props.model.title(record),
  meta: props.model.metaLine(record) || undefined,
  aside: props.model.aside?.(record) || undefined,
  status: props.model.status?.(record) ?? undefined,
})))

/* ── Abrir, crear, buscar ──────────────────────────────── */

const list = ref<HTMLElement | null>(null)
const active = ref<string | number | null>(null)
const searchInput = ref<InstanceType<typeof TextInput> | null>(null)
const searchId = useId('buscar')

function open(item: ListboxItem): void {
  markTravel(list.value?.querySelector<HTMLElement>(`[data-title="${item.key}"]`))
  void router.push(props.model.routes.record(Number(item.key)))
}

function create(): void {
  if (props.model.routes.create) void router.push(props.model.routes.create)
}

onShortcut('search', () => searchInput.value?.focus())
// N solo si la colección se crea desde su lista: si no, la tecla queda libre.
if (props.model.routes.create) onShortcut('new', create)
</script>

<template>
  <section class="px-4 pt-10 pb-20 md:px-10 md:pt-12 xl:px-16 xl:pt-14">
    <header class="flex max-w-[1080px] flex-wrap items-baseline gap-x-4 gap-y-3">
      <h1 class="m-0 min-w-0 animate-rise text-display text-balance">
        {{ title }}
      </h1>
      <span v-if="items" class="animate-rise text-title font-[420] text-faint tabular-nums stagger [--i:1]">{{ items.length }}</span>
      <div class="ml-auto flex animate-rise flex-wrap items-center gap-2 self-center stagger [--i:2]">
        <slot name="actions" />
        <Button v-if="model.routes.create" variant="primary" icon="plus" shortcut="n" @click="create">
          {{ say.create }}
        </Button>
      </div>
    </header>
    <p v-if="lead" class="mt-3.5 mb-0 max-w-[60ch] animate-rise text-lead text-dim stagger [--i:2]">
      {{ lead }}
    </p>

    <div class="mt-8 flex max-w-[1080px] flex-wrap items-end justify-between gap-x-8 gap-y-5">
      <div v-if="filters.length > 1" role="group" :aria-label="t.filters" class="flex flex-wrap gap-x-5 gap-y-2">
        <button
          v-for="f in filters"
          :key="f.id"
          type="button"
          :aria-pressed="f.id === filter?.id"
          class="inline-flex items-baseline gap-1.5 border-0 border-b border-transparent bg-transparent px-0 pb-1 text-body text-faint transition-colors duration-120 ease-e hover:text-ink aria-pressed:border-ink aria-pressed:text-ink"
          @click="setFilter(f.id)"
        >
          {{ f.label }}
          <span class="text-meta tabular-nums">{{ counts[f.id] }}</span>
        </button>
      </div>
      <div class="relative w-full max-w-[18rem] sm:ml-auto">
        <label :for="searchId" class="sr-only">{{ say.search }}</label>
        <span class="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-faint">
          <Icon name="search" :size="16" />
        </span>
        <TextInput :id="searchId" ref="searchInput" v-model="search" type="search" :placeholder="say.search" aria-keyshortcuts="/" class="pl-6.5" />
      </div>
    </div>
    <p class="sr-only" role="status">
      {{ search.trim() && items ? t.results(visible.length) : '' }}
    </p>

    <div ref="list" class="mt-7 max-w-[1080px]">
      <ErrorState v-if="error && !items" :message="error.message" :retrying="loading" @retry="reload()" />
      <Skeleton v-else-if="!items" variant="rows" :count="5" />
      <EmptyState v-else-if="!items.length" :title="say.empty">
        <Button v-if="model.routes.create" variant="primary" icon="plus" @click="create">
          {{ say.create }}
        </Button>
      </EmptyState>
      <EmptyState v-else-if="!rows.length" :title="say.noMatch" :text="t.noMatchText">
        <Button @click="showAll">
          {{ t.showAll }}
        </Button>
      </EmptyState>
      <template v-else>
        <ErrorState v-if="error" :message="error.message" :retrying="loading" class="mb-6" @retry="reload()" />
        <Listbox v-model:active="active" :items="rows" :label="title" @activate="open" />
      </template>
    </div>
  </section>
</template>
