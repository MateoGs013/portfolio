/**
 * GET /api/admin/status: si la base responde y en qué está Eros, para el estado de la cabecera.
 * No contacta a Eros: lee el corte que arman los pedidos que ya se hicieron (proxy.ts), y sin
 * HUNTER_API_URL dice «unconfigured».
 */
import { Router } from 'express'
import { db } from '../db.js'
import type { AdminStatus } from '../shared/adminContracts.js'
import { erosSendEnabled } from './hunterApply.js'
import { erosState } from './proxy.js'

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

export const statusRouter = Router()

statusRouter.get('/status', async (_req, res) => {
  const ok = await dbOk()
  const status: AdminStatus = { db: { ok, checkedAt: new Date().toISOString() }, eros: erosState(), erosSend: erosSendEnabled() }
  res.set('Cache-Control', 'no-store').json(status)
})
