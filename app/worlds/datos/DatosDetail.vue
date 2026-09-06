<script setup lang="ts">
// La hoja del record, compuesta como hoja de especificaciones: el título
// arriba, los campos debajo con el tipo en su propia columna angosta, pegado
// al valor. Las relaciones están a la vista y cada una es un link; no hay
// nada escondido en un nivel más abajo. En un record, los vecinos de la
// carpeta van debajo del título.
import DatosValor from './DatosValor.vue'
import { pad, type Detail, type Vecino } from './explorer'

defineProps<{
  detail: Detail
  prev?: Vecino | null
  next?: Vecino | null
}>()
const uid = useId()
</script>

<template>
  <article class="hoja" :aria-labelledby="uid">
    <header class="cabecera">
      <span class="icon" aria-hidden="true">
        <svg viewBox="0 0 52 64">
          <path d="M1.5 1.5h33l16 16v45h-49z" />
          <path d="M34.5 1.5v16h16" />
        </svg>
        <span class="badge">{{ pad(detail.rows.length) }}</span>
      </span>
      <div class="quien">
        <h1 :id="uid" class="titulo" tabindex="-1" data-anchor>{{ detail.name }}</h1>
        <p class="linea">
          <span>{{ detail.type }}</span>
          <span v-if="detail.updated">updatedAt {{ detail.updated }}</span>
          <span>{{ pad(detail.rows.length) }} fields</span>
        </p>
      </div>
      <nav v-if="prev || next" class="vecinos" aria-label="Records vecinos">
        <NuxtLink v-if="prev" :to="prev.to" class="vecino" rel="prev"><span aria-hidden="true">‹</span> {{ prev.label }}</NuxtLink>
        <span v-else class="vecino off" aria-hidden="true">‹</span>
        <NuxtLink v-if="next" :to="next.to" class="vecino" rel="next">{{ next.label }} <span aria-hidden="true">›</span></NuxtLink>
        <span v-else class="vecino off" aria-hidden="true">›</span>
      </nav>
    </header>

    <dl class="campos">
      <div v-for="row in detail.rows" :key="row.name" class="campo" :class="{ wide: row.wide || row.items }">
        <dt class="nombre">{{ row.name }}</dt>
        <dd class="valor"><DatosValor :cell="row" :name="row.name" /></dd>
        <dd class="tipo">{{ row.type }}</dd>
      </div>
    </dl>
  </article>
</template>

<style scoped>
.hoja {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px 48px;
  align-content: start;
  max-width: var(--d-pane-max);
}
/* La cabecera es la de un archivo abierto: el mismo ícono de la carpeta, el nombre
   a escala de interfaz y la línea de tipo debajo; los vecinos a la derecha. */
.cabecera {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0 18px;
  align-items: center;
  padding: 4px 0 18px;
  border-bottom: 1px solid var(--d-rule);
}
.icon { position: relative; display: block; width: 44px; height: 54px; }
.icon svg { position: absolute; inset: 0; width: 100%; height: 100%; fill: var(--d-paper); stroke: var(--d-ink); stroke-width: 1.5; stroke-linejoin: round; }
.badge {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 8px;
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-dim);
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.quien { min-width: 0; }
.titulo {
  margin: 0 0 4px;
  font-family: var(--font-text);
  font-size: var(--d-fs-title);
  font-weight: 500;
  letter-spacing: -0.015em;
  line-height: 1.2;
  overflow-wrap: anywhere;
  outline: none;
}
.vecinos {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-text);
  font-size: var(--d-fs-ui);
}
.vecino {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 180px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--d-rule);
  color: var(--d-dim);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vecino:hover { border-color: var(--d-ink); color: var(--d-ink); background: var(--d-hover); }
.vecino.off { color: var(--d-faint); }
.linea {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-dim);
  font-variant-numeric: tabular-nums;
}

.campos { margin: 0; }
.campo {
  display: grid;
  grid-template-columns: minmax(120px, 160px) minmax(0, 56ch) minmax(0, 180px);
  grid-template-areas: "nombre valor tipo";
  justify-content: start;
  gap: 4px 20px;
  align-items: baseline;
  min-height: 40px;
  padding: 10px 0;
  border-bottom: 1px solid var(--d-rule);
}
.campo.wide {
  grid-template-columns: minmax(120px, 160px) minmax(0, 1fr);
  grid-template-areas: "nombre tipo" "valor valor";
  justify-content: stretch;
  gap: 6px 20px;
}
.nombre { grid-area: nombre; margin: 0; font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-dim); }
.tipo {
  grid-area: tipo;
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-dim);
  overflow-wrap: anywhere;
}
.campo.wide .tipo { text-align: right; }
.valor {
  grid-area: valor;
  margin: 0;
  font-family: var(--font-text);
  font-size: var(--d-fs-value);
  line-height: var(--d-lh);
  overflow-wrap: anywhere;
}
.campo.wide .valor { max-width: 62ch; }
.campo.wide:not(:has(.items)) .valor { font-size: var(--d-fs-read); line-height: 1.5; }

@media (max-width: 640px) {
  .cabecera { grid-template-columns: auto minmax(0, 1fr); }
  .vecinos { grid-column: 1 / -1; margin-top: 12px; }
  .vecino:first-child { margin-right: auto; }
  .campo, .campo.wide {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "nombre tipo" "valor valor";
  }
  .campo .tipo { text-align: right; }
}
</style>
