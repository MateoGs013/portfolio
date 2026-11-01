<script setup lang="ts">
/**
 * Tecnologías como pantalla, agrupadas por categoría (en el orden de /meta, con su rótulo): título en
 * display con su cifra, filtros como texto con conteo (?filtro=), búsqueda sin acentos (?buscar=, se
 * enfoca con «/») y, por categoría, filas grandes con «Desde», cuántas obras la usan y si le falta el
 * inglés al criterio. Cada categoría es una lista: Tab entra, ↑↓ o j/k recorren y Enter abre (el nombre
 * viaja al encabezado de la ficha). «Nueva tecnología» (o N, o ?nueva=1) abre el alta.
 */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCollection } from '../../composables/useCollection'
import { useId } from '../../composables/useId'
import { onShortcut } from '../../composables/useShortcuts'
import { phrases } from '../../models/labels'
import { markTravel } from '../../shell/transition'
import { enumOptions } from '../../stores/meta'
import Button from '../../ui/Button.vue'
import EmptyState from '../../ui/EmptyState.vue'
import ErrorState from '../../ui/ErrorState.vue'
import Icon from '../../ui/Icon.vue'
import Listbox from '../../ui/Listbox.vue'
import type { ListboxItem } from '../../ui/listbox'
import Skeleton from '../../ui/Skeleton.vue'
import TextInput from '../../ui/TextInput.vue'
import { collections } from '../collections/dict'
import { useCatalogCreate } from '../orgs/useCatalogCreate'
import { stack } from './dict'
import { techModel, techUsed, type AdminTech } from './model'
import TechCreate from './TechCreate.vue'

const route = useRoute()
const router = useRouter()
const { items, loading, error, reload } = useCollection<AdminTech>(techModel)
const creating = useCatalogCreate()
const say = phrases(techModel.noun)
const t = collections.list
const title = techModel.noun.many.charAt(0).toLocaleUpperCase('es') + techModel.noun.many.slice(1)

const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
const queryText = (name: string) => (typeof route.query[name] === 'string' ? route.query[name] as string : '')

/* ── Filtros y búsqueda en la ruta ─────────────────────── */

const filters = techModel.filters ?? []
const filter = computed(() => filters.find(f => f.id === queryText('filtro')) ?? filters[0] ?? null)
const counts = computed(() => Object.fromEntries(filters.map(f => [f.id, (items.value ?? []).filter(r => f.test(r)).length])))

function setFilter(id: string): void {
  void router.replace({ query: { ...route.query, filtro: id === filters[0]?.id ? undefined : id } })
}

const search = ref(queryText('buscar'))
watch(() => route.query['buscar'], () => {
  if (queryText('buscar') !== search.value) search.value = queryText('buscar')
})
watch(search, (value) => {
  const buscar = value.trim() || undefined
  if ((buscar ?? '') !== queryText('buscar')) void router.replace({ query: { ...route.query, buscar } })
})

function showAll(): void {
  search.value = ''
  void router.replace({ query: {} })
}

const visible = computed<AdminTech[]>(() => {
  const words = normalize(search.value).split(/\s+/).filter(Boolean)
  return (items.value ?? []).filter((tech) => {
    if (filter.value && !filter.value.test(tech)) return false
    const haystack = normalize([tech.name, techModel.metaLine(tech), techModel.keywords?.(tech) ?? ''].join(' '))
    return words.every(w => haystack.includes(w))
  })
})

/* ── Grupos por categoría ──────────────────────────────── */

interface Group { id: string, label: string, rows: ListboxItem[] }

const rowOf = (tech: AdminTech): ListboxItem => ({
  key: tech.id,
  title: tech.name,
  meta: techModel.metaLine(tech),
  aside: techModel.aside?.(tech),
  status: techModel.status?.(tech) ?? undefined,
})

const groups = computed<Group[]>(() => {
  const known = enumOptions('TechCategory')
  const order = new Map(known.map((o, i) => [o.value, i]))
  const byCategory = new Map<string, AdminTech[]>()
  for (const tech of visible.value) byCategory.set(tech.category, [...(byCategory.get(tech.category) ?? []), tech])
  return [...byCategory.entries()]
    .sort(([a], [b]) => (order.get(a) ?? known.length) - (order.get(b) ?? known.length))
    .map(([id, techs]) => ({
      id,
      label: known.find(o => o.value === id)?.label || stack.noCategory,
      rows: techs.sort((a, b) => a.name.localeCompare(b.name, 'es')).map(rowOf),
    }))
})

const used = computed(() => (items.value ?? []).filter(techUsed).length)

/* ── Abrir y buscar ────────────────────────────────────── */

const list = ref<HTMLElement | null>(null)
const active = ref<Record<string, string | number | null>>({})
const searchInput = ref<InstanceType<typeof TextInput> | null>(null)
const searchId = useId('buscar')

function open(item: ListboxItem): void {
  markTravel(list.value?.querySelector<HTMLElement>(`[data-title="${item.key}"]`))
  void router.push(techModel.routes.record(Number(item.key)))
}

onShortcut('search', () => searchInput.value?.focus())
</script>

<template>
  <section class="px-4 pt-10 pb-20 md:px-10 md:pt-12 xl:px-16 xl:pt-14">
    <header class="flex max-w-[1080px] flex-wrap items-baseline gap-x-4 gap-y-3">
      <h1 class="m-0 min-w-0 animate-rise text-display text-balance">
        {{ title }}
      </h1>
      <span v-if="items" class="animate-rise text-title font-[420] text-faint tabular-nums stagger [--i:1]">{{ items.length }}</span>
      <div class="ml-auto flex animate-rise flex-wrap items-center gap-2 self-center stagger [--i:2]">
        <Button variant="primary" icon="plus" shortcut="n" @click="creating = true">
          {{ say.create }}
        </Button>
      </div>
    </header>
    <p class="mt-3.5 mb-0 max-w-[60ch] animate-rise text-lead text-dim stagger [--i:2]">
      {{ stack.lead(items?.length ?? 0, used) }}
    </p>

    <div class="mt-8 flex max-w-[1080px] flex-wrap items-end justify-between gap-x-8 gap-y-5">
      <div role="group" :aria-label="t.filters" class="flex flex-wrap gap-x-5 gap-y-2">
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
      <Skeleton v-else-if="!items" variant="rows" :count="6" />
      <EmptyState v-else-if="!items.length" :title="say.empty">
        <Button variant="primary" icon="plus" @click="creating = true">
          {{ say.create }}
        </Button>
      </EmptyState>
      <EmptyState v-else-if="!groups.length" :title="say.noMatch" :text="t.noMatchText">
        <Button @click="showAll">
          {{ t.showAll }}
        </Button>
      </EmptyState>
      <template v-else>
        <ErrorState v-if="error" :message="error.message" :retrying="loading" class="mb-6" @retry="reload()" />
        <div class="grid gap-12" role="region" :aria-label="stack.groups">
          <section v-for="(group, index) in groups" :key="group.id" :aria-labelledby="`grupo-${group.id}`">
            <h2
              :id="`grupo-${group.id}`"
              class="m-0 mb-3 flex animate-rise items-baseline gap-2.5 text-title stagger"
              :style="{ '--i': Math.min(index, 8) }"
            >
              {{ group.label }}
              <span class="text-body font-[420] text-faint tabular-nums">{{ group.rows.length }}</span>
            </h2>
            <Listbox
              :active="active[group.id] ?? null"
              :items="group.rows"
              :label="group.label"
              @update:active="active[group.id] = $event"
              @activate="open"
            />
          </section>
        </div>
      </template>
    </div>

    <TechCreate v-model:open="creating" />
  </section>
</template>
