/**
 * Hoja HTML imprimible del CV de respaldo (GET /api/admin/hunter/cv/:id/html sin Eros). Recibe el
 * mismo objeto que muestra la vista previa del admin. Una página A4 con la escala ATS de
 * .claude/rules/explorer.md (nombre 20 pt, títulos 11 pt, cuerpo 9,3 pt con interlineado 1,33) y
 * su propio @page de 10,5 × 12 mm. Todo valor interpolado pasa por escapeHtml.
 */
import { cvLabels, type AdminCv } from './hunterCv.js'
import type { JobText } from './hunterMatch.js'
import { escapeHtml } from './proxy.js'

const styles = `
  @page { size: A4; margin: 10.5mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { background: #e9e9ea; }
  body {
    width: 100%; max-width: 210mm; min-height: 297mm; margin: 0 auto; padding: 10.5mm 12mm;
    background: #fff; color: #000;
    font-family: "Times New Roman", Times, "Liberation Serif", Georgia, serif;
    font-size: 9.3pt; line-height: 1.33;
  }
  a { color: #000; text-decoration: none; }
  header { text-align: center; border-bottom: 1.2pt solid #000; padding-bottom: 4pt; margin-bottom: 7pt; }
  h1 { font-size: 20pt; line-height: 1.15; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; margin-bottom: 1.8pt; }
  .role { font-size: 10.2pt; font-style: italic; margin-bottom: 1.8pt; }
  header p { text-align: center; }
  .contact span { white-space: nowrap; }
  .contact span + span::before { content: "·"; padding: 0 4pt; }
  section { margin-bottom: 7pt; }
  h2 {
    font-size: 11pt; line-height: 1.2; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
    border-bottom: .85pt solid #000; padding-bottom: 1.5pt; margin-bottom: 3.2pt;
  }
  p { text-align: justify; }
  .entry { margin-bottom: 5pt; break-inside: avoid; }
  .entry:last-child { margin-bottom: 0; }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 8pt; }
  .org { font-size: 10pt; font-weight: 700; text-transform: uppercase; }
  .sub { font-style: italic; }
  .date { white-space: nowrap; font-style: normal; }
  ul { padding-left: 12pt; margin-top: 1pt; }
  li { margin-bottom: 1.6pt; text-align: justify; }
  .lines p { text-align: left; margin-bottom: 1.6pt; }
  .lines p:last-child { margin-bottom: 0; }
  @media print {
    html { background: #fff; }
    body { max-width: none; min-height: 0; margin: 0; padding: 0; }
  }
`

const e = (value: string) => escapeHtml(value)

/** Solo enlaces http(s) y mailto: un valor de la base nunca se vuelve un `javascript:`. */
function link(href: string | null, text: string): string {
  if (!href || !/^(https?:\/\/|mailto:)/i.test(href)) return `<span>${e(text)}</span>`
  return `<span><a href="${e(href)}">${e(text)}</a></span>`
}

/** «https://www.linkedin.com/in/x/» → «linkedin.com/in/x»: legible por un ATS y por una persona. */
function shortUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '')
}

function header(cv: AdminCv): string {
  const contact = [
    cv.location ? `<span>${e(cv.location)}</span>` : '',
    cv.email ? link(`mailto:${cv.email}`, cv.email) : '',
    ...[cv.portfolio, cv.linkedin, cv.github].map(url => (url ? link(url, shortUrl(url)) : '')),
  ].filter(Boolean).join('')
  return `<header>
    ${cv.name ? `<h1>${e(cv.name)}</h1>` : ''}
    ${cv.title ? `<p class="role">${e(cv.title)}</p>` : ''}
    ${contact ? `<div class="contact">${contact}</div>` : ''}
  </header>`
}

function section(title: string, body: string): string {
  return body ? `<section><h2>${e(title)}</h2>${body}</section>` : ''
}

/** Una línea por entrada: «ORG — rol» a la izquierda, «período · lugar» a la derecha. */
function entryHead(org: string, role: string | null, period: string, location: string | null): string {
  const sub = role && role !== org ? `<span class="sub"> — ${e(role)}</span>` : ''
  const when = [period, location].filter(Boolean).join(' · ')
  return `<div class="row"><span><span class="org">${e(org)}</span>${sub}</span><span class="date">${e(when)}</span></div>`
}

function experience(cv: AdminCv): string {
  return cv.experience.map(x => `<div class="entry">
      ${entryHead(x.title, x.role, x.period, x.location)}
      ${x.bullets.length ? `<ul>${x.bullets.map(b => `<li>${e(b)}</li>`).join('')}</ul>` : ''}
    </div>`).join('')
}

function education(cv: AdminCv): string {
  return cv.education.map(x => `<div class="entry">
      ${entryHead(x.institution ?? x.degree, x.institution ? x.degree : null, x.period, x.location)}
      ${x.details ? `<p>${e(x.details)}</p>` : ''}
    </div>`).join('')
}

function lines(rows: readonly (readonly [string, string])[]): string {
  const body = rows.filter(([, value]) => value).map(([label, value]) => `<p><strong>${e(label)}:</strong> ${e(value)}</p>`)
  return body.length ? `<div class="lines">${body.join('')}</div>` : ''
}

/** La hoja completa. `job` solo nombra el documento (título de la pestaña y del PDF impreso). */
export function renderCvHtmlHeuristic(cv: AdminCv, job: JobText): string {
  const labels = cvLabels[cv.lang]
  const target = [job.title, job.company].map(s => s.trim()).filter(Boolean).join(' — ')
  const docTitle = ['CV', cv.name, 'Harvard ATS', target].filter(Boolean).join(' · ')
  const skills = Object.entries(cv.skills).map(([label, items]) => [label, items.join(', ')] as const)

  return `<!DOCTYPE html>
<html lang="${e(cv.lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(docTitle)}</title>
  <style>${styles}</style>
</head>
<body>
  ${header(cv)}
  ${section(labels.summary, cv.summary ? `<p>${e(cv.summary)}</p>` : '')}
  ${section(labels.skills, lines(skills))}
  ${section(labels.experience, experience(cv))}
  ${section(labels.education, education(cv))}
  ${section(labels.extra, lines([
    [labels.languages, cv.languages.join(' · ')],
    [labels.methodologies, cv.methodologies ?? ''],
  ]))}
</body>
</html>`
}
