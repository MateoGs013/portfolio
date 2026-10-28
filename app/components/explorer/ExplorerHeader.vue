<script setup lang="ts">
// Cabecera Arquitectónica Awwwards 2026 (Daniele Buser / Dennis Snellenberg / Basement Studio):
// Tipografía monumental a la izquierda con sello ’26 en colecciones principales y acciones a la derecha.

const props = defineProps<{
  /** Id del h1, para el aria-labelledby del panel. */
  id: string
  kind: 'folder' | 'file'
  badge: string
  name: string
  /** Partes de la línea de tipo, preservadas por compatibilidad de datos. */
  line: string[]
}>()

const { isEs } = usePortfolioLocale()

const displayTitle = computed(() => {
  if (props.kind !== 'folder') return props.name
  const k = props.name.toLowerCase()
  if (k === 'projects') return isEs.value ? 'proyectos' : 'projects'
  if (k === 'experience') return isEs.value ? 'experiencia' : 'experience'
  if (k === 'stack') return 'stack'
  if (k === 'articles') return isEs.value ? 'artículos' : 'articles'
  if (k === 'orgs') return isEs.value ? 'organizaciones' : 'organizations'
  return props.name
})
</script>

<template>
  <header class="cabecera flex flex-col md:flex-row md:items-end justify-between gap-4 pt-3 pb-6 border-b border-rule w-full min-w-0">
    <div class="quien min-w-0 flex flex-col justify-center">
      <div class="flex items-baseline gap-3 flex-wrap">
        <h1
          :id="id"
          class="titulo m-0 font-sans font-semibold tracking-[-0.042em] leading-[0.98] text-ink capitalize [overflow-wrap:anywhere] outline-none"
          :class="kind === 'folder' ? 'text-[clamp(36px,5.2vw,68px)]' : 'text-[clamp(28px,4vw,52px)]'"
          tabindex="-1"
          data-anchor
        >
          {{ displayTitle }}<span v-if="kind === 'file'" class="inline-block w-2.5 h-2.5 bg-sig ml-1.5 align-baseline" aria-hidden="true" />
        </h1>
        <sup v-if="kind === 'folder' && badge" class="font-mono text-[13px] sm:text-[14px] text-dim font-normal tabular-nums">({{ badge }})</sup>
      </div>
    </div>
    <div v-if="$slots.default" class="lado flex items-center gap-3 flex-wrap justify-start md:justify-end min-w-0">
      <slot />
    </div>
  </header>
</template>
