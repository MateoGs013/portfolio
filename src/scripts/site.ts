// Entry point de motion, compartido por todas las páginas.
// Con ClientRouter (view transitions) el módulo se ejecuta UNA vez:
// - Lenis vive a nivel módulo (sobrevive las navegaciones).
// - Todo lo que toca el DOM se re-inicializa en astro:page-load
//   (que también dispara en la carga inicial).
// - astro:before-swap mata los ScrollTriggers e instancias de halftone
//   de la página saliente.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './eases';
import { initLenis } from './lenis';
import { initTema } from './tema';
import { initRegistro } from './registro';
import { initHalftone, clearHalftone } from './halftone';
import { initTirada } from './tirada';
import { initImprenta } from './imprenta';
import { initVivo } from './vivo';
import { initTipos, clearTipos } from './tipos';
import { initPared, clearPared } from './pared';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initLenis(reduced);

document.addEventListener('astro:before-swap', () => {
  clearPared();
  ScrollTrigger.getAll().forEach((t) => t.kill());
  clearHalftone();
  clearTipos();
});

document.addEventListener('astro:page-load', () => {
  initTema(reduced);
  initRegistro(reduced);
  initHalftone(reduced);
  initTirada(reduced);
  initImprenta(reduced);
  initVivo();
  initTipos(reduced);
  initPared(reduced);
});

// Cambio de edición en caliente (ms:edicion, lo emite tema.ts detrás de
// la cortina): desmontar la experiencia saliente, refrescar los triggers
// con el layout nuevo (la pared de Afiche cambia posiciones sticky) y
// montar la entrante. Contrato §4c.1 — acá se suman las experiencias de
// las demás ediciones cuando lleguen.
document.addEventListener('ms:edicion', () => {
  clearPared();
  ScrollTrigger.refresh();
  initPared(reduced);
});
