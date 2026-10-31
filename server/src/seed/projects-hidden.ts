/**
 * Obras que quedan en la base sin publicar (decisión de Mateo, 30-oct-2026).
 * Sin publishedAt no aparecen en la API pública, el sitemap ni el snapshot; el admin las sigue editando.
 */
import { ProjectStatus } from '../../generated/prisma/client.js'
import type { SeedProject } from './types.js'

export const hiddenProjects: SeedProject[] = [
  {
    slug: 'null-net',
    title: 'null-net',
    year: 2026,
    role: 'Producto propio · diseño y desarrollo',
    status: ProjectStatus.LIVE,
    featured: false,
    published: false,
    summary: 'Red social efímera y terminal cyberpunk. Las transmisiones se autodestruyen en 24h. Vue 3 + Supabase Realtime + estética brutalista.',
    brief: 'Una red social donde las publicaciones no dejan huella permanente. Estética neo-brutalista de consola UNIX con streams en tiempo real.',
    outcome: 'Desplegado en producción con suscripciones reactivas en tiempo real mediante Supabase y persistencia temporal con TTL automático.',
    url: null,
    repo: 'https://github.com/MateoGs013/null-net',
    org: null,
    techs: ['vue', 'supabase', 'tailwind', 'vite', 'typescript'],
    metrics: { ephemeralTTL: 24, realtimeLatencyMs: 25, bundleSizeKb: 48 },
    links: [{ label: 'código fuente', url: 'https://github.com/MateoGs013/null-net' }],
    steps: [
      { title: '01 · concepto', body: 'Privacidad absoluta y efimeridad digital: cada mensaje se autodestruye a las 24 horas.' },
      { title: '02 · reactividad', body: 'Postgres CDC (Change Data Capture) conectado a websockets de Supabase para actualización instantánea sin polling.' },
    ],
    cover: null,
  },
  {
    slug: 'lampone',
    title: 'Lampone Terminal Noir',
    year: 2026,
    role: 'Diseño y desarrollo frontend',
    status: ProjectStatus.LIVE,
    featured: false,
    published: false,
    summary: 'Portfolio interactivo Terminal Noir para desarrollador backend. Vue 3 + GSAP + Lenis con emulación CRT y scanlines.',
    brief: 'Crear una presencia digital única que transmita solidez de ingeniería backend inspirada en los monitores monocromáticos ámbar y fósforo verde de los 80s.',
    outcome: 'Micro-animaciones de terminal con GSAP, scroll inercial suave y 60 FPS garantizados incluso con efectos de post-procesamiento visual.',
    url: null,
    repo: 'https://github.com/MateoGs013/lampone',
    org: null,
    techs: ['vue', 'gsap', 'lenis', 'tailwind', 'vite'],
    metrics: { fpsTarget: 60, bundleSizeKb: 45 },
    links: [{ label: 'código fuente', url: 'https://github.com/MateoGs013/lampone' }],
    steps: [
      { title: '01 · estética', body: 'Dirección de arte inspirada en el terminalismo cinematográfico de los 80.' },
      { title: '02 · render', body: 'Composición de capas CSS y transformaciones aceleradas por GPU para mantener 60 FPS.' },
    ],
    cover: null,
  },
]
