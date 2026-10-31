/**
 * GET /api/admin/status: si la base responde y en qué está Eros, para el estado de la cabecera.
 * No contacta a Eros: lee el circuito que arman los pedidos que ya se hicieron (proxy.ts).
 */
import { Router } from 'express'
import { db } from '../db.js'
import type { AdminStatus, ErosState } from '../shared/adminContracts.js'
import { getCircuitBreakerStatus } from './proxy.js'

const DB_TIMEOUT_MS = 3000

async function dbOk(): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<false>((resolve) => {
    timer = setTimeout(() => resolve(false), DB_TIMEOUT_MS)
  })
  const probe = db.$queryRaw`select 1`.then(() => true, () => false)
  try {
    return await Promise.race([probe, timeout])
  }
  finally {
    clearTimeout(timer)
  }
}

/** Circuito abierto: se espera antes de reintentar. Con fallos sin abrir: el último pedido falló. */
export function erosStatus(): AdminStatus['eros'] {
  const circuit = getCircuitBreakerStatus()
  let state: ErosState = 'ok'
  if (circuit.state === 'OPEN') state = 'cooldown'
  else if (circuit.failures > 0) state = 'down'
  return { state, retryInSec: state === 'cooldown' ? circuit.cooldownRemainingSeconds : 0 }
}

export const statusRouter = Router()

statusRouter.get('/status', async (_req, res) => {
  const ok = await dbOk()
  const status: AdminStatus = { db: { ok, checkedAt: new Date().toISOString() }, eros: erosStatus() }
  res.set('Cache-Control', 'no-store').json(status)
})
