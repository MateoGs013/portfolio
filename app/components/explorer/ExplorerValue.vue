<script setup lang="ts">
// Renderizador de valores para hojas técnicas y tablas.
// Soporta relaciones, filtros, links externos, activos multimedia (con visor lightbox),
import AppIcon from '~/components/ui/AppIcon.vue'
import { safeHref, type Cell, type MediaItem } from '~/lib/explorer'

const { isEs } = usePortfolioLocale()

defineProps<{
  cell: Cell
  /** Nombre del campo, para el título del filtro. */
  name?: string
  /** El link va en tinta y no en azul: es el nombre del record, no una relación. */
  plain?: boolean
}>()

const activeMedia = ref<MediaItem | null>(null)
const copiedInline = ref(false)

async function copyInline(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copiedInline.value = true
    setTimeout(() => { copiedInline.value = false }, 2000)
  }
  catch {
    // Fallback silencioso
  }
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <!-- 1. Piezas Multimedia / Capturas Técnicas con Lightbox -->
  <div v-if="cell.media && cell.media.length" class="media-inspector w-full mt-1">
    <div class="media-grid grid grid-cols-[repeat(auto-fill,minmax(clamp(240px,20vw,360px),1fr))] gap-4 w-full">
      <figure
        v-for="m in cell.media"
        :key="m.id"
        class="media-card group m-0 border border-rule bg-surface cursor-pointer transition-[border-color,transform] duration-150 hover:border-sig hover:-translate-y-0.5 focus-visible:border-sig focus-visible:-translate-y-0.5 focus-visible:outline-none"
        tabindex="0"
        role="button"
        :aria-label="isEs ? `Inspeccionar captura: ${m.alt}` : `Inspect screenshot: ${m.alt}`"
        @click="activeMedia = m"
        @keydown.enter="activeMedia = m"
      >
        <div class="media-thumb-wrap relative aspect-[16/10] overflow-hidden bg-black">
          <img :src="m.src" :alt="m.alt" class="media-thumb w-full h-full object-cover block" loading="lazy">
          <div class="media-overlay absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150">
            <span class="zoom-icon font-mono text-[11px] font-bold text-white px-2.5 py-1 bg-black/75 border border-sig">⊕ {{ isEs ? 'EXPANDIR' : 'EXPAND' }}</span>
          </div>
        </div>
        <figcaption class="media-meta p-2 px-2.5 flex items-center justify-between gap-1.5 font-mono text-[11px] border-t border-rule text-dim">
          <span class="m-role text-sig font-bold">{{ m.role }}</span>
          <span class="m-dim text-ink">{{ m.width }}×{{ m.height }}</span>
          <span v-if="m.bytes" class="m-bytes">{{ formatBytes(m.bytes) }}</span>
        </figcaption>
      </figure>
    </div>

    <!-- Modal Lightbox Técnico -->
    <Teleport to="body">
      <div
        v-if="activeMedia"
        class="lightbox-backdrop fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
        role="dialog"
        aria-modal="true"
        @click.self="activeMedia = null"
        @keydown.esc="activeMedia = null"
      >
        <div class="lightbox-chassis w-full max-w-[min(96vw,1600px)] max-h-[92vh] bg-paper border border-rule-strong shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden">
          <header class="lightbox-header h-11 px-4 flex items-center justify-between border-b border-rule bg-surface">
            <div class="lh-left flex items-center gap-2.5 min-w-0">
              <span class="lh-badge font-mono text-[10px] font-extrabold text-sig border border-sig px-1.5 py-0.5">{{ activeMedia.role }}</span>
              <span class="lh-name font-sans text-[13px] text-ink whitespace-nowrap overflow-hidden text-ellipsis">{{ activeMedia.alt }}</span>
            </div>
            <div class="lh-right flex items-center gap-4">
              <span class="lh-meta font-mono text-[11px] text-dim">{{ activeMedia.width }} × {{ activeMedia.height }} PX · {{ formatBytes(activeMedia.bytes) }}</span>
              <button
                type="button"
                class="lightbox-close bg-transparent border border-rule text-ink px-2.5 py-1 font-mono text-[11px] cursor-pointer hover:border-sig hover:text-sig flex items-center gap-1.5"
                :aria-label="isEs ? 'Cerrar visor' : 'Close viewer'"
                @click="activeMedia = null"
              >
                <AppIcon name="close" :size="12" />
                <span>ESC</span>
              </button>
            </div>
          </header>

          <div class="lightbox-body flex-1 min-h-0 overflow-auto flex items-center justify-center bg-black">
            <img :src="activeMedia.src" :alt="activeMedia.alt" class="lightbox-img max-w-full max-h-[80vh] object-contain">
          </div>
        </div>
      </div>
    </Teleport>
  </div>

  <!-- 2. Pasos de Proceso de Ingeniería (Stepper Articulado) -->
  <div v-else-if="cell.steps && cell.steps.length" class="process-stepper grid grid-cols-[repeat(auto-fit,minmax(clamp(250px,24vw,380px),1fr))] gap-3.5 w-full mt-1.5">
    <div v-for="s in cell.steps" :key="s.order" class="step-card p-3 px-3.5 bg-surface border border-rule border-l-[3px] border-l-sig">
      <div class="step-header flex items-center gap-2 mb-1.5">
        <span class="step-pip font-mono text-[11px] font-extrabold text-sig">0{{ s.order }}</span>
        <span class="step-title font-mono text-[12px] font-bold text-ink uppercase">{{ s.title }}</span>
      </div>
      <p class="step-body m-0 font-sans text-[13.5px] leading-snug text-dim">{{ s.body }}</p>
    </div>
  </div>

  <!-- 3. Panel de Métricas Técnicas (Lighthouse, Latencia, Bundle) -->
  <div v-else-if="cell.metrics && Object.keys(cell.metrics).length" class="metrics-panel w-full mt-1">
    <div class="metrics-grid flex flex-wrap gap-2">
      <div v-for="(val, k) in cell.metrics" :key="k" class="metric-pill flex flex-col gap-0.5 px-3 py-1.5 bg-surface border border-rule min-w-[110px]">
        <span class="m-label font-mono text-[10px] text-dim uppercase">{{ k }}</span>
        <span class="m-value font-mono text-[13px] font-bold text-green">
          <template v-if="typeof val === 'object' && val !== null">
            <span v-for="(subVal, subKey) in val" :key="subKey" class="sub-metric block text-[11px] text-ink">
              {{ subKey }}: {{ subVal }}
            </span>
          </template>
          <template v-else>
            {{ val }}
          </template>
        </span>
      </div>
    </div>
  </div>

  <!-- 4. Relaciones de Lista (Techs, Links, Relaciones Inversas) -->
  <span v-else-if="cell.items" class="items flex flex-wrap gap-x-2 gap-y-1">
    <template v-for="(it, i) in cell.items" :key="i">
      <span v-if="i" class="sep text-faint" aria-hidden="true">·</span>
      <NuxtLink v-if="it.to" :to="it.to" class="rel text-sig no-underline hover:text-sig-hover hover:underline">{{ it.label }}<span v-if="it.meta" class="im ml-1 text-dim text-[13px]"> {{ it.meta }}</span></NuxtLink>
      <NuxtLink v-else-if="it.facet" :to="it.facet" class="facet text-ink underline decoration-dotted decoration-faint underline-offset-[3px] hover:text-sig hover:decoration-solid hover:decoration-sig" :title="`filtrar ${name ?? ''} = ${it.label}`">{{ it.label }}</NuxtLink>
      <a v-else-if="it.href && safeHref(it.href)" :href="safeHref(it.href)" target="_blank" rel="noopener noreferrer" class="ext text-sig underline decoration-rule hover:text-sig-hover hover:underline">{{ it.label }}<span v-if="it.meta" class="im ml-1 text-dim text-[13px]"> {{ it.meta }}</span> ↗</a>
      <span v-else>{{ it.label }}</span>
    </template>
  </span>

  <!-- 5. Enlace a Registro Relacionado Único -->
  <NuxtLink v-else-if="cell.to" :to="cell.to" class="rel text-sig no-underline hover:text-sig-hover hover:underline" :class="{ 'plain !text-ink': plain }">
    {{ cell.value }} <span aria-hidden="true">›</span>
  </NuxtLink>

  <!-- 6. Enlace URL Externo / Correo Electrónico -->
  <span v-else-if="cell.href && safeHref(cell.href) && safeHref(cell.href)!.startsWith('mailto:')" class="email-value-wrap inline-flex items-center gap-2.5 flex-wrap">
    <a :href="safeHref(cell.href)" class="ext mail-link font-semibold text-sig hover:text-sig-hover hover:underline">
      {{ cell.value }}
    </a>
    <button
      type="button"
      class="quick-copy-btn inline-flex items-center gap-1 px-2 py-0.5 border border-rule bg-surface text-dim font-mono text-[11px] font-bold cursor-pointer transition-colors duration-150 hover:border-sig hover:text-sig hover:bg-hover"
      :title="isEs ? `Copiar ${cell.value} al portapapeles` : `Copy ${cell.value} to clipboard`"
      @click="copyInline(String(cell.value))"
    >
      <AppIcon :name="copiedInline ? 'check' : 'copy'" :size="11" />
      <span>{{ copiedInline ? (isEs ? 'COPIADO' : 'COPIED') : (isEs ? 'COPIAR' : 'COPY') }}</span>
    </button>
  </span>
  <a v-else-if="cell.href && safeHref(cell.href)" :href="safeHref(cell.href)" target="_blank" rel="noopener noreferrer" class="ext text-sig underline decoration-rule hover:text-sig-hover hover:underline">
    {{ cell.value }} ↗
  </a>

  <!-- 7. Filtro Facetado de Tabla -->
  <NuxtLink v-else-if="cell.facet" :to="cell.facet" class="facet text-ink underline decoration-dotted decoration-faint underline-offset-[3px] hover:text-sig hover:decoration-solid hover:decoration-sig" :title="`filtrar ${name ?? ''} = ${cell.value}`">
    {{ cell.value }}
  </NuxtLink>

  <!-- 8. Valor Nulo Explícito -->
  <span v-else-if="cell.value === null" class="nul font-mono text-[12px] text-dim">NULL</span>

  <!-- 9. Texto o Bloque Narrativo Estándar -->
  <template v-else>
    {{ cell.value }}
  </template>
</template>
