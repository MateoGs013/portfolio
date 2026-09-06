<script setup lang="ts">
// El índice de la base, en la raíz: una fila por tabla o documento, con su
// conteo. Es la carpeta de arriba de todo. Las filas son links con
// `data-row` para que el teclado las recorra como una lista.
import { pad, type Index } from './explorer'

defineProps<{ index: Index }>()
</script>

<template>
  <section class="indice" aria-label="Tablas">
    <h2 class="head">
      <span>db</span>
      <span class="head-count">{{ pad(index.count) }} tables</span>
    </h2>
    <ol class="rows">
      <li v-for="(it, n) in index.items" :key="it.key">
        <NuxtLink :to="it.to" class="row" :data-row="it.key">
          <span class="n">{{ pad(n + 1) }}</span>
          <span class="name">{{ it.label }}</span>
          <span class="meta">{{ it.meta }}</span>
          <span class="chev" aria-hidden="true">›</span>
        </NuxtLink>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.indice { max-width: 640px; }
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 36px;
  margin: 0;
  font-weight: 400;
  border-bottom: 1px solid var(--d-ink);
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-dim);
}
.head-count { font-variant-numeric: tabular-nums; }

.rows { list-style: none; margin: 0; padding: 0; }
.row {
  display: grid;
  grid-template-columns: 24px minmax(120px, 160px) minmax(0, 1fr) 16px;
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
</style>
