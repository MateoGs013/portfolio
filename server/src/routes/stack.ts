import { Router } from 'express'
import { parseLang } from '../content/lang.js'
import { matchesTech, sortByUsage } from '../content/matches.js'
import { presentTech } from '../content/present.js'
import { resolve, type Resource, type Wire } from '../content/snapshot.js'
import { sendResolved } from '../envelope.js'
import { publicFilters, readFilters, stackFilters, type StackFilters } from '../filters.js'
import { getTech, listStack, type TechRecord } from '../queries/stack.js'

type Tech = Wire<TechRecord>

export const stackList: Resource<StackFilters, Tech[], ReturnType<typeof presentTech>[]> = {
  name: 'stack',
  db: listStack,
  snapshot: (snap, filters) => sortByUsage(snap.stack.filter(t => matchesTech(t, filters))),
  present: (records, lang) => records.map(t => presentTech(t, lang)),
}

export const techDetail: Resource<string, Tech, ReturnType<typeof presentTech>> = {
  name: 'tech',
  db: getTech,
  snapshot: (snap, slug) => snap.stack.find(t => t.slug === slug) ?? null,
  present: presentTech,
}

export const stack = Router()

/** GET /api/stack?category=&lang= — cada tecnología con sus obras visibles; más usadas primero. */
stack.get('/stack', async (req, res) => {
  const filters = readFilters(req.query, stackFilters)
  const lang = parseLang(req)
  sendResolved(res, await resolve(stackList, filters, lang), { lang, filters: publicFilters(filters) })
})

/** GET /api/stack/:slug?lang= */
stack.get('/stack/:slug', async (req, res) => {
  const lang = parseLang(req)
  sendResolved(res, await resolve(techDetail, req.params.slug, lang), { lang })
})
