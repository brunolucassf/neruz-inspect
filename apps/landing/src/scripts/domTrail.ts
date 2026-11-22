import { locale } from './env';

export function initDomTrail(): void {
  const trail = document.querySelector<HTMLElement>('[data-dom-trail]');
  const pathNode = trail?.querySelector<HTMLElement>('[data-trail-path]');
  const coordsNode = trail?.querySelector<HTMLElement>('[data-trail-coords]');
  if (!trail || !pathNode || !coordsNode) return;
  if (!matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches) return;
  trail.hidden = false;

  const format = new Intl.NumberFormat(locale);
  const sections = [...document.querySelectorAll<HTMLElement>('[data-section-trail]')];
  let frame = 0;
  let clientX = 0;
  let clientY = 0;

  const updatePath = () => {
    const middle = window.innerHeight * 0.5;
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= middle) current = section;
    }
    const text = current?.dataset.sectionTrail ?? 'main';
    if (pathNode.textContent !== text) pathNode.textContent = text;
  };

  const update = () => {
    frame = 0;
    updatePath();
    coordsNode.textContent = `x ${format.format(Math.round(clientX))} · y ${format.format(Math.round(clientY + window.scrollY))}`;
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      clientX = event.clientX;
      clientY = event.clientY;
      schedule();
    },
    { passive: true },
  );
  window.addEventListener('scroll', schedule, { passive: true });
  update();
}
