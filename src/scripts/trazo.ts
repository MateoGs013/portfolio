// El lápiz de la etapa Ideación (docs/etapas/ideacion.md): DOS gestos y nada
// más — la elipse que no cierra (doble pasada con presión variable) y el
// enderezado final del pase de etapa. Regla del lápiz: el trazo nace fresco
// en --accent y SE SECA a --ink (transición CSS de stroke, τ≈3,5s — el mismo
// secado del rodillo de tipos.ts). Geometría determinista con el hash() de la
// casa: estable entre frames y rebuilds, recalculada en resize (la palabra
// cambia de caja). En mobile la elipse pasa a subrayado corto: el margen no
// existe y el óvalo no tiene aire.
const SVGNS = 'http://www.w3.org/2000/svg';

// Pseudo-random determinista (misma familia que tipos/halftone).
function hash(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function pathElipse(w: number, h: number, seed: number, sweep: number, fase: number): string {
  // Sesgo de mano: el centro cae apenas abajo-izquierda, el óvalo va rotado.
  // La caja de la marca es la LÍNEA entera (inline-block hereda line-height):
  // el óvalo se ciñe a la altura óptica del texto, no a la caja.
  const cx = w / 2 - w * 0.02;
  const cy = h / 2 + h * 0.03;
  const a = w / 2 + Math.max(9, w * 0.15);
  const b = h * 0.39 + Math.max(4, h * 0.1);
  const rot = -0.07;
  const N = 46;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const t = fase + (i / N) * Math.PI * 2 * sweep;
    // Presión variable: el radio ondula con dos octavas de hash.
    const wob =
      1 + (hash(i * 3 + seed, seed * 7 + i) - 0.5) * 0.07 + (hash(seed + i, i) - 0.5) * 0.03;
    const px = Math.cos(t) * a * wob;
    const py = Math.sin(t) * b * wob;
    const x = cx + px * Math.cos(rot) - py * Math.sin(rot);
    const y = cy + px * Math.sin(rot) + py * Math.cos(rot);
    d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  return d;
}

function pathSubrayado(w: number, h: number, seed: number, off: number): string {
  const N = 14;
  const y0 = h + 3 + off;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const x = -3 + ((w + 6) * i) / N;
    const y = y0 + (hash(i + seed, seed * 5) - 0.5) * 2.4 + Math.sin(i * 0.9 + seed) * 0.8;
    d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  return d;
}

function esMovil(): boolean {
  return window.matchMedia('(max-width: 700px)').matches;
}

/** (Re)genera la geometría del trazo según la caja actual de la marca.
 *  Mantiene el estado de dibujo: si ya está dibujado queda dibujado. */
export function formarTrazo(svg: SVGSVGElement): void {
  const marca = svg.parentElement;
  if (!marca) return;
  const seed = Number(svg.dataset.seed || 1);
  const w = marca.offsetWidth;
  const h = marca.offsetHeight;
  const paths = Array.from(svg.querySelectorAll('path'));
  const movil = esMovil();
  const ds = movil
    ? [pathSubrayado(w, h, seed, 0), pathSubrayado(w, h, seed + 11, 2.5)]
    : [pathElipse(w, h, seed, 0.93, -0.6), pathElipse(w, h, seed + 17, 0.52, Math.PI * 0.72)];
  paths.forEach((p, i) => {
    p.setAttribute('d', ds[i] || ds[0]);
    const len = p.getTotalLength();
    p.style.strokeDasharray = String(len);
    p.style.strokeDashoffset = svg.dataset.dibujado === '1' ? '0' : String(len);
  });
}

/** Crea la elipse-que-no-cierra (o el subrayado en mobile) dentro de la
 *  marca. No la dibuja: eso lo decide la coreografía (ideacion.ts). */
export function crearTrazo(marca: HTMLElement, seed: number): SVGSVGElement {
  const svg = document.createElementNS(SVGNS, 'svg') as SVGSVGElement;
  svg.classList.add('trazo');
  svg.setAttribute('aria-hidden', 'true');
  svg.dataset.seed = String(seed);
  for (const [ancho, alfa] of [
    [1.8, 1],
    [1.2, 0.65],
  ] as const) {
    const p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke-width', String(ancho));
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('opacity', String(alfa));
    svg.appendChild(p);
  }
  marca.appendChild(svg);
  formarTrazo(svg);
  return svg;
}

/** El tick a lápiz del índice (filas en producción): un check chico con la
 *  misma imperfección de mano. */
export function crearTick(cont: HTMLElement, seed: number): SVGSVGElement {
  const svg = document.createElementNS(SVGNS, 'svg') as SVGSVGElement;
  svg.classList.add('trazo', 'trazo-tick');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', '0 0 20 16');
  svg.dataset.seed = String(seed);
  const p = document.createElementNS(SVGNS, 'path');
  const j = (n: number): number => (hash(n + seed, seed) - 0.5) * 1.6;
  p.setAttribute(
    'd',
    `M ${3 + j(1)} ${9 + j(2)} L ${7.5 + j(3)} ${13 + j(4)} L ${17 + j(5)} ${2.5 + j(6)}`
  );
  p.setAttribute('fill', 'none');
  p.setAttribute('stroke-width', '1.8');
  p.setAttribute('stroke-linecap', 'round');
  p.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(p);
  cont.appendChild(svg);
  const len = p.getTotalLength();
  p.style.strokeDasharray = String(len);
  p.style.strokeDashoffset = String(len);
  return svg;
}

/** Estado final sin motion (reduced / fallback): trazado completo y seco. */
export function trazoSeco(svg: SVGSVGElement): void {
  svg.dataset.dibujado = '1';
  svg.querySelectorAll('path').forEach((p) => (p.style.strokeDashoffset = '0'));
  svg.classList.add('seco');
}

/** El enderezado del pase de etapa: un trazo ondulado que, scrubbeado, se
 *  convierte en la primera línea recta del maquetado. set(p) con p 0→1. */
export function crearEnderezado(cont: HTMLElement, seed: number): {
  svg: SVGSVGElement;
  set: (p: number) => void;
  reformar: () => void;
} {
  const svg = document.createElementNS(SVGNS, 'svg') as SVGSVGElement;
  svg.classList.add('trazo', 'trazo-endereza');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVGNS, 'path');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-width', '1.8');
  path.setAttribute('stroke-linecap', 'round');
  svg.appendChild(path);
  cont.appendChild(svg);

  const N = 32;
  let ondulado: number[][] = [];
  let recto: number[][] = [];
  let p0 = 0;

  const medir = (): void => {
    const w = cont.offsetWidth;
    const h = cont.offsetHeight;
    const y = h / 2;
    ondulado = [];
    recto = [];
    for (let i = 0; i <= N; i++) {
      const x = (w * i) / N;
      const dy =
        Math.sin((i / N) * Math.PI * 2.3 + seed) * h * 0.3 +
        (hash(i + seed, seed * 3) - 0.5) * 3;
      ondulado.push([x, y + dy]);
      recto.push([x, y]);
    }
  };

  const set = (p: number): void => {
    p0 = p;
    let d = '';
    for (let i = 0; i <= N; i++) {
      const x = ondulado[i][0];
      const y = ondulado[i][1] + (recto[i][1] - ondulado[i][1]) * p;
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    path.setAttribute('d', d);
  };

  medir();
  set(0);
  return {
    svg,
    set,
    reformar: () => {
      medir();
      set(p0);
    },
  };
}
