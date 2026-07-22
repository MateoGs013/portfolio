// Edición Fanzine: el hero se vuelve una fotocopia casera viva
// (DESIGN.md §4.7 — cada edición es una experiencia propia, no solo tintas).
// Dos gestos diegéticos:
//   1. mancha de tinta bajo el cursor (multiply en claro, screen en oscuro)
//      — la fotocopia se mancha bajo el dedo
//   2. los chips de la topbar tiemblan cuando el cursor se acerca (jitter
//      diegético — el papel no está quieto, los recortes se mueven)
// Solo corre cuando data-tema === 'fanzine' y hay puntero fino.
import gsap from 'gsap';
import './eases';

let off: (() => void) | null = null;

export function initFanzine(reduced: boolean): void {
  clearFanzine();
  if (reduced || !window.matchMedia('(pointer: fine)').matches) return;
  if (document.documentElement.getAttribute('data-tema') !== 'fanzine') return;

  const masthead = document.querySelector<HTMLElement>('.masthead');
  const mancha = document.querySelector<HTMLElement>('[data-mancha]');
  if (!masthead || !mancha) return;

  const mX = gsap.quickTo(mancha, 'x', { duration: 0.55, ease: 'tinta' });
  const mY = gsap.quickTo(mancha, 'y', { duration: 0.55, ease: 'tinta' });
  const mO = gsap.quickTo(mancha, 'opacity', { duration: 0.35, ease: 'tinta' });
  // Sin esto, la mancha viaja desde (0,0) —esquina— la primera vez que
  // aparece: se planta bajo el cursor antes de hacerse visible.
  let plantada = false;

  const chips = Array.from(document.querySelectorAll<HTMLElement>('.chip'));

  const move = (e: PointerEvent): void => {
    if (document.documentElement.getAttribute('data-tema') !== 'fanzine') return;

    const r = masthead.getBoundingClientRect();
    const inside = e.clientY >= r.top && e.clientY <= r.bottom;
    if (inside) {
      if (!plantada) {
        plantada = true;
        gsap.set(mancha, { x: e.clientX - r.left, y: e.clientY - r.top });
      }
      mX(e.clientX - r.left);
      mY(e.clientY - r.top);
      // La trama de puntos es más rala que el glow anterior: más opacidad.
      mO(0.85);
    } else {
      mO(0);
    }

    // Jitter de chips: los recortes cercanos al cursor tiemblan.
    for (const chip of chips) {
      const cr = chip.getBoundingClientRect();
      const cx = cr.left + cr.width / 2;
      const cy = cr.top + cr.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist < 120) {
        const s = 1 - dist / 120;
        gsap.to(chip, {
          '--jx': `${(Math.random() - 0.5) * 2.5 * s}px`,
          '--jy': `${(Math.random() - 0.5) * 2.5 * s}px`,
          '--jr': `${(Math.random() - 0.5) * 3.5 * s}deg`,
          duration: 0.12,
          ease: 'none',
        });
      } else {
        gsap.to(chip, { '--jx': '0px', '--jy': '0px', '--jr': '0deg', duration: 0.4, ease: 'tinta' });
      }
    }
  };

  const leave = (): void => {
    mO(0);
    for (const chip of chips) {
      gsap.to(chip, { '--jx': '0px', '--jy': '0px', '--jr': '0deg', duration: 0.4, ease: 'tinta' });
    }
  };

  window.addEventListener('pointermove', move, { passive: true });
  document.documentElement.addEventListener('pointerleave', leave);

  off = () => {
    window.removeEventListener('pointermove', move);
    document.documentElement.removeEventListener('pointerleave', leave);
  };
}

export function clearFanzine(): void {
  off?.();
  off = null;
}
