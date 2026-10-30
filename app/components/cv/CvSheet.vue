<script setup lang="ts">
// La hoja a escala de /about?cv=ats: papel blanco de 210 mm sobre el tema, con el margen de la
// página A4 (el mismo que pone print.css), así lo que se ve es lo que se imprime. Es el destino de
// «Ver CV» (data-vt="cv-sheet"). Esc la cierra como a una capa: vuelve a /about con el resto de la query.
import type { CvDocument } from './types'

defineProps<{ cv: CvDocument }>()

const route = useRoute()
const router = useRouter()

const editable = 'input, textarea, select, [role="combobox"], [contenteditable]:not([contenteditable="false"])'

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.defaultPrevented) return
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  const target = event.target instanceof Element ? event.target : null
  if (target?.closest(editable) || document.querySelector('dialog[open], [aria-modal="true"]')) return
  // La hoja es la capa abierta: Esc la cierra antes de que el atajo general salga del Hiperfoco.
  event.preventDefault()
  event.stopPropagation()
  const { cv: _cv, ...query } = route.query
  router.push({ path: route.path, query })
}

onMounted(() => document.addEventListener('keydown', onKeydown, { capture: true }))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown, { capture: true }))
</script>

<template>
  <div
    data-vt="cv-sheet"
    class="mx-auto w-full max-w-[210mm] bg-white p-4 ring-1 ring-rule md:aspect-[210/297] md:px-[12mm] md:py-[10.5mm] print:p-0 print:ring-0"
  >
    <CvHarvardAts :cv="cv" />
  </div>
</template>
