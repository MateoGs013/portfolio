<script setup lang="ts">
/**
 * Portada del inicio (movimiento.html, `.hero`): el nombre ocupa el pie de la primera pantalla y debajo
 * van el titular (`about.headline`, líneas que se revelan) y, a la derecha, el rol (`about.role`) y la
 * disponibilidad (`contact.availability`). Cada valor es un campo del registro: con `?vista=registro`
 * el SSR los entrega con nombre y tipo.
 *
 * De la disponibilidad, el diseño muestra la primera parte («Inmediata») con el punto de estado, como
 * el pie; el detalle se lee completo en registro, en Sobre mí y en el CV.
 */
import type { SiteDoc } from '~/composables/useSiteContent'
import { DOC_MODEL } from '~/lib/record'

const props = defineProps<{
  about: SiteDoc | null
  contact: SiteDoc | null
}>()

const { t } = useLocale()

const headline = computed(() => docText(props.about, 'headline'))
const role = computed(() => docText(props.about, 'role'))
const availability = computed(() => docText(props.contact, 'availability'))
const availableNow = computed(() => availability.value?.split('·')[0]?.trim() || availability.value)
</script>

<template>
  <section
    class="relative flex min-h-svh flex-col justify-end px-pad pt-[clamp(7rem,22vh,12rem)] pb-[clamp(1.5rem,6vh,4rem)] focus-mode:min-h-0 record:min-h-0 record:pt-[clamp(7rem,20vh,10rem)] record:pb-0"
  >
    <!-- En registro, de qué registro sale la portada (como «Project · slug» en el caso). -->
    <p class="rec-only mb-6 font-mono text-xs text-faint">
      {{ DOC_MODEL }} · about
    </p>
    <HeroName :about="about" />

    <div
      class="mt-[clamp(1.5rem,4vh,3rem)] flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between md:gap-8 record:mt-0 record:block"
    >
      <RecordField v-slot="{ fv }" collection="about" k="headline" :value="headline" :record="about">
        <RevealLines :text="headline ?? ''" :class="fv" class="max-w-[30ch] text-l leading-[1.35] text-ink" />
      </RecordField>

      <div class="flex flex-col gap-1 text-s text-dim md:text-right record:contents record:text-left md:record:text-left">
        <RecordField v-slot="{ fv }" collection="about" k="role" :value="role" :record="about">
          <p :class="fv" class="text-balance">
            {{ role }}
          </p>
        </RecordField>
        <RecordField v-slot="{ fv }" collection="contact" k="availability" :value="availability" :record="contact">
          <p :class="fv">
            <span aria-hidden="true" class="mr-2 inline-block size-[0.45rem] rounded-full bg-ok align-[.08em]" />
            <span class="sr-only">{{ t('home.availability') }}: </span>{{ availableNow }}
          </p>
        </RecordField>
      </div>
    </div>
  </section>
</template>
