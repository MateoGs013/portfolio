<script setup lang="ts">
/**
 * La hoja real del CV base (GET /api/admin/hunter/cv-base/html?lang=…&measure=1) en el marco aislado
 * de la etapa CV de Vacantes, escalada a su lugar. El iframe no lleva la clave: cada carga pide un
 * ticket nuevo (POST /hunter/cv-base/ticket, vale una hora). Se vuelve a pedir al cambiar el idioma o
 * `version` (un orden guardado). Al cargar, la hoja se mide y lo cuenta con `measure`.
 */
import type { CvMeasure } from '@shared/hunterContracts'
import { ref, watch } from 'vue'
import { api, useRequestScope } from '../../api/client'
import { isAbort, messageOf } from '../../api/errors'
import ErrorState from '../../ui/ErrorState.vue'
import Skeleton from '../../ui/Skeleton.vue'
import CvFrame from '../hunter/stages/CvFrame.vue'
import { experience as t } from './dict'
import type { SheetLang } from './record'

const props = defineProps<{ lang: SheetLang, version: number }>()
const emit = defineEmits<{ measure: [value: Pick<CvMeasure, 'heightMm' | 'pages'> | null] }>()

const scope = useRequestScope()
const url = ref<string | null>(null)
const problem = ref<string | null>(null)
const loading = ref(false)

async function load(): Promise<void> {
  const signal = scope.renew()
  loading.value = true
  problem.value = null
  emit('measure', null)
  try {
    const { ticket } = await api.post<{ ticket: string }>('/hunter/cv-base/ticket', undefined, { signal })
    const params = new URLSearchParams({ lang: props.lang, ticket, measure: '1' })
    url.value = `/api/admin/hunter/cv-base/html?${params.toString()}`
  }
  catch (err) {
    if (isAbort(err)) return
    problem.value = messageOf(err)
  }
  finally {
    if (!signal.aborted) loading.value = false
  }
}

watch(() => [props.lang, props.version], () => void load(), { immediate: true })
</script>

<template>
  <div class="min-w-0 rounded-dialog bg-surface p-4 sm:p-7" :aria-busy="loading || undefined">
    <ErrorState v-if="problem" :message="`${t.cv.sheetFailed}. ${problem}`" @retry="load()" />
    <CvFrame
      v-else-if="url"
      :key="url"
      :url="url"
      :title="`${t.cv.sheet} · ${lang === 'en' ? t.cv.en : t.cv.es}`"
      @measure="emit('measure', $event)"
    />
    <Skeleton v-else variant="text" :count="8" />
  </div>
</template>
