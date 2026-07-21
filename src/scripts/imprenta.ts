// El clicker del taller. La tirada persiste (ms-tirada); a los 20
// ejemplares se desbloquea la edición Fanzine (ms-fanzine) — el chip
// aparece en el selector (lo revela tema.ts en todas las páginas).
import gsap from 'gsap';
import './eases';

const UMBRAL = 20;

function fmt(n: number): string {
  return String(n).padStart(4, '0');
}

export function initImprenta(reduced: boolean): void {
  const btn = document.getElementById('prensa-btn');
  const num = document.getElementById('tirada-num');
  const estado = document.getElementById('prensa-estado');
  if (!btn || !num || !estado) return; // la imprenta vive solo en la home

  let tirada = 0;
  try {
    tirada = parseInt(localStorage.getItem('ms-tirada') || '0', 10) || 0;
  } catch {}

  const desbloqueada = (): boolean => {
    try {
      return localStorage.getItem('ms-fanzine') === '1';
    } catch {
      return false;
    }
  };

  const pintar = (): void => {
    num.textContent = `Tirada: ${fmt(tirada)} ejemplares`;
    estado.classList.remove('hito');
    if (desbloqueada()) {
      estado.textContent = 'Taller completo: la edición Fanzine te espera arriba.';
    } else if (tirada === 0) {
      estado.textContent = 'La prensa está fría. Dale al botón.';
    } else {
      estado.textContent = `Van ${tirada}. Faltan ${UMBRAL - tirada} para el secreto del taller.`;
    }
  };

  const toast = (msg: string): void => {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3200);
  };

  btn.addEventListener('click', () => {
    tirada += 1;
    try {
      localStorage.setItem('ms-tirada', String(tirada));
    } catch {}

    if (!reduced) {
      const r = btn.getBoundingClientRect();
      const hoja = document.createElement('div');
      hoja.setAttribute(
        'style',
        `position:fixed;z-index:80;width:15px;height:21px;background:var(--bg);` +
          `border:1px solid var(--accent);pointer-events:none;` +
          `left:${r.left + 10 + (tirada % 5) * ((r.width - 30) / 5)}px;top:${r.top - 6}px;`
      );
      document.body.appendChild(hoja);
      gsap.to(hoja, {
        y: -52,
        rotation: 14,
        opacity: 0,
        duration: 0.7,
        ease: 'salida',
        onComplete: () => hoja.remove(),
      });
    }

    if (tirada === UMBRAL && !desbloqueada()) {
      try {
        localStorage.setItem('ms-fanzine', '1');
      } catch {}
      const chip = document.querySelector<HTMLElement>('[data-tema-btn="fanzine"]');
      if (chip) {
        chip.hidden = false;
        if (!reduced) {
          chip.classList.add('pop');
          setTimeout(() => chip.classList.remove('pop'), 520);
        }
      }
      toast('Edición Fanzine desbloqueada — apareció en el selector');
    }

    pintar();
    if (tirada === UMBRAL) estado.classList.add('hito');
  });

  pintar();
}
