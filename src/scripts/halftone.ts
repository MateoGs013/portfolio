// Trama de medios tonos duotono (DESIGN.md §5.4) — la inversión técnica del
// sitio. Cada [data-halftone] contiene un <img> (la foto real) y un <canvas>:
// dos planchas de puntos (tinta 15°, acento 75°) arrancan gruesas y
// desregistradas y, a medida que avanza `progress` (scrub del scroll),
// convergen a registro, se afinan y la foto real se revela debajo.
// Con prefers-reduced-motion no hay canvas: queda la foto.

interface Dot {
  x: number;
  y: number;
  v: number; // 0..1 intensidad (1 = punto máximo)
  jx: number; // jitter orgánico precomputado
  jy: number;
}

interface Plate {
  dots: Dot[];
  angle: number;
}

interface Instancia {
  wrap: HTMLElement;
  img: HTMLImageElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  plates: Plate[];
  w: number;
  h: number;
  dpr: number;
  cell: number;
  progress: number;
  colores: { ink: string; accent: string };
}

const instancias = new Map<Element, Instancia>();
const ANGULOS = [15, 75];

function leerColores(el: HTMLElement): { ink: string; accent: string } {
  const cs = getComputedStyle(el);
  return {
    ink: cs.getPropertyValue('--ink').trim() || '#000',
    accent: cs.getPropertyValue('--accent').trim() || '#f00',
  };
}

/** Muestrea la imagen y precomputa las planchas de puntos en grillas rotadas. */
function construirPlanchas(inst: Instancia): void {
  const { img, w, h, cell } = inst;
  const cols = Math.max(2, Math.round(w / cell));
  const rows = Math.max(2, Math.round(h / cell));
  const sample = document.createElement('canvas');
  sample.width = cols;
  sample.height = rows;
  const sctx = sample.getContext('2d', { willReadFrequently: true });
  if (!sctx) return;
  sctx.drawImage(img, 0, 0, cols, rows);
  const data = sctx.getImageData(0, 0, cols, rows).data;

  const lumAt = (x: number, y: number): number => {
    const cx = Math.min(cols - 1, Math.max(0, Math.round((x / w) * cols)));
    const cy = Math.min(rows - 1, Math.max(0, Math.round((y / h) * rows)));
    const i = (cy * cols + cx) * 4;
    return (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
  };

  const cx = w / 2;
  const cy = h / 2;
  const diag = Math.sqrt(w * w + h * h);
  inst.plates = ANGULOS.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dots: Dot[] = [];
    const half = diag / 2 + cell;
    // Recorremos la grilla en el espacio rotado y proyectamos al lienzo.
    for (let gy = -half; gy <= half; gy += cell) {
      for (let gx = -half; gx <= half; gx += cell) {
        const x = cx + gx * cos - gy * sin;
        const y = cy + gx * sin + gy * cos;
        if (x < -cell || x > w + cell || y < -cell || y > h + cell) continue;
        const lum = lumAt(x, y);
        const v = Math.pow(1 - lum, 1.35);
        if (v < 0.04) continue;
        // jitter determinístico (sin Math.random en render, estable entre frames)
        const seed = Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453;
        const jit = seed - Math.floor(seed);
        dots.push({
          x,
          y,
          v,
          jx: (jit - 0.5) * cell * 0.35,
          jy: ((jit * 7919) % 1 - 0.5) * cell * 0.35,
        });
      }
    }
    return { dots, angle: deg };
  });
}

function render(inst: Instancia): void {
  const { ctx, plates, w, h, dpr, cell, progress: p, colores } = inst;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // Desregistro y grosor: máximos en p=0, se asientan hacia p=1.
  const asentado = Math.min(1, p * 1.25);
  const off = (1 - asentado) * cell * 1.6;
  // Tope de radio: los puntos nunca se funden en mancha, siempre se lee trama.
  const escala = 1.3 - 0.3 * asentado;
  const radioMax = cell * 0.56;
  const offsets = [
    { x: -off, y: off * 0.4 },
    { x: off, y: -off * 0.6 },
  ];
  const colorPlancha = [colores.accent, colores.ink];
  // La tinta "carga" con el asentamiento: más liviana al inicio.
  const alphaPlancha = [0.62 + 0.2 * asentado, 0.74 + 0.18 * asentado];

  plates.forEach((plate, i) => {
    ctx.fillStyle = colorPlancha[i];
    ctx.globalAlpha = alphaPlancha[i];
    const ox = offsets[i].x;
    const oy = offsets[i].y;
    for (const d of plate.dots) {
      const r = Math.min(radioMax, (cell / 2) * d.v * escala);
      if (r < 0.3) continue;
      ctx.beginPath();
      ctx.arc(d.x + d.jx * (1 - asentado * 0.5) + ox, d.y + d.jy * (1 - asentado * 0.5) + oy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;

  // La impresión se "resuelve" en la foto real sobre el final.
  const foto = p <= 0.78 ? 0 : Math.min(1, (p - 0.78) / 0.22);
  inst.img.style.opacity = String(foto);
  inst.canvas.style.opacity = String(1 - foto * 0.9);
}

function medir(inst: Instancia): void {
  const rect = inst.wrap.getBoundingClientRect();
  inst.w = Math.max(10, rect.width);
  inst.h = Math.max(10, rect.height);
  inst.dpr = Math.min(2, window.devicePixelRatio || 1);
  inst.cell = inst.w > 700 ? 9 : 7;
  inst.canvas.width = Math.round(inst.w * inst.dpr);
  inst.canvas.height = Math.round(inst.h * inst.dpr);
}

export function setHalftoneProgress(el: Element, progress: number): void {
  const inst = instancias.get(el);
  if (!inst) return;
  inst.progress = progress;
  render(inst);
}

/** Limpieza entre navegaciones (astro:before-swap): el DOM viejo se descarta. */
export function clearHalftone(): void {
  instancias.clear();
}

let observerListo = false;
function observarTema(): void {
  if (observerListo) return;
  observerListo = true;
  // Recolorear cuando cambia la edición o la tinta (documentElement persiste
  // entre navegaciones, con registrarlo una vez alcanza).
  new MutationObserver(() => {
    instancias.forEach((inst) => {
      inst.colores = leerColores(inst.wrap);
      render(inst);
    });
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-tema', 'data-theme'],
  });
}

export function initHalftone(reduced: boolean): void {
  const wraps = document.querySelectorAll<HTMLElement>('[data-halftone]');
  wraps.forEach((wrap) => {
    const img = wrap.querySelector('img');
    const canvas = wrap.querySelector('canvas');
    if (!img || !canvas) return;

    if (reduced) {
      // Sin trama: foto directa.
      img.style.opacity = '1';
      canvas.remove();
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      img.style.opacity = '1';
      return;
    }

    const inst: Instancia = {
      wrap,
      img: img as HTMLImageElement,
      canvas,
      ctx,
      plates: [],
      w: 0,
      h: 0,
      dpr: 1,
      cell: 8,
      progress: 0,
      colores: leerColores(wrap),
    };
    instancias.set(wrap, inst);

    const arrancar = (): void => {
      medir(inst);
      construirPlanchas(inst);
      render(inst);
    };

    if ((img as HTMLImageElement).complete) {
      arrancar();
    } else {
      img.addEventListener('load', arrancar, { once: true });
    }

    let resizeTimer: ReturnType<typeof setTimeout>;
    new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(arrancar, 150);
    }).observe(wrap);
  });

  if (!reduced && wraps.length) observarTema();
}
