/**
 * Lo que una colección le cuenta al marco común (features/collections/): cómo se llama, dónde vive
 * en /api/admin, cómo pasa del registro al formulario y de vuelta, cómo se muestra en la lista y en
 * qué secciones se edita. Explorer, EditorFrame, useCollection y useEditor no saben nada más de ella.
 */
import type { FieldIssue } from '@shared/adminContracts'
import type { ModelName } from '@shared/adminSchema'
import type { RouteLocationRaw } from 'vue-router'
import type { StatusTone } from '../ui/StatusDot.vue'

/** Género gramatical del nombre: arma «Nueva empresa» y «Artículo guardado» sin escribirlos a mano. */
export type Gender = 'f' | 'm'

export interface ModelNoun {
  /** En minúscula, como va en una frase: «empresa». */
  one: string
  /** «empresas», para la lista y los conteos. */
  many: string
  gender: Gender
}

/** Un registro de cualquier colección: el id lo pone la base. */
export interface AdminRecord {
  id: number
}

export interface RecordStatus {
  tone: StatusTone
  label: string
}

/** Una sección del editor (una pestaña): las rutas de los campos que viven ahí, en orden. */
export interface ModelSection {
  id: string
  label: string
  /**
   * Rutas del payload, en el orden del formulario. Un error en `links[2].url` cae en la sección que
   * lista `links`; `translations.en.title` cae en la que lista `title` o `translations`.
   */
  fields: readonly string[]
}

/** Un filtro de la lista (?filtro=): texto con su conteo. El primero es «todas» y no filtra. */
export interface ModelFilter<TRecord> {
  id: string
  label: string
  test(record: TRecord): boolean
}

/** Un ítem de la checklist de publicación: navega a su campo con ?campo=. */
export interface ChecklistItem {
  id: string
  label: string
  done: boolean
  /** Ruta del campo que lo completa. */
  field: string
}

/** Las direcciones del área dentro del admin (por hash). */
export interface ModelRoutes {
  list: RouteLocationRaw
  record(id: number): RouteLocationRaw
  /** Sin esto la colección no se crea desde su lista (los catálogos se crean en línea). */
  create?: RouteLocationRaw
}

export interface Model<TRecord extends AdminRecord, TForm extends object> {
  /** Única en el admin: arma las claves del borrador y del guardado (`orgs:12`). */
  key: string
  /** Ruta en /api/admin, sin barra final: `/orgs`. */
  path: string
  /** Modelo de adminSchema: rótulos, topes y obligatorios para validar antes de mandar. */
  schema: ModelName
  noun: ModelNoun
  routes: ModelRoutes
  /** false si la API no tiene GET /:path/:id: el registro se busca en la lista. */
  detail?: boolean
  /** Formulario de un registro nuevo. */
  blank(): TForm
  toForm(record: TRecord): TForm
  /** El body del POST (record null) o del PUT. */
  toPayload(form: TForm, record: TRecord | null): Record<string, unknown>
  /** Reglas propias, además del esquema (fechas en orden, una portada…). Mismo formato que el servidor. */
  validate?(form: TForm, record: TRecord | null): FieldIssue[]
  /** El título humano: encabeza el editor y la fila. */
  title(record: TRecord): string
  /** El título mientras se edita (sale del formulario: cambia al escribir). */
  formTitle(form: TForm): string
  metaLine(record: TRecord): string
  /** La cifra al margen de la fila («3 obras»). */
  aside?(record: TRecord): string
  status?(record: TRecord): RecordStatus | null
  /** Dónde se ve en el sitio; null si todavía no se ve. */
  publicUrl?(record: TRecord): string | null
  sections: readonly ModelSection[]
  filters?: readonly ModelFilter<TRecord>[]
  /** Texto que también encuentra el registro en la búsqueda de la lista (slug, ciudad…). */
  keywords?(record: TRecord): string
  /** PATCH de la dirección («Cambiar dirección»): `/orgs/12/slug`. */
  slugEndpoint?(id: number): string
  /** Cómo se lee la dirección en el sitio: `/projects/la-rucula`, `/projects?org=acme`. */
  slugPreview?(slug: string): string
  /** Tiene GET /:id/impact y DELETE ?reassignTo= (empresas y tecnologías). */
  impact?: boolean
  /** La checklist de publicación, si la colección se publica (obras, artículos). */
  checklist?(form: TForm, record: TRecord | null): ChecklistItem[]
}

/**
 * Cualquier modelo, para lo que no depende de sus tipos. Las funciones van como métodos: así un
 * Model<Org, OrgForm> entra donde se pide un modelo cualquiera.
 */
export type AnyModel = Model<AdminRecord, object>
