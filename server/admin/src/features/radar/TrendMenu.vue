<script setup lang="ts">
/**
 * Más acciones de una tendencia: descartarla o devolverla a las nuevas (PATCH /radar/trends/:id/status).
 * Una tendencia con publicación no vuelve a «Nueva»: ya tiene su publicación. Sin Eros o con la
 * muestra quedan apagadas.
 */
import { trendStatusLabels, type Trend, type TrendStatus } from '@shared/contentContracts'
import { computed, ref } from 'vue'
import { toast } from '../../stores/toasts'
import Menu, { type MenuItem } from '../../ui/Menu.vue'
import { failureText } from '../hunter/adapter'
import { trend as t } from './dict'
import { canChangeTrend, changeTrendStatus } from './store'

const props = defineProps<{ trend: Trend }>()

const busy = ref(false)

const items = computed<MenuItem[]>(() => {
  const disabled = !canChangeTrend(props.trend) || busy.value
  if (props.trend.status === 'DISCARDED') {
    return [{ id: props.trend.post_id ? 'GENERATED' : 'DISCOVERED', label: t.status.restore, disabled }]
  }
  return [{ id: 'DISCARDED', label: t.status.discard, disabled }]
})

async function onSelect(id: string): Promise<void> {
  const status = id as TrendStatus
  busy.value = true
  try {
    await changeTrendStatus(props.trend, status)
    toast(t.status.done(trendStatusLabels[status]))
  }
  catch (err) {
    toast(failureText(err, t.status.failed), { tone: 'error' })
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <Menu :items="items" @select="onSelect" />
</template>
