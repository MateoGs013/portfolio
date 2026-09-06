<script setup lang="ts">
// Un archivo abierto: la misma cabecera que una carpeta (el ícono de archivo
// con la cantidad de campos adentro, el nombre, la línea de tipo) con los
// vecinos a la derecha, y debajo los campos como hoja de especificaciones:
// el tipo en su propia columna angosta, pegado al valor. Las relaciones
// están a la vista y cada una es un link; no hay nada escondido en un
// nivel más abajo.
import DatosCabecera from './DatosCabecera.vue'
import DatosValor from './DatosValor.vue'
import { pad, type Detail, type Vecino } from './explorer'

const props = defineProps<{
  detail: Detail
  prev?: Vecino | null
  next?: Vecino | null
}>()
const uid = useId()

const line = computed(() => [
  ...props.detail.type.split(' · '),
  ...(props.detail.updated ? [`updatedAt ${props.detail.updated}`] : []),
  `${pad(props.detail.rows.length)} fields`,
])
</script>

<template>
  <article class="hoja" :aria-labelledby="uid">
    <DatosCabecera :id="uid" kind="file" :badge="pad(detail.rows.length)" :name="detail.name" :line="line">
      <nav v-if="prev || next" class="vecinos" aria-label="Records vecinos">
        <NuxtLink v-if="prev" :to="prev.to" class="vecino" rel="prev"><span aria-hidden="true">‹</span> {{ prev.label }}</NuxtLink>
        <span v-else class="vecino off" aria-hidden="true">‹</span>
        <NuxtLink v-if="next" :to="next.to" class="vecino" rel="next">{{ next.label }} <span aria-hidden="true">›</span></NuxtLink>
        <span v-else class="vecino off" aria-hidden="true">›</span>
      </nav>
    </DatosCabecera>

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
}

.vecinos { display: flex; align-items: center; gap: 4px; font-family: var(--font-text); font-size: var(--d-fs-ui); }
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
  .vecinos { width: 100%; }
  .vecino:first-child { margin-right: auto; }
  .campo, .campo.wide {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "nombre tipo" "valor valor";
  }
  .campo .tipo { text-align: right; }
}
</style>
