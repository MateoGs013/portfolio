/**
 * Contenido omnicanal de ejemplo de Eros para operar el admin sin el agente. No hay posts escritos
 * a mano: cada ejemplo se genera desde un artículo publicado en la base (título, resumen, cuerpo y
 * tecnologías) y la firma sale de los docs about y contact. Sin métricas: ningún número que la
 * base no tenga.
 */
import { resolve } from '../content/snapshot.js'
import { articleDetail, articleList } from '../routes/articles.js'
import { loadSignature, type Signature } from './profile.js'

export interface SlideItem {
  index: number
  title: string
  subtitle: string
  bullets: string[]
  metric_badge: string | null
  code_snippet: string | null
  footer: string | null
}

export interface ContentPost {
  id: string
  title: string
  topic: string
  pillar: string
  project_slug: string | null
  hook: string
  linkedin_text: string
  first_comment: string
  twitter_thread: string[]
  devto_title: string
  devto_tags: string[]
  devto_markdown: string
  carousel_slides: SlideItem[]
  status: 'draft' | 'approved' | 'published' | 'rejected'
  n8n_published_at: string | null
  n8n_response: string | null
  created_at: string
  updated_at: string
}

export interface ContentGenerateRequest {
  topic?: string
  pillar?: string
  project_slug?: string
  key_points?: string[]
  custom_angle?: string
}

/** Borradores generados en esta sesión sin Eros: viven en memoria hasta que el server reinicia. */
export const generatedPosts: ContentPost[] = []

const EXAMPLE_PREFIX = 'example_'

/** Pie de la primera lámina: «Nombre · sitio». */
export function signatureLine(sig: Signature): string | null {
  return [sig.name, sig.site].filter(Boolean).join(' · ') || null
}

/** Pie de la última lámina: el usuario de GitHub o, sin él, el sitio. */
export function handleLine(sig: Signature): string | null {
  return sig.handle ? `@${sig.handle}` : sig.site
}

/** URL pública del artículo: el blog vive en /articles/:slug del sitio (decisión de Mateo). */
export function articleUrl(sig: Signature, slug: string): string | null {
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
  const hook = a.summary ?? firstSentence(a.content.replace(/^#.*$/m, ''))
  const url = articleUrl(sig, a.slug)
  const tags = a.techs.map(t => t.slug.replace(/[^a-z0-9]/g, '')).slice(0, 4)
  const total = parts.length + 1

  const slides: SlideItem[] = [
    { index: 1, title: a.title, subtitle: hook, bullets: a.techs.map(t => t.name), metric_badge: null, code_snippet: null, footer: signatureLine(sig) },
    ...parts.map((s, i) => ({
      index: i + 2,
      title: s.heading,
      subtitle: s.lead,
      bullets: s.bullets,
      metric_badge: i === parts.length - 1 ? sig.site : null,
      code_snippet: s.code,
      footer: i === parts.length - 1 ? handleLine(sig) : null,
    })),
  ]

  return {
    id: `${EXAMPLE_PREFIX}${a.slug}`,
    title: a.title,
    topic: a.title,
    pillar: 'TECHNICAL_BREAKDOWN',
    project_slug: null,
    hook,
    linkedin_text: [hook, parts.map(s => `- ${s.heading}`).join('\n'), tags.map(t => `#${t}`).join(' ')].filter(Boolean).join('\n\n'),
    first_comment: url ?? '',
    twitter_thread: [a.title, ...parts.map(s => [s.heading, s.lead].filter(Boolean).join(': '))]
      .map((text, i) => `${i + 1}/${total} ${text}`),
    devto_title: a.title,
    devto_tags: tags,
    devto_markdown: a.content,
    carousel_slides: slides,
    status: 'draft',
    n8n_published_at: null,
    n8n_response: null,
    created_at: a.publishedAt ?? a.updatedAt,
    updated_at: a.updatedAt,
  }
}

/** Los ejemplos de esta sesión: los borradores generados y un post por artículo publicado. */
export async function fallbackContentPosts(): Promise<ContentPost[]> {
  const [sig, list] = await Promise.all([loadSignature(), resolve(articleList, {}, 'es')])
  const details = await Promise.all((list.data ?? []).map(a => resolve(articleDetail, a.slug, 'es')))
  const examples = details.flatMap(d => (d.data ? [postFromArticle(d.data, sig)] : []))
  return [...generatedPosts, ...examples]
}

export async function findContentPost(id: string): Promise<ContentPost | undefined> {
  return (await fallbackContentPosts()).find(p => p.id === id)
}

/** Borrador mínimo a partir de lo que pidió el operador: su tema, su ángulo y sus puntos clave. */
export async function generateContentPostHeuristic(req: ContentGenerateRequest): Promise<ContentPost> {
  const sig = await loadSignature()
  const topic = req.topic?.trim() || req.custom_angle?.trim() || 'Borrador sin tema'
  const angle = req.custom_angle?.trim() || topic
  const points = (req.key_points ?? []).map(p => p.trim()).filter(Boolean)
  const now = new Date().toISOString()
  const title = topic.length > 70 ? `${topic.slice(0, 67)}...` : topic
  const thread = [title, angle, ...points].filter((t, i, all) => all.indexOf(t) === i)

  const post: ContentPost = {
    id: `post_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    topic,
    pillar: req.pillar || 'TECHNICAL_BREAKDOWN',
    project_slug: req.project_slug || null,
    hook: angle,
    linkedin_text: [angle, points.map(p => `- ${p}`).join('\n')].filter(Boolean).join('\n\n'),
    first_comment: sig.website ?? '',
    twitter_thread: thread.map((t, i) => `${i + 1}/${thread.length} ${t}`),
    devto_title: title,
    devto_tags: [],
    devto_markdown: [`## ${title}`, angle, points.map(p => `- ${p}`).join('\n')].filter(Boolean).join('\n\n'),
    carousel_slides: [
      { index: 1, title, subtitle: angle, bullets: [], metric_badge: null, code_snippet: null, footer: signatureLine(sig) },
      ...(points.length
        ? [{ index: 2, title, subtitle: angle, bullets: points.slice(0, 4), metric_badge: sig.site, code_snippet: null, footer: handleLine(sig) }]
        : []),
    ],
    status: 'draft',
    n8n_published_at: null,
    n8n_response: null,
    created_at: now,
    updated_at: now,
  }
  generatedPosts.unshift(post)
  return post
}
