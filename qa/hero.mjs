// Screenshot rápido del hero para iterar (afiche, claro/oscuro, ambos
// viewports). Uso: node qa/hero.mjs [url]   (default http://localhost:4321)
// Escribe qa/artifacts/hero-{theme}-{viewport}.png
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const ARTIFACTS = new URL('./artifacts/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
mkdirSync(ARTIFACTS, { recursive: true });

const url = process.argv[2] || 'http://localhost:4321/';
const VIEWPORTS = [
  { tag: 'desktop', width: 1440, height: 900 },
  { tag: 'mobile', width: 390, height: 844 },
];

const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(url);
  await page.waitForTimeout(3800); // intro + secado parcial
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${ARTIFACTS}hero-${theme}-${vp.tag}.png` });
    console.log(`hero ${theme}/${vp.tag} ok`);
  }
  // Estado seco (τ≈3,5s: a los ~12s la tinta ya asentó) — así se ve la
  // plancha la mayor parte del tiempo.
  await page.waitForTimeout(8000);
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), 'light');
  await page.waitForTimeout(700); // que termine la transición de tema
  await page.screenshot({ path: `${ARTIFACTS}hero-seco-light-${vp.tag}.png` });
  console.log(`hero seco light/${vp.tag} ok`);
  await page.close();
}
await browser.close();
