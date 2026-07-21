// Orquestador de la home: Lenis, intro cinemática, reveal del hero
// y cambio de edición con barrido. Todo respeta prefers-reduced-motion.
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(SplitText);

const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- Lenis (scroll con inercia) ---------------- */
if (!reduced) {
  const lenis = new Lenis({ autoRaf: false, lerp: 0.12 });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------------- Tema claro/oscuro ---------------- */
const modeBtn = document.getElementById('mode-btn');
modeBtn?.addEventListener('click', () => {
  const attr = root.getAttribute('data-theme');
  const dark = attr ? attr === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  const next = dark ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try {
    localStorage.setItem('ms-theme', next);
  } catch {}
});

/* ---------------- Hero: split y reveal ---------------- */
const lineInners = gsap.utils.toArray<HTMLElement>('[data-hero="line"]');
const splits = lineInners.map((el) => new SplitText(el, { type: 'chars' }));
const chars = splits.flatMap((s) => s.chars as HTMLElement[]);

function heroTimeline(fast = false): gsap.core.Timeline {
  const speed = fast ? 0.6 : 1;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.fromTo(
    chars,
    { yPercent: 112, rotate: 5 },
    { yPercent: 0, rotate: 0, duration: 0.9 * speed, stagger: 0.028 * speed },
    0
  )
    .fromTo(
      '[data-hero="kicker"]',
      { autoAlpha: 0, y: 14 },
      { autoAlpha: 1, y: 0, duration: 0.5 * speed },
      0.05
    )
    .fromTo(
      '.kicker-line',
      { scaleX: 0 },
      { scaleX: 1, duration: 0.6 * speed },
      0.1
    )
    .fromTo(
      '[data-hero="deco"], [data-hero="bajada"]',
      { autoAlpha: 0, y: 22 },
      { autoAlpha: 1, y: 0, duration: 0.7 * speed, stagger: 0.09 * speed },
      0.35 * speed
    )
    .fromTo(
      '[data-hero="meta"] > div',
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.55 * speed, stagger: 0.08 * speed },
      0.5 * speed
    )
    .fromTo(
      '.marquee-strip',
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.5 * speed },
      0.6 * speed
    )
    .fromTo(
      '[data-hero="hint"]',
      { autoAlpha: 0 },
      { autoAlpha: 0.9, duration: 0.5 * speed },
      0.8 * speed
    );
  return tl;
}

/* ---------------- Intro cinemática ---------------- */
const intro = document.getElementById('intro');

function killIntro(): void {
  intro?.remove();
  document.body.style.overflow = '';
}

if (reduced || !intro) {
  killIntro();
  gsap.set(
    ['[data-hero="kicker"]', '.kicker-line', '[data-hero="deco"]', '[data-hero="bajada"]', '[data-hero="meta"] > div', '.marquee-strip', '[data-hero="hint"]'],
    { clearProps: 'all' }
  );
} else {
  document.body.style.overflow = 'hidden';
  const repeat = (() => {
    try {
      return sessionStorage.getItem('ms-intro') === '1';
    } catch {
      return false;
    }
  })();
  try {
    sessionStorage.setItem('ms-intro', '1');
  } catch {}

  const num = document.getElementById('intro-num');
  const counter = { v: 0 };
  const tl = gsap.timeline({
    onComplete: killIntro,
  });

  if (!repeat) {
    tl.to(counter, {
      v: 100,
      duration: 1.15,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (num) num.textContent = String(Math.round(counter.v)).padStart(3, '0');
      },
    })
      .to(
        '.intro-bar',
        { width: '33.3%', duration: 0.9, ease: 'power3.inOut', stagger: 0.12 },
        0.1
      )
      .to('.intro-inner', { autoAlpha: 0, y: -26, duration: 0.35, ease: 'power2.in' }, '+=0.1');
  } else {
    gsap.set('.intro-inner', { autoAlpha: 0 });
  }

  tl.to(intro, {
    yPercent: -100,
    duration: 0.85,
    ease: 'expo.inOut',
  });
  // El hero arranca mientras la cortina todavía está subiendo.
  tl.add(heroTimeline(), '-=0.45');
}

/* ---------------- Selector de edición + barrido ---------------- */
const wipe = document.getElementById('wipe');
const wipeLabel = document.getElementById('wipe-label');
const chips = gsap.utils.toArray<HTMLElement>('[data-tema-btn]');
const NOMBRES: Record<string, string> = { afiche: 'Afiche', terminal: 'Terminal', plano: 'Plano' };
let switching = false;

function applyTema(tema: string): void {
  root.setAttribute('data-tema', tema);
  chips.forEach((c) => c.classList.toggle('on', c.getAttribute('data-tema-btn') === tema));
  try {
    localStorage.setItem('ms-tema', tema);
  } catch {}
}

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
    const tl = gsap.timeline({
      onComplete: () => {
        switching = false;
        gsap.set(wipe, { yPercent: -100 });
      },
    });
    tl.fromTo(
      wipe,
      { yPercent: -100 },
      { yPercent: 0, duration: 0.42, ease: 'power4.inOut' }
    )
      .add(() => applyTema(tema))
      .to(wipe, { yPercent: 100, duration: 0.42, ease: 'power4.inOut' }, '+=0.12')
      // Creado recién acá: si se instancia antes, sus fromTo esconden el hero
      // de inmediato (immediateRender) con la cortina todavía arriba.
      .add(() => {
        heroTimeline(true);
      }, '-=0.3');
  });
});

// Sincronizar chips con la edición inicial (anti-FOUC ya la aplicó).
applyTema(root.getAttribute('data-tema') || 'afiche');
