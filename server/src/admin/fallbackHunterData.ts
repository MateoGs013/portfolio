// Datos de respaldo y motor de evaluación heurística para Job Hunter (Eros)
// Permite que la consola administrativa opere con resiliencia total si Eros Agent está desconectado o en reposo.

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
  status: 'new' | 'evaluated' | 'saved' | 'applied' | 'discarded'
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

export const fallbackHunterJobs: HunterJob[] = [
  {
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
    status: 'saved',
    match_score: 88,
    match_analysis: JSON.stringify({
      score: 88,
      verdict: 'EXCELENTE_MATCH',
      summary: 'Posición de ingeniería de producto con foco en Node.js, TypeScript y capacidades AI-Native. Coincide de lleno con la arquitectura de agentes autónomos y stack del portfolio de Mateo.',
      pros: [
        'Stack central 100% alineado: Node.js, TypeScript, REST APIs',
        'Cultura de ingeniería ágil con herramientas de IA asistida',
        'Modalidad remota compatible con disponibilidad horaria completa (UTC-3)',
      ],
      cons: ['Solicita seniority formal, mientras Mateo cuenta con 3 años de experiencia intensiva en producción'],
      missing_skills: ['AWS CloudFormation a gran escala'],
      matching_projects: ['Eros Agent', 'Ynara', 'Portafolio Dos Mundos'],
      salary_estimate: 'USD 3,000 - 5,000 / mes',
      recruiter_note: 'Hola, vi la búsqueda de Senior Full-Stack Product Engineer AI-Native en Jobgether. Me especializo en Node.js, TypeScript y arquitecturas con IA en producción (mateogs.tech). Me gustaría conectar y conversar.',
      hiring_manager_name: null,
      hiring_manager_title: null,
      hiring_manager_url: null,
    }),
    connection_note: 'Hola, vi la búsqueda de Senior Full-Stack Product Engineer AI-Native en Jobgether. Me especializo en Node.js, TypeScript y arquitecturas con IA en producción (mateogs.tech). Me gustaría conectar y conversar.',
    hiring_manager_name: 'Lead Recruiter',
    hiring_manager_title: 'Talent Acquisition',
    contact_email: 'talent@jobgether.com',
  },
  {
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
    status: 'saved',
    match_score: 93,
    match_analysis: JSON.stringify({
      score: 93,
      verdict: 'EXCELENTE_MATCH',
      summary: 'Equipo B2B SaaS de alto ritmo enfocado en TypeScript, Node, PostgreSQL y testing automatizado. La combinación exacta de tecnologías dominadas por Mateo en su portfolio y proyectos de clientes.',
      pros: [
        'Afinidad exacta en stack: TypeScript, Node.js, PostgreSQL 17, Prisma',
        'Metodología orientada a testing exhaustivo y despliegues continuos',
        'Remoto completo sin restricciones de ubicación',
      ],
      cons: ['Horario de colaboración concentrado en tardes/noches hora del Este'],
      missing_skills: [],
      matching_projects: ['Portafolio (mateogs.tech)', 'La Rúcula', 'ARG Piscinas'],
      salary_estimate: 'USD 3,500 - 4,800 / mes',
      recruiter_note: 'Hola, vi la búsqueda de Software Engineer en SaaS. Me especializo en Vue/Nuxt, Node y TypeScript con PostgreSQL 17 y Playwright (mateogs.tech). Me gustaría conversar sobre el puesto.',
      hiring_manager_name: null,
      hiring_manager_title: null,
      hiring_manager_url: null,
    }),
    connection_note: 'Hola, vi la búsqueda de Software Engineer en SaaS. Me especializo en Vue/Nuxt, Node y TypeScript con PostgreSQL 17 y Playwright (mateogs.tech). Me gustaría conversar sobre el puesto.',
    hiring_manager_name: null,
    hiring_manager_title: null,
    contact_email: 'jobs@startupsaas.io',
  },
  {
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
    status: 'new',
    match_score: null,
    match_analysis: null,
    connection_note: null,
    hiring_manager_name: 'Sarah Chen',
    hiring_manager_title: 'Head of Engineering',
    contact_email: 'engineering@bjak.com',
  },
  {
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
    status: 'new',
    match_score: null,
    match_analysis: null,
    connection_note: null,
    hiring_manager_name: 'Carlos Mendoza',
    hiring_manager_title: 'Engineering Recruiter',
    contact_email: 'cmendoza@krugernearshore.com',
  },
  {
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
    status: 'new',
    match_score: null,
    match_analysis: null,
    connection_note: null,
    hiring_manager_name: 'Valeria Rossi',
    hiring_manager_title: 'VP of Product Design',
    contact_email: 'valeria@vorticelabs.co',
  },
  {
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
    status: 'evaluated',
    match_score: 81,
    match_analysis: JSON.stringify({
      score: 81,
      verdict: 'BUEN_MATCH',
      summary: 'Puesto en consultora global de plataformas digitales con foco en TypeScript y servicios asíncronos en Node.js.',
      pros: ['Alineación técnica en TypeScript y backend asíncrono', 'Modalidad remota con equipos multiculturales'],
      cons: ['Proceso de contratación corporativo con múltiples etapas de evaluación'],
      missing_skills: ['Certificación en plataformas cloud corporativas'],
      matching_projects: ['Portafolio (mateogs.tech)', 'Ynara'],
      salary_estimate: 'USD 3,200 - 4,400 / mes (Estimación Eros)',
      recruiter_note: 'Hola, vi la búsqueda de Senior Full Stack Developer en EPAM. Me especializo en Vue/Nuxt, Node y TypeScript con proyectos en producción (mateogs.tech). Me gustaría conectar.',
      hiring_manager_name: null,
      hiring_manager_title: null,
      hiring_manager_url: null,
    }),
    connection_note: 'Hola, vi la búsqueda de Senior Full Stack Developer en EPAM. Me especializo en Vue/Nuxt, Node y TypeScript con proyectos en producción (mateogs.tech). Me gustaría conectar.',
    hiring_manager_name: null,
    hiring_manager_title: null,
    contact_email: 'careers-latam@epam.com',
  },
]

/** Evaluador heurístico determinista que analiza una vacante contra el stack real de Mateo */
export function evaluateJobHeuristic(job: HunterJob): { job: HunterJob, match: MatchAnalysis } {
  const text = `${job.title} ${job.description || ''} ${(job.tags || []).join(' ')} ${job.company}`.toLowerCase()

  let score = 55
  const pros: string[] = []
  const cons: string[] = []
  const missing: string[] = []
  const matchingProjects: string[] = []

  // Stack central: Vue / Nuxt
  if (text.includes('vue') || text.includes('nuxt')) {
    score += 18
    pros.push('Dominio de Vue 3, Nuxt 4, Composition API y SSR de alto rendimiento')
    matchingProjects.push('Portafolio Relacional (mateogs.tech)', 'La Rúcula')
  }

  // TypeScript / JavaScript
  if (text.includes('typescript') || text.includes('ts') || text.includes('javascript') || text.includes('js')) {
    score += 12
    pros.push('Desarrollo tipado estricto con TypeScript end-to-end')
    matchingProjects.push('Ynara', 'ARG Piscinas')
  }

  // Node.js / Express
  if (text.includes('node') || text.includes('express') || text.includes('api') || text.includes('backend')) {
    score += 12
    pros.push('Backend modular con Node.js, Express 5 y diseño de APIs RESTful ACID')
  }

  // Bases de datos: PostgreSQL / Prisma
  if (text.includes('postgres') || text.includes('sql') || text.includes('prisma') || text.includes('database')) {
    score += 10
    pros.push('Persistencia relacional con PostgreSQL 17 y Prisma ORM')
  }

  // React / Next.js (competencia secundaria probada)
  if (text.includes('react') || text.includes('next')) {
    score += 6
    pros.push('Arquitectura basada en componentes reactivos y state management moderno')
  }

  // Tailwind CSS / Micro-interacciones
  if (text.includes('tailwind') || text.includes('css') || text.includes('ui') || text.includes('design system')) {
    score += 6
    pros.push('Implementación de sistemas de diseño fluidos y micro-interacciones táctiles')
  }

  // IA / LLMs / Agents
  if (text.includes('ai') || text.includes('agent') || text.includes('llm') || text.includes('ia')) {
    score += 8
    pros.push('Experiencia práctica integrando Gemini, FastAPI y pipelines autónomos (Eros)')
    matchingProjects.push('Eros Career OS')
  }

  // Modalidad remota
  if (job.is_remote || text.includes('remot') || text.includes('remote')) {
    score += 5
    pros.push('Modalidad 100% remota alineada con huso horario argentino (UTC-3)')
  }

  // Detección de incompatibilidades
  if (text.includes('us only') || text.includes('w2 only') || text.includes('w-2 only') || text.includes('us citizen')) {
    score -= 35
    cons.push('Restricción geográfica o contractual estricta (US/W2 Only)')
  }
  if (text.includes('c#') || text.includes('.net') || text.includes('java') || text.includes('spring boot')) {
    score -= 8
    cons.push('Requiere tecnologías de ecosistema secundario (.NET / Java enterprise)')
    missing.push('Ecosistema .NET / Java')
  }
  if (text.includes('senior') || text.includes('lead') || text.includes('principal')) {
    score -= 4
    cons.push('La vacante solicita nivel Senior/Lead formal (+4-5 años de trayectoria corporativa)')
  }

  // Ajustar límites
  score = Math.max(25, Math.min(96, score))

  let verdict: MatchAnalysis['verdict']
  if (score >= 82) verdict = 'EXCELENTE_MATCH'
  else if (score >= 65) verdict = 'BUEN_MATCH'
  else if (score >= 45) verdict = 'REGULAR'
  else verdict = 'DESCARTAR'

  if (matchingProjects.length === 0) {
    matchingProjects.push('Portafolio Relacional (mateogs.tech)', 'La Rúcula')
  }

  const hName = job.hiring_manager_name ? job.hiring_manager_name.split(' ')[0] : ''
  const greeting = hName ? `Hola ${hName}, ` : 'Hola, '
  const recruiterNote = `${greeting}vi la búsqueda de ${job.title} en ${job.company}. Me especializo en Vue/Nuxt, Node y TypeScript con proyectos en producción (mateogs.tech). Me gustaría conectar y conversar.`

  const salaryEstimate = job.salary || 'USD 2,800 - 4,200 / mes (Estimación de mercado Eros)'

  const summary = `La vacante para ${job.title} en ${job.company} presenta un nivel de afinidad técnica del ${score}% con el perfil de Mateo. Su experiencia en producción con Express 5, PostgreSQL 17, TypeScript y frontend reactivo en Vue 3 / Nuxt 4 le permite integrarse con rapidez y autonomía operativa.`

  const analysis: MatchAnalysis = {
    score,
    verdict,
    summary,
    pros,
    cons: cons.length ? cons : ['Validar requerimientos secundarios y metodología de despliegues'],
    missing_skills: missing,
    matching_projects: matchingProjects,
    salary_estimate: salaryEstimate,
    recruiter_note: recruiterNote,
    hiring_manager_name: job.hiring_manager_name,
    hiring_manager_title: job.hiring_manager_title,
    hiring_manager_url: null,
  }

  // Actualizar datos del job
  job.match_score = score
  job.match_analysis = JSON.stringify(analysis)
  job.connection_note = recruiterNote
  if (!job.salary && salaryEstimate) {
    job.salary = salaryEstimate
  }

  if (verdict === 'DESCARTAR') {
    job.status = 'discarded'
  } else if (score >= 70) {
    job.status = 'saved'
  } else {
    job.status = 'evaluated'
  }

  return { job, match: analysis }
}

/** Evalúa en lote las vacantes pendientes en memoria */
export function evaluateMultipleJobsHeuristic(limit = 15): { ok: boolean, evaluated_count: number, evaluated: Array<{ id: string, title: string, score: number, verdict: string }> } {
  let pending = fallbackHunterJobs.filter(j => j.status === 'new' || j.match_score === null || j.match_score === undefined)

  // Si no hay vacantes nuevas, tomamos las primeras 'limit' para re-evaluación
  if (pending.length === 0) {
    pending = fallbackHunterJobs.slice(0, limit)
  } else {
    pending = pending.slice(0, limit)
  }

  const evaluated: Array<{ id: string, title: string, score: number, verdict: string }> = []

  for (const j of pending) {
    const { job, match } = evaluateJobHeuristic(j)
    evaluated.push({
      id: job.id,
      title: job.title,
      score: match.score,
      verdict: match.verdict,
    })
  }

  return {
    ok: true,
    evaluated_count: evaluated.length,
    evaluated,
  }
}

/** Calcula estadísticas globales de la cola de empleo */
export function computeHunterStats() {
  const total = fallbackHunterJobs.length
  const high_match_count = fallbackHunterJobs.filter(j => (j.match_score || 0) >= 70 && j.status !== 'discarded').length
  const pending_eval_count = fallbackHunterJobs.filter(j => (j.match_score === null || j.match_score === undefined || j.status === 'new') && j.status !== 'discarded').length
  const applied_count = fallbackHunterJobs.filter(j => j.status === 'applied').length
  const discarded_count = fallbackHunterJobs.filter(j => j.status === 'discarded').length

  return {
    total,
    high_match_count,
    pending_eval_count,
    applied_count,
    discarded_count,
  }
}

/** Genera pitch y carta de presentación adaptada para una vacante */
export function generatePitchHeuristic(job: HunterJob) {
  const isEn = !((job.title + ' ' + (job.description || '')).toLowerCase().includes('desarrollador') || (job.title + ' ' + (job.description || '')).toLowerCase().includes('experiencia'))

  if (isEn) {
    return {
      data: {
        subject: `Application: ${job.title} — Mateo Sonzogni`,
        elevator_pitch: `Hi team at ${job.company}, I am a Full Stack Software Engineer specializing in Vue 3, Nuxt 4, TypeScript, and Node.js with production experience building high-performance architectures (mateogs.tech). I would love to contribute to your ${job.title} initiatives.`,
        cover_letter: `Dear Hiring Team at ${job.company},\n\nI am writing to express my enthusiastic interest in the ${job.title} role. With hands-on experience designing end-to-end applications using TypeScript, Node.js, and relational database systems (PostgreSQL 17), I focus on shipping maintainable, tested, and high-performance software.\n\nYou can review my production code and live projects at https://mateogs.tech.\n\nBest regards,\nMateo Sonzogni`,
        connection_note: job.connection_note || `Hi, saw your ${job.title} opening at ${job.company}. I build Full Stack apps with TS/Node/Vue. Let's connect!`,
      },
    }
  }

  return {
    data: {
      subject: `Postulación: ${job.title} — Mateo Gabriel Sonzogni`,
      elevator_pitch: `Hola equipo de ${job.company}, soy desarrollador Full Stack especializado en Vue 3, Nuxt 4, TypeScript y Node.js con sistemas en producción y arquitectura desacoplada (mateogs.tech). Me entusiasma aportar valor directo al equipo de ${job.title}.`,
      cover_letter: `Estimado equipo de selección de ${job.company},\n\nMe pongo en contacto para presentar mi postulación a la búsqueda de ${job.title}. Mi perfil combina desarrollo full stack riguroso, arquitectura de bases de datos relacionales (PostgreSQL 17) y micro-interacciones accesibles.\n\nEn mi portafolio (https://mateogs.tech) pueden explorar casos de estudio reales con código abierto y métricas de producción.\n\nSaludos cordiales,\nMateo Gabriel Sonzogni`,
      connection_note: job.connection_note || `Hola, vi la búsqueda de ${job.title} en ${job.company}. Especializado en TS/Node/Vue con proyectos en producción (mateogs.tech). Me gustaría conectar!`,
    },
  }
}

/** Genera datos estructurados para el CV Harvard ATS adaptado */
export function generateCvHeuristic(job: HunterJob) {
  return {
    data: {
      candidate: {
        name: 'Mateo Gabriel Sonzogni',
        title: 'Full Stack Software Engineer',
        email: 'mateogabus@gmail.com',
        phone: '+54 343 517-8494',
        location: 'Paraná, Entre Ríos, Argentina (UTC-3)',
        links: [
          { label: 'Portafolio', url: 'https://mateogs.tech' },
          { label: 'GitHub', url: 'https://github.com/MateoGs013' },
          { label: 'LinkedIn', url: 'https://linkedin.com/in/mateo-sonzogni' },
        ],
      },
      summary: `Desarrollador de software Full Stack especializado en TypeScript, Node.js, Express y Vue 3 / Nuxt 4. Experiencia comprobada diseñando APIs RESTful seguras, modelos relacionales con PostgreSQL 17 y frontend con rendimiento medido (Lighthouse 98+). Adaptado específicamente para la búsqueda de ${job.title} en ${job.company}.`,
      skills: [
        'Lenguajes: TypeScript, JavaScript (ES2024), SQL, Python, HTML5, CSS3',
        'Frontend: Vue 3, Nuxt 4, Composition API, Pinia, Tailwind CSS v4, Motion Web',
        'Backend & APIs: Node.js, Express 5, RESTful Services, Prisma 7 ORM, FastAPI',
        'Bases de Datos & DevOps: PostgreSQL 17, Docker, Docker Compose, Git, Linux VPS, Coolify',
        'Calidad & Testing: Playwright (E2E), Vitest, Pruebas de Regresión Visual',
      ],
      projects: [
        {
          title: 'Portafolio Relacional & CMS 2026',
          role: 'Full Stack Software Engineer',
          period: '2026',
          location: 'Remoto',
          bullets: [
            'Diseño e implementación de arquitectura desacoplada Nuxt 4 Nitro + Express 5 con 9 modelos relacionales PostgreSQL 17.',
            'Consola de administración SPA con suite de evaluación IA, Command Palette (Ctrl+K) y auditoría automatizada Playwright.',
          ],
        },
        {
          title: 'Ynara & La Rúcula Gastrobar',
          role: 'Full Stack Developer',
          period: '2024 - 2026',
          location: 'Remoto',
          bullets: [
            'Desarrollo de catálogo digital con menú interactivo offline-first mediante QR y sincronización de inventario en tiempo real.',
            'Optimización integral de carga reduciendo el bundle footprint por debajo de 45 kB gzip.',
          ],
        },
      ],
      education: [
        {
          degree: 'Ingeniería en Sistemas / Desarrollo de Software',
          institution: 'Universidad Tecnológica Nacional (UTN)',
          period: '2022 - En curso',
        },
      ],
    },
  }
}

/** Renderiza la vista previa HTML imprimible del CV Harvard ATS (1 página A4 estricta) */
export function renderCvHtmlHeuristic(job: HunterJob): string {
  const cv = generateCvHeuristic(job).data

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CV · ${cv.candidate.name} · Harvard ATS</title>
  <style>
    @page { size: A4 portrait; margin: 15mm 18mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Times New Roman", Times, Georgia, serif; font-size: 10.5pt; line-height: 1.35; color: #000; background: #fff; padding: 12mm 15mm; }
    h1 { text-align: center; font-size: 17pt; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 3pt; }
    .contact-line { text-align: center; font-size: 9.5pt; margin-bottom: 12pt; border-bottom: 1px solid #000; padding-bottom: 6pt; }
    .contact-line a { color: #000; text-decoration: none; }
    .section-title { font-size: 11pt; font-weight: bold; text-transform: uppercase; border-bottom: 0.75pt solid #000; margin-top: 10pt; margin-bottom: 4pt; letter-spacing: 0.5px; }
    .entry { margin-bottom: 6pt; }
    .entry-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 10pt; }
    .entry-sub { display: flex; justify-content: space-between; font-style: italic; font-size: 9.5pt; margin-bottom: 2pt; }
    ul { list-style-type: disc; margin-left: 14pt; margin-top: 2pt; }
    li { font-size: 9.5pt; margin-bottom: 1.5pt; text-align: justify; }
    p.summary { font-size: 9.5pt; text-align: justify; margin-bottom: 4pt; }
    @media print {
      body { padding: 0; }
      @page { margin: 12mm 15mm; }
    }
  </style>
</head>
<body>
  <h1>${cv.candidate.name}</h1>
  <div class="contact-line">
    ${cv.candidate.location} · ${cv.candidate.phone} · <a href="mailto:${cv.candidate.email}">${cv.candidate.email}</a> · <a href="${cv.candidate.links[0]?.url || 'https://mateogs.tech'}">mateogs.tech</a> · <a href="https://github.com/MateoGs013">GitHub</a>
  </div>

  <div class="section-title">Perfil Profesional</div>
  <p class="summary">${cv.summary}</p>

  <div class="section-title">Habilidades Técnicas</div>
  <ul>
    ${cv.skills.map(s => `<li>${s}</li>`).join('')}
  </ul>

  <div class="section-title">Experiencia y Proyectos Destacados</div>
  ${cv.projects.map(p => `
    <div class="entry">
      <div class="entry-header">
        <span>${p.title}</span>
        <span>${p.period}</span>
      </div>
      <div class="entry-sub">
        <span>${p.role}</span>
        <span>${p.location}</span>
      </div>
      <ul>
        ${p.bullets.map(b => `<li>${b}</li>`).join('')}
      </ul>
    </div>
  `).join('')}

  <div class="section-title">Educación</div>
  ${cv.education.map(e => `
    <div class="entry">
      <div class="entry-header">
        <span>${e.institution}</span>
        <span>${e.period}</span>
      </div>
      <div class="entry-sub">
        <span>${e.degree}</span>
      </div>
    </div>
  `).join('')}
</body>
</html>`
}
