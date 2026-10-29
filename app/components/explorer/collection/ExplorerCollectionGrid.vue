<script setup lang="ts">
import UiBorderBeam from '~/components/ui/UiBorderBeam.vue'
import UiSpotlightCard from '~/components/ui/UiSpotlightCard.vue'
import ExplorerBadge from '../ExplorerBadge.vue'
import { pad, type Folder } from '~/lib/explorer'

const props = defineProps<{
  head: string
  items: Folder['items']
  experience?: Folder['experience']
}>()

const { isEs, tr, getExperienceLocalization } = usePortfolioLocale()

const knownProjectCovers: Record<string, string> = {
  'la-rucula': '/media/projects/la-rucula.jpg',
  'argpiscinas': '/media/projects/argpiscinas.jpg',
  'arg-piscinas': '/media/projects/argpiscinas.jpg',
  'ynara': '/media/projects/ynara-mtucqc2j.png',
  'barberpole': '/media/projects/barberpole.png',
}

function formatExpPeriod(it: Folder['items'][number]): string {
  const exp = props.experience?.find(e => e.slug === it.key)
  if (exp?.startedAt) {
    const sDate = new Date(exp.startedAt)
    const sYear = sDate.getFullYear()
    if (!exp.endedAt) {
      return isEs.value ? `${sYear} — Presente` : `${sYear} — Present`
    }
    const eDate = new Date(exp.endedAt)
    const eYear = eDate.getFullYear()
    if (sYear === eYear) {
      const sMonth = sDate.toLocaleDateString(isEs.value ? 'es-ES' : 'en-US', { month: 'short' })
      const eMonth = eDate.toLocaleDateString(isEs.value ? 'es-ES' : 'en-US', { month: 'short' })
      return `${sMonth} — ${eMonth} ${sYear}`
    }
    return `${sYear} — ${eYear}`
  }
  if (it.key === 'cet-30') return isEs.value ? '2017 — 2023 · 7 Años' : '2017 — 2023 · 7 Years'
  if (it.key === 'escuela-da-vinci') return isEs.value ? '2024 — 2026 · Carrera' : '2024 — 2026 · Degree'
  if (it.key === 'freelance') return isEs.value ? '2023 — Presente' : '2023 — Present'
  return it.meta || ''
}

function formatItemLabel(it: Folder['items'][number]): string {
  if (props.head === 'experience') {
    return isEs.value ? (it.role || it.label) : (getExperienceLocalization(it.key)?.role || it.role || it.label)
  }
  return it.label
}

function formatItemMeta(it: Folder['items'][number]): string {
  if (props.head === 'experience') {
    if (!isEs.value) {
      return (it.meta || '').replace(/act$/i, 'present')
    }
  }
  return it.meta || ''
}

function formatItemBadge(it: Folder['items'][number]): string {
  if (props.head === 'experience') {
    if (!isEs.value && it.badge?.toLowerCase() === 'act') {
      return 'pres'
    }
  }
  return it.badge || ''
}

function openExternal(url?: string | null) {
  if (!url || !import.meta.client) return
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <TransitionGroup
    tag="ol"
    name="grid-flip"
    class="folder-items-grid grid gap-5 sm:gap-6 my-4 w-full list-none p-0 m-0 relative"
    :class="{
      'grid-cols-1 md:grid-cols-2': head === 'projects',
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4': head === 'stack' || head === 'experience',
      'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6': head !== 'projects' && head !== 'stack' && head !== 'experience',
    }"
  >
    <li v-for="(it, n) in items" :key="it.key" class="w-full min-w-0">
      <!-- Tarjeta de Proyecto Awwwards (Daniele Buser 2-Column Architectural Frame 1:1) -->
      <article
        v-if="head === 'projects'"
        class="buser-project-frame group relative h-full rounded-[2px] p-5 sm:p-7 flex flex-col justify-between gap-6 overflow-hidden border border-rule bg-surface/40 hover:bg-surface"
      >
        <UiBorderBeam
          :size="160"
          :duration="8"
          :border-width="1.5"
          color-from="#ff3e00"
          color-to="var(--d-ink, #ffffff)"
          class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        />
        <NuxtLink
          :to="it.to"
          class="project-card group flex flex-col h-full justify-between gap-6 no-underline text-inherit focus:outline-none"
          :data-row="it.key"
        >
          <!-- Contenedor de Portada 16:10 Puro sin Píldoras Flotantes -->
          <div class="relative w-full aspect-[16/10] rounded-[2px] bg-black/50 overflow-hidden flex flex-col justify-between">
            <img v-if="it.cover || knownProjectCovers[it.key]" :src="it.cover || knownProjectCovers[it.key]" :alt="it.label" class="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]" loading="lazy">
            <div v-else class="flex flex-col justify-between p-6 bg-surface-raised/60 relative overflow-hidden h-full w-full">
              <div class="flex items-center justify-between font-mono text-[10px] opacity-60 z-10">
                <span>{{ pad(n + 1) }}</span>
                <span>{{ it.year ?? '2026' }}</span>
              </div>
              <div class="flex flex-col items-start justify-end my-auto py-1 z-10">
                <span class="font-mono text-[10.5px] text-sig uppercase tracking-widest mb-1">{{ it.key === 'ynara-web' ? 'WEBGL · GLSL SHADERS' : 'AI ARCHITECTURE · OBSIDIAN' }}</span>
                <span class="font-sans text-[22px] font-semibold tracking-[-0.03em]">{{ it.label }}</span>
              </div>
              <div class="flex items-center justify-between font-mono text-[9.5px] opacity-50 pt-1 z-10 uppercase">
                <span>{{ it.status ?? 'PRODUCTION' }}</span>
                <span>CASE STUDY ↗</span>
              </div>
            </div>
          </div>

          <!-- Cuerpo Arquitectónico del Marco: Título a la Izquierda + Stack Vertical a la Derecha -->
          <div class="flex items-end justify-between gap-4 pt-1 min-w-0">
            <div class="flex flex-col gap-1.5 min-w-0 flex-1">
              <h3 class="font-sans text-[clamp(20px,2.3vw,28px)] font-semibold tracking-[-0.035em] group-hover:text-sig transition-colors leading-[1.08] m-0">
                {{ it.label }}
              </h3>

              <div v-if="it.url || it.repo" class="flex items-center gap-3 pt-1 font-mono text-[10.5px] opacity-65">
                <button
                  v-if="it.url"
                  type="button"
                  class="bg-transparent border-0 p-0 text-inherit hover:text-sig inline-flex items-center gap-1 transition-colors cursor-pointer"
                  :title="isEs ? 'Visitar sitio en vivo' : 'Visit live site'"
                  @click.stop.prevent="openExternal(it.url)"
                >
                  <span>Live Site ↗</span>
                </button>
                <button
                  v-if="it.repo"
                  type="button"
                  class="bg-transparent border-0 p-0 text-inherit hover:text-sig inline-flex items-center gap-1 transition-colors cursor-pointer"
                  :title="isEs ? 'Ver código en GitHub' : 'View source on GitHub'"
                  @click.stop.prevent="openExternal(it.repo)"
                >
                  <span>GitHub ↗</span>
                </button>
              </div>
            </div>

            <ul v-if="it.techs && it.techs.length" class="flex flex-col items-end text-right list-none m-0 p-0 shrink-0 font-mono text-[10px] leading-[1.45] uppercase tracking-[0.06em] opacity-70">
              <li v-for="t in it.techs.slice(0, 4)" :key="t.slug">
                {{ t.name }}
              </li>
            </ul>
          </div>
        </NuxtLink>
      </article>

      <!-- Tarjeta de Experiencia -->
      <UiSpotlightCard
        v-else-if="head === 'experience'"
        class="h-full rounded-xl border border-rule bg-surface/60 hover:border-rule-strong transition-all duration-200"
      >
        <NuxtLink
          :to="it.to"
          class="group flex flex-col h-full p-4 sm:p-5 no-underline text-inherit min-w-0"
          :data-row="it.key"
        >
          <div class="flex items-center justify-between gap-2 mb-2 font-mono text-[11px] min-w-0">
            <span class="text-ink font-medium truncate">{{ it.org ?? it.label }}</span>
            <span class="text-faint shrink-0">{{ formatExpPeriod(it) }}</span>
          </div>
          <h3 class="font-sans text-[15.5px] font-semibold tracking-[-0.02em] text-ink group-hover:text-sig transition-colors leading-snug m-0 mb-2 line-clamp-2 break-words">
            {{ isEs ? (it.role || getExperienceLocalization(it.key)?.role || it.label) : (getExperienceLocalization(it.key)?.role || it.role || it.label) }}
          </h3>
          <p v-if="it.summary" class="font-sans text-[13px] text-dim leading-relaxed line-clamp-2 m-0 mb-3 break-words">
            {{ isEs ? (it.summary || getExperienceLocalization(it.key)?.summary) : (getExperienceLocalization(it.key)?.summary || it.summary) }}
          </p>
          <div class="flex items-center justify-between pt-3 mt-auto border-t border-rule/70 font-mono text-[11px] text-dim group-hover:text-ink">
            <span>{{ tr.collection.technicalDetails }}</span>
            <span class="text-sig transition-transform duration-150 group-hover:translate-x-0.5">→</span>
          </div>
        </NuxtLink>
      </UiSpotlightCard>

      <!-- Tarjeta de Stack -->
      <UiSpotlightCard
        v-else-if="head === 'stack'"
        class="h-full rounded-xl border border-rule bg-surface/60 hover:border-rule-strong transition-all duration-200"
      >
        <NuxtLink
          :to="it.to"
          class="group flex flex-col h-full p-4 no-underline text-inherit"
          :data-row="it.key"
        >
          <div class="flex items-center justify-between gap-2 mb-2">
            <span v-if="it.category" class="px-2 py-0.5 rounded-md bg-paper/70 border border-rule font-mono text-[9.5px] text-dim uppercase">{{ it.category }}</span>
            <span v-if="it.since" class="font-mono text-[10.5px] text-faint">{{ it.since }}</span>
          </div>
          <h3 class="font-sans text-[16px] font-semibold tracking-[-0.02em] text-ink group-hover:text-sig transition-colors m-0 mb-1.5">
            {{ it.label }}
          </h3>
          <p v-if="it.note" class="font-sans text-[12.5px] text-dim leading-relaxed line-clamp-2 m-0 mb-3">
            {{ it.note }}
          </p>
          <div class="flex items-center justify-between pt-2.5 mt-auto border-t border-rule/70 font-mono text-[10.5px] text-dim group-hover:text-ink">
            <span>{{ tr.collection.filterRecords }}</span>
            <span class="text-sig transition-transform duration-150 group-hover:translate-x-0.5">→</span>
          </div>
        </NuxtLink>
      </UiSpotlightCard>

      <!-- Tarjeta de Artículos / Blog -->
      <UiSpotlightCard
        v-else-if="head === 'articles'"
        class="h-full rounded-xl border border-rule bg-surface/60 hover:border-rule-strong transition-all duration-200"
      >
        <NuxtLink
          :to="it.to"
          class="group flex flex-col h-full p-4 sm:p-5 no-underline text-inherit min-w-0"
          :data-row="it.key"
        >
          <div class="flex items-center justify-between gap-2 mb-2 font-mono text-[10.5px] min-w-0">
            <span class="inline-flex items-center gap-1.5 text-green">
              <span class="w-1.5 h-1.5 rounded-full bg-green" />
              <span>{{ it.status ?? 'PUBLISHED' }}</span>
            </span>
            <span v-if="it.readingTimeMin" class="text-faint shrink-0">
              {{ pad(it.readingTimeMin) }} min
            </span>
          </div>
          <h3 class="font-sans text-[16px] sm:text-[17px] font-semibold tracking-[-0.02em] text-ink group-hover:text-sig transition-colors leading-snug m-0 mb-2 line-clamp-2 break-words">
            {{ it.label }}
          </h3>
          <p v-if="it.summary" class="font-sans text-[13px] text-dim leading-relaxed line-clamp-3 m-0 mb-3 break-words">
            {{ it.summary }}
          </p>
          <div class="flex items-center justify-between pt-3 mt-auto border-t border-rule/70 font-mono text-[11px] text-dim group-hover:text-ink">
            <span>{{ isEs ? 'Leer artículo' : 'Read article' }}</span>
            <span class="text-sig transition-transform duration-150 group-hover:translate-x-0.5">→</span>
          </div>
        </NuxtLink>
      </UiSpotlightCard>

      <!-- Baldosa Estándar -->
      <NuxtLink v-else :to="it.to" class="tile rounded-xl" :class="it.kind" :data-row="it.key">
        <span class="n">{{ pad(n + 1) }}</span>
        <ExplorerBadge :kind="it.kind" :badge="formatItemBadge(it)" class="icono" />
        <span class="name">{{ formatItemLabel(it) }}</span>
        <span class="meta">{{ it.desc ?? formatItemMeta(it) }}</span>
      </NuxtLink>
    </li>
  </TransitionGroup>
</template>

<style scoped>
.tile {
  position: relative;
  display: grid;
  grid-template-rows: auto auto auto;
  justify-items: center;
  gap: 2px;
  padding: 20px 12px 16px;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  color: var(--d-ink);
  text-decoration: none;
  text-align: center;
  transition: all var(--d-dur) ease;
}
.tile:hover,
.tile:focus-visible {
  background: var(--d-hover);
  border-color: var(--d-sig);
  transform: translateY(-2px);
}
.tile:hover .icono svg,
.tile:focus-visible .icono svg {
  stroke: var(--d-sig);
}
.tile:hover .name,
.tile:focus-visible .name {
  color: var(--d-sig);
}
.tile:hover .badge,
.tile:focus-visible .badge {
  color: var(--d-sig);
}
.n {
  position: absolute;
  top: 8px;
  left: 10px;
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-faint);
  font-variant-numeric: tabular-nums;
}
.icono { margin-bottom: 14px; }
.name {
  max-width: 100%;
  font-family: var(--font-text);
  font-size: var(--d-fs-name);
  font-weight: 600;
  line-height: 1.25;
  color: var(--d-ink);
  overflow-wrap: anywhere;
}
.meta {
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: var(--d-fs-mono);
  color: var(--d-dim);
}
</style>
