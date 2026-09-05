/**
 * Seed con contenido real, recuperado del sitio anterior (commit 7a45c8c).
 * Correr con `pnpm prisma db seed`. Es idempotente: borra y vuelve a cargar.
 *
 * Lo que NO está acá porque no hay dato real todavía:
 *   - experience: vacía a propósito. Se carga cuando haya fechas y roles reales.
 *   - Tech.since: derivado del proyecto más viejo que usa cada tech. Corregir a mano.
 *   - Tech.note y Tech.color: NULL hasta que haya criterio escrito y paleta.
 *   - Media.layer: ninguna pieza viene descompuesta en capas todavía.
 */
import { db } from './db.js'
import type { DocField } from '../../app/lib/fieldMeta.js'
import { MediaRole, ProjectStatus, TechCategory } from '../generated/prisma/client.js'

const techs = [
  { slug: 'vue', name: 'Vue 3', category: TechCategory.FRAMEWORK },
  { slug: 'react', name: 'React', category: TechCategory.FRAMEWORK },
  { slug: 'gsap', name: 'GSAP', category: TechCategory.MOTION },
  { slug: 'lenis', name: 'Lenis', category: TechCategory.MOTION },
  { slug: 'tresjs', name: 'TresJS', category: TechCategory.GRAPHICS },
  { slug: 'glsl', name: 'GLSL', category: TechCategory.LANGUAGE },
  { slug: 'node', name: 'Node.js', category: TechCategory.BACKEND },
  { slug: 'express', name: 'Express', category: TechCategory.BACKEND },
  { slug: 'prisma', name: 'Prisma', category: TechCategory.DATA },
  { slug: 'mongodb', name: 'MongoDB', category: TechCategory.DATA },
] as const

type TechSlug = typeof techs[number]['slug']

const orgs = [
  { slug: 'la-rucula-gastrobar', name: 'La Rúcula Gastrobar', url: 'https://laruculagastrobar.es/', city: 'Chiclana de la Frontera, ES' },
  { slug: 'arg-piscinas', name: 'ARG Piscinas', url: 'https://www.argpiscinas.es/', city: null },
]

interface SeedProject {
  slug: string
  title: string
  year: number
  role: string
  status: ProjectStatus
  featured: boolean
  summary: string
  brief: string | null
  outcome: string | null
  url: string | null
  repo: string | null
  org: string | null
  techs: TechSlug[]
  links: { label: string, url: string }[]
  steps: { title: string, body: string }[]
  cover: { src: string, alt: string, width: number, height: number, bytes: number } | null
}

const projects: SeedProject[] = [
  {
    slug: 'la-rucula',
    title: 'La Rúcula Gastrobar',
    year: 2026,
    role: 'Diseño y desarrollo',
    status: ProjectStatus.LIVE,
    featured: true,
    summary: 'Sitio editorial menu-first para un restaurante frente al mar en Chiclana.',
    brief: 'La Rúcula necesitaba dejar de ser un PDF escaneado colgado de un QR. El brief real: que la carta se sienta tan cuidada como el plato, y que el dueño pueda editarla sin llamar a nadie.',
    outcome: 'En producción en laruculagastrobar.es. Modo QR optimizado para llegada directa desde la mesa. Multi-locale con preservación del idioma entre rutas. Review UX y accesibilidad automatizadas antes de cada deploy.',
    url: 'https://laruculagastrobar.es/',
    repo: null,
    org: 'la-rucula-gastrobar',
    techs: ['vue', 'gsap', 'lenis'],
    links: [{ label: 'sitio', url: 'https://laruculagastrobar.es/' }],
    steps: [
      { title: '01 · encargo', body: 'De un encargo de "página de restaurante" a una experiencia menu-first pensada para el QR en la mesa. La carta tenía que sentirse tan cuidada como el plato.' },
      { title: '02 · taller', body: 'Arquitectura menu-first: el sitio se reduce a /, /menu y /menu/:slug. La mayoría del tráfico entra por QR, así que el menú es el producto. El contenido del shell vive en un CMS multi-tenant con fallback local: si la API duerme, el sitio no. Antes de cerrar una sección, review visual con Playwright en tres viewports y baseline de accesibilidad con axe.' },
      { title: '03 · pieza', body: 'Home inmersiva de dirección de arte mediterránea: editorial, calma, lejos del layout genérico de restaurante. Motion con significado: reveals de línea, stagger tipográfico y acentos SVG de trazo manual. La regla del proyecto: cohesión sobre novedad.' },
    ],
    cover: { src: '/media/projects/la-rucula.jpg', alt: 'Home de La Rúcula Gastrobar: titular editorial sobre fotografía de la costa', width: 2880, height: 1800, bytes: 218308 },
  },
  {
    slug: 'argpiscinas',
    title: 'ARG Piscinas',
    year: 2025,
    role: 'Front-end y back-end a medida',
    status: ProjectStatus.LIVE,
    featured: true,
    summary: 'Catálogo público y panel de gestión para una constructora de piscinas en Andalucía.',
    brief: 'ARG venía de mostrar su trabajo por WhatsApp, foto por foto. El brief: un catálogo serio que muestre obra real, presupuesto en línea, y un panel que el propio cliente pueda operar sin depender de nadie.',
    outcome: 'En producción en argpiscinas.es. Panel autoadministrable: el cliente carga obra sin tocar código. Catálogo tipado de punta a punta con Prisma.',
    url: 'https://www.argpiscinas.es/',
    repo: null,
    org: 'arg-piscinas',
    techs: ['vue', 'node', 'prisma'],
    links: [{ label: 'sitio', url: 'https://www.argpiscinas.es/' }],
    steps: [
      { title: '01 · encargo', body: 'Una constructora de piscinas que necesitaba mostrar obra terminada y cotizar sin fricción.' },
      { title: '02 · taller', body: 'Dos cuerpos sobre una misma API: catálogo público y panel de gestión. Node y Prisma con datos tipados de punta a punta. La obra que carga el cliente es exactamente la que muestra el sitio, sin intermediarios ni deploys de por medio.' },
      { title: '03 · pieza', body: 'Front Vue 3 directo y rápido: la obra primero, el argumento después. Catálogo, presupuesto y contacto en el camino más corto posible. El sitio trabaja como la empresa: sin vueltas.' },
    ],
    cover: { src: '/media/projects/argpiscinas.jpg', alt: 'Catálogo de ARG Piscinas con fotografías de obra terminada', width: 2880, height: 1800, bytes: 540079 },
  },
  {
    slug: 'barberpole',
    title: 'barberpole',
    year: 2024,
    role: 'Producto propio: diseño y desarrollo',
    status: ProjectStatus.ARCHIVED,
    featured: false,
    summary: 'SaaS de gestión para peluquerías: turnos, clientes y caja en un solo lugar.',
    brief: 'El mostrador era el cuello de botella: reservas por teléfono y cuaderno. El sistema saca los turnos del teléfono y los pone en la agenda, del turno a la caja.',
    outcome: null,
    url: null,
    repo: 'https://github.com/MateoGs013/barberpole',
    org: null,
    techs: ['react', 'express', 'mongodb', 'node'],
    links: [{ label: 'repo', url: 'https://github.com/MateoGs013/barberpole' }],
    steps: [
      { title: '01 · problema', body: 'El mostrador era el cuello de botella. Reservas por teléfono, cuaderno y memoria.' },
      { title: '02 · sistema', body: 'MERN completo: turnos, servicios, clientes y caja en un solo lugar. Auth por roles, agenda del día, precios y duraciones reales.' },
      { title: '03 · identidad', body: 'Identidad de barbería de barrio: neo-brutalista, directa, sin adornos. El mostrador respira.' },
    ],
    cover: { src: '/media/projects/barberpole.png', alt: 'Agenda del día de barberpole con turnos y servicios', width: 2880, height: 1800, bytes: 144234 },
  },
  {
    slug: 'ynara',
    title: 'Ynara',
    year: 2026,
    role: 'Tesis: dirección creativa y desarrollo',
    status: ProjectStatus.WIP,
    featured: false,
    summary: 'Experiencia WebGL inmersiva como proyecto de tesis: shaders a mano y narrativa que se recorre.',
    brief: 'Una experiencia que no se navega: se recorre. La narrativa espacial se dibuja primero; la tecnología entra al servicio de la atmósfera, nunca al revés.',
    outcome: null,
    url: null,
    repo: 'https://github.com/MateoGs013/Ynara-Web',
    org: null,
    techs: ['vue', 'tresjs', 'glsl'],
    links: [{ label: 'repo', url: 'https://github.com/MateoGs013/Ynara-Web' }],
    steps: [],
    cover: null, // sin media a propósito: prueba la degradación de DISEÑO
  },
]

const aboutFields: DocField[] = [
  { name: 'name', type: 'string', value: 'Mateo Sonzogni' },
  { name: 'role', type: 'string', value: 'creative developer' },
  { name: 'based_in', type: 'string', value: 'Buenos Aires, AR' },
  { name: 'available', type: 'bool', value: 'true' },
  { name: 'languages', type: 'string', value: 'es · en' },
  { name: 'bio', type: 'text', wide: true, value: 'Creative developer. Dos clientes en producción en España, un SaaS propio y una tesis que respira WebGL. Nada guardado en un cajón. Cada trabajo sale con identidad propia; este sitio también.' },
]

const contactFields: DocField[] = [
  { name: 'email', type: 'url', value: 'mateogabus@gmail.com' },
  { name: 'github', type: 'url', value: 'https://github.com/MateoGs013' },
  { name: 'status', type: 'string', value: 'taller abierto a encargos' },
]

async function main() {
  // Limpieza en orden de dependencias.
  await db.processStep.deleteMany()
  await db.media.deleteMany()
  await db.link.deleteMany()
  await db.project.deleteMany()
  await db.experience.deleteMany()
  await db.tech.deleteMany()
  await db.org.deleteMany()
  await db.doc.deleteMany()

  // `since` derivado: el año del proyecto más viejo que usa cada tech.
  const sinceBySlug = new Map<TechSlug, number>()
  for (const p of projects) {
    for (const t of p.techs) sinceBySlug.set(t, Math.min(sinceBySlug.get(t) ?? Infinity, p.year))
  }
  await db.tech.createMany({
    data: techs.map(t => ({ ...t, since: sinceBySlug.get(t.slug) ?? new Date().getFullYear(), note: null, color: null })),
  })
  await db.org.createMany({ data: orgs })

  for (const [i, p] of projects.entries()) {
    const { org, techs: techSlugs, links, steps, cover, ...scalars } = p
    await db.project.create({
      data: {
        ...scalars,
        metrics: undefined, // NULL: todavía no hay medición
        sortOrder: i,
        publishedAt: new Date(),
        org: org ? { connect: { slug: org } } : undefined,
        techs: { connect: techSlugs.map(slug => ({ slug })) },
        links: { create: links },
        steps: { create: steps.map((s, order) => ({ ...s, order: order + 1 })) },
        media: cover ? { create: [{ ...cover, role: MediaRole.COVER, layer: null, order: 0 }] } : undefined,
      },
    })
  }

  await db.doc.createMany({
    data: [
      { key: 'about', title: 'about', fields: aboutFields },
      { key: 'contact', title: 'contact', fields: contactFields },
    ],
  })

  const [nProjects, nTechs, nOrgs, nDocs] = await Promise.all([
    db.project.count(), db.tech.count(), db.org.count(), db.doc.count(),
  ])
  console.log(`seed → ${nProjects} projects · ${nTechs} techs · ${nOrgs} orgs · ${nDocs} docs · 0 experience`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
