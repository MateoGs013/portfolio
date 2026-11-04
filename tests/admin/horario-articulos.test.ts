/**
 * Cuándo toca el artículo de los lunes (server/src/admin/articleSlots.ts): funciones puras, sin base
 * ni Eros. Corre una vez, sin flags:
 *
 *   node scripts/admin-run.mjs -- pnpm tsx --test tests/admin/horario-articulos.test.ts
 *
 * El lunes 9:00 de Buenos Aires es siempre las 12:00 UTC: Argentina no tiene horario de verano.
 */
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { lastWeeklySlot, nextWeeklySlot, weeklyEnabled } from '../../server/src/admin/articleSlots.js'

const iso = (d: Date) => d.toISOString()
const at = (value: string) => new Date(value)

describe('el lunes a las 9:00 de Buenos Aires', () => {
  test('el borde: 8:59 todavía es la semana pasada; 9:00 ya es esta', () => {
    // 2 de noviembre de 2026 es lunes.
    assert.equal(iso(lastWeeklySlot(at('2026-11-02T08:59:59-03:00'))), '2026-10-26T12:00:00.000Z')
    assert.equal(iso(nextWeeklySlot(at('2026-11-02T08:59:59-03:00'))), '2026-11-02T12:00:00.000Z')
    assert.equal(iso(lastWeeklySlot(at('2026-11-02T09:00:00-03:00'))), '2026-11-02T12:00:00.000Z')
    assert.equal(iso(nextWeeklySlot(at('2026-11-02T09:00:00-03:00'))), '2026-11-09T12:00:00.000Z')
  })

  test('se cuenta en la hora de Buenos Aires, no en UTC', () => {
    // Lunes 02:00 UTC es domingo 23:00 en Buenos Aires: todavía no es lunes allá.
    assert.equal(iso(lastWeeklySlot(at('2026-11-02T02:00:00Z'))), '2026-10-26T12:00:00.000Z')
    // Martes 02:30 UTC es lunes 23:30 en Buenos Aires: el de hoy ya pasó.
    assert.equal(iso(lastWeeklySlot(at('2026-11-03T02:30:00Z'))), '2026-11-02T12:00:00.000Z')
    // Domingo 23:59 en Buenos Aires: sigue siendo el del lunes anterior.
    assert.equal(iso(lastWeeklySlot(at('2026-11-08T23:59:00-03:00'))), '2026-11-02T12:00:00.000Z')
    assert.equal(iso(nextWeeklySlot(at('2026-11-08T23:59:00-03:00'))), '2026-11-09T12:00:00.000Z')
  })

  test('sin horario de verano: en enero y en julio es la misma hora UTC', () => {
    assert.equal(iso(lastWeeklySlot(at('2027-01-04T10:00:00-03:00'))), '2027-01-04T12:00:00.000Z')
    assert.equal(iso(lastWeeklySlot(at('2026-07-06T10:00:00-03:00'))), '2026-07-06T12:00:00.000Z')
  })

  test('cruza meses y años', () => {
    assert.equal(iso(lastWeeklySlot(at('2027-01-01T12:00:00Z'))), '2026-12-28T12:00:00.000Z')
    assert.equal(iso(nextWeeklySlot(at('2026-12-31T20:00:00Z'))), '2027-01-04T12:00:00.000Z')
  })

  test('el último nunca es futuro y el próximo es siempre una semana después', () => {
    for (let h = 0; h < 24 * 14; h += 7) {
      const now = new Date(Date.UTC(2026, 10, 1) + h * 3600_000)
      const last = lastWeeklySlot(now)
      assert.ok(last.getTime() <= now.getTime())
      assert.ok(now.getTime() - last.getTime() < 7 * 24 * 3600_000)
      assert.equal(nextWeeklySlot(now).getTime() - last.getTime(), 7 * 24 * 3600_000)
      assert.equal(last.getUTCDay(), 1)
      assert.equal(last.getUTCHours(), 12)
    }
  })
})

describe('si el horario está encendido', () => {
  test('solo en producción con Eros, salvo ARTICLES_WEEKLY', () => {
    assert.equal(weeklyEnabled({ NODE_ENV: 'production', HUNTER_API_URL: 'http://eros:8000' }), true)
    assert.equal(weeklyEnabled({ NODE_ENV: 'production', HUNTER_API_URL: ' ' }), false)
    assert.equal(weeklyEnabled({ HUNTER_API_URL: 'http://eros:8000' }), false)
    assert.equal(weeklyEnabled({ NODE_ENV: 'production', HUNTER_API_URL: 'http://eros:8000', ARTICLES_WEEKLY: 'off' }), false)
    assert.equal(weeklyEnabled({ ARTICLES_WEEKLY: 'on' }), true)
    assert.equal(weeklyEnabled({ ARTICLES_WEEKLY: ' ON ' }), true)
  })
})
