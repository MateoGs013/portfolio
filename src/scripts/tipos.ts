// Composición en tipos (DESIGN.md §4): el retrato del impresor compuesto
// con los caracteres de la edición activa — tipos móviles, no shader ASCII
// genérico. Canvas 2D sin WebGL: el retrato se muestrea una vez por layout
// y se dibuja un glifo por celda.
//
// EL gesto de cursor del sitio (§4b: uno solo, igual en las 4 ediciones):
// la plancha sale de la prensa recién entintada, y con los segundos LA
// TINTA SE SECA hasta quedar fantasma sobre el papel. El cursor es el
// rodillo: por donde pasa re-entinta con falloff — tinta fresca en el
// accent de la edición, que se seca a tinta negra y se desvanece. Causal
// (el rodillo entinta por contacto, la tinta se seca de verdad), sin capas
// nuevas: es el retrato que ya existe tomando y perdiendo cuerpo.
// En puntero grueso (touch) o reduced-motion no hay gesto: la plancha
// queda impresa, visible, sin secarse.
// Al asentar la composición, el retrato se "imprime": la trama pasa de
// gruesa (blur) a nítida (DESIGN.md §5 — la trama halftone se afina).
import gsap from 'gsap';
import './eases';

type Tipos = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cols: number;
  rows: number;
  cell: number;
  dpr: number;
  dark: Float32Array; // densidad de tinta por celda (0 = papel)
  delay: Float32Array; // retardo de composición inicial por celda (ms)
  heat: Float32Array; // tinta de cursor por celda
};

let T: Tipos | null = null;
let raf = 0;
let vivo = false;
let visible = true;
let reducido = false;
let introT0 = 0;
let introListo = false;
let activo = false;
const mouse = { x: -1e4, y: -1e4 };
let lastY = 0;
let scramble = 0;
let finePointer = false;
let prevDraw = 0;
let img: HTMLImageElement | null = null;
let ro: ResizeObserver | null = null;
let mo: MutationObserver | null = null;
let io: IntersectionObserver | null = null;
let escuchando = false;

// Rampas de menor a mayor densidad de tinta, con el material de cada edición:
// letras de caja de madera, ASCII de terminal, tramado de plotter, máquina
// de escribir del fanzine.
const CHARSETS: Record<string, string> = {
  afiche: ' ·ILTSEM',
  terminal: ' ·:-=+*#%@',
  plano: ' ·:/+×%#',
  fanzine: ' .·oxXOMW',
};
const FONTS: Record<string, string> = {
  afiche: '--font-d',
  terminal: '--font-m',
  plano: '--font-b',
  fanzine: '--font-m',
};

function token(nombre: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
}

// Pseudo-random determinista (mismo truco que halftone.ts): sin Math.random
// para que la plancha sea estable entre frames y rebuilds.
function hash(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function build(): void {
  if (!T || !img || !img.complete || !img.naturalWidth) return;
  const w = T.canvas.clientWidth;
  const h = T.canvas.clientHeight;
  if (!w || !h) return;
  T.dpr = Math.min(2, window.devicePixelRatio || 1);
  T.cell = window.innerWidth < 700 ? 6 : 7;
  T.cols = Math.max(8, Math.floor(w / T.cell));
  T.rows = Math.max(8, Math.floor(h / T.cell));
  T.canvas.width = Math.round(w * T.dpr);
  T.canvas.height = Math.round(h * T.dpr);

  // El retrato se rasteriza a la resolución de la grilla (cover, anclado
  // abajo: el busto apoya sobre la regla del masthead).
  const off = document.createElement('canvas');
  off.width = T.cols;
  off.height = T.rows;
  const octx = off.getContext('2d', { willReadFrequently: true });
  if (!octx) return;
  const s = Math.max(T.cols / img.naturalWidth, T.rows / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  octx.drawImage(img, (T.cols - dw) / 2, T.rows - dh, dw, dh);
  const px = octx.getImageData(0, 0, T.cols, T.rows).data;

  const n = T.cols * T.rows;
  T.dark = new Float32Array(n);
  T.delay = new Float32Array(n);
  T.heat = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = px[i * 4 + 3] / 255;
    const lum = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255;
    // Fondo transparente ⇒ papel; el resto, más oscuro = más tinta.
    // Gamma 0.8: los medios tonos del rostro ganan cuerpo en la trama.
    const d = Math.pow(a * (1 - lum * 0.85), 0.8);
    T.dark[i] = d < 0.1 ? 0 : Math.min(1, d);
    T.delay[i] = hash(i % T.cols, Math.floor(i / T.cols)) * 1000;
    // Rebuild post-intro (resize, cambio de edición): la plancha vuelve
    // entintada, no fantasma — el secado arranca de nuevo.
    if (introListo && T.dark[i] > 0) T.heat[i] = 0.85;
  }
}

function draw(now: number): void {
  if (!T) return;
  const { ctx, cols, rows, cell, dpr } = T;
  const tema = document.documentElement.getAttribute('data-tema') || 'afiche';
  const ramp = CHARSETS[tema] || CHARSETS.afiche;
  const fam = token(FONTS[tema] || '--font-d') || 'sans-serif';
  const inkColor = token('--ink');
  const accent = token('--accent');

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, T.canvas.clientWidth, T.canvas.clientHeight);
  ctx.font = `${Math.ceil(cell * 0.95)}px ${fam}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const tIntro = introListo ? Infinity : now - introT0;
  const rect = T.canvas.getBoundingClientRect();
  const mx = mouse.x - rect.left;
  const my = mouse.y - rect.top;
  const radio = 150;
  let tinta = false;
  // La tinta se seca en tiempo real (τ ≈ 3,5s), solo donde hay gesto de
  // cursor; en touch/reduced la plancha queda impresa y no se seca.
  const dt = prevDraw ? Math.min(200, now - prevDraw) : 33;
  prevDraw = now;
  const vivoInk = finePointer && !reducido;
  const seca = vivoInk ? Math.exp(-dt / 3500) : 1;

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const i = gy * cols + gx;
      const d = T.dark[i];
      if (d === 0) continue;
      const x = gx * cell + cell / 2;
      const y = gy * cell + cell / 2;

      if (vivoInk) {
        const dist = Math.hypot(x - mx, y - my);
        if (dist < radio) {
          // Falloff suave: el rodillo carga más tinta en el centro.
          T.heat[i] = Math.max(T.heat[i], Math.pow(1 - dist / radio, 1.5));
        }
      }
      // La tinta no se evapora: se ASIENTA. Seca hacia un piso visible —
      // el retrato nunca desaparece de la escena, solo pierde frescura.
      const piso = 0.22;
      let ink = T.heat[i];
      if (ink > piso + 0.02) {
        T.heat[i] = piso + (ink - piso) * seca;
        if (vivoInk) tinta = true;
      } else if (ink > 0) {
        T.heat[i] = Math.max(ink, piso);
      }

      // La caja de tipos respira: cada celda muta periódicamente a un
      // vecino de densidad parecida (fase propia ⇒ nunca cambian todas
      // a la vez), con tick mecánico, no fundido.
      const base = 1 + Math.round(d * (ramp.length - 2));
      const fase = Math.floor(now / 260 + T.delay[i] * 0.011);
      const j = hash(gx + fase * 31, gy * 7 + fase);
      let idx = base;
      if (j < 0.42) idx = Math.max(1, Math.min(ramp.length - 1, base + (j < 0.21 ? -1 : 1)));
      let ch = ramp[idx];
      const componiendo = tIntro < T.delay[i];
      if (componiendo || (scramble > 0.02 && hash(gx + (now % 97), gy) < scramble * 0.5)) {
        // Tipos sueltos todavía sin distribuir en la rama, o plancha
        // desregistrada por scroll rápido.
        ch = ramp[1 + Math.floor(hash(gx, gy + now) * (ramp.length - 1))];
      }

      // Papel con plancha asentada = silueta siempre legible; la tinta
      // fresca le devuelve el cuerpo. Sin gesto (touch/reduced), impresa fija.
      const papel = vivoInk ? 0.12 + d * 0.26 : 0.18 + d * 0.5;
      const alpha = componiendo
        ? 0.12
        : Math.min(0.95, papel + (vivoInk ? ink * (0.2 + d * 0.5) : 0));
      // Tinta fresca = accent de la edición; al secarse pasa a tinta negra
      // (dither con hash para que el borde fresco/seco no sea un anillo).
      ctx.fillStyle = vivoInk && ink > 0.5 + hash(gx, gy) * 0.2 ? accent : inkColor;
      ctx.globalAlpha = alpha;
      ctx.fillText(ch, x, y);
    }
  }
  ctx.globalAlpha = 1;
  if (!introListo && tIntro > 1150) {
    introListo = true;
    // La plancha sale ENTINTADA de la prensa: a partir de acá la tinta
    // empieza a secarse sola hasta el estado fantasma (solo con gesto).
    if (T) {
      for (let i = 0; i < T.heat.length; i++) {
        if (T.dark[i] > 0) T.heat[i] = 0.85;
      }
    }
    // La trama se afina: de halftone grueso (blur) a imagen nítida.
    if (!reducido && T) {
      gsap.to(T.canvas, { filter: 'blur(0px)', duration: 1.0, ease: 'tinta' });
    }
  }
  activo = !introListo || tinta || scramble > 0.02;
}

// La mutación de tipos corre siempre que la escena está a la vista, pero
// a cadencia de taller: ~8 ticks/s en reposo, 30fps con tinta en juego.
let ultimoDraw = 0;

function loop(now: number): void {
  const y = window.scrollY;
  scramble = Math.max(scramble * 0.9, Math.min(0.9, Math.abs(y - lastY) / 60));
  lastY = y;
  const intervalo = activo ? 33 : 120;
  if (now - ultimoDraw >= intervalo) {
    ultimoDraw = now;
    draw(now);
  }
  if (visible) {
    raf = requestAnimationFrame(loop);
  } else {
    vivo = false;
  }
}

function wake(): void {
  if (vivo || !T || reducido || !visible) return;
  vivo = true;
  lastY = window.scrollY;
  raf = requestAnimationFrame(loop);
}

function onMove(e: PointerEvent): void {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  wake();
}
function onScroll(): void {
  wake();
}

export function initTipos(reduced: boolean): void {
  clearTipos();
  reducido = reduced;
  finePointer = window.matchMedia('(pointer: fine)').matches;
  const canvas = document.querySelector<HTMLCanvasElement>('[data-tipos]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  T = {
    canvas,
    ctx,
    cols: 0,
    rows: 0,
    cell: 12,
    dpr: 1,
    dark: new Float32Array(0),
    delay: new Float32Array(0),
    heat: new Float32Array(0),
  };

  img = new Image();
  img.src = canvas.dataset.src || '';
  img.onload = () => {
    // Sin la fuente cargada los glifos caen a fallback y la trama cambia
    // de textura a mitad de intro.
    document.fonts.ready.then(() => {
      if (!T) return;
      build();
      introT0 = performance.now();
      if (reducido) {
        introListo = true;
        gsap.set(canvas, { filter: 'blur(0px)' });
        draw(performance.now());
      } else {
        // La trama arranca gruesa (blur) y se afina al asentar (§5).
        gsap.set(canvas, { filter: 'blur(5px)' });
        wake();
      }
    });
  };

  ro = new ResizeObserver(() => {
    if (!T) return;
    build();
    draw(performance.now());
  });
  ro.observe(canvas);

  // Cambio de edición/tinta: recolorear y recomponer con el charset nuevo.
  mo = new MutationObserver(() => {
    if (!T) return;
    draw(performance.now());
  });
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-tema', 'data-theme'],
  });

  io = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
    if (visible) wake();
  });
  io.observe(canvas);

  if (!reducido && !escuchando) {
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    escuchando = true;
  }
}

export function clearTipos(): void {
  cancelAnimationFrame(raf);
  vivo = false;
  activo = false;
  introListo = false;
  scramble = 0;
  prevDraw = 0;
  ro?.disconnect();
  mo?.disconnect();
  io?.disconnect();
  ro = mo = io = null;
  if (escuchando) {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('scroll', onScroll);
    escuchando = false;
  }
  img = null;
  T = null;
}
