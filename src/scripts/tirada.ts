// Coreografía de "La tirada": cada pieza se IMPRIME con el scroll.
// El scrub (0.8) hace del scroll el gesto de pasar la hoja por la prensa —
// reversible, con peso (DESIGN.md §5.1). Solo animan la trama y el título;
// el resto de la información no se anima a propósito.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setHalftoneProgress } from './halftone';
import './eases';

gsap.registerPlugin(ScrollTrigger);

export function initTirada(reduced: boolean): void {
  if (reduced) return;

  gsap.utils.toArray<HTMLElement>('.pieza').forEach((pieza) => {
    const halftone = pieza.querySelector('[data-halftone]');
    const lamina = pieza.querySelector('.lamina');
    const titulo = pieza.querySelector('.pieza-titulo');

    if (halftone) {
      ScrollTrigger.create({
        trigger: pieza,
        start: 'top 92%',
        end: 'top 30%',
        scrub: 0.8,
        onUpdate: (self) => setHalftoneProgress(halftone, self.progress),
      });
    }

    if (lamina) {
      // Ynara no tiene foto: su lámina se dibuja con un barrido de rodillo.
      gsap.fromTo(
        lamina,
        { clipPath: 'inset(0 101% 0 0)' },
        {
          clipPath: 'inset(0 -1% 0 0)',
          ease: 'none',
          scrollTrigger: { trigger: pieza, start: 'top 90%', end: 'top 42%', scrub: 0.8 },
        }
      );
    }

    if (titulo) {
      gsap.fromTo(
        titulo,
        { clipPath: 'inset(0 101% 0 0)' },
        {
          clipPath: 'inset(0 -2% 0 0)',
          ease: 'none',
          scrollTrigger: { trigger: pieza, start: 'top 86%', end: 'top 52%', scrub: 0.8 },
        }
      );
    }
  });
}
