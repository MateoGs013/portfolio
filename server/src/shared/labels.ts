/**
 * Rótulos de los enums de la base, en español y en inglés. Es la única fuente: el sitio los lee desde
 * el diccionario de interfaz (app/lib/dict/common.ts los reexporta con sus claves de siempre), el
 * admin los recibe en GET /api/admin/meta y los mensajes de error los usan para nombrar las opciones.
 *
 * Vive en server/ porque el API la usa en tiempo de ejecución y Dockerfile.api no copia app/.
 * scripts/check-admin-schema.mjs falla si un valor de un enum de prisma/schema.prisma no tiene rótulo.
 */
import type { ArticleStatus, ExperienceKind, MediaKind, MediaRole, MediaViewport, ProjectStatus, TechCategory } from '../../generated/prisma/enums.js'
import type { MetricUnit } from './metricUnits.js'

export interface Label {
  readonly es: string
  readonly en: string
}

type Labels<K extends string> = Readonly<Record<K, Label>>

export const projectStatusLabels = {
  LIVE: { es: 'En producción', en: 'Live' },
  WIP: { es: 'En desarrollo', en: 'In development' },
  ARCHIVED: { es: 'Archivado', en: 'Archived' },
} as const satisfies Labels<ProjectStatus>

export const articleStatusLabels = {
  DRAFT: { es: 'Borrador', en: 'Draft' },
  PUBLISHED: { es: 'Publicado', en: 'Published' },
  ARCHIVED: { es: 'Archivado', en: 'Archived' },
} as const satisfies Labels<ArticleStatus>

export const techCategoryLabels = {
  LANGUAGE: { es: 'Lenguajes', en: 'Languages' },
  FRAMEWORK: { es: 'Frameworks', en: 'Frameworks' },
  MOTION: { es: 'Movimiento', en: 'Motion' },
  GRAPHICS: { es: 'Gráficos', en: 'Graphics' },
  BACKEND: { es: 'Backend', en: 'Backend' },
  DATA: { es: 'Datos', en: 'Data' },
  TOOLING: { es: 'Herramientas', en: 'Tooling' },
  DESIGN: { es: 'Diseño', en: 'Design' },
} as const satisfies Labels<TechCategory>

export const mediaKindLabels = {
  IMAGE: { es: 'Imagen', en: 'Image' },
  VIDEO: { es: 'Video', en: 'Video' },
} as const satisfies Labels<MediaKind>

export const mediaRoleLabels = {
  COVER: { es: 'Portada', en: 'Cover' },
  GALLERY: { es: 'Galería', en: 'Gallery' },
} as const satisfies Labels<MediaRole>

export const mediaViewportLabels = {
  DESKTOP: { es: 'Escritorio', en: 'Desktop' },
  MOBILE: { es: 'Celular', en: 'Mobile' },
} as const satisfies Labels<MediaViewport>

export const experienceKindLabels = {
  EDUCATION: { es: 'Formación', en: 'Education' },
  THESIS: { es: 'Tesis', en: 'Thesis' },
  FREELANCE: { es: 'Freelance', en: 'Freelance' },
  CLIENT: { es: 'Cliente', en: 'Client' },
  PERSONAL: { es: 'Proyecto propio', en: 'Personal project' },
} as const satisfies Labels<ExperienceKind>

/** Nombre de cada unidad, para elegirla en el admin. */
export const metricUnitLabels = {
  s: { es: 'Segundos', en: 'Seconds' },
  ms: { es: 'Milisegundos', en: 'Milliseconds' },
  kb: { es: 'Kilobytes', en: 'Kilobytes' },
  fps: { es: 'Cuadros por segundo', en: 'Frames per second' },
  h: { es: 'Horas', en: 'Hours' },
  req_day: { es: 'Consultas por día', en: 'Requests per day' },
  usd_month: { es: 'Dólares por mes', en: 'Dollars per month' },
} as const satisfies Labels<MetricUnit>

/** Cómo se escribe un valor con su unidad: `{n}` es el número ya formateado. */
export const metricUnitFormats = {
  s: { es: '{n} s', en: '{n} s' },
  ms: { es: '{n} ms', en: '{n} ms' },
  kb: { es: '{n} KB', en: '{n} KB' },
  fps: { es: '{n} fps', en: '{n} fps' },
  h: { es: '{n} h', en: '{n} h' },
  req_day: { es: '{n}/día', en: '{n}/day' },
  usd_month: { es: '{n}/mes', en: '{n}/month' },
} as const satisfies Labels<MetricUnit>

/** Cada enum con sus rótulos, por el nombre que tiene en prisma/schema.prisma. */
export const enumLabels = {
  ProjectStatus: projectStatusLabels,
  ArticleStatus: articleStatusLabels,
  TechCategory: techCategoryLabels,
  MediaKind: mediaKindLabels,
  MediaRole: mediaRoleLabels,
  MediaViewport: mediaViewportLabels,
  ExperienceKind: experienceKindLabels,
  MetricUnit: metricUnitLabels,
} as const

export type EnumName = keyof typeof enumLabels

/** El rótulo en español de un valor, o el valor tal cual si el enum no lo conoce. */
export function labelOf(name: EnumName, value: string): string {
  const labels: Readonly<Record<string, Label>> = enumLabels[name]
  return labels[value]?.es ?? value
}

/** Claves del diccionario de interfaz con un prefijo: `prefixed('status', …)` → `status.LIVE`. */
export function prefixed<P extends string, K extends string>(prefix: P, labels: Labels<K>): Record<`${P}.${K}`, Label> {
  return Object.fromEntries(Object.entries(labels).map(([key, label]) => [`${prefix}.${key}`, label])) as Record<`${P}.${K}`, Label>
}
