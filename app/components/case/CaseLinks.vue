<script setup lang="ts">
/**
 * Enlaces de la obra (sitio, código…) sobre líneas de 1 px, con el texto que rueda, el dominio y la
 * flecha externa. Debajo, «Velo como registro»: la misma tecla R hecha botón; en registro vuelve al
 * diseño. El registro también muestra `url` y `repo`, que en diseño ya están en los enlaces.
 */
import type { Project } from '~/lib/api'
import { safeHref } from '~/lib/record'

const props = defineProps<{ project: Project }>()

const { t, lang, langAttr } = useLocale()
const { isRecord } = useRecordView()
const { toggleRecord } = useSiteActions()

const links = computed(() => props.project.links.flatMap((link) => {
  const href = safeHref(link.url)
  return href ? [{ ...link, href, host: new URL(href).host.replace(/^www\./, '') }] : []
}))

/** «sitio en vivo» → «Sitio en vivo»: el rótulo se lee como el resto de los rótulos. */
const sentence = (label: string) => label.charAt(0).toLocaleUpperCase(lang.value) + label.slice(1)
</script>

<template>
  <CaseSection :label="t('case.links')">
    <RecordField v-slot="{ fv }" collection="projects" k="links" :value="project.links">
      <ul v-if="links.length" class="border-b border-rule">
        <li v-for="link in links" :key="link.url" class="border-t border-rule">
          <a
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="flex min-h-12 items-baseline justify-between gap-6 py-[clamp(1rem,2.4vh,1.5rem)] text-l text-ink"
          >
            <span :class="fv" :lang="langAttr(link, 'label')"><RollText :text="sentence(link.label)" /></span>
            <span class="flex shrink-0 items-center gap-2 text-s text-dim">
              <span class="hidden md:inline">{{ link.host }}</span>
              <AppIcon name="external" :size="14" />
            </span>
            <span class="sr-only">{{ t('shell.newTab') }}</span>
          </a>
        </li>
      </ul>
    </RecordField>

    <div class="rec-only contents">
      <RecordField collection="projects" k="url" :value="project.url" />
      <RecordField collection="projects" k="repo" :value="project.repo" />
      <RecordField collection="projects" k="experiences" :value="project.experiences" />
    </div>

    <p class="record:pt-8">
      <button
        type="button"
        aria-keyshortcuts="r"
        class="hit inline-flex min-h-6 cursor-pointer items-center text-s text-dim transition-colors duration-300 hover:text-ink"
        @click="toggleRecord"
      >
        <RollText :text="t(isRecord ? 'record.toDesign' : 'case.asRecord')" />
      </button>
    </p>
  </CaseSection>
</template>
