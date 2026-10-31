/**
 * Aplica el inglés (seed/en.ts) y las capturas (seed/media.ts) sobre una base ya cargada.
 * Todo es upsert: sirve para el seed y para los parches que completan una base existente.
 */
import { Locale, type Prisma } from '../../generated/prisma/client.js'
import type { DocField, DocFieldValue } from '../../../app/lib/fieldMeta.js'
import type { EnSeed } from './en.js'
import type { CaptureSeed } from './media.js'

type Tx = Prisma.TransactionClient

/** Copia el inglés de cada campo a su `en`. Los campos sin traducción quedan como estaban. */
export function withEnglish(fields: readonly DocField[], en: Record<string, DocFieldValue>): DocField[] {
  return fields.map(f => (Object.hasOwn(en, f.name) ? { ...f, en: en[f.name] } : { ...f }))
}

async function applyProjects(tx: Tx, projects: EnSeed['projects']) {
  for (const [slug, { steps, links, ...fields }] of Object.entries(projects)) {
    const project = await tx.project.findUnique({
      where: { slug },
      select: { id: true, steps: { select: { id: true, order: true } }, links: { select: { id: true, url: true } } },
    })
    if (!project) throw new Error(`en.ts: no existe la obra ${slug}`)
    const projectId = project.id
    await tx.projectTranslation.upsert({
      where: { projectId_locale: { projectId, locale: Locale.en } },
      create: { projectId, locale: Locale.en, ...fields },
      update: fields,
    })
    for (const [order, step] of Object.entries(steps ?? {})) {
      const row = project.steps.find(s => s.order === Number(order))
      if (!row) throw new Error(`en.ts: ${slug} no tiene el paso ${order}`)
      await tx.processStepTranslation.upsert({
        where: { stepId_locale: { stepId: row.id, locale: Locale.en } },
        create: { stepId: row.id, locale: Locale.en, ...step },
        update: step,
      })
    }
    for (const [url, label] of Object.entries(links ?? {})) {
      const row = project.links.find(l => l.url === url)
      if (!row) throw new Error(`en.ts: ${slug} no tiene el enlace ${url}`)
      await tx.linkTranslation.upsert({
        where: { linkId_locale: { linkId: row.id, locale: Locale.en } },
        create: { linkId: row.id, locale: Locale.en, label },
        update: { label },
      })
    }
  }
}

/** Upsert de todas las *Translation en inglés. */
export async function applyEnglish(tx: Tx, en: EnSeed): Promise<void> {
  await applyProjects(tx, en.projects)

  for (const [slug, fields] of Object.entries(en.experience)) {
    const row = await tx.experience.findUnique({ where: { slug }, select: { id: true } })
    if (!row) throw new Error(`en.ts: no existe la experiencia ${slug}`)
    await tx.experienceTranslation.upsert({
      where: { experienceId_locale: { experienceId: row.id, locale: Locale.en } },
      create: { experienceId: row.id, locale: Locale.en, ...fields },
      update: fields,
    })
  }

  for (const [slug, note] of Object.entries(en.techs)) {
    const row = await tx.tech.findUnique({ where: { slug }, select: { id: true } })
    if (!row) throw new Error(`en.ts: no existe la tecnología ${slug}`)
    await tx.techTranslation.upsert({
      where: { techId_locale: { techId: row.id, locale: Locale.en } },
      create: { techId: row.id, locale: Locale.en, note },
      update: { note },
    })
  }

  for (const [slug, fields] of Object.entries(en.articles)) {
    const row = await tx.article.findUnique({ where: { slug }, select: { id: true } })
    if (!row) throw new Error(`en.ts: no existe el artículo ${slug}`)
    await tx.articleTranslation.upsert({
      where: { articleId_locale: { articleId: row.id, locale: Locale.en } },
      create: { articleId: row.id, locale: Locale.en, ...fields },
      update: fields,
    })
  }
}

/** Upsert de cada captura por (obra, src) y de su pie y texto alternativo en inglés. */
export async function applyCaptures(tx: Tx, captures: readonly CaptureSeed[]): Promise<void> {
  for (const c of captures) {
    const project = await tx.project.findUnique({ where: { slug: c.project }, select: { id: true } })
    if (!project) throw new Error(`media.ts: no existe la obra ${c.project}`)
    const data = {
      kind: c.kind,
      role: c.role,
      order: c.order,
      viewport: c.viewport,
      width: c.width,
      height: c.height,
      bytes: c.bytes,
      poster: c.poster,
      srcWebm: c.srcWebm,
      tint: c.tint,
      alt: c.alt.es,
      caption: c.caption?.es ?? null,
    }
    const existing = await tx.media.findFirst({ where: { projectId: project.id, src: c.src }, select: { id: true } })
    const media = existing
      ? await tx.media.update({ where: { id: existing.id }, data })
      : await tx.media.create({ data: { ...data, src: c.src, projectId: project.id } })

    const en = { alt: c.alt.en, caption: c.caption?.en ?? null }
    if (!en.alt && !en.caption) {
      await tx.mediaTranslation.deleteMany({ where: { mediaId: media.id, locale: Locale.en } })
      continue
    }
    await tx.mediaTranslation.upsert({
      where: { mediaId_locale: { mediaId: media.id, locale: Locale.en } },
      create: { mediaId: media.id, locale: Locale.en, ...en },
      update: en,
    })
  }
}
