<script setup lang="ts">
// La sección `experience` de DISEÑO: una exposición larga. Las etapas son
// bandas sobre el eje de los años, superpuestas porque así fue (desde 2024
// corren tres a la vez), y un cabezal recorre el tiempo: donde está, las
// etapas que corrían en esa fecha se encienden y se leen; el resto queda
// apagado. Al llegar, el cabezal viaja del primer día a hoy. Abrir una
// etapa la deja encendida con su relato. Este mundo muestra el rol, la
// organización, el tiempo y el relato; el stack y el resumen son de DATOS.
import { gsap } from 'gsap'
import DisenoRango from '../DisenoRango.vue'
import { routeFor } from '~/lib/path'

const api = useApi()
const route = useRoute()
const { path, query } = useMundo()
const slug = computed(() => path.value[1] ?? null)

interface Etapa {
  slug: string
  role: string
  org: string | null
  story: string | null
  from: number
  to: number | null
  row: number
}

const { data, error } = await useAsyncData(
  computed(() => `diseno-experience${route.fullPath}`),
  async () => {
    const list = (await api.list('experience', query.value)).data
    if (slug.value && !list.some(e => e.slug === slug.value)) throw createError({ statusCode: 404, statusMessage: 'no existe' })
    // Por fecha de inicio, y cada etapa en la primera fila donde no se pisa con otra.
    const sorted = [...list].sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    const rows: number[] = []
    const etapas: Etapa[] = sorted.map((e) => {
      const from = Date.parse(e.startedAt)
      const to = e.endedAt ? Date.parse(e.endedAt) : null
      let row = rows.findIndex(end => end <= from)
      if (row < 0) row = rows.length
      rows[row] = to ?? Infinity
      return { slug: e.slug, role: e.role, org: e.org?.name ?? null, story: e.story, from, to, row }
    })
    return { etapas, rows: rows.length, hoy: Date.now() }
  },
)

if (import.meta.server && error.value) {
  const event = useRequestEvent()
  if (event) setResponseStatus(event, error.value.statusCode ?? 500)
}

const etapas = computed(() => data.value?.etapas ?? [])
const hoy = computed(() => data.value?.hoy ?? Date.now())
const desde = computed(() => Math.min(...etapas.value.map(e => e.from)))
const largo = computed(() => hoy.value - desde.value)
const pos = (t: number) => ((t - desde.value) / largo.value) * 100
const elegida = computed(() => etapas.value.find(e => e.slug === slug.value) ?? null)

/** Los años del eje: un tick por cada 1 de enero dentro del rango. */
const anios = computed(() => {
  const out: { year: number, x: number }[] = []
  for (let y = new Date(desde.value).getFullYear() + 1; y <= new Date(hoy.value).getFullYear(); y++) {
    out.push({ year: y, x: pos(Date.UTC(y, 0, 1)) })
  }
  return out
})

// ---- El cabezal: dónde está en el tiempo. ----
const progreso = ref(1000)
const conJs = ref(false)
const arrastrando = ref(false)
let viaje: gsap.core.Tween | null = null
const cuando = computed(() => desde.value + (progreso.value / 1000) * largo.value)

const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const fecha = computed(() => {
  if (progreso.value >= 998) return 'hoy'
  const d = new Date(cuando.value)
  return `${meses[d.getUTCMonth()]} ${d.getUTCFullYear()}`
})
const activa = (e: Etapa) => e.from <= cuando.value && (e.to === null || e.to >= cuando.value)
const encendidas = computed(() => etapas.value.filter(activa))

/** Al llegar, el cabezal viaja del primer día a hoy; abrir una etapa lo lleva a su mitad. */
function viajar() {
  viaje?.kill()
  const destino = elegida.value ? Math.round(((elegida.value.from + (elegida.value.to ?? hoy.value)) / 2 - desde.value) / largo.value * 1000) : 1000
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { progreso.value = destino; return }
  const estado = { p: elegida.value ? progreso.value : 0 }
  viaje = gsap.to(estado, { p: destino, duration: elegida.value ? 1.2 : 2.6, ease: 'expo.out', onUpdate: () => { if (!arrastrando.value) progreso.value = Math.round(estado.p) } })
}

function agarrar() { arrastrando.value = true; viaje?.kill() }

onMounted(() => { conJs.value = true; viajar() })
watch(slug, viajar)
onBeforeUnmount(() => viaje?.kill())
</script>

<template>
  <div class="experiencia" :class="{ js: conJs }">
    <p v-if="error" class="k">{{ error.statusCode ?? 500 }} · {{ error.statusMessage ?? error.message }}</p>
    <template v-else>
      <!-- La lectura: qué fecha marca el cabezal y qué corría entonces. -->
      <header class="lectura">
        <template v-if="elegida">
          <h1 :id="`etapa-${elegida.slug}`" class="fecha" data-anchor><span class="fecha-k">etapa</span> {{ elegida.role }}</h1>
          <p class="cuando">
            <span v-if="elegida.org">{{ elegida.org }} · </span>{{ new Date(elegida.from).getUTCFullYear() }}–{{ elegida.to ? new Date(elegida.to).getUTCFullYear() : 'hoy' }}
          </p>
          <p v-if="elegida.story" class="story">{{ elegida.story }}</p>
          <NuxtLink :to="routeFor('diseno', ['experience'], query)" class="volver">todas las etapas</NuxtLink>
        </template>
        <template v-else>
          <p class="fecha"><span class="fecha-k">en</span> {{ fecha }}</p>
          <ul class="corriendo" aria-live="polite">
            <li v-for="e in encendidas" :key="e.slug">
              <NuxtLink :to="routeFor('diseno', ['experience', e.slug], query)" class="rol">{{ e.role }}</NuxtLink>
              <span v-if="e.org" class="org">{{ e.org }}</span>
            </li>
            <li v-if="!encendidas.length" class="nada">todavía nada</li>
          </ul>
        </template>
      </header>

      <!-- La película: una banda por etapa sobre el eje de los años, y el cabezal. -->
      <section class="pelicula" aria-label="Etapas sobre el tiempo">
        <ol class="bandas" :style="{ '--filas': data?.rows ?? 1 }">
          <li
            v-for="e in etapas"
            :key="e.slug"
            class="banda"
            :class="{ on: activa(e), elegida: elegida?.slug === e.slug, corta: pos(e.to ?? hoy) - pos(e.from) < 16 }"
            :style="{ '--x': pos(e.from) + '%', '--w': pos(e.to ?? hoy) - pos(e.from) + '%', '--fila': e.row }"
          >
            <NuxtLink :to="routeFor('diseno', ['experience', e.slug], query)" class="banda-a" :aria-current="elegida?.slug === e.slug ? 'page' : undefined">
              <span class="banda-t">{{ e.role }}<span v-if="e.org" class="banda-o"> · {{ e.org }}</span></span>
            </NuxtLink>
          </li>
        </ol>
        <div class="cabezal" :style="{ '--x': progreso / 10 + '%' }" aria-hidden="true" />
        <ol class="anios" aria-hidden="true">
          <li v-for="a in anios" :key="a.year" :style="{ '--x': a.x + '%' }">{{ a.year }}</li>
        </ol>
        <div class="scrub">
          <DisenoRango v-model="progreso" label="Recorrer el tiempo" :valuetext="fecha" @agarrar="agarrar" @soltar="arrastrando = false" />
        </div>
      </section>

    </template>
  </div>
</template>

<style scoped>
.experiencia { display: flex; flex-direction: column; flex: 1; justify-content: center; gap: clamp(28px, 5vh, 56px); padding-bottom: 6vh; }
.k { margin: 0; font-size: 12px; color: var(--n-faint); }

/* ---- La lectura ---- */
.lectura { display: flex; flex-direction: column; gap: 18px; max-width: 60ch; }
.fecha {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(38px, 6vw, 88px);
  line-height: 0.95;
  letter-spacing: -0.035em;
  color: var(--n-paper);
  font-variation-settings: 'opsz' 144, 'wght' 560, 'SOFT' 40, 'WONK' 1;
  text-wrap: balance;
}
.fecha-k { color: var(--n-dim); font-variation-settings: 'opsz' 144, 'wght' 380, 'SOFT' 100, 'WONK' 1; }
/* El rol de una etapa abierta es más largo que una fecha: entra a la escala de un título. */
h1.fecha { font-size: clamp(32px, 4.4vw, 60px); font-variation-settings: 'opsz' 120, 'wght' 600, 'SOFT' 30, 'WONK' 1; }
.corriendo { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 10px 36px; min-height: 2.4em; }
.corriendo li { display: flex; flex-direction: column; gap: 2px; }
.rol {
  font-family: var(--font-display);
  font-size: clamp(17px, 1.6vw, 22px);
  color: var(--n-bone);
  text-decoration: none;
  font-variation-settings: 'opsz' 60, 'wght' 500, 'SOFT' 30, 'WONK' 1;
  transition: color var(--n-dur-ui);
}
.rol:hover { color: var(--n-paper); text-decoration: underline; text-underline-offset: 4px; }
.org, .nada { font-size: 12px; color: var(--n-dim); }

/* ---- La película ---- */
.pelicula { position: relative; padding-bottom: 8px; }
.bandas {
  --alto: 40px;
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
  height: calc(var(--filas) * var(--alto));
}
.banda {
  position: absolute;
  left: var(--x);
  width: max(var(--w), 6px);
  top: calc(var(--fila) * var(--alto));
  height: calc(var(--alto) - 6px);
}
.banda-a {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 10px;
  background: rgba(239, 228, 204, 0.05);
  box-shadow: inset 0 0 0 1px var(--n-edge);
  color: var(--n-faint);
  font-size: 12px;
  white-space: nowrap;
  text-decoration: none;
  overflow: hidden;
  transition: background var(--n-dur-ui) var(--n-ease), color var(--n-dur-ui) var(--n-ease), box-shadow var(--n-dur-ui) var(--n-ease);
}
.banda.on .banda-a { background: rgba(239, 228, 204, 0.16); box-shadow: inset 0 0 0 1px rgba(239, 228, 204, 0.45), 0 0 26px -8px rgba(200, 120, 60, 0.45); color: var(--n-paper); }
.banda.elegida .banda-a { background: rgba(200, 69, 28, 0.28); box-shadow: inset 0 0 0 1px var(--n-ember); color: var(--n-paper); }
.banda-a:hover { color: var(--n-paper); box-shadow: inset 0 0 0 1px var(--n-bone); }
.banda-o { color: inherit; opacity: 0.7; }
.banda-t { overflow: hidden; text-overflow: ellipsis; }
/* Una banda corta no tiene lugar para su nombre: lo muestra afuera, a su izquierda. */
.banda.corta .banda-a { overflow: visible; justify-content: flex-end; padding: 0; }
.banda.corta .banda-t { position: absolute; right: calc(100% + 8px); overflow: visible; color: var(--n-faint); transition: color var(--n-dur-ui); }
.banda.corta.on .banda-t, .banda.corta.elegida .banda-t, .banda.corta .banda-a:hover .banda-t { color: var(--n-paper); }

.cabezal {
  position: absolute;
  top: -8px;
  bottom: 30px;
  left: var(--x);
  width: 1px;
  background: var(--n-ember);
  box-shadow: 0 0 18px 0 rgba(200, 69, 28, 0.55);
  pointer-events: none;
  opacity: 0;
}
.js .cabezal { opacity: 1; }

.anios { list-style: none; margin: 8px 0 0; padding: 0; position: relative; height: 18px; font-size: 11px; color: var(--n-faint); }
.anios li { position: absolute; left: var(--x); transform: translateX(-50%); padding-top: 4px; border-top: 1px solid var(--n-edge); }
.anios li::before { content: ''; position: absolute; top: -6px; left: 50%; width: 1px; height: 6px; background: var(--n-edge); }

.scrub { display: none; margin-top: 4px; }
.js .scrub { display: block; }

/* ---- La etapa abierta ---- */
.cuando { margin: 0; font-size: 12px; color: var(--n-dim); }
.story {
  margin: 6px 0 0;
  font-family: var(--font-display);
  font-size: clamp(17px, 1.6vw, 21px);
  line-height: 1.5;
  color: var(--n-bone);
  font-variation-settings: 'opsz' 18, 'wght' 420, 'SOFT' 20;
}
.volver { align-self: flex-start; margin-top: 8px; font-size: 12px; color: var(--n-dim); text-decoration: none; }
.volver:hover { color: var(--n-paper); text-decoration: underline; text-underline-offset: 4px; }

@media (max-width: 900px) {
  .bandas { --alto: 34px; }
  .banda-a { padding: 0 6px; font-size: 11px; }
  .fecha { font-size: clamp(34px, 11vw, 56px); }
}
</style>
