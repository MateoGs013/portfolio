/**
 * La cola de archivos de una obra abierta: lo que se eligió y todavía no se subió (piezas nuevas,
 * reemplazos, WebM y pósters), su vista previa (blob:) y cómo va cada pieza mientras se guarda.
 *
 * El formulario solo guarda el nombre de cada archivo (MediaForm.upload): así cuenta como cambio sin
 * guardar y Descartar lo deshace. Los archivos viven acá, en memoria; un borrador recuperado trae los
 * nombres sin los archivos, y `reconcile` los quita del formulario.
 *
 * ProjectEditor la crea y la provee; las tarjetas la toman con useMediaQueue().
 */
import { computed, inject, ref, type InjectionKey, type Ref } from 'vue'
import type { MediaForm } from '../types'

export type Slot = 'file' | 'webm' | 'poster'
export type PiecePhase = 'waiting' | 'uploading' | 'done' | 'error'
export interface PieceState { phase: PiecePhase, message?: string }

const SLOTS: readonly Slot[] = ['file', 'webm', 'poster']

export function createMediaQueue(media: () => readonly MediaForm[]) {
  const files = new Map<string, File>()
  const urls = new Map<string, string>()
  /** Sube con cada cambio de la cola: lo que lee archivos o vistas previas depende de esto. */
  const version = ref(0)
  const states = ref<Record<string, PieceState>>({})
  const running = ref(false)
  /** Mientras se guarda la obra, el formulario pasa un momento sin las piezas: no se poda nada. */
  let held = false
  let counter = 0

  const id = (key: string, slot: Slot) => `${key}:${slot}`

  function newKey(): string {
    counter += 1
    return `p${Date.now().toString(36)}${counter}`
  }

  function revoke(name: string): void {
    const url = urls.get(name)
    if (url) URL.revokeObjectURL(url)
    urls.delete(name)
  }

  function put(key: string, slot: Slot, file: File): void {
    revoke(id(key, slot))
    files.set(id(key, slot), file)
    version.value++
  }

  function take(key: string, slot: Slot): void {
    revoke(id(key, slot))
    files.delete(id(key, slot))
    version.value++
  }

  function get(key: string, slot: Slot): File | null {
    void version.value
    return files.get(id(key, slot)) ?? null
  }

  /** La vista previa del archivo en cola (blob:), o null. */
  function preview(key: string, slot: Slot): string | null {
    void version.value
    const name = id(key, slot)
    const file = files.get(name)
    if (!file) return null
    let url = urls.get(name)
    if (!url) {
      url = URL.createObjectURL(file)
      urls.set(name, url)
    }
    return url
  }

  /** Suelta los archivos que el formulario ya no nombra (Descartar, pieza quitada, ya subidos). */
  function prune(list: readonly MediaForm[]): void {
    if (held) return
    const wanted = new Set(list.flatMap(m => SLOTS.filter(s => m.upload[s] !== null).map(s => id(m.key, s))))
    let changed = false
    for (const name of [...files.keys()]) {
      if (wanted.has(name)) continue
      revoke(name)
      files.delete(name)
      changed = true
    }
    if (changed) version.value++
  }

  /**
   * Un formulario que nombra archivos que la cola no tiene (un borrador de otra visita): se quitan las
   * piezas nuevas y los nombres sueltos. Devuelve si cambió algo.
   */
  function reconcile(list: MediaForm[]): boolean {
    if (held) return false
    let changed = false
    for (let i = list.length - 1; i >= 0; i--) {
      const m = list[i]!
      for (const slot of SLOTS) {
        if (m.upload[slot] === null || files.has(id(m.key, slot))) continue
        m.upload[slot] = null
        changed = true
      }
      if (m.id === null && m.upload.file === null) {
        list.splice(i, 1)
        changed = true
      }
    }
    return changed
  }

  /** Cuántas piezas tienen algo por subir. */
  const pending = computed(() => media().filter(m => m.upload.file !== null || m.upload.webm !== null || m.upload.poster !== null).length)

  function setState(key: string, state: PieceState): void {
    states.value = { ...states.value, [key]: state }
  }

  function begin(keys: readonly string[]): void {
    states.value = Object.fromEntries(keys.map(k => [k, { phase: 'waiting' as const }]))
    running.value = true
  }

  function end(): void {
    running.value = false
    held = false
    // Lo que salió bien ya no muestra su estado; lo que falló lo conserva hasta el próximo intento.
    states.value = Object.fromEntries(Object.entries(states.value).filter(([, s]) => s.phase === 'error'))
  }

  const progress = computed(() => {
    const all = Object.values(states.value)
    return { done: all.filter(s => s.phase === 'done' || s.phase === 'error').length, total: all.length }
  })

  function hold(on: boolean): void {
    held = on
  }

  function dispose(): void {
    for (const name of [...urls.keys()]) revoke(name)
  }

  return { version, states, running: running as Readonly<Ref<boolean>>, pending, progress, newKey, put, take, get, preview, prune, reconcile, setState, begin, end, hold, dispose }
}

export type MediaQueue = ReturnType<typeof createMediaQueue>

export const mediaQueueKey: InjectionKey<MediaQueue> = Symbol('media-queue')

export function useMediaQueue(): MediaQueue {
  const queue = inject(mediaQueueKey, null)
  if (!queue) throw new Error('Las piezas de la obra van dentro de ProjectEditor.')
  return queue
}
