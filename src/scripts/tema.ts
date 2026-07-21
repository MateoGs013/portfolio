// Selector de edición (con barrido de reimpresión) y toggle claro/oscuro.
// Persistencia en localStorage: ms-tema / ms-theme (el anti-FOUC de
// Base.astro los lee antes del primer paint).
import gsap from 'gsap';
import { heroTimeline } from './hero';

const NOMBRES: Record<string, string> = { afiche: 'Afiche', terminal: 'Terminal', plano: 'Plano' };

export function initTema(reduced: boolean): void {
  const root = document.documentElement;

  /* ---- claro / oscuro ---- */
  document.getElementById('mode-btn')?.addEventListener('click', () => {
    const attr = root.getAttribute('data-theme');
    const dark = attr ? attr === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('ms-theme', next);
    } catch {}
  });

  /* ---- selector de edición ---- */
  const wipe = document.getElementById('wipe');
  const wipeLabel = document.getElementById('wipe-label');
  const chips = gsap.utils.toArray<HTMLElement>('[data-tema-btn]');
  let switching = false;

  const applyTema = (tema: string): void => {
    root.setAttribute('data-tema', tema);
    chips.forEach((c) => c.classList.toggle('on', c.getAttribute('data-tema-btn') === tema));
    try {
      localStorage.setItem('ms-tema', tema);
    } catch {}
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const tema = chip.getAttribute('data-tema-btn');
      if (!tema || switching || root.getAttribute('data-tema') === tema) return;

      if (reduced || !wipe) {
        applyTema(tema);
        return;
      }

      switching = true;
      if (wipeLabel) wipeLabel.textContent = `reimprimiendo · edición ${NOMBRES[tema]}`;
      gsap
        .timeline({
          onComplete: () => {
            switching = false;
            gsap.set(wipe, { yPercent: -100 });
          },
        })
        .fromTo(wipe, { yPercent: -100 }, { yPercent: 0, duration: 0.42, ease: 'power4.inOut' })
        .add(() => applyTema(tema))
        .to(wipe, { yPercent: 100, duration: 0.42, ease: 'power4.inOut' }, '+=0.12')
        // Creado recién acá: si se instancia antes, sus fromTo esconden el
        // hero de inmediato (immediateRender) con la cortina todavía arriba.
        .add(() => {
          heroTimeline(true);
        }, '-=0.3');
    });
  });

  // Sincronizar chips con la edición inicial (anti-FOUC ya la aplicó).
  applyTema(root.getAttribute('data-tema') || 'afiche');
}
