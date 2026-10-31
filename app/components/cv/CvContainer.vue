<script setup lang="ts">
// Visor del CV Harvard ATS: la barra (descargas e Imprimir, fuera de la impresión) y la hoja, todo
// desde /api/cv y contact.cv. Con `printOnly` deja solo la hoja, oculta en pantalla y visible al
// imprimir: así Ctrl+P en /about imprime el CV aunque la hoja no esté abierta (print.css).
import { cvBaseName } from '~/composables/useCv'

const props = defineProps<{ printOnly?: boolean }>()

const { t, lang } = useLocale()
const [cv, files] = await Promise.all([useCv(), useCvFiles()])
// La hoja abierta sin CV es una página rota (error.vue); la copia de impresión solo se omite.
if (!props.printOnly) failOn(cv.error)

/** Mientras se imprime, el título del documento es el nombre del PDF publicado («Guardar como PDF»). */
const printName = computed(() => cvBaseName(files.data.value?.[lang.value]))
let titleBeforePrint: string | null = null

function beforePrint() {
  if (!printName.value) return
  titleBeforePrint = document.title
  document.title = printName.value
}

function afterPrint() {
  if (titleBeforePrint === null) return
  document.title = titleBeforePrint
  titleBeforePrint = null
}

function printCv() {
  window.print()
}

onMounted(() => {
  window.addEventListener('beforeprint', beforePrint)
  window.addEventListener('afterprint', afterPrint)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeprint', beforePrint)
  window.removeEventListener('afterprint', afterPrint)
  afterPrint()
})
</script>

<template>
  <CvHarvardAts v-if="printOnly && cv.data.value" :cv="cv.data.value" class="hidden print:block" />

  <section v-else-if="!printOnly && cv.data.value" :aria-label="t('cv.title')" class="flex flex-col gap-6">
    <div
      role="group"
      :aria-label="t('cv.actions')"
      data-chrome
      class="no-print mx-auto flex w-full max-w-[210mm] flex-wrap items-center justify-between gap-x-6 gap-y-3 coarse:gap-y-6"
    >
      <CvDownloads />
      <button
        type="button"
        :title="t('cv.printHint')"
        class="hit inline-flex cursor-pointer items-center gap-2 text-s text-ink"
        @click="printCv"
      >
        <AppIcon name="printer" :size="15" class="text-dim" />
        <span class="roll"><span :data-t="t('cv.print')">{{ t('cv.print') }}</span></span>
      </button>
    </div>

    <CvSheet :cv="cv.data.value" />
  </section>
</template>
