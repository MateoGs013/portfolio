/**
 * Una sola fuente de teclas para el admin (como useHotkeys en el sitio, docs/diseno.md §7). Las
 * teclas llaman acciones: una vista registra la suya con `onShortcut` mientras está montada y gana la
 * última registrada.
 *
 * - Ctrl/⌘K abre o cierra la paleta, también desde un campo.
 * - Ctrl/⌘S guarda, también desde un campo. Nunca abre el «Guardar página» del navegador.
 * - Esc en un campo le saca el foco; los diálogos y la paleta atienden su propio Esc.
 * - «/» busca en la lista (o abre la paleta), N crea un registro y j/k recorren la lista.
 *
 * Las teclas de un carácter no actúan en un campo, con un diálogo abierto ni con modificadores, y se
 * apagan desde la paleta («Atajos de una tecla»; queda guardado en este navegador).
 */
import { getCurrentScope, onScopeDispose, readonly, ref } from 'vue'
import { hasMod } from './usePlatform'

export type ShortcutAction = 'palette' | 'save' | 'search' | 'new' | 'next' | 'prev'

/** Cómo se escribe cada atajo para Kbd y Button (`shortcut`), que arman también aria-keyshortcuts. */
export const SHORTCUT_KEYS: Readonly<Record<ShortcutAction, string>> = {
  palette: 'mod+k',
  save: 'mod+s',
  search: '/',
  new: 'n',
  next: 'j',
  prev: 'k',
}

const SINGLE_KEYS_PREF = 'adm-single-keys'
const TYPING = 'input, textarea, select, [role="combobox"], [contenteditable=""], [contenteditable="true"]'

function readPref(): boolean {
  try {
    return localStorage.getItem(SINGLE_KEYS_PREF) !== 'off'
  }
  catch {
    return true
  }
}

const singleKeys = ref(readPref())
export const singleKeysOn = readonly(singleKeys)

export function setSingleKeys(on: boolean): void {
  singleKeys.value = on
  try {
    localStorage.setItem(SINGLE_KEYS_PREF, on ? 'on' : 'off')
  }
  catch {
    // Sin almacenamiento: vale para esta pestaña.
  }
}

const handlers = new Map<ShortcutAction, Array<() => void>>()

/** La acción de un atajo mientras dure el componente que la registra. Devuelve cómo quitarla antes. */
export function onShortcut(action: ShortcutAction, handler: () => void): () => void {
  const list = handlers.get(action) ?? []
  list.push(handler)
  handlers.set(action, list)
  const remove = () => {
    const current = handlers.get(action)
    const index = current?.lastIndexOf(handler) ?? -1
    if (current && index >= 0) current.splice(index, 1)
  }
  if (getCurrentScope()) onScopeDispose(remove)
  return remove
}

function run(action: ShortcutAction): boolean {
  const list = handlers.get(action)
  const handler = list?.[list.length - 1]
  if (!handler) return false
  handler()
  return true
}

const dialogOpen = () => !!document.querySelector('dialog[open]')
const typingIn = (target: EventTarget | null) => target instanceof Element && !!target.closest(TYPING)

/** j/k sin una acción propia: el foco entra a la lista de la pantalla, en la fila elegida. */
function focusList(): boolean {
  const option = document.querySelector<HTMLElement>('#main [role="listbox"] [role="option"][tabindex="0"]')
  option?.focus()
  return !!option
}

const SINGLE: Readonly<Record<string, ShortcutAction>> = { '/': 'search', 'n': 'new', 'N': 'new', 'j': 'next', 'k': 'prev' }

function onKeydown(event: KeyboardEvent): void {
  if (event.isComposing || event.defaultPrevented) return
  const key = event.key.toLowerCase()

  if (hasMod(event) && !event.altKey && (key === 'k' || key === 's')) {
    if (key === 'k') {
      if (run('palette')) event.preventDefault()
      return
    }
    // Guardar: nunca el diálogo del navegador; con un diálogo abierto no se guarda lo de atrás.
    event.preventDefault()
    if (!dialogOpen()) run('save')
    return
  }

  if (event.key === 'Escape' && typingIn(event.target) && !dialogOpen()) {
    (event.target as HTMLElement).blur()
    return
  }

  if (!singleKeys.value || event.ctrlKey || event.metaKey || event.altKey) return
  if (typingIn(event.target) || dialogOpen()) return
  const action = SINGLE[event.key]
  if (!action) return

  let handled = run(action)
  if (!handled && action === 'search') handled = run('palette')
  if (!handled && (action === 'next' || action === 'prev')) handled = focusList()
  if (handled) event.preventDefault()
}

/** Se instala una vez, en App. */
export function installShortcuts(): () => void {
  document.addEventListener('keydown', onKeydown)
  return () => document.removeEventListener('keydown', onKeydown)
}
