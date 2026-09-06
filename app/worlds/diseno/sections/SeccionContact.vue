<script setup lang="ts">
// La sección `contact` de DISEÑO: los créditos. Es la última sección y se
// comporta como el final de una película: las líneas suben desde abajo,
// una por vez, y quedan quietas. Cada dato del documento es una línea, los
// links son links (mailto, github) y la última es el estado. Sin JS, los
// créditos ya están quietos.
import { gsap } from 'gsap'

const api = useApi()

interface Credito { name: string, value: string, href: string | null }

const { data, error } = await useAsyncData('diseno-contact', async () => {
  const { data } = await api.doc('contact')
  const creditos: Credito[] = data.fields
    .filter(f => !f.worlds || f.worlds.includes('diseno'))
    .map(f => ({
      name: f.name,
      value: f.type === 'url' ? f.value.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : f.value,
      href: f.type === 'url' ? (f.value.includes('@') && !f.value.startsWith('http') ? `mailto:${f.value}` : f.value) : null,
    }))
  return { title: data.title, creditos }
})

if (import.meta.server && error.value) {
  const event = useRequestEvent()
  if (event) setResponseStatus(event, error.value.statusCode ?? 500)
}

const rollo = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!rollo.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const lineas = rollo.value.querySelectorAll('.linea')
  gsap.fromTo(lineas, { yPercent: 140, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.4, ease: 'expo.out', stagger: 0.28 })
})
</script>

<template>
  <div class="contact">
    <p v-if="error" class="k">{{ error.statusCode ?? 500 }} · {{ error.statusMessage ?? error.message }}</p>
    <div v-else-if="data" ref="rollo" class="creditos">
      <h1 class="linea titulo" data-anchor>{{ data.title }}</h1>
      <dl class="lista">
        <div v-for="c in data.creditos" :key="c.name" class="linea">
          <dt class="que">{{ c.name }}</dt>
          <dd class="valor">
            <a v-if="c.href" :href="c.href" :rel="c.href.startsWith('http') ? 'noopener' : undefined">{{ c.value }}</a>
            <span v-else>{{ c.value }}</span>
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.contact { display: flex; flex-direction: column; flex: 1; justify-content: center; align-items: center; padding-bottom: 6vh; }
.k { margin: 0; font-size: 12px; color: var(--n-faint); }

.creditos { display: flex; flex-direction: column; align-items: center; gap: 34px; text-align: center; overflow: hidden; padding: 12px 0; }
.linea { will-change: transform; }
.titulo {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(15px, 1.4vw, 18px);
  letter-spacing: 0.02em;
  color: var(--n-dim);
  font-variation-settings: 'opsz' 18, 'wght' 420, 'SOFT' 60, 'WONK' 1;
}
.lista { display: flex; flex-direction: column; gap: 34px; margin: 0; }
.que { margin: 0 0 8px; font-size: 11px; color: var(--n-faint); }
.valor { margin: 0; }
.valor a, .valor span {
  font-family: var(--font-display);
  font-size: clamp(26px, 3.6vw, 54px);
  line-height: 1.05;
  letter-spacing: -0.025em;
  color: var(--n-paper);
  text-decoration: none;
  font-variation-settings: 'opsz' 96, 'wght' 520, 'SOFT' 30, 'WONK' 1;
  overflow-wrap: anywhere;
}
.valor a { transition: color var(--n-dur-ui), text-shadow var(--n-dur-ui); }
.valor a:hover, .valor a:focus-visible { color: var(--n-paper); text-shadow: 0 0 28px rgba(200, 120, 60, 0.55); text-decoration: underline; text-underline-offset: 8px; text-decoration-color: var(--n-ember); }
.valor span { color: var(--n-bone); font-size: clamp(18px, 2vw, 28px); font-variation-settings: 'opsz' 36, 'wght' 420, 'SOFT' 40, 'WONK' 1; }
</style>
