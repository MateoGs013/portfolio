<script setup lang="ts">
/**
 * Lo que se hace con la cola entera:
 * - «Buscar vacantes nuevas» (POST /hunter/scan): Eros recorre los portales; el botón dice qué está
 *   pasando y al terminar un aviso cuenta lo que encontró. El escaneo indexa solo lo nuevo para la
 *   búsqueda por afinidad; si no le alcanzó el tiempo, se indexa después (POST /hunter/vectorize).
 * - «Pegar una vacante», el primario: anda con Eros o sin él.
 * - Más acciones: «Evaluar las pendientes» y «Limpiar la cola» (con confirmación).
 * Sin Eros o con la muestra de prueba, todo menos pegar queda apagado y se dice por qué.
 * Escanear y evaluar tardan minutos y corren de a uno (`longTask` del store, que sobrevive a salir de
 * la pantalla). Si se cortan por tiempo no se dice «no se hizo»: Eros puede estar terminando.
 */
import { computed, ref } from 'vue'
import { announce } from '../../ui/announce'
import Button from '../../ui/Button.vue'
import Menu, { type MenuItem } from '../../ui/Menu.vue'
import Spinner from '../../ui/Spinner.vue'
import { requestConfirm } from '../../stores/dialogs'
import { toast } from '../../stores/toasts'
import { failureText, hunterApi, isStillWorking } from './adapter'
import { hunter } from './dict'
import { loadQueue, longTask } from './store'

const props = defineProps<{
  /** Por qué no se puede tocar la cola (sin Eros, muestra), o null. */
  locked: string | null
}>()

defineEmits<{ paste: [] }>()

const scanning = computed(() => longTask.value === 'scan')
const busy = ref(false)

async function indexLater(): Promise<void> {
  try {
    const result = await hunterApi.vectorize()
    toast(hunter.scan.indexDone(result.vectorized_count), { tone: 'info' })
  }
  catch {
    toast(hunter.scan.indexFailed, { tone: 'info' })
  }
}

async function scan(): Promise<void> {
  if (props.locked) return
  if (longTask.value) {
    announce(hunter.scan.running)
    return
  }
  longTask.value = 'scan'
  announce(hunter.scan.started)
  try {
    const result = await hunterApi.scan()
    const indexed = result.vectorized !== null && result.new_jobs > 0 ? hunter.scan.indexed(result.vectorized) : ''
    toast(hunter.scan.done(result.scanned, result.new_jobs) + indexed)
    await loadQueue()
    if (result.vectorized === null && result.new_jobs > 0) {
      toast(hunter.scan.indexLater, { tone: 'info' })
      void indexLater()
    }
  }
  catch (err) {
    if (isStillWorking(err)) toast(hunter.scan.stillWorking, { tone: 'info' })
    else toast(failureText(err, hunter.scan.failed), { tone: 'error' })
  }
  finally {
    longTask.value = null
  }
}

async function evaluatePending(): Promise<void> {
  if (longTask.value) return
  longTask.value = 'evaluate'
  announce(hunter.actions.evaluating)
  try {
    const result = await hunterApi.evaluatePending()
    toast(hunter.batch.done(result.evaluated_count))
    await loadQueue()
  }
  catch (err) {
    if (isStillWorking(err)) toast(hunter.batch.stillWorking, { tone: 'info' })
    else toast(failureText(err, hunter.batch.failed), { tone: 'error' })
  }
  finally {
    longTask.value = null
  }
}

async function purge(): Promise<void> {
  const ok = await requestConfirm({
    title: hunter.purge.title,
    message: hunter.purge.message,
    impact: [...hunter.purge.impact],
    confirmLabel: hunter.purge.confirm,
    destructive: true,
  })
  if (!ok) return
  busy.value = true
  try {
    const result = await hunterApi.purge()
    toast(hunter.purge.done(result.purged_count))
    await loadQueue()
  }
  catch (err) {
    toast(failureText(err, hunter.purge.failed), { tone: 'error' })
  }
  finally {
    busy.value = false
  }
}

const items = computed<MenuItem[]>(() => [
  { id: 'evaluate', label: hunter.actions.evaluatePending, disabled: !!props.locked || busy.value || !!longTask.value },
  { id: 'purge', label: hunter.actions.purge, danger: true, disabled: !!props.locked || busy.value },
])

function onSelect(id: string): void {
  if (id === 'evaluate') void evaluatePending()
  else if (id === 'purge') void purge()
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <Button
      :aria-busy="scanning || undefined"
      :aria-disabled="locked || longTask ? 'true' : undefined"
      :aria-describedby="locked ? 'cola-bloqueada' : undefined"
      :class="locked ? 'aria-disabled:opacity-45' : ''"
      @click="scan"
    >
      <Spinner v-if="scanning" :live="false" show-label :label="hunter.actions.scanning" />
      <template v-else>
        {{ hunter.actions.scan }}
      </template>
    </Button>
    <Button variant="primary" shortcut="n" @click="$emit('paste')">
      {{ hunter.actions.paste }}
    </Button>
    <Menu :items="items" :label="hunter.actions.more" @select="onSelect" />
  </div>
</template>
