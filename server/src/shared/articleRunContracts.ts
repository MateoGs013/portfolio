/**
 * Contrato de /api/admin/articles/generate y /api/admin/articles/runs: los pedidos de artículos a Eros
 * que la API publica sola (los lunes, desde Artículos o desde una tendencia). Lo comparten el servidor
 * (server/src/admin/articleRuns.ts) y el admin, que importa los tipos y los rótulos como valores: este
 * archivo no importa nada.
 */

/** Quién pidió el artículo: el horario de los lunes, el admin o una tendencia del radar. */
export const articleRunTriggers = ['weekly', 'manual', 'trend'] as const
export type ArticleRunTrigger = (typeof articleRunTriggers)[number]

/** Escribiendo (Eros trabaja), publicado o fallido. */
export const articleRunStatuses = ['running', 'done', 'failed'] as const
export type ArticleRunStatus = (typeof articleRunStatuses)[number]

export const articleRunTriggerLabels: Readonly<Record<ArticleRunTrigger, string>> = {
  weekly: 'El de los lunes',
  manual: 'Pedido desde Artículos',
  trend: 'Pedido desde una tendencia',
}

const isOneOf = <T extends string>(options: readonly T[]) => (value: unknown): value is T =>
  typeof value === 'string' && (options as readonly string[]).includes(value)

export const isArticleRunTrigger = isOneOf(articleRunTriggers)
export const isArticleRunStatus = isOneOf(articleRunStatuses)

/** El tope del tema que se le pide a Eros (el de su contrato). */
export const ARTICLE_TOPIC_MAX = 300

/** El artículo que publicó un pedido: para abrirlo en su editor o en el sitio. */
export interface ArticleRunArticle {
  id: number
  slug: string
  title: string
}

/** Un pedido de artículo a Eros, como lo responde el servidor. Lo que no hay va en null. */
export interface ArticleRunView {
  id: number
  trigger: ArticleRunTrigger
  status: ArticleRunStatus
  topic: string | null
  projectSlug: string | null
  trendId: string | null
  /** Qué pasó si falló, en español. */
  error: string | null
  /** El `error_code` de Eros (`llm_unavailable`, `llm_output_invalid`) o uno del servidor (`offline`, `invalid_output`, `cut`). */
  errorCode: string | null
  startedAt: string
  finishedAt: string | null
  /** El artículo publicado; null mientras escribe, si falló o si después se borró. */
  article: ArticleRunArticle | null
}

/** POST /articles/generate: todo opcional. Sin tema, Eros elige uno que no repita lo publicado. */
export interface ArticleGenerateRequest {
  topic?: string | null
  projectSlug?: string | null
  trendId?: string | null
}

/** POST /articles/generate → 202 y GET /articles/runs/:id. */
export interface ArticleRunReply {
  run: ArticleRunView
}

/** GET /articles/runs?limit=: los últimos pedidos, el próximo lunes (null si está apagado) y si está encendido. */
export interface ArticleRunList {
  runs: ArticleRunView[]
  next: string | null
  weekly: boolean
}
