/**
 * Contrato de /api/admin/content/* (Publicaciones) y /api/admin/radar/* (Tendencias) que comparten el
 * servidor y el admin (el admin lo importa con `import type`, y los rótulos como valores). Es la forma
 * que responde el servidor, venga de Eros (normalizada en server/src/admin/erosContentContract.ts) o
 * de la muestra de EROS_DEMO. Lo que Eros no trae va en null: nunca un valor inventado.
 */

/** De dónde salió una respuesta: Eros o la muestra de pruebas (EROS_DEMO). Sin Eros no hay respaldo. */
export type ContentSource = 'eros' | 'demo'

// ─── Publicaciones ──────────────────────────────────────────────────────────

export const postStatuses = ['draft', 'approved', 'published', 'rejected'] as const
export type PostStatus = (typeof postStatuses)[number]

export const postStatusLabels: Readonly<Record<PostStatus, string>> = {
  draft: 'Borrador',
  approved: 'Aprobada',
  published: 'Publicada',
  rejected: 'Descartada',
}

/**
 * El enfoque editorial con el que Eros escribe la publicación: los valores de `ContentPillar` de Eros
 * (eros-agent/src/eros/content/models.py), tal cual, con su rótulo en español. Sin enfoque, Eros
 * escribe con el de arquitectura (`DEFAULT_PILLAR`).
 */
export const postPillars = ['architecture', 'production_lessons', 'performance_optimization', 'ai_agent_ops', 'fullstack_engineering'] as const
export type PostPillar = (typeof postPillars)[number]

export const postPillarLabels: Readonly<Record<PostPillar, string>> = {
  architecture: 'Arquitectura',
  production_lessons: 'Lecciones de producción',
  performance_optimization: 'Rendimiento',
  ai_agent_ops: 'Agentes de IA en producción',
  fullstack_engineering: 'Ingeniería full stack',
}

/** El enfoque que usa Eros cuando no se elige ninguno (y el que se manda desde una tendencia sin elegir). */
export const DEFAULT_PILLAR: PostPillar = 'architecture'

/** Por dónde despacha n8n una publicación aprobada. */
export const publishChannels = ['all', 'linkedin', 'twitter', 'devto'] as const
export type PublishChannel = (typeof publishChannels)[number]

export const publishChannelLabels: Readonly<Record<PublishChannel, string>> = {
  all: 'todos los canales',
  linkedin: 'LinkedIn',
  twitter: 'X (hilo)',
  devto: 'Dev.to',
}

const isOneOf = <T extends string>(options: readonly T[]) => (value: unknown): value is T =>
  typeof value === 'string' && (options as readonly string[]).includes(value)

export const isPostStatus = isOneOf(postStatuses)
export const isPostPillar = isOneOf(postPillars)
export const isPublishChannel = isOneOf(publishChannels)

/** Una lámina del carrusel de LinkedIn (4:5). */
export interface CarouselSlide {
  index: number
  title: string
  subtitle: string | null
  bullets: string[]
  metric_badge: string | null
  code_snippet: string | null
  footer: string | null
}

/** Una publicación en sus cuatro formatos: LinkedIn, hilo de X, Dev.to y carrusel. */
export interface ContentPost {
  id: string
  title: string
  topic: string | null
  /** null si Eros mandó un enfoque que el admin no conoce. */
  pillar: PostPillar | null
  /** La obra de la base de la que habla, si la hay. */
  project_slug: string | null
  hook: string | null
  linkedin_text: string
  first_comment: string | null
  twitter_thread: string[]
  devto_title: string | null
  devto_tags: string[]
  devto_markdown: string
  carousel_slides: CarouselSlide[]
  status: PostStatus
  /** Cuándo la despachó n8n; null si nunca salió. */
  dispatched_at: string | null
  created_at: string | null
  updated_at: string | null
  _source: ContentSource
  /** Solo en la muestra de EROS_DEMO: sale de un artículo que ya está en el blog. */
  demo?: true
}

/**
 * POST /content/generate { topic, custom_angle?, pillar?, project_slug?, key_points? }: lo que manda el
 * admin. El servidor se lo pasa a Eros como `{ topic, pillar?, project_slug?, custom_instructions? }`
 * (los puntos y el ángulo van dentro de `custom_instructions`; sin enfoque, `pillar` no va).
 */
export interface GenerateRequest {
  topic: string
  custom_angle: string | null
  pillar: PostPillar | null
  project_slug: string | null
  key_points: string[]
}

export interface PostResult {
  ok: true
  post: ContentPost | null
}

/**
 * Qué hizo Eros al publicar: 'published' si se la pasó a n8n y n8n la aceptó; 'approved_local' si
 * n8n no está configurado en Eros y solo la marcó como aprobada (no salió a ninguna red).
 */
export type DispatchStatus = 'published' | 'approved_local'

/**
 * POST /content/posts/:id/publish { channel } (n8n). `channel` es lo que se pidió: hoy Eros no lo
 * respeta (el workflow de n8n decide), así que no dice por dónde salió.
 */
export interface DispatchResult {
  ok: true
  channel: PublishChannel
  status: DispatchStatus
  dispatched_at: string | null
}

/** POST /content/posts/:id/publish-to-blog → 201: el borrador creado, para abrirlo en Artículos. */
export interface BlogDraft {
  article: { id: number, slug: string }
}

// ─── Tendencias ─────────────────────────────────────────────────────────────

export const trendStatuses = ['DISCOVERED', 'GENERATED', 'DISCARDED'] as const
export type TrendStatus = (typeof trendStatuses)[number]

export const trendStatusLabels: Readonly<Record<TrendStatus, string>> = {
  DISCOVERED: 'Nueva',
  GENERATED: 'Con publicación',
  DISCARDED: 'Descartada',
}

export const isTrendStatus = isOneOf(trendStatuses)

/** Rótulo de las fuentes que recorre el radar; una fuente que no está acá se muestra con su código. */
export const trendSourceLabels: Readonly<Record<string, string>> = {
  HACKER_NEWS: 'Hacker News',
  DEVTO: 'Dev.to',
  GITHUB: 'GitHub',
  TECH_RSS: 'Blogs técnicos',
}

/** Una nota de terceros que detectó el radar. */
export interface Trend {
  id: string
  title: string
  /** Código de la fuente en mayúsculas (HACKER_NEWS, DEVTO…); ver trendSourceLabels. */
  source: string
  url: string | null
  summary: string | null
  /** Cuándo la detectó el radar; null si Eros no lo dijo. */
  detected_at: string | null
  status: TrendStatus
  /** Afinidad que calculó Eros (0–100); null si no la trae. */
  relevance_score: number | null
  engineering_angle: string | null
  tags: string[]
  /** La publicación que se creó desde esta tendencia, si la hay. */
  post_id: string | null
  _source: ContentSource
  demo?: true
}

/** POST /radar/scan. */
export interface TrendScan {
  total_found: number
  new_trends: number
  trends: Trend[]
}

export interface TrendChange {
  ok: true
  trend: Trend | null
}

/** POST /radar/trends/:id/generate. */
export interface TrendPost {
  ok: true
  trend_id: string
  post: ContentPost | null
}
