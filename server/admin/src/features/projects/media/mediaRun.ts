/**
 * El guardado de la media, después del PUT de la obra y en el mismo Guardar:
 * 1. el plan compara el formulario con lo guardado (piezas quitadas, metadatos cambiados, archivos en
 *    cola) y se arma antes del PUT, porque la respuesta del PUT pisa el formulario;
 * 2. la corrida va pieza por pieza: borrados, metadatos (las que pasan a galería antes que las nuevas
 *    portadas, así el servidor no corre nada al final), reemplazos y pósters, y por último las altas
 *    con su inglés. Una pieza que falla no frena a las demás.
 */
import { api } from '../../../api/client'
import { messageOf } from '../../../api/errors'
import type { AdminMedia, MediaForm } from '../types'
import type { MediaQueue } from './mediaQueue'

type Body = Record<string, unknown>

export interface MediaPlan {
  /** El formulario como estaba al guardar. */
  items: MediaForm[]
  deletes: number[]
  /** El `order` de cada pieza, por clave. */
  orders: Record<string, number>
  /** Las piezas con algo que mandar, por clave. */
  touched: string[]
}

const text = (value: string | null | undefined) => value ?? ''
const orNull = (value: string) => value.trim() || null

/** Los campos de una pieza ya guardada que cambiaron, como los espera PATCH /media/:id. */
function patchOf(item: MediaForm, saved: AdminMedia, order: number): Body | null {
  const body: Body = {}
  if (item.role !== saved.role) body['role'] = item.role
  if (order !== saved.order || item.role !== saved.role) body['order'] = order
  if (item.viewport !== saved.viewport) body['viewport'] = item.viewport
  if (item.alt !== saved.alt) body['alt'] = item.alt.trim()
  if (orNull(item.caption) !== orNull(text(saved.caption))) body['caption'] = orNull(item.caption)
  if (orNull(item.tint) !== saved.tint) body['tint'] = orNull(item.tint)
  const en = saved.translations[0]
  const enBody: Body = {}
  if (orNull(item.translations.en.alt) !== orNull(text(en?.alt))) enBody['alt'] = orNull(item.translations.en.alt)
  if (orNull(item.translations.en.caption) !== orNull(text(en?.caption))) enBody['caption'] = orNull(item.translations.en.caption)
  if (Object.keys(enBody).length) body['en'] = enBody
  return Object.keys(body).length ? body : null
}

const hasUpload = (m: MediaForm) => m.upload.file !== null || m.upload.webm !== null || m.upload.poster !== null

/**
 * El `order` de cada pieza dentro de su grupo, tocando lo menos posible: la que conserva su lugar
 * relativo guarda su número (la base tiene huecos, como una galería que empieza en 1) y la que se
 * movió, cambió de grupo o es nueva toma el siguiente al de la anterior.
 */
function ordersOf(items: readonly MediaForm[], byId: ReadonlyMap<number, AdminMedia>): Record<string, number> {
  const orders: Record<string, number> = {}
  for (const role of ['COVER', 'GALLERY'] as const) {
    let last = -1
    for (const item of items.filter(m => m.role === role)) {
      const row = item.id === null ? undefined : byId.get(item.id)
      const kept = row && row.role === role && row.order > last ? row.order : null
      last = kept ?? last + 1
      orders[item.key] = last
    }
  }
  return orders
}

export function planMedia(list: readonly MediaForm[], saved: readonly AdminMedia[]): MediaPlan {
  const items = JSON.parse(JSON.stringify(list)) as MediaForm[]
  const kept = new Set(items.flatMap(m => (m.id === null ? [] : [m.id])))
  const byId = new Map(saved.map(m => [m.id, m]))
  const orders = ordersOf(items, byId)
  const touched = items.filter((m) => {
    if (m.id === null) return true
    const row = byId.get(m.id)
    return !!row && (hasUpload(m) || patchOf(m, row, orders[m.key]!) !== null)
  }).map(m => m.key)
  return { items, deletes: saved.filter(m => !kept.has(m.id)).map(m => m.id), orders, touched }
}

export const planIsEmpty = (plan: MediaPlan) => !plan.deletes.length && !plan.touched.length

export interface MediaRunResult {
  failed: Map<string, string>
  /** Las altas que llegaron a la base, por clave: su id nuevo. */
  created: Map<string, number>
  deleted: number
}

function form(fields: Record<string, string | Blob | null>): FormData {
  const data = new FormData()
  for (const [name, value] of Object.entries(fields)) if (value !== null) data.append(name, value)
  return data
}

export async function runMedia(plan: MediaPlan, projectId: number, saved: readonly AdminMedia[], queue: MediaQueue): Promise<MediaRunResult> {
  const result: MediaRunResult = { failed: new Map(), created: new Map(), deleted: 0 }
  const byId = new Map(saved.map(m => [m.id, m]))
  const touched = plan.items.filter(m => plan.touched.includes(m.key))
  queue.begin(touched.map(m => m.key))

  for (const id of plan.deletes) {
    try {
      await api.delete(`/media/${id}`)
      result.deleted++
    }
    catch {
      // Ya no estaba o no se pudo: la lectura fresca de la obra lo muestra como quedó.
    }
  }

  const existing = touched.filter(m => m.id !== null)
  const ordered = [...existing.filter(m => m.role === 'GALLERY'), ...existing.filter(m => m.role === 'COVER')]
  for (const item of ordered) await step(item, () => updatePiece(item))
  for (const item of touched.filter(m => m.id === null)) await step(item, () => createPiece(item))
  return result

  async function step(item: MediaForm, run: () => Promise<void>): Promise<void> {
    queue.setState(item.key, { phase: 'uploading' })
    try {
      await run()
      queue.setState(item.key, { phase: 'done' })
    }
    catch (err) {
      const message = messageOf(err)
      result.failed.set(item.key, message)
      queue.setState(item.key, { phase: 'error', message })
    }
  }

  async function updatePiece(item: MediaForm): Promise<void> {
    const row = byId.get(item.id!)
    if (!row) return
    const patch = patchOf(item, row, plan.orders[item.key]!)
    if (patch) await api.patch(`/media/${item.id}`, patch)
    const file = item.upload.file ? queue.get(item.key, 'file') : null
    const webm = item.upload.webm ? queue.get(item.key, 'webm') : null
    const poster = item.upload.poster ? queue.get(item.key, 'poster') : null
    if (file) await api.post(`/media/${item.id}/file`, form({ file, webm }))
    else if (webm) await api.post(`/media/${item.id}/webm`, form({ webm }))
    if (poster) await api.post(`/media/${item.id}/poster`, form({ poster, tint: orNull(item.tint) }))
  }

  async function createPiece(item: MediaForm): Promise<void> {
    const file = queue.get(item.key, 'file')
    if (!file) return
    const created = await api.post<AdminMedia>('/media', form({
      file,
      webm: item.upload.webm ? queue.get(item.key, 'webm') : null,
      poster: item.upload.poster ? queue.get(item.key, 'poster') : null,
      projectId: String(projectId),
      alt: item.alt.trim(),
      caption: orNull(item.caption),
      role: item.role,
      order: String(plan.orders[item.key]!),
      viewport: item.viewport,
      tint: orNull(item.tint),
    }))
    result.created.set(item.key, created.id)
    const en = { alt: orNull(item.translations.en.alt), caption: orNull(item.translations.en.caption) }
    if (en.alt || en.caption) await api.patch(`/media/${created.id}`, { en })
  }
}
