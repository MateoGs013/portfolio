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
      <h1 :id="uid" class="titulo" tabindex="-1" data-anchor>{{ detail.name }}</h1>
      <p class="linea">
        <span>{{ detail.type }}</span>
        <span v-if="detail.updated">updatedAt {{ detail.updated }}</span>
        <span>{{ pad(detail.rows.length) }} fields</span>
      </p>
      <nav v-if="prev || next" class="vecinos" aria-label="Records vecinos">
        <NuxtLink v-if="prev" :to="prev.to" class="vecino" rel="prev"><span aria-hidden="true">‹</span> {{ prev.label }}</NuxtLink>
        <NuxtLink v-if="next" :to="next.to" class="vecino" rel="next">{{ next.label }} <span aria-hidden="true">›</span></NuxtLink>
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
/* Con ancho, el título vive en su propia columna y los campos en la de lectura. */
@media (min-width: 1700px) {
  .hoja { max-width: none; grid-template-columns: minmax(240px, 2fr) minmax(0, 5fr); }
  .cabecera { position: sticky; top: 0; }
}

.cabecera {
  padding-top: 2px;
  border-top: 1px solid var(--d-ink);
}
.vecinos {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-top: 14px;
  font-family: var(--font-text);
  font-size: var(--d-fs-ui);
}
.vecino { color: var(--d-dim); text-decoration: none; }
.vecino:hover { color: var(--d-ink); text-decoration: underline; }
.vecino[rel="next"] { margin-left: auto; }
.titulo {
  margin: 14px 0 12px;
  font-family: var(--font-text);
  font-size: var(--d-fs-title);
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1;
  text-wrap: balance;
  overflow-wrap: anywhere;
  outline: none;
}
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

.campos { margin: 0; border-top: 1px solid var(--d-ink); }
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
  .campo, .campo.wide {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "nombre tipo" "valor valor";
  }
  .campo .tipo { text-align: right; }
}
</style>
