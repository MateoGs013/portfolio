/**
 * Una sola dirección por página (docs/diseno.md §8). Todo lo demás redirige con 301 conservando la
 * query: las rutas del explorador anterior, los alias en español, las mayúsculas y los prefijos de
 * mundo (/datos, /diseno, /umbral). /lab y sus alias redirigen desde routeRules (nuxt.config.ts).
 */
import type { LocationQuery } from 'vue-router'

interface Target {
  path: string
  hash?: string
  query?: LocationQuery
}

/** Primer segmento en otro idioma o en singular → su nombre canónico. */
const ALIASES: Record<string, string> = {
  proyectos: 'projects', proyecto: 'projects', project: 'projects', obra: 'projects', obras: 'projects', work: 'projects',
  experiencia: 'experience', experiencias: 'experience', experiences: 'experience', trayectoria: 'experience',
  habilidades: 'stack', tecnologias: 'stack', tecnologia: 'stack', skills: 'stack', skill: 'stack',
  'sobre-mi': 'about', sobremi: 'about', 'about-me': 'about', aboutme: 'about', acerca: 'about',
  cv: 'cv', resume: 'cv', curriculum: 'cv',
  contacto: 'contact',
  organizaciones: 'orgs', organizacion: 'orgs', org: 'orgs', organization: 'orgs', organizations: 'orgs',
  blog: 'articles', articulos: 'articles', articulo: 'articles', article: 'articles', posts: 'articles', post: 'articles',
}

/** Slugs que cambiaron de nombre. */
const SLUG_ALIASES: Record<string, string> = { 'arg-piscinas': 'argpiscinas' }

const WORLD_PREFIXES = new Set(['datos', 'diseno', 'umbral'])

/** Minúsculas, salvo en segmentos codificados (%C3%A9): cambiar su hex daría otra dirección. */
const lower = (seg: string) => (seg.includes('%') ? seg : seg.toLowerCase())

/** A dónde va un path que no es canónico, o null si ya lo es. */
export function canonicalTarget(path: string, query: LocationQuery): Target | null {
  let segs = path.split('/').filter(Boolean).map(lower)
  const world = Boolean(segs[0] && WORLD_PREFIXES.has(segs[0]))
  if (world) segs = segs.slice(1)
  const [rawRoot, ...rest] = segs
  const root = rawRoot ? (ALIASES[rawRoot] ?? rawRoot) : undefined
  const slug = rest[0]

  switch (root) {
    case undefined:
      // '/' ya es canónico; '/datos', '/diseno', '/umbral' (y sus variantes) van al inicio.
      return world ? { path: '/', query } : null
    case 'experience':
      return { path: '/about', hash: '#trayectoria', query }
    case 'cv':
      return { path: '/about', query: { ...query, cv: 'ats' } }
    case 'contact':
      return { path: '/', hash: '#contacto', query }
    case 'orgs':
      return { path: '/projects', query: slug ? { ...query, org: slug } : query }
    case 'stack':
      return { path: '/projects', query: slug ? { ...query, stack: slug } : query }
    case 'projects':
      if (slug && SLUG_ALIASES[slug]) return { path: `/projects/${SLUG_ALIASES[slug]}`, query }
  }
  const canonical = `/${[root, ...rest.map(s => SLUG_ALIASES[s] ?? s)].join('/')}`
  return canonical === path ? null : { path: canonical, query }
}

export default defineNuxtRouteMiddleware((to) => {
  const target = canonicalTarget(to.path, to.query)
  if (target) return navigateTo(target, { redirectCode: 301 })
})
