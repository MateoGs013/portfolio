import { Router } from 'express'
import { parseLang } from '../content/lang.js'
import { matchesExperience } from '../content/matches.js'
import { presentExperience } from '../content/present.js'
import { resolve, type Resource, type Wire } from '../content/snapshot.js'
import { sendResolved } from '../envelope.js'
import { experienceFilters, publicFilters, readFilters, detailSlug, type ExperienceFilters } from '../filters.js'
import { getExperience, listExperience, type ExperienceRecord } from '../queries/experience.js'

type Experience = Wire<ExperienceRecord>

export const experienceList: Resource<ExperienceFilters, Experience[], ReturnType<typeof presentExperience>[]> = {
  name: 'experience',
  db: listExperience,
  snapshot: (snap, filters) => snap.experience.filter(e => matchesExperience(e, filters)),
  present: (records, lang) => records.map(e => presentExperience(e, lang)),
}

export const experienceDetail: Resource<string, Experience, ReturnType<typeof presentExperience>> = {
  name: 'experience-detail',
  db: getExperience,
  snapshot: (snap, slug) => snap.experience.find(e => e.slug === slug) ?? null,
  present: presentExperience,
}

export const experience = Router()

/** GET /api/experience?stack=&org=&lang= — de la más reciente a la más vieja. */
experience.get('/experience', async (req, res) => {
  const filters = readFilters(req.query, experienceFilters)
  const lang = parseLang(req)
  sendResolved(res, await resolve(experienceList, filters, lang), { lang, filters: publicFilters(filters) })
})

/** GET /api/experience/:slug?lang= */
experience.get('/experience/:slug', async (req, res) => {
  const lang = parseLang(req)
  sendResolved(res, await resolve(experienceDetail, detailSlug(req.params.slug), lang), { lang })
})
