// Entry point de la home: orquesta los módulos de motion.
// Todo respeta prefers-reduced-motion.
import { initLenis } from './lenis';
import { initTema } from './tema';
import { runIntro } from './intro';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initLenis(reduced);
initTema(reduced);
runIntro(reduced);
