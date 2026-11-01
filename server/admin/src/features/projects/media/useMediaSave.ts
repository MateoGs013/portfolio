/**
 * Ata la media al guardado de la obra (un solo Guardar):
 * - `prepare()` va antes del PUT: arma el plan con el formulario de ese momento y deja sin imagen los
 *   pasos que mostraban una pieza quitada (el PUT ya los manda así);
 * - `afterSave()` va en onAfterSave: vuelve a mostrar las piezas mientras suben, corre el plan y al
 *   final lee la obra fresca. Lo que no se guardó queda en el formulario como cambio sin guardar, con
 *   su motivo en la tarjeta, para reintentar con Guardar.
 * La obra nueva pasa por acá igual: primero se crea y en seguida suben sus imágenes.
 */
import { onBeforeUnmount, watch, type Ref, type ShallowRef } from 'vue'
import { api } from '../../../api/client'
import { toast } from '../../../stores/toasts'
import { announce } from '../../../ui/announce'
import type { AdminProject, ProjectForm } from '../types'
import { mediaText } from './dict'
import { coversFirst, keyOfId } from './mediaForm'
import type { MediaQueue } from './mediaQueue'
import { planIsEmpty, planMedia, runMedia, type MediaPlan, type MediaRunResult } from './mediaRun'

interface Options {
  form: Ref<ProjectForm>
  record: ShallowRef<AdminProject | null>
  queue: MediaQueue
  applyPatch: (project: AdminProject, fields: ['media']) => void
  /** Cuando la obra y su media quedaron guardadas (o lo que se pudo). */
  onSettled: (project: AdminProject, info: { created: boolean, current: boolean }) => void
}

const t = mediaText.queue
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export function useMediaSave({ form, record, queue, applyPatch, onSettled }: Options) {
  let pending: { plan: MediaPlan, saved: AdminProject['media'] } | null = null

  // Lo que el formulario ya no nombra se suelta de la cola; un borrador sin sus archivos se limpia.
  watch(() => form.value.media, (list) => {
    if (queue.reconcile(list)) toast(t.draftLost, { tone: 'info' })
    queue.prune(list)
  }, { deep: true })
  onBeforeUnmount(() => queue.dispose())

  function prepare(): void {
    const saved = record.value?.media ?? []
    const plan = planMedia(form.value.media, saved)
    const gone = new Set(plan.deletes)
    for (const step of form.value.steps) if (step.mediaId !== null && gone.has(step.mediaId)) step.mediaId = null
    pending = { plan, saved: [...saved] }
    queue.hold(true)
  }

  /** El PUT no salió: no se sube nada y la cola vuelve a podar. */
  function cancel(): void {
    if (!pending) return
    pending = null
    queue.hold(false)
  }

  function afterSave(saved: AdminProject, info: { created: boolean, current: boolean }): void {
    const job = pending
    pending = null
    if (!job || planIsEmpty(job.plan)) {
      queue.hold(false)
      onSettled(saved, info)
      return
    }
    // La respuesta del PUT dejó la media como estaba: se vuelven a mostrar las piezas mientras suben.
    if (info.current) form.value.media = clone(job.plan.items)
    void run(job.plan, job.saved, saved, info)
  }

  async function run(plan: MediaPlan, before: AdminProject['media'], saved: AdminProject, info: { created: boolean, current: boolean }): Promise<void> {
    const result = await runMedia(plan, saved.id, before, queue)
    let fresh: AdminProject | null = null
    try {
      fresh = await api.get<AdminProject>(`/projects/${saved.id}`)
    }
    catch {
      // Sin la lectura fresca se queda lo que había: el próximo Guardar vuelve a comparar.
    }
    queue.end()
    const current = info.current && record.value?.id === saved.id
    if (current && fresh) settleForm(plan, result, fresh)
    report(result, plan, current, saved)
    onSettled(fresh ?? saved, { created: info.created, current })
  }

  /** La obra fresca en el formulario, con lo que falló encima para reintentarlo. */
  function settleForm(plan: MediaPlan, result: MediaRunResult, fresh: AdminProject): void {
    applyPatch(fresh, ['media'])
    const list = form.value.media
    for (const item of plan.items) {
      if (!result.failed.has(item.key)) continue
      const id = item.id ?? result.created.get(item.key) ?? null
      if (id === null) {
        list.push(clone(item))
        continue
      }
      const index = list.findIndex(m => m.id === id)
      if (index === -1) continue
      // Una alta que llegó sin su inglés ya tiene su archivo: solo queda el texto por guardar.
      const uploaded = item.id === null
      if (uploaded) queue.setState(keyOfId(id), { phase: 'error', message: result.failed.get(item.key)! })
      list[index] = { ...clone(item), id, key: keyOfId(id), upload: uploaded ? { file: null, webm: null, poster: null } : clone(item.upload) }
    }
    coversFirst(list)
  }

  function report(result: MediaRunResult, plan: MediaPlan, current: boolean, saved: AdminProject): void {
    const failed = result.failed.size
    const done = plan.touched.length - failed + result.deleted
    if (!current) toast(t.otherProject(saved.title), { tone: failed ? 'error' : 'ok' })
    else if (failed) toast(t.partial(failed), { tone: 'error' })
    else announce(t.finished(done))
  }

  return { prepare, cancel, afterSave }
}
