/**
 * El límite de intentos fallidos del admin con NODE_ENV=production: las hojas con ticket (el iframe
 * del CV, la impresión, el carrusel) no llevan Bearer y salen bien, así que no cuentan; solo cuentan
 * los 401. Levanta su propia API en este proceso, sobre la copia de la base de admin-run y con Eros en
 * un puerto cerrado, porque la de admin-run corre en desarrollo (sin límite).
 *
 * admin-run: sin Eros
 *
 *   node scripts/admin-run.mjs -- pnpm tsx --test tests/admin/api-limite.test.ts
 */
import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { after, before, describe, test } from 'node:test'

const token = process.env['PW_ADMIN_TOKEN']
const database = process.env['ADMIN_DATABASE_URL']
if (!token || !database) throw new Error('Faltan PW_ADMIN_TOKEN y ADMIN_DATABASE_URL: correr con node scripts/admin-run.mjs -- …')

process.env['NODE_ENV'] = 'production'
process.env['DATABASE_URL'] = database
process.env['ADMIN_TOKEN'] = token
delete process.env['ADMIN_RATE_LIMIT_ALLOW_LOCALHOST']
await import('../../scripts/eros-offline.js')
const { app } = await import('../../server/src/app.js')

let base = ''
let close: () => Promise<void> = async () => undefined

before(async () => {
  const server = app.listen(0, '127.0.0.1')
  await new Promise<void>(resolve => server.once('listening', () => resolve()))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  close = () => new Promise(resolve => server.close(() => resolve()))
})

after(async () => {
  await close()
  const { db } = await import('../../server/src/db.js')
  await db.$disconnect()
})

describe('límite de intentos fallidos (producción)', () => {
  test('33 hojas del CV base con ticket responden 200: lo que sale bien no cuenta', async () => {
    const issued = await fetch(`${base}/api/admin/hunter/cv-base/ticket`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    assert.equal(issued.status, 200)
    const { ticket } = await issued.json() as { ticket: string }
    const statuses: number[] = []
    for (let i = 0; i < 33; i++) {
      const res = await fetch(`${base}/api/admin/hunter/cv-base/html?ticket=${encodeURIComponent(ticket)}&measure=1`)
      await res.arrayBuffer()
      statuses.push(res.status)
    }
    assert.deepEqual([...new Set(statuses)], [200], `las hojas respondieron ${statuses.join(', ')}`)
  })

  test('los 401 sí cuentan: al intento 31 con una clave mala responde 429', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 31; i++) {
      const res = await fetch(`${base}/api/admin/meta`, { headers: { Authorization: 'Bearer clave-que-no-es-la-buena' } })
      await res.arrayBuffer()
      statuses.push(res.status)
    }
    assert.equal(statuses.filter(s => s === 401).length, 30, statuses.join(', '))
    assert.equal(statuses.at(-1), 429)
    // Con la clave buena se sigue entrando: el límite nunca bloquea al administrador.
    const ok = await fetch(`${base}/api/admin/meta`, { headers: { Authorization: `Bearer ${token}` } })
    await ok.arrayBuffer()
    assert.equal(ok.status, 200)
  })
})
