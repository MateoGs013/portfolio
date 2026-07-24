// Coreografía de la etapa Ideación (spec: docs/etapas/ideacion.md).
// La carga ES la primera animación: el problema se escribe (clip-path por
// línea, `tinta`), el lápiz rodea la palabra (dashoffset) y la atribución
// ASIENTA con `prensa`. Un solo pin en toda la página (la mesa de encargos,
// scrub 0.6, 100% reversible). Ynara invierte la mecánica: el lápiz se
// levanta (sin trazo) y reacciona el retrato. Todo gated por
// data-tema="ideacion"; init/clear idempotentes; ScrollTriggers con id
// `ideacion-` para kill selectivo (mismo patrón que pared.ts).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './eases';
import { crearTrazo, crearTick, formarTrazo, trazoSeco, crearEnderezado } from './trazo';

gsap.registerPlugin(ScrollTrigger);

let epoch = 0;
let trazos: SVGSVGElement[] = [];
let endereza: ReturnType<typeof crearEnderezado> | null = null;
let onResize: (() => void) | null = null;
let resizeTimer = 0;

// Dibuja las dos pasadas de un trazo dentro de una timeline (la segunda se
// monta sobre la primera, §6: los elementos se pisan) y lo seca al terminar.
function dibujarEn(tl: gsap.core.Timeline, svg: SVGSVGElement, at: number, dur = 0.5): void {
  svg.dataset.dibujado = '1';
  const paths = Array.from(svg.querySelectorAll('path'));
  paths.forEach((p, i) => {
    tl.to(
      p,
      {
        strokeDashoffset: 0,
        duration: i ? dur * 0.55 : dur,
        ease: 'tinta',
        // El secado es reversible con el scrub: fresco mientras se dibuja,
        // seco al asentar (la clase la resuelve CSS con var(), theme-proof).
        onUpdate:
          i === paths.length - 1
            ? function (this: gsap.core.Tween) {
                svg.classList.toggle('seco', this.progress() > 0.95);
              }
            : undefined,
      },
      at + i * dur * 0.6
    );
  });
}

export function initIdeacion(reduced: boolean): void {
  clearIdeacion();
  if (document.documentElement.dataset.tema !== 'ideacion') return;
  const raiz = document.querySelector<HTMLElement>('.ideacion');
  if (!raiz) return;
  const mi = ++epoch;

  // La geometría del lápiz se mide con la fuente definitiva: sin esperar a
  // fonts.ready la caja de la palabra miente y la elipse queda corta.
  document.fonts.ready.then(() => {
    if (mi !== epoch || !document.body.contains(raiz)) return;
    montar(raiz, reduced);
  });
}

function montar(raiz: HTMLElement, reduced: boolean): void {
  // Idempotencia: si quedó un trazo de un init anterior sobre el mismo DOM,
  // muere antes de duplicarse.
  raiz.querySelectorAll('svg.trazo').forEach((s) => s.remove());
  trazos = [];

  // --- El lápiz: una elipse por marca (Ynara no tiene — el lápiz se levanta).
  const marcas = Array.from(raiz.querySelectorAll<HTMLElement>('[data-marca]'));
  for (const [i, marca] of marcas.entries()) {
    trazos.push(crearTrazo(marca, i * 13 + 3));
  }
  const ticks = Array.from(raiz.querySelectorAll<HTMLElement>('[data-tick]')).map((c, i) =>
    crearTick(c, i * 7 + 29)
  );
  const pase = raiz.querySelector<HTMLElement>('[data-endereza]');
  if (pase) endereza = crearEnderezado(pase, 5);

  const abreTrazo = trazos.find((s) => s.closest('.abre'));

  if (reduced) {
    // Estados finales legibles sin un frame de motion: todo trazado y seco.
    trazos.forEach(trazoSeco);
    ticks.forEach(trazoSeco);
    if (endereza) {
      endereza.set(1);
      endereza.svg.classList.add('seco');
    }
    return;
  }

  // --- Secuencia de carga (docs/etapas/ideacion.md §carga).
  const carga = gsap.timeline();
  carga.fromTo(
    '.ideacion .abre .linea',
    { clipPath: 'inset(-6% 102% -6% 0)' },
    { clipPath: 'inset(-6% -2% -6% 0)', duration: 0.55, ease: 'tinta', stagger: 0.2 },
    0.15
  );
  // Terminada la escritura, la línea suelta el clip: la elipse del lápiz
  // desborda la caja de la línea y el clip la degollaría.
  carga.set('.ideacion .abre .linea', { clipPath: 'none' }, 1.18);
  if (abreTrazo) dibujarEn(carga, abreTrazo, 1.2);
  carga.fromTo(
    '.ideacion .abre .nota',
    { clipPath: 'inset(0 0 102% 0)' },
    { clipPath: 'inset(0 0 -2% 0)', duration: 0.35, ease: 'tinta' },
    1.55
  );
  carga.fromTo(
    '.ideacion .abre .atrib',
    { opacity: 0, scale: 1.04, transformOrigin: 'left bottom' },
    { opacity: 1, scale: 1, duration: 0.2, ease: 'prensa' },
    1.7
  );
  // El rótulo "la idea:" nace fresco y se seca junto con la elipse.
  carga.call(() => raiz.querySelector('.rotulo')?.classList.add('seco'), [], 2.1);
  // El cue de scroll: el puente se escribe al final, cortado por el pliegue.
  carga.fromTo(
    '.ideacion .puente',
    { clipPath: 'inset(0 102% 0 0)' },
    { clipPath: 'inset(0 -2% 0 0)', duration: 0.4, ease: 'tinta' },
    2.25
  );

  // --- La mesa de encargos: el ÚNICO pin de la página, scrubbeado.
  const mesa = raiz.querySelector<HTMLElement>('.mesa');
  const encargos = mesa ? Array.from(mesa.querySelectorAll<HTMLElement>('.encargo')) : [];
  if (mesa && encargos.length) {
    const mtl = gsap.timeline({
      scrollTrigger: {
        id: 'ideacion-mesa',
        trigger: mesa,
        start: 'top top',
        end: '+=260%',
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
      },
    });
    encargos.forEach((enc, i) => {
      const at = i * 1.0;
      // Lo que se estampa es la CAJA (el knockout del boceto lee su opacity:
      // el hueco en la trama aparece y desaparece con el texto).
      const caja = enc.querySelector<HTMLElement>('.encargo-caja') || enc;
      // El encargo cae sobre la mesa: estampa con `prensa`.
      mtl.fromTo(
        caja,
        { opacity: 0, scale: 1.05, transformOrigin: 'left center' },
        { opacity: 1, scale: 1, duration: 0.28, ease: 'prensa' },
        at
      );
      const nota = enc.querySelector('.nota');
      if (nota) {
        mtl.fromTo(
          nota,
          { clipPath: 'inset(0 0 102% 0)' },
          { clipPath: 'inset(0 0 -2% 0)', duration: 0.3, ease: 'tinta' },
          at + 0.3
        );
      }
      const svg = enc.querySelector<SVGSVGElement>('svg.trazo');
      if (svg) dibujarEn(mtl, svg, at + 0.42, 0.3);
      if (enc.classList.contains('encargo--ynara')) {
        // El lápiz se levanta: no hay trazo — reacciona el retrato.
        mtl.to('.ideacion .tipos', { opacity: 0.95, duration: 0.5, ease: 'none' }, at + 0.35);
      }
      if (i < encargos.length - 1) {
        mtl.to(caja, { opacity: 0, duration: 0.22, ease: 'salida' }, at + 0.78);
      }
    });
    // Un respiro con Ynara servida antes de soltar el pin.
    mtl.to({}, { duration: 0.35 }, encargos.length - 1 + 0.85);
  }

  // --- El índice de encargos: reveal por fila + tick a lápiz en producción.
  const filas = Array.from(raiz.querySelectorAll<HTMLElement>('.indice .fila'));
  filas.forEach((fila, i) => {
    const tick = ticks.find((t) => fila.contains(t));
    gsap.fromTo(
      fila,
      { clipPath: 'inset(0 102% 0 0)' },
      {
        clipPath: 'inset(0 -2% 0 0)',
        duration: 0.5,
        ease: 'tinta',
        scrollTrigger: {
          id: `ideacion-fila-${i}`,
          trigger: fila,
          start: 'top 88%',
          toggleActions: 'play none none reverse',
        },
        onComplete: () => {
          if (!tick) return;
          const p = tick.querySelector('path');
          if (!p) return;
          gsap.to(p, {
            strokeDashoffset: 0,
            duration: 0.35,
            ease: 'tinta',
            onComplete: () => tick.classList.add('seco'),
          });
        },
        onReverseComplete: () => {
          if (!tick) return;
          const p = tick.querySelector('path');
          if (!p) return;
          gsap.set(p, { strokeDashoffset: p.getTotalLength() });
          tick.classList.remove('seco');
        },
      }
    );
  });

  // --- El pase de etapa: el último trazo se endereza con el scroll y, ya
  // recto, se seca — es la primera columna de la grilla del maquetado.
  if (pase && endereza) {
    const e = endereza;
    const proxy = { p: 0 };
    gsap.to(proxy, {
      p: 1,
      ease: 'none',
      onUpdate: () => {
        e.set(proxy.p);
        e.svg.classList.toggle('seco', proxy.p > 0.9);
      },
      scrollTrigger: {
        id: 'ideacion-endereza',
        trigger: pase,
        start: 'top 85%',
        end: 'top 30%',
        scrub: 0.6,
      },
    });
  }

  // --- Resize: la palabra cambia de caja — el lápiz se redibuja sobre ella.
  onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      trazos.forEach(formarTrazo);
      endereza?.reformar();
    }, 150);
  };
  window.addEventListener('resize', onResize, { passive: true });
}

export function clearIdeacion(): void {
  epoch++;
  ScrollTrigger.getAll().forEach((t) => {
    if (String(t.vars.id || '').startsWith('ideacion-')) t.kill();
  });
  if (onResize) {
    window.removeEventListener('resize', onResize);
    onResize = null;
  }
  window.clearTimeout(resizeTimer);
  trazos = [];
  endereza = null;
}
