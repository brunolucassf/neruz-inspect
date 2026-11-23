import { locale } from './env';

function setText(selector: string, value: string): void {
  for (const node of document.querySelectorAll<HTMLElement>(selector)) {
    if (node.textContent !== value) node.textContent = value;
  }
}

function initConverter(): void {
  const input = document.querySelector<HTMLInputElement>('[data-px]');
  const output = document.querySelector<HTMLOutputElement>('[data-rem]');
  if (!input || !output) return;
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
  const apply = () => {
    const pixels = Number(input.value);
    const isValid = input.value !== '' && Number.isFinite(pixels);
    const rem = isValid ? format.format(pixels / 16) : '0';
    output.textContent = rem;
    setText('[data-np-px]', isValid ? format.format(pixels) : '0');
    setText('[data-np-rem]', rem);
  };
  input.addEventListener('input', apply);
  document.addEventListener('np:body', apply);
  apply();
}

export function initWidgets(): void {
  initConverter();
}
