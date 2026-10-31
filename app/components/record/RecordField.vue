<script setup lang="ts">
/**
 * Un campo que se lee en diseño o como registro (`?vista=registro`; docs/diseno.md §2.1 y §4). El SSR
 * ya lo entrega en su estado: en diseño, el slot (y nada si el campo está vacío); en registro, la fila
 * `.f[data-f]` con `.fk` (nombre), `.ft` (tipo de fieldMeta) y el valor (`RecordValue`, o `NULL`).
 *
 * El slot recibe `fv`: la clase del nodo que viaja en el morph. Con `shared`, el slot se queda también
 * en registro y su nodo con `fv` es el mismo en las dos lecturas (`record:` le cambia la tipografía);
 * sin `shared`, el registro lo reemplaza por `RecordValue`. Sin slot, el valor se lee igual en ambos.
 *
 * El morph de R (record-morph.client.ts) empareja los dos nodos por clave: el `data-f` de esta fila (y
 * los de afuera, como el slug de una tabla) y el orden del `.fv` dentro del campo. Por eso el slot pone
 * `fv` en el mismo orden que RecordValue: un nodo por valor, uno por item en las listas.
 */
import type { FieldType } from '~/lib/fieldMeta'
import type { Translatable } from '~/lib/api'
import { cellFor, isEmptyCell, metaFor, typeLabel, valueClass, type RecordCollection } from '~/lib/record'

const props = withDefaults(defineProps<{
  collection: RecordCollection
  /** Nombre del campo, como en la API y en fieldMeta. */
  k: string
  value?: unknown
  /** El registro dueño del campo: si lo lista en `untranslated`, el valor lleva `lang="es"`. */
  record?: Translatable | null
  /** Tipo propio cuando fieldMeta no lo declara. */
  type?: FieldType
  /** Etiqueta de la fila (`li` dentro de una lista, `span` dentro de un texto). */
  as?: string
  /** El slot es el mismo nodo en diseño y en registro. */
  shared?: boolean
}>(), { value: undefined, record: null, type: undefined, as: 'div' })

const slots = defineSlots<{
  default?: (props: { fv: string, record: boolean }) => unknown
}>()

const { isRecord } = useRecordView()
const { langAttr } = useLocale()

const meta = computed(() => {
  const found = metaFor(props.collection, props.k, props.value)
  return props.type ? { ...found, type: props.type } : found
})
const cell = computed(() => cellFor({ [props.k]: props.value }, props.k, meta.value, props.collection))
const empty = computed(() => isEmptyCell(cell.value))
const lang = computed(() => langAttr(props.record, props.k))
const design = computed(() => !empty.value && !!slots.default && (props.shared || !isRecord.value))

/**
 * En registro el valor va en la tercera columna; debajo de 768 px y en la columna angosta del Hiperfoco
 * (68ch no alcanzan para tres), en su propia línea debajo del nombre y el tipo.
 */
const place = 'record:col-span-full record:mt-1 md:not-focus-mode:record:col-auto md:not-focus-mode:record:mt-0'
const fv = computed(() => `${valueClass(cell.value.kind)} ${place}`)
</script>

<template>
  <component
    :is="as"
    v-if="isRecord || !empty"
    class="f contents record:relative record:grid record:grid-cols-[minmax(0,1fr)_auto] record:items-baseline record:gap-x-6 record:py-3 record:bg-[linear-gradient(var(--rule),var(--rule))] record:bg-no-repeat record:bg-[length:calc(var(--rs,1)*100%)_1px] md:not-focus-mode:record:grid-cols-[minmax(7rem,13rem)_minmax(6rem,15rem)_minmax(0,1fr)]"
    :data-f="k"
    :lang="design ? lang : undefined"
  >
    <template v-if="isRecord">
      <span class="fk font-mono text-xs text-ink wrap-anywhere">{{ k }}</span>
      <span class="ft font-mono text-xs text-faint text-right wrap-anywhere md:not-focus-mode:text-left">{{ typeLabel(meta) }}</span>
    </template>
    <slot v-if="design" :fv="fv" :record="isRecord" />
    <RecordValue v-else :cell="cell" :class="place" :lang="lang" />
  </component>
</template>
