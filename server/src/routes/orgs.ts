import { Router } from 'express'
import { parseLang } from '../content/lang.js'
import { presentOrg } from '../content/present.js'
import { resolve, type Resource, type Wire } from '../content/snapshot.js'
import { sendResolved } from '../envelope.js'
import { getOrg, listOrgs, type OrgRecord } from '../queries/orgs.js'

type Org = Wire<OrgRecord>

export const orgList: Resource<null, Org[], ReturnType<typeof presentOrg>[]> = {
  name: 'orgs',
  db: () => listOrgs(),
  snapshot: snap => snap.orgs,
  present: (records, lang) => records.map(o => presentOrg(o, lang)),
}

export const orgDetail: Resource<string, Org, ReturnType<typeof presentOrg>> = {
  name: 'org',
  db: getOrg,
  snapshot: (snap, slug) => snap.orgs.find(o => o.slug === slug) ?? null,
  present: presentOrg,
}

export const orgs = Router()

/** GET /api/orgs?lang= — organizaciones con sus obras visibles y su experiencia. */
orgs.get('/orgs', async (req, res) => {
  const lang = parseLang(req)
  sendResolved(res, await resolve(orgList, null, lang), { lang })
})

/** GET /api/orgs/:slug?lang= */
orgs.get('/orgs/:slug', async (req, res) => {
  const lang = parseLang(req)
  sendResolved(res, await resolve(orgDetail, req.params.slug, lang), { lang })
})
