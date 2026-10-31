<script setup lang="ts">
/**
 * Una tarjeta de la galería de Obra: la portada en su marco 16:10, el título, el año, el estado y el
 * rol. Es el origen de un viaje (docs/diseno.md §4): al tocarla, el marco viaja como `cover` y el
 * título como `title` hasta el caso. Sin portada, una placa `--surface` con el título (decorativa) y el
 * tinte de la obra si lo tiene. El video de portada corre al apuntar o enfocar la tarjeta y se funde
 * sobre la captura (0,6 s) cuando ya tiene cuadros.
 *
 * Capas que mueve la galería: `data-motion="skew"` (inclinación por velocidad) y
 * `data-motion="parallax"` (la imagen dentro de su marco, más ancha solo en el modo horizontal).
 */
import type { ProjectSummary, ProjectStatus } from '~/lib/api'

const props = withDefaults(defineProps<{
  project: ProjectSummary
  /** Las primeras tarjetas se ven al llegar: su imagen no espera. */
  eager?: boolean
  priority?: boolean
}>(), { eager: false, priority: false })

const { t, localeRoute, langAttr } = useLocale()

const covers = computed(() => props.project.media.filter(m => m.role === 'COVER'))
const video = computed(() => covers.value.find(m => m.kind === 'VIDEO'))
/** La captura fija: la imagen de portada, o el póster del video si no hay imagen. */
const image = computed(() => covers.value.find(m => m.kind === 'IMAGE') ?? (video.value?.poster ? video.value : undefined))
const tint = computed(() => image.value?.tint ?? video.value?.tint ?? undefined)

const DOT: Record<ProjectStatus, string> = { LIVE: 'bg-ok', WIP: 'bg-wip', ARCHIVED: 'bg-faint' }
</script>

<template>
  <NuxtLink
    :to="localeRoute(`/projects/${project.slug}`)"
    data-card
    data-view
    data-travel="card"
    :data-f="project.slug"
    :data-tint="tint"
    class="block text-ink no-underline"
  >
    <div data-motion="skew">
      <div data-travel-cover class="relative aspect-[16/10] overflow-hidden rounded-[3px] bg-surface">
        <div
          v-if="!image"
          aria-hidden="true"
          class="absolute inset-0 flex items-end bg-[color-mix(in_oklab,var(--surface),var(--plate-tint,var(--surface))_22%)] p-4 text-hero font-display text-ink"
          :style="tint ? { '--plate-tint': tint } : undefined"
        >
          {{ project.title }}
        </div>
        <div v-if="image || video" data-motion="parallax" class="absolute inset-0 group-data-[track]/gallery:-inset-x-[8%]">
          <MediaImage
            v-if="image"
            :media="image"
            decorative
            :loading="eager ? 'eager' : 'lazy'"
            :fetchpriority="priority ? 'high' : 'auto'"
            class="size-full object-cover"
          />
          <div v-if="video" aria-hidden="true" class="absolute inset-0">
            <MediaVideo
              :media="video"
              mode="hover"
              class="size-full opacity-0 transition-opacity duration-600 ease-expo data-playing:opacity-100"
            />
          </div>
        </div>
      </div>
      <div class="mt-4 flex items-baseline justify-between gap-4">
        <span data-travel-title data-f="title" class="fv text-xl">{{ project.title }}</span>
        <span data-f="year" class="fv text-s whitespace-nowrap text-dim tabular-nums">{{ project.year }}</span>
      </div>
      <p class="mt-1.5 text-s text-dim">
        <span data-ornament aria-hidden="true" class="me-2 inline-block size-1.75 rounded-full align-[0.08em]" :class="DOT[project.status]" /><span data-f="status" class="fv">{{ t(`status.${project.status}`) }}</span> · <span :lang="langAttr(project, 'role')">{{ project.role }}</span>
      </p>
    </div>
  </NuxtLink>
</template>
