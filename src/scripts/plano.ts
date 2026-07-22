// Edición Plano: el hero se vuelve una lámina de obra viva
// (DESIGN.md §4.7 — cada edición es una experiencia propia, no solo tintas).
// Tres gestos diegéticos:
//   1. cruz filar (hairlines h+v) siguiendo al cursor — la mira del CAD
//   2. cota arquitectónica bajo el nombre: línea de dimensión con la medida
//      real del elemento acotado, con ticks en los extremos
//   3. el nombre se "acota" (hairline outline tipo selección CAD)
// El folio lee la posición del cursor como coordenada de lámina.
// Solo corre cuando data-tema === 'plano' y hay puntero fino.
import gsap from 'gsap';
import './eases';

let off: (() => void) | null = null;

export function initPlano(reduced: boolean): void {
  clearPlano();
  if (reduced || !window.matchMedia('(pointer: fine)').matches) return;
  if (document.documentElement.getAttribute('data-tema') !== 'plano') return;

  const masthead = document.querySelector<HTMLElement>('.masthead');
  const cruzH = document.querySelector<HTMLElement>('[data-cruz-h]');
  const cruzV = document.querySelector<HTMLElement>('[data-cruz-v]');
  const cota = document.querySelector<HTMLElement>('[data-cota]');
  const cotaLabel = cota?.querySelector<HTMLElement>('.cota-label');
  const planoCursor = document.querySelector<HTMLElement>('[data-plano-cursor]');
  const medX = document.querySelector<HTMLElement>('[data-medida-x]');
  const medY = document.querySelector<HTMLElement>('[data-medida-y]');
  if (!masthead || !cruzH || !cruzV || !cota) return;

  const ocultarMedidas = (): void => {
    medX?.classList.remove('on');
    medY?.classList.remove('on');
  };

  const hY = gsap.quickTo(cruzH, 'y', { duration: 0.28, ease: 'tinta' });
  const hO = gsap.quickTo(cruzH, 'opacity', { duration: 0.25, ease: 'tinta' });
  const vX = gsap.quickTo(cruzV, 'x', { duration: 0.28, ease: 'tinta' });
  const vO = gsap.quickTo(cruzV, 'opacity', { duration: 0.25, ease: 'tinta' });
  const cotaO = gsap.quickTo(cota, 'opacity', { duration: 0.25, ease: 'tinta' });

  const lineas = Array.from(document.querySelectorAll<HTMLElement>('.hero-title .linea'));
  let currentCotada: HTMLElement | null = null;

  const move = (e: PointerEvent): void => {
    if (document.documentElement.getAttribute('data-tema') !== 'plano') return;

    const r = masthead.getBoundingClientRect();
    const inside = e.clientY >= r.top && e.clientY <= r.bottom;
    if (inside) {
      hY(e.clientY - r.top);
      hO(0.5);
      vX(e.clientX - r.left);
      vO(0.5);
    } else {
      hO(0);
      vO(0);
    }

    if (planoCursor && inside) {
      const px = Math.round(e.clientX - r.left);
      const py = Math.round(e.clientY - r.top);
      planoCursor.textContent = `${px},${py}`;
    }

    // Medidas vivas: la lámina acota el cursor contra los márgenes.
    // El label X se apoya sobre la hairline horizontal (a mitad de camino
    // del margen izquierdo); el Y sobre la vertical (a mitad del superior).
    if (inside) {
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      if (medX) {
        medX.style.left = `${cx / 2}px`;
        medX.style.top = `${cy}px`;
        medX.textContent = `${Math.round(cx)} mm`;
        medX.classList.add('on');
      }
      if (medY) {
        medY.style.left = `${cx}px`;
        medY.style.top = `${cy / 2}px`;
        medY.textContent = `${Math.round(cy)} mm`;
        medY.classList.add('on');
      }
    } else {
      ocultarMedidas();
    }

    let cotada: HTMLElement | null = null;
    if (inside) {
      for (const l of lineas) {
        const lr = l.getBoundingClientRect();
        if (e.clientX >= lr.left && e.clientX <= lr.right && e.clientY >= lr.top && e.clientY <= lr.bottom) {
          cotada = l;
          break;
        }
      }
    }

    if (cotada !== currentCotada) {
      if (currentCotada) currentCotada.classList.remove('cotada');
      if (cotada) {
        cotada.classList.add('cotada');
        // Posicionar la cota debajo del elemento acotado, con su ancho real.
        const lr = cotada.getBoundingClientRect();
        cota.style.left = `${lr.left - r.left}px`;
        cota.style.top = `${lr.bottom - r.top + 10}px`;
        cota.style.width = `${lr.width}px`;
        if (cotaLabel) cotaLabel.textContent = `${Math.round(lr.width)} mm`;
        cotaO(0.85);
      } else {
        cotaO(0);
      }
      currentCotada = cotada;
    }
  };

  const leave = (): void => {
    hO(0);
    vO(0);
    cotaO(0);
    ocultarMedidas();
    if (planoCursor) planoCursor.textContent = '—';
    if (currentCotada) {
      currentCotada.classList.remove('cotada');
      currentCotada = null;
    }
  };

  window.addEventListener('pointermove', move, { passive: true });
  document.documentElement.addEventListener('pointerleave', leave);

  off = () => {
    window.removeEventListener('pointermove', move);
    document.documentElement.removeEventListener('pointerleave', leave);
    if (currentCotada) {
      currentCotada.classList.remove('cotada');
      currentCotada = null;
    }
  };
}

export function clearPlano(): void {
  off?.();
  off = null;
}
