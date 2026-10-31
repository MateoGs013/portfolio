/**
 * Qué se publica de las capturas de cada obra (docs/rediseno/capturar.mjs) y con qué textos.
 * Reemplaza los mapas HERO, MAIN_VIDEO, ORDER, SKIP y CAPTION de docs/rediseno/movimiento.html.
 * Datos puros, sin leer archivos: scripts/import-captures.ts los usa para saber qué copiar antes de que
 * seed/media.ts lea los tamaños de public/.
 *
 * - La portada de imagen es la de seed/projects.ts (en la-rucula, argpiscinas y barberpole, su hero.webp).
 * - La galería sigue el recorrido de un visitante real, no el orden alfabético: primero los videos
 *   secundarios, después las capturas de escritorio y al final las del teléfono ('movil-*', viewport MOBILE).
 */
import { publicProjects } from './projects.js'

export interface CaptureText {
  es: string
  en: string | null
}

/** Una pieza de docs/rediseno/capturas/<obra>/, por su nombre de archivo sin extensión. */
export interface Piece {
  name: string
  video?: true
  alt: CaptureText
  caption: CaptureText
}

export interface WorkCaptures {
  /** El video que la tarjeta reproduce al apuntar y que crece en el caso. */
  cover: Omit<Piece, 'video' | 'caption'> & { caption: CaptureText | null }
  /** En orden de lectura. */
  gallery: Piece[]
}

/** Inglés del texto alternativo de cada portada de imagen; el español es el de seed/projects.ts. */
export const COVER_ALT_EN: Record<string, string> = {
  'la-rucula': 'La Rúcula Gastrobar home page: editorial headline over a sunset on the coast',
  'argpiscinas': 'ARG Piscinas home page: “Peace of mind and comfort for your pool” over a photograph of a finished pool',
  'ynara': 'Ynara, an adaptive on-premise AI assistant',
  'barberpole': 'barberpole home page: “Direct booking.” set in a monospaced typeface on a dark background',
  'eros': 'Eros Job Hunter in the portfolio console: list of job openings with their match percentage and the evaluation of one of them',
}

const phoneHome = (site: string, en: string): Piece => ({
  name: 'movil-hero',
  alt: { es: `Inicio de ${site} en un teléfono`, en: `${en} home page on a phone` },
  caption: { es: 'El inicio en el teléfono', en: 'The home page on a phone' },
})

/** Reemplaza los mapas HERO, MAIN_VIDEO, ORDER, SKIP y CAPTION de docs/rediseno/movimiento.html. */
export const WORKS: Record<string, WorkCaptures> = {
  'la-rucula': {
    cover: {
      name: 'scroll',
      alt: { es: 'Recorrido por el inicio de La Rúcula, de la portada al pie', en: 'Scrolling through the La Rúcula home page, from the hero to the footer' },
      caption: null,
    },
    gallery: [
      {
        name: 'intro',
        video: true,
        alt: { es: 'Animación de entrada del sitio de La Rúcula antes del inicio', en: 'Opening animation of the La Rúcula site before the home page' },
        caption: { es: 'La entrada del sitio', en: 'The site intro' },
      },
      {
        name: 'menu',
        alt: { es: 'Carta de La Rúcula con sus categorías: café, menú, bebidas, cócteles y smoothies', en: 'La Rúcula menu with its categories: coffee, food, drinks, cocktails and smoothies' },
        caption: { es: 'La carta, entrando desde el QR', en: 'The menu, opened from the table QR code' },
      },
      {
        name: 'carta',
        alt: { es: 'Categoría Menú de la carta: platos para picar con su descripción y su precio', en: 'The food category of the menu: starters with their description and price' },
        caption: { es: 'Una categoría de la carta', en: 'One category of the menu' },
      },
      {
        name: 'atardeceres',
        alt: { es: 'Página Atardeceres en La Barrosa: titular en cursiva sobre fondo oscuro', en: 'Sunsets at La Barrosa page: italic headline on a dark background' },
        caption: { es: 'Atardeceres', en: 'Sunsets' },
      },
      phoneHome('La Rúcula', 'La Rúcula'),
      {
        name: 'movil-carta',
        alt: { es: 'Categoría Menú de la carta en un teléfono, con las categorías en una fila deslizable', en: 'The food category of the menu on a phone, with the categories in a swipeable row' },
        caption: { es: 'La carta en el teléfono', en: 'The menu on a phone' },
      },
    ],
  },
  'argpiscinas': {
    cover: {
      name: 'scroll',
      alt: { es: 'Recorrido por el inicio de ARG Piscinas, de la portada al pie', en: 'Scrolling through the ARG Piscinas home page, from the hero to the footer' },
      caption: null,
    },
    gallery: [
      {
        name: 'idiomas',
        video: true,
        alt: { es: 'El inicio de ARG Piscinas cambiando entre español, inglés y alemán', en: 'The ARG Piscinas home page switching between Spanish, English and German' },
        caption: { es: 'El mismo sitio en español, inglés y alemán', en: 'The same site in Spanish, English and German' },
      },
      {
        name: 'proyectos',
        alt: { es: 'Listado de obras con buscador y filtros por categoría, ubicación y año', en: 'List of finished pools with search and filters by category, location and year' },
        caption: { es: 'Obras terminadas', en: 'Finished projects' },
      },
      {
        name: 'proyecto',
        alt: { es: 'Página de una obra: rehabilitación con lámina armada en Conil de la Frontera', en: 'A project page: a pool refurbished with reinforced membrane in Conil de la Frontera' },
        caption: { es: 'El caso de una obra', en: 'A single project' },
      },
      {
        name: 'blog',
        alt: { es: 'Blog con filtros por tema y artículos sobre mantenimiento y revestimiento de piscinas', en: 'Blog with topic filters and articles on pool maintenance and lining' },
        caption: { es: 'El blog', en: 'The blog' },
      },
      phoneHome('ARG Piscinas', 'ARG Piscinas'),
    ],
  },
  'barberpole': {
    cover: {
      name: 'scroll',
      alt: { es: 'Recorrido por el inicio de barberpole, de la portada al pie', en: 'Scrolling through the barberpole home page, from the hero to the footer' },
      caption: null,
    },
    gallery: [
      {
        name: 'portal',
        alt: { es: 'Portal de reservas de un estudio: primer paso, elegir el servicio con su duración y su precio', en: 'A studio booking portal: first step, choosing the service with its length and price' },
        caption: { es: 'El portal público de reservas', en: 'The public booking portal' },
      },
      {
        name: 'claro',
        alt: { es: 'Inicio de barberpole en modo claro: «Reserva directa.» en negro sobre blanco', en: 'barberpole home page in light mode: “Direct booking.” in black on white' },
        caption: { es: 'Modo claro', en: 'Light mode' },
      },
      phoneHome('barberpole', 'barberpole'),
      {
        name: 'movil-portal',
        alt: { es: 'Portal de reservas en un teléfono: la lista de servicios con su precio', en: 'The booking portal on a phone: the list of services with their price' },
        caption: { es: 'El portal de reservas en el teléfono', en: 'The booking portal on a phone' },
      },
    ],
  },
  // Eros no tiene sitio público: su portada es Job Hunter dentro de la consola (eros.webp en projects.ts),
  // y su video, el recorrido por sus módulos. admin-proyectos no se importa: es el CMS, no Eros.
  'eros': {
    cover: {
      name: 'admin-recorrido',
      alt: { es: 'Recorrido por Job Hunter, Contenido omnicanal y TrendRadar dentro de la consola', en: 'A walk through Job Hunter, omnichannel content and TrendRadar inside the console' },
      caption: { es: 'Recorrido por los tres módulos', en: 'A tour of the three modules' },
    },
    gallery: [
      {
        name: 'admin-hunter',
        alt: { es: 'Job Hunter: lista de vacantes con su porcentaje de match y la evaluación de una de ellas', en: 'Job Hunter: list of job openings with their match percentage and the evaluation of one of them' },
        caption: { es: 'Job Hunter: cada vacante evaluada con IA (datos de ejemplo)', en: 'Job Hunter: every opening assessed with AI (sample data)' },
      },
      {
        name: 'admin-contenido',
        alt: { es: 'Contenido omnicanal: borradores y un post con sus versiones para LinkedIn, X, Dev.to y carrusel', en: 'Omnichannel content: drafts and a post with its LinkedIn, X, Dev.to and carousel versions' },
        caption: { es: 'Contenido omnicanal: un tema, cuatro formatos', en: 'Omnichannel content: one topic, four formats' },
      },
      {
        name: 'admin-radar',
        alt: { es: 'TrendRadar: temas de Hacker News, Dev.to y GitHub con su afinidad con el stack', en: 'TrendRadar: Hacker News, Dev.to and GitHub topics with their affinity to the stack' },
        caption: { es: 'TrendRadar: temas técnicos afines al stack', en: 'TrendRadar: technical topics close to the stack' },
      },
      {
        name: 'admin-dashboard',
        alt: { es: 'Panel principal de la consola con las colecciones del portafolio y los tres módulos de Eros', en: 'Console dashboard with the portfolio collections and the three Eros modules' },
        caption: { es: 'Eros dentro de la consola del portafolio', en: 'Eros inside the portfolio console' },
      },
      {
        name: 'admin-paleta',
        alt: { es: 'Paleta de comandos abierta sobre la consola, con las secciones y sus conteos', en: 'Command palette open over the console, with the sections and their counts' },
        caption: { es: 'Paleta de comandos', en: 'Command palette' },
      },
    ],
  },
}

/** Ruta pública de un archivo de la obra. */
export const capturePath = (project: string, file: string) => `/media/projects/${project}/${file}`

/** Archivos que se sirven de una pieza: la webp de la captura, o el mp4, el webm y el póster del video. */
export function pieceFiles(name: string, video: boolean): { src: string, srcWebm: string | null, poster: string | null } {
  if (!video) return { src: `${name}.webp`, srcWebm: null, poster: null }
  return { src: `${name}.mp4`, srcWebm: `${name}.webm`, poster: `${name}-poster.webp` }
}

/** Todo lo que se copia de docs/rediseno/capturas: [obra, archivo]. Nunca los png. */
export function capturedFiles(): [project: string, file: string][] {
  const out: [string, string][] = []
  for (const [project, work] of Object.entries(WORKS)) {
    const cover = publicProjects.find(p => p.slug === project)?.cover?.src
    if (cover?.startsWith(capturePath(project, ''))) out.push([project, cover.slice(capturePath(project, '').length)])
    for (const piece of [{ ...work.cover, video: true }, ...work.gallery]) {
      const files = pieceFiles(piece.name, piece.video === true)
      for (const file of [files.src, files.srcWebm, files.poster]) if (file) out.push([project, file])
    }
  }
  return out
}
