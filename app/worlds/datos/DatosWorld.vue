<script setup lang="ts">
// Renderer DATOS: un explorador de archivos. La raíz es la carpeta de la
// base con sus tablas; una colección es la carpeta con sus records; un
// record es la hoja abierta. Una sola cosa por pantalla, la ruta arriba
// para volver, y los vecinos a los lados de la hoja. Un solo renderer para
// todas las colecciones. La ruta es el estado: el teclado mueve el foco por
// las filas y navega; no hay selección en memoria.
import DatosDetail from './DatosDetail.vue'
import DatosFolder from './DatosFolder.vue'
import DatosGoto from './DatosGoto.vue'
import { pad, resolveExplorer, type Explorer } from './explorer'
import { routeFor } from '~/lib/path'

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

const folder = computed(() => ex.value?.folder ?? null)
const detail = computed(() => ex.value?.detail ?? null)
/** Un record o un documento: la hoja sola, sin filas que recorrer. */
const hoja = computed(() => !!detail.value && !folder.value)

const segments = computed(() => [
  { label: 'db', to: routeFor('datos', []) },
  ...path.value.map((seg, i) => ({ label: seg, to: routeFor('datos', path.value.slice(0, i + 1), query.value) })),
])

// Entrar a una carpeta acerca el panel nuevo; subir lo trae desde adelante.
// Es el único movimiento del mundo y dura lo que tarda el request.
const dir = ref<'' | 'deeper' | 'up' | 'lateral'>('')
watch(() => ex.value?.level, (now, before) => {
  if (now === undefined || before === undefined) return
  dir.value = now > before ? 'deeper' : now < before ? 'up' : 'lateral'
})

const gotoOpen = ref(false)
const pane = ref<HTMLElement | null>(null)

/** Las filas que el teclado recorre en el panel actual, en orden de lectura. */
const rows = () => Array.from(pane.value?.querySelectorAll<HTMLElement>('[data-row]') ?? [])

// Tras navegar con el teclado, el foco sigue a la posición: al subir, la fila
// de la que se venía; si no, el título del panel nuevo.
const viaTeclado = ref(false)
let cameFrom: string | null = null
watch(ex, async () => {
  if (!viaTeclado.value) return
  viaTeclado.value = false
  await nextTick()
  const back = cameFrom ? rows().find(r => r.dataset.row === cameFrom) : undefined
  cameFrom = null
  ;(back ?? pane.value?.querySelector<HTMLElement>('[data-anchor]'))?.focus({ preventScroll: false })
}, { flush: 'post' })

function go(to: Parameters<typeof navigateTo>[0], from?: string) {
  viaTeclado.value = true
  cameFrom = from ?? null
  navigateTo(to)
}

function onKey(e: KeyboardEvent) {
  if (gotoOpen.value || !ex.value) return
  const t = e.target as HTMLElement | null
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  if (e.altKey || e.metaKey || e.ctrlKey) {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); gotoOpen.value = true }
    return
  }

  switch (e.key) {
    case '/':
      e.preventDefault()
      gotoOpen.value = true
      break

    case 'ArrowDown':
    case 'ArrowUp': {
      const down = e.key === 'ArrowDown'
      if (hoja.value) {
        // En la hoja no hay lista: ↑↓ pasan al record vecino.
        const vecino = down ? ex.value.next : ex.value.prev
        if (vecino) { e.preventDefault(); go(vecino.to) }
        return
      }
      const list = rows()
      if (!list.length) return
      e.preventDefault()
      const at = list.findIndex(r => r === t || r.contains(t))
      const to = at < 0 ? (down ? 0 : list.length - 1) : Math.min(Math.max(at + (down ? 1 : -1), 0), list.length - 1)
      list[to]?.focus()
      break
    }

    case 'ArrowRight':
    case 'Enter': {
      // Abrir la fila que tiene el foco. Un link con Enter ya navega solo;
      // solo hay que avisar que fue con teclado para que el foco siga.
      const row = t?.closest<HTMLElement>('[data-row]')
      if (!row) return
      viaTeclado.value = true
      if (e.key === 'Enter' && t?.tagName === 'A') return
      e.preventDefault()
      ;(row.tagName === 'A' ? row : row.querySelector('a'))?.click()
      break
    }

    case 'ArrowLeft':
    case 'Backspace':
    case 'Escape':
      if (ex.value.up) {
        e.preventDefault()
        go(ex.value.up, path.value[path.value.length - 1])
      }
      break
  }
}

onMounted(() => addEventListener('keydown', onKey))
onBeforeUnmount(() => removeEventListener('keydown', onKey))
</script>

<template>
  <div class="datos">
    <header class="rail top">
      <nav class="ruta" aria-label="Ruta">
        <template v-for="(seg, i) in segments" :key="seg.label + i">
          <span v-if="i" class="sep" aria-hidden="true">/</span>
          <NuxtLink v-if="i < segments.length - 1" :to="seg.to">{{ seg.label }}</NuxtLink>
          <span v-else class="here" aria-current="page">{{ seg.label }}</span>
        </template>
      </nav>
      <button class="goto-btn" type="button" @click="gotoOpen = true">
        <span class="goto-k">ir a</span>
        <span class="goto-ph">proyecto, tecnología, etapa…</span>
        <kbd>/</kbd>
      </button>
    </header>

    <main id="contenido" class="exp" tabindex="-1">
      <div v-if="error" class="pane">
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
      <div v-else-if="ex" ref="pane" :key="route.fullPath" class="pane" :class="dir">
        <DatosFolder v-if="folder" :folder="folder" />
        <DatosDetail v-else-if="detail" :detail="detail" :prev="ex.prev" :next="ex.next" />
      </div>
    </main>

    <footer class="rail bot">
      <span v-if="ex" class="req">{{ ex.request.line }}</span>
      <span v-if="ex" class="medida">{{ ex.request.status }} · {{ ex.request.ms }} ms · {{ pad(ex.request.count) }} {{ ex.request.count === 1 ? 'record' : 'records' }}</span>
      <span class="keys" aria-hidden="true">
        <template v-if="hoja && (ex?.prev || ex?.next)"><kbd>↑</kbd><kbd>↓</kbd> vecino</template>
        <template v-else-if="!hoja"><kbd>↑</kbd><kbd>↓</kbd> mover <kbd>↵</kbd> abrir</template>
        <template v-if="ex?.up"><kbd>←</kbd> volver</template>
        <kbd>/</kbd> ir a
      </span>
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
.rail.top { border-bottom: 1px solid var(--d-rule); padding-right: calc(var(--d-frame) + 150px); }
.exp:focus { outline: none; }
.rail.bot { height: 40px; border-top: 1px solid var(--d-rule); color: var(--d-dim); }

/* La ruta es la barra de dirección: cada segmento es una carpeta a la que se vuelve. */
.ruta { display: flex; align-items: center; min-width: 0; white-space: nowrap; overflow: hidden; font-size: 12.5px; }
.ruta a { color: var(--d-sig); text-decoration: none; padding: 6px 0; }
.ruta a:hover { text-decoration: underline; }
.sep { color: var(--d-faint); padding: 0 9px; }
.here { color: var(--d-ink); }

.goto-btn {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 300px;
  height: 30px;
  margin-left: auto;
  padding: 0 4px 0 10px;
  border: 1px solid var(--d-rule);
  background: var(--d-paper);
  font: inherit;
  color: var(--d-dim);
  text-align: left;
  cursor: pointer;
}
.goto-btn:hover { border-color: var(--d-ink); color: var(--d-ink); }
.goto-k { font-family: var(--font-mono); font-size: var(--d-fs-mono); color: var(--d-ink); }
.goto-ph { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--d-faint); }
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
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--d-rule) transparent;
  /* La profundidad ya no es una disposición: es el gesto de entrar y salir de una carpeta. */
  perspective: 1200px;
  perspective-origin: 50% 40%;
}
.pane { animation: var(--d-dur) var(--d-ease) both; }
.pane.deeper { animation-name: acercar; }
.pane.up { animation-name: alejar; }
.pane.lateral { animation-name: correr; }
@keyframes acercar { from { transform: translateZ(calc(var(--d-z) * -1)); opacity: 0; } }
@keyframes alejar { from { transform: translateZ(var(--d-z)); opacity: 0; } }
@keyframes correr { from { transform: translateX(12px); opacity: 0; } }

.req { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.medida { flex: none; }
.keys { flex: none; margin-left: auto; display: flex; gap: 10px; align-items: center; }

@media (max-width: 900px) {
  .datos { height: auto; min-height: 100dvh; }
  .rail.top { padding-right: calc(var(--d-frame) + 130px); }
  .goto-btn { display: none; }
  .exp { overflow: visible; perspective: none; }
  .keys { display: none; }
}
</style>
