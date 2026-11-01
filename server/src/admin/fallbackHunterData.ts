/**
 * Muestra de vacantes para pruebas y capturas: solo existe con EROS_DEMO=1 y solo cuando Eros no
 * responde. Empresas y dominios ficticios (example.com), sin salarios, sin contactos con nombre y sin
 * puntajes: la evaluación se calcula contra la base (hunterHeuristics.ts). Tres avisos en español y
 * tres en inglés, para medir el CV en los dos idiomas. Nunca se modifica en memoria.
 */
import type { HunterJob, JobInput } from '../shared/hunterContracts.js'

export const erosDemo = () => process.env['EROS_DEMO'] === '1'

interface Sample {
  id: string
  title: string
  company: string
  description: string
  tags: string[]
  country: string
  remote: boolean
}

const samples: readonly Sample[] = [
  {
    id: 'demo-frontend-vue',
    title: 'Desarrollador Frontend (Vue 3 y Nuxt)',
    company: 'Ejemplo Norte',
    description: 'Buscamos un desarrollador frontend con experiencia en Vue 3, Nuxt, TypeScript y Tailwind CSS para sumarse al equipo de producto. Trabajo remoto con entregas semanales.',
    tags: ['Vue 3', 'Nuxt', 'TypeScript', 'Tailwind CSS'],
    country: 'Argentina',
    remote: true,
  },
  {
    id: 'demo-fullstack-node',
    title: 'Desarrollador Full Stack (Node.js y PostgreSQL)',
    company: 'Ejemplo Sur',
    description: 'Buscamos un desarrollador full stack con conocimientos de Node.js, Express, Prisma y PostgreSQL para mantener la plataforma de la empresa y su panel de gestión.',
    tags: ['Node.js', 'Express', 'Prisma', 'PostgreSQL'],
    country: 'Uruguay',
    remote: true,
  },
  {
    id: 'demo-creative-gsap',
    title: 'Desarrolladora Creativa (GSAP y Three.js)',
    company: 'Ejemplo Faro',
    description: 'Estudio de diseño busca perfil creativo para sitios con animación: GSAP, Three.js y Vite. Requisitos: portafolio con trabajo en producción y criterio de diseño.',
    tags: ['GSAP', 'Three.js', 'Vite'],
    country: 'Chile',
    remote: false,
  },
  {
    id: 'demo-frontend-react',
    title: 'Frontend Engineer (React and Next.js)',
    company: 'Example Labs',
    description: 'We are hiring a frontend engineer to build product interfaces with React, Next.js and TypeScript. Remote role with a small product team.',
    tags: ['React', 'Next.js', 'TypeScript'],
    country: 'Worldwide',
    remote: true,
  },
  {
    id: 'demo-backend-python',
    title: 'Backend Developer (Python and FastAPI)',
    company: 'Example Analytics',
    description: 'Looking for a backend developer to design APIs with Python, FastAPI and PostgreSQL, including vector search over embeddings.',
    tags: ['Python', 'FastAPI', 'PostgreSQL'],
    country: 'Worldwide',
    remote: true,
  },
  {
    id: 'demo-fullstack-java',
    title: 'Senior Full Stack Engineer (Java and Angular)',
    company: 'Example Freight',
    description: 'Senior engineer for a logistics platform built with Java, Spring Boot and Angular. US only, on-site two days a week.',
    tags: ['Java', 'Spring Boot', 'Angular'],
    country: 'United States',
    remote: false,
  },
]

function toJob(s: Sample): HunterJob {
  return {
    id: s.id,
    source: 'demo',
    external_id: s.id,
    title: s.title,
    company: s.company,
    url: `https://example.com/empleos/${s.id}`,
    description: s.description,
    tags: [...s.tags],
    salary: null,
    country: s.country,
    is_remote: s.remote,
    published_at: null,
    found_at: null,
    status: 'new',
    match_score: null,
    match_analysis: null,
    connection_note: null,
    hiring_manager_name: null,
    hiring_manager_title: null,
    contact_email: 'empleos@example.com',
    pitch_draft: null,
    semantic_score: null,
    _source: 'demo',
    demo: true,
  }
}

/** La muestra, en copias nuevas cada vez: vacía sin EROS_DEMO. */
export function demoJobs(): HunterJob[] {
  return erosDemo() ? samples.map(toJob) : []
}

/** La vacante de la muestra con ese id (solo con EROS_DEMO). */
export function findDemoJob(id: string): HunterJob | undefined {
  return demoJobs().find(j => j.id === id)
}

/** Una vacante que manda el admin, con el id de la ruta: nueva y sin evaluar. */
export function jobFromInput(id: string, input: JobInput): HunterJob {
  return {
    id,
    source: id.startsWith('manual-') ? 'manual' : 'eros',
    external_id: id,
    title: input.title,
    company: input.company,
    url: input.url,
    description: input.description,
    tags: input.tags,
    salary: null,
    country: null,
    is_remote: false,
    published_at: null,
    found_at: null,
    status: 'new',
    match_score: null,
    match_analysis: null,
    connection_note: null,
    hiring_manager_name: null,
    hiring_manager_title: null,
    contact_email: input.contact_email,
    pitch_draft: null,
    semantic_score: null,
  }
}

export function inputOf(job: HunterJob): JobInput {
  return { title: job.title, company: job.company, description: job.description, tags: job.tags, url: job.url, contact_email: job.contact_email }
}
