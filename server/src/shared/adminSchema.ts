/**
 * Descriptor de cada campo de la base para el admin: rótulo, ayuda (dónde aparece), si es obligatorio,
 * su tope, cómo se edita, si tiene inglés, en qué superficies se lee y si el formulario lo pide.
 *
 * Es el contrato que comparten el servidor (los mensajes de error salen de acá) y el admin (los
 * formularios se arman con esto y llega entero en GET /api/admin/meta). scripts/check-admin-schema.mjs
 * falla si un campo de prisma/schema.prisma no tiene entrada, o si una entrada ya no existe.
 */
import { Article, Doc, Experience, Org, Tech } from './schema/catalog.js'
import { translationOf, type FieldDescriptor, type ModelFields } from './schema/field.js'
import { Link, Media, Metric, Project, ProcessStep } from './schema/work.js'

export type { FieldDescriptor, FieldKind, Surface } from './schema/field.js'

export const adminSchema = {
  Project,
  Metric,
  ProcessStep,
  Media,
  Link,
  Experience,
  Tech,
  Org,
  Doc,
  Article,
  ProjectTranslation: translationOf(Project, { owner: 'Project', relation: 'project', key: 'projectId' }, ['title', 'role', 'summary', 'brief', 'outcome']),
  ProcessStepTranslation: translationOf(ProcessStep, { owner: 'ProcessStep', relation: 'step', key: 'stepId' }, ['title', 'body']),
  MediaTranslation: translationOf(Media, { owner: 'Media', relation: 'media', key: 'mediaId' }, ['alt', 'caption']),
  LinkTranslation: translationOf(Link, { owner: 'Link', relation: 'link', key: 'linkId' }, ['label']),
  ExperienceTranslation: translationOf(Experience, { owner: 'Experience', relation: 'experience', key: 'experienceId' }, ['role', 'summary', 'story', 'highlights', 'location']),
  TechTranslation: translationOf(Tech, { owner: 'Tech', relation: 'tech', key: 'techId' }, ['note']),
  ArticleTranslation: translationOf(Article, { owner: 'Article', relation: 'article', key: 'articleId' }, ['title', 'summary', 'content']),
} as const satisfies Readonly<Record<string, ModelFields>>

export type ModelName = keyof typeof adminSchema

/** Cómo se nombra un registro de cada modelo en una frase («Ya hay otra obra con esa dirección»). */
export const modelNames = {
  Project: { one: 'obra', another: 'otra obra' },
  Metric: { one: 'métrica', another: 'otra métrica' },
  ProcessStep: { one: 'paso', another: 'otro paso' },
  Media: { one: 'imagen', another: 'otra imagen' },
  Link: { one: 'enlace', another: 'otro enlace' },
  Experience: { one: 'experiencia', another: 'otra experiencia' },
  Tech: { one: 'tecnología', another: 'otra tecnología' },
  Org: { one: 'empresa', another: 'otra empresa' },
  Doc: { one: 'documento', another: 'otro documento' },
  Article: { one: 'artículo', another: 'otro artículo' },
} as const satisfies Partial<Record<ModelName, { one: string, another: string }>>

export function isModelName(name: string): name is ModelName {
  return Object.hasOwn(adminSchema, name)
}

/** El descriptor de `model.name`, o null si ese modelo no tiene ese campo. */
export function describe(model: ModelName, name: string): FieldDescriptor | null {
  const fields: ModelFields = adminSchema[model]
  return fields[name] ?? null
}

/**
 * El descriptor de un campo cuando no se sabe de qué modelo es: el primero que lo tenga, en el
 * orden de adminSchema (obra antes que el resto). Sirve para los mensajes de rutas viejas.
 */
export function describeAny(name: string): FieldDescriptor | null {
  for (const model of Object.keys(adminSchema) as ModelName[]) {
    const found = describe(model, name)
    if (found) return found
  }
  return null
}

/** El modelo de la tabla de inglés de `model`, si la tiene. */
export function translationModel(model: ModelName): ModelName | null {
  const name = `${model}Translation`
  return isModelName(name) ? name : null
}
