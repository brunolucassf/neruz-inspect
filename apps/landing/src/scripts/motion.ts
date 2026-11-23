import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { locale } from './env';

gsap.registerPlugin(ScrollTrigger);

function initSmoothScroll(): void {
  const lenis = new Lenis({ lerp: 0.1, anchors: true });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', ScrollTrigger.update);
}

function initExplode(): void {
  const section = document.querySelector<HTMLElement>('[data-explode]');
  const pin = section?.querySelector<HTMLElement>('[data-explode-pin]');
  if (!section || !pin) return;
  const media = gsap.matchMedia();
  const build = (distance: string) => {
    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: `+=${distance}`,
        pin,
        scrub: 0.6,
        anticipatePin: 1,
      },
    });
    timeline
      .to(pin, { '--tilt': 1, duration: 0.4 }, 0)
      .to(pin, { '--spread': 1, duration: 0.6 }, 0.25)
      .to({}, { duration: 0.15 });
  };
  media.add('(min-width: 768px)', () => build('150%'));
  media.add('(max-width: 767px)', () => build('120%'));
}

function initCountUp(): void {
  const format = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  for (const node of document.querySelectorAll<HTMLElement>('[data-count-to]')) {
    const target = Number(node.dataset.countTo);
    const counter = { value: 0 };
    node.textContent = format.format(0);
    ScrollTrigger.create({
      trigger: node,
      start: 'top 85%',
      once: true,
      onEnter: () =>
        gsap.to(counter, {
          value: target,
          duration: 0.9,
          ease: 'power3.out',
          onUpdate: () => {
            node.textContent = format.format(counter.value);
          },
        }),
    });
  }
}

function initTypedCode(): void {
  for (const block of document.querySelectorAll<HTMLElement>('[data-type-code]')) {
    const code = block.querySelector('code');
    if (!code) continue;
    const text = code.textContent ?? '';
    block.style.minHeight = `${block.offsetHeight}px`;
    code.textContent = '';
    const counter = { length: 0 };
    ScrollTrigger.create({
      trigger: block,
      start: 'top 85%',
      once: true,
      onEnter: () =>
        gsap.to(counter, {
          length: text.length,
          duration: 1.1,
          ease: 'none',
          onUpdate: () => {
            code.textContent = text.slice(0, Math.round(counter.length));
          },
        }),
    });
  }
}

function initEasingCurve(): void {
  const demo = document.querySelector<HTMLElement>('[data-motion-demo]');
  const curve = demo?.querySelector<SVGPathElement>('.easing__curve');
  if (!demo || !curve) return;
  gsap.set(curve, { strokeDashoffset: 1 });
  ScrollTrigger.create({
    trigger: demo,
    start: 'top 85%',
    once: true,
    onEnter: () => gsap.to(curve, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out' }),
  });
  ScrollTrigger.create({
    trigger: demo,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) =>
      demo.style.setProperty('--ball-state', self.isActive ? 'running' : 'paused'),
  });
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
  initExplode();
  initCountUp();
  initTypedCode();
  initEasingCurve();
  initPrivacySweep();
  initFinalOpen();
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
