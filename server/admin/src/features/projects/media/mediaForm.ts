/**
 * La media de una obra en el formulario: de lo guardado a MediaForm y las reglas que el servidor no
 * puede revisar antes de subir (texto alternativo y color de cada pieza).
 *
 * El orden es el del sitio: primero las portadas, después la galería, cada grupo por su posición (de
 * ahí sale el `order` que se guarda, mediaRun.ts), y una sola portada por tipo:
 * marcar otra pasa la anterior al final de la galería, como hace el servidor (media.ts, demoteCovers).
 */
import type { FieldIssue } from '@shared/adminContracts'
import type { AdminMedia, MediaForm, MediaKind } from '../types'
import { mediaText } from './dict'

export const ALT_MAX = 300
export const HEX = /^#[0-9a-f]{6}$/i

const text = (value: string | null | undefined) => value ?? ''

export const keyOfId = (id: number) => `m${id}`

export function mediaFormOf(media: AdminMedia): MediaForm {
  const en = media.translations[0]
  return {
    key: keyOfId(media.id),
    id: media.id,
    kind: media.kind,
    role: media.role,
    viewport: media.viewport,
    alt: media.alt,
    caption: text(media.caption),
    tint: text(media.tint),
    upload: { file: null, webm: null, poster: null },
    translations: { en: { alt: text(en?.alt), caption: text(en?.caption) } },
  }
}

/** Lo guardado en el orden del sitio: portadas y después galería, cada grupo por su `order`. */
export function mediaListOf(media: readonly AdminMedia[]): MediaForm[] {
  const rank = (m: AdminMedia) => (m.role === 'COVER' ? 0 : 1)
  return [...media]
    .sort((a, b) => rank(a) - rank(b) || a.order - b.order || a.id - b.id)
    .map(mediaFormOf)
}

/** Portadas primero, sin cambiar el orden relativo dentro de cada grupo. */
export function coversFirst(list: MediaForm[]): void {
  const sorted = [...list.filter(m => m.role === 'COVER'), ...list.filter(m => m.role === 'GALLERY')]
  list.splice(0, list.length, ...sorted)
}

export function hasCover(list: readonly MediaForm[], kind: MediaKind): boolean {
  return list.some(m => m.kind === kind && m.role === 'COVER')
}

/**
 * Hace portada a `item`: la portada anterior del mismo tipo pasa al final de la galería. Devuelve
 * la que se desplazó, para avisarlo.
 */
export function makeCover(list: MediaForm[], item: MediaForm): MediaForm | null {
  const previous = list.find(m => m !== item && m.kind === item.kind && m.role === 'COVER') ?? null
  item.role = 'COVER'
  if (previous) {
    previous.role = 'GALLERY'
    list.splice(list.indexOf(previous), 1)
    list.push(previous)
  }
  coversFirst(list)
  return previous
}

export function makeGallery(list: MediaForm[], item: MediaForm): void {
  item.role = 'GALLERY'
  coversFirst(list)
}

/** Lo que falta o sobra en cada pieza, con la ruta de su campo. */
export function mediaIssues(list: readonly MediaForm[]): FieldIssue[] {
  return list.flatMap((m, i) => {
    const issues: FieldIssue[] = []
    const n = i + 1
    if (!m.alt.trim()) issues.push({ path: `media[${i}].alt`, message: mediaText.issues.alt(n) })
    if (m.alt.length > ALT_MAX) issues.push({ path: `media[${i}].alt`, message: mediaText.issues.long(n, ALT_MAX) })
    if (m.translations.en.alt.length > ALT_MAX) issues.push({ path: `media[${i}].translations.en.alt`, message: mediaText.issues.long(n, ALT_MAX) })
    if (m.caption.length > ALT_MAX) issues.push({ path: `media[${i}].caption`, message: mediaText.issues.long(n, ALT_MAX) })
    if (m.translations.en.caption.length > ALT_MAX) issues.push({ path: `media[${i}].translations.en.caption`, message: mediaText.issues.long(n, ALT_MAX) })
    if (m.tint.trim() && !HEX.test(m.tint.trim())) issues.push({ path: `media[${i}].tint`, message: mediaText.issues.tint(n) })
    return issues
  })
}

/** «Imagen 2», «Video 1»: el nombre de una pieza en los avisos. */
export function pieceName(list: readonly MediaForm[], item: MediaForm): string {
  return mediaText.piece(item.kind, list.indexOf(item) + 1)
}
