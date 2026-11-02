/**
 * Muestra de Publicaciones y Tendencias para pruebas y capturas: solo existe con EROS_DEMO=1 (nunca
 * en producción) y solo cuando Eros no responde. No hay posts escritos a mano: cada publicación de
 * muestra se arma desde un artículo publicado en la base (título, bajada, cuerpo y tecnologías) y la
 * firma sale de los docs about y contact. Las tendencias de muestra dicen que lo son: sin dirección,
 * sin fecha y sin afinidad, porque ninguna fuente las publicó. Nada se modifica en memoria.
 */
import type { Response } from 'express'
import { resolve } from '../content/snapshot.js'
import { articleDetail, articleList } from '../routes/articles.js'
import type { AdminErrorBody } from '../shared/adminContracts.js'
import type { CarouselSlide, ContentPost, Trend } from '../shared/contentContracts.js'
import { loadSignature, type Signature } from './profile.js'

export { erosDemo } from './fallbackHunterData.js'

/** Las publicaciones y tendencias de muestra empiezan así; nunca se le preguntan a Eros. */
export const DEMO_PREFIX = 'demo-'
export const isDemoId = (id: string) => id.startsWith(DEMO_PREFIX)

/** El 400 de cualquier cambio pedido sobre la muestra: no hay dónde guardarlo. */
export const demoRefusal: AdminErrorBody = {
  error: 'Es una muestra para probar el admin sin Eros: no se guarda ningún cambio.',
  code: 'invalid',
  errors: [],
}

/** Un cambio pedido sobre la muestra responde 400 y nunca llega a Eros. true si se respondió. */
export function refuseDemo(res: Response, id: string): boolean {
  if (!isDemoId(id)) return false
  res.status(400).json(demoRefusal)
  return true
}

/** Una respuesta de la muestra, con su origen en el header (el cliente lo pasa a `_source`). */
export function sendDemo(res: Response, body: unknown): void {
  res.setHeader('X-Eros-Source', 'demo')
  res.json(body)
}

/** Pie de la primera lámina: «Nombre · sitio». */
export function signatureLine(sig: Signature): string | null {
  return [sig.name, sig.site].filter(Boolean).join(' · ') || null
}

/** Pie de la última lámina: el usuario de GitHub o, sin él, el sitio. */
function handleLine(sig: Signature): string | null {
  return sig.handle ? `@${sig.handle}` : sig.site
}

/** URL pública del artículo: el blog vive en /articles/:slug del sitio. */
function articleUrl(sig: Signature, slug: string): string | null {
  return sig.website ? `${sig.website.replace(/\/+$/, '')}/articles/${slug}` : null
}

/** Texto plano de una línea de markdown: sin énfasis, código en línea ni enlaces. */
function plain(line: string): string {
  return line
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]+/g, '')
    .trim()
}

function firstSentence(text: string): string {
  const flat = plain(text.replace(/\s+/g, ' '))
  const end = flat.search(/[.!?](\s|$)/)
  return end === -1 ? flat : flat.slice(0, end + 1)
}

interface Section {
  heading: string
  bullets: string[]
  lead: string
  code: string | null
}

/** Secciones `##` del cuerpo con sus viñetas, su primera oración y su primer bloque de código. */
function sections(markdown: string): Section[] {
  return markdown.split(/^## +/m).slice(1).map((chunk) => {
    const [heading = '', ...rest] = chunk.split('\n')
    const body = rest.join('\n')
    const code = /```[a-z]*\n([\s\S]*?)```/.exec(body)?.[1]?.trim().split('\n').slice(0, 4).join('\n') ?? null
    const prose = body.replace(/```[\s\S]*?```/g, '')
    const bullets = [...prose.matchAll(/^\s*(?:[-*]|\d+\.)\s+(.+)$/gm)].map(m => plain(m[1] ?? '')).slice(0, 3)
    const paragraph = prose.split(/\n\s*\n/).map(p => p.trim()).find(p => p && !/^\s*(?:[-*]|\d+\.)\s/.test(p)) ?? ''
    return { heading: plain(heading), bullets, lead: firstSentence(paragraph), code }
  })
}

interface ArticleSource {
  slug: string
  title: string
  summary: string | null
  content: string
  techs: { slug: string, name: string }[]
  publishedAt: string | null
  updatedAt: string
}

/** Un artículo de la base contado en los formatos de Eros (LinkedIn, hilo, dev.to y carrusel). */
export function postFromArticle(a: ArticleSource, sig: Signature): ContentPost {
  const parts = sections(a.content).slice(0, 4)
  const hook = a.summary ?? (firstSentence(a.content.replace(/^#.*$/m, '')) || null)
  const tags = a.techs.map(t => t.slug.replace(/[^a-z0-9]/g, '')).slice(0, 4)
  const total = parts.length + 1

  const slides: CarouselSlide[] = [
    { index: 1, title: a.title, subtitle: hook, bullets: a.techs.map(t => t.name), metric_badge: null, code_snippet: null, footer: signatureLine(sig) },
    ...parts.map((s, i) => ({
      index: i + 2,
      title: s.heading,
      subtitle: s.lead || null,
      bullets: s.bullets,
      metric_badge: i === parts.length - 1 ? sig.site : null,
      code_snippet: s.code,
      footer: i === parts.length - 1 ? handleLine(sig) : null,
    })),
  ]

  return {
    id: `${DEMO_PREFIX}${a.slug}`,
    title: a.title,
    topic: a.title,
    pillar: 'architecture',
    project_slug: null,
    hook,
    linkedin_text: [hook ?? a.title, parts.map(s => `- ${s.heading}`).join('\n'), tags.map(t => `#${t}`).join(' ')].filter(Boolean).join('\n\n'),
    first_comment: articleUrl(sig, a.slug),
    twitter_thread: [a.title, ...parts.map(s => [s.heading, s.lead].filter(Boolean).join(': '))]
      .map((text, i) => `${i + 1}/${total} ${text}`),
    devto_title: a.title,
    devto_tags: tags,
    devto_markdown: a.content,
    carousel_slides: slides,
    status: 'draft',
    dispatched_at: null,
    created_at: a.publishedAt ?? a.updatedAt,
    updated_at: a.updatedAt,
    _source: 'demo',
    demo: true,
  }
}

/** Una publicación de muestra por artículo publicado (el blog en español). */
export async function demoPosts(): Promise<ContentPost[]> {
  const [sig, list] = await Promise.all([loadSignature(), resolve(articleList, {}, 'es')])
  const details = await Promise.all((list.data ?? []).map(a => resolve(articleDetail, a.slug, 'es')))
  return details.flatMap(d => (d.data ? [postFromArticle(d.data, sig)] : []))
}

export async function findDemoPost(id: string): Promise<ContentPost | null> {
  return isDemoId(id) ? (await demoPosts()).find(p => p.id === id) ?? null : null
}

interface TrendSample {
  id: string
  title: string
  source: string
  summary: string
  tags: string[]
}

/** Tres notas de muestra, una por fuente, para ver la lista y sus filtros. Ninguna existe afuera. */
const trendSamples: readonly TrendSample[] = [
  {
    id: 'demo-tendencia-postgres',
    title: 'Muestra: PostgreSQL como base relacional y de vectores a la vez',
    source: 'HACKER_NEWS',
    summary: 'Tendencia de muestra para probar el radar sin Eros: no viene de ninguna fuente.',
    tags: ['postgresql'],
  },
  {
    id: 'demo-tendencia-agentes',
    title: 'Muestra: agentes con contratos estrictos entre servicios',
    source: 'DEVTO',
    summary: 'Tendencia de muestra para probar el radar sin Eros: no viene de ninguna fuente.',
    tags: ['python'],
  },
  {
    id: 'demo-tendencia-nuxt',
    title: 'Muestra: renderizado híbrido con Nuxt y su costo en el servidor',
    source: 'GITHUB',
    summary: 'Tendencia de muestra para probar el radar sin Eros: no viene de ninguna fuente.',
    tags: ['nuxt', 'vue'],
  },
]

/** Copias nuevas de la muestra: sin URL, sin fecha y sin afinidad. */
export function demoTrends(): Trend[] {
  return trendSamples.map(s => ({
    ...s,
    tags: [...s.tags],
    url: null,
    detected_at: null,
    status: 'DISCOVERED',
    relevance_score: null,
    engineering_angle: null,
    post_id: null,
    _source: 'demo',
    demo: true,
  }))
}

export const findDemoTrend = (id: string): Trend | null => demoTrends().find(t => t.id === id) ?? null
