/** Conteos de la raíz: cuántos registros visibles tiene cada colección y cuántos campos cada documento. */
import { db } from '../db.js'
import { visibleArticle, visibleProject } from '../content/visibility.js'
import { listDocs, type DocRecord } from './docs.js'

export interface SchemaCounts {
  projects: number
  experience: number
  stack: number
  articles: number
  orgs: number
  docs: DocRecord[]
}

export async function schemaCounts(): Promise<SchemaCounts> {
  const [projects, experience, stack, articles, orgs, docs] = await Promise.all([
    db.project.count({ where: visibleProject() }),
    db.experience.count(),
    db.tech.count(),
    db.article.count({ where: visibleArticle() }),
    db.org.count(),
    listDocs(),
  ])
  return { projects, experience, stack, articles, orgs, docs }
}
