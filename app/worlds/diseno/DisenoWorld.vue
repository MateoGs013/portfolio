<script setup lang="ts">
// Renderer DISEÑO: secciones arriba, y cada sección con su propia forma.
// `projects` y `experience` ya tienen la suya (`sections/`); el resto sigue
// con el armazón de la Fase 2 hasta que le llegue su turno.
import SeccionExperiencia from './sections/SeccionExperiencia.vue'
import SeccionProyectos from './sections/SeccionProyectos.vue'
import { collectionOrder, docOrder, fieldMeta, type CollectionKey, type DocKey } from '~/lib/fieldMeta'
import { isDoc, isRoot, routeFor } from '~/lib/path'

const api = useApi()
const route = useRoute()
const { path, query } = useMundo()

useHead({
  htmlAttrs: { 'data-mundo': 'diseno' },
  meta: [{ name: 'theme-color', content: '#0e0b07' }],
  title: computed(() => ['diseño', ...path.value].join(' / ')),
})
usePreloadFonts('diseno')

/** Las secciones de este mundo. `orgs` no está: se llega por relación, y eso es DATOS. */
const sections: (CollectionKey | DocKey)[] = [...collectionOrder, ...docOrder]

// `/diseno` a secas no es una vista: es la primera sección.
if (!path.value.length) {
  await navigateTo(routeFor('diseno', ['projects'], query.value), { replace: true, redirectCode: 302 })
}
watch(path, (p) => {
  if (!p.length) navigateTo(routeFor('diseno', ['projects'], query.value), { replace: true })
})

const section = computed(() => path.value[0])

/** La marca de la cabecera: el nombre, leído del documento `about` como todo lo demás. */
const { data: marca } = await useAsyncData('diseno-marca', async () => {
  const { data } = await api.doc('about')
  return data.fields.find(f => f.name === 'name')?.value ?? data.title
})
/** Las secciones que ya tienen forma propia no pasan por el armazón. */
const propia = computed(() => section.value === 'projects' || section.value === 'experience')

type View =
  | { kind: 'section' }
  | { kind: 'list', items: { slug: string, name: string }[] }
  | { kind: 'record', name: string, rotulo: string | null, cover: { src: string, alt: string, width: number, height: number } | null }
  | { kind: 'doc', title: string, prose: string[] }

const { data: view, error } = await useAsyncData<View>(
  computed(() => `diseno${route.fullPath}`),
  async () => {
    const [root, slug] = path.value
    if (!isRoot(root) || root === 'orgs') throw createError({ statusCode: 404, statusMessage: 'no existe' })
    if (root === 'projects' || root === 'experience') return { kind: 'section' }

    if (isDoc(root)) {
      const { data } = await api.doc(root)
      return {
        kind: 'doc',
        title: data.title,
        prose: data.fields.filter(f => (!f.worlds || f.worlds.includes('diseno')) && f.type === 'text').map(f => f.value),
      }
    }

    const nameField = fieldMeta[root].nameField
    if (slug) {
      const r = (await api.record(root, slug)).data as unknown as Record<string, unknown>
      // Lo compartido con motivo: `since` es el tamaño del chip en stack.
      const rotulo = root === 'stack' ? `desde ${r.since}` : null
      return {
        kind: 'record',
        name: String(r[nameField]),
        rotulo,
        cover: null, // la obra de un proyecto la muestra su propia sección
      }
    }

    const { data } = await api.list(root, query.value)
    return {
      kind: 'list',
      items: (data as unknown as Record<string, unknown>[]).map(r => ({ slug: String(r.slug), name: String(r[nameField]) })),
    }
  },
)

if (import.meta.server && error.value) {
  const event = useRequestEvent()
  if (event) setResponseStatus(event, error.value.statusCode ?? 500)
}
</script>

<template>
  <div class="diseno">
    <header class="cabecera">
      <NuxtLink :to="routeFor('diseno', ['projects'], query)" class="marca">{{ marca }}</NuxtLink>
      <nav class="secciones" aria-label="Secciones">
        <NuxtLink
          v-for="s in sections"
          :key="s"
          :to="routeFor('diseno', [s], query)"
          :aria-current="s === section ? 'page' : undefined"
        >
          {{ s }}
        </NuxtLink>
      </nav>
    </header>

    <main id="contenido" class="cuerpo" :class="{ propia }" tabindex="-1">
      <p v-if="error" class="k">{{ error.statusCode ?? 500 }} · {{ error.statusMessage ?? error.message }}</p>

      <SeccionProyectos v-else-if="section === 'projects'" />
      <SeccionExperiencia v-else-if="section === 'experience'" />

      <template v-else-if="view?.kind === 'list'">
        <ol class="indice">
          <li v-for="it in view.items" :key="it.slug">
            <NuxtLink :to="routeFor('diseno', [section!, it.slug], query)" class="nombre">{{ it.name }}</NuxtLink>
          </li>
        </ol>
      </template>

      <template v-else-if="view?.kind === 'record'">
        <figure v-if="view.cover" class="obra">
          <img :src="view.cover.src" :alt="view.cover.alt" :width="view.cover.width" :height="view.cover.height">
        </figure>
        <h1 class="titulo" data-anchor>{{ view.name }}</h1>
        <p v-if="view.rotulo" class="k">{{ view.rotulo }}</p>
      </template>

      <template v-else-if="view?.kind === 'doc'">
        <h1 class="titulo">{{ view.title }}</h1>
        <p v-for="(p, i) in view.prose" :key="i" class="prosa">{{ p }}</p>
      </template>
    </main>
  </div>
</template>

<style scoped>
.diseno {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  color: var(--n-bone);
  font-family: var(--font-text);
  font-size: var(--n-fs);
  line-height: var(--n-lh);
}
/* La cabecera: la marca, las secciones y, a la derecha, el lugar del control de
   pasaje (que es fijo y vive en el layout, alineado a esta misma fila). */
.cabecera {
  flex: none;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 150px;
  align-items: center;
  gap: clamp(24px, 4vw, 56px);
  height: var(--n-head);
  padding: 0 var(--n-frame);
  border-bottom: 1px solid var(--n-edge);
}
.marca {
  font-family: var(--font-display);
  font-size: 19px;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--n-paper);
  text-decoration: none;
  white-space: nowrap;
  font-variation-settings: 'opsz' 48, 'wght' 560, 'SOFT' 30, 'WONK' 1;
}
.secciones { display: flex; gap: 4px; min-width: 0; }
.secciones a {
  padding: 10px 12px;
  color: var(--n-dim);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: color var(--n-dur-ui), box-shadow var(--n-dur-ui);
}
.secciones a:hover { color: var(--n-bone); }
.secciones a[aria-current] { color: var(--n-paper); box-shadow: inset 0 -2px 0 var(--n-ember); }

.cuerpo {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 18px;
  padding: var(--n-frame);
}
.cuerpo.propia { justify-content: stretch; }
.k {
  margin: 0;
  font-size: 12px;
  color: var(--n-faint);
}

.indice { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.15em; }
.nombre, .titulo {
  font-family: var(--font-display);
  color: var(--n-paper);
  letter-spacing: -0.035em;
  line-height: 0.9;
  text-decoration: none;
  font-variation-settings: 'opsz' 120, 'wght' 620, 'SOFT' 30, 'WONK' 1;
}
.nombre {
  font-size: clamp(30px, 5.2vw, 68px);
  color: var(--n-dim);
  transition: color var(--n-dur-ui), font-variation-settings var(--n-dur-ui);
}
.nombre:hover, .nombre:focus-visible {
  color: var(--n-paper);
  font-variation-settings: 'opsz' 144, 'wght' 720, 'SOFT' 60, 'WONK' 1;
}
.titulo { margin: 0; font-size: clamp(34px, 6vw, 84px); }

.obra { margin: 0; max-width: min(100%, 960px); }
.obra img {
  width: 100%;
  height: auto;
  box-shadow: 0 36px 80px -28px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 240, 210, 0.07);
}

.prosa {
  margin: 0;
  max-width: 44ch;
  font-family: var(--font-display);
  font-size: clamp(15px, 1.5vw, 19px);
  color: #c2b69d;
  font-variation-settings: 'opsz' 18, 'wght' 420, 'SOFT' 20;
}

@media (max-width: 900px) {
  /* La marca arriba con el control de pasaje a su derecha; las secciones debajo, en una fila que scrollea. */
  .cabecera {
    grid-template-columns: minmax(0, 1fr) 130px;
    grid-template-rows: var(--n-head-sm) auto;
    height: auto;
    gap: 0;
  }
  .marca { font-size: 17px; }
  .secciones {
    grid-column: 1 / -1;
    margin: 0 calc(-1 * var(--n-frame));
    padding: 0 calc(var(--n-frame) - 12px);
    overflow-x: auto;
    scrollbar-width: none;
    border-top: 1px solid var(--n-edge);
  }
  .secciones a { padding: 12px 12px; }
}
</style>
