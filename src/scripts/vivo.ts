// Marco vivo (DESIGN.md §4.4): el reloj del taller late en tiempo real y
// la guía de registro sigue al cursor por la escena (patrón specia1ne,
// traducido: la página se mide a sí misma). En Afiche la guía es la
// prensa: cuando cruza una línea del nombre dispara un golpe seco, y el
// marco vivo lee marca + presión en vivo. Un solo set de handlers a
// nivel módulo — con view transitions se re-inicializa en cada
// astro:page-load y lo anterior se limpia.
import gsap from 'gsap';
import './eases';
import { setPressActive } from './registro';

let intervalo: number | undefined;
let offGuia: (() => void) | null = null;

export function initVivo(): void {
  if (intervalo !== undefined) {
    clearInterval(intervalo);
    intervalo = undefined;
  }
  const relojes = document.querySelectorAll<HTMLElement>('[data-reloj]');
  if (!relojes.length) return;

  const fmt = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  });
  const tick = () => {
    const hora = fmt.format(new Date());
    relojes.forEach((el) => {
      el.textContent = hora;
    });
  };
  tick();
  intervalo = window.setInterval(tick, 1000);
}

export function initGuia(reduced: boolean): void {
  offGuia?.();
  offGuia = null;
  const masthead = document.querySelector<HTMLElement>('.masthead');
  const guia = document.querySelector<HTMLElement>('[data-guia]');
  if (!masthead || !guia) return;
  // Solo con puntero de precisión; con reduced-motion la guía no se mueve.
  if (reduced || !window.matchMedia('(pointer: fine)').matches) return;

  const xTo = gsap.quickTo(guia, 'x', { duration: 0.4, ease: 'tinta' });
  const oTo = gsap.quickTo(guia, 'opacity', { duration: 0.25, ease: 'tinta' });
  // El rodillo se ensancha con la velocidad: más rápido = más tinta.
  const sTo = gsap.quickTo(guia, 'scaleX', { duration: 0.45, ease: 'tinta' });
  let lastGX = 0;
  let lastGT = 0;

  // Afiche: la guía es la prensa. Solo instrumentamos si la edición activa
  // es Afiche — en otras ediciones el readout no existe y la metáfora
  // (golpe de prensa) no corresponde.
  const inAfiche = document.documentElement.getAttribute('data-tema') === 'afiche';
  const cursorEl = document.querySelector<HTMLElement>('[data-cursor]');
  const presionEl = document.querySelector<HTMLElement>('[data-presion]');
  const presionBars = presionEl
    ? Array.from(presionEl.querySelectorAll<HTMLElement>('i'))
    : [];
  const lineas = inAfiche
    ? Array.from(document.querySelectorAll<HTMLElement>('.hero-title .linea'))
    : [];
  let currentPress: HTMLElement | null = null;
  const fmt2 = (n: number): string => n.toFixed(2).replace('.', ',');

  const setPresion = (n: number): void => {
    for (let i = 0; i < presionBars.length; i++) {
      presionBars[i].classList.toggle('on', i < n);
    }
  };

  const press = (linea: HTMLElement): void => {
    // prensa: golpe seco y asentamiento lento (DESIGN.md §6.1). La .linea
    // recibe el golpe físico (escala + caída); el .registro de adentro se
    // desregistra un instante — la prensa desalinea las tintas al bajar.
    gsap.fromTo(
      linea,
      { y: 2, scaleY: 1.02 },
      { y: 0, scaleY: 1, duration: 0.32, ease: 'prensa' }
    );
    const reg = linea.querySelector<HTMLElement>('.registro');
    if (reg) {
      // El drift de scroll de registro.ts cede mientras el press corre.
      setPressActive(true);
      gsap.fromTo(
        reg,
        { '--r1x': '-0.045em', '--r1y': '0.02em', '--r2x': '0.035em', '--r2y': '-0.02em', '--rega': 0.65 },
        {
          '--r1x': '0em',
          '--r1y': '0em',
          '--r2x': '0em',
          '--r2y': '0em',
          '--rega': 0,
          duration: 0.4,
          ease: 'prensa',
          onComplete: () => setPressActive(false),
        }
      );
    }
  };

  const findLinea = (x: number, y: number): HTMLElement | null => {
    for (const l of lineas) {
      const r = l.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return l;
    }
    return null;
  };

  const move = (e: PointerEvent) => {
    // En Terminal, Plano y Fanzine la guía vertical no corre — cada uno
    // tiene su propio instrumento (scanline, cruz filar, mancha).
    const tema = document.documentElement.getAttribute('data-tema');
    if (tema === 'terminal' || tema === 'plano' || tema === 'fanzine') return;
    const r = masthead.getBoundingClientRect();
    const inside = e.clientY >= r.top && e.clientY <= r.bottom;
    if (inside) {
      const t = performance.now();
      const vel = lastGT ? Math.abs(e.clientX - lastGX) / Math.max(8, t - lastGT) : 0;
      lastGX = e.clientX;
      lastGT = t;
      // Banda centrada en el cursor (es un rodillo, no una línea).
      xTo(e.clientX - r.left - guia.offsetWidth / 2);
      sTo(1 + Math.min(1.1, vel * 0.55));
      oTo(1);
    } else {
      oTo(0);
    }
    if (!inAfiche) return;

    if (cursorEl && inside) {
      const fx = fmt2((e.clientX - r.left) / r.width);
      const fy = fmt2((e.clientY - r.top) / r.height);
      cursorEl.textContent = `${fx} · ${fy}`;
    }
    const linea = inside ? findLinea(e.clientX, e.clientY) : null;
    setPresion(linea ? 3 : inside ? 1 : 0);
    if (linea && linea !== currentPress) {
      currentPress = linea;
      press(linea);
    } else if (!linea) {
      currentPress = null;
    }
  };

  const leave = () => {
    oTo(0);
    if (cursorEl) cursorEl.textContent = '—';
    setPresion(0);
    currentPress = null;
  };

  window.addEventListener('pointermove', move, { passive: true });
  document.documentElement.addEventListener('pointerleave', leave);
  offGuia = () => {
    window.removeEventListener('pointermove', move);
    document.documentElement.removeEventListener('pointerleave', leave);
  };
}
