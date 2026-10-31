/**
 * Plataforma para los atajos: en Mac la tecla de comando es ⌘ y en el resto Ctrl. Se calcula una vez;
 * esto solo decide cómo se escriben y qué modificador cuenta.
 */
interface NavigatorWithData extends Navigator {
  userAgentData?: { platform?: string }
}

function detectMac(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as NavigatorWithData
  const platform = nav.userAgentData?.platform || nav.platform || ''
  return /mac|iphone|ipad|ipod/i.test(platform)
}

const isMac = detectMac()

export interface Platform {
  isMac: boolean
  /** Cómo se escribe la tecla modificadora: «⌘» o «Ctrl». */
  modLabel: string
  /** Para aria-keyshortcuts: «Meta» o «Control». */
  modAria: string
}

export function usePlatform(): Platform {
  return { isMac, modLabel: isMac ? '⌘' : 'Ctrl', modAria: isMac ? 'Meta' : 'Control' }
}

/** ¿El evento trae la tecla modificadora de la plataforma (⌘ en Mac, Ctrl en el resto)? */
export function hasMod(event: KeyboardEvent | MouseEvent): boolean {
  return isMac ? event.metaKey : event.ctrlKey
}
