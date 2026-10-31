/**
 * Obras: visibilidad, portadas y métricas.
 * - publishedAt: fecha para las seis visibles que no la tengan; NULL explícito para null-net y lampone.
 * - Portada: tint si falta, ancho/alto/peso leídos del archivo, y la portada de Eros si no hay ninguna.
 * - Métricas: verifica que cada clave del Json viejo tenga su fila Metric y completa las que falten.
 *   Una obra sin métricas de ningún tipo recibe las del seed.
 * - Textos viejos conocidos: el rol de Ynara sin la cifra de commits (vive en su Metric), el rótulo
 *   en español del enlace de Eros y el canonicalUrl de los artículos que apuntaba al alias /blog/.
 *   Solo se reemplazan si siguen con el valor viejo exacto: lo editado en el admin se respeta.
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

/** Rol viejo conocido de cada obra → el del seed. */
const LEGACY_ROLES: Record<string, string[]> = {
  ynara: ['Tesis Da Vinci 2026 · contribuidor principal, 382 commits'],
}

/** Rótulos viejos conocidos de un enlace, por url → el del seed. */
const LEGACY_LINK_LABELS: Record<string, string[]> = {
  'https://eros.mateogs.tech': ['control center'],
}

/** canonicalUrl de main: un alias que solo redirige. El canónico del artículo es su propia URL. */
const LEGACY_CANONICAL = /^https:\/\/mateogs\.tech\/blog\//

async function textChanges(db: PrismaClient, projectId: number, p: SeedProject): Promise<Change[]> {
  const changes: Change[] = []
  const row = await db.project.findUnique({ where: { id: projectId }, select: { role: true, links: { select: { id: true, label: true, url: true } } } })
  if (!row) return changes
  if (LEGACY_ROLES[p.slug]?.includes(row.role) && row.role !== p.role) {
    changes.push({
      what: [`project ${p.slug}: role ${show(row.role)} → ${show(p.role)}`],
      apply: tx => tx.project.update({ where: { id: projectId }, data: { role: p.role } }),
    })
  }
  for (const link of row.links) {
    const next = p.links.find(l => l.url === link.url)
    if (!next || next.label === link.label || !LEGACY_LINK_LABELS[link.url]?.includes(link.label)) continue
    changes.push({
      what: [`project ${p.slug}: link ${link.url} label ${show(link.label)} → ${show(next.label)}`],
      apply: tx => tx.link.update({ where: { id: link.id }, data: { label: next.label } }),
    })
  }
  return changes
}

/** Artículos: canonicalUrl NULL si todavía apunta al alias viejo /blog/<slug>. */
export async function articleChanges(db: PrismaClient): Promise<Change[]> {
  const rows = await db.article.findMany({ where: { canonicalUrl: { not: null } }, select: { id: true, slug: true, canonicalUrl: true } })
  return rows
    .filter(a => a.canonicalUrl !== null && LEGACY_CANONICAL.test(a.canonicalUrl) && a.canonicalUrl.endsWith(`/blog/${a.slug}`))
    .map(a => ({
      what: [`article ${a.slug}: canonicalUrl ${show(a.canonicalUrl)} → NULL`],
      apply: tx => tx.article.update({ where: { id: a.id }, data: { canonicalUrl: null } }),
    }))
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
    changes.push(...await textChanges(db, row.id, p))
    changes.push(...await metricChanges(db, row.id, p, row.legacyMetrics))
  }

  return { changes, warnings }
}
