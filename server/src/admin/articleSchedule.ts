/**
 * El artículo de los lunes: cada lunes a las 9:00 de Buenos Aires la API le pide uno a Eros y lo
 * publica sola (articleAuto.ts). El horario vive en la API y no en n8n: así n8n no necesita claves
 * del portfolio (docs/decisiones.md, 2026-11-04).
 *
 * Un temporizador mira cada 10 minutos si ya pasó el lunes 9:00 de esta semana y si desde entonces
 * hubo un pedido semanal; si no lo hubo, lo pide. Si la API estuvo apagada el lunes, lo pide al
 * volver; si había otro pedido escribiendo, prueba en la vuelta siguiente. Un pedido semanal fallido
 * cuenta como el de esa semana: no se reintenta solo (se puede pedir uno desde Artículos).
 *
 * Encendido solo en producción con Eros configurado. ARTICLES_WEEKLY=off lo apaga y =on lo enciende
 * en cualquier entorno (scripts/admin-run.mjs lo apaga siempre).
 */
import { startArticleRun, weeklyRunSince } from './articleAuto.js'
import { lastWeeklySlot, nextWeeklySlot, weeklyEnabled } from './articleSlots.js'

const TICK_MS = 10 * 60_000
const FIRST_TICK_MS = 60_000

/** Una vuelta: pide el artículo de esta semana si ya es la hora y todavía no se pidió. */
export async function weeklyTick(now = new Date()): Promise<void> {
  try {
    const slot = lastWeeklySlot(now)
    if (await weeklyRunSince(slot)) return
    const result = await startArticleRun({ trigger: 'weekly' })
    if (result.kind === 'busy') console.warn('[articulos] el de los lunes espera: hay otro pedido escribiendo')
  }
  catch (err) {
    console.error('[articulos] la vuelta del horario semanal falló', err)
  }
}

let timer: NodeJS.Timeout | null = null

/** Arranca el horario si está encendido. Lo llama server/src/index.ts, nunca las pruebas. */
export function startWeeklyArticles(): void {
  if (timer || !weeklyEnabled()) return
  console.log(`[articulos] publicación semanal encendida: próximo ${nextWeeklySlot(new Date()).toISOString()}`)
  setTimeout(() => void weeklyTick(), FIRST_TICK_MS).unref()
  timer = setInterval(() => void weeklyTick(), TICK_MS)
  timer.unref()
}
