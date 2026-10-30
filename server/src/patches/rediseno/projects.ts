/**
 * Obras: visibilidad, portadas y métricas.
 * - publishedAt: fecha para las seis visibles que no la tengan; NULL explícito para null-net y lampone.
 * - Portada: tint si falta, ancho/alto/peso leídos del archivo, y la portada de Eros si no hay ninguna.
 * - Métricas: verifica que cada clave del Json viejo tenga su fila Metric y completa las que falten.
 *   Una obra sin métricas de ningún tipo recibe las del seed.
 */
import { MediaKind, MediaRole, type PrismaClient } from '../../../generated/prisma/client.js'
import { imageFile } from '../../seed/files.js'
import { legacyMetricRows, metricRows } from '../../seed/metrics.js'
import { publicProjects } from '../../seed/projects.js'
import { hiddenProjects } from '../../seed/projects-hidden.js'
import { PUBLISHED_AT, type SeedProject } from '../../seed/types.js'
import { show, type Change } from './change.js'

async function coverChanges(db: PrismaClient, projectId: number, p: SeedProject): Promise<Change[]> {
  if (!p.cover) return []
  const cover = p.cover
  const covers = await db.media.findMany({
    where: { projectId, role: MediaRole.COVER, kind: MediaKind.IMAGE },
    select: { id: true, src: true, width: true, height: true, bytes: true, tint: true },
  })
  const file = await imageFile(cover.src)
  const row = covers.find(m => m.src === cover.src)

  if (!row) {
    // Si el admin ya subió otra portada, se respeta: no se crea una segunda.
    if (covers.length) return []
    return [{
      what: [`project ${p.slug}: portada nueva ${cover.src} (${file.width}x${file.height})`],
      apply: tx => tx.media.create({
        data: { ...cover, ...file, kind: MediaKind.IMAGE, role: MediaRole.COVER, order: 0, projectId },
      }),
    }]
  }

  const what: string[] = []
  const data: { tint?: string, width?: number, height?: number, bytes?: number } = {}
  if (row.tint === null && cover.tint) {
    data.tint = cover.tint
    what.push(`project ${p.slug}: cover.tint NULL → ${cover.tint}`)
  }
  if (row.width !== file.width || row.height !== file.height) {
    Object.assign(data, { width: file.width, height: file.height })
    what.push(`project ${p.slug}: cover ${row.width}x${row.height} → ${file.width}x${file.height}`)
  }
  if (row.bytes === null) {
    data.bytes = file.bytes
    what.push(`project ${p.slug}: cover.bytes NULL → ${file.bytes}`)
  }
  return what.length ? [{ what, apply: tx => tx.media.update({ where: { id: row.id }, data }) }] : []
}

async function metricChanges(db: PrismaClient, projectId: number, p: SeedProject, legacy: unknown): Promise<Change[]> {
  const rows = await db.metric.findMany({ where: { projectId }, select: { key: true, order: true } })
  const legacyRows = legacyMetricRows(legacy)
  const source = legacyRows.length ? legacyRows : rows.length ? [] : metricRows(p.metrics)
  const have = new Set(rows.map(r => r.key))
  const next = rows.reduce((max, r) => Math.max(max, r.order + 1), 0)
  const missing = source.filter(r => !have.has(r.key)).map((r, i) => ({ ...r, order: next + i }))
  if (!missing.length) return []
  const origin = legacyRows.length ? 'del Json viejo' : 'del seed'
  return [{
    what: [`project ${p.slug}: metrics + ${missing.map(r => r.key).join(', ')} (${origin})`],
    apply: tx => tx.metric.createMany({ data: missing.map(r => ({ ...r, projectId })) }),
  }]
}

export async function projectChanges(db: PrismaClient): Promise<{ changes: Change[], warnings: string[] }> {
  const changes: Change[] = []
  const warnings: string[] = []

  for (const p of [...publicProjects, ...hiddenProjects]) {
    const row = await db.project.findUnique({ where: { slug: p.slug }, select: { id: true, publishedAt: true, legacyMetrics: true } })
    if (!row) {
      warnings.push(`project ${p.slug}: no existe en esta base, no se toca`)
      continue
    }

    if (p.published && row.publishedAt === null) {
      changes.push({
        what: [`project ${p.slug}: publishedAt NULL → ${show(PUBLISHED_AT)}`],
        apply: tx => tx.project.update({ where: { id: row.id }, data: { publishedAt: PUBLISHED_AT } }),
      })
    }
    if (!p.published && row.publishedAt !== null) {
      changes.push({
        what: [`project ${p.slug}: publishedAt ${show(row.publishedAt)} → NULL (oculta)`],
        apply: tx => tx.project.update({ where: { id: row.id }, data: { publishedAt: null } }),
      })
    }

    changes.push(...await coverChanges(db, row.id, p))
    changes.push(...await metricChanges(db, row.id, p, row.legacyMetrics))
  }

  return { changes, warnings }
}
