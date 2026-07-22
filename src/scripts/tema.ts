// Selector de edición (con barrido de reimpresión) y toggle claro/oscuro.
// Persistencia en localStorage: ms-tema / ms-theme (el anti-FOUC de
// Base.astro los lee antes del primer paint).
import gsap from 'gsap';
import { pageReveal } from './registro';
import './eases';

const NOMBRES: Record<string, string> = {
  afiche: 'Afiche',
  terminal: 'Terminal',
  plano: 'Plano',
  fanzine: 'Fanzine',
};

export function initTema(reduced: boolean): void {
  const root = document.documentElement;

  /* ---- claro / oscuro ---- */
  const modeBtn = document.getElementById('mode-btn');
  const esOscuro = (): boolean => {
    const attr = root.getAttribute('data-theme');
    return attr ? attr === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  };
  modeBtn?.setAttribute('aria-pressed', String(esOscuro()));
  modeBtn?.addEventListener('click', () => {
    const next = esOscuro() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    modeBtn.setAttribute('aria-pressed', String(next === 'dark'));
    try {
      localStorage.setItem('ms-theme', next);
    } catch {}
  });

  /* ---- selector de edición ---- */
  const wipe = document.getElementById('wipe');
  const wipeLabel = document.getElementById('wipe-label');
  const chips = gsap.utils.toArray<HTMLElement>('[data-tema-btn]');
  let switching = false;

  // La edición secreta: el chip Fanzine solo existe para quien la desbloqueó
  // con el clicker (o ya la tiene activa). Corre en todas las páginas.
  const chipFanzine = chips.find((c) => c.getAttribute('data-tema-btn') === 'fanzine');
  if (chipFanzine) {
    let fanzineLibre = root.getAttribute('data-tema') === 'fanzine';
    try {
      fanzineLibre = fanzineLibre || localStorage.getItem('ms-fanzine') === '1';
    } catch {}
    chipFanzine.hidden = !fanzineLibre;
  }

  const applyTema = (tema: string): void => {
    root.setAttribute('data-tema', tema);
    chips.forEach((c) => {
      const activo = c.getAttribute('data-tema-btn') === tema;
      c.classList.toggle('on', activo);
      c.setAttribute('aria-pressed', String(activo));
    });
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
      const regs = document.querySelectorAll('.registro');
      gsap
        .timeline({
          onComplete: () => {
            switching = false;
            gsap.set(wipe, { yPercent: -100 });
          },
        })
        // 1. La edición saliente se "arranca": la plancha se desregistra
        //    antes de que la cortina cubra — el gesto de levantar la hoja.
        .to(regs, {
          '--r1x': '-0.16em',
          '--r1y': '0.05em',
          '--r2x': '0.12em',
          '--r2y': '-0.07em',
          '--rega': 1,
          duration: 0.28,
          ease: 'salida',
        })
        // 2. Cortina baja (la hoja nueva entra a la prensa)
        .fromTo(wipe, { yPercent: -100 }, { yPercent: 0, duration: 0.4, ease: 'prensa' }, '-=0.08')
        .add(() => applyTema(tema))
        // 3. Cortina sube (la hoja sale reimpresa)
        .to(wipe, { yPercent: 100, duration: 0.4, ease: 'salida' }, '+=0.1')
        // 4. La nueva edición se registra (creado recién acá: si se instancia
        //    antes, sus fromTo esconden la página de inmediato).
        .add(() => {
          pageReveal(true);
        }, '-=0.28');
    });
  });

  // Sincronizar chips con la edición inicial (anti-FOUC ya la aplicó).
  applyTema(root.getAttribute('data-tema') || 'afiche');
}
