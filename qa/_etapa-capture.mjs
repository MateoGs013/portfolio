// Storyboard de una etapa: captura la SECUENCIA (cuadros de la carga en
// contextos frescos + recorrido de scroll con el scrub asentado), claro y
// oscuro, desktop y mobile. La página es un video (DESIGN.md §1): se revisa
// como video, no como poster congelado.
//   BASE=http://localhost:4322 node qa/_etapa-capture.mjs [ruta] [outDir]
// Preferir un `astro preview` (sin dev toolbar en los cuadros).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const ruta = process.argv[2] || '/';
const out = process.argv[3] || 'qa/artifacts/ideacion';
const base = process.env.BASE || 'http://localhost:4321';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();

// --- Cuadros de la carga (contexto fresco por cuadro: t desde page-load) ---
const FRAMES = [250, 700, 1200, 1800, 2600, 4800];
for (const t of FRAMES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + ruta, { waitUntil: 'load' });
  await page.waitForTimeout(t);
  await page.screenshot({ path: `${out}/carga-${String(t).padStart(4, '0')}ms.png` });
  await ctx.close();
  console.log(`carga ${t}ms`);
}

// --- Recorrido de scroll (el scrub se asienta antes de cada cuadro) ---
async function recorrido(ctx, tag, pasos) {
  const page = await ctx.newPage();
  await page.goto(base + ruta, { waitUntil: 'load' });
  await page.waitForTimeout(5200); // secuencia de carga terminada y seca
  const vh = await page.evaluate(() => window.innerHeight);
  for (const p of pasos) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(vh * p));
    await page.waitForTimeout(850);
    await page.screenshot({ path: `${out}/${tag}-scroll-${p.toFixed(1)}vh.png` });
    console.log(`${tag} scroll ${p}vh`);
  }
  await page.close();
}

const claro = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: 'light',
});
await recorrido(claro, 'claro', [0, 0.9, 1.6, 2.2, 2.8, 3.4, 4.2, 5.0, 5.8]);
await claro.close();

const oscuro = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: 'dark',
});
await recorrido(oscuro, 'oscuro', [0, 1.6, 2.8, 4.2, 5.4]);
await oscuro.close();

const movil = await browser.newContext({
  viewport: { width: 390, height: 844 },
  colorScheme: 'light',
  isMobile: true,
  hasTouch: true,
});
await recorrido(movil, 'movil', [0, 1.2, 2.4, 3.6, 5.0, 6.4]);
await movil.close();

await browser.close();
console.log('listo →', out);
