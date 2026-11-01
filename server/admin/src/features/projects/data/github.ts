/**
 * «Importar desde el repositorio»: lee de la API pública de GitHub (api.github.com, en connect-src de
 * la CSP del admin) la descripción, el sitio y los lenguajes y temas del repositorio, y los cruza con
 * el catálogo de tecnologías. No trae imágenes: si alguna vez las trajera, su host va a img-src.
 */
import type { TechOption } from '@shared/adminContracts'
import { dataText } from './dict'

export interface RepoRef { owner: string, name: string }

export interface RepoFindings {
  repo: RepoRef
  description: string | null
  homepage: string | null
  /** Tecnologías del catálogo que el repositorio usa. */
  techs: TechOption[]
  /** Lenguajes y temas que no están en el catálogo. */
  unknown: string[]
}

const GITHUB = 'https://api.github.com'
const NAME = /^[\w.-]+$/

/** `https://github.com/dueño/repo(.git)`, `github.com/dueño/repo` o `dueño/repo`. */
export function parseRepo(raw: string): RepoRef | null {
  const text = raw.trim().replace(/\.git$/, '').replace(/\/+$/, '')
  const match = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s?#]+)/i.exec(text) ?? /^([^/\s]+)\/([^/\s]+)$/.exec(text)
  if (!match) return null
  const [, owner = '', name = ''] = match
  return NAME.test(owner) && NAME.test(name) ? { owner, name } : null
}

/** «Vue.js», «vue» y «Vue 3» son la misma: sin signos, sin «js» al final y sin versión. */
export function techToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/\d+$/, '').replace(/js$/, '')
}

async function readJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(`${GITHUB}${path}`, { headers: { Accept: 'application/vnd.github+json' }, signal })
  if (res.status === 404) throw new Error(dataText.repo.notFound)
  if (res.status === 403 || res.status === 429) throw new Error(dataText.repo.rateLimited)
  if (!res.ok) throw new Error(dataText.repo.failed(res.status))
  return await res.json() as T
}

interface RepoResponse { description: string | null, homepage: string | null, topics?: string[] }

export async function readRepo(repo: RepoRef, catalog: readonly TechOption[], signal: AbortSignal): Promise<RepoFindings> {
  const path = `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`
  const [info, languages] = await Promise.all([
    readJson<RepoResponse>(path, signal),
    readJson<Record<string, number>>(`${path}/languages`, signal),
  ])
  const names = [...Object.keys(languages), ...(info.topics ?? [])]
  const byToken = new Map(catalog.flatMap(t => [[techToken(t.name), t], [techToken(t.slug), t]] as const))
  const techs: TechOption[] = []
  const unknown: string[] = []
  for (const name of names) {
    const tech = byToken.get(techToken(name))
    if (tech && !techs.includes(tech)) techs.push(tech)
    else if (!tech && !unknown.some(u => techToken(u) === techToken(name))) unknown.push(name)
  }
  return {
    repo,
    description: info.description?.trim() || null,
    homepage: info.homepage?.trim() || null,
    techs,
    unknown,
  }
}
