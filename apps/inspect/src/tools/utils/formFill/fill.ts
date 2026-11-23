import {
  classifyField,
  type FakePerson,
  type FieldDescriptor,
  type FieldKind,
  isTermsHint,
  type Random,
  type ValueRequest,
  valueFor,
} from './fakeData';

export const TEST_MARK_ATTRIBUTE = 'data-neruz-test';

export type FillOptions = { includePasswords: boolean; overwrite: boolean };

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

type PreviousState = { value: string; checked: boolean; selectedIndex: number };

export type FilledRecord = {
  id: number;
  element: FormControl;
  kind: FieldKind;
  label: string;
  value: string;
  previous: PreviousState;
};

export type FillReport = {
  filled: FilledRecord[];
  skipped: number;
  passwordsSkipped: number;
};

const isVisible = (element: Element): boolean => {
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility({ visibilityProperty: true });
  }
  return element.getClientRects().length > 0;
};

export const collectControls = (root: ParentNode = document): FormControl[] =>
  [...root.querySelectorAll<FormControl>('input, select, textarea')].filter(isVisible);

const labelOf = (element: FormControl): string => {
  const fromLabels = [...(element.labels ?? [])].map((label) => label.textContent ?? '').join(' ');
  const labelledBy = (element.getAttribute('aria-labelledby') ?? '')
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');
  return [fromLabels, labelledBy, element.getAttribute('aria-label') ?? '', element.title]
    .join(' ')
    .trim()
    .replace(/\s+/g, ' ');
};

const describeControl = (element: FormControl, label: string): FieldDescriptor => ({
  tag: element.tagName.toLowerCase() as FieldDescriptor['tag'],
  type: element instanceof HTMLInputElement ? element.type.toLowerCase() : '',
  name: element.name,
  id: element.id,
  autocomplete: element.getAttribute('autocomplete') ?? '',
  placeholder: element.getAttribute('placeholder') ?? '',
  label,
  disabled: element.disabled,
  readOnly: 'readOnly' in element ? element.readOnly : false,
});

const snapshotState = (element: FormControl): PreviousState => ({
  value: element.value,
  checked: element instanceof HTMLInputElement ? element.checked : false,
  selectedIndex: element instanceof HTMLSelectElement ? element.selectedIndex : -1,
});

const dispatchValueEvents = (element: FormControl, value: string): void => {
  element.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      composed: true,
      inputType: 'insertText',
      data: value,
    }),
  );
  element.dispatchEvent(new Event('change', { bubbles: true }));
};

export const setControlValue = (
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void => {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (setter) setter.call(element, value);
  else element.value = value;
  dispatchValueEvents(element, value);
};

const chooseOption = (select: HTMLSelectElement, random: Random): HTMLOptionElement | undefined => {
  const options = [...select.options].filter(
    (option) => !option.disabled && !option.hidden && option.value.trim() !== '',
  );
  return options[Math.floor(random() * options.length)];
};

const isRequired = (element: FormControl): boolean => element.required;

const wantsChecked = (element: HTMLInputElement, label: string, random: Random): boolean =>
  isRequired(element) || isTermsHint(`${element.name} ${element.id} ${label}`) || random() < 0.5;

const valueRequestOf = (element: FormControl, kind: FieldKind): ValueRequest => {
  const input = element instanceof HTMLInputElement ? element : null;
  return {
    kind,
    type: input ? input.type.toLowerCase() : '',
    maxLength: 'maxLength' in element ? element.maxLength : -1,
    min: input?.min ?? '',
    max: input?.max ?? '',
    step: input?.step === 'any' ? '' : (input?.step ?? ''),
  };
};

const hasValue = (element: FormControl): boolean => element.value.trim() !== '';

const groupKey = (element: HTMLInputElement): string =>
  `${element.form ? [...document.forms].indexOf(element.form) : -1}:${element.name}`;

export const fillForms = (
  person: FakePerson,
  options: FillOptions,
  random: Random,
  root: ParentNode = document,
): FillReport => {
  const report: FillReport = { filled: [], skipped: 0, passwordsSkipped: 0 };
  const controls = collectControls(root);
  const radioGroups = new Map<string, HTMLInputElement[]>();

  const record = (
    element: FormControl,
    kind: FieldKind,
    label: string,
    value: string,
    previous: PreviousState,
  ): void => {
    element.setAttribute(TEST_MARK_ATTRIBUTE, kind);
    report.filled.push({ id: report.filled.length, element, kind, label, value, previous });
  };

  for (const element of controls) {
    const label = labelOf(element);
    const kind = classifyField(describeControl(element, label));
    if (kind === 'skip') {
      report.skipped += 1;
      continue;
    }
    if (kind === 'password' && !options.includePasswords) {
      report.passwordsSkipped += 1;
      continue;
    }
    if (kind === 'radio' && element instanceof HTMLInputElement) {
      const key = groupKey(element);
      radioGroups.set(key, [...(radioGroups.get(key) ?? []), element]);
      continue;
    }
    const previous = snapshotState(element);

    if (kind === 'checkbox' && element instanceof HTMLInputElement) {
      const desired = wantsChecked(element, label, random);
      if (!options.overwrite && element.checked) {
        report.skipped += 1;
        continue;
      }
      if (element.checked !== desired) element.click();
      record(element, kind, label, String(element.checked), previous);
      continue;
    }

    if (element instanceof HTMLSelectElement) {
      if (!options.overwrite && hasValue(element)) {
        report.skipped += 1;
        continue;
      }
      const option = chooseOption(element, random);
      if (!option) {
        report.skipped += 1;
        continue;
      }
      element.value = option.value;
      dispatchValueEvents(element, option.value);
      record(element, kind, label, option.text.trim() || option.value, previous);
      continue;
    }

    if (!options.overwrite && hasValue(element)) {
      report.skipped += 1;
      continue;
    }
    const value = valueFor(valueRequestOf(element, kind), person, random);
    setControlValue(element, value);
    record(element, kind, label, value, previous);
  }

  for (const radios of radioGroups.values()) {
    const enabled = radios.filter((radio) => !radio.disabled);
    if (enabled.length === 0) continue;
    if (!options.overwrite && enabled.some((radio) => radio.checked)) {
      report.skipped += 1;
      continue;
    }
    const chosen = enabled[Math.floor(random() * enabled.length)];
    if (!chosen) continue;
    const previous = snapshotState(chosen);
    chosen.click();
    record(chosen, 'radio', labelOf(chosen), chosen.value, previous);
  }

  return report;
};

export const unmarkFilled = (records: readonly FilledRecord[]): void => {
  for (const { element } of records) element.removeAttribute(TEST_MARK_ATTRIBUTE);
};

export const clearFilled = (records: readonly FilledRecord[]): number => {
  let restored = 0;
  for (const { element, kind, previous } of records) {
    if (!element.isConnected) continue;
    element.removeAttribute(TEST_MARK_ATTRIBUTE);
    if (element instanceof HTMLSelectElement) {
      element.selectedIndex = previous.selectedIndex;
      dispatchValueEvents(element, element.value);
    } else if (kind === 'checkbox' && element instanceof HTMLInputElement) {
      if (element.checked !== previous.checked) element.click();
    } else if (kind === 'radio' && element instanceof HTMLInputElement) {
      element.checked = previous.checked;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      setControlValue(element, previous.value);
    }
    restored += 1;
  }
  return restored;
};
