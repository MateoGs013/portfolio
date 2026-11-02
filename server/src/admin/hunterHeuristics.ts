/**
 * Respaldo del Job Hunter cuando Eros no responde: evaluación, pitch y estadísticas de la muestra. El
 * perfil del candidato (stack, obras, nombre, resumen, sitio) sale de la base (profile.ts); acá solo
 * vive cómo se compara una vacante contra ese perfil. Nada se guarda: cada llamada devuelve copias.
 */
import type { HunterJob, HunterStats, MatchAnalysis, MatchVerdict, Pitch } from '../shared/hunterContracts.js'
import { cvLabels } from './hunterCv.js'
import { byAffinity, jobLang, jobText, overlap, techMatches } from './hunterMatch.js'
import type { HunterProfile } from './profile.js'

interface Penalty {
  pattern: RegExp
  points: number
  con: string
  missing?: string
}

/** Lo que resta afinidad: restricciones de contrato, ecosistemas ajenos y seniority formal. */
const penalties: Penalty[] = [
  { pattern: /\b(us only|w-?2 only|us citizens?)\b/, points: 35, con: 'Restricción geográfica o contractual estricta (US/W2 only)' },
  { pattern: /(^|[^a-z])(c#|\.net|java|spring boot)([^a-z]|$)/, points: 8, con: 'Pide un ecosistema que no está en el stack (.NET / Java)', missing: '.NET / Java' },
  { pattern: /\b(senior|lead|principal)\b/, points: 4, con: 'La vacante pide seniority formal (Senior/Lead)' },
]

function verdictOf(score: number): MatchVerdict {
  if (score >= 82) return 'EXCELENTE_MATCH'
  if (score >= 65) return 'BUEN_MATCH'
  if (score >= 45) return 'REGULAR'
  return 'DESCARTAR'
}

function siteOf(profile: HunterProfile): string | null {
  const url = profile.cv.header.portfolio
  return url ? url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '') : null
}

function listOf(items: readonly string[], lang: 'es' | 'en'): string {
  if (items.length < 2) return items.join('')
  return `${items.slice(0, -1).join(', ')} ${lang === 'es' ? 'y' : 'and'} ${items.at(-1)}`
}

/** Nota corta para el hiring lead, en el idioma de la vacante. */
function recruiterNote(job: HunterJob, matched: string[], site: string | null): string {
  const lang = jobLang(job)
  const first = job.hiring_manager_name?.split(' ')[0]
  const stack = listOf(matched.slice(0, 3), lang)
  const at = job.company ? (lang === 'es' ? ` en ${job.company}` : ` at ${job.company}`) : ''
  if (lang === 'es') {
    return [
      `${first ? `Hola ${first}` : 'Hola'}, vi la búsqueda de ${job.title || 'la vacante'}${at}.`,
      stack ? `Trabajo con ${stack}.` : '',
      site ? `Mis proyectos están en ${site}.` : '',
      'Me gustaría conectar.',
    ].filter(Boolean).join(' ')
  }
  return [
    `${first ? `Hi ${first}` : 'Hi'}, I saw the ${job.title || 'open'} role${at}.`,
    stack ? `I work with ${stack}.` : '',
    site ? `My work is at ${site}.` : '',
    'I would like to connect.',
  ].filter(Boolean).join(' ')
}

/** Compara la vacante contra el stack y las obras de la base. Devuelve una copia evaluada. */
export function evaluateJobHeuristic(source: HunterJob, profile: HunterProfile): { job: HunterJob, match: MatchAnalysis } {
  const text = jobText(source)
  const { cv } = profile
  const matched = techMatches(cv.skills.flatMap(g => g.items), text)
  const remote = source.is_remote || /\bremot[eo]\b/.test(text)
  const hits = penalties.filter(p => p.pattern.test(text))

  const pros = cv.skills
    .map(g => ({ label: cvLabels.es.categories[g.category], items: g.items.filter(i => matched.includes(i)) }))
    .filter(g => g.items.length > 0)
    .map(g => `${g.label} en común: ${g.items.join(', ')}`)
  if (remote && cv.header.modalities) pros.push(`Modalidad remota dentro de las del perfil (${cv.header.modalities})`)

  const raw = 50 + Math.min(36, matched.length * 9) + (remote ? 5 : 0) - hits.reduce((sum, p) => sum + p.points, 0)
  const score = Math.max(25, Math.min(96, raw))
  const verdict = verdictOf(score)

  const projects = byAffinity(profile.works, w => overlap(w.techs, matched))
    .filter(w => overlap(w.techs, matched) > 0)
    .slice(0, 3)
    .map(w => w.title)

  const note = recruiterNote(source, matched, siteOf(profile))
  const match: MatchAnalysis = {
    score,
    verdict,
    summary: matched.length
      ? `${source.title} en ${source.company}: ${matched.length} tecnologías del stack cargado coinciden con la vacante (${matched.join(', ')}).`
      : `${source.title} en ${source.company}: ninguna tecnología del stack cargado aparece en la vacante.`,
    pros,
    cons: hits.length ? hits.map(p => p.con) : ['Validar requisitos secundarios con la descripción completa'],
    missing_skills: hits.flatMap(p => (p.missing ? [p.missing] : [])),
    matching_projects: projects,
    salary_estimate: source.salary,
    recruiter_note: note,
    hiring_manager_name: source.hiring_manager_name,
    hiring_manager_title: source.hiring_manager_title,
    hiring_manager_url: null,
  }

  const job: HunterJob = {
    ...source,
    match_score: score,
    match_analysis: JSON.stringify(match),
    connection_note: note,
    // Una vacante real conserva su estado: sin Eros no se guardó nada y no se finge un cambio.
    // Solo la muestra (EROS_DEMO) muestra el estado que tendría.
    status: source.demo ? (verdict === 'DESCARTAR' ? 'discarded' : score >= 70 ? 'saved' : 'evaluated') : source.status,
  }
  return { job, match }
}

/** Estadísticas de una cola ya evaluada. */
export function computeHunterStats(jobs: readonly HunterJob[]): HunterStats {
  const live = jobs.filter(j => j.status !== 'discarded')
  return {
    total: jobs.length,
    high_match_count: live.filter(j => (j.match_score ?? 0) >= 70).length,
    pending_eval_count: live.filter(j => j.match_score === null || j.status === 'new').length,
    applied_count: jobs.filter(j => j.status === 'applied').length,
    discarded_count: jobs.filter(j => j.status === 'discarded').length,
  }
}

/** Pitch, carta y nota de conexión desde el perfil de la base, en el idioma de la vacante. */
export function generatePitchHeuristic(job: HunterJob, profile: HunterProfile): Pitch {
  const lang = jobLang(job)
  const { header, summary } = profile.cv
  const matched = techMatches(profile.cv.skills.flatMap(g => g.items), jobText(job)).slice(0, 4)
  const stack = listOf(matched, lang)
  const site = siteOf(profile)
  const es = lang === 'es'
  const who = [header.name, header.role].filter(Boolean).join(', ')
  const role = job.title || (es ? 'esta vacante' : 'this role')

  const subject = [`${es ? 'Postulación' : 'Application'}: ${role}`, header.name].filter(Boolean).join(' — ')
  const elevator = [
    job.company ? (es ? `Hola, equipo de ${job.company}.` : `Hi ${job.company} team.`) : (es ? 'Hola.' : 'Hi.'),
    who ? (es ? `Soy ${who}.` : `I am ${who}.`) : '',
    stack ? (es ? `Trabajo con ${stack}, el stack que pide la búsqueda de ${role}.` : `I work with ${stack}, the stack ${role} asks for.`) : '',
    site ? (es ? `Mis proyectos están en ${site}.` : `My work is at ${site}.`) : '',
  ].filter(Boolean).join(' ')

  const letter = [
    job.company ? (es ? `Estimado equipo de ${job.company}:` : `Dear ${job.company} hiring team,`) : (es ? 'Estimado equipo:' : 'Dear hiring team,'),
    es ? `Me postulo a la búsqueda de ${role}.` : `I am applying for ${role}.`,
    summary ?? '',
    stack ? (es ? `Stack en común con la vacante: ${stack}.` : `Stack in common with the role: ${stack}.`) : '',
    header.portfolio ? (es ? `Portafolio: ${header.portfolio}` : `Portfolio: ${header.portfolio}`) : '',
    [es ? 'Saludos,' : 'Best regards,', header.name].filter(Boolean).join('\n'),
  ].filter(Boolean).join('\n\n')

  return {
    lang,
    subject,
    elevator_pitch: elevator,
    cover_letter: letter,
    connection_note: job.connection_note || recruiterNote(job, matched, site),
  }
}
