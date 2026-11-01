<script setup lang="ts">
/**
 * #/trayectoria: la lista como pantalla, con «Vista CV» y «Nueva experiencia».
 * #/trayectoria/:id y #/trayectoria/nueva: el editor de una entrada.
 * #/trayectoria/cv: el orden del CV al lado de la hoja A4 real.
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { options } from '../../stores/meta'
import Button from '../../ui/Button.vue'
import Explorer from '../collections/Explorer.vue'
import CvView from './CvView.vue'
import { experience as t } from './dict'
import Editor from './Editor.vue'
import { experienceModel } from './model'
import { EDUCATION } from './record'

const route = useRoute()
const router = useRouter()

const id = computed<number | 'nueva' | null>(() => {
  if (route.name === 'experiencia-nueva') return 'nueva'
  if (route.name !== 'experiencia') return null
  const n = Number(route.params['id'])
  return Number.isInteger(n) ? n : null
})

const lead = computed(() => {
  const rows = options.value?.experiences
  if (!rows) return undefined
  const education = rows.filter(e => e.kind === EDUCATION).length
  const cv = rows.filter(e => e.kind !== EDUCATION && e.cvOrder !== null).length
  return t.lead(cv, education)
})

const cvHref = computed(() => router.resolve({ name: 'trayectoria-cv' }).href)
const isCv = computed(() => route.name === 'trayectoria-cv')
</script>

<template>
  <CvView v-if="isCv" />
  <Editor v-else-if="id !== null" :id="id" />
  <Explorer v-else :model="experienceModel" :lead="lead">
    <template #actions>
      <Button :href="cvHref">
        {{ t.cvView }}
      </Button>
    </template>
  </Explorer>
</template>
