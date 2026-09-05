<script setup lang="ts">
// La hoja del record: nombre, tipo, y la tabla de campos con su tipo.
// Los valores que son filtros válidos se tocan y facetan la colección.
import { pad, type Detail } from './explorer'

defineProps<{ detail: Detail }>()
</script>

<template>
  <article class="hoja" :class="{ portada: detail.kind === 'root' }" :aria-label="detail.name">
    <header class="cabecera">
      <h1 class="titulo" data-anchor>{{ detail.name }}</h1>
      <p class="linea">
        <span>{{ detail.type }}</span>
        <span v-if="detail.updated">updatedAt {{ detail.updated }}</span>
        <span>{{ pad(detail.rows.length) }} fields</span>
      </p>
    </header>

    <dl class="campos">
      <div v-for="row in detail.rows" :key="row.name" class="campo" :class="{ wide: row.wide }">
        <dt class="nombre">{{ row.name }}</dt>
        <dd class="tipo">{{ row.type }}</dd>
        <dd class="valor">
          <NuxtLink v-if="row.to" :to="row.to" class="rel">{{ row.value }} <span aria-hidden="true">›</span></NuxtLink>
          <a v-else-if="row.href" :href="row.href" rel="noopener" class="ext">{{ row.value }}</a>
          <NuxtLink v-else-if="row.facet" :to="row.facet" class="facet" :title="`filtrar ${row.name} = ${row.value}`">{{ row.value }}</NuxtLink>
          <span v-else-if="row.value === null" class="nul">NULL</span>
          <template v-else>{{ row.value }}</template>
        </dd>
      </div>
    </dl>

    <section v-for="g in detail.groups" :key="g.head" class="grupo" :aria-label="g.head">
      <h2 class="grupo-head">{{ g.head }} <span class="grupo-n">{{ pad(g.rows.length) }}</span></h2>
      <dl class="campos tablas">
        <div v-for="row in g.rows" :key="row.name" class="campo">
          <dt class="nombre"><NuxtLink v-if="row.to" :to="row.to">{{ row.name }}</NuxtLink><template v-else>{{ row.name }}</template></dt>
          <dd class="tipo">{{ row.type }}</dd>
          <dd class="valor">
            <NuxtLink v-if="row.to" :to="row.to" class="rel">{{ row.value }} <span aria-hidden="true">›</span></NuxtLink>
            <template v-else>{{ row.value }}</template>
          </dd>
        </div>
      </dl>
    </section>
  </article>
</template>

<style scoped>
.hoja {
  flex: 1 1 var(--d-pane-min);
  min-width: var(--d-pane-min);
  max-width: 1040px;
  padding-right: 16px;
  animation: entrar var(--d-dur) var(--d-ease) both;
}
@keyframes entrar {
  from { transform: translateX(12px); opacity: 0; }
}

.cabecera {
  min-height: var(--d-row);
  padding-bottom: 14px;
  border-bottom: 1px solid var(--d-ink);
}
.titulo {
  margin: 4px 0 12px;
  font-family: var(--font-text);
  font-size: var(--d-fs-title);
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1;
  overflow-wrap: anywhere;
}
.portada .titulo {
  margin: 2px 0 18px;
  font-size: var(--d-fs-portada);
  letter-spacing: -0.045em;
  line-height: 0.92;
  max-width: 12ch;
}
.linea {
  display: flex;
  flex-wrap: wrap;
  gap: 0 18px;
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-dim);
  font-variant-numeric: tabular-nums;
}

.campos { margin: 0; }
.campo {
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr) auto;
  grid-template-areas: "nombre valor tipo";
  gap: 4px 16px;
  align-items: baseline;
  min-height: var(--d-row);
  padding: 12px 0;
  border-bottom: 1px solid var(--d-rule);
}
.campo.wide {
  grid-template-columns: 1fr auto;
  grid-template-areas: "nombre tipo" "valor valor";
  gap: 8px 16px;
}
.nombre { grid-area: nombre; margin: 0; font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-dim); }
.tipo { grid-area: tipo; margin: 0; font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-faint); text-align: right; white-space: nowrap; }
.valor {
  grid-area: valor;
  margin: 0;
  font-family: var(--font-text);
  font-size: var(--d-fs-value);
  line-height: var(--d-lh);
  overflow-wrap: anywhere;
}
.campo.wide .valor { max-width: 62ch; font-size: var(--d-fs-read); line-height: 1.5; }

.grupo { margin-top: 40px; }
.grupo-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--d-ink);
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  font-weight: 400;
  color: var(--d-dim);
}
.tablas .campo { min-height: 56px; }
.tablas .nombre { font-family: var(--font-text); font-size: var(--d-fs-value); font-weight: 500; color: var(--d-ink); }
.tablas .nombre a { color: inherit; text-decoration: none; }
.tablas .nombre a:hover { color: var(--d-sig); }

.valor a { color: var(--d-sig); text-decoration: none; }
.valor a:hover { text-decoration: underline; }
.valor .facet { color: var(--d-ink); border-bottom: 1px dotted var(--d-sig); }
.valor .facet:hover { color: var(--d-sig); text-decoration: none; }
.valor .ext { text-decoration: underline; text-decoration-color: var(--d-rule); }
.nul { font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-faint); }

@media (max-width: 600px) {
  .campo { grid-template-columns: 1fr auto; grid-template-areas: "nombre tipo" "valor valor"; }
}
</style>
