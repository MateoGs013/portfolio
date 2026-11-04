<script setup lang="ts">
/**
 * Debajo del título de Artículos, en voz baja: si Eros publica uno cada lunes (y cuándo es el
 * próximo) y cómo terminó el último pedido, con el enlace al artículo o el motivo del fallo. Si hay
 * uno escribiendo que empezó en otro lado (el de los lunes), se sigue para verlo terminar.
 */
import type { ArticleRunView } from '@shared/articleRunContracts'
import { computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { asked as t } from './dict'
import { followRun, loadRuns, runs, tracked } from './runs'

const ART = 'America/Argentina/Buenos_Aires'
const NEXT = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: ART })
const DAY = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: ART })

/** «lunes 9 de noviembre». */
const nextDay = (iso: string) => NEXT.format(new Date(iso)).replace(',', '')
/** «2 de noviembre, 9:05». */
const when = (iso: string) => DAY.format(new Date(iso))

onMounted(() => void loadRuns())

const weekly = computed(() => {
  const list = runs.value
  if (!list) return null
  return list.weekly && list.next ? t.weekly.on(nextDay(list.next)) : t.weekly.off
})

/** El último pedido: el de esta pestaña si es más nuevo que lo que dice la lista. */
const last = computed<ArticleRunView | null>(() => {
  const first = runs.value?.runs[0] ?? null
  const mine = tracked.value
  if (!mine) return first
  return !first || mine.id >= first.id ? mine : first
})

watch(last, (run) => {
  if (run?.status === 'running') followRun(run)
}, { immediate: true })
</script>

<template>
  <div v-if="weekly" class="mt-3 grid max-w-[68ch] animate-rise gap-1 text-body text-dim stagger [--i:3]" data-runs-line>
    <p class="m-0">
      {{ weekly }}
    </p>
    <p v-if="last" class="m-0">
      <template v-if="last.status === 'running'">
        {{ t.last.running }}
      </template>
      <template v-else-if="last.status === 'done' && last.article">
        {{ t.last.done(when(last.finishedAt ?? last.startedAt)) }}
        <RouterLink :to="`/articulos/${last.article.id}`" class="rounded-control text-ink underline decoration-rule-strong underline-offset-4 transition-colors duration-120 ease-e hover:decoration-ink">
          {{ last.article.title }}
        </RouterLink>
      </template>
      <template v-else-if="last.status === 'done'">
        {{ t.last.gone(when(last.finishedAt ?? last.startedAt)) }}
      </template>
      <template v-else>
        {{ t.last.failed(when(last.startedAt), last.error ?? t.failedFallback) }}
      </template>
    </p>
  </div>
</template>
