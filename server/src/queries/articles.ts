/** Consultas del blog: solo artículos publicados, con la obra relacionada si es visible. */
import { db } from '../db.js'
import { visibleArticle, visibleProject } from '../content/visibility.js'
import type { ArticleFilters } from '../filters.js'
import type { Prisma } from '../../generated/prisma/client.js'

function articleInclude() {
  return {
    techs: { orderBy: { name: 'asc' }, select: { slug: true, name: true, category: true } },
    // Relación a uno: no admite `where`. `present` la anula si la obra no es visible.
    project: {
      select: {
        slug: true,
        title: true,
        year: true,
        publishedAt: true,
        translations: { select: { locale: true, title: true } },
      },
    },
    translations: true,
  } satisfies Prisma.ArticleInclude
}

export type ArticleRecord = Prisma.ArticleGetPayload<{ include: ReturnType<typeof articleInclude> }>

export const articleOrder = [
  { sortOrder: 'asc' },
  { publishedAt: 'desc' },
  { slug: 'asc' },
] satisfies Prisma.ArticleOrderByWithRelationInput[]

export function listArticles(filters: ArticleFilters = {}): Promise<ArticleRecord[]> {
  const where: Prisma.ArticleWhereInput = { ...visibleArticle() }
  if (filters.stack) where.techs = { some: { slug: filters.stack } }
  if (filters.featured !== undefined) where.featured = filters.featured
  if (filters.project) where.project = { slug: filters.project, ...visibleProject() }
  return db.article.findMany({ where, orderBy: articleOrder, include: articleInclude() })
}

export function getArticle(slug: string): Promise<ArticleRecord | null> {
  return db.article.findFirst({ where: { slug, ...visibleArticle() }, include: articleInclude() })
}
