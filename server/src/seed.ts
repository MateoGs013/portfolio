/**
 * Seed con contenido real y enriquecido del Portafolio Técnico Mateo Sonzogni.
 *
 * Correr con `pnpm prisma db seed`. Es idempotente: borra y vuelve a cargar.
 * Toda la experiencia es freelance, propia o académica en producción real.
 */
import { db } from './db.js'
import type { DocField } from '../../app/lib/fieldMeta.js'
import { MediaRole, Prisma, ProjectStatus, TechCategory } from '../generated/prisma/client.js'

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

const techNotes: Record<TechSlug, string> = {
  vue: 'Elegido por reactividad quirúrgica, Composition API limpia y tipado estricto sin sobrecarga de boilerplate.',
  typescript: 'Estándar obligatorio en cliente y servidor: si no está tipado en compilación, no llega a producción.',
  gsap: 'Orquestación temporal determinista para interfaces de alta precisión y micro-interacciones espaciales.',
  lenis: 'Scroll inercial normalizado multiplataforma sin romper el comportamiento nativo del navegador.',
  three: 'WebGL y shaders GLSL para experiencias inmersivas 3D cuando el DOM no alcanza.',
  node: 'Runtime de alto rendimiento para APIs REST livianas, pipelines de middleware y servidores de eventos.',
  express: 'Minimalismo y control total sobre el ciclo de vida HTTP, routing y autenticación.',
  fastapi: 'Core de inferencia y procesamiento de IA/NLP con tipado Pydantic y latencia mínima.',
  python: 'Lenguaje predilecto para ingeniería de datos, embeddings vectoriales y orquestación de LLMs.',
  postgresql: 'Persistencia relacional ACID, esquemas declarativos e índices vectoriales con pgvector.',
  prisma: 'ORM tipado de punta a punta: genera tipos TypeScript exactos directamente desde el esquema SQL.',
  tailwind: 'Sistema de diseño componible y utilitario con purga agresiva para bundles ultra ligeros.',
  vite: 'Tooling ultra veloz basado en Rollup y esbuild para HMR instantáneo en desarrollo.',
  angular: 'Arquitectura corporativa basada en RxJS y Dependency Injection, base del primer stack de Pegasuz.',
  react: 'Ecosistema masivo, React Server Components y rendering híbrido adoptado en la tesis Ynara.',
  next: 'Framework full-stack de React con optimización de assets, routing por sistema de archivos y SSR.',
  mongodb: 'Base NoSQL orientada a documentos para prototipado ágil y esquemas dinámicos en Barberpole.',
  supabase: 'Backend-as-a-Service con Postgres en tiempo real, Row Level Security y storage S3.',
  firebase: 'Plataforma BaaS para base de datos NoSQL reactiva y autenticación social rápida.',
  laravel: 'Monolito robusto con Eloquent ORM, autenticación por sesión y colas de trabajo para plataformas transaccionales.',
  php: 'Lenguaje backend tradicional utilizado en integraciones y módulos transaccionales de clientes.',
  javascript: 'Fundamento del desarrollo web moderno, estándares ECMAScript y manipulación del DOM nativo.',
}

const techColors: Record<TechSlug, string> = {
  vue: '#42b883',
  typescript: '#3178c6',
  javascript: '#f7df1e',
  python: '#3776ab',
  php: '#777bb4',
  angular: '#dd0031',
  react: '#61dafb',
  next: '#000000',
  gsap: '#88ce02',
  lenis: '#111111',
  three: '#000000',
  node: '#339933',
  express: '#000000',
  fastapi: '#009688',
  laravel: '#ff2d20',
  prisma: '#2d3748',
  postgresql: '#4169e1',
  mongodb: '#47a248',
  supabase: '#3ecf8e',
  firebase: '#ffca28',
  tailwind: '#06b6d4',
  vite: '#646cff',
}

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
  metrics: Record<string, unknown> | null
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
    metrics: {
      performanceScore: 99,
      accessibilityScore: 100,
      bestPracticesScore: 100,
      seoScore: 100,
      lcp: '0.8s',
      bundleSizeKb: 42,
      localeCount: 2,
    },
    links: [
      { label: 'sitio en vivo', url: 'https://laruculagastrobar.es/' },
      { label: 'código fuente', url: 'https://github.com/MateoGs013/LaRucula' },
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
    metrics: {
      performanceScore: 98,
      accessibilityScore: 98,
      bestPracticesScore: 100,
      seoScore: 100,
      lcp: '0.9s',
      bundleSizeKb: 58,
      languages: ['ES', 'EN', 'DE'],
    },
    links: [
      { label: 'sitio en vivo', url: 'https://www.argpiscinas.es/' },
      { label: 'código fuente', url: 'https://github.com/MateoGs013/argpiscinas' },
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
    outcome: 'Tesis preaprobada con felicitaciones en Da Vinci. 382 commits liderando la arquitectura backend, base de datos vectorial y motor de inferencia local.',
    url: null,
    repo: 'https://github.com/BriarDevv/Ynara',
    org: 'escuela-da-vinci',
    techs: ['python', 'fastapi', 'next', 'react', 'postgresql', 'typescript'],
    metrics: {
      commits: 382,
      vectorDimensions: 1536,
      averageLatencyMs: 48,
      localModels: ['Gemma 2B', 'Qwen 2.5'],
      encryptionLayers: 3,
    },
    links: [{ label: 'repositorio tesis', url: 'https://github.com/BriarDevv/Ynara' }],
    steps: [
      { title: '01 · hipótesis', body: 'Los asistentes en la nube sacrifican privacidad y contexto local. La hipótesis: un modelo on-prem con memoria vectorial puede ser más rápido, privado y natural.' },
      { title: '02 · arquitectura', body: 'Monorepo con FastAPI para orquestación de embeddings y llamadas a Ollama; PostgreSQL 17 con pgvector para búsqueda por similitud coseno; Next.js 14 en frontend web y Expo para móvil.' },
      { title: '03 · resultado', body: 'Respuestas contextualizadas en dialecto rioplatense con menos de 50ms de latencia de consulta interna y almacenamiento local 100% cifrado.' },
    ],
    cover: null,
  },
  {
    slug: 'barberpole',
    title: 'Barberpole',
    year: 2026,
    role: 'Producto propio · diseño y desarrollo',
    status: ProjectStatus.LIVE,
    featured: false,
    summary: 'SaaS de gestión para peluquerías y barberías: turnos, servicios, clientes y caja en un solo lugar.',
    brief: 'El mostrador era el cuello de botella: reservas por teléfono y cuaderno. El sistema saca los turnos del teléfono y los pone en la agenda, del turno a la caja.',
    outcome: 'En producción y validado. MERN completo con auth por roles, agenda del día, precios y duraciones reales de servicio.',
    url: 'https://parcial-2-peluqueria.vercel.app/',
    repo: 'https://github.com/MateoGs013/barberpole',
    org: null,
    techs: ['react', 'express', 'node', 'mongodb'],
    metrics: {
      performanceScore: 95,
      accessibilityScore: 96,
      bestPracticesScore: 100,
      seoScore: 95,
      lcp: '1.1s',
      bundleSizeKb: 64,
    },
    links: [
      { label: 'demo en vivo', url: 'https://parcial-2-peluqueria.vercel.app/' },
      { label: 'código fuente', url: 'https://github.com/MateoGs013/barberpole' },
    ],
    steps: [
      { title: '01 · problema', body: 'El mostrador era el cuello de botella. Reservas por teléfono, cuaderno y memoria.' },
      { title: '02 · sistema', body: 'MERN completo: turnos, servicios, clientes y caja en un solo lugar. Auth por roles, agenda del día, precios y duraciones reales.' },
      { title: '03 · identidad', body: 'Identidad de barbería de barrio inspirada en el barber pole: neo-brutalista, directa, sin adornos. El mostrador respira.' },
    ],
    cover: { src: '/media/projects/barberpole.png', alt: 'Agenda del día de barberpole con turnos y servicios', width: 2880, height: 1800, bytes: 144234 },
  },
  {
    slug: 'ynara-web',
    title: 'Ynara Web',
    year: 2026,
    role: 'Landing inmersiva · diseño y desarrollo',
    status: ProjectStatus.WIP,
    featured: false,
    summary: 'Landing inmersiva WebGL para Ynara: una forma de luz que muta y reacciona al scroll. Puerta de entrada pública a la tesis.',
    brief: 'Una experiencia espacial que no se navega: se recorre. La narrativa visual se dibuja primero; los shaders entran al servicio de la atmósfera.',
    outcome: 'Shader procedural reactivo a la velocidad de scroll con fallback elegante para dispositivos de baja potencia.',
    url: null,
    repo: 'https://github.com/MateoGs013/Ynara-Web',
    org: null,
    techs: ['next', 'react', 'three', 'gsap', 'lenis', 'typescript', 'tailwind'],
    metrics: {
      fpsTarget: 60,
      drawCalls: 4,
      bundleSizeKb: 78,
    },
    links: [{ label: 'código fuente', url: 'https://github.com/MateoGs013/Ynara-Web' }],
    steps: [
      { title: '01 · concepto', body: 'Traducir la inteligencia artificial adaptativa a una entidad lumínica tridimensional.' },
      { title: '02 · shaders', body: 'Vertex y fragment shaders personalizados en GLSL sobre Three.js orquestados con GSAP ScrollTrigger.' },
    ],
    cover: null,
  },
  {
    slug: 'eros',
    title: 'Eros',
    year: 2026,
    role: 'Producto propio · diseño y desarrollo',
    status: ProjectStatus.WIP,
    featured: false,
    summary: 'Director creativo autónomo asistido por IA con su base de conocimiento en un vault de Obsidian.',
    brief: 'Automatizar la curaduría estética, la síntesis de referencias de diseño y la formulación de prompts creativos estructurados.',
    outcome: 'Prototipo funcional en CLI y micro-servidor local de enriquecimiento semántico.',
    url: null,
    repo: 'https://github.com/MateoGs013/eros',
    org: null,
    techs: ['vue', 'gsap', 'lenis', 'python'],
    metrics: {
      vaultNotesParsed: 1420,
      graphNodes: 850,
    },
    links: [{ label: 'código fuente', url: 'https://github.com/MateoGs013/eros' }],
    steps: [
      { title: '01 · concepción', body: 'Conectar un vault personal de markdown con agentes LLM para análisis de patrones visuales.' },
    ],
    cover: null,
  },
]

// ─── experience ─────────────────────────────────────────────────────────────

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
    story: 'Construcción integral de catálogo corporativo multi-idioma (ES/EN/DE). Implementación de panel autoadministrable para que el cliente cargue obras sin tocar código, tipado de punta a punta con Prisma y optimización de assets pesados para carga instantánea en conexiones móviles.',
    techs: ['vue', 'gsap', 'node', 'prisma', 'tailwind'],
  },
  {
    slug: 'la-rucula',
    org: 'la-rucula-gastrobar',
    role: 'Freelance · diseño y desarrollo',
    startedAt: '2026-03-17',
    endedAt: '2026-07-20',
    summary: 'Sitio editorial menu-first integrado a Pegasuz. En producción.',
    story: 'De un PDF escaneado a una web menu-first optimizada para comensales en mesa mediante QR. Integración con el CMS Pegasuz con fallback offline local: si la API externa entra en reposo, el menú sigue disponible sin degradación.',
    techs: ['vue', 'gsap', 'lenis', 'tailwind'],
  },
  {
    slug: 'ynara',
    org: 'escuela-da-vinci',
    role: 'Tesis en equipo · contribuidor principal',
    startedAt: '2026-05-18',
    endedAt: '2026-06-28',
    summary: '382 commits en seis semanas sobre Ynara, la tesis: asistente de IA on-prem con FastAPI, Next.js, Expo y Postgres con pgvector. Preaprobada; falta la defensa.',
    story: 'Tesis final en Escuela Da Vinci: desarrollo de un asistente de inteligencia artificial on-premise con FastAPI, Next.js, Expo y PostgreSQL con extensión pgvector. 382 commits liderando la arquitectura del backend, pipelines de embeddings vectoriales y la interfaz web.',
    techs: ['python', 'fastapi', 'next', 'postgresql', 'typescript'],
  },
  {
    slug: 'escuela-da-vinci',
    org: 'escuela-da-vinci',
    role: 'Estudiante · Diseño y Desarrollo Web',
    startedAt: '2024-03-01',
    endedAt: null,
    summary: 'Carrera en curso, promoción 2026. UI/UX, dirección visual, front moderno, back, bases de datos y arquitectura. Tesis preaprobada: Ynara.',
    story: 'Formación intensiva de 3 años en Diseño y Desarrollo Web: principios de UI/UX, tipografía, dirección visual, arquitecturas de software modernas, patrones de concurrencia y bases de datos relacionales y no-relacionales.',
    techs: ['fastapi', 'laravel', 'mongodb', 'php', 'postgresql', 'react', 'vue'],
  },
  {
    slug: 'cet-30',
    org: 'cet-30',
    role: 'Técnico en Programación',
    startedAt: '2017-03-01',
    endedAt: '2023-12-01',
    summary: 'Programación en el CET N.º 30, Río Negro. Título de Técnico en Programación en 2023.',
    story: 'Formación técnica de 7 años en Programación en la Escuela Técnica N.º 30 de Cipolletti, Río Negro. Bases algorítmicas sólidas, estructuras de datos, lógica binaria, redes y metodologías de ingeniería de software.',
    techs: ['javascript', 'php'],
  },
]

// ─── docs ───────────────────────────────────────────────────────────────────

const aboutFields: DocField[] = [
  { name: 'name', type: 'string', value: 'Mateo Gabriel Sonzogni' },
  { name: 'role', type: 'string', value: 'Desarrollador Frontend & Full Stack · Creative Developer' },
  { name: 'location', type: 'string', value: 'Río Negro, Patagonia Argentina' },
  { name: 'technical_degree', type: 'string', value: 'Técnico en Programación · CET N.º 30 (2017–2023)' },
  { name: 'higher_education', type: 'string', value: 'Diseño y Desarrollo Web · Escuela Da Vinci (2024–2026) · Tesis Preaprobada' },
  { name: 'freelance_experience', type: 'string', value: 'Activo desde 2023 · ≈ 10 proyectos reales en producción' },
  { name: 'availability_status', type: 'string', value: 'DISPONIBLE // Búsqueda de equipo o proyectos de alto impacto' },
  { name: 'work_modalities', type: 'string', value: 'Remoto · Híbrido · Presencial' },
  { name: 'timezone', type: 'string', value: 'UTC-3 (Argentina / Compatible con US & EU)' },
  { name: 'languages', type: 'string', value: 'Español (Nativo) · Inglés (B2 Profesional Técnico)' },
  { name: 'core_competencies', type: 'string', value: 'Full-Cycle Engineering: Figma UI/UX → Frontend Reactivo → APIs REST/Microservicios → Postgres ACID → Deploy & Monitoreo' },
  { name: 'engineering_philosophy', type: 'text', wide: true, value: 'Desarrollo con criterio de diseño y foco en el producto entero: qué problema resuelve, cómo debería verse, cómo debería sentirse, cómo se construye y cómo llega a producción. No me posiciono solo como programador ni solo como diseñador; trabajo la costura donde la arquitectura técnica se encuentra con la experiencia de usuario.' },
  { name: 'professional_goal', type: 'text', wide: true, value: 'Consolidarme como desarrollador en un equipo con proyectos reales de mayor escala. A mediano plazo, liderazgo técnico: coordinar, organizar, comunicar y conectar perfiles de distintas áreas (diseño, producto, frontend y backend).' },
]

const contactFields: DocField[] = [
  { name: 'email', type: 'url', value: 'mateogabus@gmail.com' },
  { name: 'github', type: 'url', value: 'https://github.com/MateoGs013' },
  { name: 'availability', type: 'string', value: 'Inmediata · Contratación directa, contractor o freelance' },
  { name: 'location', type: 'string', value: 'Río Negro, AR (Disponible para relocalización o remoto)' },
  { name: 'timezone', type: 'string', value: 'UTC-3' },
  { name: 'preferred_contact', type: 'string', value: 'Email directo o mensaje vía GitHub' },
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

  await db.tech.createMany({
    data: techs.map(t => ({
      ...t,
      note: techNotes[t.slug] ?? null,
      color: techColors[t.slug] ?? null,
    })),
  })

  await db.org.createMany({ data: orgs })

  for (const [i, p] of projects.entries()) {
    const { org, techs: techSlugs, links, steps, cover, metrics, ...scalars } = p
    await db.project.create({
      data: {
        ...scalars,
        sortOrder: i,
        publishedAt: new Date(),
        metrics: metrics ? (metrics as Prisma.InputJsonValue) : Prisma.JsonNull,
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
