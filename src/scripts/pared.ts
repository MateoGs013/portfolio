// La pared empapelada (DESIGN.md §4c — Afiche: física = COBERTURA).
// El apilado es CSS puro (sticky en ediciones.css): este módulo pone solo
// el motion de la PEGATINA — la hoja entra apenas rotada con sombra de
// despegue, el scrub la aplana al cubrir, y al pegarse hay UN golpe seco
// (la escobilla del pegador la alisa; despegar hacia atrás es suave: la
// asimetría es la causalidad). También el takeover: el rodillo entinta
// la plancha de la tirada y "LA TIRADA" queda en reserva de papel.
// Montaje/desmontaje en caliente vía ms:edicion (orquestado en site.ts).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './eases';
import { setCubierto } from './tipos';

gsap.registerPlugin(ScrollTrigger);

// Cada hoja que cubre: la mano del pegador alterna la rotación de entrada.
// `trigger` es siempre un elemento ESTÁTICO en flujo (la escena del titular
// es sticky y su rect miente — usa su sentinel). `tapa` recibe inert al
// quedar cubierta (links invisibles fuera del tab); `canvas` pausa el
// retrato cuando su hoja quedó tapada.
const HOJAS = [
  { sel: '.portada-escena', trigger: '[data-pared-sentinel]', rot: -0.7 },
  { sel: '.tirada', trigger: '.tirada', rot: 0.5, tapa: '.portada-escena', canvas: true },
  { sel: '.imprenta', trigger: '.imprenta', rot: -0.4 },
] as const;

let montado = false;
let montadoEn = 0;
let midiendo = false;

const topbarH = (): number => document.getElementById('topbar')?.offsetHeight ?? 52;

function medirTopbar(): void {
  document.documentElement.style.setProperty('--topbar-h', `${topbarH()}px`);
}

export function initPared(reduced: boolean): void {
  // La var la usa el sticky de la pared, pero medirla no cuesta nada y
  // deja el token listo para cualquier edición (§4c.5).
  medirTopbar();
  if (!midiendo) {
    midiendo = true;
    window.addEventListener('resize', medirTopbar, { passive: true });
  }

  if (montado) return;
  if (document.documentElement.dataset.tema !== 'afiche') return;
  if (!document.querySelector('.masthead')) return; // la pared vive en la home
  montado = true;
  montadoEn = performance.now();
  if (reduced) return; // sticky apila igual (es scroll nativo); sin motion

  for (const h of HOJAS) {
    const el = document.querySelector<HTMLElement>(h.sel);
    const trigger = document.querySelector(h.trigger);
    if (!el || !trigger) continue;

    // Pegatina: el scrub es dueño exclusivo de rotación y sombra, y
    // termina de aplanar ANTES de la cobertura total — el golpe no le
    // pisa propiedades (solo anima y). El pivote es el borde superior
    // (lo que ya está pegado); con origen al centro, la esquina de una
    // hoja larga se corre ~14px y abre una cuña sin cubrir en el borde.
    gsap.fromTo(
      el,
      { rotation: h.rot, transformOrigin: '50% 0', '--despegue': 1 },
      {
        rotation: 0,
        '--despegue': 0,
        ease: 'none',
        scrollTrigger: {
          id: `pared-scrub-${h.sel}`,
          trigger,
          start: 'top 96%',
          end: () => `top ${topbarH() + 60}px`,
          scrub: 0.8,
        },
      }
    );

    // El golpe: una vez, solo hacia adelante, y nunca en un flick o un
    // salto de ancla (cruzarían 2-3 hojas juntas: cascada de golpes) ni
    // al montar la pared con la página ya scrolleada.
    ScrollTrigger.create({
      id: `pared-golpe-${h.sel}`,
      trigger,
      start: () => `top ${topbarH() + 22}px`,
      onEnter: (self) => {
        if (performance.now() - montadoEn < 600) return;
        if (Math.abs(self.getVelocity()) > 3800) return;
        gsap.fromTo(el, { y: 3 }, { y: 0, duration: 0.18, ease: 'prensa', overwrite: 'auto' });
      },
    });

    // Cobertura total: la hoja tapada sale del árbol de foco y el canvas
    // del retrato deja de dibujar debajo del papel.
    if (h.tapa || h.canvas) {
      const tapaEl = h.tapa ? document.querySelector<HTMLElement>(h.tapa) : null;
      ScrollTrigger.create({
        id: `pared-tapa-${h.sel}`,
        trigger,
        start: () => `top ${topbarH() + 2}px`,
        onEnter: () => {
          if (tapaEl) tapaEl.inert = true;
          if (h.canvas) setCubierto(true);
        },
        onLeaveBack: () => {
          if (tapaEl) tapaEl.inert = false;
          if (h.canvas) setCubierto(false);
        },
      });
    }
  }

  // El takeover: la tinta sube e inunda la plancha con el scroll. El CSS
  // la deja entintada completa (no-JS/reduced); acá arranca con la base
  // del rodillo ya apoyada (86%) para que nunca haya viewport en blanco.
  const tinta = document.querySelector('.takeover-tinta');
  if (tinta) {
    gsap.fromTo(
      tinta,
      { yPercent: 86 },
      {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: {
          id: 'pared-takeover',
          trigger: '.tirada-takeover',
          start: 'top bottom',
          // La inundación le gana al viewport: completa cuando la plancha
          // todavía viene subiendo — nunca hay media pantalla de papel
          // muerto esperando tinta.
          end: 'top 35%',
          scrub: 0.8,
        },
      }
    );
  }
}

export function clearPared(): void {
  if (!montado) return;
  montado = false;
  ScrollTrigger.getAll()
    .filter((t) => String(t.vars.id || '').startsWith('pared-'))
    .forEach((t) => t.kill());
  const els = gsap.utils.toArray<HTMLElement>([
    '.masthead',
    '.portada-escena',
    '.tirada',
    '.imprenta',
    '.takeover-tinta',
  ]);
  gsap.killTweensOf(els);
  for (const el of els) {
    gsap.set(el, { clearProps: 'transform' });
    el.style.removeProperty('--despegue');
    el.inert = false;
  }
  setCubierto(false);
}
