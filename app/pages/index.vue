<script setup lang="ts">
// Inicio (movimiento.html, vHome): cargador de la primera visita, nombre por letras, titular, obra
// seleccionada con vista previa y la frase que se enciende. Todo sale de la base: about, contact y
// /api/projects. El contacto (#contacto) es el pie del layout.
const [about, contact, projects] = await Promise.all([useDoc('about'), useDoc('contact'), useProjects()])
failOn(about.error)
failOn(projects.error)

const aboutDoc = computed(() => about.data.value ?? null)
const contactDoc = computed(() => contact.data.value ?? null)

await usePageSeo(() => ({
  title: docText(aboutDoc.value, 'role'),
  description: docText(aboutDoc.value, 'headline'),
  type: 'profile',
}))

const content = useTemplateRef<HTMLElement>('content')
</script>

<template>
  <div>
    <IntroLoader :name="docText(aboutDoc, 'display_name') ?? ''" :scope="content" />
    <article ref="content" data-hf="measure">
      <HomeHero :about="aboutDoc" :contact="contactDoc" />
      <HomeSelectedWork :projects="projects.data.value ?? []" />
      <HomeStatement :about="aboutDoc" />
    </article>
  </div>
</template>

