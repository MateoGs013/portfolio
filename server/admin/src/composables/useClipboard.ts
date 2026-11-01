/**
 * Copiar al portapapeles sin promesas sueltas: la API moderna si el navegador la deja usar y, si no
 * (http sin permiso, foco fuera de la pestaña), un textarea con execCommand. Devuelve ok o error.
 */
import { ref } from 'vue'
import { activeLayerRoot } from '../ui/topLayer'

export type CopyResult = 'ok' | 'error'

function legacyCopy(text: string): boolean {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.setAttribute('aria-hidden', 'true')
  area.className = 'fixed top-0 -left-full opacity-0'
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
  // Con un diálogo modal abierto el body es inerte y select() no anda: va adentro del diálogo.
  activeLayerRoot().append(area)
  area.select()
  let ok: boolean
  try {
    ok = document.execCommand('copy')
  }
  catch {
    ok = false
  }
  area.remove()
  active?.focus()
  return ok
}

export async function copyText(text: string): Promise<CopyResult> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return 'ok'
    }
  }
  catch {
    // Sin permiso: se prueba el camino viejo.
  }
  return legacyCopy(text) ? 'ok' : 'error'
}

/** `copied` queda en true dos segundos después de copiar, para cambiar el rótulo del botón. */
export function useClipboard() {
  const copied = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  async function copy(text: string): Promise<CopyResult> {
    const result = await copyText(text)
    clearTimeout(timer)
    copied.value = result === 'ok'
    if (copied.value) timer = setTimeout(() => (copied.value = false), 2000)
    return result
  }
  return { copy, copied }
}
