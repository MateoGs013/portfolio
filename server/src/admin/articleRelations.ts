/**
 * Lo que necesita un artículo que arma el servidor (no el formulario): una dirección libre y las
 * relaciones con la base que nombra Eros (sus etiquetas como tecnologías y la obra por su dirección).
 * Lo que no existe en la base no se suma ni se crea.
 */
import { db } from '../db.js'
import { SLUG_MAX, slugify } from '../shared/slug.js'

/** La dirección del título; si ya la usa otro artículo, la primera libre con -2, -3… (nunca al azar). */
export async function freeArticleSlug(title: string): Promise<string> {
  const base = slugify(title) || 'articulo'
  const stem = base.slice(0, SLUG_MAX - 4).replace(/-+$/, '')
  const taken = new Set((await db.article.findMany({ where: { slug: { startsWith: stem } }, select: { slug: true } })).map(r => r.slug))
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) {
    const candidate = `${base.slice(0, SLUG_MAX - String(n).length - 1).replace(/-+$/, '')}-${n}`
    if (!taken.has(candidate)) return candidate
  }
}

/** «Node.js», «node-js» y «nodejs» son la misma: minúsculas, solo letras y números. */
export const compactTag = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Las tecnologías de la base que nombran las etiquetas (por su dirección o su nombre, compactos). */
export async function techIdsByTags(tags: readonly string[]): Promise<number[]> {
  if (!tags.length) return []
  const wanted = new Set(tags.map(compactTag).filter(Boolean))
  const techs = await db.tech.findMany({ select: { id: true, slug: true, name: true } })
  return techs.filter(t => wanted.has(compactTag(t.slug)) || wanted.has(compactTag(t.name))).map(t => t.id)
}

/** La obra por su dirección, o null si no existe. */
export async function projectIdBySlug(slug: string | null | undefined): Promise<number | null> {
  if (!slug) return null
  const project = await db.project.findUnique({ where: { slug: slug.toLowerCase() }, select: { id: true } })
  return project?.id ?? null
}
