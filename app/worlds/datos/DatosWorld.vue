<script setup lang="ts">
// Renderer DATOS: explorador de columnas en perspectiva CSS, con la hoja del
// record al final. Un solo renderer para todas las colecciones. La ruta es
// el estado: el teclado y el "ir a" solo navegan; no hay selección en memoria.
import DatosColumn from './DatosColumn.vue'
import DatosDetail from './DatosDetail.vue'
import DatosGoto from './DatosGoto.vue'
import { pad, resolveExplorer, type Explorer, type Item } from './explorer'
import { isDoc, routeFor, type Root } from '~/lib/path'

const api = useApi()
const route = useRoute()
const { path, query } = useMundo()

useHead({
  htmlAttrs: { 'data-mundo': 'datos' },
  meta: [{ name: 'theme-color', content: '#eef0f2' }],
  title: computed(() => ['datos', ...path.value].join(' / ')),
})
usePreloadFonts('datos')

const { data: ex, error } = await useAsyncData<Explorer>(
  computed(() => `datos${route.fullPath}`),
  () => resolveExplorer(api, path.value, route.query),
)

// Un 404 es un dato más, pero con el status correcto en el servidor.
if (import.meta.server && error.value) {
  const event = useRequestEvent()
  if (event) setResponseStatus(event, error.value.statusCode ?? 500)
}

const columns = computed(() => ex.value?.columns ?? [])
const detail = computed(() => ex.value?.detail ?? null)

const segments = computed(() => [
  { label: 'db', to: routeFor('datos', []) },
  ...path.value.map((seg, i) => ({ label: seg, to: routeFor('datos', path.value.slice(0, i + 1), query.value) })),
])

/** La columna cuya elección es el último segmento del path. */
const focus = computed(() => Math.max(0, path.value.length - 1))

/** Distancia en Z: la última superficie (la hoja, si hay) está a 0. */
const dist = (i: number) => columns.value.length - 1 - i + (detail.value ? 1 : 0)

/** Mobile muestra una sola cosa: la hoja si se llegó a un record o a un doc, si no la última columna. */
const mobile = computed(() => {
  const root = path.value[0]
  const leaf = path.value.length === 2 || (path.value.length === 1 && isDoc(root as Root))
  return detail.value && leaf ? 'hoja' : 'columna'
})

const gotoOpen = ref(false)

// Tras navegar con el teclado, el foco sigue a la posición: la fila elegida
// en la columna que quedó activa, o el título de la hoja si se entró a un record.
const viaTeclado = ref(false)
watch(ex, async () => {
  if (!viaTeclado.value) return
  viaTeclado.value = false
  await nextTick()
  const root = document.querySelector<HTMLElement>('.datos')
  const target = root?.querySelector<HTMLElement>('.col.live .row[aria-current]')
    ?? root?.querySelector<HTMLElement>('.hoja .titulo')
  target?.focus({ preventScroll: false })
}, { flush: 'post' })

function onKey(e: KeyboardEvent) {
  if (gotoOpen.value) return
  const t = e.target as HTMLElement | null
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return

  if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
    e.preventDefault()
    gotoOpen.value = true
    return
  }

  const cols = columns.value
  const col = cols[focus.value]
  if (!col) return
  const idx = col.items.findIndex(i => i.key === col.selected)
  const go = (item?: Item) => {
    if (!item?.to) return
    e.preventDefault()
    viaTeclado.value = true
    navigateTo(item.to)
  }

  switch (e.key) {
    case 'ArrowDown':
      go(col.items[idx < 0 ? 0 : Math.min(idx + 1, col.items.length - 1)])
      break
    case 'ArrowUp':
      go(col.items[idx < 0 ? col.items.length - 1 : Math.max(idx - 1, 0)])
      break
    case 'ArrowRight':
    case 'Enter': {
      if (e.key === 'Enter' && t?.tagName === 'A') return // el link ya navega solo
      const next = cols[focus.value + 1]
      if (col.selected && next?.items.length) go(next.items[0])
      break
    }
    case 'ArrowLeft':
    case 'Escape':
      if (path.value.length) {
        e.preventDefault()
        viaTeclado.value = true
        navigateTo(routeFor('datos', path.value.slice(0, -1), path.value.length > 1 ? query.value : undefined))
      }
      break
  }
}

onMounted(() => addEventListener('keydown', onKey))
onBeforeUnmount(() => removeEventListener('keydown', onKey))
</script>

<template>
  <div class="datos" :class="`m-${mobile}`">
    <header class="rail top">
      <nav class="ruta" aria-label="Ruta">
        <template v-for="(seg, i) in segments" :key="seg.label + i">
          <span v-if="i" class="sep" aria-hidden="true">/</span>
          <NuxtLink v-if="i < segments.length - 1" :to="seg.to">{{ seg.label }}</NuxtLink>
          <span v-else class="here" aria-current="page">{{ seg.label }}</span>
        </template>
      </nav>
      <button class="goto-btn" type="button" @click="gotoOpen = true">
        ir a <kbd>/</kbd>
      </button>
    </header>

    <main id="contenido" class="exp" tabindex="-1">
      <div v-if="error" class="track">
        <DatosDetail
          :detail="{
            kind: 'document',
            name: `error ${error.statusCode ?? 500}`,
            type: 'response',
            updated: null,
            rows: [
              { name: 'status', type: 'int', value: String(error.statusCode ?? 500) },
              { name: 'message', type: 'string', value: error.statusMessage ?? error.message },
              { name: 'request', type: 'string', value: (error.data as { request?: string } | undefined)?.request ?? null },
            ],
          }"
        />
      </div>
      <div v-else class="track">
        <DatosColumn
          v-for="(c, i) in columns"
          :key="`${i}:${c.head}`"
          :column="c"
          :dist="dist(i)"
          :class="{ last: i === columns.length - 1, live: i === focus }"
        />
        <DatosDetail v-if="detail" :detail="detail" />
      </div>
    </main>

    <footer class="rail bot">
      <span v-if="ex" class="req">{{ ex.request.line }}</span>
      <span v-if="ex" class="medida">{{ ex.request.status }} · {{ ex.request.ms }} ms · {{ pad(ex.request.count) }} {{ ex.request.count === 1 ? 'record' : 'records' }}</span>
      <span class="keys" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> mover <kbd>→</kbd> entrar <kbd>←</kbd> volver <kbd>/</kbd> ir a</span>
    </footer>

    <DatosGoto v-if="gotoOpen" @close="gotoOpen = false" />
  </div>
</template>

<style scoped>
.datos {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  color: var(--d-ink);
  font-family: var(--font-text);
  font-size: var(--d-fs-ui);
  line-height: var(--d-lh);
  font-variant-numeric: tabular-nums;
}
.ruta, .req, kbd { font-family: var(--font-mono); font-size: var(--d-fs-mono); }

.rail {
  flex: none;
  display: flex;
  align-items: center;
  gap: 24px;
  height: 48px;
  padding: 0 var(--d-frame);
}
.rail.top { border-bottom: 1px solid var(--d-rule); padding-right: 172px; }
.exp:focus { outline: none; }
.rail.bot { height: 40px; border-top: 1px solid var(--d-rule); color: var(--d-dim); }

.ruta { display: flex; align-items: center; min-width: 0; white-space: nowrap; overflow: hidden; }
.ruta a { color: var(--d-sig); text-decoration: none; }
.ruta a:hover { text-decoration: underline; }
.sep { color: var(--d-faint); padding: 0 8px; }
.here { color: var(--d-ink); }

.goto-btn {
  margin-left: auto;
  border: 0;
  background: none;
  padding: 6px 0;
  font: inherit;
  font-weight: 500;
  color: var(--d-dim);
  cursor: pointer;
}
.goto-btn:hover { color: var(--d-ink); }
kbd {
  display: inline-block;
  min-width: 18px;
  margin: 0 2px;
  padding: 1px 4px 0;
  border: 1px solid var(--d-rule);
  border-radius: 2px;
  line-height: 1.3;
  text-align: center;
  color: var(--d-dim);
}

.exp {
  flex: 1;
  min-height: 0;
  padding: var(--d-frame);
  /* Profundidad casi imperceptible: las columnas retroceden apenas hacia la izquierda,
     sin converger hacia el centro (eso las haría pisarse). */
  perspective: 2400px;
  perspective-origin: 0% 50%;
  overflow: hidden;
  display: flex;
  justify-content: flex-end;
  /* Lo que no entra por la izquierda se desvanece en vez de cortarse. */
  mask-image: linear-gradient(to right, transparent 0, #000 var(--d-frame));
}
.track {
  display: flex;
  align-items: flex-start;
  flex: none;
  width: 100%;
  max-height: 100%;
  margin-right: auto;
  transform-style: preserve-3d;
}
.track:has(.col:nth-child(3)) { width: max-content; min-width: 100%; }
.track > * {
  max-height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--d-rule) transparent;
}

.req { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.medida { flex: none; }
.keys { flex: none; margin-left: auto; display: flex; gap: 10px; align-items: center; }

@media (max-width: 900px) {
  .datos { height: auto; min-height: 100dvh; }
  .rail.top { padding-right: 150px; }
  .goto-btn { display: none; }
  .exp { perspective: none; overflow: visible; display: block; mask-image: none; }
  .track, .track:has(.col:nth-child(3)) { display: block; width: auto; min-width: 0; transform: none; margin: 0; }
  .track > * { max-height: none; overflow: visible; }
  .track > :deep(.col) { width: 100%; margin: 0; transform: none; opacity: 1; }
  .track > :deep(.hoja) { min-width: 0; padding-right: 0; }
  /* Una sola cosa por pantalla. */
  .m-columna .track > :deep(.col:not(.last)), .m-columna .track > :deep(.hoja) { display: none; }
  .m-hoja .track > :deep(.col) { display: none; }
  .keys { display: none; }
}
</style>
