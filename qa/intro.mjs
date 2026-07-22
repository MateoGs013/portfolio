// Frames del ciclo de máquina del intro (afiche desktop). Útil para
// calibrar coreografía temporal. Uso: node qa/intro.mjs [url]
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const ARTIFACTS = new URL('./artifacts/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
mkdirSync(ARTIFACTS, { recursive: true });

const url = process.argv[2] || 'http://localhost:4321/';
const TIEMPOS = [250, 600, 950, 1400, 2100];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const t0 = Date.now();
await page.goto(url);
for (const t of TIEMPOS) {
  const espera = t - (Date.now() - t0);
  if (espera > 0) await page.waitForTimeout(espera);
  await page.screenshot({ path: `${ARTIFACTS}intro-${t}ms.png` });
  console.log(`intro ${t}ms ok`);
}
await browser.close();
