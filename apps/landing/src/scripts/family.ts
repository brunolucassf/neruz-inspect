import { isDesktopPointer } from './env';

const SHOT_CLASS = 'is-shot';
const REPLAY_COOLDOWN_MS = 1400;

function playShot(card: HTMLElement): void {
  card.classList.remove(SHOT_CLASS);
  void card.offsetWidth;
  card.classList.add(SHOT_CLASS);
}

export function initFamily(): void {
  const card = document.querySelector<HTMLElement>('[data-family]');
  if (!card || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      playShot(card);
      observer.disconnect();
    },
    { threshold: 0.55 },
  );
  observer.observe(card);

  if (!isDesktopPointer()) return;
  const visual = card.querySelector<HTMLElement>('.family__visual');
  let lastShotAt = 0;
  visual?.addEventListener('pointerenter', () => {
    const now = performance.now();
    if (now - lastShotAt < REPLAY_COOLDOWN_MS) return;
    lastShotAt = now;
    playShot(card);
  });
}
