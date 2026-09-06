<script setup lang="ts">
// La sección `about` de DISEÑO: un specimen. El nombre y la bio, compuestos
// en Fraunces, y el mismo scrubber recorriendo sus ejes de blando a firme:
// óptico chico y trazo blando y torcido en un extremo, óptico grande y
// trazo firme y recto en el otro. Muestra criterio tipográfico haciéndolo,
// no declarándolo. Este mundo lee los textos largos del documento (bio,
// goal); los hechos cortos (origen, idiomas, disponibilidad) son de DATOS.
import { gsap } from 'gsap'
import DisenoRango from '../DisenoRango.vue'

const api = useApi()

const { data, error } = await useAsyncData('diseno-about', async () => {
  const { data } = await api.doc('about')
  const campo = (n: string) => data.fields.find(f => f.name === n && (!f.worlds || f.worlds.includes('diseno')))?.value ?? null
  return { name: campo('name') ?? data.title, role: campo('role'), bio: campo('bio'), goal: campo('goal') }
})

if (import.meta.server && error.value) {
  const event = useRequestEvent()
  if (event) setResponseStatus(event, error.value.statusCode ?? 500)
}

// ---- Los ejes: un recorrido de blando a firme, manejado por un solo scrubber. ----
const progreso = ref(1000)
const conJs = ref(false)
const arrastrando = ref(false)
let viaje: gsap.core.Tween | null = null
const t = computed(() => progreso.value / 1000)
const lerp = (a: number, b: number) => a + (b - a) * t.value
const ejes = computed(() => ({
  '--opsz': lerp(9, 144).toFixed(1),
  '--wght': lerp(320, 600).toFixed(0),
  '--soft': lerp(100, 0).toFixed(1),
  '--wonk': t.value < 0.5 ? 1 : 0,
}))
const lectura = computed(() => t.value < 0.33 ? 'blando' : t.value < 0.66 ? 'a medio camino' : 'firme')

function viajar() {
  viaje?.kill()
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { progreso.value = 1000; return }
  const estado = { p: 0 }
  viaje = gsap.to(estado, { p: 1000, duration: 3, ease: 'expo.inOut', onUpdate: () => { if (!arrastrando.value) progreso.value = Math.round(estado.p) } })
}
function agarrar() { arrastrando.value = true; viaje?.kill() }

onMounted(() => { conJs.value = true; viajar() })
onBeforeUnmount(() => viaje?.kill())
</script>

<template>
  <div class="about" :class="{ js: conJs }" :style="ejes">
    <p v-if="error" class="k">{{ error.statusCode ?? 500 }} · {{ error.statusMessage ?? error.message }}</p>
    <template v-else-if="data">
      <article class="specimen">
        <h1 class="nombre" data-anchor>{{ data.name }}</h1>
        <p v-if="data.role" class="rol">{{ data.role }}</p>
        <p v-if="data.bio" class="bio">{{ data.bio }}</p>
        <p v-if="data.goal" class="goal">{{ data.goal }}</p>
      </article>

      <section class="eje" aria-label="Los ejes de la tipografía">
        <p class="eje-l" aria-hidden="true"><span>blando</span><span class="eje-v">{{ lectura }}</span><span>firme</span></p>
        <div class="scrub">
          <DisenoRango v-model="progreso" label="Llevar la tipografía de blando a firme" :valuetext="lectura" @agarrar="agarrar" @soltar="arrastrando = false" />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.about { display: flex; flex-direction: column; flex: 1; justify-content: center; gap: clamp(28px, 5vh, 56px); padding-bottom: 4vh; }
.k { margin: 0; font-size: 12px; color: var(--n-faint); }

/* Todo el specimen lee los mismos ejes: un solo recorrido cambia el nombre, el rol y la prosa. */
.specimen { display: flex; flex-direction: column; gap: 22px; max-width: 62ch; font-family: var(--font-display); }
.nombre {
  margin: 0;
  font-size: clamp(40px, 6.4vw, 96px);
  line-height: 0.95;
  letter-spacing: -0.03em;
  color: var(--n-paper);
  font-variation-settings: 'opsz' var(--opsz), 'wght' var(--wght), 'SOFT' var(--soft), 'WONK' var(--wonk);
  text-wrap: balance;
}
.rol {
  margin: -6px 0 0;
  font-size: clamp(16px, 1.5vw, 20px);
  color: var(--n-dim);
  font-variation-settings: 'opsz' var(--opsz), 'wght' calc(var(--wght) - 120), 'SOFT' var(--soft), 'WONK' var(--wonk);
}
.bio, .goal {
  margin: 0;
  font-size: clamp(17px, 1.6vw, 22px);
  line-height: 1.5;
  color: var(--n-bone);
  font-variation-settings: 'opsz' clamp(9, calc(var(--opsz) / 4), 36), 'wght' calc(var(--wght) - 160), 'SOFT' var(--soft), 'WONK' var(--wonk);
}
.goal { color: var(--n-dim); font-size: clamp(15px, 1.35vw, 18px); }

.eje { max-width: 520px; }
.eje-l { display: flex; justify-content: space-between; margin: 0 0 2px; font-size: 11px; color: var(--n-faint); }
.eje-v { color: var(--n-paper); }
.scrub { display: none; }
.js .scrub { display: block; }

@media (max-width: 900px) {
  .nombre { font-size: clamp(34px, 11vw, 56px); }
}
</style>
