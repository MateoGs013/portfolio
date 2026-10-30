/** Formas del contenido del seed. Todo en español: el inglés llega por seed/en.ts. */
import type { ExperienceKind, ProjectStatus } from '../../generated/prisma/client.js'
import type { MetricInput } from './metrics.js'
import type { TechSlug } from './stack.js'

/** Fecha de publicación de las obras visibles: fija, para que el seed sea reproducible. */
export const PUBLISHED_AT = new Date('2026-10-05T12:00:00.000Z')

/** Portada de imagen. Ancho, alto y peso se leen del archivo en public/ al cargar (seed/files.ts). */
export interface SeedCover {
  src: string
  alt: string
  /** Color característico (hex), calculado con el algoritmo de plan §4. */
  tint: string | null
}

export interface SeedProject {
  slug: string
  title: string
  year: number
  role: string
  status: ProjectStatus
  featured: boolean
  /** Solo las obras con `published` tienen publishedAt y se ven en el sitio. */
  published: boolean
  summary: string
  brief: string | null
  outcome: string | null
  url: string | null
  repo: string | null
  org: string | null
  techs: TechSlug[]
  metrics: Record<string, MetricInput>
  links: { label: string, url: string }[]
  steps: { title: string, body: string }[]
  cover: SeedCover | null
}

export interface SeedExperience {
  slug: string
  kind: ExperienceKind
  org: string | null
  role: string
  startedAt: string
  endedAt: string | null
  summary: string
  story: string | null
  /** Viñetas del CV: hasta 3, de 160 caracteres como máximo (cota A4). */
  highlights: string[]
  /** NULL = la ciudad de la org; sin org, el CV dice remoto. */
  location: string | null
  /** Posición en la experiencia del CV. NULL = no entra en esa sección. */
  cvOrder: number | null
  techs: TechSlug[]
  /** Obras ligadas, en pares explícitos. */
  projects: string[]
}
