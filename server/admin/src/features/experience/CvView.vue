<script setup lang="ts">
/**
 * #/trayectoria/cv[?idioma=en]: qué entra al CV y en qué orden, al lado de la hoja A4 real armada con
 * la base. Ordenar, sumar o sacar se guarda solo (PATCH /experience/order) y la hoja se vuelve a pedir
 * y a medir: si pasa de una página, lo dice. La formación entra sola, ordenada por fecha. El PDF del
 * sitio no se regenera desde acá (pnpm cv:pdf); la hoja se imprime o se guarda como PDF.
 */
import type { CvMeasure } from '@shared/hunterContracts'
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api } from '../../api/client'
import { messageOf } from '../../api/errors'
import { useCollection } from '../../composables/useCollection'
import { useRecordTitle } from '../../shell/title'
import { toast } from '../../stores/toasts'
import Button from '../../ui/Button.vue'
import ErrorState from '../../ui/ErrorState.vue'
import type { SelectOption } from '../../ui/field'
import Icon from '../../ui/Icon.vue'
import Mono from '../../ui/Mono.vue'
import RadioGroup from '../../ui/RadioGroup.vue'
import Skeleton from '../../ui/Skeleton.vue'
import StatusDot from '../../ui/StatusDot.vue'
import CvMeasureLine from './CvMeasure.vue'
import CvOrderList from './CvOrderList.vue'
import CvSheet from './CvSheet.vue'
import CvSideLists from './CvSideLists.vue'
import { experience as t } from './dict'
import { experienceModel } from './model'
import type { Experience, SheetLang } from './record'
import { useCvOrder } from './useCvOrder'

useRecordTitle(t.cvView)

const route = useRoute()
const router = useRouter()
const { items, loading, error, reload } = useCollection<Experience>(experienceModel)
const order = useCvOrder(items)
const { entries, outside, education, state, version } = order

const lang = computed<SheetLang>({
  get: () => (route.query['idioma'] === 'en' ? 'en' : 'es'),
  set: value => void router.replace({ query: { ...route.query, idioma: value === 'en' ? 'en' : undefined } }),
})
const langs: SelectOption<SheetLang>[] = [{ value: 'es', label: t.cv.es }, { value: 'en', label: t.cv.en }]

const measure = ref<Pick<CvMeasure, 'heightMm' | 'pages'> | null>(null)

const saveLine = computed(() => {
  if (state.value === 'saving') return { tone: 'neutral' as const, label: t.cv.saving }
  if (state.value === 'saved') return { tone: 'ok' as const, label: t.cv.saved }
  return null
})

const printing = ref(false)
async function print(): Promise<void> {
  if (printing.value) return
  // En el gesto: después de un await el navegador ya no la deja abrir.
  const win = window.open('', '_blank')
  printing.value = true
  try {
    const { ticket } = await api.post<{ ticket: string }>('/hunter/cv-base/ticket')
    const params = new URLSearchParams({ lang: lang.value, ticket, auto_print: 'true' })
    const url = `/api/admin/hunter/cv-base/html?${params.toString()}`
    if (win && !win.closed) {
      win.opener = null
      win.location.href = url
    }
    else toast(t.cv.printBlocked, { tone: 'info', duration: 0, action: { label: t.cv.openSheet, run: () => window.open(url, '_blank', 'noopener') } })
  }
  catch (err) {
    win?.close()
    toast(`${t.cv.sheetFailed}. ${messageOf(err)}`, { tone: 'error' })
  }
  finally {
    printing.value = false
  }
}

const pad = 'px-4 md:px-10 xl:px-16'
</script>

<template>
  <section :class="pad" class="pt-8 pb-20 md:pt-9">
    <RouterLink
      :to="experienceModel.routes.list"
      class="inline-flex items-center gap-2 rounded-control text-row font-[420] text-faint no-underline transition-colors duration-120 ease-e hover:text-ink"
    >
      <Icon name="arrow-left" :size="14" />
      {{ t.noun.many.charAt(0).toLocaleUpperCase('es') + t.noun.many.slice(1) }}
    </RouterLink>
    <header class="mt-3.5 flex max-w-[1280px] flex-wrap items-end gap-x-6 gap-y-4">
      <h1 class="m-0 min-w-0 flex-[1_1_20rem] animate-rise text-heading text-balance">
        {{ t.cvView }}
      </h1>
      <div class="flex animate-rise flex-wrap items-center gap-3 pb-1 stagger [--i:1]">
        <RadioGroup v-model="lang" :options="langs" :label="t.cv.language" />
        <Button icon="external" :loading="printing" :loading-label="t.cv.printing" @click="print">
          {{ t.cv.print }}
        </Button>
      </div>
    </header>
    <p class="mt-3.5 mb-0 max-w-[60ch] animate-rise text-lead text-dim stagger [--i:2]">
      {{ t.cv.lead }}
    </p>

    <ErrorState v-if="error && !items" class="mt-10" :message="error.message" :retrying="loading" @retry="reload()" />
    <Skeleton v-else-if="!items" class="mt-10" variant="rows" :count="5" />
    <div v-else class="mt-10 grid max-w-[1280px] animate-enter items-start gap-10 border-t border-rule pt-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <aside class="grid content-start gap-9 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:border-l lg:border-rule lg:pl-6" :aria-label="t.cv.order">
        <CvMeasureLine :measure="measure" />
        <div class="grid gap-3">
          <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 class="m-0 text-label text-dim">
              {{ t.cv.order }}
            </h2>
            <p class="m-0 text-label" aria-live="polite" data-order-state>
              <StatusDot v-if="saveLine" :tone="saveLine.tone" :label="saveLine.label" />
            </p>
          </div>
          <CvOrderList :entries="entries" @move="order.move" @remove="order.remove" />
        </div>
        <CvSideLists :outside="outside" :education="education" :placed="entries.length" @add="order.add" />
        <p class="m-0 flex flex-wrap items-baseline gap-x-1.5 border-t border-rule pt-5 text-label text-faint">
          {{ t.cv.pdf }}
          <Mono>{{ t.cv.pdfCommand }}</Mono>
        </p>
      </aside>
      <CvSheet class="lg:col-start-1 lg:row-start-1" :lang="lang" :version="version" @measure="measure = $event" />
    </div>
  </section>
</template>
