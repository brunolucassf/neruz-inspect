import { locale } from './env';

function initTabs(): void {
  for (const container of document.querySelectorAll<HTMLElement>('[data-tabs]')) {
    const tabs = [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = [...container.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
    const select = (index: number, shouldFocus: boolean) => {
      tabs.forEach((tab, tabIndex) => {
        const isSelected = tabIndex === index;
        tab.setAttribute('aria-selected', String(isSelected));
        tab.tabIndex = isSelected ? 0 : -1;
        panels[tabIndex].hidden = !isSelected;
      });
      if (shouldFocus) tabs[index].focus();
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(index, false));
      tab.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') select((index + 1) % tabs.length, true);
        else if (event.key === 'ArrowLeft') select((index - 1 + tabs.length) % tabs.length, true);
        else if (event.key === 'Home') select(0, true);
        else if (event.key === 'End') select(tabs.length - 1, true);
        else return;
        event.preventDefault();
      });
    });
  }
}

function initSpeed(): void {
  const demo = document.querySelector<HTMLElement>('[data-motion-demo]');
  const input = demo?.querySelector<HTMLInputElement>('[data-speed]');
  const output = demo?.querySelector<HTMLOutputElement>('[data-speed-out]');
  const ball = demo?.querySelector<HTMLElement>('[data-ball]');
  if (!demo || !input || !output || !ball) return;
  const apply = () => {
    const speed = Number(input.value);
    output.textContent = `${speed.toLocaleString(locale)}×`;
    const animation = ball.getAnimations()[0];
    if (animation) animation.playbackRate = speed;
  };
  input.addEventListener('input', apply);
  apply();
}

function initConverter(): void {
  const input = document.querySelector<HTMLInputElement>('[data-px]');
  const output = document.querySelector<HTMLOutputElement>('[data-rem]');
  if (!input || !output) return;
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
  const apply = () => {
    const pixels = Number(input.value);
    output.textContent = Number.isFinite(pixels) ? format.format(pixels / 16) : '0';
  };
  input.addEventListener('input', apply);
  apply();
}

export function initWidgets(): void {
  initTabs();
  initSpeed();
  initConverter();
}
