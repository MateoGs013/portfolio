/**
 * CV Harvard ATS compuesto desde la base: Doc about/contact, Experience (cvOrder y formación) y Tech
 * por categoría. Lo comparten el visor público (/about?cv=ats), el script del PDF y el respaldo del
 * Job Hunter. Acá no hay texto de contenido: solo qué campo de la base va en qué lugar del CV.
 */
import { TechCategory } from '../../generated/prisma/client.js'
import type { DocField } from '../../../app/lib/fieldMeta.js'
import type { DocRecord } from '../queries/docs.js'
import type { ExperienceRecord } from '../queries/experience.js'
import type { TechRecord } from '../queries/stack.js'
import { docFieldsOf, docList, docText, untranslatedFields } from './docFields.js'
import type { Lang } from './lang.js'
import { presentExperience } from './present.js'
import type { Wire } from './snapshot.js'

export interface CvSource {
  about: Wire<DocRecord> | null
  contact: Wire<DocRecord> | null
  experience: Wire<ExperienceRecord>[]
  stack: Wire<TechRecord>[]
}

export interface CvPeriod {
  start: string
  /** null = actual. */
  end: string | null
}

export interface CvExperience {
  slug: string
  /** La organización; sin org, la obra ligada; sin obra, el rol (la entrada freelance). */
  title: string
  role: string
  period: CvPeriod
  /** experience.location ?? org.city; null = remoto (el rótulo va en el diccionario). */
  location: string | null
  highlights: string[]
  techs: string[]
  untranslated: string[]
}

export interface CvEducation {
  slug: string
  degree: string
  org: string | null
  location: string | null
  period: CvPeriod
  highlights: string[]
  untranslated: string[]
}

export interface CvSkillGroup {
  category: TechCategory
  items: string[]
}

export interface CvHeader {
  name: string | null
  role: string | null
  location: string | null
  email: string | null
  github: string | null
  linkedin: string | null
  portfolio: string | null
  modalities: string | null
  availability: string | null
}

export interface CvDocument {
  lang: Lang
  header: CvHeader
  summary: string | null
  methodologies: string | null
  experience: CvExperience[]
  education: CvEducation[]
  skills: CvSkillGroup[]
  languages: string[]
  /** Rutas del CV que en `lang` quedaron en español ('header.role', 'summary'…). */
  untranslated: string[]
}

type DocKey = 'about' | 'contact'
type Origin = readonly [DocKey, string]

/** De qué campo de qué documento sale cada dato de la cabecera. */
const headerFrom: Record<keyof CvHeader, Origin> = {
  name: ['about', 'name'],
  role: ['about', 'role'],
  location: ['contact', 'location'],
  email: ['contact', 'email'],
  github: ['contact', 'github'],
  linkedin: ['contact', 'linkedin'],
  portfolio: ['contact', 'website'],
  modalities: ['about', 'work_modalities'],
  availability: ['contact', 'availability'],
}

const proseFrom: Record<'summary' | 'methodologies' | 'languages', Origin> = {
  summary: ['about', 'engineering_philosophy'],
  methodologies: ['about', 'core_competencies'],
  languages: ['about', 'languages'],
}

function period(startedAt: string, endedAt: string | null): CvPeriod {
  return { start: startedAt, end: endedAt }
}

export function composeCv(lang: Lang, source: CvSource): CvDocument {
  const docs: Record<DocKey, DocField[]> = {
    about: docFieldsOf(source.about?.fields),
    contact: docFieldsOf(source.contact?.fields),
  }
  const text = ([doc, name]: Origin) => docText(docs[doc], name, lang)
  const pending = (path: string, [doc, name]: Origin) =>
    untranslatedFields(docs[doc], [name], lang).length > 0 ? [path] : []

  const header = Object.fromEntries(
    Object.entries(headerFrom).map(([key, origin]) => [key, text(origin)]),
  ) as unknown as CvHeader

  const untranslated = [
    ...Object.entries(headerFrom).flatMap(([key, origin]) => pending(`header.${key}`, origin)),
    ...Object.entries(proseFrom).flatMap(([key, origin]) => pending(key, origin)),
  ]

  const entries = source.experience.map(e => presentExperience(e, lang))

  const experience = entries
    .filter((e): e is typeof e & { cvOrder: number } => e.cvOrder !== null)
    .sort((a, b) => a.cvOrder - b.cvOrder)
    .map(e => ({
      slug: e.slug,
      title: e.org?.name ?? e.projects[0]?.title ?? e.role,
      role: e.role,
      period: period(e.startedAt, e.endedAt),
      location: e.location ?? e.org?.city ?? null,
      highlights: e.highlights,
      techs: e.techs.map(t => t.name),
      untranslated: e.untranslated,
    }))

  const education = entries
    .filter(e => e.kind === 'EDUCATION')
    .map(e => ({
      slug: e.slug,
      degree: e.role,
      org: e.org?.name ?? null,
      location: e.location ?? e.org?.city ?? null,
      period: period(e.startedAt, e.endedAt),
      highlights: e.highlights,
      untranslated: e.untranslated,
    }))

  const skills = Object.values(TechCategory)
    .map(category => ({
      category,
      items: source.stack.filter(t => t.category === category).map(t => t.name),
    }))
    .filter(group => group.items.length > 0)

  return {
    lang,
    header,
    summary: text(proseFrom.summary),
    methodologies: text(proseFrom.methodologies),
    experience,
    education,
    skills,
    languages: docList(docs[proseFrom.languages[0]], proseFrom.languages[1], lang),
    untranslated,
  }
}
