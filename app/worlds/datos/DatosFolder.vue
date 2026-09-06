<script setup lang="ts">
// Una carpeta: la base con sus tablas, o una colección con sus records. Una
// fila por item, con el nombre y el dato dominante; nada más, como en un
// explorador de archivos. Un solo componente para todas las colecciones.
// Las filas son links con `data-row` para que el teclado las recorra.
import { pad, type Folder } from './explorer'

defineProps<{ folder: Folder }>()
const uid = useId()
</script>

<template>
  <section class="carpeta" :aria-labelledby="uid">
    <h1 :id="uid" class="head" tabindex="-1" data-anchor>
      <span class="head-name">{{ folder.head }}</span>
      <span class="head-count">{{ pad(folder.count) }} {{ folder.head === 'db' ? 'tables' : folder.count === 1 ? 'record' : 'records' }}</span>
    </h1>

    <ul v-if="folder.facets.length" class="facets" aria-label="Filtros activos">
      <li v-for="f in folder.facets" :key="f.key">
        <span class="facet-kv">{{ f.key }} = {{ f.value }}</span>
        <NuxtLink :to="f.remove" class="facet-x" :aria-label="`quitar ${f.key}`">×</NuxtLink>
      </li>
    </ul>

    <ol class="rows">
      <li v-for="(it, n) in folder.items" :key="it.key">
        <NuxtLink :to="it.to" class="row" :data-row="it.key">
          <span class="n">{{ pad(n + 1) }}</span>
          <span class="name">{{ it.label }}</span>
          <span class="meta">{{ it.meta }}</span>
          <span class="chev" aria-hidden="true">›</span>
        </NuxtLink>
      </li>
    </ol>
    <p v-if="!folder.items.length" class="vacio">00 records</p>
  </section>
</template>

<style scoped>
.carpeta { max-width: 720px; }
.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 0;
  padding: 2px 0 12px;
  border-top: 1px solid var(--d-ink);
  border-bottom: 1px solid var(--d-ink);
  font-weight: 400;
  outline: none;
}
.head-name {
  font-family: var(--font-text);
  font-size: var(--d-fs-name);
  font-weight: 500;
  letter-spacing: -0.01em;
  padding-top: 10px;
}
.head-count { font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-dim); font-variant-numeric: tabular-nums; }

.facets {
  list-style: none;
  margin: 0;
  padding: 8px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  border-bottom: 1px solid var(--d-rule);
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-sig);
}
.facets li { display: inline-flex; gap: 6px; align-items: baseline; }
.facet-x { color: var(--d-dim); text-decoration: none; padding: 0 2px; }
.facet-x:hover { color: var(--d-ink); }

.rows { list-style: none; margin: 0; padding: 0; }
.row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto 16px;
  gap: 10px 20px;
  align-items: center;
  height: var(--d-row);
  border-bottom: 1px solid var(--d-rule);
  color: var(--d-ink);
  text-decoration: none;
}
.row:hover { background: var(--d-hover); }
.n { font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-faint); font-variant-numeric: tabular-nums; }
.name {
  font-family: var(--font-text);
  font-size: var(--d-fs-name);
  font-weight: 500;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta { font-family: var(--font-text); font-size: var(--d-fs-ui); color: var(--d-dim); font-variant-numeric: tabular-nums; white-space: nowrap; }
.chev { color: var(--d-faint); text-align: right; }
.vacio { margin: 0; padding: 14px 0; font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-faint); }
</style>
