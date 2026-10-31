<script setup lang="ts">
/**
 * La frase del inicio (movimiento.html, `.statement`): `about.engineering_philosophy` en grande, con
 * sus palabras encendiéndose a medida que se lee (ScrubWords). Es un campo del registro: vacío, solo
 * aparece como `NULL` con `?vista=registro`.
 */
import type { SiteDoc } from '~/composables/useSiteContent'

const props = defineProps<{
  about: SiteDoc | null
}>()

const { isRecord } = useRecordView()
const philosophy = computed(() => docText(props.about, 'engineering_philosophy'))
</script>

<template>
  <section v-if="philosophy || isRecord" class="px-pad pt-section">
    <RecordField v-slot="{ fv }" collection="about" k="engineering_philosophy" :value="philosophy" :record="about">
      <ScrubWords :text="philosophy ?? ''" :class="fv" class="max-w-phrase text-hero text-ink" />
    </RecordField>
  </section>
</template>
