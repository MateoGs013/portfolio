// Intro cinemática de imprenta. Versión corta en visitas repetidas
// (sessionStorage); con prefers-reduced-motion no corre y el hero queda visible.
import gsap from 'gsap';
import { heroTimeline } from './hero';

export function runIntro(reduced: boolean): void {
  const intro = document.getElementById('intro');

  const killIntro = (): void => {
    intro?.remove();
    document.body.style.overflow = '';
  };

  if (reduced || !intro) {
    killIntro();
    return;
  }

  document.body.style.overflow = 'hidden';
  let repeat = false;
  try {
    repeat = sessionStorage.getItem('ms-intro') === '1';
    sessionStorage.setItem('ms-intro', '1');
  } catch {}

  const num = document.getElementById('intro-num');
  const counter = { v: 0 };
  const tl = gsap.timeline({ onComplete: killIntro });

  if (!repeat) {
    tl.to(counter, {
      v: 100,
      duration: 1.15,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (num) num.textContent = String(Math.round(counter.v)).padStart(3, '0');
      },
    })
      .to('.intro-bar', { width: '33.3%', duration: 0.9, ease: 'power3.inOut', stagger: 0.12 }, 0.1)
      .to('.intro-inner', { autoAlpha: 0, y: -26, duration: 0.35, ease: 'power2.in' }, '+=0.1');
  } else {
    gsap.set('.intro-inner', { autoAlpha: 0 });
  }

  tl.to(intro, { yPercent: -100, duration: 0.85, ease: 'expo.inOut' });
  // El hero arranca mientras la cortina todavía está subiendo.
  tl.add(heroTimeline(), '-=0.45');
}
