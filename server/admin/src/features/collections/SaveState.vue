<script setup lang="ts">
/**
 * El estado del guardado al pie del editor, con punto y palabra: «Sin cambios», «Cambios sin
 * guardar», «Guardando…», «Guardado hace 3 s» o «No se pudo guardar». Lo que cambia se anuncia una vez
 * (role=status); el reloj de «hace 3 s» corre en silencio. `note` suma lo que el área tiene en camino
 * («3 imágenes por subir»).
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { SaveStatus } from '../../composables/useEditor'
import StatusDot, { type StatusTone } from '../../ui/StatusDot.vue'
import { collections } from './dict'

const props = withDefaults(defineProps<{
  status: SaveStatus
  savedAt: Date | null
  note?: string | null
}>(), { note: null })

const t = collections.save
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined

watch(() => props.status === 'saved', (on) => {
  clearInterval(timer)
  now.value = Date.now()
  if (on) timer = setInterval(() => (now.value = Date.now()), 1000)
}, { immediate: true })
onBeforeUnmount(() => clearInterval(timer))

function ago(at: Date): string {
  const seconds = Math.max(0, Math.round((now.value - at.getTime()) / 1000))
  if (seconds < 3) return t.now
  if (seconds < 60) return t.seconds(seconds)
  if (seconds < 3600) return t.minutes(Math.floor(seconds / 60))
  return t.at(at.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
}

const view = computed<{ tone: StatusTone, label: string }>(() => {
  switch (props.status) {
    case 'dirty': return { tone: 'wip', label: t.dirty }
    case 'saving': return { tone: 'neutral', label: t.saving }
    case 'error': return { tone: 'danger', label: t.failed }
    case 'saved': return { tone: 'ok', label: props.savedAt ? t.saved(ago(props.savedAt)) : t.clean }
    default: return { tone: 'ok', label: t.clean }
  }
})

/** Lo que se anuncia: el estado sin el reloj, así no se lee cada segundo. */
const spoken = computed(() => [props.status === 'saved' ? t.saved(t.now) : view.value.label, props.note].filter(Boolean).join(' · '))
</script>

<template>
  <span class="inline-flex min-w-0 items-center">
    <StatusDot :tone="view.tone" :label="view.label" aria-hidden="true" class="tabular-nums" />
    <span v-if="note" class="ml-2 text-label text-dim tabular-nums" aria-hidden="true">· {{ note }}</span>
    <span role="status" class="sr-only">{{ spoken }}</span>
  </span>
</template>
