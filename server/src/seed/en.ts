/**
 * Inglés del contenido, traducido desde el español vigente del seed: sin afirmaciones nuevas y con las
 * cifras tal cual. Lo que falte queda sin traducir: la API sirve el español y lo marca en `untranslated`.
 * seed.ts lo aplica al final (upsert de *Translation y `en` de los Doc) y el parche
 * patches/2026-11-02-traducciones-en.ts lo lleva a una base existente sin pisar lo editado.
 *
 * Los títulos de las obras no cambian en inglés, así que no se repiten. Las viñetas (`highlights`)
 * respetan la misma cota que las españolas: hasta 3, de 160 caracteres. Media (alt y pie) es de seed/media.ts.
 */
import type { DocField, DocFieldValue } from '../../../app/lib/fieldMeta.js'
import { aboutFields, contactFields } from './docs.js'
import type { TechSlug } from './stack.js'

export interface EnProject {
  title?: string
  role?: string
  summary?: string
  brief?: string
  outcome?: string
  /** Por `order` del paso (1, 2, 3…). El título va sin la numeración '01 ·'. */
  steps?: Record<number, { title?: string, body?: string }>
  /** Por url del enlace → su label en inglés. */
  links?: Record<string, string>
}

export interface EnExperience {
  role?: string
  summary?: string
  story?: string
  highlights?: string[]
  location?: string
}

export interface EnArticle {
  title?: string
  summary?: string
  content?: string
}

export interface EnSeed {
  /** Por slug de la obra. */
  projects: Record<string, EnProject>
  /** Por slug de la experiencia. */
  experience: Record<string, EnExperience>
  /** `note` de cada tecnología. */
  techs: Partial<Record<TechSlug, string>>
  /** Valor en inglés de cada campo de los Doc, por `name` (va al `en` del campo). */
  docs: { about: Record<string, DocFieldValue>, contact: Record<string, DocFieldValue> }
  /** Por slug del artículo. */
  articles: Record<string, EnArticle>
}

/** Campos que se leen igual en los dos idiomas (nombres propios, rutas, URLs): su `en` es el mismo valor. */
function unchanged(fields: readonly DocField[], names: readonly string[]): Record<string, DocFieldValue> {
  return Object.fromEntries(fields.filter(f => names.includes(f.name)).map(f => [f.name, f.value]))
}

/** Artículo del blog (seed/articles.ts). */
const postgresArticleEn: EnArticle = {
  title: 'PostgreSQL 17 as a Universal Relational and Vector Database in Production',
  summary: 'An analysis of architecture and trade-offs: how to consolidate pgvector and relational data in PostgreSQL 17 while reducing latency and operational complexity.',
  content: `# PostgreSQL 17 as a Universal Relational and Vector Database in Production

The proliferation of specialized vector databases met early needs in the adoption of language models. In production engineering architectures, however, it introduces a critical overhead: bidirectional synchronization between the transactional system of record and the external vector index.

## The Problem of Decoupled State

When the catalog of job openings or posts lives in PostgreSQL and the embeddings are synchronized asynchronously to an external vector cluster:
1. Operations are not atomic.
2. Structured filters require a two-phase pipeline with intermediate serialization.
3. Network failures produce inconsistent or orphaned states.

## The Solution: pgvector in PostgreSQL 17

With the HNSW indexing improvements in pgvector and memory management in PostgreSQL 17:
- Semantic queries run inside the same SQL query planner.
- Joins between the vector table and relational metadata are processed in shared memory with no network overhead.
- ACID guarantees hold on every insertion and mutation of embeddings.

\`\`\`sql
SELECT j.id, j.title, j.company, 1 - (j.embedding <=> $1) AS similarity
FROM "Job" j
WHERE j.status = 'ACTIVE'
ORDER BY j.embedding <=> $1
LIMIT 10;
\`\`\`

## Conclusion

Consolidating relational and vector persistence in a single PostgreSQL 17 node brings the extra operational cost down to zero, removes redundant synchronization workers and guarantees strict transactional consistency.`,
}

const LIVE = 'live site'
const SOURCE = 'source code'

export const EN: EnSeed = {
  projects: {
    'la-rucula': {
      role: 'Freelance · design and development',
      summary: 'Menu-first editorial site for a seafront restaurant in Chiclana. Real client, in production.',
      brief: 'La Rúcula needed to stop being a scanned PDF hanging off a QR code. The real brief: make the menu feel as carefully crafted as the dish, and let the owner edit it without calling anyone.',
      outcome: 'In production at laruculagastrobar.es. QR mode optimized for arrivals straight from the table. Multi-locale, with the language preserved across routes. Automated UX and accessibility review before every deploy.',
      steps: {
        1: { title: 'commission', body: 'From a "restaurant page" commission to a menu-first experience designed for the QR code on the table. The menu had to feel as carefully crafted as the dish.' },
        2: { title: 'workshop', body: 'Menu-first architecture: the site comes down to /, /menu and /menu/:slug. Most traffic arrives through the QR code, so the menu is the product. The shell content lives in a custom CMS with a local fallback: if the API sleeps, the site doesn\'t. Before closing a section, a visual review with Playwright in three viewports and an accessibility baseline with axe.' },
        3: { title: 'piece', body: 'An immersive home with Mediterranean art direction: editorial, calm, far from the generic restaurant layout. Motion with meaning: line reveals, typographic stagger and hand-drawn SVG accents. The project\'s rule: cohesion over novelty.' },
      },
      links: { 'https://laruculagastrobar.es/': LIVE, 'https://github.com/MateoGs013/LaRucula': SOURCE },
    },
    'argpiscinas': {
      role: 'Freelance · custom front end and back end',
      summary: 'Multilingual corporate website (ES/EN/DE) with an admin panel and blog for a pool builder in Andalusia. Real client, in production.',
      brief: 'ARG used to show its work over WhatsApp, one photo at a time. The brief: a serious catalog that shows real work, online quotes, and a panel the client can run on their own without depending on anyone.',
      outcome: 'In production at argpiscinas.es. Self-managed panel: the client uploads work without touching code. Catalog typed end to end with Prisma. Three languages.',
      steps: {
        1: { title: 'commission', body: 'A pool builder that needed to show finished work and give quotes without friction, in three languages.' },
        2: { title: 'workshop', body: 'Two bodies on the same API: a public catalog and a management panel. Node and Prisma with data typed end to end. The work the client uploads is exactly what the site shows, with no middlemen or deploys in between.' },
        3: { title: 'piece', body: 'A direct, fast Vue 3 front end: the work first, the pitch after. Catalog, quote and contact along the shortest possible path. The site works like the company: no detours.' },
      },
      links: { 'https://www.argpiscinas.es/': LIVE, 'https://github.com/MateoGs013/argpiscinas': SOURCE },
    },
    'ynara': {
      role: 'Da Vinci Thesis 2026 · lead contributor',
      summary: 'Team thesis, pre-approved. An adaptive, on-prem personal AI assistant with encrypted semantic, episodic and procedural memory on Postgres and pgvector.',
      brief: 'An assistant that runs on your machine, talks like you and remembers. Dual LLM (Gemma and Qwen via Ollama), its own encrypted three-layer memory, and a FastAPI, Next.js and Expo monorepo.',
      outcome: 'Thesis pre-approved with commendation at Da Vinci. 382 commits leading the backend architecture, the vector database and the local inference engine.',
      steps: {
        1: { title: 'hypothesis', body: 'Cloud assistants sacrifice privacy and local context. The hypothesis: an on-prem model with vector memory can be faster, more private and more natural.' },
        2: { title: 'architecture', body: 'A monorepo with FastAPI orchestrating embeddings and calls to Ollama; PostgreSQL 17 with pgvector for cosine similarity search; Next.js 14 for the web front end and Expo for mobile.' },
        3: { title: 'result', body: 'Contextualized answers with under 50ms of internal query latency and 100% encrypted local storage.' },
      },
      links: { 'https://github.com/BriarDevv/Ynara': 'thesis repository' },
    },
    'barberpole': {
      role: 'Own product · design and development',
      summary: 'Management SaaS for hair salons and barbershops: appointments, services, clients and checkout in one place.',
      brief: 'The front desk was the bottleneck: bookings by phone and in a notebook. The system takes appointments off the phone and onto the calendar, from booking to checkout.',
      outcome: 'In production and validated. Full MERN with role-based auth, a daily schedule, and real service prices and durations.',
      steps: {
        1: { title: 'problem', body: 'The front desk was the bottleneck. Bookings by phone, notebook and memory.' },
        2: { title: 'system', body: 'Full MERN: appointments, services, clients and checkout in one place. Role-based auth, daily schedule, real prices and durations.' },
        3: { title: 'identity', body: 'A neighborhood barbershop identity inspired by the barber pole: neo-brutalist, direct, no frills. The front desk can breathe.' },
      },
      links: { 'https://turnos.mateogs.tech/': LIVE, 'https://github.com/MateoGs013/barberpole': SOURCE },
    },
    'ynara-web': {
      role: 'Immersive landing page · design and development',
      summary: 'Immersive WebGL landing page for Ynara: a form of light that mutates and reacts to scroll. The public gateway to the thesis.',
      brief: 'A spatial experience you don\'t navigate: you travel through it. The visual narrative is drawn first; the shaders come in to serve the atmosphere.',
      outcome: 'A procedural shader that reacts to scroll velocity, with a graceful fallback for low-power devices.',
      steps: {
        1: { title: 'concept', body: 'Translating adaptive artificial intelligence into a three-dimensional entity of light.' },
        2: { title: 'shaders', body: 'Custom GLSL vertex and fragment shaders on Three.js, orchestrated with GSAP ScrollTrigger.' },
      },
      links: { 'https://github.com/MateoGs013/Ynara-Web': SOURCE },
    },
    'eros': {
      role: 'Multi-agent system · AI & automation',
      summary: 'Autonomous career assistant: it tracks job openings, evaluates them with AI, tailors the Harvard ATS CV to each one and generates technical content for LinkedIn, X and Dev.to.',
      brief: 'Automating the job search end to end: finding openings across several job boards, deciding which ones are worth it, tailoring the CV to each one and keeping a technical presence on social media without spending hours on it every day.',
      outcome: 'In production at eros.mateogs.tech and integrated into the portfolio console as Eros AI Suite: Job Hunter, omnichannel Content and TrendRadar. It runs on its own VPS with FastAPI and SQLite, publishes through n8n and is supervised from a private Telegram bot.',
      steps: {
        1: { title: 'sources', body: 'Tracking job openings on LinkedIn, Get on Board and RemoteOK, with filters for stack, work mode and salary.' },
        2: { title: 'evaluation', body: 'Every opening goes through Gemini: match percentage, strengths, likely objections, missing skills and which portfolio projects are worth citing.' },
        3: { title: 'application', body: 'A Harvard ATS CV tailored to the opening on one A4 page, an application email and a connection note for the hiring lead detected on LinkedIn.' },
        4: { title: 'content', body: 'TrendRadar detects technical topics related to the stack on Hacker News, Dev.to and GitHub, and the omnichannel module turns them into a LinkedIn post, an X thread, a Dev.to article and a PDF carousel.' },
      },
      links: { 'https://github.com/MateoGs013/eros-agent': SOURCE, 'https://eros.mateogs.tech': 'control center' },
    },
  },

  experience: {
    'ynara': {
      role: 'Team thesis · lead contributor',
      summary: '382 commits in six weeks on Ynara, the thesis: an on-prem AI assistant with FastAPI, Next.js, Expo and Postgres with pgvector. Pre-approved; the defense is pending.',
      story: 'Final thesis at Escuela Da Vinci: development of an on-premise artificial intelligence assistant with FastAPI, Next.js, Expo and PostgreSQL with the pgvector extension. 382 commits leading the backend architecture, the vector embedding pipelines and the web interface.',
      highlights: [
        'Led the FastAPI backend architecture: embedding pipelines and calls to local models via Ollama.',
        'Designed the vector memory on PostgreSQL with pgvector, with cosine similarity search and encrypted storage.',
        'Built the web interface with Next.js and TypeScript on top of an inference engine that runs on the user\'s machine.',
      ],
    },
    'la-rucula': {
      role: 'Freelance · design and development',
      summary: 'Menu-first editorial site with its own management panel. In production.',
      story: 'From a scanned PDF to a menu-first website optimized for diners at the table via QR code. Integrated with a custom management panel and a local offline fallback: if the external API goes idle, the menu stays available with no degradation.',
      highlights: [
        'Designed and built a menu-first editorial site, made for guests arriving from the QR code on the table.',
        'Integrated a custom management panel with a local fallback: if the API goes idle, the menu stays available.',
        'Visual review with Playwright at three widths and an accessibility audit with axe before every deploy.',
      ],
    },
    'arg-piscinas': {
      role: 'Freelance · custom front end and back end',
      summary: 'Corporate website in three languages with a management panel and blog. In production.',
      story: 'End-to-end build of a multilingual corporate catalog (ES/EN/DE). A self-managed panel so the client uploads work without touching code, typing end to end with Prisma, and heavy assets optimized for instant loading on mobile connections.',
      highlights: [
        'Developed a corporate website in Spanish, English and German, with a custom management panel and blog.',
        'Modeled the catalog with Node.js and Prisma, with data typed end to end between the API and the front end.',
        'The client uploads their work from the panel without touching code or waiting for a deploy.',
      ],
    },
    'eros': {
      role: 'Own project · AI and automation',
      summary: 'Autonomous career assistant: it tracks job openings, evaluates them with AI and tailors the Harvard ATS CV to each one. In production at eros.mateogs.tech.',
      highlights: [
        'Multi-agent system that tracks job openings on LinkedIn, Get on Board and RemoteOK and evaluates them with Gemini.',
        'Tailors the Harvard ATS CV to each opening and drafts the application email and the note for the hiring lead.',
        'FastAPI backend with SQLite on its own VPS, publishing via n8n and supervision from a Telegram bot.',
      ],
    },
    'freelance': {
      role: 'Freelance · web design and development',
      summary: 'Around ten real client projects since 2023. The first one: the website of an architecture studio.',
      story: 'From brief to deploy: structure, content and experience in Figma; front end; back end; APIs and databases; responsive design and accessibility; production. Iterative work, with split deliverables and progressive reviews.',
      highlights: [
        'Custom web solutions from brief to deploy: structure and experience in Figma, front end, back end, APIs and databases.',
        'Responsive design and accessibility as part of every delivery, all the way to production.',
        'Iterative work, with split deliverables and progressive reviews alongside each client.',
      ],
    },
    'escuela-da-vinci': {
      role: 'Student · Web Design and Development',
      summary: 'Degree in progress, class of 2026. UI/UX, visual direction, modern front end, back end, databases and architecture. Pre-approved thesis: Ynara.',
      story: 'An intensive 3-year program in Web Design and Development: UI/UX principles, typography, visual direction, modern software architectures, concurrency patterns, and relational and non-relational databases.',
      highlights: [
        'Pre-approved graduation thesis: Ynara, an on-premise AI assistant with vector memory.',
        'Training in UI/UX, visual direction, modern web architectures, and relational and non-relational databases.',
      ],
    },
    'cet-30': {
      role: 'Programming Technician',
      summary: 'Programming at CET N.º 30, Río Negro. Programming Technician degree in 2023.',
      story: 'A 7-year technical program in Programming at Escuela Técnica N.º 30 in Cipolletti, Río Negro. Solid algorithmic foundations, data structures, binary logic, networking and software engineering methodologies.',
      highlights: ['A 7-year technical program in algorithmic logic, data structures, networking and software development.'],
    },
  },

  techs: {
    vue: 'Chosen for surgical reactivity, a clean Composition API and strict typing without boilerplate overhead.',
    typescript: 'A mandatory standard on client and server: if it isn\'t typed at compile time, it doesn\'t reach production.',
    gsap: 'Deterministic timeline orchestration for high-precision interfaces and spatial micro-interactions.',
    lenis: 'Normalized cross-platform inertial scrolling without breaking the browser\'s native behavior.',
    three: 'WebGL and GLSL shaders for immersive 3D experiences when the DOM isn\'t enough.',
    node: 'A high-performance runtime for lightweight REST APIs, middleware pipelines and event servers.',
    express: 'Minimalism and full control over the HTTP lifecycle, routing and authentication.',
    fastapi: 'The core for AI/NLP inference and processing, with Pydantic typing and minimal latency.',
    python: 'The language of choice for data engineering, vector embeddings and LLM orchestration.',
    postgresql: 'ACID relational persistence, declarative schemas and vector indexes with pgvector.',
    prisma: 'An ORM typed end to end: it generates exact TypeScript types straight from the SQL schema.',
    tailwind: 'A composable, utility-first design system with aggressive purging for ultra-light bundles.',
    vite: 'Ultra-fast tooling built on Rollup and esbuild for instant HMR in development.',
    angular: 'Enterprise architecture based on RxJS and Dependency Injection.',
    react: 'A massive ecosystem, React Server Components and hybrid rendering, adopted in the Ynara thesis.',
    next: 'A full-stack React framework with asset optimization, file-system routing and SSR.',
    mongodb: 'A document-oriented NoSQL database for agile prototyping and dynamic schemas in Barberpole.',
    supabase: 'Backend-as-a-Service with real-time Postgres, Row Level Security and S3 storage.',
    firebase: 'A BaaS platform for a reactive NoSQL database and fast social authentication.',
    laravel: 'A robust monolith with Eloquent ORM, session authentication and job queues for transactional platforms.',
    php: 'A traditional backend language used in client integrations and transactional modules.',
    javascript: 'The foundation of modern web development, ECMAScript standards and native DOM manipulation.',
  },

  docs: {
    about: {
      ...unchanged(aboutFields, ['name', 'display_name', 'portrait']),
      role: 'Full Stack Designer & Developer · Creative Developer',
      headline: 'I design and build entire web products, from idea to deploy.',
      portrait_alt: 'Portrait of Mateo Sonzogni',
      technical_degree: 'Programming Technician · CET N.º 30 (2017–2023)',
      higher_education: 'Web Design and Development · Escuela Da Vinci (2024–2026) · Pre-approved Thesis',
      freelance_experience: 'Active since 2023 · Custom web solutions and software',
      work_modalities: 'Remote · Hybrid · On-site',
      languages: ['Spanish (native)', 'English (B2, professional technical)'],
      core_competencies: 'Full-Cycle Engineering: Figma UI/UX → Reactive Frontend → REST APIs/Microservices → ACID Postgres → Deploy & Monitoring',
      engineering_philosophy: 'I develop with design judgment and a focus on the whole product: what problem it solves, how it should look, how it should feel, how it is built and how it reaches production. I don\'t position myself only as a programmer or only as a designer; I work the seam where technical architecture meets user experience.',
      professional_goal: 'To establish myself as a developer on a team with real, larger-scale projects. In the medium term, technical leadership: coordinating, organizing, communicating and connecting profiles from different areas (design, product, frontend and backend).',
    },
    contact: {
      ...unchanged(contactFields, ['email', 'github', 'linkedin', 'website', 'location', 'time_zone']),
      cv: '/cv/CV-EN-Mateo-Sonzogni-ATS.pdf',
      availability: 'Immediate · Direct hire, contractor or freelance',
      response_time: 'I reply the same day',
      preferred_contact: 'Direct email, LinkedIn or a message via GitHub',
    },
  },

  articles: {
    'postgresql-17-universal-vector-relational-production': postgresArticleEn,
  },
}
