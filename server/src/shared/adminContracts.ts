/**
 * Contrato de /api/admin/* que comparten el servidor y el admin (el admin lo importa con
 * `import type`): meta, estado, colecciones, impacto de un borrado y la forma de los errores.
 */
import type { adminSchema, FieldDescriptor, ModelName } from './adminSchema.js'
import type { DocBlock, DocBlockType, DocKey } from './docSchema.js'
import type { EnumName, Label } from './labels.js'

// ─── Errores ────────────────────────────────────────────────────────────────

/** Un campo que no pasó: `path` con la notación del body (`links[0].url`, `translations.en.title`). */
export interface FieldIssue {
  path: string
  message: string
}

export type AdminErrorCode =
  | 'invalid' // 400: revisar los campos de `errors`
  | 'conflict' // 409: choca con otro registro (una dirección repetida)
  | 'in_use' // 409: otro registro depende de este o apunta a uno que ya no existe
  | 'not_found' // 404
  | 'too_large' // 413
  | 'unauthorized' // 401
  | 'db_unavailable' // 503: la base no responde
  | 'offline' // 503: Eros no responde
  | 'eros_auth' // 502: Eros responde pero rechaza EROS_API_KEY
  | 'internal' // 500

/** Todo error del admin: `error` en español para mostrar tal cual, `errors` por campo (puede venir vacío). */
export interface AdminErrorBody {
  error: string
  code: AdminErrorCode
  errors: FieldIssue[]
}

// ─── Colecciones ────────────────────────────────────────────────────────────

/** Cada colección del admin con su ruta en /api/admin y su modelo en adminSchema. */
export const adminCollections = {
  projects: { path: 'projects', model: 'Project' },
  experience: { path: 'experience', model: 'Experience' },
  techs: { path: 'techs', model: 'Tech' },
  orgs: { path: 'orgs', model: 'Org' },
  articles: { path: 'articles', model: 'Article' },
  docs: { path: 'docs', model: 'Doc' },
} as const satisfies Record<string, { path: string, model: ModelName }>

export type AdminCollection = keyof typeof adminCollections

/** PATCH /:colección/:id/slug — la única forma de cambiar una dirección. */
export interface SlugChangeBody {
  slug: string
}

/** PATCH /experience/order — las entradas del CV en orden; el resto queda fuera del CV. */
export interface ExperienceOrderBody {
  ids: number[]
}

/** Registro del admin con su fila de inglés (vacía si nunca se tradujo). */
export type WithEnglish<T, E> = T & { translations: (E & { locale: 'en' })[] }

// ─── Meta ───────────────────────────────────────────────────────────────────

export interface EnumOption {
  value: string
  label: string
}

/** Conteos con las mismas reglas de visibilidad que la API pública (content/visibility.ts). */
export interface AdminSummary {
  projects: { visible: number, hidden: number, scheduled: number }
  articles: { published: number, draft: number }
  experience: { total: number, cv: number }
  stack: number
  orgs: number
}

export interface OrgOption { id: number, name: string, slug: string }
export interface TechOption { id: number, name: string, slug: string, category: string }
export interface ProjectOption { id: number, title: string, slug: string, status: string, visible: boolean }
export interface ExperienceOption { id: number, title: string, slug: string, kind: string, cvOrder: number | null }
export interface ArticleOption { id: number, title: string, slug: string, status: string }

export interface AdminOptions {
  orgs: OrgOption[]
  techs: TechOption[]
  projects: ProjectOption[]
  experiences: ExperienceOption[]
  articles: ArticleOption[]
}

/** Una clave del catálogo de métricas (shared/metricKeys.ts), con su rótulo y qué mide. */
export interface MetricKeyOption {
  key: string
  label: Label
  desc: Label
  /** Cuántas métricas de la base la usan. */
  uses: number
}

/** Una clave que alguna obra usa y el catálogo no conoce: se muestra con su rótulo propio. */
export interface UnlistedMetricKey {
  key: string
  /** El primer rótulo propio cargado con esa clave, si lo hay. */
  label: string | null
  uses: number
}

/**
 * Un registro con textos en español sin su inglés. `fields` son rutas del body con el que se guarda:
 * `translations.en.outcome`, `steps[0].translations.en.body`, `translations.en.highlights[1]`,
 * `metrics[2].translations.en.label`, `media[0].en.alt` (PATCH /media/:id) o `fields.headline.en` (docs).
 */
export interface UntranslatedRecord {
  collection: 'projects' | 'experience' | 'techs' | 'articles' | 'docs'
  /** El id del registro; en los documentos, su clave (about o contact). */
  id: number | DocKey
  title: string
  fields: string[]
}

export type AdminSchema = { readonly [M in ModelName]: Readonly<Record<keyof (typeof adminSchema)[M], FieldDescriptor>> }

/**
 * GET /api/admin/meta. `counts` y `enums` (valores sueltos) son las claves que lee el admin actual:
 * se conservan hasta que el admin nuevo lo reemplace (S1). El admin nuevo usa `summary` y `enumOptions`.
 */
export interface AdminMeta {
  summary: AdminSummary
  enumOptions: Record<EnumName, EnumOption[]>
  schema: AdminSchema
  models: Partial<Record<ModelName, { one: string, another: string }>>
  options: AdminOptions
  /** El catálogo de claves de métricas y las claves usadas que no están en él. */
  metricKeys: { catalog: MetricKeyOption[], unlisted: UnlistedMetricKey[] }
  /** Lo que tiene español sin inglés (translations.ts, viñeta por viñeta). */
  untranslated: UntranslatedRecord[]
  /** @deprecated hasta S1: conteos totales sin visibilidad. */
  counts: Record<string, number>
  /** @deprecated hasta S1: los valores sin rótulo. */
  enums: Record<EnumName, string[]>
}

// ─── Documentos ─────────────────────────────────────────────────────────────

/** Un bloque de about o contact tal como lo edita el admin: `en` solo en los que lo admiten. */
export interface AdminDocField {
  name: string
  type: DocBlockType | string
  value: string | string[]
  en?: string | string[]
  wide?: boolean
}

/**
 * GET y PUT /api/admin/docs/:key. `schema` son los bloques requeridos en orden; `missing`, los
 * requeridos que la base todavía no tiene (se crean al guardarlos). Los bloques libres van en `fields`
 * después de los requeridos.
 */
export interface AdminDoc {
  key: DocKey
  title: string
  fields: AdminDocField[]
  schema: readonly DocBlock[]
  missing: string[]
  updatedAt: string | null
}

// ─── Estado ─────────────────────────────────────────────────────────────────

/**
 * ok: responde · cooldown: falló seguido y se espera `retryInSec` antes de volver a probar ·
 * down: el último pedido falló · unconfigured: no hay dirección de Eros en el entorno.
 */
/** 'auth': Eros responde pero rechaza EROS_API_KEY (hasta la próxima respuesta buena). */
export type ErosState = 'ok' | 'cooldown' | 'down' | 'unconfigured' | 'auth'

/** GET /api/admin/status. */
export interface AdminStatus {
  db: { ok: boolean, checkedAt: string }
  eros: { state: ErosState, retryInSec: number }
}

// ─── Impacto ────────────────────────────────────────────────────────────────

export interface ImpactItem {
  id: number
  title: string
  slug: string
}

/** GET /orgs/:id/impact y /techs/:id/impact: qué registros dependen de este antes de borrarlo. */
export interface AdminImpact {
  id: number
  name: string
  slug: string
  projects: ImpactItem[]
  experiences: ImpactItem[]
  articles: ImpactItem[]
  total: number
}

/** DELETE /orgs/:id y /techs/:id (con ?reassignTo= opcional). */
export interface DeleteResult {
  deleted: number
  reassignedTo: number | null
  moved: number
}
