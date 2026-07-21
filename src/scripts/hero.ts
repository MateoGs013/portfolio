// Reveal del hero. Exporta la timeline para que intro y cambio de edición
// la reutilicen. Los targets se localizan por data-hero="...".
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

let chars: HTMLElement[] | null = null;

function getChars(): HTMLElement[] {
  if (!chars) {
    const lineInners = gsap.utils.toArray<HTMLElement>('[data-hero="line"]');
    const splits = lineInners.map((el) => new SplitText(el, { type: 'chars' }));
    chars = splits.flatMap((s) => s.chars as HTMLElement[]);
  }
  return chars;
}

export function heroTimeline(fast = false): gsap.core.Timeline {
  const speed = fast ? 0.6 : 1;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.fromTo(
    getChars(),
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
    .fromTo('.kicker-line', { scaleX: 0 }, { scaleX: 1, duration: 0.6 * speed }, 0.1)
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
    .fromTo('.marquee-strip', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 * speed }, 0.6 * speed)
    .fromTo('[data-hero="hint"]', { autoAlpha: 0 }, { autoAlpha: 0.9, duration: 0.5 * speed }, 0.8 * speed);
  return tl;
}
