<script setup lang="ts">
// Una carpeta abierta, en vista de íconos: la base con sus tablas, o una
// colección con sus records. Cada item es una baldosa con su ícono (carpeta
// para una tabla, archivo para un record o un documento), el nombre y el
// dato dominante. Un solo componente para todas las colecciones. Las
// baldosas son links con `data-row` para que el teclado las recorra.
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

    <ol class="grid">
      <li v-for="(it, n) in folder.items" :key="it.key">
        <NuxtLink :to="it.to" class="tile" :class="it.kind" :data-row="it.key">
          <span class="n">{{ pad(n + 1) }}</span>
          <span class="icon" aria-hidden="true">
            <svg v-if="it.kind === 'folder'" viewBox="0 0 72 56">
              <path d="M1.5 6.5h22l6 7h41v41h-69z" />
              <path d="M1.5 19.5h69" />
            </svg>
            <svg v-else viewBox="0 0 52 64">
              <path d="M1.5 1.5h33l16 16v45h-49z" />
              <path d="M34.5 1.5v16h16" />
            </svg>
            <span class="badge">{{ it.badge }}</span>
          </span>
          <span class="name">{{ it.label }}</span>
          <span class="meta">{{ it.meta }}</span>
        </NuxtLink>
      </li>
    </ol>
    <p v-if="!folder.items.length" class="vacio">00 records</p>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 0;
  padding: 12px 0 12px;
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

/* La grilla de íconos: baldosas del mismo tamaño, tantas como entren. */
.grid {
  list-style: none;
  margin: 0;
  padding: 20px 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--d-tile), 1fr));
  gap: 10px;
}
.tile {
  position: relative;
  display: grid;
  grid-template-rows: auto auto auto;
  justify-items: center;
  gap: 2px;
  padding: 26px 12px 18px;
  border: 1px solid transparent;
  color: var(--d-ink);
  text-decoration: none;
  text-align: center;
}
.tile:hover { background: var(--d-hover); border-color: var(--d-rule); }
.n {
  position: absolute;
  top: 8px;
  left: 10px;
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-faint);
  font-variant-numeric: tabular-nums;
}

/* El ícono es un trazo de tinta con el dato adentro: la carpeta lleva su conteo, el archivo su año. */
.icon { position: relative; display: block; width: 92px; height: 80px; margin-bottom: 14px; }
.icon svg { position: absolute; inset: 0; width: 100%; height: 100%; fill: var(--d-paper); stroke: var(--d-ink); stroke-width: 1.5; stroke-linejoin: round; }
.tile.folder .icon svg { top: 5px; height: 72px; }
.tile.file .icon { width: 66px; }
.badge {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 12px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--d-dim);
  font-variant-numeric: tabular-nums;
}
.tile.folder .badge { bottom: 14px; }

.name {
  max-width: 100%;
  font-family: var(--font-text);
  font-size: var(--d-fs-name);
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.25;
  text-wrap: balance;
  overflow-wrap: anywhere;
}
.meta { font-family: var(--font-text); font-size: var(--d-fs-ui); color: var(--d-dim); font-variant-numeric: tabular-nums; white-space: nowrap; }
.vacio { margin: 0; padding: 14px 0; font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-faint); }
</style>
