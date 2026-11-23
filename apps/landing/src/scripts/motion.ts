import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

function initSmoothScroll(): void {
  const lenis = new Lenis({ lerp: 0.1, anchors: true });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', ScrollTrigger.update);
}

function initPrivacySweep(): void {
  const section = document.querySelector<HTMLElement>('[data-privacy]');
  const veil = section?.querySelector<HTMLElement>('[data-privacy-veil]');
  const scan = section?.querySelector<HTMLElement>('[data-privacy-scan]');
  if (!section || !veil || !scan) return;
  let isLight = false;
  let tween: gsap.core.Tween | null = null;
  const sweep = (toLight: boolean) => {
    if (isLight === toLight) return;
    isLight = toLight;
    tween?.kill();
    const height = section.offsetHeight;
    const from = toLight ? 0 : 100;
    const to = toLight ? 100 : 0;
    const progress = { value: from };
    gsap.set(scan, { opacity: 1 });
    tween = gsap.to(progress, {
      value: to,
      duration: 0.9,
      ease: 'power3.inOut',
      onUpdate: () => {
        veil.style.clipPath = `inset(${progress.value}% 0 0 0)`;
        scan.style.transform = `translateY(${(progress.value / 100) * height}px)`;
      },
      onComplete: () => {
        gsap.set(scan, { opacity: 0 });
      },
    });
  };
  ScrollTrigger.create({
    trigger: section,
    start: 'top 60%',
    end: 'bottom 40%',
    onToggle: (self) => sweep(self.isActive),
  });
  section.addEventListener('focusin', () => sweep(true));
}

function initFinalOpen(): void {
  const lens = document.querySelector<HTMLElement>('[data-final-lens]');
  if (!lens) return;
  gsap.fromTo(
    lens,
    { '--inx': '14%' },
    {
      '--inx': '0%',
      ease: 'none',
      scrollTrigger: { trigger: lens, start: 'top 95%', end: 'top 35%', scrub: 0.6 },
    },
  );
}

export function initMotion(): void {
  initSmoothScroll();
  initPrivacySweep();
  initFinalOpen();
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
