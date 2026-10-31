<script setup lang="ts">
// La hoja Harvard ATS: solo el CvDocument de /api/cv, sin texto propio. La escala de impresión
// (.claude/rules/explorer.md, cota dual) es la misma en pantalla y en papel; la página A4 y su
// margen los pone print.css. Un campo vacío no se dibuja.
import type { CvDocument, CvPeriod } from './types'
import { period } from '~/lib/format'
import { safeHref } from '~/lib/record'

const props = defineProps<{ cv: CvDocument }>()

const { t, lang, langAttr } = useLocale()

/** «https://www.linkedin.com/in/x/» → «linkedin.com/in/x»: legible por un ATS y por una persona. */
function shortUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '')
}

const contact = computed(() => {
  const h = props.cv.header
  const email = h.email ? { text: h.email, href: safeHref(`mailto:${h.email}`) } : null
  const links = [h.portfolio, h.linkedin, h.github].flatMap(url => (url ? [{ text: shortUrl(url), href: safeHref(url) }] : []))
  return [...(h.location ? [{ text: h.location, href: undefined }] : []), ...(email ? [email] : []), ...links]
})

const availability = computed(() => [props.cv.header.modalities, props.cv.header.availability].filter(Boolean).join(' · '))

const when = (p: CvPeriod) => period(p.start, p.end, lang.value)

/** Una entrada de experiencia o de formación, con la misma forma en la hoja. */
interface Entry {
  slug: string
  org: string
  /** null cuando repite la organización (la entrada freelance). */
  role: string | null
  when: string
  place: string | null
  placeLang: string | undefined
  highlights: string[]
  techs: string[]
  untranslated: string[]
}

const blocks = computed(() => {
  const experience: Entry[] = props.cv.experience.map(e => ({
    slug: e.slug,
    org: e.title,
    role: e.role === e.title ? null : e.role,
    when: when(e.period),
    // Sin lugar es remoto: el rótulo es de interfaz y está en el idioma de la página.
    place: e.location ?? t('common.remote'),
    placeLang: e.location ? langAttr(e, 'location') : undefined,
    highlights: e.highlights,
    techs: e.techs,
    untranslated: e.untranslated,
  }))
  const education: Entry[] = props.cv.education.map(e => ({
    slug: e.slug,
    org: e.org ?? e.degree,
    role: e.org ? e.degree : null,
    when: when(e.period),
    place: e.location,
    placeLang: langAttr(e, 'location'),
    highlights: e.highlights,
    techs: [],
    // El título de la formación es el cargo de la experiencia: se traduce como 'role'.
    untranslated: e.untranslated,
  }))
  return [
    { label: 'cv.experience' as const, entries: experience },
    { label: 'cv.education' as const, entries: education },
  ].filter(block => block.entries.length > 0)
})

/** Título de sección Harvard (mayúsculas con filete), igual que el del generador del Job Hunter. */
const sectionTitle = 'mb-[3.2pt] border-b-[0.85pt] border-black pb-[1.5pt] text-(length:--cv-section) leading-[1.2] font-bold tracking-[0.05em] uppercase'
</script>

<template>
  <article class="cv-harvard @container bg-white text-black text-(length:--cv-body) leading-(--cv-lh)" :lang="cv.lang">
    <header class="mb-[7pt] border-b-[1.2pt] border-black pb-[4pt] text-center">
      <h2 v-if="cv.header.name" class="mb-[1.8pt] text-(length:--cv-name) leading-[1.15] font-bold tracking-[0.03em] uppercase">
        {{ cv.header.name }}
      </h2>
      <p v-if="cv.header.role" class="mb-[1.8pt] text-(length:--cv-role) italic" :lang="langAttr(cv, 'header.role')">
        {{ cv.header.role }}
      </p>
      <ul :aria-label="t('cv.contact')" class="flex flex-wrap justify-center">
        <li v-for="item in contact" :key="item.text" class="whitespace-nowrap not-last:after:px-[4pt] not-last:after:content-['·']">
          <a v-if="item.href" :href="item.href" class="text-black underline decoration-black/35 underline-offset-2 hover:decoration-black print:no-underline">{{ item.text }}</a>
          <span v-else>{{ item.text }}</span>
        </li>
      </ul>
      <p v-if="availability" class="italic">
        <span :lang="langAttr(cv, 'header.modalities') ?? langAttr(cv, 'header.availability')">{{ availability }}</span>
      </p>
    </header>

    <section v-if="cv.summary" class="mb-(--cv-gap-section)">
      <h3 :class="sectionTitle">{{ t('cv.summary') }}</h3>
      <p class="@md:text-justify" :lang="langAttr(cv, 'summary')">{{ cv.summary }}</p>
    </section>

    <section v-for="block in blocks" :key="block.label" class="mb-(--cv-gap-section)">
      <h3 :class="sectionTitle">{{ t(block.label) }}</h3>
      <div v-for="e in block.entries" :key="e.slug" class="mb-(--cv-gap-entry) break-inside-avoid last:mb-0">
        <!-- «ORGANIZACIÓN — cargo» a la izquierda, «período · lugar» a la derecha. -->
        <p class="flex items-baseline justify-between gap-x-[8pt] @max-md:flex-col">
          <span>
            <span class="text-(length:--cv-entry) font-bold uppercase">{{ e.org }}</span>
            <span v-if="e.role" class="italic" :lang="langAttr(e, 'role')"> — {{ e.role }}</span>
          </span>
          <span class="whitespace-nowrap">
            {{ e.when }}<template v-if="e.place"> · <span :lang="e.placeLang">{{ e.place }}</span></template>
          </span>
        </p>
        <ul v-if="e.highlights.length" class="mt-[1pt] list-disc pl-[12pt] [&>li]:mb-(--cv-gap-bullet) @md:[&>li]:text-justify" :lang="langAttr(e, 'highlights')">
          <li v-for="(h, i) in e.highlights" :key="i">{{ h }}</li>
        </ul>
        <p v-if="e.techs.length">
          <span class="italic">{{ t('cv.techs') }}:</span> {{ e.techs.join(', ') }}
        </p>
      </div>
    </section>

    <section v-if="cv.skills.length || cv.languages.length || cv.methodologies">
      <h3 :class="sectionTitle">{{ t('cv.skills') }}</h3>
      <p v-for="g in cv.skills" :key="g.category" class="mb-(--cv-gap-bullet)">
        <strong>{{ t(`cv.skill.${g.category}`) }}:</strong> {{ g.items.join(', ') }}
      </p>
      <p v-if="cv.languages.length" :lang="langAttr(cv, 'languages')">
        <strong>{{ t('cv.languages') }}:</strong> {{ cv.languages.join(', ') }}
      </p>
      <!-- La misma línea que el generador del Job Hunter: about.core_competencies. -->
      <p v-if="cv.methodologies" :lang="langAttr(cv, 'methodologies')">
        <strong>{{ t('cv.methodologies') }}:</strong> {{ cv.methodologies }}
      </p>
    </section>
  </article>
</template>

<style scoped>
/* La escala ATS en puntos (nombre 19–21, secciones 11–11,5, cuerpo 9,2–9,5 con interlineado 1,3–1,35).
   La familia es la del documento Harvard, igual que la del generador del Job Hunter: es papel, no sitio. */
.cv-harvard {
  --cv-name: 20pt;
  --cv-role: 10.2pt;
  --cv-section: 11pt;
  --cv-entry: 10pt;
  --cv-body: 9.3pt;
  --cv-lh: 1.3;
  --cv-gap-section: 7pt;
  --cv-gap-entry: 4pt;
  --cv-gap-bullet: 1pt;

  font-family: 'Times New Roman', Times, 'Liberation Serif', Georgia, serif;
}
</style>
