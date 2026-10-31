<script setup lang="ts">
/**
 * Obra seleccionada del inicio (movimiento.html, `.sec` con `.rows`): las obras con `featured`, en
 * `sortOrder` (el orden de la API), con el enlace a toda la obra y su cuenta. En diseño es la lista de
 * filas con la vista previa que sigue al cursor; con `?vista=registro`, la misma colección como tabla
 * de registros (`colección Project`), renderizada por el SSR.
 */
import type { ProjectSummary } from '~/lib/api'

const props = defineProps<{
  projects: readonly ProjectSummary[]
}>()

const { t, localeRoute } = useLocale()
const { isRecord } = useRecordView()

const featured = computed(() => props.projects.filter(p => p.featured))

const preview = useTemplateRef<{ show: (index: number, e: PointerEvent) => void, hide: () => void }>('preview')
</script>

<template>
  <section v-if="featured.length" aria-labelledby="obra-seleccionada" class="px-pad pt-section record:pt-16">
    <div class="flex items-baseline justify-between gap-4 pb-5 text-s text-dim">
      <h2 id="obra-seleccionada">
        {{ t('home.featured') }}
      </h2>
      <NuxtLink :to="localeRoute('/projects')" class="hit text-ink">
        <RollText :text="t('home.allWork', { n: projects.length })" />
      </NuxtLink>
    </div>

    <RecordTable v-if="isRecord" collection="projects" :rows="featured" />
    <template v-else>
      <WorkRows :projects="featured" @point="(i, e) => preview?.show(i, e)" @leave="preview?.hide()" />
      <WorkPreview ref="preview" :projects="featured" />
    </template>
  </section>
</template>
