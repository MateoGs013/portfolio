<script setup lang="ts">
/**
 * Más acciones de una vacante: guardarla para después, descartarla o devolverla a la cola
 * (PATCH /hunter/jobs/:id/status) y eliminarla (DELETE /hunter/jobs/:id, con confirmación). Las
 * pegadas a mano cambian acá mismo; las de Eros, solo con Eros arriba. «Ya la envié» vive en Postular.
 */
import type { HunterJob, HunterJobStatus } from '@shared/hunterContracts'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { requestConfirm } from '../../stores/dialogs'
import { toast } from '../../stores/toasts'
import Menu, { type MenuItem } from '../../ui/Menu.vue'
import { failureText } from './adapter'
import { hunter } from './dict'
import { job as t } from './dictJob'
import { isManual } from './model'
import { canChange, changeStatus, deleteJob, lastFilter } from './store'
import { forgetWork } from './work'

const props = defineProps<{ job: HunterJob }>()

const router = useRouter()
const busy = ref(false)

const items = computed<MenuItem[]>(() => {
  const locked = !canChange(props.job) || busy.value
  const status = props.job.status
  const list: MenuItem[] = []
  if (status !== 'saved' && status !== 'applied') list.push({ id: 'saved', label: t.menu.save, disabled: locked })
  if (status === 'discarded') list.push({ id: 'evaluated', label: t.menu.restore, disabled: locked })
  else list.push({ id: 'discarded', label: t.menu.discard, disabled: locked })
  list.push({ id: 'remove', label: t.menu.remove, icon: 'trash', danger: true, disabled: locked })
  return list
})

async function setStatus(status: HunterJobStatus): Promise<void> {
  busy.value = true
  try {
    await changeStatus(props.job, status)
    toast(t.menu.statusDone(hunter.status[status]))
  }
  catch (err) {
    toast(failureText(err, t.menu.statusFailed), { tone: 'error' })
  }
  finally {
    busy.value = false
  }
}

async function remove(): Promise<void> {
  const job = props.job
  const ok = await requestConfirm({
    title: t.menu.removeTitle,
    message: t.menu.removeMessage(job.title),
    impact: isManual(job) ? [t.menu.removeManual] : undefined,
    confirmLabel: t.menu.removeConfirm,
    destructive: true,
  })
  if (!ok) return
  busy.value = true
  try {
    await deleteJob(job)
    forgetWork(job.id)
    toast(t.menu.removed)
    void router.push({ path: '/busqueda/vacantes', query: lastFilter.value === 'revisar' ? {} : { filtro: lastFilter.value } })
  }
  catch (err) {
    toast(failureText(err, t.menu.removeFailed), { tone: 'error' })
  }
  finally {
    busy.value = false
  }
}

function onSelect(id: string): void {
  if (id === 'remove') void remove()
  else void setStatus(id as HunterJobStatus)
}
</script>

<template>
  <Menu :items="items" :label="t.menu.label" @select="onSelect" />
</template>
