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
  // Nada puede pisar el converge: cualquier tween previo sobre la plancha muere.
  gsap.killTweensOf(REGISTRO);
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
    // Sin intro completa — pero la plancha se RE-registra en cada llegada:
    // un converge corto, coherente con navegar entre páginas de la imprenta.
    gsap.set(REVEAL, { clipPath: 'none' });
    if (document.querySelector(REGISTRO)) {
      gsap
        .timeline()
        .fromTo(
          REGISTRO,
          { '--r1x': '-0.07em', '--r1y': '0.025em', '--r2x': '0.055em', '--r2y': '-0.03em', '--rega': 1 },
          { ...EN_REGISTRO, duration: 0.5, ease: 'prensa' }
        )
        .to(REGISTRO, { '--rega': 0, duration: 0.2, ease: 'salida' }, 0.38);
    }
  } else {
    pageReveal();
  }

  // La plancha se corre apenas al pasar la hoja: drift de registro ligado
  // al scroll, reversible (scrub 0.8 le da peso). Solo en la home (masthead).
  // Anima un objeto proxy — nunca las CSS vars directas — para no pelear con
  // el converge de pageReveal por las mismas propiedades.
  const regs = Array.from(document.querySelectorAll<HTMLElement>(REGISTRO));
  if (document.querySelector('.masthead') && regs.length) {
    const drift = { p: 0 };
    gsap.to(drift, {
      p: 1,
      ease: 'none',
      onUpdate: () => {
        for (const reg of regs) {
          reg.style.setProperty('--r1x', `${(-0.035 * drift.p).toFixed(4)}em`);
          reg.style.setProperty('--r2x', `${(0.028 * drift.p).toFixed(4)}em`);
          reg.style.setProperty('--rega', String(0.55 * drift.p));
        }
      },
      scrollTrigger: {
        trigger: '.masthead',
        start: 'top top',
        end: '+=500',
        scrub: 0.8,
      },
    });
  }
}
