/**
 * Inglés del contenido. Lo llena D3 traduciendo desde el español vigente del seed, sin afirmaciones
 * nuevas y con las cifras tal cual. Lo que falte queda sin traducir: la API sirve el español y lo
 * marca en `untranslated`. seed.ts lo aplica al final (upsert de *Translation y `en` de los Doc).
 *
 * Las viñetas (`highlights`) respetan la misma cota que las españolas: hasta 3, de 160 caracteres.
 */
import type { DocFieldValue } from '../../../app/lib/fieldMeta.js'
import type { TechSlug } from './stack.js'

export interface EnProject {
  title?: string
  role?: string
  summary?: string
  brief?: string
  outcome?: string
  /** Por `order` del paso (1, 2, 3…). El título va sin la numeración '01 ·'. */
  steps?: Record<number, { title?: string, body?: string }>
  /** Por url del enlace → su label en inglés. */
  links?: Record<string, string>
}

export interface EnExperience {
  role?: string
  summary?: string
  story?: string
  highlights?: string[]
  location?: string
}

export interface EnArticle {
  title?: string
  summary?: string
  content?: string
}

export interface EnSeed {
  /** Por slug de la obra. */
  projects: Record<string, EnProject>
  /** Por slug de la experiencia. */
  experience: Record<string, EnExperience>
  /** `note` de cada tecnología. */
  techs: Partial<Record<TechSlug, string>>
  /** Valor en inglés de cada campo de los Doc, por `name` (va al `en` del campo). */
  docs: { about: Record<string, DocFieldValue>, contact: Record<string, DocFieldValue> }
  /** Por slug del artículo. */
  articles: Record<string, EnArticle>
}

export const EN: EnSeed = {
  projects: {},
  experience: {},
  techs: {},
  docs: { about: {}, contact: {} },
  articles: {},
}
