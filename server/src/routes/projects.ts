import { Router } from 'express'
import { parseLang } from '../content/lang.js'
import { matchesProject } from '../content/matches.js'
import { presentProject, presentProjectSummary } from '../content/present.js'
import { resolve, type Resource, type Wire } from '../content/snapshot.js'
import { isVisible } from '../content/visibility.js'
import { sendResolved } from '../envelope.js'
import { projectFilters, publicFilters, readFilters, detailSlug, type ProjectFilters } from '../filters.js'
import { getProject, listProjects, type ProjectRecord } from '../queries/projects.js'

type Project = Wire<ProjectRecord>

export const projectList: Resource<ProjectFilters, Project[], ReturnType<typeof presentProjectSummary>[]> = {
  name: 'projects',
  db: listProjects,
  snapshot: (snap, filters) => snap.projects.filter(p => matchesProject(p, filters)),
  present: (records, lang) => records.map(p => presentProjectSummary(p, lang)),
}

export const projectDetail: Resource<string, Project, ReturnType<typeof presentProject>> = {
  name: 'project',
  db: getProject,
  snapshot: (snap, slug) => snap.projects.find(p => p.slug === slug && isVisible(p)) ?? null,
  present: presentProject,
}

export const projects = Router()

/** GET /api/projects?status=&stack=&featured=&year=&org=&lang= — solo obras visibles, en sortOrder. */
projects.get('/projects', async (req, res) => {
  const filters = readFilters(req.query, projectFilters)
  const lang = parseLang(req)
  sendResolved(res, await resolve(projectList, filters, lang), { lang, filters: publicFilters(filters) })
})

/** GET /api/projects/:slug?lang= — el caso completo; 404 si no existe o no se publica. */
projects.get('/projects/:slug', async (req, res) => {
  const lang = parseLang(req)
  sendResolved(res, await resolve(projectDetail, detailSlug(req.params.slug), lang), { lang })
})
