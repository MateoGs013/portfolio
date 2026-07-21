// Scroll con inercia, enganchado al ticker de GSAP (recomendación de Lenis).
import gsap from 'gsap';
import Lenis from 'lenis';

export function initLenis(reduced: boolean): Lenis | null {
  if (reduced) return null;
  const lenis = new Lenis({ autoRaf: false, lerp: 0.12 });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}
