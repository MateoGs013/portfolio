<script setup lang="ts">
/**
 * Cabecera del caso: el título que llega viajando (`data-vt="title"`, el par de la fila, la tarjeta o
 * «Siguiente») y la ficha sobre una línea: rol, cliente (nombre y ciudad, solo si la base los tiene),
 * año, estado y tecnologías. Cada tecnología faceta /projects?stack= y se asoma con su categoría, desde
 * cuándo se usa, la nota y las otras obras visibles. Cada valor es un campo del registro (tecla R).
 * En Hiperfoco la ficha deja de ser una fila de columnas y se lee como lista de definiciones en la columna.
 */
import type { Project, ProjectTech } from '~/lib/api'
import { yearsSince } from '~/lib/format'
import { modelName } from '~/lib/record'
import type { PeekLine } from './CasePeek.vue'

const props = defineProps<{ project: Project }>()

const { t, lang, localeRoute, langAttr } = useLocale()
const { isRecord } = useRecordView()

const listLocale = { es: 'es-AR', en: 'en-US' } as const

/** Debajo de 768 px (y en la columna del Hiperfoco) el valor va en su propia línea en registro; acá se ubica el h1 igual que un `.fv`. */
const titlePlace = 'record:col-span-full record:mt-1 md:not-focus-mode:record:col-auto md:not-focus-mode:record:mt-0'

const dot = { LIVE: 'bg-ok', WIP: 'bg-wip', ARCHIVED: 'bg-faint' } as const

const statusRoute = computed(() => localeRoute({ path: '/projects', query: { status: props.project.status.toLowerCase() } }))

function techLines(tech: ProjectTech): PeekLine[] {
  const years = yearsSince(tech.since)
  const since = t('case.peek.since', { year: tech.since })
  const age = years > 0 ? t(years === 1 ? 'case.peek.years.one' : 'case.peek.years.other', { n: years }) : null
  const others = tech.projects.filter(work => work.slug !== props.project.slug).map(work => work.title)
  const lines: PeekLine[] = [{ text: age ? `${since} · ${age}` : since }]
  if (tech.note) lines.push({ text: tech.note, lang: langAttr(tech, 'note') })
  lines.push({
    text: others.length
      ? t('case.peek.alsoIn', { works: new Intl.ListFormat(listLocale[lang.value], { type: 'conjunction' }).format(others) })
      : t('case.peek.onlyHere'),
  })
  return lines
}

const dt = 'text-xs text-faint'
const link = 'hit underline decoration-rule decoration-1 underline-offset-4 transition-colors duration-300 hover:decoration-current'
</script>

<template>
  <header class="px-pad pt-[clamp(8rem,24vh,13rem)] pb-[clamp(2rem,6vh,4rem)] record:pt-[clamp(7rem,20vh,10rem)] record:pb-0">
    <p class="rec-only mb-6 font-mono text-xs text-faint">
      {{ modelName.projects }} · {{ project.slug }}
    </p>

    <RecordField v-slot="{ fv }" collection="projects" k="title" :value="project.title" :record="project" shared>
      <h1 tabindex="-1" :class="titlePlace" class="-ms-[0.04em] max-w-[12ch] text-display-case text-ink focus-mode:text-display-row">
        <span data-vt="title" :class="fv">{{ project.title }}</span>
      </h1>
    </RecordField>

    <component
      :is="isRecord ? 'div' : 'dl'"
      class="mt-[clamp(1.5rem,4vh,2.5rem)] grid gap-y-1 border-t border-rule pt-5 text-s md:grid-flow-col md:grid-rows-[auto_auto] md:justify-start md:gap-x-[clamp(2rem,5vw,5rem)] md:gap-y-1.5 focus-mode:md:grid-flow-row focus-mode:md:grid-cols-[minmax(7rem,auto)_1fr] focus-mode:md:grid-rows-none focus-mode:md:gap-x-8 focus-mode:md:items-baseline focus-mode:md:gap-y-3 record:mt-0 record:block record:border-0 record:pt-0 [&_dd]:mb-4 md:[&_dd]:mb-0"
    >
      <RecordField v-slot="{ fv }" collection="projects" k="role" :value="project.role" :record="project">
        <dt :class="dt">
          {{ t('case.role') }}
        </dt>
        <dd :class="fv">
          {{ project.role }}
        </dd>
      </RecordField>

      <RecordField v-slot="{ fv }" collection="projects" k="org" :value="project.org">
        <dt :class="dt">
          {{ t('case.client') }}
        </dt>
        <dd>
          <span :class="fv">{{ project.org?.name }}</span><span v-if="project.org?.city" class="text-dim"> · {{ project.org.city }}</span>
        </dd>
      </RecordField>

      <RecordField v-slot="{ fv }" collection="projects" k="year" :value="project.year">
        <dt :class="dt">
          {{ t('case.year') }}
        </dt>
        <dd :class="fv" class="tabular-nums">
          {{ project.year }}
        </dd>
      </RecordField>

      <RecordField v-slot="{ fv }" collection="projects" k="status" :value="project.status">
        <dt :class="dt">
          {{ t('case.status') }}
        </dt>
        <!-- self-start: si otra columna de la ficha ocupa más renglones (en papel), la fila se estira y el
             valor centrado quedaría un renglón más abajo que los demás. -->
        <dd class="flex items-center gap-2 self-start">
          <span aria-hidden="true" class="inline-block size-[0.45rem] shrink-0 rounded-full" :class="dot[project.status]" />
          <NuxtLink :to="statusRoute" :class="[fv, link]">{{ t(`status.${project.status}`) }}</NuxtLink>
        </dd>
      </RecordField>

      <RecordField v-slot="{ fv }" collection="projects" k="techs" :value="project.techs">
        <dt :class="dt">
          {{ t('case.stack') }}
        </dt>
        <dd>
          <ul data-peek-group class="flex flex-wrap items-center gap-x-3 gap-y-1 coarse:gap-y-6">
            <CasePeekTrigger
              v-for="tech in project.techs"
              :key="tech.slug"
              as="li"
              class="inline-flex items-center"
              :heading="t(`category.${tech.category}`)"
              :lines="techLines(tech)"
              :label="t('case.peek.open', { name: tech.name })"
            >
              <NuxtLink :to="localeRoute({ path: '/projects', query: { stack: tech.slug } })" :class="[fv, link]">
                {{ tech.name }}
              </NuxtLink>
            </CasePeekTrigger>
          </ul>
        </dd>
      </RecordField>
    </component>
  </header>
</template>
