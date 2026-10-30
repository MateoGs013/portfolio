/**
 * Capturas y videos de las obras como filas Media (public/media/projects/<slug>/, copiados por
 * scripts/import-captures.ts). Qué se publica y con qué textos está en seed/captures.ts; acá se arma cada
 * fila. seed.ts las aplica al final: upsert de Media por (obra, src) y de su MediaTranslation en inglés.
 * Las portadas de imagen de seed/projects.ts entran también, para sumarles el texto alternativo en inglés:
 * su español, su archivo y su tinte siguen siendo los de projects.ts.
 *
 * - La portada en movimiento es role COVER + kind VIDEO (src mp4, srcWebm y poster).
 * - Ancho, alto y peso se leen del archivo al cargar el módulo (en los videos, del póster); nunca se
 *   escriben a mano. Si falta un archivo, el seed falla antes de tocar la base.
 */
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { MediaKind, MediaRole, MediaViewport } from '../../generated/prisma/client.js'
import { capturePath, COVER_ALT_EN, pieceFiles, WORKS, type CaptureText, type Piece, type WorkCaptures } from './captures.js'
import { imageFile } from './files.js'
import { publicProjects } from './projects.js'

export type { CaptureText }

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

const PUBLIC_DIR = path.resolve('public')

const viewportOf = (name: string) => (name.startsWith('movil-') ? MediaViewport.MOBILE : MediaViewport.DESKTOP)

/** Peso de un archivo servido; falla si no existe. */
async function fileBytes(src: string): Promise<number> {
  return (await stat(path.join(PUBLIC_DIR, src))).size
}

interface Placement {
  kind: MediaKind
  role: MediaRole
  order: number
  tint: string | null
}

async function pieceSeed(project: string, piece: Piece | WorkCaptures['cover'], { kind, ...placement }: Placement): Promise<CaptureSeed> {
  const base = { project, ...placement, viewport: viewportOf(piece.name), alt: piece.alt, caption: piece.caption }
  const files = pieceFiles(piece.name, kind === MediaKind.VIDEO)
  const src = capturePath(project, files.src)
  if (!files.poster || !files.srcWebm) {
    const { width, height, bytes } = await imageFile(src)
    return { ...base, src, kind, width, height, bytes, poster: null, srcWebm: null }
  }
  const srcWebm = capturePath(project, files.srcWebm)
  const poster = capturePath(project, files.poster)
  const [{ width, height }, bytes] = await Promise.all([imageFile(poster), fileBytes(src), fileBytes(srcWebm)])
  return { ...base, src, kind, width, height, bytes, poster, srcWebm }
}

async function loadCaptures(): Promise<CaptureSeed[]> {
  const out: Promise<CaptureSeed>[] = []
  for (const p of publicProjects) {
    const cover = p.cover
    if (cover) {
      out.push(imageFile(cover.src).then(({ width, height, bytes }) => ({
        project: p.slug,
        src: cover.src,
        kind: MediaKind.IMAGE,
        role: MediaRole.COVER,
        order: 0,
        viewport: MediaViewport.DESKTOP,
        width,
        height,
        bytes,
        poster: null,
        srcWebm: null,
        tint: cover.tint,
        alt: { es: cover.alt, en: COVER_ALT_EN[p.slug] ?? null },
        caption: null,
      })))
    }
    const work = WORKS[p.slug]
    if (!work) continue
    // La portada en movimiento va después de la de imagen y comparte su tinte.
    out.push(pieceSeed(p.slug, work.cover, { kind: MediaKind.VIDEO, role: MediaRole.COVER, order: 1, tint: cover?.tint ?? null }))
    work.gallery.forEach((piece, i) => out.push(pieceSeed(p.slug, piece, {
      kind: piece.video ? MediaKind.VIDEO : MediaKind.IMAGE,
      role: MediaRole.GALLERY,
      order: i + 1,
      tint: null,
    })))
  }
  return Promise.all(out)
}

export const CAPTURES: CaptureSeed[] = await loadCaptures()
