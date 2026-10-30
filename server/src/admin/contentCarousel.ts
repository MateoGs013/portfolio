/**
 * Vista HTML del carrusel de LinkedIn (4:5, 1080 × 1350) cuando Eros no responde. La marca de cada
 * lámina (inicial, nombre y sitio) sale de los docs about y contact; todo valor interpolado pasa
 * por escapeHtml.
 */
import { signatureLine, type ContentPost, type SlideItem } from './fallbackContentData.js'
import type { Signature } from './profile.js'
import { escapeHtml } from './proxy.js'

const e = (value: string) => escapeHtml(value)
const pad = (n: number) => String(n).padStart(2, '0')

const styles = `
  :root {
    --c-paper: #09090b; --c-surface: #121215; --c-raised: #19191e; --c-ink: #f4f4f5; --c-dim: #929298;
    --c-rule: rgba(255, 255, 255, .08); --c-rule-strong: rgba(255, 255, 255, .16); --c-sig: #ff3e00; --c-sig-hover: #ff551c;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #040405; color: var(--c-ink); min-height: 100vh; padding: 20px 10px 60px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex; flex-direction: column; align-items: center;
  }
  .toolbar {
    position: sticky; top: 16px; z-index: 100; display: flex; align-items: center; gap: 12px;
    margin-bottom: 20px; padding: 10px 20px; border: 1px solid var(--c-rule-strong); border-radius: 12px;
    background: rgba(18, 18, 21, .88); backdrop-filter: blur(14px); font-family: monospace;
  }
  .btn {
    display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: 1px solid var(--c-rule);
    border-radius: 6px; background: var(--c-raised); color: var(--c-ink); font: 12px monospace; cursor: pointer;
  }
  .btn:hover { background: #23232a; border-color: var(--c-sig); }
  .btn:focus-visible, .pill:focus-visible { outline: 2px solid var(--c-sig); outline-offset: 2px; }
  .btn-primary { background: var(--c-sig); border-color: var(--c-sig); color: #fff; }
  .btn-primary:hover { background: var(--c-sig-hover); }
  .pill-group { display: flex; gap: 5px; }
  .pill {
    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;
    border: 1px solid var(--c-rule); border-radius: 5px; background: var(--c-surface); color: var(--c-dim); font: 11px monospace;
  }
  .pill.active { background: var(--c-sig); border-color: var(--c-sig); color: #fff; }
  .carousel-stage {
    position: relative; width: 540px; height: 675px; overflow: hidden; border-radius: 14px;
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
    background: var(--c-sig); color: #fff; font-weight: 800; font-size: 24px;
  }
  .brand-name { display: block; font: 700 18px monospace; letter-spacing: 1.5px; text-transform: uppercase; }
  .brand-sub { display: block; font: 13px monospace; color: var(--c-dim); text-transform: uppercase; }
  .slide-counter { font: 700 22px monospace; color: var(--c-sig); }
  .counter-total { color: var(--c-dim); font-size: 17px; }
  .slide-content { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 40px 0; }
  .badge {
    align-self: flex-start; display: inline-flex; align-items: center; gap: 10px; margin-bottom: 24px; padding: 8px 18px;
    border: 1.5px solid var(--c-sig); border-radius: 999px; background: rgba(255, 62, 0, .12); color: #fff; font: 700 16px monospace;
  }
  .badge-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--c-sig); }
  .slide-title { margin-bottom: 16px; font-size: 54px; font-weight: 800; line-height: 1.15; letter-spacing: -1px; }
  .slide-subtitle { margin-bottom: 32px; color: var(--c-dim); font: 26px/1.35 monospace; }
  .code-box { margin: 20px 0 30px; padding: 24px; border: 1.5px solid var(--c-rule-strong); border-radius: 12px; background: #050507; }
  .code-box pre { overflow-x: auto; color: #a5b4fc; font: 20px/1.5 monospace; }
  .bullet-list { list-style: none; display: flex; flex-direction: column; gap: 20px; }
  .bullet-item { display: flex; align-items: flex-start; gap: 18px; font-size: 25px; line-height: 1.35; }
  .bullet-icon { flex-shrink: 0; margin-top: 5px; color: var(--c-sig); }
  .slide-footer {
    display: flex; justify-content: space-between; align-items: center; padding-top: 28px;
    border-top: 2px solid var(--c-rule); color: var(--c-dim); font: 16px monospace;
  }
  .swipe-hint { color: var(--c-sig); font-weight: 700; letter-spacing: 1px; }
  @media print {
    body { background: #fff; padding: 0; }
    .toolbar { display: none !important; }
    .carousel-stage { width: 1080px; height: auto; overflow: visible; border-radius: 0; box-shadow: none; }
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
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
    pills.forEach((p, i) => p.classList.toggle('active', i === idx));
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
      ${initial ? `<span class="brand-logo">${e(initial.toUpperCase())}</span>` : ''}
      <div>
        ${sig.name ? `<span class="brand-name">${e(sig.name)}</span>` : ''}
        ${sig.site ? `<span class="brand-sub">${e(sig.site)}</span>` : ''}
      </div>
    </div>`
}

function slide(s: SlideItem, i: number, total: number, sig: Signature): string {
  const footer = s.footer ?? signatureLine(sig) ?? ''
  return `<div class="slide${i === 0 ? ' active' : ''}" data-index="${i}">
    <div class="slide-inner">
      <div class="slide-top">
        ${brand(sig)}
        <div class="slide-counter"><span>${pad(s.index)}</span> <span class="counter-total">/ ${pad(total)}</span></div>
      </div>
      <div class="slide-content">
        ${s.metric_badge ? `<div class="badge"><span class="badge-dot"></span><span>${e(s.metric_badge)}</span></div>` : ''}
        <h1 class="slide-title">${e(s.title)}</h1>
        ${s.subtitle ? `<p class="slide-subtitle">${e(s.subtitle)}</p>` : ''}
        ${s.code_snippet ? `<div class="code-box"><pre><code>${e(s.code_snippet)}</code></pre></div>` : ''}
        <ul class="bullet-list">
          ${s.bullets.map(b => `<li class="bullet-item"><span class="bullet-icon">${chevron}</span><span>${e(b)}</span></li>`).join('')}
        </ul>
      </div>
      <div class="slide-footer">
        <span class="swipe-hint">DESLIZAR &rarr;</span>
        <span>${e(footer)}</span>
      </div>
    </div>
  </div>`
}

export function renderCarouselHtmlHeuristic(post: ContentPost, sig: Signature, autoPrint = false): string {
  const slides = post.carousel_slides
  if (!slides.length) {
    return '<!DOCTYPE html><html lang="es"><body style="background:#09090b;color:#fff;font-family:sans-serif;padding:40px;"><h1>No hay diapositivas disponibles para esta publicación.</h1></body></html>'
  }
  const printScript = autoPrint
    ? '<script>window.addEventListener("load", () => setTimeout(() => window.print(), 400));</script>'
    : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${e(post.title)} — Carrusel LinkedIn</title>
  <style>${styles}</style>
</head>
<body>
  <div class="toolbar">
    <button type="button" class="btn" onclick="prevSlide()">&larr; Anterior</button>
    <div class="pill-group">
      ${slides.map((_, i) => `<button type="button" class="pill${i === 0 ? ' active' : ''}" onclick="goToSlide(${i})">${i + 1}</button>`).join('')}
    </div>
    <button type="button" class="btn" onclick="nextSlide()">Siguiente &rarr;</button>
    <button type="button" class="btn btn-primary" onclick="window.print()">Exportar PDF LinkedIn</button>
  </div>
  <div class="carousel-stage">
    ${slides.map((s, i) => slide(s, i, slides.length, sig)).join('')}
  </div>
  <script>${script}</script>
  ${printScript}
</body>
</html>`
}
