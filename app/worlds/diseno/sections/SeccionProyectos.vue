<script setup lang="ts">
// La sección `projects` de DISEÑO. El índice es una tira de película; un
// proyecto es la obra que se pinta mientras se cuenta, con un scrubber que
// recorre el encargo, las etapas y el resultado. Este mundo muestra el
// trabajo: brief, etapas, media, resultado. Los hechos (año, rol, stack)
// son del otro mundo.
//
// Sin JS todo está en su estado final. Con `prefers-reduced-motion` la
// línea de tiempo arranca en el final y el scrubber sigue en manos del
// visitante. La dirección está en docs/decisiones.md → "Fase 4".
import { gsap } from 'gsap'
import ProyectosTira, { type Fotograma } from './ProyectosTira.vue'
import DisenoRango from '../DisenoRango.vue'
import type { Media, Project } from '~/lib/api'
import { routeFor } from '~/lib/path'

const api = useApi()
const route = useRoute()
const { path, query } = useMundo()

const slug = computed(() => path.value[1] ?? null)

interface Etapa { key: string, title: string, body: string, media: Media | null }
interface Obra {
  slug: string
  title: string
  cover: Media | null
  layers: Media[]
  brief: string | null
  outcome: string | null
  steps: Etapa[]
}

const { data, error } = await useAsyncData(
  computed(() => `diseno-projects${route.fullPath}`),
  async () => {
    const list = (await api.list('projects', query.value)).data
    const items: Fotograma[] = list.map(p => ({
      slug: p.slug,
      title: p.title,
      cover: (p as Project).media?.find(m => m.role === 'COVER') ?? null,
      to: routeFor('diseno', ['projects', p.slug], query.value),
    }))
    let obra: Obra | null = null
    if (slug.value) {
      const p = (await api.record('projects', slug.value)).data
      const media = p.media ?? []
      obra = {
        slug: p.slug,
        title: p.title,
        cover: media.find(m => m.role === 'COVER') ?? null,
        layers: media.filter(m => m.role === 'LAYER' && m.layer !== null).sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0)),
        brief: p.brief,
        outcome: p.outcome,
        steps: (p.steps ?? []).map(s => ({ key: String(s.id), title: s.title, body: s.body, media: s.media })),
      }
      // La lista no trae media: la portada del elegido sale del record.
      const mine = items.find(i => i.slug === p.slug)
      if (mine && !mine.cover) mine.cover = obra.cover
    }
    return { items, obra }
  },
)

if (import.meta.server && error.value) {
  const event = useRequestEvent()
  if (event) setResponseStatus(event, error.value.statusCode ?? 500)
}

const items = computed(() => data.value?.items ?? [])
const obra = computed(() => data.value?.obra ?? null)

/** Las paradas del scrubber, en orden: la pieza, el encargo, cada etapa, el resultado. */
const paradas = computed(() => {
  const o = obra.value
  if (!o) return []
  return [
    { key: 'pieza', label: o.title },
    ...(o.brief ? [{ key: 'brief', label: 'el pedido' }] : []),
    ...o.steps.map(s => ({ key: s.key, label: s.title })),
    ...(o.outcome ? [{ key: 'outcome', label: 'el resultado' }] : []),
  ]
})

// ---- La línea de tiempo: la obra se pinta mientras se cuenta. ----
const escena = ref<HTMLElement | null>(null)
const placa = ref<HTMLElement | null>(null)
const progreso = ref(1000)
const paradaActiva = ref(0)
const conJs = ref(false)
let tl: gsap.core.Timeline | null = null
const arrastrando = ref(false)
let fromRect: DOMRect | null = null
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function armar() {
  tl?.kill()
  tl = null
  const root = escena.value
  const o = obra.value
  if (!root || !o) return

  const q = gsap.utils.selector(root)
  const titulo = q('.titulo')
  const lienzo = q('.lienzo')
  const capas = q('.capa')
  const inicial = q('.inicial')
  const brief = q('.brief')
  const etapas = q('.etapa')
  const outcome = q('.outcome')
  const n = paradas.value.length
  const paso = 0.9 // segundos por parada

  const t = gsap.timeline({
    paused: true,
    onUpdate: () => {
      const p = t.progress()
      if (!arrastrando.value) progreso.value = Math.round(p * 1000)
      paradaActiva.value = Math.min(n - 1, Math.floor(p * n + 0.0001))
    },
  })

  // Parada 0: la placa llega y el título entra fino y blando, y toma cuerpo con la obra.
  t.fromTo(placa.value, { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: 'expo.out' }, 0)
  t.fromTo(titulo, { yPercent: 30, opacity: 0, '--wght': 300, '--soft': 100, '--opsz': 40 },
    { yPercent: 0, opacity: 1, '--wght': 620, '--soft': 30, '--opsz': 120, duration: 1.1, ease: 'expo.out' }, 0.15)
  if (inicial.length) t.fromTo(inicial, { '--wght': 300, opacity: 0.35 }, { '--wght': 700, opacity: 1, duration: paso * n, ease: 'none' }, 0)

  // La obra empieza apagada y se pinta a lo largo de todas las paradas.
  if (lienzo.length) t.fromTo(lienzo, { filter: 'brightness(0.35) saturate(0.4)' }, { filter: 'brightness(1) saturate(1)', duration: paso * n, ease: 'power1.inOut' }, 0)
  // Con capas, cada una aparece en su turno, sobre la anterior.
  capas.forEach((c, i) => {
    const en = paso * ((i + 1) / (capas.length + 1)) * n
    t.fromTo(c, { opacity: 0, yPercent: 4 }, { opacity: 1, yPercent: 0, duration: 0.8, ease: 'expo.out' }, en)
  })

  // Las paradas de texto: cada bloque se enciende cuando le toca.
  let k = 1
  const enciende = (el: Element[] | Element, cuando: number) => {
    t.fromTo(el, { opacity: 0.18, y: 14 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' }, cuando)
  }
  if (brief.length) enciende(brief, paso * k++)
  etapas.forEach(e => enciende(e, paso * k++))
  if (outcome.length) enciende(outcome, paso * k++)

  tl = t
  if (reduced()) t.progress(1)
  else t.play(0)
}

/** El fotograma tocado vuela hasta convertirse en la obra. */
function volar() {
  const from = fromRect
  fromRect = null
  const el = placa.value
  if (!from || !el || reduced()) return
  const to = el.getBoundingClientRect()
  gsap.fromTo(el,
    { x: from.left - to.left, y: from.top - to.top, scaleX: from.width / to.width, scaleY: from.height / to.height, transformOrigin: 'top left' },
    { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.95, ease: 'expo.out', onComplete: () => gsap.set(el, { clearProps: 'transform' }) },
  )
}

function onPick(_slug: string, rect: DOMRect) {
  fromRect = rect
}

function onScrub(v: number) {
  progreso.value = v
  tl?.progress(v / 1000).pause()
}

function agarrar() { arrastrando.value = true; tl?.pause() }
function soltar() { arrastrando.value = false }

function saltar(i: number) {
  const n = paradas.value.length
  tl?.progress(Math.min(0.999, (i + 0.5) / n)).pause()
}

onMounted(() => {
  conJs.value = true
  if (obra.value) { volar(); armar() }
})
watch(() => obra.value?.slug, async (s) => {
  if (!s) { tl?.kill(); tl = null; return }
  await nextTick()
  volar()
  armar()
}, { flush: 'post' })
onBeforeUnmount(() => tl?.kill())
</script>

<template>
  <div class="proyectos" :class="{ js: conJs }">
    <p v-if="error" class="k">{{ error.statusCode ?? 500 }} · {{ error.statusMessage ?? error.message }}</p>

    <!-- El índice: la hoja de contactos. -->
    <section v-else-if="!obra" class="indice" aria-label="Proyectos">
      <ProyectosTira :items="items" size="grande" @pick="onPick" />
    </section>

    <!-- Un proyecto: la obra que se pinta mientras se cuenta. -->
    <template v-else>
      <article ref="escena" class="proyecto" :aria-labelledby="`obra-${obra.slug}`">
        <div class="escena">
          <figure ref="placa" class="placa" :class="{ vacia: !obra.cover && !obra.layers.length }">
            <template v-if="obra.layers.length">
              <img
                v-for="(m, i) in obra.layers"
                :key="m.id"
                class="capa"
                :class="{ lienzo: i === 0 }"
                :src="m.src"
                :alt="i === 0 ? m.alt : ''"
                :width="m.width"
                :height="m.height"
                :fetchpriority="i === 0 ? 'high' : undefined"
              >
            </template>
            <img v-else-if="obra.cover" class="lienzo" :src="obra.cover.src" :alt="obra.cover.alt" :width="obra.cover.width" :height="obra.cover.height" fetchpriority="high">
            <span v-else class="inicial" aria-hidden="true">{{ obra.title.trim().charAt(0) }}</span>
            <figcaption v-if="obra.cover" class="sr">{{ obra.cover.alt }}</figcaption>
          </figure>

          <div class="scrub" :aria-hidden="!conJs">
            <DisenoRango :model-value="progreso" label="Recorrer el proyecto" :valuetext="paradas[paradaActiva]?.label" @update:model-value="onScrub" @agarrar="agarrar" @soltar="soltar" />
            <ol class="paradas" aria-hidden="true">
              <li v-for="(p, i) in paradas" :key="p.key" :class="{ on: i === paradaActiva }">
                <button type="button" tabindex="-1" @click="saltar(i)">{{ p.label }}</button>
              </li>
            </ol>
          </div>
        </div>

        <div class="relato">
          <h1 :id="`obra-${obra.slug}`" class="titulo" data-anchor>{{ obra.title }}</h1>
          <p v-if="obra.brief" class="brief">{{ obra.brief }}</p>
          <ol v-if="obra.steps.length" class="etapas">
            <li v-for="s in obra.steps" :key="s.key" class="etapa">
              <h2 class="etapa-t">{{ s.title }}</h2>
              <p class="etapa-b">{{ s.body }}</p>
              <img v-if="s.media" class="etapa-m" :src="s.media.src" :alt="s.media.alt" :width="s.media.width" :height="s.media.height" loading="lazy">
            </li>
          </ol>
          <p v-if="obra.outcome" class="outcome">{{ obra.outcome }}</p>
        </div>
      </article>

      <ProyectosTira :items="items" :current="obra.slug" size="chica" class="pie" @pick="onPick" />
    </template>
  </div>
</template>

<style scoped>
.proyectos { display: flex; flex-direction: column; flex: 1; min-height: 0; gap: clamp(20px, 3vh, 40px); }
.k { margin: 0; font-size: 12px; color: var(--n-faint); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

/* ---- El índice ---- */
.indice { flex: 1; padding-top: clamp(4px, 1.5vh, 16px); }

/* ---- Un proyecto ---- */
.proyecto {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(280px, 4fr);
  gap: clamp(24px, 4vw, 64px);
  align-items: start;
  align-content: start;
}
.escena { position: sticky; top: var(--n-frame); display: flex; flex-direction: column; gap: 14px; }

.placa {
  position: relative;
  margin: 0;
  aspect-ratio: 16 / 10;
  background: var(--n-panel);
  box-shadow: 0 0 0 1px rgba(239, 228, 204, 0.16), 0 40px 90px -30px rgba(0, 0, 0, 0.95);
  overflow: hidden;
  will-change: transform;
}
.placa img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: top; }
.placa .inicial {
  --wght: 700;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: clamp(120px, 22vw, 320px);
  line-height: 1;
  color: var(--n-paper);
  font-variation-settings: 'opsz' 144, 'wght' var(--wght), 'SOFT' 80, 'WONK' 1;
}

/* El scrubber: una línea con las paradas del relato. Solo con JS. */
.scrub { display: none; flex-direction: column; gap: 8px; }
.js .scrub { display: flex; }
.paradas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 11px;
  color: var(--n-faint);
}
.paradas li { min-width: 0; }
.paradas button {
  max-width: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: color var(--n-dur-ui);
}
.paradas li.on button { color: var(--n-paper); }
.paradas button:hover { color: var(--n-bone); }

/* El relato: el título toma cuerpo con la obra; cada bloque se enciende cuando le toca. */
.relato { display: flex; flex-direction: column; gap: 26px; max-width: 46ch; }
.titulo {
  --wght: 620;
  --soft: 30;
  --opsz: 120;
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(34px, 4.6vw, 64px);
  line-height: 0.95;
  letter-spacing: -0.035em;
  color: var(--n-paper);
  font-variation-settings: 'opsz' var(--opsz), 'wght' var(--wght), 'SOFT' var(--soft), 'WONK' 1;
  text-wrap: balance;
}
.brief, .outcome, .etapa-b {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(15px, 1.35vw, 18px);
  line-height: 1.5;
  color: #c2b69d;
  font-variation-settings: 'opsz' 18, 'wght' 420, 'SOFT' 20;
}
.brief { color: var(--n-bone); font-size: clamp(17px, 1.6vw, 21px); }
.etapas { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 22px; }
.etapa-t {
  margin: 0 0 6px;
  font-family: var(--font-text);
  font-size: 12px;
  font-weight: 500;
  color: var(--n-dim);
}
.etapa-m { display: block; width: 100%; height: auto; margin-top: 12px; box-shadow: 0 0 0 1px var(--n-edge); }
.outcome { padding-top: 22px; border-top: 1px solid var(--n-edge); color: var(--n-bone); }

.pie { flex: none; }

@media (max-width: 900px) {
  .proyecto { grid-template-columns: minmax(0, 1fr); }
  .escena { position: static; }
  .relato { max-width: none; }
}
@media (max-width: 640px) {
  /* En el teléfono no entran seis paradas: se lee solo la que está sonando. */
  .paradas { justify-content: flex-start; }
  .paradas li:not(.on) { display: none; }
}
</style>
