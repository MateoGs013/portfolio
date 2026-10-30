/**
 * Contrato de la API pública (D2). Las formas se infieren en el server (`server/src/content/present.ts`
 * y `cv.ts`) y acá se reflejan con `import type`: el front nunca diverge del server y no se lleva
 * código del server al bundle (los imports de tipo se borran al compilar).
 */
import type {
  PublicDoc,
  PublicExperience,
  PublicProject,
  PublicProjectSummary,
  PublicTech,
} from '../../server/src/content/present'
import type { DocFieldValue, DocKey } from './fieldMeta'
import type { Lang } from './dict'

export type { Lang } from './dict'
export type {
  CvDocument,
  CvEducation,
  CvExperience,
  CvHeader,
  CvPeriod,
  CvSkillGroup,
} from '../../server/src/content/cv'

/** De dónde salió la respuesta: la base o la copia generada desde ella. */
export type ContentSource = 'db' | 'snapshot'

/** Envoltura de toda respuesta de la API. `filters` solo trae lo aplicado, en minúscula. */
export interface Envelope<T> {
  data: T
  meta: {
    count: number
    filters: Record<string, string>
    lang?: Lang
    source?: ContentSource
  }
}

/** Fila de `/api/projects`: solo la portada en `media`. */
export type ProjectSummary = PublicProjectSummary
/** `/api/projects/:slug`: el caso completo. */
export type Project = PublicProject
export type ProjectStatus = Project['status']
export type Media = Project['media'][number]
export type MediaKind = Media['kind']
export type MediaRole = Media['role']
export type MediaViewport = Media['viewport']
export type Metric = Project['metrics'][number]
export type ProcessStep = Project['steps'][number]
export type ProjectLink = Project['links'][number]
/** Tecnología dentro de un caso: con nota, desde cuándo y las obras visibles que la usan. */
export type ProjectTech = Project['techs'][number]
export type Org = NonNullable<Project['org']>

export type Tech = PublicTech
export type TechCategory = Tech['category']

export type Experience = PublicExperience
export type ExperienceKind = Experience['kind']

/** Documento con cada `value` ya resuelto en el idioma pedido. */
export type Doc = PublicDoc
export type ResolvedDocField = Doc['fields'][number]
export type { DocFieldValue, DocKey }

/** Todo registro público dice qué campos quedaron en español cuando se pidió inglés. */
export interface Translatable {
  untranslated: readonly string[]
}
