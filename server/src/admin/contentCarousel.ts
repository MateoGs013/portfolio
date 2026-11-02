/**
 * El carrusel de LinkedIn de una publicación (4:5, 1080 × 1350), para verlo en un iframe o en otra
 * pestaña con un ticket. Sale de Eros: su propia hoja o, si no la tiene, la publicación de Eros
 * armada con esta plantilla. La muestra de EROS_DEMO usa la plantilla con el artículo de la base. La
 * marca de cada lámina (inicial, nombre y sitio) sale de los docs about y contact; todo valor
 * interpolado pasa por escapeHtml.
 */
import { Router, type Request, type Response } from 'express'
import type { CarouselSlide, ContentPost } from '../shared/contentContracts.js'
import { createCarouselTicket, isAdminAuthorized, validateCarouselTicket } from './auth.js'
import { normalizeOnePost } from './erosContentContract.js'
import { erosDemo, findDemoPost, isDemoId, signatureLine } from './fallbackContentData.js'
import { loadSignature, type Signature } from './profile.js'
import { erosIdParam, escapeHtml, forwardToEros, getParamId } from './proxy.js'

const e = (value: string) => escapeHtml(value)
const pad = (n: number) => String(n).padStart(2, '0')

const styles = `
  :root {
    --c-paper: #09090b; --c-surface: #121215; --c-raised: #19191e; --c-ink: #f4f4f5; --c-dim: #a1a1a8;
    --c-rule: rgba(255, 255, 255, .08); --c-rule-strong: rgba(255, 255, 255, .16); --c-sig: #ff3e00; --c-sig-hover: #ff551c;
    --sans: "General Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #040405; color: var(--c-ink); min-height: 100vh; padding: 20px 10px 60px; font-family: var(--sans);
    display: flex; flex-direction: column; align-items: center;
  }
  .toolbar {
    position: sticky; top: 16px; z-index: 100; display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
    margin-bottom: 20px; padding: 10px 16px; border: 1px solid var(--c-rule-strong); border-radius: 10px; background: rgba(18, 18, 21, .92);
  }
  .btn {
    display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 6px 14px; border: 1px solid var(--c-rule-strong);
    border-radius: 6px; background: var(--c-raised); color: var(--c-ink); font: 500 13px var(--sans); cursor: pointer;
  }
  .btn:hover { background: #23232a; }
  .btn:focus-visible, .pill:focus-visible { outline: 2px solid var(--c-ink); outline-offset: 2px; }
  .btn-primary { background: var(--c-ink); border-color: var(--c-ink); color: var(--c-paper); }
  .btn-primary:hover { background: #fff; }
  .pill-group { display: flex; gap: 4px; }
  .pill {
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;
    border: 1px solid var(--c-rule); border-radius: 6px; background: var(--c-surface); color: var(--c-dim); font: 500 13px var(--sans);
  }
  .pill[aria-current="true"] { background: var(--c-ink); border-color: var(--c-ink); color: var(--c-paper); }
  .carousel-stage {
    position: relative; width: 540px; max-width: 100%; aspect-ratio: 4 / 5; overflow: hidden; border-radius: 12px;
    background: var(--c-paper); box-shadow: 0 30px 70px rgba(0, 0, 0, .9), 0 0 0 1px var(--c-rule);
  }
  .slide {
    position: absolute; top: 0; left: 0; width: 1080px; height: 1350px; transform-origin: top left; transform: scale(.5);
    opacity: 0; pointer-events: none; transition: opacity .25s ease;
  }
  .slide.active { opacity: 1; pointer-events: auto; }
  .slide-inner {
    width: 100%; height: 100%; padding: 80px 70px; display: flex; flex-direction: column; justify-content: space-between;
    background: linear-gradient(180deg, #0e0e12 0%, #08080a 100%); border: 1px solid rgba(255, 255, 255, .05);
  }
  .slide-top { display: flex; justify-content: space-between; align-items: center; padding-bottom: 30px; border-bottom: 2px solid var(--c-rule); }
  .brand { display: flex; align-items: center; gap: 18px; }
  .brand-logo {
    width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; border-radius: 8px;
    background: var(--c-sig); color: #fff; font-weight: 700; font-size: 24px;
  }
  .brand-name { display: block; font-weight: 600; font-size: 22px; }
  .brand-sub { display: block; font-size: 17px; color: var(--c-dim); }
  .slide-counter { font-weight: 600; font-size: 22px; font-variant-numeric: tabular-nums; }
  .counter-total { color: var(--c-dim); }
  .slide-content { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 40px 0; }
  .badge {
    align-self: flex-start; display: inline-flex; align-items: center; gap: 10px; margin-bottom: 24px; padding: 8px 18px;
    border: 1.5px solid var(--c-sig); border-radius: 999px; color: #fff; font-weight: 600; font-size: 18px;
  }
  .badge-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--c-sig); }
  .slide-title { margin-bottom: 16px; font-size: 56px; font-weight: 700; line-height: 1.1; letter-spacing: -.02em; }
  .slide-subtitle { margin-bottom: 32px; color: var(--c-dim); font-size: 28px; line-height: 1.35; }
  .code-box { margin: 20px 0 30px; padding: 24px; border: 1.5px solid var(--c-rule-strong); border-radius: 12px; background: #050507; }
  .code-box pre { overflow-x: auto; color: #d4d4d8; font: 20px/1.5 ui-monospace, monospace; }
  .bullet-list { list-style: none; display: flex; flex-direction: column; gap: 20px; }
  .bullet-item { display: flex; align-items: flex-start; gap: 18px; font-size: 26px; line-height: 1.35; }
  .bullet-icon { flex-shrink: 0; margin-top: 5px; color: var(--c-sig); }
  .slide-footer {
    display: flex; justify-content: space-between; align-items: center; padding-top: 28px;
    border-top: 2px solid var(--c-rule); color: var(--c-dim); font-size: 18px;
  }
  .swipe-hint { color: var(--c-ink); font-weight: 600; }
  @media print {
    body { background: #fff; padding: 0; }
    .toolbar { display: none !important; }
    .carousel-stage { width: 1080px; height: auto; aspect-ratio: auto; overflow: visible; border-radius: 0; box-shadow: none; }
    .slide { position: relative; width: 1080px; height: 1350px; transform: none; opacity: 1 !important; break-after: page; }
    @page { size: 1080px 1350px; margin: 0; }
  }
`

const script = `
  let currentIdx = 0;
  const slides = document.querySelectorAll('.slide');
  const pills = document.querySelectorAll('.pill');
  function showSlide(idx) {
    if (idx < 0 || idx >= slides.length) return;
    currentIdx = idx;
    slides.forEach((s, i) => { s.classList.toggle('active', i === idx); s.setAttribute('aria-hidden', String(i !== idx)); });
    pills.forEach((p, i) => p.setAttribute('aria-current', String(i === idx)));
  }
  function nextSlide() { showSlide((currentIdx + 1) % slides.length); }
  function prevSlide() { showSlide((currentIdx - 1 + slides.length) % slides.length); }
  function goToSlide(idx) { showSlide(idx); }
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowRight' || ev.key === 'PageDown') nextSlide();
    if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') prevSlide();
  });
`

const chevron = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>'

function brand(sig: Signature): string {
  const initial = sig.name?.trim().charAt(0) ?? ''
  return `<div class="brand">
      ${initial ? `<span class="brand-logo" aria-hidden="true">${e(initial.toUpperCase())}</span>` : ''}
      <div>
        ${sig.name ? `<span class="brand-name">${e(sig.name)}</span>` : ''}
        ${sig.site ? `<span class="brand-sub">${e(sig.site)}</span>` : ''}
      </div>
    </div>`
}

function slide(s: CarouselSlide, i: number, total: number, sig: Signature): string {
  const footer = s.footer ?? signatureLine(sig) ?? ''
  const last = i === total - 1
  return `<section class="slide${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Lámina ${i + 1} de ${total}"${i === 0 ? '' : ' aria-hidden="true"'}>
    <div class="slide-inner">
      <div class="slide-top">
        ${brand(sig)}
        <div class="slide-counter"><span>${pad(s.index)}</span> <span class="counter-total">/ ${pad(total)}</span></div>
      </div>
      <div class="slide-content">
        ${s.metric_badge ? `<div class="badge"><span class="badge-dot"></span><span>${e(s.metric_badge)}</span></div>` : ''}
        <h2 class="slide-title">${e(s.title)}</h2>
        ${s.subtitle ? `<p class="slide-subtitle">${e(s.subtitle)}</p>` : ''}
        ${s.code_snippet ? `<div class="code-box"><pre><code>${e(s.code_snippet)}</code></pre></div>` : ''}
        <ul class="bullet-list">
          ${s.bullets.map(b => `<li class="bullet-item"><span class="bullet-icon">${chevron}</span><span>${e(b)}</span></li>`).join('')}
        </ul>
      </div>
      <div class="slide-footer">
        <span class="swipe-hint">${last ? '' : 'Deslizá &rarr;'}</span>
        <span>${e(footer)}</span>
      </div>
    </div>
  </section>`
}

/** Una página mínima con un mensaje: la ve quien abrió el carrusel en otra pestaña o en el iframe. */
function notice(title: string, message: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${e(title)}</title></head>
<body style="background:#09090b;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:40px;line-height:1.5">
<h1 style="font-size:20px;font-weight:600;margin:0 0 8px">${e(title)}</h1><p style="color:#a1a1a8;margin:0">${e(message)}</p></body></html>`
}

export function renderCarouselHtml(post: ContentPost, sig: Signature, autoPrint = false): string {
  const slides = post.carousel_slides
  if (!slides.length) return notice('Esta publicación no tiene carrusel', 'Eros no armó láminas para esta publicación.')
  const printScript = autoPrint
    ? '<script>window.addEventListener("load", () => setTimeout(() => window.print(), 400));</script>'
    : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${e(post.title)} · carrusel de LinkedIn</title>
  <style>${styles}</style>
</head>
<body>
  <nav class="toolbar" aria-label="Láminas del carrusel">
    <button type="button" class="btn" onclick="prevSlide()">&larr; Anterior</button>
    <div class="pill-group">
      ${slides.map((_, i) => `<button type="button" class="pill" aria-label="Lámina ${i + 1}" aria-current="${i === 0}" onclick="goToSlide(${i})">${i + 1}</button>`).join('')}
    </div>
    <button type="button" class="btn" onclick="nextSlide()">Siguiente &rarr;</button>
    <button type="button" class="btn btn-primary" onclick="window.print()">Imprimir o guardar como PDF</button>
  </nav>
  <main class="carousel-stage">
    ${slides.map((s, i) => slide(s, i, slides.length, sig)).join('')}
  </main>
  <script>${script}</script>
  ${printScript}
</body>
</html>`
}

// ─── Rutas ──────────────────────────────────────────────────────────────────

export const contentCarouselRouter = Router()

/** Un id que no es de Eros (`%2F`, `..`) responde 400 y nunca se reenvía. */
contentCarouselRouter.param('id', erosIdParam)

const CAROUSEL_CSP = "sandbox allow-scripts allow-modals; default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: https:;"

function sendHtml(res: Response, status: number, html: string): void {
  res.setHeader('Content-Security-Policy', CAROUSEL_CSP)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.status(status).type('html').send(html)
}

/** POST /api/admin/content/carousel/:id/ticket - Ticket firmado para abrir el carrusel: 1 hora, solo esa publicación. */
contentCarouselRouter.post('/carousel/:id/ticket', (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'Falta la publicación del carrusel.', code: 'invalid', errors: [] })
    return
  }
  res.json({ ok: true, ticket: createCarouselTicket(id) })
})

/** El carrusel desde Eros: su hoja o, si no la tiene, su publicación con la plantilla; si no, por qué no hay. */
async function erosCarousel(id: string, autoPrint: boolean): Promise<{ html: string } | { status: number, title: string, message: string }> {
  const path = `api/content/carousel/${encodeURIComponent(id)}/html`
  const sheet = await forwardToEros<unknown>(`${path}${autoPrint ? '?auto_print=true' : ''}`, undefined, 10000)
  if (sheet.ok && typeof sheet.data === 'string' && sheet.data.trim()) return { html: sheet.data }
  if (sheet.failure && sheet.failure.reason !== 'rejected') {
    return { status: 503, title: 'Eros no responde', message: 'El carrusel se arma con la publicación de Eros. Probá de nuevo en un momento.' }
  }
  const result = await forwardToEros(`api/content/posts/${encodeURIComponent(id)}`, undefined, 10000)
  const post = result.ok ? normalizeOnePost(result.data) : null
  if (post) return { html: renderCarouselHtml(post, await loadSignature(), autoPrint) }
  if (result.failure && result.failure.reason !== 'rejected') {
    return { status: 503, title: 'Eros no responde', message: 'El carrusel se arma con la publicación de Eros. Probá de nuevo en un momento.' }
  }
  return { status: 404, title: 'No encontramos el carrusel', message: 'Eros no tiene esa publicación: puede que se haya borrado.' }
}

/** GET /api/admin/content/carousel/:id/html[?ticket=&auto_print=true] - Vista HTML del carrusel. */
contentCarouselRouter.get('/carousel/:id/html', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!validateCarouselTicket(req.query['ticket'], id) && !isAdminAuthorized(req)) {
    sendHtml(res, 401, notice('Este carrusel necesita la sesión del admin', 'Abrilo desde Publicaciones: el enlace vale una hora.'))
    return
  }
  const autoPrint = req.query['auto_print'] === 'true'
  if (isDemoId(id)) {
    const post = erosDemo() ? await findDemoPost(id) : null
    if (post) sendHtml(res, 200, renderCarouselHtml(post, await loadSignature(), autoPrint))
    else sendHtml(res, 404, notice('No encontramos el carrusel', 'Esa publicación de muestra no existe.'))
    return
  }
  const out = await erosCarousel(id, autoPrint)
  if ('html' in out) sendHtml(res, 200, out.html)
  else sendHtml(res, out.status, notice(out.title, out.message))
})
