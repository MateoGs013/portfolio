import { Router } from 'express'
import { composeCv, type CvDocument, type CvSource } from '../content/cv.js'
import { parseLang } from '../content/lang.js'
import { sortByUsage } from '../content/matches.js'
import { resolve, type Resource } from '../content/snapshot.js'
import { sendResolved } from '../envelope.js'
import { getDoc } from '../queries/docs.js'
import { listExperience } from '../queries/experience.js'
import { listStack } from '../queries/stack.js'

export const cvDocument: Resource<null, CvSource, CvDocument> = {
  name: 'cv',
  db: async () => {
    const [about, contact, experience, stack] = await Promise.all([
      getDoc('about'),
      getDoc('contact'),
      listExperience(),
      listStack(),
    ])
    return { about, contact, experience, stack }
  },
  snapshot: snap => ({
    about: snap.docs.find(d => d.key === 'about') ?? null,
    contact: snap.docs.find(d => d.key === 'contact') ?? null,
    experience: snap.experience,
    stack: sortByUsage(snap.stack),
  }),
  present: (source, lang) => composeCv(lang, source),
}

export const cv = Router()

/** GET /api/cv?lang= → CvDocument: el CV Harvard ATS compuesto desde la base. */
cv.get('/cv', async (req, res) => {
  const lang = parseLang(req)
  sendResolved(res, await resolve(cvDocument, null, lang), { lang })
})
