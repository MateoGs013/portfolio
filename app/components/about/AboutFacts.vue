<script setup lang="ts">
/**
 * Cuatro datos de about (título técnico, formación superior, idiomas y modalidades) y, debajo, hacia
 * dónde va (about.professional_goal) con líneas que se revelan. Cada valor es un RecordField: en
 * registro (R) es su fila tipada. En desktop el rótulo de la sección queda fijo mientras se lee.
 */
import type { DictKey } from '~/lib/dict'
import type { SiteDoc } from '~/composables/useSiteContent'

const props = defineProps<{ about: SiteDoc | null }>()

const { t } = useLocale()
const { isRecord } = useRecordView()

/** Los campos de about que forman los datos, con su rótulo de interfaz. */
const FACTS: readonly (readonly [name: string, label: DictKey])[] = [
  ['technical_degree', 'about.degree'],
  ['higher_education', 'about.higherEducation'],
  ['languages', 'about.languages'],
  ['work_modalities', 'about.modalities'],
]

const facts = computed(() => FACTS.flatMap(([name, label]) => {
  const value = props.about?.values[name]
  return value === undefined ? [] : [{ name, label, value, text: docText(props.about, name) ?? '' }]
}))

const goal = computed(() => docText(props.about, 'professional_goal'))
</script>

<template>
  <section
    v-if="facts.length"
    aria-labelledby="sobre-datos"
    class="px-pad pt-section md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2.6fr)] md:gap-x-[clamp(2rem,5vw,6rem)] focus-mode:block record:block"
  >
    <h2 id="sobre-datos" class="pb-5 text-s text-dim md:sticky md:top-24 md:self-start focus-mode:static">
      {{ t('about.facts') }}
    </h2>
    <!-- Columnas primero: cada par rótulo/valor queda junto, dos por columna. -->
    <component
      :is="isRecord ? 'div' : 'dl'"
      class="flex flex-col md:grid md:grid-flow-col md:grid-cols-2 md:grid-rows-[repeat(4,auto)] md:gap-x-10 focus-mode:flex record:block"
    >
      <RecordField v-for="f in facts" :key="f.name" collection="about" :k="f.name" :value="f.value" :record="about">
        <template #default="{ fv }">
          <dt class="border-t border-rule pt-3 text-xs text-faint">
            {{ t(f.label) }}
          </dt>
          <dd :class="fv" class="pt-1 pb-7 text-m text-ink">
            {{ f.text }}
          </dd>
        </template>
      </RecordField>
    </component>
  </section>

  <section
    v-if="goal"
    aria-labelledby="sobre-objetivo"
    class="px-pad pt-section md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2.6fr)] md:gap-x-[clamp(2rem,5vw,6rem)] focus-mode:block record:block"
  >
    <h2 id="sobre-objetivo" class="pb-5 text-s text-dim md:sticky md:top-24 md:self-start focus-mode:static">
      {{ t('about.goal') }}
    </h2>
    <RecordField collection="about" k="professional_goal" :value="goal" :record="about">
      <template #default="{ fv }">
        <RevealLines :text="goal" :class="fv" class="max-w-[34ch] text-xl leading-[1.15] font-medium text-ink" />
      </template>
    </RecordField>
  </section>
</template>
