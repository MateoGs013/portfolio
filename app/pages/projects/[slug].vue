<script setup lang="ts">
/**
 * El caso (/projects/:slug): el título y la portada llegan viajando, la captura crece, cada bloque
 * tiene su rótulo fijo, las tecnologías y las métricas se asoman y la siguiente obra cierra como
 * escena. Todo sale de /api/projects/:slug; la siguiente obra, de /api/projects completa (sortOrder,
 * circular). Las piezas de escritorio se reparten entre los bloques como en el prototipo: una tras el
 * encargo, otra tras el proceso y el resto tras el resultado. Las de teléfono van juntas.
 */
import type { Media } from '~/lib/api'
import { docText } from '~/composables/useSiteContent'

definePageMeta({ viewTransition: { toTypes: ['caso'] } })

const route = useRoute()
const { t, lang } = useLocale()
const { isRecord } = useRecordView()
const { public: { siteUrl } } = useRuntimeConfig()
const slug = computed(() => String(route.params.slug))

const [project, all] = await Promise.all([useProject(slug), useProjects()])
failOn(project.error)
const p = computed(() => project.data.value!)

const covers = computed(() => p.value.media.filter(m => m.role === 'COVER'))
const cover = computed(() => covers.value.find(m => m.kind === 'IMAGE') ?? covers.value[0])
const coverTint = computed(() => covers.value.find(m => m.tint)?.tint ?? null)

const gallery = computed(() => p.value.media.filter(m => m.role === 'GALLERY'))
const phones = computed(() => gallery.value.filter(m => m.viewport === 'MOBILE'))

/** Los bloques con texto, en orden, y las piezas de escritorio que van detrás de cada uno. */
const pieces = computed(() => {
  const desktop = gallery.value.filter(m => m.viewport === 'DESKTOP')
  const blocks = (['brief', 'steps', 'outcome'] as const).filter(k => (k === 'steps' ? p.value.steps.length : p.value[k]))
  const out: Record<'brief' | 'steps' | 'outcome' | 'rest', Media[]> = { brief: [], steps: [], outcome: [], rest: [] }
  blocks.forEach((k, i) => {
    out[k] = i === blocks.length - 1 ? desktop.slice(i) : desktop.slice(i, i + 1)
  })
  if (!blocks.length) out.rest = desktop
  return out
})

/** La siguiente obra en sortOrder, circular, siempre desde la lista completa. */
const next = computed(() => {
  const list = all.data.value ?? []
  const i = list.findIndex(item => item.slug === p.value.slug)
  return list.length > 1 && i >= 0 ? list[(i + 1) % list.length] : undefined
})

/** Mientras entra la escena de la siguiente obra, la página ya toma su temperatura. */
const nextEntering = ref(false)
const nextTint = computed(() => next.value?.media.find(m => m.role === 'COVER' && m.tint)?.tint ?? null)
useTint(() => (nextEntering.value && nextTint.value ? nextTint.value : coverTint.value))

await usePageSeo(() => ({ title: p.value.title, description: p.value.summary, image: cover.value }))

const about = useDoc('about')
const absolute = (path: string) => new URL(path, siteUrl).toString()
const ogImage = computed(() => cover.value && (cover.value.kind === 'IMAGE' || cover.value.poster) ? cover.value : null)

useSeoMeta({
  ogImageWidth: () => ogImage.value?.width,
  ogImageHeight: () => ogImage.value?.height,
})

/** La obra como CreativeWork, con su autor desde about. */
const creativeWork = computed(() => {
  const image = ogImage.value
  const src = image?.kind === 'VIDEO' ? image.poster : image?.src
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    'name': p.value.title,
    'description': p.value.summary,
    'url': absolute(`/projects/${p.value.slug}${lang.value === 'en' ? '?lang=en' : ''}`),
    'inLanguage': lang.value,
    'dateCreated': String(p.value.year),
    'datePublished': p.value.publishedAt ?? undefined,
    'dateModified': p.value.updatedAt,
    'image': src ? { '@type': 'ImageObject', 'url': absolute(src), 'width': image?.width, 'height': image?.height, 'caption': image?.alt } : undefined,
    'keywords': p.value.techs.map(tech => tech.name).join(', ') || undefined,
    'sameAs': p.value.url ?? undefined,
    'author': { '@type': 'Person', 'name': docText(about.data.value, 'name') ?? undefined, 'url': absolute('/') },
  }
})

useHead({
  script: [{ key: 'ld-case', type: 'application/ld+json', innerHTML: computed(() => JSON.stringify(creativeWork.value).replace(/</g, '\\u003c')) }],
})
</script>

<template>
  <div>
    <article data-hf="measure" class="pb-section record:pb-0">
      <CasePeek>
        <CaseHeader :project="p" />
        <CaseCover :project="p" />

        <div class="px-pad py-section record:py-0">
          <RecordField v-slot="{ fv }" collection="projects" k="summary" :value="p.summary" :record="p">
            <RevealLines :text="p.summary" :class="fv" class="max-w-[24ch] text-hero text-ink" />
          </RecordField>
        </div>

        <div class="flex flex-col gap-[clamp(3rem,10vh,6rem)] record:gap-0">
          <CaseSection v-if="isRecord || p.brief" :label="t('case.brief')">
            <RecordField v-slot="{ fv }" collection="projects" k="brief" :value="p.brief" :record="p">
              <RevealLines :text="p.brief ?? ''" :class="fv" class="max-w-read text-l" />
            </RecordField>
            <CaseGallery :items="pieces.brief" />
          </CaseSection>

          <CaseSection v-if="isRecord || p.steps.length" :label="t('case.process')">
            <CaseSteps :steps="p.steps" />
            <CaseGallery :items="pieces.steps" />
          </CaseSection>

          <CaseSection v-if="isRecord || p.outcome" :label="t('case.outcome')">
            <RecordField v-slot="{ fv }" collection="projects" k="outcome" :value="p.outcome" :record="p">
              <RevealLines :text="p.outcome ?? ''" :class="fv" class="max-w-read text-l" />
            </RecordField>
            <CaseGallery :items="pieces.outcome" />
          </CaseSection>

          <CaseGallery v-if="pieces.rest.length" :items="pieces.rest" class="px-pad" />

          <CaseSection v-if="isRecord || p.metrics.length" :label="t('case.metrics')">
            <CaseMetrics :metrics="p.metrics" />
          </CaseSection>

          <CaseSection v-if="phones.length" :label="t('case.phone')" class="ed-only">
            <CaseGallery :items="phones" phones />
          </CaseSection>

          <CaseLinks :project="p" />
        </div>
      </CasePeek>
    </article>

    <CaseNext v-if="next" :next="next" @tint="nextEntering = $event" />
  </div>
</template>
