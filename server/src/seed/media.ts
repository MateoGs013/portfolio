/**
 * Capturas y videos de las obras (public/media/projects/<slug>/). Lo llena D4 con
 * scripts/import-captures.ts. seed.ts lo aplica al final: upsert de Media por (obra, src) y de su
 * MediaTranslation en inglés. Una entrada con el src de una portada existente la actualiza.
 *
 * - La portada en movimiento es role COVER + kind VIDEO (src mp4, srcWebm y poster).
 * - Ancho y alto se leen del archivo (en los videos, del póster); nunca se escriben a mano.
 */
import type { MediaKind, MediaRole, MediaViewport } from '../../generated/prisma/client.js'

export interface CaptureText {
  es: string
  en: string | null
}

export interface CaptureSeed {
  /** Slug de la obra. */
  project: string
  src: string
  kind: MediaKind
  role: MediaRole
  order: number
  viewport: MediaViewport
  width: number
  height: number
  bytes: number | null
  poster: string | null
  srcWebm: string | null
  tint: string | null
  alt: CaptureText
  caption: CaptureText | null
}

export const CAPTURES: CaptureSeed[] = []
