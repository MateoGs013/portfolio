// Portal GENERATION-LOSS (DESIGN.md §4d.2) — PROTOTIPO del par Plano↔Afiche.
//
// El switch entre ediciones deja de ser una cortina única (§5/tema.ts) y pasa a
// ser LA MÁQUINA DE COPIAR del mundo de destino encendiéndose sobre el viewport.
// La dirección en el linaje (Plano=master gen0 · Afiche=1ª impresión gen1) es la
// que manda:
//   · BAJAR de generación (Plano → Afiche): la máquina de impresión COPIA la
//     pantalla — el retrato se re-imprime más grueso, la imagen pierde generación.
//   · SUBIR (Afiche → Plano): la mesa de luz RE-EXPONE el master — el retrato
//     restaura a contorno limpio.
// El retrato es el master (§4c.9): la MISMA cara re-reproducida por cada máquina,
// el único ancla que cruza el portal (metamorfosis, no corte).
//
// PROTOTIPO: colores de sustrato en un mapa local (se tokenizan en tokens.css al
// productivizar); las máquinas quedan para Plano↔Afiche, el resto sigue con el
// wipe viejo. Debajo del portal ya vive la edición de destino (el swap ocurre en
// el pico de oclusión); acá sólo se escenifica el acto de reproducir.
import gsap from 'gsap';
import './eases';

const LINAJE = ['plano', 'afiche', 'terminal', 'fanzine'] as const;

// Sustratos de transición (prototipo → tokens.css por edición al productivizar).
const SUSTRATO = {
  light: { paper: '#eee6cf', prussia: '#0f2545', line: '#cfe3ff', spot: '#2743d6', ink: '#191611' },
  dark: { paper: '#211d17', prussia: '#0b1d3a', line: '#bcd6ff', spot: '#6d83ff', ink: '#ede4cf' },
};

// Borde inferior rasgado del pliego de Afiche (papel cortado a mano, no un tile).
const TORN =
  'polygon(0 0,100% 0,100% 98%,96% 98.7%,92% 97.6%,87% 99%,82% 97.8%,76% 98.9%,' +
  '70% 97.5%,64% 98.9%,58% 97.6%,52% 99%,46% 97.8%,40% 98.8%,34% 97.5%,28% 99%,' +
  '22% 97.8%,16% 98.7%,10% 97.6%,5% 98.9%,0 98%)';

let stage: HTMLDivElement | null = null;
let sheet: HTMLDivElement | null = null;
let bar: HTMLDivElement | null = null;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

// Retrato-master: se carga una vez desde el mismo src que consume tipos.ts.
let retrato: HTMLImageElement | null = null;
let retratoListo = false;
let lumaCache: { luma: Float32Array; cols: number; rows: number } | null = null;
const COLS = 120;
const ROWS = 174;

function cargarRetrato(): void {
  if (retrato) return;
  const src = document.querySelector<HTMLElement>('[data-tipos]')?.dataset.src;
  if (!src) return;
  const img = new Image();
  img.onload = () => {
    retratoListo = true;
    lumaCache = null;
  };
  img.src = src;
  retrato = img;
}

/** Muestrea la luminancia del retrato en la grilla COLS×ROWS (cover, anclado abajo). */
function muestrear(): { luma: Float32Array; cols: number; rows: number } | null {
  if (!retrato || !retratoListo) return null;
  if (lumaCache) return lumaCache;
  const off = document.createElement('canvas');
  off.width = COLS;
  off.height = ROWS;
  const octx = off.getContext('2d', { willReadFrequently: true });
  if (!octx) return null;
  const s = Math.max(COLS / retrato.naturalWidth, ROWS / retrato.naturalHeight) * 1.1;
  const dw = retrato.naturalWidth * s;
  const dh = retrato.naturalHeight * s;
  octx.drawImage(retrato, (COLS - dw) / 2, ROWS - dh, dw, dh);
  const d = octx.getImageData(0, 0, COLS, ROWS).data;
  const luma = new Float32Array(COLS * ROWS);
  for (let i = 0; i < COLS * ROWS; i++) {
    const a = d[i * 4 + 3] / 255;
    const l = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
    luma[i] = a < 0.3 ? -1 : l; // -1 = papel (transparente), se saltea
  }
  lumaCache = { luma, cols: COLS, rows: ROWS };
  return lumaCache;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * AFICHE (bajar): screenprint de puntos que APARECE de izq→der (al paso de la
 * escobilla) y se ENGROSA con el degrade (gen-loss). `p`: 0→1 avance del beat.
 */
function screenprint(c: CanvasRenderingContext2D, box: Box, p: number, spot: string, ink: string): void {
  const m = muestrear();
  if (!m) return;
  const degrade = 0.3 + 0.55 * p; // arranca fino, revienta grueso al final
  const wipe = Math.min(1.04, p * 1.14); // fracción del ancho ya impresa (izq→der)
  const stride = Math.max(1, Math.round(1 + degrade * 2.4)); // celda más gruesa = peor generación
  const gx = box.w / COLS;
  const gy = box.h / ROWS;
  const cellW = gx * stride;
  const cellH = gy * stride;
  for (let r = 0; r < ROWS; r += stride) {
    for (let col = 0; col < COLS; col += stride) {
      if (col / COLS > wipe) continue; // la escobilla todavía no pasó por acá
      let sum = 0;
      let n = 0;
      let trans = 0;
      for (let rr = r; rr < Math.min(ROWS, r + stride); rr++) {
        for (let cc = col; cc < Math.min(COLS, col + stride); cc++) {
          const l = m.luma[rr * COLS + cc];
          if (l < 0) {
            trans++;
            continue;
          }
          sum += l;
          n++;
        }
      }
      if (n === 0 || trans > n) continue;
      let dark = 1 - sum / n;
      dark = Math.min(1, dark * (1 + degrade)); // contraste que revienta al degradar
      const rad = dark * Math.min(cellW, cellH) * 0.62;
      if (rad < 0.35) continue;
      const x = box.x + col * gx + cellW / 2;
      const y = box.y + r * gy + cellH / 2;
      c.fillStyle = dark > 0.72 ? ink : spot; // núcleo tinta, medios tono spot
      c.beginPath();
      c.arc(x, y, rad, 0, Math.PI * 2);
      c.fill();
    }
  }
}

/**
 * PLANO (subir): isolíneas del master que se RE-EXPONEN de izq→der (al paso de
 * la barra de luz) y ganan nitidez. `p`: 0→1 avance de la exposición.
 */
function contour(c: CanvasRenderingContext2D, box: Box, p: number, line: string): void {
  const m = muestrear();
  if (!m) return;
  const { luma } = m;
  const wipe = Math.min(1.04, p * 1.14); // fracción del ancho ya expuesta (izq→der)
  const levels = 5;
  const q = (l: number): number => (l < 0 ? -1 : Math.floor(l * levels));
  const gx = box.w / COLS;
  const gy = box.h / ROWS;
  c.strokeStyle = line;
  c.lineWidth = 1;
  c.globalAlpha = 0.2 + 0.8 * p;
  c.beginPath();
  for (let r = 0; r < ROWS; r++) {
    for (let col = 0; col < COLS - 1; col++) {
      if (col / COLS > wipe) continue; // la luz todavía no llegó acá
      const a = q(luma[r * COLS + col]);
      const b = q(luma[r * COLS + col + 1]);
      if (a >= 0 && b >= 0 && a !== b) {
        const x = box.x + (col + 1) * gx;
        const y = box.y + r * gy;
        c.moveTo(x, y);
        c.lineTo(x, y + gy);
      }
    }
  }
  for (let r = 0; r < ROWS - 1; r++) {
    for (let col = 0; col < COLS; col++) {
      if (col / COLS > wipe) continue;
      const a = q(luma[r * COLS + col]);
      const b = q(luma[(r + 1) * COLS + col]);
      if (a >= 0 && b >= 0 && a !== b) {
        const x = box.x + col * gx;
        const y = box.y + (r + 1) * gy;
        c.moveTo(x, y);
        c.lineTo(x + gx, y);
      }
    }
  }
  c.stroke();
  c.globalAlpha = 1;
}

function esOscuro(): boolean {
  const attr = document.documentElement.getAttribute('data-theme');
  return attr ? attr === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function crearStage(): void {
  if (stage) return;
  cargarRetrato();
  stage = document.createElement('div');
  stage.id = 'portal';
  stage.setAttribute('aria-hidden', 'true');
  Object.assign(stage.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '39', // debajo de la topbar (40): el selector nunca se tapa (§4c.5)
    pointerEvents: 'none',
    display: 'none',
    overflow: 'hidden',
  } as CSSStyleDeclaration);
  sheet = document.createElement('div');
  Object.assign(sheet.style, { position: 'absolute', inset: '0' } as CSSStyleDeclaration);
  canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
  } as CSSStyleDeclaration);
  bar = document.createElement('div');
  Object.assign(bar.style, { position: 'absolute', inset: '0' } as CSSStyleDeclaration);
  stage.append(sheet, canvas, bar);
  document.body.appendChild(stage);
  ctx = canvas.getContext('2d');
}

/**
 * Corre el portal del entrante. `onSwap` se dispara en el PICO DE OCLUSIÓN
 * (la pantalla cubierta): ahí tema.ts hace applyTema → ms:edicion → remonta la
 * edición, sin que el recableo se vea. Resuelve al terminar la reproducción.
 */
export function runPortal(saliente: string, entrante: string, onSwap: () => void): Promise<void> {
  return new Promise((resolve) => {
    crearStage();
    if (!stage || !ctx || !canvas || !sheet || !bar) {
      onSwap();
      resolve();
      return;
    }
    const c = ctx;
    const S = SUSTRATO[esOscuro() ? 'dark' : 'light'];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Caja del retrato: derecha, sangrando el borde, apoyado abajo (≈ masthead).
    const boxW = Math.min(vw * 0.5, vh * 0.6);
    const boxH = boxW * 1.45;
    const box: Box = { x: vw - boxW * 0.9, y: vh - boxH * 0.98, w: boxW, h: boxH };

    let swapped = false;
    const swap = (): void => {
      if (swapped) return;
      swapped = true;
      onSwap();
    };
    const fin = (): void => {
      if (stage) stage.style.display = 'none';
      c.clearRect(0, 0, vw, vh);
      resolve();
    };

    stage.style.display = 'block';
    const st = { p: 0 };

    if (entrante === 'afiche') {
      // BAJAR (gen-loss): la máquina de impresión / pegatina. El pliego se pega,
      // la escobilla asienta, y el retrato se IMPRIME cada vez más grueso.
      sheet.style.background = S.paper;
      sheet.style.clipPath = TORN;
      sheet.style.filter = 'none';
      bar.style.background =
        'linear-gradient(115deg, transparent 44%, rgba(255,255,255,0.22) 50%, transparent 56%)';
      gsap
        .timeline({ onComplete: fin })
        .set(sheet, {
          yPercent: -108,
          xPercent: -3,
          rotation: -0.7,
          transformOrigin: '50% 0%',
          opacity: 1,
          filter: 'drop-shadow(2px 3px 0 rgba(0,0,0,.28)) drop-shadow(0 8px 14px rgba(0,0,0,.16))',
        })
        .set(canvas, { opacity: 0 })
        .set(bar, { opacity: 1, xPercent: -70 })
        // P1 · el pliego BAJA y cubre del todo (el fin del slap = pico de oclusión)
        .to(sheet, { yPercent: 0, xPercent: 0, duration: 0.42, ease: 'prensa' }, 0)
        // swap recién con el papel cubriendo entero: la edición nueva nunca asoma antes
        .add(swap, 0.42)
        // P2 · golpe seco: la rotación asienta a 0 (§4c.7)
        .to(sheet, { rotation: 0, duration: 0.14, ease: 'prensa' }, 0.42)
        // P3 · IMPRESIÓN legible: la escobilla cruza el ancho y la tinta aparece
        //      a su paso, engrosando (pierde generación) — el beat firma, con aire
        .set(canvas, { opacity: 1 }, 0.5)
        .to(
          st,
          {
            p: 1,
            duration: 0.68,
            ease: 'tinta',
            onUpdate: () => {
              c.clearRect(0, 0, vw, vh);
              screenprint(c, box, st.p, S.spot, S.ink);
            },
          },
          0.5
        )
        .to(bar, { xPercent: 170, duration: 0.7, ease: 'tinta' }, 0.5)
        // P4/P5 · el print aterrizó: sostiene un beat y recién ahí levanta limpio
        .to([sheet, canvas, bar], { opacity: 0, duration: 0.3, ease: 'salida' }, 1.28);
    } else {
      // SUBIR (re-exposición): la mesa de luz. El vellum cubre apagado, la lámpara
      // prende y el master se RE-EXPONE a contorno limpio (recupera generación).
      sheet.style.background = S.prussia;
      sheet.style.clipPath = 'none';
      bar.style.background = 'radial-gradient(62% 46% at 50% 100%, rgba(190,214,255,0.32), transparent 70%)';
      gsap
        .timeline({ onComplete: fin })
        .set(sheet, { opacity: 0, filter: 'brightness(0.35)', rotation: 0, xPercent: 0, yPercent: 0 })
        .set(canvas, { opacity: 1 })
        .set(bar, { opacity: 0, xPercent: 0 })
        // P1 · el vellum apagado entra y cubre = pico de oclusión
        .to(sheet, { opacity: 1, duration: 0.26, ease: 'prensa' }, 0)
        .add(swap, 0.26)
        // P2 · la lámpara prende (2 titileos + estable)
        .to(sheet, { filter: 'brightness(0.72)', duration: 0.05 }, 0.3)
        .to(sheet, { filter: 'brightness(0.42)', duration: 0.05 }, 0.37)
        .to(sheet, { filter: 'brightness(1)', duration: 0.45, ease: 'tinta' }, 0.45)
        .to(bar, { opacity: 1, duration: 0.45, ease: 'tinta' }, 0.4)
        // P3 · RE-EXPOSICIÓN legible: la barra de luz cruza el ancho y el master
        //      vuelve a contorno a su paso (recupera generación) — beat con aire
        .to(
          st,
          {
            p: 1,
            duration: 0.74,
            ease: 'tinta',
            onUpdate: () => {
              c.clearRect(0, 0, vw, vh);
              contour(c, box, st.p, S.line);
            },
          },
          0.48
        )
        // P4/P5 · sostiene el master expuesto y recién ahí levanta y revela Plano
        .to([sheet, canvas, bar], { opacity: 0, duration: 0.3, ease: 'salida' }, 1.3);
    }
  });
}

// Precargar el retrato apenas se importa el módulo, para que el primer switch
// ya lo tenga muestreado.
if (typeof document !== 'undefined') {
  if (document.readyState !== 'loading') cargarRetrato();
  else document.addEventListener('DOMContentLoaded', cargarRetrato, { once: true });
  document.addEventListener('astro:page-load', cargarRetrato);
}
