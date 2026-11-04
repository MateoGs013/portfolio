/**
 * Errores del cliente de la API, clasificados para que cada vista sepa qué hacer:
 * reingresar (SessionError), esperar y reintentar (ServiceError, NetworkError), marcar campos
 * (FieldErrors) o mostrar el motivo (RequestError). Cada uno trae su mensaje en español claro.
 */

/** Un problema en un campo, con la ruta del dato tal como la manda el servidor (`steps[2].title`). */
export interface FieldIssue {
  path: string
  message: string
}

/** Qué servicio no respondió: la base, Eros o el admin entero (sin clave configurada). */
export type ServiceName = 'db' | 'eros' | 'admin'

/**
 * Códigos que manda el servidor y su explicación para quien edita. El contrato nuevo los manda en
 * `code` (con el texto en español en `error`); las rutas viejas, directamente en `error`.
 */
const CODES: Record<string, string> = {
  db_unavailable: 'La base de datos no responde. Lo que escribiste sigue acá; probá de nuevo en un momento.',
  offline: 'Eros no responde ahora. Lo que se arma desde la base sigue funcionando.',
  eros_auth: 'Eros rechazó la clave de la API: hay que revisar EROS_API_KEY en el servidor. Lo que se arma desde la base sigue funcionando.',
  eros_unreachable: 'Eros no respondió a tiempo. Lo que se arma desde la base sigue funcionando; probá de nuevo en un momento.',
  'not found': 'No encontramos ese registro. Puede que lo hayan borrado.',
  not_found: 'No encontramos ese registro. Puede que lo hayan borrado.',
  internal: 'Algo falló en el servidor. Probá de nuevo; si sigue, avisá con lo que estabas haciendo.',
  unauthorized: 'La sesión venció. Volvé a ingresar la clave para seguir.',
}

/** Mensaje por código HTTP cuando el servidor no explica nada. */
const BY_STATUS: Record<number, string> = {
  400: 'Hay datos que revisar antes de guardar.',
  401: CODES['unauthorized']!,
  403: 'Esta acción no está permitida con la clave actual.',
  404: CODES['not found']!,
  409: 'Alguien cambió este registro mientras lo editabas. Recargalo y volvé a guardar.',
  413: 'El archivo es demasiado pesado para subirlo.',
  429: 'Hubo demasiados intentos seguidos. Esperá unos minutos y volvé a probar.',
  500: CODES['internal']!,
  502: 'El servidor no pudo hablar con otro servicio. Probá de nuevo en un momento.',
  503: 'El servicio no está disponible ahora. Probá de nuevo en un momento.',
  504: 'El servidor tardó demasiado en responder. Probá de nuevo en un momento.',
}

/** Primera letra en mayúscula y punto final: los mensajes del servidor llegan en minúscula de frase. */
function sentence(text: string): string {
  const t = text.trim()
  if (!t) return t
  const first = t.charAt(0).toLocaleUpperCase('es')
  return first + t.slice(1) + (/[.!?]$/.test(t) ? '' : '.')
}

/** Un código de máquina (`in_use`, `conflict`) no se muestra tal cual: no es una frase. */
const MACHINE_CODE = /^[a-z]+(?:_[a-z]+)*$/

/** El mensaje para mostrar: el código conocido, el texto del servidor o el del código HTTP. */
export function explain(status: number, code?: string | null, text?: string | null): string {
  if (code && CODES[code]) return CODES[code]
  if (text) return sentence(text)
  if (code && !MACHINE_CODE.test(code)) return sentence(code)
  return BY_STATUS[status] ?? `El servidor respondió con un error (${status}).`
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string | null

  constructor(status: number, code: string | null, message: string = explain(status, code)) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/** 401: la clave no vale o venció. La vista no se desmonta: se pide reingresar y se reintenta. */
export class SessionError extends ApiError {
  constructor(code: string | null = null) {
    super(401, code, CODES['unauthorized'])
    this.name = 'SessionError'
  }
}

/** 503: la base (db_unavailable), Eros (offline) o el admin sin configurar. Lo escrito no se pierde. */
export class ServiceError extends ApiError {
  readonly service: ServiceName

  constructor(service: ServiceName, code: string | null) {
    super(503, code, service === 'db' ? CODES['db_unavailable'] : service === 'eros' ? CODES['offline'] : explain(503, code))
    this.name = 'ServiceError'
    this.service = service
  }
}

/** Sin respuesta: sin conexión, el servidor apagado o el tiempo de espera agotado. */
export class NetworkError extends ApiError {
  readonly timedOut: boolean

  constructor(timedOut: boolean) {
    super(0, null, timedOut
      ? 'El servidor tardó demasiado en responder. Lo que escribiste sigue acá; probá de nuevo.'
      : 'No hay conexión con el servidor. Revisá la red; lo que escribiste sigue acá.')
    this.name = 'NetworkError'
    this.timedOut = timedOut
  }
}

/** 400 con `errors: [{ path, message }]`: todos los campos a corregir juntos. */
export class FieldErrors extends ApiError {
  readonly issues: FieldIssue[]

  constructor(code: string | null, issues: FieldIssue[], text: string | null = null) {
    const count = issues.length
    super(400, code, count > 1 ? `Hay ${count} campos para revisar antes de guardar.` : (issues[0]?.message ?? explain(400, code, text)))
    this.name = 'FieldErrors'
    this.issues = issues
  }
}

/** Cualquier otra respuesta con error (404, 409, 413, 500…), con el motivo del servidor. */
export class RequestError extends ApiError {
  constructor(status: number, code: string | null, text: string | null = null) {
    super(status, code, explain(status, code, text))
    this.name = 'RequestError'
  }
}

/** Abortado a propósito (la vista se cerró): no es un error para mostrar. */
export function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

/** Mensaje para cualquier error, también los que no salieron del cliente. */
export function messageOf(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return 'Algo salió mal. Probá de nuevo; si sigue, recargá la página.'
}

function isIssue(value: unknown): value is FieldIssue {
  return !!value && typeof value === 'object'
    && typeof (value as FieldIssue).path === 'string'
    && typeof (value as FieldIssue).message === 'string'
}

/** Convierte una respuesta con error en la clase que le corresponde. */
export function fromResponse(status: number, body: unknown, eros: boolean): ApiError {
  const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const error = typeof payload['error'] === 'string' ? payload['error'] : null
  const machine = typeof payload['code'] === 'string' ? payload['code'] : null
  // Contrato nuevo: código en `code` y texto en `error`. Contrato viejo: todo en `error`.
  const code = machine ?? error
  const text = machine ? error : null
  if (status === 401) return new SessionError(code)
  // La API no pudo imprimir el PDF del CV: no es una caída de Eros ni de la base, el texto lo dice.
  if (code === 'pdf_unavailable') return new RequestError(status, code, text)
  if (status === 503) {
    const service: ServiceName = code === 'db_unavailable' ? 'db' : eros ? 'eros' : 'admin'
    return new ServiceError(service, code)
  }
  if (eros && code === 'eros_auth') return new RequestError(status, 'eros_auth')
  // Eros respondió con un error (5xx) o una tarea larga sigue en Eros: el texto del servidor lo dice.
  // Un envío cortado (send_outcome_unknown) también: la etapa Postular ofrece «Ya salió» o reintentar.
  if (eros && (code === 'eros_error' || code === 'eros_busy' || code === 'send_outcome_unknown')) return new RequestError(status, code, text)
  // El resto de los 502/504 del proxy traen la URL interna o jerga del agente: no se muestran.
  if (eros && (status === 502 || status === 504)) return new RequestError(status, 'eros_unreachable')
  const issues = Array.isArray(payload['errors']) ? payload['errors'].filter(isIssue) : []
  if (status === 400 && issues.length) return new FieldErrors(code, issues, text)
  return new RequestError(status, code, text)
}
