<script setup lang="ts">
/**
 * Una colección como tabla de registros (docs/diseno.md §4): `caption` con el modelo y la cuenta,
 * encabezados con nombre (`.fk`) y tipo (`.ft`) de cada columna, y una fila `.f[data-f=slug]` por
 * registro con sus valores `.fv`. El nombre de cada registro es el encabezado de su fila y lleva a su
 * página (`data-row` para j/k). El slug, que repite el enlace, se omite debajo de 768 px.
 */
import type { Translatable } from '~/lib/api'
import type { CollectionKey } from '~/lib/fieldMeta'
import { cellFor, metaFor, modelName, recordLine, recordRoute, tableColumns, typeLabel } from '~/lib/record'

type Item = Partial<Translatable> & { slug?: unknown }

const props = defineProps<{
  collection: CollectionKey
  rows: readonly object[]
  /** Columnas en orden; por defecto, nombre · slug · estado · fecha de la colección. */
  columns?: readonly string[]
  /** Rótulo propio; por defecto `colección Project · 6 registros`. */
  caption?: string
}>()

const { t, langAttr } = useLocale()

const names = computed(() => props.columns ?? tableColumns[props.collection])
const caption = computed(() => {
  if (props.caption) return props.caption
  const n = props.rows.length
  const count = t(n === 1 ? 'record.count.one' : 'record.count.other', { n })
  return t('record.collection', { model: modelName[props.collection], count })
})

const head = computed(() => names.value.map(name => ({ name, type: typeLabel(metaFor(props.collection, name)) })))
const body = computed(() => props.rows.map((row, i) => {
  const record = row as Record<string, unknown> & Item
  return {
    // Sin slug, el índice: key y data-f nunca se repiten (el morph empareja por data-f).
    key: typeof record.slug === 'string' && record.slug ? record.slug : `row-${i}`,
    to: recordRoute(props.collection, record),
    record: 'untranslated' in record ? record as Translatable : null,
    cells: names.value.map(name => ({ name, cell: cellFor(record, name, metaFor(props.collection, name, record[name]), props.collection) })),
  }
}))

const narrow = (name: string) => (name === 'slug' ? 'hidden md:table-cell' : '')
const numeric = (name: string) => ['int', 'decimal'].includes(metaFor(props.collection, name).type) ? 'text-right' : ''
</script>

<template>
  <table class="w-full border-collapse text-left">
    <caption class="pb-4 text-left font-mono text-xs text-faint">
      {{ caption }}
    </caption>
    <thead>
      <tr :class="recordLine">
        <th
          v-for="col in head"
          :key="col.name"
          scope="col"
          class="pr-4 pb-2 align-bottom font-normal last:pr-0"
          :class="[narrow(col.name), numeric(col.name)]"
        >
          <span class="fk block font-mono text-xs text-ink">{{ col.name }}</span>
          <span class="ft block font-mono text-xs text-faint">{{ col.type }}</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in body" :key="row.key" class="f" :class="recordLine" :data-f="row.key">
        <template v-for="({ name, cell }, i) in row.cells" :key="name">
          <th v-if="i === 0" scope="row" :data-f="name" class="py-3 pr-4 align-baseline font-normal">
            <RecordValue :cell="cell" :quoted="false" :to="row.to" :lang="langAttr(row.record, name)" :data-row="row.to ? '' : undefined" />
          </th>
          <td v-else :data-f="name" class="py-3 pr-4 align-baseline last:pr-0" :class="[narrow(name), numeric(name)]">
            <RecordValue :cell="cell" :quoted="false" :lang="langAttr(row.record, name)" />
          </td>
        </template>
      </tr>
    </tbody>
  </table>
</template>
