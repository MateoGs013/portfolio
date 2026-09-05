<script setup lang="ts">
// Renderer DATOS. En la Fase 2 es una sola columna: la ruta arriba, el nivel
// actual en el medio, el request abajo. Es la forma que el mundo tiene en
// mobile y la base sobre la que la Fase 3 monta las columnas en perspectiva.
import { pad, resolveLevel, type Level } from './levels'
import { routeFor } from '~/lib/path'

const api = useApi()
const route = useRoute()
const { path, query } = useMundo()

useHead({
  htmlAttrs: { 'data-mundo': 'datos' },
  title: computed(() => ['datos', ...path.value].join(' / ')),
})
usePreloadFonts('datos')

const { data: level, error } = await useAsyncData<Level>(
  computed(() => `datos${route.fullPath}`),
  () => resolveLevel(api, path.value, route.query),
)

// Un 404 se muestra como lo que es, un dato más, pero con el status correcto.
if (import.meta.server && error.value) {
  const event = useRequestEvent()
  if (event) setResponseStatus(event, error.value.statusCode ?? 500)
}

const segments = computed(() => [
  { label: 'db', to: routeFor('datos', []) },
  ...path.value.map((seg, i) => ({ label: seg, to: routeFor('datos', path.value.slice(0, i + 1), query.value) })),
])
</script>

<template>
  <div class="datos">
    <header class="bar top">
      <nav class="ruta" aria-label="Ruta">
        <template v-for="(seg, i) in segments" :key="seg.label + i">
          <span v-if="i" class="sep" aria-hidden="true">/</span>
          <NuxtLink v-if="i < segments.length - 1" :to="seg.to">{{ seg.label }}</NuxtLink>
          <span v-else class="here" aria-current="page">{{ seg.label }}</span>
        </template>
      </nav>
    </header>

    <main class="exp">
      <section v-if="error" class="col">
        <h1 class="colhead">error · {{ error.statusCode ?? 500 }}</h1>
        <dl class="campos">
          <div class="field">
            <dt class="fname">status</dt>
            <dd class="ftype">int</dd>
            <dd class="fval">{{ error.statusCode ?? 500 }}</dd>
          </div>
          <div class="field">
            <dt class="fname">message</dt>
            <dd class="ftype">string</dd>
            <dd class="fval">{{ error.statusMessage ?? error.message }}</dd>
          </div>
        </dl>
      </section>

      <section v-else-if="level" class="col">
        <h1 class="colhead">{{ level.head }} · {{ pad(level.count) }}</h1>

        <ol v-if="level.items.length" class="lista">
          <li v-for="it in level.items" :key="it.key">
            <NuxtLink v-if="it.to" :to="it.to" class="item">
              <span class="iname">{{ it.label }}</span>
              <span class="imeta">{{ it.meta }}</span>
              <span class="chev" aria-hidden="true">{{ it.kids ? '›' : '' }}</span>
            </NuxtLink>
            <a v-else-if="it.href" :href="it.href" class="item" rel="noopener">
              <span class="iname">{{ it.label }}</span>
              <span class="imeta">{{ it.meta }}</span>
              <span class="chev" aria-hidden="true">↗</span>
            </a>
          </li>
        </ol>

        <div v-if="level.rows.length" class="pane">
          <p v-if="level.type" class="ptype">{{ level.type }}</p>
          <h2 v-if="level.name" data-anchor>{{ level.name }}</h2>
          <dl class="campos">
            <div v-for="row in level.rows" :key="row.name" class="field" :class="{ wide: row.wide }">
              <dt class="fname">{{ row.name }}</dt>
              <dd v-if="!row.wide" class="ftype">{{ row.type }}</dd>
              <dd class="fval">
                <NuxtLink v-if="row.to" :to="row.to">{{ row.value }} ›</NuxtLink>
                <a v-else-if="row.href" :href="row.href" rel="noopener">{{ row.value }}</a>
                <span v-else-if="row.value === null" class="nul">NULL</span>
                <template v-else>{{ row.value }}</template>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </main>

    <footer class="bar bot">
      <span class="req">{{ level?.request ?? '' }}</span>
    </footer>
  </div>
</template>

<style scoped>
.datos {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  color: var(--d-ink);
  font-family: var(--font-mono);
  font-size: var(--d-fs);
  line-height: var(--d-lh);
}
.bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  height: 44px;
  padding: 0 var(--d-frame);
  font-size: 10px;
  letter-spacing: 0.06em;
}
.bar.top { border-bottom: 1px solid var(--d-rule); padding-right: 150px; }
.bar.bot { height: 38px; border-top: 1px solid var(--d-rule); color: var(--d-dim); }

.ruta { display: flex; align-items: center; white-space: nowrap; overflow: hidden; }
.ruta a { color: var(--d-sig); text-decoration: none; }
.ruta a:hover { text-decoration: underline; }
.sep { color: var(--d-faint); padding: 0 6px; }
.here { color: var(--d-ink); }

.exp { flex: 1; padding: var(--d-frame); }
.col { max-width: 720px; }
.colhead {
  margin: 0 0 0;
  padding-bottom: 9px;
  border-bottom: 1px solid var(--d-ink);
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.2em;
  color: var(--d-dim);
  text-transform: uppercase;
}

.lista { list-style: none; margin: 0; padding: 0; }
.item {
  display: grid;
  grid-template-columns: 1fr auto 12px;
  gap: 10px;
  align-items: baseline;
  padding: 10px 9px;
  border-bottom: 1px solid var(--d-rule);
  color: inherit;
  text-decoration: none;
  transition: background var(--d-dur);
}
.item:hover { background: var(--d-hover); }
.item[aria-current="page"], .item.router-link-exact-active { background: var(--d-ink); color: var(--d-paper); }
.item.router-link-exact-active .imeta, .item.router-link-exact-active .chev { color: #a5a59f; }
.iname {
  font-family: var(--font-text);
  font-weight: 600;
  font-size: var(--d-fs-name);
  letter-spacing: -0.015em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.imeta { font-size: var(--d-fs-meta); letter-spacing: 0.1em; color: var(--d-dim); }
.chev { font-size: 12px; color: var(--d-faint); justify-self: end; }

.pane h2 {
  margin: 12px 0 3px;
  font-family: var(--font-text);
  font-weight: 700;
  font-size: 28px;
  letter-spacing: -0.035em;
  line-height: 0.95;
}
.ptype { margin: 14px 0 0; font-size: 9px; letter-spacing: 0.2em; color: var(--d-dim); }
.campos { margin: 12px 0 0; }
.field {
  display: grid;
  grid-template-columns: 110px 130px 1fr;
  gap: 12px;
  align-items: baseline;
  padding: 9px 0;
  border-bottom: 1px solid var(--d-rule);
}
.field.wide { grid-template-columns: 1fr; gap: 5px; padding-bottom: 13px; }
.fname { font-size: 9px; letter-spacing: var(--d-track); color: var(--d-dim); }
.ftype { margin: 0; font-size: 9px; color: var(--d-faint); }
.fval {
  margin: 0;
  font-family: var(--font-text);
  font-size: var(--d-fs-name);
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.field.wide .fval { font-size: 14.5px; line-height: 1.6; max-width: 52ch; }
.fval a { color: var(--d-sig); }
.nul { font-family: var(--font-mono); font-size: 11px; color: var(--d-faint); }

.req { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

@media (max-width: 600px) {
  .field { grid-template-columns: 90px 1fr; }
  .ftype { display: none; }
}
</style>
