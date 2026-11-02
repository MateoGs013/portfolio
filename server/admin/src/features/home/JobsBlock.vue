<script setup lang="ts">
/**
 * Las vacantes nuevas y compatibles (la misma cuenta que el contador de Búsqueda laboral: estado
 * nueva y puntaje desde 65), desde la cola de Vacantes, que pide GET /hunter/jobs y /hunter/stats. Si
 * Eros no responde, una línea con el motivo y Probar de nuevo, siempre; si además quedaron filas de la
 * última lectura (la caché de la sesión o las pegadas a mano), se listan debajo con la hora de esa
 * lectura, para que no pasen por actuales. Si Eros responde y no hay nada nuevo, nada.
 */
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Button from '../../ui/Button.vue'
import { isManual, isSample, verdictOf } from '../hunter/model'
import { lastSync, loadQueue, queueError, queueFetching } from '../hunter/store'
import { home } from './dict'
import { erosDown as down, freshJobs as fresh, type FreshJob } from './freshJobs'
import PendingRow from './PendingRow.vue'

const props = defineProps<{
  /** Dónde sigue el escalonado de la pantalla. */
  offset: number
}>()

const SHOWN = 5
const t = home.jobs

onMounted(() => void loadQueue(false))

const shown = computed(() => fresh.value.slice(0, SHOWN))
const sample = computed(() => fresh.value.some(({ job }) => isSample(job)))
/** El motivo que da el servidor («Eros no responde…») y qué no se puede hacer. */
const downText = computed(() => [queueError.value?.message, t.erosDown].filter(Boolean).join(' '))
/** Sin Eros, las filas que se ven son de la última lectura buena: se dice de cuándo. */
const staleText = computed(() => {
  if (!down.value || !fresh.value.length) return ''
  const at = lastSync.value
    ? new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(lastSync.value))
    : null
  return t.stale(at)
})

const context = (item: FreshJob) => [t.score(verdictOf(item.score).label, item.score), isManual(item.job) ? t.manual : ''].filter(Boolean).join(' · ')
</script>

<template>
  <div v-if="down || fresh.length">
    <section v-if="down" aria-labelledby="pendientes-eros" data-group="eros" class="animate-rise stagger" :style="{ '--i': Math.min(props.offset, 14) }">
      <h3 id="pendientes-eros" class="m-0 flex items-center gap-2.5 text-row font-[560]">
        <span class="size-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
        {{ t.erosTitle }}
      </h3>
      <p class="mt-2 mb-0 max-w-[60ch] border-t border-rule pt-4 text-body text-dim">
        {{ downText }}
      </p>
      <Button class="mt-4" :loading="queueFetching" @click="loadQueue(true)">
        {{ t.retry }}
      </Button>
    </section>
    <section v-if="fresh.length" aria-labelledby="pendientes-vacantes" data-group="vacantes" :class="down && 'mt-10'">
      <h3
        id="pendientes-vacantes"
        class="m-0 flex animate-rise items-baseline gap-2.5 stagger text-row font-[560]"
        :style="{ '--i': Math.min(props.offset, 14) }"
        :aria-label="home.pending.group(t.title, fresh.length)"
      >
        {{ t.title }}
        <span class="text-label font-[420] text-faint tabular-nums" aria-hidden="true">{{ fresh.length }}</span>
      </h3>
      <p v-if="staleText" class="mt-1.5 mb-0 text-label text-faint">
        {{ staleText }}
      </p>
      <p v-else-if="sample" class="mt-1.5 mb-0 text-label text-faint">
        {{ t.sample }}
      </p>
      <ul class="group/list m-0 mt-2 list-none border-t border-rule p-0">
        <PendingRow
          v-for="(item, i) in shown"
          :key="item.job.id"
          :to="`/busqueda/vacantes/${encodeURIComponent(item.job.id)}/analisis`"
          :headline="t.row(item.job.title, item.job.company)"
          :message="context(item)"
          tone="ok"
          :index="props.offset + i + 1"
          data-kind="job"
        />
      </ul>
      <RouterLink
        v-if="fresh.length > SHOWN"
        to="/busqueda/vacantes?filtro=compatibles"
        class="mt-4 inline-flex rounded-control text-body text-dim underline decoration-rule-strong underline-offset-4 transition-colors duration-120 ease-e hover:text-ink hover:decoration-ink"
      >
        {{ t.more(fresh.length - SHOWN) }}
      </RouterLink>
    </section>
  </div>
</template>
