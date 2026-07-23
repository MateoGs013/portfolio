// Harness de QA visual del portfolio.
// Uso:  npm run build && npm run qa        (levanta preview solo)
//       npm run qa -- http://localhost:4321  (contra un server ya corriendo)
//
// Recorre 4 ediciones (una RUTA cada una) × 2 temas × 2 viewports:
//   - falla si hay scroll horizontal (lista los elementos que desbordan)
//   - falla si una ruta no fija su edición (data-tema) del lado del servidor
//   - captura screenshots en qa/artifacts/ para revisión visual
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { spawn } from 'child_process';

const ARTIFACTS = new URL('./artifacts/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
mkdirSync(ARTIFACTS, { recursive: true });

let url = process.argv[2];
let preview = null;

if (!url) {
  url = 'http://localhost:4321/';
  preview = spawn('npx', ['astro', 'preview'], { shell: true, stdio: 'ignore' });
  // Esperar a que el preview responda (hasta ~25s) en vez de un sleep fijo: en
  // arranque en frío astro preview puede tardar más que un par de segundos.
  const deadline = Date.now() + 25000;
  for (;;) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    if (Date.now() > deadline) {
      preview?.kill();
      throw new Error('astro preview no respondió en 25s (¿puerto 4321 ocupado?)');
    }
    await new Promise((r) => setTimeout(r, 400));
  }
}

// Cada edición es su propia ruta (Afiche = home). El cambio de edición ya no
// es un click en caliente: es navegación real.
const base = url.replace(/\/+$/, '');
const EDICIONES = [
  { tema: 'afiche', path: '/' },
  { tema: 'terminal', path: '/terminal' },
  { tema: 'plano', path: '/plano' },
  { tema: 'fanzine', path: '/fanzine' },
];
const TEMAS = ['light', 'dark'];
const VIEWPORTS = [
  { tag: 'desktop', width: 1440, height: 900 },
  { tag: 'mobile', width: 390, height: 844 },
];

const browser = await chromium.launch();
const problems = [];

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  // La edición secreta se presetea desbloqueada para que su enlace/estado esté
  // disponible (la ruta /fanzine funciona igual: es secreta, no protegida).
  await page.addInitScript(() => localStorage.setItem('ms-fanzine', '1'));

  for (const { tema, path } of EDICIONES) {
    await page.goto(base + path);
    await page.waitForTimeout(3400); // intro (1ª vez de la sesión) + reveal

    // La ruta debe fijar su edición del lado del servidor (data-tema estático).
    const current = await page.evaluate(() =>
      document.documentElement.getAttribute('data-tema')
    );
    if (current !== tema) {
      problems.push(`ruta ${path}: se esperaba data-tema="${tema}" pero es "${current}"`);
    }

    for (const theme of TEMAS) {
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      await page.waitForTimeout(500);

      const check = await page.evaluate(() => {
        const doc = document.documentElement;
        const hscroll = doc.scrollWidth > doc.clientWidth + 1;
        const offenders = [];
        if (hscroll) {
          for (const el of document.querySelectorAll('*')) {
            const r = el.getBoundingClientRect();
            if (r.right > doc.clientWidth + 1 && r.width > 0) {
              offenders.push(
                `${el.tagName}.${String(el.className).slice(0, 40)} right=${Math.round(r.right)}`
              );
              if (offenders.length >= 5) break;
            }
          }
        }
        return { hscroll, offenders };
      });

      if (check.hscroll) {
        problems.push(`hscroll ${tema}/${theme}/${vp.tag}: ${check.offenders.join(' | ')}`);
      }

      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${ARTIFACTS}${tema}-${theme}-${vp.tag}.png` });
      console.log(`${tema}/${theme}/${vp.tag} hscroll=${check.hscroll}`);
    }
  }
  await page.close();
}

await browser.close();
preview?.kill();

if (problems.length) {
  console.error('\nPROBLEMAS:\n' + problems.join('\n'));
  process.exit(1);
}
console.log('\nQA OK — screenshots en qa/artifacts/');
