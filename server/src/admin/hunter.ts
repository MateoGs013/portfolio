import { Router, type Request, type Response } from 'express'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { db } from '../db.js'

export const hunterRouter = Router()

const HUNTER_URL = process.env['HUNTER_API_URL']
const DATA_DIR = path.resolve('server/data')
const JOBS_FILE = path.resolve(DATA_DIR, 'hunter_jobs.json')

interface JobRecord {
  id: string
  title: string
  company: string
  source: string
  url: string
  salary: string
  match_score: number
  status: 'new' | 'saved' | 'applied' | 'discarded'
  created_at: string
  match_analysis?: string | {
    match_score: number
    required_skills: string[]
    matching_skills: string[]
    missing_skills: string[]
    summary: string
  }
  pitch_draft?: {
    subject_or_hook: string
    elevator_pitch: string
  }
  tailored_cv?: {
    name: string
    title: string
    location: string
    email?: string
    portfolio?: string
    github?: string
    summary: string
    skills: Record<string, string[]>
    experience: Array<{ title: string; role: string; period: string; bullets: string[] }>
    education: Array<{ school: string; degree: string; year: string }>
  }
}

// ─── PERSISTENCIA LOCAL DE VACANTES ──────────────────────────────────────────

async function loadLocalJobs(): Promise<JobRecord[]> {
  try {
    const raw = await readFile(JOBS_FILE, 'utf-8')
    const list = JSON.parse(raw)
    if (Array.isArray(list)) return list
  } catch {
    // Si no existe, creamos el set inicial
  }
  const initial = getInitialSeededJobs()
  await saveLocalJobs(initial).catch(() => undefined)
  return initial
}

async function saveLocalJobs(jobs: JobRecord[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf-8')
}

function getInitialSeededJobs(): JobRecord[] {
  return [
    {
      id: 'curated-01',
      title: 'Senior Frontend Engineer (Vue 3 / Nuxt)',
      company: 'Vercel Ecosystem Labs',
      source: 'RemoteOK',
      url: 'https://remoteok.com',
      salary: '$85,000 - $110,000 USD',
      match_score: 95,
      status: 'saved',
      created_at: new Date().toISOString(),
      match_analysis: {
        match_score: 95,
        required_skills: ['Vue 3', 'Nuxt 4', 'TypeScript', 'Tailwind CSS', 'Performance Optimization'],
        matching_skills: ['Vue 3', 'Nuxt 4', 'TypeScript', 'Tailwind CSS'],
        missing_skills: ['GraphQL Federation'],
        summary: 'Afinidad sobresaliente en el core de la vacante. Experiencia directa comprobable en arquitecturas frontend reactivas de alta velocidad y 100% Lighthouse score.',
      },
      pitch_draft: {
        subject_or_hook: 'Senior Frontend Engineer · Especialista en Vue 3, Nuxt y Performance Web',
        elevator_pitch: 'Hola equipo de Vercel Ecosystem Labs, sigo de cerca su trabajo y vi su búsqueda para Senior Frontend Engineer. Durante los últimos 4 años me he enfocado en diseñar y programar interfaces de alto rendimiento con Vue 3, Nuxt y Tailwind CSS, logrando métricas LCP menores a 800ms y bundles reducidos a menos de 45 kB. Creo que mi experiencia en diseño de interacción y código limpio puede sumar valor inmediato a sus plataformas.',
      },
    },
    {
      id: 'curated-02',
      title: 'Full Stack Engineer (TypeScript & Node.js)',
      company: 'Supabase Studio Partners',
      source: 'Arbeitnow',
      url: 'https://www.arbeitnow.com',
      salary: '$75,000 - $95,000 USD',
      match_score: 88,
      status: 'saved',
      created_at: new Date().toISOString(),
      match_analysis: {
        match_score: 88,
        required_skills: ['TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Prisma ORM'],
        matching_skills: ['TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Prisma ORM'],
        missing_skills: ['GoLang'],
        summary: 'Compatibilidad técnica directa en la capa de datos y servicios con PostgreSQL 17 y TypeScript tipado de extremo a extremo.',
      },
    },
    {
      id: 'curated-03',
      title: 'UI/UX Design Systems Engineer',
      company: 'Linear Craft Technologies',
      source: 'RemoteOK',
      url: 'https://remoteok.com',
      salary: '$90,000 - $120,000 USD',
      match_score: 92,
      status: 'saved',
      created_at: new Date().toISOString(),
      match_analysis: {
        match_score: 92,
        required_skills: ['Design Systems', 'Tailwind CSS', 'Ergonomic UI', 'Component Architecture', 'TypeScript'],
        matching_skills: ['Design Systems', 'Tailwind CSS', 'Ergonomic UI', 'TypeScript'],
        missing_skills: ['Figma Tokens API'],
        summary: 'Enfoque estético y funcional coincidente con la metodología Obsidian Dark y micro-interacciones de alta densidad.',
      },
    },
  ]
}

// ─── PROXY UPSTREAM A EROS (CON TIMEOUT RÁPIDO) ─────────────────────────────

async function forwardToEros(pathStr: string, init?: RequestInit, timeoutMs = 2000) {
  if (!HUNTER_URL) return null
  try {
    const res = await fetch(`${HUNTER_URL.replace(/\/$/, '')}/${pathStr.replace(/^\//, '')}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      signal: AbortSignal.timeout(timeoutMs),
    })
    const data = await res.json().catch(() => null)
    return { ok: res.ok, status: res.status, data }
  } catch {
    return null
  }
}

// ─── MOTOR DE ESCANEO NATIVO DE EROS (NODE.JS / TYPESCRIPT) ─────────────────

async function runNativeScan(): Promise<{ newJobs: number; total: number }> {
  const existingJobs = await loadLocalJobs()
  const existingMap = new Map(existingJobs.map(j => [j.id, j]))

  // 1. Obtener el stack real de Mateo de la base de datos para calcular afinidad
  const dbTechs = await db.tech.findMany({ select: { name: true, slug: true } }).catch(() => [])
  const techNames = [
    'vue', 'nuxt', 'typescript', 'javascript', 'tailwind', 'css', 'node', 'express',
    'postgresql', 'postgres', 'prisma', 'docker', 'vite', 'html', 'frontend', 'ui', 'fullstack',
    ...dbTechs.map(t => t.name.toLowerCase()),
    ...dbTechs.map(t => t.slug.toLowerCase()),
  ]
  const userStackSet = new Set(techNames)

  const fetchedJobs: JobRecord[] = []

  // 2. Escanear RemoteOK (API pública JSON)
  try {
    const rRes = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'PortfolioErosHunter/1.0 (contact: mateogabus@gmail.com)' },
      signal: AbortSignal.timeout(6000),
    })
    if (rRes.ok) {
      const items = (await rRes.json().catch(() => [])) as Array<Record<string, unknown>>
      const list = Array.isArray(items) ? items.slice(1, 40) : [] // La primera posición es metadata legal

      for (const item of list) {
        const id = `remoteok-${String(item['id'] || Math.random().toString(36).slice(2))}`
        const position = String(item['position'] || 'Software Engineer')
        const company = String(item['company'] || 'Remote Tech Co')
        const tags = Array.isArray(item['tags']) ? item['tags'].map(t => String(t).toLowerCase()) : []
        const url = String(item['apply_url'] || item['url'] || 'https://remoteok.com')
        
        let salary = 'Salario competitivo'
        if (item['salary_min'] && item['salary_max']) {
          salary = `$${Number(item['salary_min']).toLocaleString()} - $${Number(item['salary_max']).toLocaleString()} USD`
        }

        // Evaluar compatibilidad
        const matchedTechs = tags.filter(t => userStackSet.has(t) || userStackSet.has(t.replace(/[^a-z]/g, '')))
        const titleLower = position.toLowerCase()
        let score = 50
        if (titleLower.includes('frontend') || titleLower.includes('front-end')) score += 25
        if (titleLower.includes('vue') || titleLower.includes('nuxt')) score += 20
        if (titleLower.includes('full stack') || titleLower.includes('fullstack')) score += 15
        if (titleLower.includes('typescript') || titleLower.includes('javascript')) score += 10
        score += Math.min(matchedTechs.length * 5, 20)
        score = Math.min(Math.max(score, 30), 98)

        // Filtrar solo roles con afinidad razonable
        if (score >= 60 || titleLower.includes('engineer') || titleLower.includes('developer')) {
          fetchedJobs.push({
            id,
            title: position,
            company,
            source: 'RemoteOK',
            url,
            salary,
            match_score: score,
            status: 'new',
            created_at: new Date().toISOString(),
            match_analysis: {
              match_score: score,
              required_skills: tags.slice(0, 6).map(t => t.toUpperCase()),
              matching_skills: matchedTechs.slice(0, 4).map(t => t.toUpperCase()),
              missing_skills: tags.filter(t => !userStackSet.has(t)).slice(0, 2).map(t => t.toUpperCase()),
              summary: `Oportunidad detectada en RemoteOK con ${matchedTechs.length} tecnologías coincidentes en tu stack principal.`,
            },
          })
        }
      }
    }
  } catch (err) {
    console.warn('[Eros Native Scan] Falló escaneo en RemoteOK:', err)
  }

  // 3. Escanear Arbeitnow (API pública de empleos remotos)
  try {
    const aRes = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      signal: AbortSignal.timeout(6000),
    })
    if (aRes.ok) {
      const json = (await aRes.json().catch(() => ({ data: [] }))) as { data?: Array<Record<string, unknown>> }
      const items = Array.isArray(json.data) ? json.data.slice(0, 30) : []

      for (const item of items) {
        const id = `arbeitnow-${String(item['slug'] || Math.random().toString(36).slice(2))}`
        const title = String(item['title'] || 'Software Engineer')
        const company = String(item['company_name'] || 'Tech Studio')
        const tags = Array.isArray(item['tags']) ? item['tags'].map(t => String(t).toLowerCase()) : []
        const url = String(item['url'] || 'https://www.arbeitnow.com')
        const titleLower = title.toLowerCase()

        const matchedTechs = tags.filter(t => userStackSet.has(t))
        let score = 55
        if (titleLower.includes('frontend') || titleLower.includes('vue')) score += 25
        if (titleLower.includes('full stack') || titleLower.includes('typescript')) score += 15
        score += Math.min(matchedTechs.length * 5, 20)
        score = Math.min(Math.max(score, 35), 96)

        if (score >= 60 || titleLower.includes('developer') || titleLower.includes('engineer')) {
          fetchedJobs.push({
            id,
            title,
            company,
            source: 'Arbeitnow',
            url,
            salary: 'Rango a convenir',
            match_score: score,
            status: 'new',
            created_at: new Date().toISOString(),
            match_analysis: {
              match_score: score,
              required_skills: tags.slice(0, 6).map(t => t.toUpperCase()),
              matching_skills: matchedTechs.slice(0, 4).map(t => t.toUpperCase()),
              missing_skills: tags.filter(t => !userStackSet.has(t)).slice(0, 2).map(t => t.toUpperCase()),
              summary: `Vacante remota indexada desde Arbeitnow con foco en ingeniería web.`,
            },
          })
        }
      }
    }
  } catch (err) {
    console.warn('[Eros Native Scan] Falló escaneo en Arbeitnow:', err)
  }

  // 4. Fusionar preservando los registros modificados o existentes
  let newJobsCount = 0
  for (const job of fetchedJobs) {
    if (!existingMap.has(job.id)) {
      existingMap.set(job.id, job)
      newJobsCount++
    }
  }

  const merged = Array.from(existingMap.values()).sort((a, b) => b.match_score - a.match_score)
  await saveLocalJobs(merged)

  return { newJobs: newJobsCount, total: merged.length }
}

// ─── ENDPOINTS DE LA API DE HUNTER ──────────────────────────────────────────

/** GET /api/admin/hunter/stats */
hunterRouter.get('/stats', async (_req: Request, res: Response) => {
  const upstream = await forwardToEros('api/stats')
  if (upstream && upstream.ok) {
    res.status(upstream.status).json(upstream.data)
    return
  }

  const jobs = await loadLocalJobs()
  const stats = {
    total_jobs: jobs.length,
    high_match_count: jobs.filter(j => j.match_score >= 70).length,
    applied_count: jobs.filter(j => j.status === 'applied').length,
    discarded_count: jobs.filter(j => j.status === 'discarded').length,
  }
  res.json(stats)
})

/** GET /api/admin/hunter/jobs */
hunterRouter.get('/jobs', async (req: Request, res: Response) => {
  const query = new URLSearchParams(req.query as Record<string, string>).toString()
  const upstream = await forwardToEros(`api/jobs${query ? `?${query}` : ''}`)
  if (upstream && upstream.ok) {
    res.status(upstream.status).json(upstream.data)
    return
  }

  const jobs = await loadLocalJobs()
  res.json(jobs)
})

/** POST /api/admin/hunter/scan */
hunterRouter.post('/scan', async (_req: Request, res: Response) => {
  const upstream = await forwardToEros('api/scan', { method: 'POST' })
  if (upstream && upstream.ok) {
    res.status(upstream.status).json(upstream.data)
    return
  }

  // Ejecución nativa resiliente
  try {
    const result = await runNativeScan()
    res.json({ ok: true, new_jobs: result.newJobs, total: result.total })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: `Fallo durante el escaneo nativo de vacantes: ${msg}` })
  }
})

/** POST /api/admin/hunter/pitch/:id */
hunterRouter.post(['/pitch/:id', '/jobs/:id/pitch'], async (req: Request, res: Response) => {
  const upstream = await forwardToEros(`api/pitch/${req.params['id']}`, { method: 'POST' })
  if (upstream && upstream.ok) {
    res.status(upstream.status).json(upstream.data)
    return
  }

  const jobs = await loadLocalJobs()
  const job = jobs.find(j => j.id === req.params['id'])
  if (!job) {
    res.status(404).json({ error: 'Vacante no encontrada' })
    return
  }

  const pitch = {
    subject_or_hook: `Candidatura: ${job.title} · Mateo Sonzogni (Frontend & Full Stack)`,
    elevator_pitch: `Hola equipo de ${job.company}, vi su búsqueda para la posición de ${job.title}. Cuento con más de 4 años de experiencia especializándome en desarrollo web reactivo de alto rendimiento (Vue 3, Nuxt, TypeScript, Tailwind CSS y Node.js/PostgreSQL). En mis desarrollos priorizo interfaces de alta densidad ergonómica con tiempos de carga LCP menores a 1 segundo y 100/100 en auditorías Lighthouse. Me encantaría coordinar una breve conversación técnica para mostrarles cómo puedo acelerar las entregas en sus plataformas.`,
  }

  job.pitch_draft = pitch
  await saveLocalJobs(jobs)

  res.json({ ok: true, pitch })
})

/** POST /api/admin/hunter/cv/:id */
hunterRouter.post(['/cv/:id', '/jobs/:id/cv'], async (req: Request, res: Response) => {
  const upstream = await forwardToEros(`api/cv/${req.params['id']}`, { method: 'POST' })
  if (upstream && upstream.ok) {
    res.status(upstream.status).json(upstream.data)
    return
  }

  const jobs = await loadLocalJobs()
  const job = jobs.find(j => j.id === req.params['id'])
  if (!job) {
    res.status(404).json({ error: 'Vacante no encontrada' })
    return
  }

  // Construir CV Harvard ATS adaptado
  const cv = {
    name: 'MATEO GABRIEL SONZOGNI',
    title: `Desarrollador Frontend & Software Engineer | ${job.title}`,
    location: 'Patagonia, Argentina · Remoto Global',
    email: 'mateogabus@gmail.com',
    portfolio: 'https://mateogs.tech',
    summary: `Ingeniero de software con sólida trayectoria en desarrollo frontend de alta fidelidad, arquitecturas web reactivas (Vue 3, Nuxt, TypeScript, Tailwind CSS) y microservicios en Node.js/PostgreSQL. Perfil adaptado para la posición en ${job.company}, con foco en calidad de código, accesibilidad WCAG AA y rendimiento verificable.`,
    skills: {
      'Core Technologies': ['Vue.js 3', 'Nuxt 4', 'TypeScript', 'Tailwind CSS', 'JavaScript (ESNext)'],
      'Backend & Base de Datos': ['Node.js', 'Express', 'PostgreSQL 17', 'Prisma ORM', 'RESTful APIs'],
      'Herramientas & Despliegue': ['Docker', 'Vite', 'Git / GitHub', 'Coolify VPS', 'CI/CD Pipelines'],
    },
    experience: [
      {
        title: 'INGENIERO FRONTEND & ARQUITECTO WEB INDEPENDIENTE',
        role: 'Lead Developer & UI Engineer',
        period: '2023 - Presente',
        bullets: [
          'Diseño y desarrollo de plataformas web de alta reactividad con Vue 3, Nuxt 4 y TypeScript, alcanzando 100/100 en rendimiento Lighthouse.',
          'Implementación de sistemas de diseño atómicos con Tailwind CSS y componentes de alta densidad ergonómica inspirados en Linear y Obsidian.',
          'Integración de APIs y bases de datos relacionales en PostgreSQL 17 optimizadas para consultas complejas y tiempo de respuesta ultra-bajo.',
        ],
      },
      {
        title: 'CONSULTORÍA EN PERFORMANCE Y DESARROLLO DE SOFTWARE',
        role: 'Full Stack Engineer',
        period: '2022 - 2023',
        bullets: [
          'Optimización de tiempos de carga en aplicaciones web interactivas reduciendo el tamaño de paquetes a menos de 45 kB gzip.',
          'Automatización de flujos de trabajo, pipelines de integración continua y despliegues contenerizados en Docker.',
        ],
      },
    ],
    education: [
      {
        school: 'Formación en Ingeniería de Software & Ciencias de la Computación',
        degree: 'Especialización en Arquitecturas Web Modernas y Sistemas Distribuidos',
        year: '2022 - Presente',
      },
    ],
  }

  job.tailored_cv = cv
  await saveLocalJobs(jobs)

  res.json({ ok: true, cv })
})

/** GET /api/admin/hunter/cv/:id/html */
hunterRouter.get(['/cv/:id/html', '/jobs/:id/cv/html'], async (req: Request, res: Response) => {
  const upstream = await forwardToEros(`api/cv/${req.params['id']}/html`)
  if (upstream && upstream.ok) {
    res.type('html').send(upstream.data)
    return
  }

  const jobs = await loadLocalJobs()
  const job = jobs.find(j => j.id === req.params['id'])
  const cv = job?.tailored_cv || {
    name: 'MATEO GABRIEL SONZOGNI',
    title: 'Software Engineer & Frontend Specialist',
    location: 'Patagonia, Argentina · Remoto Global',
    email: 'mateogabus@gmail.com',
    summary: 'Software engineer specialized in reactive frontend architectures.',
    skills: { 'Core Stack': ['Vue.js', 'TypeScript', 'Tailwind CSS'] },
    experience: [],
    education: [],
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>CV Harvard ATS · Mateo Sonzogni</title>
  <style>
    @page { margin: 1.2cm; size: A4 portrait; }
    body { font-family: "Times New Roman", Times, Georgia, serif; font-size: 11pt; line-height: 1.35; color: #000; background: #fff; margin: 0; padding: 20px; }
    .header { text-align: center; border-bottom: 1.5pt solid #000; padding-bottom: 6pt; margin-bottom: 12pt; }
    .name { font-size: 16pt; font-weight: bold; letter-spacing: 0.5pt; text-transform: uppercase; font-family: -apple-system, system-ui, sans-serif; }
    .contact { font-size: 9.5pt; margin-top: 3pt; font-style: italic; }
    .section-title { font-size: 11pt; font-weight: bold; text-transform: uppercase; border-bottom: 1pt solid #000; margin-top: 10pt; margin-bottom: 4pt; font-family: -apple-system, system-ui, sans-serif; letter-spacing: 0.3pt; }
    .item-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 10.5pt; margin-top: 4pt; }
    ul { margin: 3pt 0 6pt 16pt; padding: 0; }
    li { font-size: 10pt; margin-bottom: 2pt; text-align: justify; }
    p { font-size: 10pt; margin: 3pt 0; text-align: justify; }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${cv.name}</div>
    <div class="contact">${cv.title} · ${cv.location} · ${cv.email}</div>
  </div>

  <div class="section-title">Professional Summary (Tailored)</div>
  <p>${cv.summary}</p>

  <div class="section-title">Core Competencies & Stack</div>
  ${Object.entries(cv.skills || {}).map(([cat, list]) => `<p><strong>${cat}:</strong> ${Array.isArray(list) ? list.join(', ') : list}</p>`).join('')}

  <div class="section-title">Relevant Experience</div>
  ${(cv.experience || []).map(exp => `
    <div class="item-header">
      <span>${exp.title} — ${exp.role}</span>
      <span>${exp.period}</span>
    </div>
    <ul>
      ${(exp.bullets || []).map(b => `<li>${b}</li>`).join('')}
    </ul>
  `).join('')}

  <div class="section-title">Education & Credentials</div>
  ${(cv.education || []).map(ed => `
    <div class="item-header">
      <span>${ed.school} — ${ed.degree}</span>
      <span>${ed.year}</span>
    </div>
  `).join('')}
</body>
</html>`

  res.type('html').send(html)
})

/** PATCH /api/admin/hunter/jobs/:id/status */
hunterRouter.patch('/jobs/:id/status', async (req: Request, res: Response) => {
  const upstream = await forwardToEros(`api/jobs/${req.params['id']}/status`, {
    method: 'PATCH',
    body: JSON.stringify(req.body),
  })
  if (upstream && upstream.ok) {
    res.status(upstream.status).json(upstream.data)
    return
  }

  const jobs = await loadLocalJobs()
  const job = jobs.find(j => j.id === req.params['id'])
  if (!job) {
    res.status(404).json({ error: 'Vacante no encontrada' })
    return
  }

  const newStatus = (req.body as Record<string, unknown>)?.['status']
  if (typeof newStatus === 'string') {
    job.status = newStatus as JobRecord['status']
    await saveLocalJobs(jobs)
  }

  res.json({ ok: true, job })
})
