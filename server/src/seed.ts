/**
 * Seed con contenido real. Fuentes: el sitio anterior (commit 7a45c8c) para los
 * textos, y GitHub (github.com/MateoGs013, 5-sep-2026) para la cronología:
 * fechas de primer commit, dependencias reales de cada repo, README del perfil.
 *
 * Correr con `pnpm prisma db seed`. Es idempotente: borra y vuelve a cargar.
 *
 * Toda la experiencia es freelance o propia: no hubo relación de dependencia.
 * `experience` modela encargos y etapas, no puestos.
 *
 * Lo que sigue siendo aproximado y conviene revisar desde el admin:
 *   - Tech.since: año del primer repo público que la usa. Puede ser anterior.
 *   - Tech.note y Tech.color: NULL hasta que haya criterio escrito y paleta.
 *   - Media.layer: ninguna pieza viene descompuesta en capas todavía.
 *   - Experience "cet-30" y "freelance": los meses de inicio/fin son aproximados
 *     (Mateo dio los años: CET 2017-2023, freelance desde 2023).
 */
import { db } from './db.js'
import type { DocField } from '../../app/lib/fieldMeta.js'
import { MediaRole, ProjectStatus, TechCategory } from '../generated/prisma/client.js'

// ─── stack ──────────────────────────────────────────────────────────────────

const techs = [
  { slug: 'javascript', name: 'JavaScript', category: TechCategory.LANGUAGE, since: 2022 },
  { slug: 'typescript', name: 'TypeScript', category: TechCategory.LANGUAGE, since: 2023 },
  { slug: 'php', name: 'PHP', category: TechCategory.LANGUAGE, since: 2025 },
  { slug: 'python', name: 'Python', category: TechCategory.LANGUAGE, since: 2026 },
  { slug: 'angular', name: 'Angular', category: TechCategory.FRAMEWORK, since: 2022 },
  { slug: 'vue', name: 'Vue 3', category: TechCategory.FRAMEWORK, since: 2025 },
  { slug: 'react', name: 'React', category: TechCategory.FRAMEWORK, since: 2026 },
  { slug: 'next', name: 'Next.js', category: TechCategory.FRAMEWORK, since: 2026 },
  { slug: 'gsap', name: 'GSAP', category: TechCategory.MOTION, since: 2026 },
  { slug: 'lenis', name: 'Lenis', category: TechCategory.MOTION, since: 2026 },
  { slug: 'three', name: 'Three.js', category: TechCategory.GRAPHICS, since: 2026 },
  { slug: 'node', name: 'Node.js', category: TechCategory.BACKEND, since: 2024 },
  { slug: 'express', name: 'Express', category: TechCategory.BACKEND, since: 2024 },
  { slug: 'laravel', name: 'Laravel', category: TechCategory.BACKEND, since: 2026 },
  { slug: 'fastapi', name: 'FastAPI', category: TechCategory.BACKEND, since: 2026 },
  { slug: 'prisma', name: 'Prisma', category: TechCategory.DATA, since: 2026 },
  { slug: 'postgresql', name: 'PostgreSQL', category: TechCategory.DATA, since: 2026 },
  { slug: 'mongodb', name: 'MongoDB', category: TechCategory.DATA, since: 2026 },
  { slug: 'supabase', name: 'Supabase', category: TechCategory.DATA, since: 2026 },
  { slug: 'firebase', name: 'Firebase', category: TechCategory.DATA, since: 2024 },
  { slug: 'tailwind', name: 'Tailwind CSS', category: TechCategory.TOOLING, since: 2026 },
  { slug: 'vite', name: 'Vite', category: TechCategory.TOOLING, since: 2025 },
] as const

type TechSlug = typeof techs[number]['slug']

// ─── orgs ───────────────────────────────────────────────────────────────────

const orgs = [
  { slug: 'la-rucula-gastrobar', name: 'La Rúcula Gastrobar', url: 'https://laruculagastrobar.es/', city: 'Chiclana de la Frontera, ES' },
  { slug: 'arg-piscinas', name: 'ARG Piscinas', url: 'https://www.argpiscinas.es/', city: 'Andalucía, ES' },
  { slug: 'pegasuz', name: 'Pegasuz', url: null, city: 'Buenos Aires, AR' },
  { slug: 'escuela-da-vinci', name: 'Escuela Da Vinci', url: 'https://www.davinci.edu.ar/', city: 'Buenos Aires, AR' },
  { slug: 'cet-30', name: 'CET N.º 30', url: null, city: 'Río Negro, AR' },
]

// ─── projects ───────────────────────────────────────────────────────────────

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
    role: 'Freelance · diseño y desarrollo',
    status: ProjectStatus.LIVE,
    featured: true,
    summary: 'Sitio editorial menu-first para un restaurante frente al mar en Chiclana. Cliente real, en producción.',
    brief: 'La Rúcula necesitaba dejar de ser un PDF escaneado colgado de un QR. El brief real: que la carta se sienta tan cuidada como el plato, y que el dueño pueda editarla sin llamar a nadie.',
    outcome: 'En producción en laruculagastrobar.es. Modo QR optimizado para llegada directa desde la mesa. Multi-locale con preservación del idioma entre rutas. Review UX y accesibilidad automatizadas antes de cada deploy.',
    url: 'https://laruculagastrobar.es/',
    repo: 'https://github.com/MateoGs013/LaRucula',
    org: 'la-rucula-gastrobar',
    techs: ['vue', 'gsap', 'lenis', 'tailwind', 'vite'],
    links: [
      { label: 'sitio', url: 'https://laruculagastrobar.es/' },
      { label: 'repo', url: 'https://github.com/MateoGs013/LaRucula' },
    ],
    steps: [
      { title: '01 · encargo', body: 'De un encargo de "página de restaurante" a una experiencia menu-first pensada para el QR en la mesa. La carta tenía que sentirse tan cuidada como el plato.' },
      { title: '02 · taller', body: 'Arquitectura menu-first: el sitio se reduce a /, /menu y /menu/:slug. La mayoría del tráfico entra por QR, así que el menú es el producto. El contenido del shell vive en Pegasuz, el CMS multi-tenant propio, con fallback local: si la API duerme, el sitio no. Antes de cerrar una sección, review visual con Playwright en tres viewports y baseline de accesibilidad con axe.' },
      { title: '03 · pieza', body: 'Home inmersiva de dirección de arte mediterránea: editorial, calma, lejos del layout genérico de restaurante. Motion con significado: reveals de línea, stagger tipográfico y acentos SVG de trazo manual. La regla del proyecto: cohesión sobre novedad.' },
    ],
    cover: { src: '/media/projects/la-rucula.jpg', alt: 'Home de La Rúcula Gastrobar: titular editorial sobre fotografía de la costa', width: 2880, height: 1800, bytes: 218308 },
  },
  {
    slug: 'argpiscinas',
    title: 'ARG Piscinas',
    year: 2026,
    role: 'Freelance · front y back a medida',
    status: ProjectStatus.LIVE,
    featured: true,
    summary: 'Web corporativa multi-idioma (ES/EN/DE) con panel admin y blog para una constructora de piscinas en Andalucía. Cliente real, en producción.',
    brief: 'ARG venía de mostrar su trabajo por WhatsApp, foto por foto. El brief: un catálogo serio que muestre obra real, presupuesto en línea, y un panel que el propio cliente pueda operar sin depender de nadie.',
    outcome: 'En producción en argpiscinas.es. Panel autoadministrable: el cliente carga obra sin tocar código. Catálogo tipado de punta a punta con Prisma. Tres idiomas.',
    url: 'https://www.argpiscinas.es/',
    repo: 'https://github.com/MateoGs013/argpiscinas',
    org: 'arg-piscinas',
    techs: ['vue', 'gsap', 'tailwind', 'vite', 'node', 'prisma'],
    links: [
      { label: 'sitio', url: 'https://www.argpiscinas.es/' },
      { label: 'repo', url: 'https://github.com/MateoGs013/argpiscinas' },
    ],
    steps: [
      { title: '01 · encargo', body: 'Una constructora de piscinas que necesitaba mostrar obra terminada y cotizar sin fricción, en tres idiomas.' },
      { title: '02 · taller', body: 'Dos cuerpos sobre una misma API: catálogo público y panel de gestión. Node y Prisma con datos tipados de punta a punta. La obra que carga el cliente es exactamente la que muestra el sitio, sin intermediarios ni deploys de por medio.' },
      { title: '03 · pieza', body: 'Front Vue 3 directo y rápido: la obra primero, el argumento después. Catálogo, presupuesto y contacto en el camino más corto posible. El sitio trabaja como la empresa: sin vueltas.' },
    ],
    cover: { src: '/media/projects/argpiscinas.jpg', alt: 'Catálogo de ARG Piscinas con fotografías de obra terminada', width: 2880, height: 1800, bytes: 540079 },
  },
  {
    slug: 'ynara',
    title: 'Ynara',
    year: 2026,
    role: 'Tesis Da Vinci 2026 · contribuidor principal, 382 commits',
    status: ProjectStatus.WIP,
    featured: true,
    summary: 'Tesis en equipo, preaprobada. Asistente personal de IA adaptativo, on-prem y en rioplatense, con memoria cifrada semántica, episódica y procedural sobre Postgres y pgvector.',
    brief: 'Un asistente que corre en tu máquina, habla como vos y se acuerda. Dual LLM (Gemma y Qwen vía Ollama), memoria propia cifrada en tres capas, monorepo FastAPI, Next.js y Expo.',
    outcome: null,
    url: null,
    repo: 'https://github.com/BriarDevv/Ynara',
    org: 'escuela-da-vinci',
    techs: ['python', 'fastapi', 'next', 'react', 'postgresql', 'typescript'],
    links: [{ label: 'repo', url: 'https://github.com/BriarDevv/Ynara' }],
    steps: [],
    cover: null,
  },
  {
    slug: 'ynara-web',
    title: 'Ynara Web',
    year: 2026,
    role: 'Landing del producto · diseño y desarrollo',
    status: ProjectStatus.WIP,
    featured: false,
    summary: 'Landing inmersiva WebGL para Ynara: una forma de luz que morfea con el scroll. No es la tesis: es su puerta de entrada.',
    brief: 'Una experiencia que no se navega: se recorre. La narrativa espacial se dibuja primero; la tecnología entra al servicio de la atmósfera, nunca al revés.',
    outcome: null,
    url: null,
    repo: 'https://github.com/MateoGs013/Ynara-Web',
    org: null,
    techs: ['next', 'react', 'three', 'gsap', 'lenis', 'typescript', 'tailwind'],
    links: [{ label: 'repo', url: 'https://github.com/MateoGs013/Ynara-Web' }],
    steps: [],
    cover: null, // sin media a propósito: prueba la degradación de DISEÑO
  },
  {
    slug: 'barberpole',
    title: 'barberpole',
    year: 2026,
    role: 'Producto propio · diseño y desarrollo',
    status: ProjectStatus.LIVE,
    featured: false,
    summary: 'SaaS de gestión para peluquerías: turnos, servicios, clientes y caja en un solo lugar.',
    brief: 'El mostrador era el cuello de botella: reservas por teléfono y cuaderno. El sistema saca los turnos del teléfono y los pone en la agenda, del turno a la caja.',
    outcome: 'Demo en vivo. MERN completo con auth por roles, agenda del día, precios y duraciones reales.',
    url: 'https://parcial-2-peluqueria.vercel.app/',
    repo: 'https://github.com/MateoGs013/barberpole',
    org: null,
    techs: ['react', 'express', 'node', 'mongodb'],
    links: [
      { label: 'demo', url: 'https://parcial-2-peluqueria.vercel.app/' },
      { label: 'repo', url: 'https://github.com/MateoGs013/barberpole' },
    ],
    steps: [
      { title: '01 · problema', body: 'El mostrador era el cuello de botella. Reservas por teléfono, cuaderno y memoria.' },
      { title: '02 · sistema', body: 'MERN completo: turnos, servicios, clientes y caja en un solo lugar. Auth por roles, agenda del día, precios y duraciones reales.' },
      { title: '03 · identidad', body: 'Identidad de barbería de barrio inspirada en el barber pole: neo-brutalista, directa, sin adornos. El mostrador respira.' },
    ],
    cover: { src: '/media/projects/barberpole.png', alt: 'Agenda del día de barberpole con turnos y servicios', width: 2880, height: 1800, bytes: 144234 },
  },
  {
    slug: 'eros',
    title: 'Eros',
    year: 2026,
    role: 'Producto propio · diseño y desarrollo',
    status: ProjectStatus.WIP,
    featured: false,
    summary: 'Director creativo autónomo con el cerebro en un vault de Obsidian.',
    brief: null,
    outcome: null,
    url: null,
    repo: 'https://github.com/MateoGs013/eros',
    org: null,
    techs: ['vue', 'gsap', 'lenis', 'python'],
    links: [{ label: 'repo', url: 'https://github.com/MateoGs013/eros' }],
    steps: [],
    cover: null,
  },
]

// ─── experience ─────────────────────────────────────────────────────────────
// Encargos y etapas. Fechas del primer y último commit de cada repo.

interface SeedExperience {
  slug: string
  org: string | null
  role: string
  startedAt: string
  endedAt: string | null
  summary: string
  story: string | null
  techs: TechSlug[]
}

const experience: SeedExperience[] = [
  {
    slug: 'freelance',
    org: null,
    role: 'Freelance · diseño y desarrollo web',
    startedAt: '2023-01-01',
    endedAt: null,
    summary: 'Alrededor de diez proyectos reales para clientes desde 2023. El primero: la web de un estudio de arquitectura.',
    story: 'Del brief al deploy: estructura, contenido y experiencia en Figma; front; back; APIs y bases de datos; responsive y accesibilidad; producción. Trabajo iterativo, con entregables divididos y revisiones progresivas.',
    techs: ['javascript', 'typescript', 'vue', 'react', 'node', 'laravel'],
  },
  {
    slug: 'pegasuz',
    org: 'pegasuz',
    role: 'Fundador · CMS multi-tenant propio',
    startedAt: '2024-05-20',
    endedAt: null,
    summary: 'Estudio y CMS propio que alimenta los sitios de clientes. Del sitio en Angular (2024) al core API-first con contratos por marca (2026).',
    story: 'Pegasuz empezó como un sitio en Angular y terminó siendo la infraestructura de todo lo demás: un CMS multi-tenant al que se conectan La Rúcula y ARG Piscinas. Aprendí a cotizar, a decir que no, y a diseñar un contrato de datos que sobreviva a tres rediseños.',
    techs: ['angular', 'vue', 'node', 'prisma', 'firebase', 'typescript'],
  },
  {
    slug: 'arg-piscinas',
    org: 'arg-piscinas',
    role: 'Freelance · front y back a medida',
    startedAt: '2026-01-28',
    endedAt: '2026-07-20',
    summary: 'Web corporativa en tres idiomas con panel de gestión y blog. En producción.',
    story: null,
    techs: ['vue', 'gsap', 'node', 'prisma', 'tailwind'],
  },
  {
    slug: 'la-rucula',
    org: 'la-rucula-gastrobar',
    role: 'Freelance · diseño y desarrollo',
    startedAt: '2026-03-17',
    endedAt: '2026-07-20',
    summary: 'Sitio editorial menu-first integrado a Pegasuz. En producción.',
    story: null,
    techs: ['vue', 'gsap', 'lenis', 'tailwind'],
  },
  {
    slug: 'ynara',
    org: 'escuela-da-vinci',
    role: 'Tesis en equipo · contribuidor principal',
    startedAt: '2026-05-18',
    endedAt: '2026-06-28',
    summary: '382 commits en seis semanas sobre Ynara, la tesis: asistente de IA on-prem con FastAPI, Next.js, Expo y Postgres con pgvector. Preaprobada; falta la defensa.',
    story: null,
    techs: ['python', 'fastapi', 'next', 'postgresql', 'typescript'],
  },
  {
    slug: 'escuela-da-vinci',
    org: 'escuela-da-vinci',
    role: 'Estudiante · Diseño y Desarrollo Web',
    startedAt: '2024-03-01',
    endedAt: null,
    summary: 'Carrera en curso, promoción 2026. UI/UX, dirección visual, front moderno, back, bases de datos y arquitectura. Tesis preaprobada: Ynara.',
    story: null,
    techs: ['vue', 'react', 'php', 'laravel', 'mongodb', 'fastapi', 'postgresql'],
  },
  {
    slug: 'cet-30',
    org: 'cet-30',
    role: 'Técnico en Programación',
    startedAt: '2017-03-01',
    endedAt: '2023-12-01',
    summary: 'Programación en el CET N.º 30, Río Negro. Título de Técnico en Programación en 2023.',
    story: null,
    techs: [],
  },
]

// ─── docs ───────────────────────────────────────────────────────────────────

const aboutFields: DocField[] = [
  { name: 'name', type: 'string', value: 'Mateo Gabriel Sonzogni' },
  { name: 'role', type: 'string', value: 'desarrollador frontend y full stack · creative developer' },
  { name: 'from', type: 'string', value: 'Río Negro, AR' },
  { name: 'technical_degree', type: 'string', value: 'Técnico en Programación · CET N.º 30 · 2017–2023' },
  { name: 'education', type: 'string', value: 'Diseño y Desarrollo Web · Escuela Da Vinci · 2024–2026 · tesis preaprobada' },
  { name: 'freelance_since', type: 'int', value: '2023' },
  { name: 'client_projects', type: 'string', value: '≈ 10' },
  { name: 'available', type: 'bool', value: 'true' },
  { name: 'availability', type: 'string', value: 'remoto · híbrido · presencial' },
  { name: 'languages', type: 'string', value: 'es nativo · en B2' },
  { name: 'works_with_ai', type: 'bool', value: 'true' },
  { name: 'goal', type: 'text', wide: true, value: 'Consolidarme como desarrollador en un equipo con proyectos reales de mayor escala. A mediano plazo, liderazgo técnico: coordinar, organizar, comunicar y conectar perfiles de distintas áreas.' },
  { name: 'bio', type: 'text', wide: true, value: 'Desarrollador frontend y full stack de Río Negro, con criterio de diseño y foco en el producto entero: qué problema resuelve, cómo debería verse, cómo debería sentirse, cómo se construye y cómo llega a producción. Empecé freelance en 2023 con la web de un estudio de arquitectura; desde entonces, unos diez proyectos reales para clientes. Trabajo el ciclo completo: estructura y experiencia en Figma, front, back, APIs y bases de datos, accesibilidad, deploy. Me interesa el creative frontend, el motion cuando cumple una función, y no posicionarme solo como programador ni solo como diseñador.' },
]

const contactFields: DocField[] = [
  { name: 'email', type: 'url', value: 'mateogabus@gmail.com' },
  { name: 'github', type: 'url', value: 'https://github.com/MateoGs013' },
  { name: 'status', type: 'string', value: 'buscando mi primer equipo · remoto, híbrido o presencial' },
]

// ─── carga ──────────────────────────────────────────────────────────────────

async function main() {
  await db.processStep.deleteMany()
  await db.media.deleteMany()
  await db.link.deleteMany()
  await db.project.deleteMany()
  await db.experience.deleteMany()
  await db.tech.deleteMany()
  await db.org.deleteMany()
  await db.doc.deleteMany()

  const notes: Partial<Record<TechSlug, string>> = {
    gsap: 'Motion cuando cumple una función dentro de la experiencia, no como efecto decorativo aislado.',
    three: 'WebGL solo cuando el efecto justifica perder el DOM.',
  }
  await db.tech.createMany({ data: techs.map(t => ({ ...t, note: notes[t.slug] ?? null, color: null })) })
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

  for (const e of experience) {
    const { org, techs: techSlugs, startedAt, endedAt, ...scalars } = e
    await db.experience.create({
      data: {
        ...scalars,
        startedAt: new Date(startedAt),
        endedAt: endedAt ? new Date(endedAt) : null,
        org: org ? { connect: { slug: org } } : undefined,
        techs: { connect: techSlugs.map(slug => ({ slug })) },
      },
    })
  }

  await db.doc.createMany({
    data: [
      { key: 'about', title: 'about', fields: aboutFields },
      { key: 'contact', title: 'contact', fields: contactFields },
    ],
  })

  const [nProjects, nExperience, nTechs, nOrgs, nDocs] = await Promise.all([
    db.project.count(), db.experience.count(), db.tech.count(), db.org.count(), db.doc.count(),
  ])
  console.log(`seed → ${nProjects} projects · ${nExperience} experience · ${nTechs} techs · ${nOrgs} orgs · ${nDocs} docs`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
