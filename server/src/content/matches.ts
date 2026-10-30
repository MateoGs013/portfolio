/**
 * Los filtros de las listas, en memoria. Es la misma regla que el `where` de cada consulta
 * (queries/*.ts) aplicada a registros del snapshot; `pnpm db:snapshot:check` verifica la paridad.
 */
import type { ArticleFilters, ExperienceFilters, ProjectFilters, StackFilters } from '../filters.js'
import type { ArticleRecord } from '../queries/articles.js'
import type { ExperienceRecord } from '../queries/experience.js'
import type { ProjectRecord } from '../queries/projects.js'
import type { TechRecord } from '../queries/stack.js'
import type { Wire } from './snapshot.js'
import { isVisible, isVisibleArticle } from './visibility.js'

export function matchesProject(p: Wire<ProjectRecord>, f: ProjectFilters): boolean {
  return isVisible(p)
    && (f.status === undefined || p.status === f.status)
    && (f.featured === undefined || p.featured === f.featured)
    && (f.year === undefined || p.year === f.year)
    && (f.stack === undefined || p.techs.some(t => t.slug === f.stack))
    && (f.org === undefined || p.org?.slug === f.org)
}

export function matchesTech(t: Wire<TechRecord>, f: StackFilters): boolean {
  return f.category === undefined || t.category === f.category
}

export function matchesExperience(e: Wire<ExperienceRecord>, f: ExperienceFilters): boolean {
  return (f.stack === undefined || e.techs.some(t => t.slug === f.stack))
    && (f.org === undefined || e.org?.slug === f.org)
}

export function matchesArticle(a: Wire<ArticleRecord>, f: ArticleFilters): boolean {
  return isVisibleArticle(a)
    && (f.featured === undefined || a.featured === f.featured)
    && (f.stack === undefined || a.techs.some(t => t.slug === f.stack))
    && (f.project === undefined || (a.project?.slug === f.project && isVisible(a.project)))
}

type Usage = { name: string, projects: readonly { publishedAt: Date | string | null }[] }

/** Cuántas obras visibles usan la tecnología. */
export function visibleUsage(record: Usage): number {
  return record.projects.filter(isVisible).length
}

/** Orden de /api/stack: más obras visibles primero y, a igualdad, por nombre. */
export function sortByUsage<T extends Usage>(records: readonly T[]): T[] {
  return [...records].sort((a, b) => visibleUsage(b) - visibleUsage(a) || a.name.localeCompare(b.name, 'es'))
}
