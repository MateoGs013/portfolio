// Entry point de la home: orquesta los módulos de motion.
// Todo respeta prefers-reduced-motion.
import './eases';
import { initLenis } from './lenis';
import { initTema } from './tema';
import { initRegistro } from './registro';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initLenis(reduced);
initTema(reduced);
initRegistro(reduced);
