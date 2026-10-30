/**
 * Vacantes de ejemplo de Eros para operar el Job Hunter sin el agente (modo contingencia). Son
 * avisos tal como los trae el escaneo: sin evaluar. La evaluación, el pitch y el CV de respaldo
 * se calculan contra la base (hunterHeuristics.ts y hunterCv.ts), nunca se escriben acá.
 */

export type HunterJobStatus = 'new' | 'evaluated' | 'saved' | 'applied' | 'discarded'

export interface HunterJob {
  id: string
  source: string
  external_id: string
  title: string
  company: string
  url: string
  description: string
  tags: string[]
  salary: string | null
  country: string | null
  is_remote: boolean | number
  published_at: string | null
  found_at: string
  status: HunterJobStatus
  match_score: number | null
  match_analysis: string | null
  connection_note: string | null
  hiring_manager_name: string | null
  hiring_manager_title: string | null
  contact_email: string | null
  pitch_draft?: string | null
  tailored_cv?: string | null
  semantic_score?: number | null
}

export interface MatchAnalysis {
  score: number
  verdict: 'EXCELENTE_MATCH' | 'BUEN_MATCH' | 'REGULAR' | 'DESCARTAR'
  summary: string
  pros: string[]
  cons: string[]
  missing_skills: string[]
  matching_projects: string[]
  salary_estimate: string | null
  recruiter_note: string
  hiring_manager_name: string | null
  hiring_manager_title: string | null
  hiring_manager_url: string | null
}

type ScannedJob = Omit<HunterJob, 'status' | 'match_score' | 'match_analysis' | 'connection_note'>

/** Un aviso recién escaneado: nuevo y sin evaluar. */
function scanned(job: ScannedJob): HunterJob {
  return { ...job, status: 'new', match_score: null, match_analysis: null, connection_note: null }
}

export const fallbackHunterJobs: HunterJob[] = [
  scanned({
    id: '7ff020ff4129470d',
    source: 'linkedin',
    external_id: '4477990519',
    title: 'Senior Full-Stack Product Engineer | Node.js, AI-Native (Boosters R&D)',
    company: 'Jobgether',
    url: 'https://www.linkedin.com/jobs/view/4477990519',
    description: 'Buscamos Full-Stack Product Engineer para liderar desarrollo con Node.js, TypeScript y soluciones AI-Native. Modalidad remota LATAM.',
    tags: ['LinkedIn', 'Remote', 'Node.js', 'TypeScript', 'AI'],
    salary: 'USD 3,000 - 5,000 / mes',
    country: 'Chile / Remoto LATAM',
    is_remote: 1,
    published_at: '2026-10-13',
    found_at: '2026-10-20T01:52:16.061Z',
    hiring_manager_name: null,
    hiring_manager_title: 'Talent Acquisition',
    contact_email: 'talent@jobgether.com',
  }),
  scanned({
    id: '589dd2fb25c67bad',
    source: 'linkedin',
    external_id: '4478733788',
    title: 'Software Engineer (TypeScript, Node services, React & PostgreSQL)',
    company: 'Confidential Startup SaaS Company',
    url: 'https://www.linkedin.com/jobs/view/4478733788',
    description: 'We are a small B2B software team that ships fast. Node services, React/Vue front-ends, PostgreSQL, LLM tooling, end-to-end testing.',
    tags: ['LinkedIn', 'Remote', 'TypeScript', 'Node.js', 'PostgreSQL', 'React'],
    salary: 'USD 3,500 - 4,800 / mes',
    country: 'LATAM / Worldwide',
    is_remote: 1,
    published_at: '2026-10-13',
    found_at: '2026-10-20T01:52:14.375Z',
    hiring_manager_name: null,
    hiring_manager_title: null,
    contact_email: 'jobs@startupsaas.io',
  }),
  scanned({
    id: '3735c0410255ea25',
    source: 'remoteok',
    external_id: '1137420',
    title: 'Frontend Engineer (Vue 3 / TypeScript)',
    company: 'Bjak Financial Technologies',
    url: 'https://remoteOK.com/remote-jobs/remote-frontend-engineer-bjak-1137420',
    description: 'We are looking for a skilled Frontend Engineer proficient in Vue 3, Composition API, TypeScript, and modern CSS architectures to build high-performance client dashboards and micro-interactions.',
    tags: ['RemoteOK', 'Vue', 'TypeScript', 'Frontend', 'Tailwind'],
    salary: 'USD 3,200 - 4,500 / mes',
    country: 'Worldwide / Remoto',
    is_remote: 1,
    published_at: '2026-10-18',
    found_at: '2026-10-21T14:10:00.000Z',
    hiring_manager_name: 'Sarah Chen',
    hiring_manager_title: 'Head of Engineering',
    contact_email: 'engineering@bjak.com',
  }),
  scanned({
    id: '8d37c58a34a3e553',
    source: 'getonboard',
    external_id: '1137062',
    title: 'Desarrollador Full Stack (Node.js & Vue / React)',
    company: 'Kruger NearShore LLC',
    url: 'https://remoteOK.com/remote-jobs/remote-desarrollador-full-stack-kruger-nearshore-llc-rekluti-1137062',
    description: 'Buscamos desarrollador Full Stack con experiencia en Node.js, Express, bases de datos relacionales y librerías modernas de frontend para integrarse a proyectos internacionales.',
    tags: ['GetOnBoard', 'Node.js', 'Express', 'Vue', 'PostgreSQL'],
    salary: 'USD 2,500 - 3,800 / mes',
    country: 'Worldwide / Remoto',
    is_remote: 1,
    published_at: '2026-10-19',
    found_at: '2026-10-21T18:22:00.000Z',
    hiring_manager_name: 'Carlos Mendoza',
    hiring_manager_title: 'Engineering Recruiter',
    contact_email: 'cmendoza@krugernearshore.com',
  }),
  scanned({
    id: 'b1f34ee10485584a',
    source: 'getonboard',
    external_id: '448120',
    title: 'Senior Front-end Developer (Design Systems & Micro-interactions)',
    company: 'Vortice Labs',
    url: 'https://www.getonbrd.com/jobs/programming/senior-front-end-developer-vortice-labs',
    description: 'Buscamos especialista en frontend con dominio profundo de Tailwind CSS, animaciones web fluidas, Vue 3 / Nuxt y componentes accesibles inspirados en Bencho UI / Linear.',
    tags: ['GetOnBoard', 'Vue 3', 'Nuxt', 'Tailwind', 'Design Systems'],
    salary: 'USD 3,000 - 4,200 / mes',
    country: 'Remoto LATAM',
    is_remote: 1,
    published_at: '2026-10-20',
    found_at: '2026-10-22T09:15:00.000Z',
    hiring_manager_name: 'Valeria Rossi',
    hiring_manager_title: 'VP of Product Design',
    contact_email: 'valeria@vorticelabs.co',
  }),
  scanned({
    id: '0cf33b331de5caf9',
    source: 'linkedin',
    external_id: '4477967218',
    title: 'Senior Full Stack Developer (JavaScript / TypeScript / APIs)',
    company: 'EPAM Systems',
    url: 'https://www.linkedin.com/jobs/view/4477967218',
    description: 'Global digital platform engineering. Seeking experienced Full Stack Developer with strong TypeScript, Node.js, and modern reactive frontend frameworks.',
    tags: ['LinkedIn', 'TypeScript', 'Node.js', 'Express', 'APIs'],
    salary: 'No especificado en la vacante',
    country: 'Colombia / Remoto LATAM',
    is_remote: 1,
    published_at: '2026-10-13',
    found_at: '2026-10-20T01:52:13.357Z',
    hiring_manager_name: null,
    hiring_manager_title: null,
    contact_email: 'careers-latam@epam.com',
  }),
]

export function findJob(id: string): HunterJob | undefined {
  return fallbackHunterJobs.find(j => j.id === id || j.external_id === id)
}

type Query = Record<string, unknown>

function queryText(query: Query, key: string): string {
  const raw = query[key]
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * La vacante de ejemplo con ese id o, si Eros la tenía y acá no está, una con el título, la
 * empresa y el correo que el admin manda en la query (?title=&company=&email=).
 */
export function jobFromQuery(id: string, query: Query): HunterJob {
  return findJob(id) ?? scanned({
    id,
    source: 'eros',
    external_id: id,
    title: queryText(query, 'title'),
    company: queryText(query, 'company'),
    url: '',
    description: '',
    tags: [],
    salary: null,
    country: null,
    is_remote: false,
    published_at: null,
    found_at: new Date().toISOString(),
    hiring_manager_name: null,
    hiring_manager_title: null,
    contact_email: queryText(query, 'email') || null,
  })
}
