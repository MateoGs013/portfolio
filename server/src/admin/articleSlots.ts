/**
 * Cuándo toca el artículo de los lunes (articleSchedule.ts), en funciones puras para poder probarlas
 * sin base ni reloj: el lunes a las 9:00 de Buenos Aires que ya pasó, el próximo, y si el horario está
 * encendido según el entorno.
 */

/** Argentina no tiene horario de verano desde 2009: siempre UTC−3. */
const ART_OFFSET_MS = -3 * 3600_000
const WEEK_MS = 7 * 24 * 3600_000
const SLOT_HOUR = 9

/** El lunes a las 9:00 (hora de Buenos Aires) más reciente que ya llegó: `now` o antes. */
export function lastWeeklySlot(now: Date): Date {
  const local = new Date(now.getTime() + ART_OFFSET_MS)
  const sinceMonday = (local.getUTCDay() + 6) % 7
  const slotLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - sinceMonday, SLOT_HOUR)
  const slot = slotLocal - ART_OFFSET_MS
  return new Date(slot > now.getTime() ? slot - WEEK_MS : slot)
}

/** El próximo lunes a las 9:00 de Buenos Aires, estrictamente después de `now`. */
export function nextWeeklySlot(now: Date): Date {
  return new Date(lastWeeklySlot(now).getTime() + WEEK_MS)
}

/**
 * Si el horario está encendido: ARTICLES_WEEKLY=off lo apaga, =on lo enciende y, sin valor, solo en
 * producción (NODE_ENV=production) con HUNTER_API_URL.
 */
export function weeklyEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const flag = (env['ARTICLES_WEEKLY'] ?? '').trim().toLowerCase()
  if (flag === 'off') return false
  if (flag === 'on') return true
  return env['NODE_ENV'] === 'production' && !!(env['HUNTER_API_URL'] ?? '').trim()
}
