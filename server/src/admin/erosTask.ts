/**
 * Las tareas largas de Eros (escanear, evaluar en lote). El Eros de antes las corría dentro del pedido
 * y respondía 200 con el resultado; el de ahora responde 202 `{ task_id }` y el resultado se consulta
 * en GET /api/tasks/{task_id} (`status: running | done | failed`, con `result` o `error`). `awaitErosTask`
 * acepta las dos: con un 202 consulta la tarea cada 2 s hasta que termina o se acaba el tiempo, y
 * devuelve lo mismo que habría devuelto el Eros de antes.
 */
import type { AdminErrorBody } from '../shared/adminContracts.js'
import { forwardToEros, type ForwardResult } from './proxy.js'

type Obj = Record<string, unknown>

const isObj = (value: unknown): value is Obj => typeof value === 'object' && value !== null && !Array.isArray(value)

const POLL_MS = 2000
const POLL_TIMEOUT_MS = 10_000

/** El id de la tarea de un 202 de Eros; null si Eros respondió el resultado directamente. */
export function erosTaskId(result: ForwardResult): string | null {
  const id = isObj(result.data) ? result.data['task_id'] : null
  return typeof id === 'string' && /^[A-Za-z0-9_-]+$/.test(id) ? id : null
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function failure(message: string, upstream: number): ForwardResult {
  const body: AdminErrorBody & { offline: false } = { error: message, code: 'eros_error', errors: [], offline: false }
  return { ok: false, status: 502, data: body, failure: { reason: 'server', upstream, message } }
}

function stillWorking(seconds: number): ForwardResult {
  const message = `Eros sigue trabajando: no terminó en ${seconds} s.`
  const body: AdminErrorBody & { offline: false } = { error: message, code: 'eros_busy', errors: [], offline: false }
  return { ok: false, status: 504, data: body, failure: { reason: 'busy', upstream: 0, message } }
}

/**
 * El resultado de una tarea larga. `started` es cuándo se pidió y `budgetMs` cuánto se puede esperar en
 * total: pasado ese tiempo responde `eros_busy` (la tarea puede seguir en Eros). Una consulta que no
 * llega a Eros corta la espera con ese fallo.
 */
export async function awaitErosTask(result: ForwardResult, started: number, budgetMs: number): Promise<ForwardResult> {
  const id = result.ok ? erosTaskId(result) : null
  if (!id) return result
  for (;;) {
    const left = budgetMs - (Date.now() - started)
    if (left <= POLL_MS) return stillWorking(Math.round(budgetMs / 1000))
    await wait(POLL_MS)
    const poll = await forwardToEros(`api/tasks/${id}`, { method: 'GET' }, Math.min(POLL_TIMEOUT_MS, left - POLL_MS))
    if (!poll.ok) {
      if (poll.failure?.upstream === 404) return failure('Eros se reinició y perdió la tarea: no se sabe si terminó. Recargá la cola.', 404)
      return poll
    }
    const task = isObj(poll.data) ? poll.data : {}
    if (task['status'] === 'done') return { ok: true, status: 200, data: task['result'] ?? {}, failure: null }
    if (task['status'] === 'failed') {
      const why = typeof task['error'] === 'string' ? task['error'].replace(/\s+/g, ' ').trim().slice(0, 200) : ''
      return failure(why ? `La tarea falló en Eros: «${why}».` : 'La tarea falló en Eros.', 500)
    }
  }
}
