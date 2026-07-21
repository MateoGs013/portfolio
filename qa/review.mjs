// Harness de QA visual del portfolio.
// Uso:  npm run build && npm run qa        (levanta preview solo)
//       npm run qa -- http://localhost:4321  (contra un server ya corriendo)
//
// Recorre 3 ediciones × 2 temas × 2 viewports:
//   - falla si hay scroll horizontal (lista los elementos que desbordan)
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
  await new Promise((r) => setTimeout(r, 2500));
}

const EDICIONES = ['afiche', 'terminal', 'plano'];
const TEMAS = ['light', 'dark'];
const VIEWPORTS = [
  { tag: 'desktop', width: 1440, height: 900 },
  { tag: 'mobile', width: 390, height: 844 },
];

const browser = await chromium.launch();
const problems = [];

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(url);
  await page.waitForTimeout(3400); // intro + reveal

  for (const tema of EDICIONES) {
    const current = await page.evaluate(() => document.documentElement.getAttribute('data-tema'));
    if (current !== tema) {
      await page.click(`[data-tema-btn="${tema}"]`);
      await page.waitForTimeout(1600); // barrido completo
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
