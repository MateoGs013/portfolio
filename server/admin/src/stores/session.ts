/**
 * La sesión del admin: la clave vive en sessionStorage (api/client.ts) y se verifica con GET /status.
 *
 * - Al arrancar con una clave guardada: un 401 la borra; un 503 o la red caída no, porque eso dice
 *   que el servidor anda mal, no que la clave esté mal. El estado lo muestra la cabecera.
 * - Un 401 a mitad del trabajo abre la reautenticación (ReauthDialog) sin desmontar nada: los pedidos
 *   que lo recibieron esperan la clave nueva y se repiten una vez.
 * - «Ahora no» deja la clave como estaba y marca la sesión como vencida: no se vuelve a abrir el
 *   diálogo sola (el sondeo de estado se pausa) y la cabecera ofrece «Volver a entrar».
 */
import { readonly, ref, shallowReactive } from 'vue'
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/client'
import { messageOf, SessionError } from '../api/errors'
import { shell } from '../shell/dict'

export type SessionState = 'checking' | 'in' | 'out'

const state = ref<SessionState>(getToken() ? 'checking' : 'out')
const expired = ref(false)
let booting: Promise<SessionState> | null = null

export const session = readonly(state)
/** Se canceló la reautenticación: hay sesión en pantalla pero la clave no vale. */
export const sessionExpired = readonly(expired)

export type VerifyResult = { ok: true } | { ok: false, message: string, wrongKey: boolean }

/** ¿La clave guardada vale? Sin reauth: acá el 401 es la respuesta, no algo para atender. */
async function verify(): Promise<VerifyResult> {
  try {
    await api.get('/status', { reauth: false })
    return { ok: true }
  }
  catch (err) {
    if (err instanceof SessionError) return { ok: false, message: shell.login.wrong, wrongKey: true }
    return { ok: false, message: messageOf(err), wrongKey: false }
  }
}

/** Una sola verificación al arrancar, aunque varias rutas la pidan a la vez. */
export function bootSession(): Promise<SessionState> {
  if (state.value !== 'checking') return Promise.resolve(state.value)
  booting ??= verify().then((result) => {
    if (!result.ok && result.wrongKey) clearToken()
    state.value = result.ok || !result.wrongKey ? 'in' : 'out'
    return state.value
  })
  return booting
}

/**
 * Ingreso con una clave nueva. Un 401 la borra y avisa en el lugar; un 503 o la red caída la dejan
 * guardada (no se sabe si está mal) y explican qué pasa con el servidor.
 */
export async function login(key: string): Promise<VerifyResult> {
  setToken(key.trim())
  const result = await verify()
  if (!result.ok && result.wrongKey) clearToken()
  if (result.ok) {
    state.value = 'in'
    expired.value = false
  }
  return result
}

export function logout(): void {
  clearToken()
  state.value = 'out'
  settleReauth(false)
  expired.value = false
}

/* ── Reautenticación ───────────────────────────────────── */

const reauthState = shallowReactive({ open: false })
let waiting: Promise<boolean> | null = null
let resolveWaiting: ((ok: boolean) => void) | null = null

export const reauth = readonly(reauthState)

/** Lo que espera cada pedido con 401: la misma promesa para todos los que llegan juntos. */
function requestReauth(): Promise<boolean> {
  if (state.value !== 'in' || expired.value) return Promise.resolve(false)
  return openReauth()
}

function openReauth(): Promise<boolean> {
  waiting ??= new Promise<boolean>((resolve) => {
    resolveWaiting = resolve
    reauthState.open = true
  })
  return waiting
}

/** «Volver a entrar» desde la cabecera, con la sesión vencida. */
export function reopenReauth(): void {
  if (state.value !== 'in') return
  void openReauth()
}

/** true: la clave nueva vale y los pedidos se repiten. false: se cancela y fallan con su 401. */
export function settleReauth(ok: boolean): void {
  reauthState.open = false
  expired.value = !ok && state.value === 'in'
  const resolve = resolveWaiting
  waiting = null
  resolveWaiting = null
  resolve?.(ok)
}

/** La clave del diálogo: si vale, se cierra y se reintenta todo lo que esperaba. */
export async function reenter(key: string): Promise<VerifyResult> {
  const previous = getToken()
  setToken(key.trim())
  const result = await verify()
  if (result.ok) settleReauth(true)
  // Una clave equivocada no se queda guardada: «Ahora no» deja todo como estaba.
  else if (result.wrongKey) {
    if (previous) setToken(previous)
    else clearToken()
  }
  return result
}

setUnauthorizedHandler(requestReauth)
