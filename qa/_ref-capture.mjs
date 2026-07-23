// Captura de referencia: navega un sitio, detecta stack/animaciones y saca
// screenshots por posicion de scroll (respeta scroll suave via rueda).
// Uso: node qa/_ref-capture.mjs <url> <slug> [outDir]
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const URL = process.argv[2];
const SLUG = process.argv[3] || 'ref';
const DIR = process.argv[4] || 'qa/artifacts/ref';
if (!URL) {
  console.error('falta url');
  process.exit(1);
}
mkdirSync(DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(45000);
try {
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
} catch {
  try {
    await page.goto(URL, { waitUntil: 'load', timeout: 45000 });
  } catch (e) {
    console.error('goto fallo:', e.message);
  }
}
await page.waitForTimeout(4500); // loader / intro / animaciones iniciales

const info = await page.evaluate(() => {
  const w = window;
  const has = (k) => {
    try {
      return typeof w[k] !== 'undefined' && w[k] != null;
    } catch {
      return false;
    }
  };
  const libs = {
    gsap: has('gsap') || has('ScrollTrigger') || has('ScrollSmoother'),
    scrolltrigger: has('ScrollTrigger'),
    scrollsmoother: has('ScrollSmoother'),
    lenis: has('Lenis') || has('lenis'),
    three: has('THREE'),
    ogl: has('ogl') || has('OGL'),
    pixi: has('PIXI'),
    barba: has('barba') || has('Barba'),
    react: !!document.querySelector('#__next, [data-reactroot]') || has('React'),
    next: has('__NEXT_DATA__'),
    vue: has('__VUE__'),
    nuxt: has('__NUXT__') || has('$nuxt'),
    astro: !!document.querySelector('astro-island, [data-astro-cid]'),
    webflow: !!document.querySelector('html.w-mod-js, [data-wf-page]'),
  };
  const scripts = [...document.scripts].map((s) => s.src).filter(Boolean);
  const res = performance.getEntriesByType('resource').map((r) => r.name);
  const jsurls = [...new Set([...scripts, ...res])].filter((n) => /\.(js|mjs)(\?|$)/.test(n)).slice(0, 60);
  const canvases = document.querySelectorAll('canvas').length;
  let webgl = false;
  document.querySelectorAll('canvas').forEach((c) => {
    try {
      if (c.getContext('webgl2') || c.getContext('webgl')) webgl = true;
    } catch {}
  });
  const headings = [...document.querySelectorAll('h1,h2,h3')]
    .map((h) => (h.textContent || '').trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .slice(0, 30);
  const navText = [...document.querySelectorAll('nav a, header a')]
    .map((a) => (a.textContent || '').trim())
    .filter(Boolean)
    .slice(0, 20);
  const h1 = document.querySelector('h1');
  return {
    title: document.title,
    libs,
    jsurls,
    canvases,
    webgl,
    headings,
    navText,
    bodyFont: getComputedStyle(document.body).fontFamily,
    h1Font: h1 ? getComputedStyle(h1).fontFamily : null,
    h1Size: h1 ? getComputedStyle(h1).fontSize : null,
    bg: getComputedStyle(document.body).backgroundColor,
    scrollH: document.documentElement.scrollHeight,
  };
});
console.log('INFO ' + SLUG + ' ' + JSON.stringify(info));

const vp = 900;
const step = Math.round(vp * 0.85);
let y = 0;
let i = 0;
const snap = async () => {
  await page.screenshot({ path: `${DIR}/${SLUG}-${String(i).padStart(2, '0')}.png` });
  const cur = await page.evaluate(() => Math.round(window.scrollY || window.pageYOffset || 0));
  console.log(`shot ${SLUG}-${String(i).padStart(2, '0')} @ ${cur}`);
  i++;
};
await snap();
while (y < info.scrollH - vp - 10 && i < 8) {
  await page.mouse.wheel(0, step);
  y += step;
  await page.waitForTimeout(1500);
  await snap();
}
await browser.close();
