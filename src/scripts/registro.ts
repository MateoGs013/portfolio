// "Registro de tintas": el reemplazo del preloader (DESIGN.md §4).
// Los canales cian/magenta del masthead entran desalineados y convergen a
// registro; el resto de la página se imprime con barridos de rodillo
// (clip-path), todo solapado. En visitas repetidas no hay intro. Un scrub
// sutil desregistra la plancha al scrollear (reversible).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './eases';

gsap.registerPlugin(ScrollTrigger);

const REVEAL = '[data-reveal]';
const REGISTRO = '.registro';

const DESALINEADO = {
  '--r1x': '-0.16em',
  '--r1y': '0.05em',
  '--r2x': '0.12em',
  '--r2y': '-0.07em',
  '--rega': 1,
};
const EN_REGISTRO = { '--r1x': '0em', '--r1y': '0em', '--r2x': '0em', '--r2y': '0em' };

/** Timeline de impresión de la página. Reutilizada por el cambio de edición. */
export function pageReveal(fast = false): gsap.core.Timeline {
  const speed = fast ? 0.55 : 1;
  const tl = gsap.timeline();
  tl.fromTo(REGISTRO, DESALINEADO, {
    ...EN_REGISTRO,
    duration: 0.75 * speed,
    ease: 'prensa',
  })
    .to(REGISTRO, { '--rega': 0, duration: 0.25 * speed, ease: 'salida' }, 0.6 * speed)
    .fromTo(
      REVEAL,
      { clipPath: 'inset(0 0 101% 0)' },
      { clipPath: 'inset(0 0 -1% 0)', duration: 0.65 * speed, stagger: 0.07 * speed, ease: 'tinta' },
      0.2 * speed
    );
  return tl;
}

function setImpreso(): void {
  gsap.set(REGISTRO, { ...EN_REGISTRO, '--rega': 0 });
  gsap.set(REVEAL, { clipPath: 'none' });
}

export function initRegistro(reduced: boolean): void {
  if (reduced) {
    setImpreso();
    return;
  }

  let repeat = false;
  try {
    repeat = sessionStorage.getItem('ms-intro') === '1';
    sessionStorage.setItem('ms-intro', '1');
  } catch {}

  if (repeat) {
    // Sin intro: el mejor loader es el que no existe (DESIGN.md §4.3).
    setImpreso();
  } else {
    pageReveal();
  }

  // La plancha se corre apenas al pasar la hoja: drift de registro ligado
  // al scroll, reversible (scrub 0.8 le da peso).
  gsap.to(REGISTRO, {
    '--r1x': '-0.035em',
    '--r2x': '0.028em',
    '--rega': 0.55,
    ease: 'none',
    scrollTrigger: {
      trigger: '.masthead',
      start: 'top top',
      end: '+=500',
      scrub: 0.8,
    },
  });
}
