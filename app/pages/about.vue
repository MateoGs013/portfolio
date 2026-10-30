<script setup lang="ts">
// Sobre mí (P4): título y retrato, filosofía, cuatro datos, hacia dónde voy y trayectoria, todo desde
// about, contact y /api/experience. `?cv=ats` cambia el cuerpo por la hoja del CV (una superficie por
// pantalla); AboutCvBlock arma la transformación entre «Ver CV» y la hoja.
const route = useRoute()
const { t } = useLocale()

const [about, experience] = await Promise.all([useDoc('about'), useExperience()])
failOn(about.error)
failOn(experience.error)

// Con la hoja abierta no hay columna de Hiperfoco: la hoja mide 210 mm, a escala de lo que se imprime.
const showCv = computed(() => route.query.cv === 'ats')

await usePageSeo(() => ({
  title: showCv.value ? t('cv.title') : t('nav.about'),
  description: docText(about.data.value, 'professional_goal'),
  type: 'profile',
}))
</script>

<template>
  <article :data-hf="showCv ? undefined : 'measure'" :class="showCv ? 'print:p-0' : 'pb-section'">
    <template v-if="!showCv">
      <AboutIntro :about="about.data.value ?? null" />
      <AboutFacts :about="about.data.value ?? null" />
      <AboutTimeline :experience="experience.data.value ?? []" />
    </template>
    <AboutCvBlock :open="showCv" />
  </article>
</template>
