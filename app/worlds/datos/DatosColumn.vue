<script setup lang="ts">
// Una columna del explorador. Todas iguales: una base de datos trata a todos
// los records del mismo modo. La fila elegida se invierte y el encabezado
// de la columna siguiente repite ese nombre invertido: la ruta se ve como
// una escalera de bloques negros, sin dibujar nada más.
import { pad, type Column } from './explorer'

defineProps<{
  column: Column
  /** Distancia a la última superficie; decide la profundidad en Z. */
  dist: number
}>()
</script>

<template>
  <section class="col" :style="{ '--dist': dist }" :aria-label="column.head">
    <div class="col-in">
      <header class="head" :class="{ inv: column.level > 0 }">
        <span class="head-name">{{ column.head }}</span>
        <span class="head-count">{{ pad(column.count) }}</span>
      </header>

      <ul v-if="column.facets.length" class="facets" aria-label="Filtros">
        <li v-for="f in column.facets" :key="f.key">
          <span class="facet-kv">{{ f.key }} = {{ f.value }}</span>
          <NuxtLink :to="f.remove" class="facet-x" :aria-label="`quitar ${f.key}`">×</NuxtLink>
        </li>
      </ul>

      <ol class="rows">
        <li v-for="(it, n) in column.items" :key="it.key">
          <NuxtLink
            v-if="it.to"
            :to="it.to"
            class="row"
            :aria-current="it.key === column.selected ? 'true' : undefined"
          >
            <span class="n">{{ pad(n + 1) }}</span>
            <span class="name">{{ it.label }}</span>
            <span class="meta">{{ it.meta }}</span>
            <span class="chev" aria-hidden="true">{{ it.kids ? '›' : '' }}</span>
          </NuxtLink>
          <a v-else-if="it.href" :href="it.href" rel="noopener" class="row">
            <span class="n">{{ pad(n + 1) }}</span>
            <span class="name">{{ it.label }}</span>
            <span class="meta">{{ it.meta }}</span>
            <span class="chev" aria-hidden="true">↗</span>
          </a>
        </li>
      </ol>
      <p v-if="!column.items.length" class="vacio">00 items</p>
    </div>
  </section>
</template>

<style scoped>
.col {
  flex: none;
  width: var(--d-col);
  margin-right: 28px;
  transform: translateZ(calc(var(--dist) * var(--d-z) * -1));
  opacity: max(0.55, calc(1 - var(--dist) * 0.15));
  transition: transform var(--d-dur) var(--d-ease), opacity var(--d-dur) var(--d-ease);
}
.col-in { animation: entrar var(--d-dur) var(--d-ease) both; }
@keyframes entrar {
  from { transform: translateX(12px); opacity: 0; }
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: var(--d-row);
  padding: 0 12px;
  border-bottom: 1px solid var(--d-ink);
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-dim);
}
.head-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.head-count { font-variant-numeric: tabular-nums; }
.head.inv {
  background: var(--d-ink);
  color: var(--d-paper);
  border-bottom-color: var(--d-ink);
}
.head.inv .head-name { font-family: var(--font-text); font-size: var(--d-fs-name); font-weight: 500; }
.head.inv .head-count { color: var(--d-inv-dim); }

.facets {
  list-style: none;
  margin: 0;
  padding: 8px 12px;
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
  grid-template-columns: 24px minmax(0, 1fr) auto 12px;
  gap: 10px;
  align-items: center;
  height: var(--d-row);
  padding: 0 12px;
  border-bottom: 1px solid var(--d-rule);
  color: var(--d-ink);
  text-decoration: none;
}
.row:hover { background: var(--d-hover); }
.row[aria-current] { background: var(--d-ink); color: var(--d-paper); border-bottom-color: var(--d-ink); }
.row[aria-current] .n, .row[aria-current] .meta, .row[aria-current] .chev { color: var(--d-inv-dim); }
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
.meta { font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-dim); font-variant-numeric: tabular-nums; white-space: nowrap; }
.chev { color: var(--d-faint); text-align: right; }
.vacio { margin: 0; padding: 14px 12px; font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-faint); }
</style>
