<script setup lang="ts">
// La tira de película: un fotograma por proyecto, retroiluminado cuando está
// elegido o bajo el cursor. Grande, es el índice de la sección; chica, queda
// bajo la obra para pasar de proyecto. El fotograma sin portada es una placa
// oscura con la inicial del nombre en Fraunces.
import type { RouteLocationRaw } from 'vue-router'

export interface Fotograma {
  slug: string
  title: string
  cover: { src: string, alt: string, width: number, height: number } | null
  to: RouteLocationRaw
}

defineProps<{
  items: Fotograma[]
  current?: string | null
  size: 'grande' | 'chica'
}>()

const emit = defineEmits<{ pick: [slug: string, rect: DOMRect] }>()

function onClick(e: MouseEvent, slug: string) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
  const frame = (e.currentTarget as HTMLElement).querySelector<HTMLElement>('.placa')
  if (frame) emit('pick', slug, frame.getBoundingClientRect())
}
</script>

<template>
  <nav class="tira" :class="size" aria-label="Proyectos">
    <ol class="carrete">
      <li v-for="(it, i) in items" :key="it.slug">
        <NuxtLink
          :to="it.to"
          class="fotograma"
          :aria-current="it.slug === current ? 'page' : undefined"
          :style="{ '--i': i }"
          @click="onClick($event, it.slug)"
        >
          <span class="placa" :class="{ vacia: !it.cover }">
            <img v-if="it.cover" :src="it.cover.src" :alt="''" :width="it.cover.width" :height="it.cover.height" loading="lazy" decoding="async">
            <span v-else class="inicial" aria-hidden="true">{{ it.title.trim().charAt(0) }}</span>
          </span>
          <span class="nombre">{{ it.title }}</span>
        </NuxtLink>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.carrete {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: var(--n-gap);
}
.tira.grande { --n-gap: clamp(10px, 1.4vw, 22px); }
.tira.chica { --n-gap: 8px; }

.fotograma {
  display: block;
  color: var(--n-dim);
  text-decoration: none;
  outline-offset: 6px;
}

/* La placa: la obra apagada; se enciende bajo el cursor o cuando es la elegida. */
.placa {
  position: relative;
  display: block;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--n-panel);
  box-shadow: 0 0 0 1px var(--n-edge), 0 24px 50px -30px rgba(0, 0, 0, 0.9);
  transition: box-shadow var(--n-dur-ui) var(--n-ease), transform var(--n-dur-ui) var(--n-ease);
}
.placa img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  filter: brightness(0.42) saturate(0.7);
  transition: filter var(--n-dur-ui) var(--n-ease);
}
.inicial {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 3.2em;
  line-height: 1;
  color: var(--n-faint);
  font-variation-settings: 'opsz' 144, 'wght' 500, 'SOFT' 80, 'WONK' 1;
  transition: color var(--n-dur-ui) var(--n-ease);
}
.fotograma:hover .placa,
.fotograma:focus-visible .placa,
.fotograma[aria-current] .placa {
  box-shadow: 0 0 0 1px rgba(239, 228, 204, 0.35), 0 0 34px -6px rgba(200, 120, 60, 0.35), 0 24px 50px -30px rgba(0, 0, 0, 0.9);
}
.fotograma:hover .placa img,
.fotograma:focus-visible .placa img,
.fotograma[aria-current] .placa img { filter: brightness(0.95) saturate(1); }
.fotograma:hover .inicial,
.fotograma:focus-visible .inicial,
.fotograma[aria-current] .inicial { color: var(--n-paper); }
.fotograma:hover .placa { transform: translateY(-3px); }

.nombre {
  display: block;
  margin-top: 10px;
  color: inherit;
  transition: color var(--n-dur-ui);
}
.fotograma:hover .nombre, .fotograma:focus-visible .nombre, .fotograma[aria-current] .nombre { color: var(--n-paper); }

/* Grande: el índice. El nombre en Fraunces, con aire. */
.grande .nombre {
  font-family: var(--font-display);
  font-size: clamp(17px, 1.7vw, 24px);
  letter-spacing: -0.02em;
  line-height: 1.1;
  font-variation-settings: 'opsz' 60, 'wght' 520, 'SOFT' 30, 'WONK' 1;
}
.grande .inicial { font-size: clamp(44px, 6vw, 96px); }

/* Chica: bajo la obra, para pasar de proyecto. */
.chica .nombre { font-size: 11px; margin-top: 7px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chica .inicial { font-size: 22px; }

@media (max-width: 900px) {
  .carrete {
    grid-auto-columns: minmax(150px, 60vw);
    overflow-x: auto;
    scroll-snap-type: x proximity;
    padding-bottom: 6px;
    scrollbar-width: none;
  }
  .carrete li { scroll-snap-align: start; }
  .chica .carrete { grid-auto-columns: 96px; }
}
</style>
