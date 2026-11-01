/**
 * Reordenar una lista con arrastre (HTML5 drag and drop, desde un asa) y con Subir y Bajar, que son el
 * camino del teclado y del celular. Lo usan los pasos de una obra y el orden del sitio.
 */
import { ref } from 'vue'

/** Mueve el elemento de `from` a `to`, en la misma lista. */
export function moveItem<T>(list: T[], from: number, to: number): void {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return
  const [item] = list.splice(from, 1)
  list.splice(to, 0, item as T)
}

/** Una clave estable por objeto para el v-for (los pasos nuevos todavía no tienen id). */
export function keyer<T extends object>(prefix: string): (item: T) => string {
  const keys = new WeakMap<T, string>()
  let next = 0
  return (item) => {
    let key = keys.get(item)
    if (!key) {
      key = `${prefix}-${next++}`
      keys.set(item, key)
    }
    return key
  }
}

/**
 * El arrastre: `handle(i)` va en el asa (lo que se agarra) y `row(i)` en la fila (donde se suelta).
 * `over` marca la fila de destino mientras se arrastra.
 */
export function useDragSort(move: (from: number, to: number) => void, enabled: () => boolean = () => true) {
  const dragging = ref<number | null>(null)
  const over = ref<number | null>(null)

  function reset(): void {
    dragging.value = null
    over.value = null
  }

  function handle(index: number) {
    return {
      draggable: enabled(),
      onDragstart: (event: DragEvent) => {
        if (!enabled()) return event.preventDefault()
        dragging.value = index
        const transfer = event.dataTransfer
        if (!transfer) return
        transfer.effectAllowed = 'move'
        transfer.setData('text/plain', String(index))
        const rowEl = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-sort-row]')
        if (rowEl) transfer.setDragImage(rowEl, 24, 24)
      },
      onDragend: reset,
    }
  }

  function row(index: number) {
    return {
      'data-sort-row': '',
      'onDragover': (event: DragEvent) => {
        if (dragging.value === null) return
        event.preventDefault()
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
        over.value = index
      },
      'onDrop': (event: DragEvent) => {
        event.preventDefault()
        const from = dragging.value
        reset()
        if (from !== null && from !== index) move(from, index)
      },
    }
  }

  return { dragging, over, handle, row }
}
