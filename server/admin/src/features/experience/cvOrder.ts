/**
 * El orden de la experiencia del CV (PATCH /api/admin/experience/order): las entradas de `ids` quedan
 * 1..n en ese orden y el resto sale del CV. Devuelve la trayectoria entera ya ordenada en la base, y
 * se la deja a la copia de la lista sin esperar a la próxima lectura.
 */
import type { ExperienceOrderBody } from '@shared/adminContracts'
import { api } from '../../api/client'
import { rememberRecord } from '../../composables/useCollection'
import { experienceModel } from './model'
import { cvEntries, type Experience } from './record'

export async function saveCvOrder(ids: readonly number[]): Promise<Experience[]> {
  const body: ExperienceOrderBody = { ids: [...ids] }
  const rows = await api.patch<Experience[]>('/experience/order', body)
  for (const row of rows) rememberRecord(experienceModel.path, row)
  return rows
}

/**
 * Suma una entrada al final del CV; devuelve la trayectoria y el puesto en que quedó. El PATCH saca del
 * CV todo lo que no nombra, así que el orden sale de una lectura fresca y nunca de la copia en memoria
 * (que puede no haber llegado, haber fallado o estar vieja si otra pestaña reordenó).
 */
export async function addToCv(id: number): Promise<{ rows: Experience[], place: number }> {
  const rows = await api.get<Experience[]>(experienceModel.path)
  const ids = [...cvEntries(rows).map(e => e.id).filter(other => other !== id), id]
  return { rows: await saveCvOrder(ids), place: ids.length }
}
