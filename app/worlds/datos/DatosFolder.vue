<script setup lang="ts">
// Una carpeta abierta, en vista de íconos: la base con sus tablas, o una
// colección con sus records. Arriba la misma cabecera que un archivo (el
// ícono de carpeta con su conteo, el nombre, la línea de tipo, y los
// filtros activos a la derecha); abajo una baldosa por item con su ícono,
// el nombre y el dato dominante. Un solo componente para todas las
// colecciones. Las baldosas son links con `data-row` para que el teclado
// las recorra.
import DatosCabecera from './DatosCabecera.vue'
import DatosIcono from './DatosIcono.vue'
import { pad, type Folder } from './explorer'

defineProps<{ folder: Folder }>()
const uid = useId()
</script>

<template>
  <section class="carpeta" :aria-labelledby="uid">
    <DatosCabecera :id="uid" kind="folder" :badge="pad(folder.count)" :name="folder.head" :line="folder.line">
      <template v-if="folder.facets.length">
        <NuxtLink
          v-for="f in folder.facets"
          :key="f.key"
          :to="f.remove"
          class="facet"
          :title="`quitar el filtro ${f.key}`"
        >
          <span class="facet-kv">{{ f.key }} = {{ f.value }}</span>
          <span class="facet-x" aria-hidden="true">×</span>
        </NuxtLink>
      </template>
    </DatosCabecera>

    <ol class="grid">
      <li v-for="(it, n) in folder.items" :key="it.key">
        <NuxtLink :to="it.to" class="tile" :class="it.kind" :data-row="it.key">
          <span class="n">{{ pad(n + 1) }}</span>
          <DatosIcono :kind="it.kind" :badge="it.badge" class="icono" />
          <span class="name">{{ it.label }}</span>
          <span class="meta">{{ it.meta }}</span>
        </NuxtLink>
      </li>
    </ol>
    <p v-if="!folder.items.length" class="vacio">00 records</p>
  </section>
</template>

<style scoped>
/* Un filtro activo es un botón como los vecinos de un archivo: tocarlo lo quita. */
.facet {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 8px 0 10px;
  border: 1px solid var(--d-rule);
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-sig);
  text-decoration: none;
}
.facet:hover { border-color: var(--d-ink); background: var(--d-hover); }
.facet-x { color: var(--d-dim); }
.facet:hover .facet-x { color: var(--d-ink); }

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
.icono { margin-bottom: 14px; }
.tile :deep(.badge) { font-size: 13px; }

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

/* Con poco ancho las baldosas y los íconos se achican para que entren tres por fila. */
@media (max-width: 640px) {
  .grid { grid-template-columns: repeat(auto-fill, minmax(var(--d-tile-sm), 1fr)); gap: 6px; }
  .tile { padding: 22px 8px 14px; }
  .icono { width: 72px; height: 64px; margin-bottom: 10px; }
  .tile :deep(.badge) { font-size: var(--d-fs-mono); }
  .name { font-size: 14px; }
}
</style>
