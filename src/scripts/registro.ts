// "Registro de tintas": el reemplazo del preloader (DESIGN.md §4).
// EL CICLO DE MÁQUINA (una sola coreografía, no efectos en paralelo):
// la plancha del retrato se compone en tipos (tipos.ts) mientras los
// canales cian/magenta del título entran desalineados y convergen con
// golpe de prensa; la tipografía GANA CUERPO DE TINTA (ola de wght por
// el eje variable, §6.5) mientras los fantasmas ceden; al asentarse, la
// trama se afina y la tinta empieza a secar. En visitas repetidas hay un
// re-registro corto. Un scrub sutil desregistra la plancha al scrollear
// (reversible).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './eases';

gsap.registerPlugin(ScrollTrigger);

const REVEAL = '[data-reveal]';
const REGISTRO = '.registro';
const TITULO = '.hero-title';

const DESALINEADO = {
  '--r1x': '-0.16em',
  '--r1y': '0.05em',
  '--r2x': '0.12em',
  '--r2y': '-0.07em',
  '--rega': 1,
};
const EN_REGISTRO = { '--r1x': '0em', '--r1y': '0em', '--r2x': '0em', '--r2y': '0em' };

// La ola de peso solo corre donde la display es variable (Archivo:
// afiche/plano/fanzine). En Terminal la display es Plex Mono estática —
// animar el peso saltaría entre archivos discretos.
const conEjes = (): boolean =>
  (document.documentElement.getAttribute('data-tema') || 'afiche') !== 'terminal';

// "Gana cuerpo de tinta": el título entra liviano y se asienta en su peso
// final. clearProps al terminar — un inline no debe pisar --weight-d de la
// próxima edición.
function olaDePeso(tl: gsap.core.Timeline, desde: number, dur: number, pos: number): void {
  const titulo = document.querySelector<HTMLElement>(TITULO);
  if (!titulo || !conEjes()) return;
  const final = parseInt(getComputedStyle(titulo).fontWeight, 10) || 900;
  tl.fromTo(
    titulo,
    { fontWeight: Math.max(100, Math.round(final * desde)) },
    { fontWeight: final, duration: dur, ease: 'tinta' },
    pos
  ).set(titulo, { clearProps: 'fontWeight' }, pos + dur + 0.05);
}

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
  // La ola se monta sobre el final del golpe: gana cuerpo mientras ceden
  // los fantasmas — no después, pisarse ES la coreografía (§6).
  olaDePeso(tl, 0.55, 0.9 * speed, 0.35 * speed);
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
    // un converge corto con su ola de cuerpo, coherente con navegar entre
    // páginas de la imprenta.
    gsap.set(REVEAL, { clipPath: 'none' });
    if (document.querySelector(REGISTRO)) {
      const tl = gsap
        .timeline()
        .fromTo(
          REGISTRO,
          { '--r1x': '-0.07em', '--r1y': '0.025em', '--r2x': '0.055em', '--r2y': '-0.03em', '--rega': 1 },
          { ...EN_REGISTRO, duration: 0.5, ease: 'prensa' }
        )
        .to(REGISTRO, { '--rega': 0, duration: 0.2, ease: 'salida' }, 0.38);
      olaDePeso(tl, 0.8, 0.45, 0.1);
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

  // Parallax del retrato: la plancha se mueve más lento que el scroll,
  // dándole profundidad a la escena. En mobile (sin hover) es la forma
  // en que el retrato "respira" — la escena no está quieta.
  const tiposCanvas = document.querySelector<HTMLElement>('.tipos');
  if (tiposCanvas && document.querySelector('.masthead')) {
    gsap.to(tiposCanvas, {
      y: 50,
      ease: 'none',
      scrollTrigger: {
        trigger: '.masthead',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.8,
      },
    });
  }
}
