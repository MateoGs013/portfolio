// Edición Terminal: el hero se vuelve una ventana de terminal viva
// (DESIGN.md §4.7 — cada edición es una experiencia propia, no solo tintas).
// Cuatro gestos diegéticos:
//   1. scanline CRT horizontal siguiendo al cursor (reemplaza la guía de Afiche)
//   2. caret mono block que persigue al cursor con blink (cadencia de terminal)
//   3. el nombre se "selecciona" tipo editor al pasar el cursor
//   4. el nombre se scramblea al entrar el cursor (decrypt, cooldown por palabra)
// El folio lee la posición del cursor como un shell readout.
// Solo corre cuando data-tema === 'terminal' y hay puntero fino.
import gsap from 'gsap';
import './eases';

const GLYPHS = '!<>-_\\/[]{}=+*^?#@%&';
const SCRAMBLE_MS = 380;
const COOLDOWN_MS = 900;

let off: (() => void) | null = null;

function scramble(el: HTMLElement, onDone: () => void): void {
  const original = el.dataset.text || el.textContent || '';
  if (!original) {
    onDone();
    return;
  }
  const start = performance.now();
  const tick = (): void => {
    const progress = Math.min(1, (performance.now() - start) / SCRAMBLE_MS);
    let out = '';
    for (let i = 0; i < original.length; i++) {
      // Ola izquierda→derecha: cada carácter scramblea una ventana propia.
      const charStart = (i / original.length) * 0.45;
      const charEnd = charStart + 0.55;
      if (progress >= charEnd) {
        out += original[i];
      } else if (progress >= charStart) {
        out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      } else {
        out += original[i];
      }
    }
    el.textContent = out;
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = original;
      onDone();
    }
  };
  requestAnimationFrame(tick);
}

export function initTerminal(reduced: boolean): void {
  clearTerminal();
  if (reduced || !window.matchMedia('(pointer: fine)').matches) return;
  if (document.documentElement.getAttribute('data-tema') !== 'terminal') return;

  const masthead = document.querySelector<HTMLElement>('.masthead');
  const scanline = document.querySelector<HTMLElement>('[data-scanline]');
  const caret = document.querySelector<HTMLElement>('[data-caret]');
  const shellCursor = document.querySelector<HTMLElement>('[data-shell-cursor]');
  if (!masthead || !scanline || !caret) return;

  const scanY = gsap.quickTo(scanline, 'y', { duration: 0.18, ease: 'tinta' });
  const scanO = gsap.quickTo(scanline, 'opacity', { duration: 0.22, ease: 'tinta' });
  const carX = gsap.quickTo(caret, 'x', { duration: 0.24, ease: 'tinta' });
  const carY = gsap.quickTo(caret, 'y', { duration: 0.24, ease: 'tinta' });
  const carO = gsap.quickTo(caret, 'opacity', { duration: 0.22, ease: 'tinta' });

  const regs = Array.from(document.querySelectorAll<HTMLElement>('.hero-title .registro'));
  let currentSel: HTMLElement | null = null;
  const scrambling = new WeakSet<HTMLElement>();
  const cooldowns = new WeakMap<HTMLElement, number>();
  const fmt2 = (n: number): string => n.toFixed(2).replace('.', ',');

  const move = (e: PointerEvent): void => {
    // Re-chequeo en cada move: el usuario puede haber cambiado de edición
    // sin navegar (el wipe no dispara astro:page-load).
    if (document.documentElement.getAttribute('data-tema') !== 'terminal') return;

    const r = masthead.getBoundingClientRect();
    const inside = e.clientY >= r.top && e.clientY <= r.bottom;
    if (inside) {
      // Banda centrada en el cursor (el haz barre la fila, no la subraya).
      scanY(e.clientY - r.top - scanline.offsetHeight / 2);
      scanO(0.9);
      carX(e.clientX - r.left - caret.offsetWidth / 2);
      carY(e.clientY - r.top - caret.offsetHeight / 2);
      carO(0.9);
    } else {
      scanO(0);
      carO(0);
    }

    if (shellCursor && inside) {
      const fx = fmt2((e.clientX - r.left) / r.width);
      const fy = fmt2((e.clientY - r.top) / r.height);
      shellCursor.textContent = `${fx} ${fy}`;
    }

    let sel: HTMLElement | null = null;
    if (inside) {
      for (const reg of regs) {
        const rr = reg.getBoundingClientRect();
        if (e.clientX >= rr.left && e.clientX <= rr.right && e.clientY >= rr.top && e.clientY <= rr.bottom) {
          sel = reg;
          break;
        }
      }
    }
    if (sel !== currentSel) {
      if (currentSel) currentSel.classList.remove('sel');
      if (sel) {
        sel.classList.add('sel');
        // Scramble con cooldown: solo al entrar, no en cada pixel.
        const last = cooldowns.get(sel) || 0;
        const now = performance.now();
        if (!scrambling.has(sel) && now - last > COOLDOWN_MS) {
          scrambling.add(sel);
          cooldowns.set(sel, now);
          scramble(sel, () => scrambling.delete(sel));
        }
      }
      currentSel = sel;
    }
  };

  const leave = (): void => {
    scanO(0);
    carO(0);
    if (shellCursor) shellCursor.textContent = '—';
    if (currentSel) {
      currentSel.classList.remove('sel');
      currentSel = null;
    }
  };

  window.addEventListener('pointermove', move, { passive: true });
  document.documentElement.addEventListener('pointerleave', leave);

  off = () => {
    window.removeEventListener('pointermove', move);
    document.documentElement.removeEventListener('pointerleave', leave);
    if (currentSel) {
      currentSel.classList.remove('sel');
      currentSel = null;
    }
  };
}

export function clearTerminal(): void {
  off?.();
  off = null;
}
