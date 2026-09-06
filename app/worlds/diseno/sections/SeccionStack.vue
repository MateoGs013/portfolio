<script setup lang="ts">
// La sección `stack` de DISEÑO: la caja de herramientas por año. Cada
// tecnología es su nombre en Fraunces, tan grande como años lleva en uso, y
// el scrubber mueve un año: lo que ya había entrado ese año se enciende, lo
// que todavía no queda apagado. Nada sale: la caja solo se llena. Este
// mundo muestra el nombre y desde cuándo; la categoría, la nota y con qué
// se usó son de DATOS.
import { gsap } from 'gsap'
import DisenoRango from '../DisenoRango.vue'
import { routeFor } from '~/lib/path'

const api = useApi()
const route = useRoute()
const { path, query } = useMundo()
const slug = computed(() => path.value[1] ?? null)

interface Herramienta { slug: string, name: string, since: number }

const { data, error } = await useAsyncData(
  computed(() => `diseno-stack${route.fullPath}`),
  async () => {
    const list = (await api.list('stack', query.value)).data
    if (slug.value && !list.some(t => t.slug === slug.value)) throw createError({ statusCode: 404, statusMessage: 'no existe' })
    const herramientas: Herramienta[] = [...list]
      .sort((a, b) => a.since - b.since || a.name.localeCompare(b.name))
      .map(t => ({ slug: t.slug, name: t.name, since: t.since }))
    return { herramientas, hoy: new Date().getFullYear() }
  },
)

if (import.meta.server && error.value) {
  const event = useRequestEvent()
  if (event) setResponseStatus(event, error.value.statusCode ?? 500)
}

const herramientas = computed(() => data.value?.herramientas ?? [])
const hoy = computed(() => data.value?.hoy ?? new Date().getFullYear())
const primero = computed(() => Math.min(...herramientas.value.map(t => t.since)))
const anios = computed(() => Array.from({ length: hoy.value - primero.value + 1 }, (_, i) => primero.value + i))
const elegida = computed(() => herramientas.value.find(t => t.slug === slug.value) ?? null)

// ---- El año que marca el cabezal. ----
const paso = ref(0)
const conJs = ref(false)
const arrastrando = ref(false)
let viaje: gsap.core.Tween | null = null
const anio = computed(() => primero.value + paso.value)
const entro = (t: Herramienta) => t.since <= anio.value
const encendidas = computed(() => herramientas.value.filter(entro).length)

/** Tamaño por antigüedad: cada año de uso suma cuerpo y peso. */
function estilo(t: Herramienta) {
  const years = Math.max(0, hoy.value - t.since)
  return {
    '--fs': `${1 + years * 0.42}em`,
    '--wght': String(420 + years * 55),
  }
}

/** Al llegar, el año viaja del primero a hoy; abrir una herramienta lleva el año a su entrada. */
function viajar() {
  viaje?.kill()
  const destino = elegida.value ? elegida.value.since - primero.value : anios.value.length - 1
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { paso.value = destino; return }
  const estado = { p: elegida.value ? paso.value : 0 }
  viaje = gsap.to(estado, { p: destino, duration: elegida.value ? 1 : 2.4, ease: 'expo.out', onUpdate: () => { if (!arrastrando.value) paso.value = Math.round(estado.p) } })
}
function agarrar() { arrastrando.value = true; viaje?.kill() }

onMounted(() => { conJs.value = true; paso.value = anios.value.length - 1; viajar() })
watch(slug, viajar)
onBeforeUnmount(() => viaje?.kill())
</script>

<template>
  <div class="stack" :class="{ js: conJs }">
    <p v-if="error" class="k">{{ error.statusCode ?? 500 }} · {{ error.statusMessage ?? error.message }}</p>
    <template v-else>
      <header class="lectura">
        <template v-if="elegida">
          <h1 :id="`tech-${elegida.slug}`" class="anio" data-anchor>{{ elegida.name }}</h1>
          <p class="cuanto">desde {{ elegida.since }}</p>
          <NuxtLink :to="routeFor('diseno', ['stack'], query)" class="volver">toda la caja</NuxtLink>
        </template>
        <template v-else>
          <p class="anio"><span class="anio-k">la caja en</span> {{ anio === hoy ? 'hoy' : anio }}</p>
          <p class="cuanto" aria-live="polite">{{ encendidas === herramientas.length ? 'todo lo que hay' : `lo que ya había entrado` }}</p>
        </template>
      </header>

      <!-- La caja: los nombres, tan grandes como años llevan; encendidos si ya habían entrado ese año. -->
      <ul class="caja" aria-label="Herramientas">
        <li v-for="t in herramientas" :key="t.slug" :class="{ on: entro(t), elegida: elegida?.slug === t.slug }" :style="estilo(t)">
          <NuxtLink :to="routeFor('diseno', ['stack', t.slug], query)" class="nombre" :aria-current="elegida?.slug === t.slug ? 'page' : undefined">{{ t.name }}</NuxtLink>
          <span class="desde" aria-hidden="true">{{ t.since }}</span>
        </li>
      </ul>

      <section class="eje" aria-label="Año">
        <ol class="anios" aria-hidden="true">
          <li v-for="(a, i) in anios" :key="a" :class="{ on: i === paso }">{{ a }}</li>
        </ol>
        <div class="scrub">
          <DisenoRango v-model="paso" :max="anios.length - 1" label="Elegir el año" :valuetext="String(anio)" @agarrar="agarrar" @soltar="arrastrando = false" />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; flex: 1; justify-content: center; gap: clamp(24px, 4vh, 44px); padding-bottom: 4vh; }
.k { margin: 0; font-size: 12px; color: var(--n-faint); }

.lectura { display: flex; flex-direction: column; gap: 10px; }
.anio {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(38px, 6vw, 88px);
  line-height: 0.95;
  letter-spacing: -0.035em;
  color: var(--n-paper);
  font-variation-settings: 'opsz' 144, 'wght' 560, 'SOFT' 40, 'WONK' 1;
}
.anio-k { color: var(--n-dim); font-variation-settings: 'opsz' 144, 'wght' 380, 'SOFT' 100, 'WONK' 1; }
.cuanto { margin: 0; font-size: 12px; color: var(--n-dim); }
.volver { align-self: flex-start; margin-top: 6px; font-size: 12px; color: var(--n-dim); text-decoration: none; }
.volver:hover { color: var(--n-paper); text-decoration: underline; text-underline-offset: 4px; }

/* ---- La caja ---- */
.caja {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35em 0.9em;
  font-size: clamp(15px, 1.5vw, 21px);
  max-width: 1180px;
}
.caja li { display: inline-flex; align-items: baseline; gap: 0.35em; }
.nombre {
  font-family: var(--font-display);
  font-size: var(--fs);
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--n-faint);
  text-decoration: none;
  font-variation-settings: 'opsz' 96, 'wght' 300, 'SOFT' 100, 'WONK' 1;
  transition: color var(--n-dur-ui) var(--n-ease), font-variation-settings var(--n-dur) var(--n-ease), text-shadow var(--n-dur-ui) var(--n-ease);
}
.desde { font-size: 10px; color: var(--n-faint); opacity: 0; transition: opacity var(--n-dur-ui); }
li.on .nombre {
  color: var(--n-paper);
  font-variation-settings: 'opsz' 96, 'wght' var(--wght), 'SOFT' 30, 'WONK' 1;
  text-shadow: 0 0 28px rgba(239, 228, 204, 0.18);
}
li.on .desde { opacity: 1; }
li.elegida .nombre { color: var(--n-ember); text-shadow: 0 0 28px rgba(200, 69, 28, 0.35); }
.nombre:hover { color: var(--n-paper); }

/* ---- El eje ---- */
.eje { max-width: 720px; }
.anios { list-style: none; margin: 0 0 4px; padding: 0; display: flex; justify-content: space-between; font-size: 11px; color: var(--n-faint); }
.anios li { transition: color var(--n-dur-ui); }
.anios li.on { color: var(--n-paper); }
.scrub { display: none; }
.js .scrub { display: block; }

@media (max-width: 900px) {
  .anio { font-size: clamp(34px, 11vw, 56px); }
  .caja { font-size: 13px; gap: 0.3em 0.7em; }
}
</style>
