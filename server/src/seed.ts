/**
 * Seed: la fuente única del contenido en español del portafolio (los datos viven en server/src/seed/).
 *
 * Correr con `pnpm db:seed`. Borra y vuelve a cargar todo, así que pisa lo editado desde el admin:
 * para una base existente se usan los parches de server/src/patches/.
 * Solo las seis obras con `published` quedan visibles; null-net y lampone se cargan sin publishedAt.
 */
import { db } from './db.js'
import { MediaKind, MediaRole } from '../generated/prisma/client.js'
import { applyCaptures, applyEnglish, withEnglish } from './seed/apply.js'
import { articles } from './seed/articles.js'
import { docs } from './seed/docs.js'
import { EN } from './seed/en.js'
import { experience } from './seed/experience.js'
import { imageFile } from './seed/files.js'
import { CAPTURES } from './seed/media.js'
import { metricRows } from './seed/metrics.js'
import { publicProjects } from './seed/projects.js'
import { hiddenProjects } from './seed/projects-hidden.js'
import { orgs, techColors, techNotes, techs } from './seed/stack.js'
import { PUBLISHED_AT, type SeedProject } from './seed/types.js'

const projects: SeedProject[] = [...publicProjects, ...hiddenProjects]

/** La portada con su tamaño real leído del archivo. */
async function coverMedia(cover: SeedProject['cover']) {
  if (!cover) return null
  const file = await imageFile(cover.src)
  return { ...cover, ...file, kind: MediaKind.IMAGE, role: MediaRole.COVER, order: 0 }
}

async function main() {
  const covers = await Promise.all(projects.map(p => coverMedia(p.cover)))

  await db.$transaction(async (tx) => {
    await tx.metric.deleteMany()
    await tx.processStep.deleteMany()
    await tx.media.deleteMany()
    await tx.link.deleteMany()
    await tx.article.deleteMany()
    await tx.project.deleteMany()
    await tx.experience.deleteMany()
    await tx.tech.deleteMany()
    await tx.org.deleteMany()
    await tx.doc.deleteMany()

    await tx.tech.createMany({
      data: techs.map(t => ({ ...t, note: techNotes[t.slug] ?? null, color: techColors[t.slug] ?? null })),
    })
    await tx.org.createMany({ data: orgs })

    for (const [i, p] of projects.entries()) {
      const { org, techs: techSlugs, links, steps, cover: _cover, metrics, published, ...scalars } = p
      const cover = covers[i]
      await tx.project.create({
        data: {
          ...scalars,
          sortOrder: i,
          publishedAt: published ? PUBLISHED_AT : null,
          org: org ? { connect: { slug: org } } : undefined,
          techs: { connect: techSlugs.map(slug => ({ slug })) },
          links: { create: links },
          steps: { create: steps.map((s, order) => ({ ...s, order: order + 1 })) },
          metrics: { create: metricRows(metrics) },
          media: cover ? { create: [cover] } : undefined,
        },
      })
    }

    for (const e of experience) {
      const { org, techs: techSlugs, projects: projectSlugs, startedAt, endedAt, ...scalars } = e
      await tx.experience.create({
        data: {
          ...scalars,
          startedAt: new Date(startedAt),
          endedAt: endedAt ? new Date(endedAt) : null,
          org: org ? { connect: { slug: org } } : undefined,
          techs: { connect: techSlugs.map(slug => ({ slug })) },
          projects: { connect: projectSlugs.map(slug => ({ slug })) },
        },
      })
    }

    await tx.doc.createMany({
      data: docs.map(d => ({ key: d.key, title: d.title, fields: withEnglish(d.fields, EN.docs[d.key]) })),
    })

    for (const a of articles) {
      const { techs: techSlugs, ...scalars } = a
      await tx.article.create({ data: { ...scalars, techs: { connect: techSlugs.map(slug => ({ slug })) } } })
    }

    await applyEnglish(tx, EN)
    await applyCaptures(tx, CAPTURES)
  }, {
    timeout: 60000,
  })

  const [nProjects, nVisible, nExperience, nTechs, nOrgs, nDocs, nArticles, nMetrics] = await Promise.all([
    db.project.count(),
    db.project.count({ where: { publishedAt: { not: null, lte: new Date() } } }),
    db.experience.count(),
    db.tech.count(),
    db.org.count(),
    db.doc.count(),
    db.article.count(),
    db.metric.count(),
  ])
  console.log(`seed -> ${nProjects} projects (${nVisible} visibles) · ${nMetrics} metrics · ${nExperience} experience · ${nTechs} techs · ${nOrgs} orgs · ${nDocs} docs · ${nArticles} articles`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
