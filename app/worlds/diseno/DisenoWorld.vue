<script setup lang="ts">
// Renderer DISEÑO, versión Fase 2: el armazón. Secciones arriba, y de cada
// record solo lo que este mundo tiene derecho a mostrar: el nombre y la obra.
// La forma propia de cada sección llega en las Fases 4 y 5 (`/nueva-seccion`).
import type { Project } from '~/lib/api'
import { collectionOrder, docOrder, fieldMeta, type CollectionKey, type DocKey } from '~/lib/fieldMeta'
import { isDoc, isRoot, routeFor } from '~/lib/path'

const api = useApi()
const route = useRoute()
const { path, query } = useMundo()

useHead({
  htmlAttrs: { 'data-mundo': 'diseno' },
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

type View =
  | { kind: 'list', items: { slug: string, name: string }[] }
  | { kind: 'record', name: string, rotulo: string | null, cover: { src: string, alt: string, width: number, height: number } | null }
  | { kind: 'doc', title: string, prose: string[] }

const { data: view, error } = await useAsyncData<View>(
  computed(() => `diseno${route.fullPath}`),
  async () => {
    const [root, slug] = path.value
    if (!isRoot(root) || root === 'orgs') throw createError({ statusCode: 404, statusMessage: 'no existe' })

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
      const r = (await api.record(root, slug)) as unknown as Record<string, unknown>
      const cover = root === 'projects' ? ((r as unknown as Project).media ?? []).find(m => m.role === 'COVER') ?? null : null
      // Lo compartido con motivo: la org rotula la banda, los años son la dimensión de la experiencia.
      const rotulo = root === 'experience'
        ? [(r.org as { name: string } | null)?.name, `${String(r.startedAt).slice(0, 4)}–${r.endedAt ? String(r.endedAt).slice(0, 4) : ''}`].filter(Boolean).join(' · ')
        : root === 'stack' ? `desde ${r.since}` : null
      return {
        kind: 'record',
        name: String(r[nameField]),
        rotulo,
        cover: cover ? { src: cover.src, alt: cover.alt, width: cover.width, height: cover.height } : null,
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

    <main class="cuerpo">
      <p v-if="error" class="k">{{ error.statusCode ?? 500 }} · {{ error.statusMessage ?? error.message }}</p>

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
.secciones {
  flex: none;
  display: flex;
  border-bottom: 1px solid var(--n-edge);
  padding-right: 150px;
}
.secciones a {
  flex: 1;
  padding: 14px 6px;
  border-right: 1px solid var(--n-edge);
  color: var(--n-faint);
  font-size: var(--n-fs-k);
  letter-spacing: var(--n-track);
  text-transform: uppercase;
  text-align: center;
  text-decoration: none;
  transition: color var(--n-dur-ui);
}
.secciones a:hover, .secciones a[aria-current] { color: var(--n-bone); }
.secciones a[aria-current] { box-shadow: inset 0 -2px 0 var(--n-ember); }

.cuerpo {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 18px;
  padding: var(--n-frame);
}
.k {
  margin: 0;
  font-size: var(--n-fs-k);
  letter-spacing: var(--n-track);
  text-transform: uppercase;
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
  .secciones { padding-right: 0; flex-wrap: wrap; }
  .secciones a { flex: 1 1 33%; }
}
</style>
