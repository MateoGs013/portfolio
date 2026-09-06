<script setup lang="ts">
// Renderer DISEÑO: la cabecera con la marca y las secciones, y cada sección
// con su propia forma (`sections/`). Acá no se dibuja contenido: se decide
// qué sección responde a la ruta y se le cede el cuerpo.
import SeccionAbout from './sections/SeccionAbout.vue'
import SeccionContact from './sections/SeccionContact.vue'
import SeccionExperiencia from './sections/SeccionExperiencia.vue'
import SeccionProyectos from './sections/SeccionProyectos.vue'
import SeccionStack from './sections/SeccionStack.vue'
import { collectionOrder, docOrder, type CollectionKey, type DocKey } from '~/lib/fieldMeta'
import { isDoc, isRoot, routeFor } from '~/lib/path'

const api = useApi()
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
/** La ruta tiene que ser una sección de este mundo; los documentos no tienen sub-ruta. */
const error = computed(() => {
  const [root, slug] = path.value
  if (!root) return null
  if (!isRoot(root) || root === 'orgs' || (isDoc(root) && slug)) return { statusCode: 404, statusMessage: 'no existe' }
  return null
})
if (import.meta.server && error.value) {
  const event = useRequestEvent()
  if (event) setResponseStatus(event, error.value.statusCode)
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

    <main id="contenido" class="cuerpo" tabindex="-1">
      <p v-if="error" class="k">{{ error.statusCode }} · {{ error.statusMessage }}</p>

      <SeccionProyectos v-else-if="section === 'projects'" />
      <SeccionExperiencia v-else-if="section === 'experience'" />
      <SeccionStack v-else-if="section === 'stack'" />
      <SeccionAbout v-else-if="section === 'about'" />
      <SeccionContact v-else-if="section === 'contact'" />

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
  padding: var(--n-frame);
}
.k {
  margin: 0;
  font-size: 12px;
  color: var(--n-faint);
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
