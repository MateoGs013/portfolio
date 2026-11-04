/**
 * Lo que manda Eros cuando termina un artículo (`result` de GET /api/tasks/:id, kind «article»):
 *
 *   { topic, project_slug, trend_id, tags: [str], es: { title, summary, markdown }, en: { … }, model }
 *
 * La API lo publica sin que nadie lo revise, así que se lee a la defensiva: textos recortados, los
 * dos idiomas completos, los topes del artículo en el admin (adminSchema) y el Markdown que dibuja el
 * sitio. Una tabla o HTML suelto no se publican (el sitio no los dibuja y el HTML podría ser
 * cualquier cosa): el pedido falla diciendo por qué. Un título o una bajada largos se cortan.
 */
import { adminSchema } from '../shared/adminSchema.js'
import { text } from './erosContract.js'

type Obj = Record<string, unknown>

const isObj = (value: unknown): value is Obj => typeof value === 'object' && value !== null && !Array.isArray(value)

/** Los topes del artículo en el admin: lo que se publica se tiene que poder abrir y guardar tal cual. */
export const ARTICLE_MAX = {
  title: adminSchema.Article.title.max ?? 160,
  summary: adminSchema.Article.summary.max ?? 400,
  content: adminSchema.Article.content.max ?? 60000,
}

const TAGS_MAX = 12

export interface ArticleText {
  title: string
  summary: string
  markdown: string
}

export interface ErosArticle {
  topic: string | null
  projectSlug: string | null
  trendId: string | null
  tags: string[]
  es: ArticleText
  en: ArticleText
  model: string | null
}

export type ErosArticleResult = { ok: true, article: ErosArticle } | { ok: false, error: string }

/** Corta en el último espacio antes del tope y marca el corte con «…». */
export function clip(value: string, max: number): string {
  if (value.length <= max) return value
  const cut = value.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`
}

/** El texto sin bloques de código ni código en línea: ahí `<div>` o `a | b` son ejemplos, no marcado. */
function prose(markdown: string): string {
  return markdown.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$/gm, '').replace(/`[^`\n]*`/g, '')
}

/** Una fila de tabla de Markdown: empieza y termina con `|`, o es la línea separadora `---|---`. */
const TABLE_LINE = /^\s*\|.*\|\s*$|^\s*:?-{3,}:?\s*\|\s*:?-{3,}/m
/**
 * Una etiqueta HTML de verdad o un comentario: `<div>`, `</p>`, `<br/>`, `<!-- … -->`. Solo nombres de
 * etiquetas reales, como valida Eros: `Array<string>` o `<T>` en el texto son tipos, no marcado (y el
 * sitio los dibuja como texto, nunca como HTML).
 */
const HTML = /<\/?(?:a|abbr|article|aside|b|blockquote|br|button|code|details|div|em|figure|footer|form|h[1-6]|header|hr|i|iframe|img|input|li|link|main|meta|nav|object|ol|p|picture|pre|script|section|small|source|span|strong|style|sub|summary|sup|svg|table|tbody|td|th|thead|tr|u|ul|video)(?:\s[^<>]*)?\/?>|<!--/i

/** Por qué no se publica este Markdown, o null si se puede. */
export function markdownProblem(markdown: string): string | null {
  const plain = prose(markdown)
  if (TABLE_LINE.test(plain)) return 'trae una tabla, y el sitio no las dibuja'
  if (HTML.test(plain)) return 'trae HTML, y el sitio solo publica Markdown'
  return null
}

const LANGS = { es: 'español', en: 'inglés' } as const

function articleText(raw: unknown, lang: keyof typeof LANGS): ArticleText | string {
  const o = isObj(raw) ? raw : {}
  const title = text(o['title'])
  const summary = text(o['summary'])
  const markdown = typeof o['markdown'] === 'string' ? o['markdown'].replace(/\r\n?/g, '\n').trim() : ''
  const name = LANGS[lang]
  if (!title || !summary || !markdown) return `le falta el título, la bajada o el texto en ${name}`
  if (markdown.length > ARTICLE_MAX.content) return `el texto en ${name} pasa de ${ARTICLE_MAX.content} caracteres`
  const problem = markdownProblem(markdown)
  if (problem) return `el texto en ${name} ${problem}`
  return { title: clip(title, ARTICLE_MAX.title), summary: clip(summary, ARTICLE_MAX.summary), markdown }
}

/** Las etiquetas en minúscula, sin repetir y sin vacías (a lo sumo 12). */
function tags(value: unknown): string[] {
  const items = Array.isArray(value) ? value : []
  const out = new Set<string>()
  for (const item of items) {
    const tag = text(item)?.toLowerCase()
    if (tag && tag.length <= 40) out.add(tag)
  }
  return [...out].slice(0, TAGS_MAX)
}

/** El resultado de Eros listo para publicar, o por qué no se publica (para el motivo del pedido). */
export function normalizeErosArticle(payload: unknown): ErosArticleResult {
  const raw = isObj(payload) && isObj(payload['article']) ? payload['article'] : payload
  if (!isObj(raw)) return { ok: false, error: 'Eros terminó sin mandar el artículo.' }
  const es = articleText(raw['es'], 'es')
  const en = articleText(raw['en'], 'en')
  if (typeof es === 'string' || typeof en === 'string') {
    const problem = typeof es === 'string' ? es : en
    return { ok: false, error: `Eros mandó un artículo que no se puede publicar: ${String(problem)}.` }
  }
  return {
    ok: true,
    article: {
      topic: text(raw['topic']),
      projectSlug: text(raw['project_slug'])?.toLowerCase() ?? null,
      trendId: text(raw['trend_id']),
      tags: tags(raw['tags']),
      es,
      en,
      model: text(raw['model']),
    },
  }
}
