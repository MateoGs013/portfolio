// Test A/B tipográfico del hero (afiche, desktop): Anton actual vs
// Archivo Variable en dos anchos, cada fuente con su --hero-fs
// recalibrado para que "SONZOGNI" ocupe el mismo ancho de plancha.
// Inyecta CSS — el source no se toca hasta que se decida.
// Uso: node qa/ab-tipografia.mjs [url]
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const ARTIFACTS = new URL('./artifacts/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
mkdirSync(ARTIFACTS, { recursive: true });

const url = process.argv[2] || 'http://localhost:4321/';

const VARIANTES = [
  { tag: 'A-anton', css: null },
  {
    tag: 'B-archivo-wdth62',
    css: `:root[data-tema='afiche'] .hero-title {
      --hero-fs: min(24.4vw, 38svh);
      font-family: 'Archivo Variable', 'Arial Narrow', sans-serif;
      font-variation-settings: 'wdth' 62, 'wght' 900;
    }`,
  },
  {
    tag: 'C-archivo-wdth75',
    css: `:root[data-tema='afiche'] .hero-title {
      --hero-fs: min(20.6vw, 32svh);
      font-family: 'Archivo Variable', 'Arial Narrow', sans-serif;
      font-variation-settings: 'wdth' 75, 'wght' 900;
    }`,
  },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url);
await page.waitForTimeout(4000); // intro asentado

let style = null;
for (const v of VARIANTES) {
  if (style) {
    await style.dispose();
    style = null;
  }
  if (v.css) style = await page.addStyleTag({ content: v.css });
  await page.waitForTimeout(500); // reflow + fuente aplicada
  const ancho = await page.evaluate(
    () => document.querySelector('.linea-b')?.getBoundingClientRect().width ?? -1
  );
  console.log(`ab ${v.tag} ok — apellido: ${Math.round(ancho)}px de 1440px`);
  await page.screenshot({ path: `${ARTIFACTS}ab-${v.tag}.png` });
}
await browser.close();
