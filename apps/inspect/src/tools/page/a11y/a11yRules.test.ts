import { describe, expect, it } from 'vitest';
import {
  evaluateContrast,
  isFocusRuleSuspicious,
  isLargeText,
  isValidRole,
  validateAria,
} from './a11yRules';

const base = { role: null, focusable: false, idExists: (id: string) => id === 'ok' };

describe('validateAria', () => {
  it('accepts valid roles and attributes', () => {
    expect(
      validateAria({
        ...base,
        role: 'button',
        attributes: [
          { name: 'aria-label', value: 'x' },
          { name: 'aria-labelledby', value: 'ok' },
        ],
      }),
    ).toEqual([]);
  });

  it('flags unknown roles and attributes', () => {
    const kinds = validateAria({
      ...base,
      role: 'buton',
      attributes: [{ name: 'aria-lable', value: 'x' }],
    }).map((issue) => issue.kind);
    expect(kinds).toEqual(['invalidRole', 'invalidAttribute']);
  });

  it('accepts a role fallback list and doc-/graphics- roles', () => {
    expect(isValidRole('doc-chapter')).toBe(true);
    expect(validateAria({ ...base, role: 'foo button', attributes: [] })).toEqual([]);
  });

  it('flags references to missing ids', () => {
    const [issue] = validateAria({
      ...base,
      attributes: [{ name: 'aria-describedby', value: 'ok gone' }],
    });
    expect(issue).toEqual({ kind: 'missingReference', detail: 'aria-describedby="gone"' });
  });

  it('flags aria-hidden on focusable elements only', () => {
    const attributes = [{ name: 'aria-hidden', value: 'true' }];
    expect(validateAria({ ...base, attributes, focusable: true })[0]?.kind).toBe('hiddenFocusable');
    expect(validateAria({ ...base, attributes })).toEqual([]);
  });
});

describe('isFocusRuleSuspicious', () => {
  const style = {
    outlineStyle: '',
    outlineWidth: '',
    outline: '',
    boxShadow: '',
    border: '',
  };

  it('flags removed outlines without a replacement', () => {
    expect(isFocusRuleSuspicious({ ...style, outline: 'none' })).toBe(true);
    expect(isFocusRuleSuspicious({ ...style, outlineStyle: 'none' })).toBe(true);
    expect(isFocusRuleSuspicious({ ...style, outline: '0' })).toBe(true);
  });

  it('accepts a replacement indicator or an untouched outline', () => {
    expect(isFocusRuleSuspicious({ ...style, outline: 'none', boxShadow: '0 0 0 2px blue' })).toBe(
      false,
    );
    expect(isFocusRuleSuspicious({ ...style, outline: 'none', border: '2px solid blue' })).toBe(
      false,
    );
    expect(isFocusRuleSuspicious({ ...style, outline: '2px solid red' })).toBe(false);
  });
});

describe('contrast', () => {
  it('detects large text', () => {
    expect(isLargeText(24, 400)).toBe(true);
    expect(isLargeText(19, 700)).toBe(true);
    expect(isLargeText(19, 400)).toBe(false);
  });

  it('passes black on white and fails light grey', () => {
    expect(evaluateContrast('rgb(0, 0, 0)', [], 16, 400)?.passes).toBe(true);
    const grey = evaluateContrast('rgb(170, 170, 170)', ['rgb(255, 255, 255)'], 16, 400);
    expect(grey?.passes).toBe(false);
    expect(grey?.required).toBe(4.5);
  });

  it('relaxes the threshold for large text', () => {
    const verdict = evaluateContrast('rgb(130, 130, 130)', [], 28, 400);
    expect(verdict?.required).toBe(3);
    expect(verdict?.passes).toBe(true);
  });

  it('composites translucent layers over the stack below', () => {
    const verdict = evaluateContrast(
      'rgb(255, 255, 255)',
      ['rgba(0, 0, 0, 0.8)', 'rgb(255, 255, 255)'],
      16,
      400,
    );
    expect(verdict?.passes).toBe(true);
  });

  it('gives up on colors it cannot parse', () => {
    expect(evaluateContrast('not-a-color', [], 16, 400)).toBeNull();
  });
});
