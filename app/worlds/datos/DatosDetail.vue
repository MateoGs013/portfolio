<script setup lang="ts">
// La hoja del record, compuesta como hoja de especificaciones: el título en
// una columna propia a la izquierda, los campos en una columna de lectura a
// la derecha. El tipo va pegado al valor, en su propia columna angosta, para
// que el ojo no cruce toda la pantalla. Los valores que son filtros válidos
// se tocan y facetan la colección.
import { pad, type Detail } from './explorer'

defineProps<{ detail: Detail }>()
const uid = useId()
</script>

<template>
  <article class="hoja" :class="{ portada: detail.kind === 'root' }" :aria-labelledby="uid">
    <header class="cabecera">
      <h1 :id="uid" class="titulo" tabindex="-1" data-anchor>{{ detail.name }}</h1>
      <p class="linea">
        <span>{{ detail.type }}</span>
        <span v-if="detail.updated">updatedAt {{ detail.updated }}</span>
        <span>{{ pad(detail.rows.length) }} fields</span>
      </p>
    </header>

    <div class="cuerpo">
      <dl class="campos">
        <div v-for="row in detail.rows" :key="row.name" class="campo" :class="{ wide: row.wide }">
          <dt class="nombre">{{ row.name }}</dt>
          <dd class="valor">
            <NuxtLink v-if="row.to" :to="row.to" class="rel">{{ row.value }} <span aria-hidden="true">›</span></NuxtLink>
            <a v-else-if="row.href" :href="row.href" rel="noopener" class="ext">{{ row.value }}</a>
            <NuxtLink v-else-if="row.facet" :to="row.facet" class="facet" :title="`filtrar ${row.name} = ${row.value}`">{{ row.value }}</NuxtLink>
            <span v-else-if="row.value === null" class="nul">NULL</span>
            <template v-else>{{ row.value }}</template>
          </dd>
          <dd class="tipo">{{ row.type }}</dd>
        </div>
      </dl>

      <section v-for="g in detail.groups" :key="g.head" class="grupo" :aria-label="g.head">
        <h2 class="grupo-head">{{ g.head }} <span>{{ pad(g.rows.length) }}</span></h2>
        <dl class="campos">
          <div v-for="row in g.rows" :key="row.name" class="campo">
            <dt class="nombre">{{ row.name }}</dt>
            <dd class="valor">
              <NuxtLink v-if="row.to" :to="row.to" class="rel">{{ row.value }} <span aria-hidden="true">›</span></NuxtLink>
              <template v-else>{{ row.value }}</template>
            </dd>
            <dd class="tipo">{{ row.type }}</dd>
          </div>
        </dl>
      </section>
    </div>
  </article>
</template>

<style scoped>
.hoja {
  flex: 1 1 var(--d-pane-min);
  min-width: var(--d-pane-min);
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px 48px;
  align-content: start;
  padding-right: 16px;
  scrollbar-gutter: stable;
  animation: entrar var(--d-dur) var(--d-ease) both;
}
@keyframes entrar {
  from { transform: translateX(12px); opacity: 0; }
}
/* Con ancho, el título vive en su propia columna y los campos en la de lectura. */
@media (min-width: 1700px) {
  .hoja { grid-template-columns: minmax(240px, 2fr) minmax(0, 5fr); }
  .cabecera { position: sticky; top: 0; }
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
  text-wrap: balance;
  overflow-wrap: anywhere;
  outline: none;
}
.portada .titulo {
  margin: 16px 0 18px;
  font-size: var(--d-fs-portada);
  letter-spacing: -0.045em;
  line-height: 0.92;
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

.cuerpo { border-top: 1px solid var(--d-ink); }
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
.campo.wide .valor { max-width: 62ch; font-size: var(--d-fs-read); line-height: 1.5; }

.valor a { color: var(--d-sig); text-decoration: none; }
.valor a:hover { text-decoration: underline; }
.valor .facet { color: var(--d-ink); border-bottom: 1px dotted var(--d-sig); }
.valor .facet:hover { color: var(--d-sig); text-decoration: none; }
.valor .ext { text-decoration: underline; text-decoration-color: var(--d-rule); }
.nul { font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-dim); }

.grupo { margin-top: 36px; }
.grupo-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--d-ink);
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  font-weight: 400;
  color: var(--d-dim);
}

@media (max-width: 640px) {
  .campo, .campo.wide {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "nombre tipo" "valor valor";
  }
  .campo .tipo { text-align: right; }
}
</style>
