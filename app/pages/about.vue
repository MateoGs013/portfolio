<script setup lang="ts">
// Sobre mí mínimo (F1): campos de about y la trayectoria de /api/experience. `?cv=ats` abre el CV.
// P4 lo reemplaza; F6 conecta el CV a /api/cv.
import { period } from '~/lib/format'

const route = useRoute()
const { t, lang, localeRoute, langAttr } = useLocale()

const [about, contact, experience] = await Promise.all([useDoc('about'), useDoc('contact'), useExperience()])
failOn(about.error)
failOn(experience.error)
await usePageSeo(() => ({ title: t('nav.about'), description: docText(about.data.value, 'engineering_philosophy'), type: 'profile' }))

const showCv = computed(() => route.query.cv === 'ats')

/** Campos de about que se leen en la página, con su rótulo de interfaz. */
const fields = [
  ['engineering_philosophy', 'about.philosophy'],
  ['core_competencies', 'about.competencies'],
  ['technical_degree', 'about.degree'],
  ['higher_education', 'about.higherEducation'],
  ['languages', 'about.languages'],
  ['work_modalities', 'about.modalities'],
  ['professional_goal', 'about.goal'],
] as const

/** Lo que el visor de CV actual lee (F6 lo pasa a /api/cv). */
const cvSource = computed(() => ({
  rows: Object.keys(about.data.value?.values ?? {}).map(name => ({ name, value: docText(about.data.value, name) })),
  contact: Object.fromEntries(['email', 'github', 'linkedin'].map(name => [name, docText(contact.data.value, name) ?? ''])),
}))
</script>

<template>
  <article data-hf="measure" class="flex flex-col gap-12 px-(--pad) py-24" :class="{ 'print:p-0': showCv }">
    <h1 data-vt="page-title" class="text-display-page font-medium tracking-tight text-ink" :class="{ 'print:hidden': showCv }">
      {{ t('nav.about') }}
    </h1>

    <NuxtLink
      :to="localeRoute({ path: '/about', query: showCv ? {} : { cv: 'ats' } })"
      data-chrome
      class="w-fit text-m text-ink underline underline-offset-4 print:hidden"
    >
      {{ t(showCv ? 'about.closeCv' : 'about.viewCv') }}
    </NuxtLink>

    <!-- En /about?cv=ats la impresión deja solo la hoja (docs/diseno.md §8). -->
    <div v-if="showCv" data-vt="cv-sheet">
      <CvContainer :detail="cvSource" />
    </div>

    <template v-else>
      <dl class="flex flex-col gap-6">
        <template v-for="[name, label] in fields" :key="name">
          <div v-if="docText(about.data.value, name)" class="flex flex-col gap-1">
            <dt class="text-s text-dim">{{ t(label) }}</dt>
            <dd class="max-w-[58ch] text-l" :lang="langAttr(about.data.value, name)">{{ docText(about.data.value, name) }}</dd>
          </div>
        </template>
      </dl>

      <section id="trayectoria" aria-labelledby="trayectoria-titulo" class="flex flex-col gap-4">
        <h2 id="trayectoria-titulo" class="text-s text-dim">
          {{ t('about.timeline') }}
        </h2>
        <ol class="flex flex-col border-t border-rule">
          <li v-for="e in experience.data.value" :key="e.slug" class="flex flex-col gap-1 border-b border-rule py-4">
            <span class="text-l text-ink" :lang="langAttr(e, 'role')">{{ e.role }}</span>
            <span class="text-s text-dim">
              {{ t(`kind.${e.kind}`) }}<template v-if="e.org"> · {{ e.org.name }}</template> · {{ period(e.startedAt, e.endedAt, lang) }}
            </span>
            <span v-if="e.summary" class="max-w-[58ch] text-m text-dim" :lang="langAttr(e, 'summary')">{{ e.summary }}</span>
          </li>
        </ol>
      </section>
    </template>
  </article>
</template>
