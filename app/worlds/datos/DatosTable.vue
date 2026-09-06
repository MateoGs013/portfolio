<script setup lang="ts">
// La colección como tabla. Una fila por record, una columna por campo de
// lista, el tipo en el encabezado. Es la vista para quien busca algo
// concreto: todo comparable de un vistazo, y cada valor filtrable es un
// link que corre la query. Un solo componente para todas las colecciones.
import DatosValor from './DatosValor.vue'
import { pad, type Table } from './explorer'

defineProps<{ table: Table }>()
const uid = useId()

/** Ancho de columna según el tipo: los números no se parten, el texto sí. */
function kind(type: string, first: boolean): string {
  if (first) return 'name'
  if (type.startsWith('relation[]')) return 'list'
  if (type.startsWith('relation')) return 'rel'
  if (type.startsWith('enum')) return 'enum'
  if (type === 'url') return 'url'
  if (['int', 'date', 'datetime', 'bool'].includes(type)) return 'num'
  return 'text'
}
</script>

<template>
  <section class="tabla" :aria-labelledby="uid">
    <header class="cabecera">
      <h1 :id="uid" class="titulo" tabindex="-1" data-anchor>{{ table.collection }}</h1>
      <p class="linea">
        <span>collection · {{ table.model }}</span>
        <span>{{ pad(table.count) }} {{ table.count === 1 ? 'record' : 'records' }}</span>
        <span v-if="table.filters.length" class="filtros">filters <b>{{ table.filters.join(' · ') }}</b></span>
      </p>
    </header>

    <ul v-if="table.facets.length" class="facets" aria-label="Filtros activos">
      <li v-for="f in table.facets" :key="f.key">
        <span class="facet-kv">{{ f.key }} = {{ f.value }}</span>
        <NuxtLink :to="f.remove" class="facet-x" :aria-label="`quitar ${f.key}`">×</NuxtLink>
      </li>
    </ul>

    <table>
      <colgroup>
        <col class="c-n">
        <col v-for="(h, j) in table.head" :key="h.name" :class="`c-${kind(h.type, j === 0)}`">
      </colgroup>
      <thead>
        <tr>
          <th class="n" scope="col"><span class="sr">#</span></th>
          <th v-for="h in table.head" :key="h.name" scope="col">
            <span class="hn">{{ h.name }}</span>
            <span class="ht">{{ h.type }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in table.rows" :key="row.key">
          <td class="n">{{ pad(i + 1) }}</td>
          <td
            v-for="(cell, j) in row.cells"
            :key="table.head[j]!.name"
            :class="[kind(table.head[j]!.type, j === 0)]"
            :data-name="table.head[j]!.name"
          >
            <DatosValor :cell="cell" :name="table.head[j]!.name" :plain="j === 0" />
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!table.rows.length" class="vacio">00 records</p>
  </section>
</template>

<style scoped>
.tabla {
  flex: 1 1 var(--d-pane-min);
  min-width: 0;
  padding-right: 16px;
  scrollbar-gutter: stable;
  animation: entrar var(--d-dur) var(--d-ease) both;
}
@keyframes entrar {
  from { transform: translateX(12px); opacity: 0; }
}

.cabecera {
  padding-top: 2px;
  border-top: 1px solid var(--d-ink);
}
.titulo {
  margin: 14px 0 12px;
  font-family: var(--font-text);
  font-size: var(--d-fs-title);
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1;
  outline: none;
}
.linea {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin: 0 0 20px;
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-dim);
  font-variant-numeric: tabular-nums;
}
.filtros b { font-weight: 400; color: var(--d-ink); }

.facets {
  list-style: none;
  margin: 0;
  padding: 0 0 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-sig);
}
.facets li { display: inline-flex; gap: 6px; align-items: baseline; }
.facet-x { color: var(--d-dim); text-decoration: none; padding: 0 2px; }
.facet-x:hover { color: var(--d-ink); }

table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  border-top: 1px solid var(--d-ink);
  font-size: var(--d-fs-name);
  line-height: var(--d-lh);
}
.c-n { width: 24px; }
.c-name { width: 18%; }
.c-text { width: 17%; }
.c-list { width: 26%; }
.c-rel { width: 14%; }
.c-enum { width: 9%; }
.c-url { width: 11%; }
.c-num { width: 92px; }
th, td {
  padding: 10px 20px 10px 0;
  text-align: left;
  vertical-align: baseline;
  border-bottom: 1px solid var(--d-rule);
}
th {
  padding-top: 8px;
  padding-bottom: 8px;
  font-weight: 400;
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-dim);
  white-space: nowrap;
}
th .hn { color: var(--d-ink); }
th .ht { display: block; margin-top: 2px; white-space: normal; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
td.n, th.n { width: 24px; padding-right: 10px; font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-faint); font-variant-numeric: tabular-nums; }
td.name { font-weight: 500; letter-spacing: -0.01em; }
td.num, td.enum { white-space: nowrap; font-variant-numeric: tabular-nums; }
td.url { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
tbody tr:hover { background: var(--d-hover); }
td:last-child { padding-right: 0; }
.vacio { margin: 0; padding: 14px 0; font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-faint); }

/* Sin ancho la tabla se apila: cada record es un bloque con su número y sus campos rotulados. */
@media (max-width: 900px) {
  .tabla { padding-right: 0; }
  table, tbody { display: block; width: 100%; }
  thead, colgroup { display: none; }
  tbody tr { display: grid; min-width: 0; grid-template-columns: 28px minmax(0, 1fr); gap: 2px 10px; padding: 12px 0; border-bottom: 1px solid var(--d-rule); }
  td { display: block; min-width: 0; padding: 0; border: 0; white-space: normal; overflow: visible; }
  td.n { grid-row: 1 / span 9; padding-top: 3px; }
  td.name { white-space: normal; font-size: var(--d-fs-name); margin-bottom: 4px; }
  td:not(.n):not(.name) { font-size: var(--d-fs-ui); color: var(--d-ink); }
  td:not(.n):not(.name)::before { content: attr(data-name) '  '; font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-dim); white-space: pre; }
  tbody tr:hover { background: none; }
}
</style>
