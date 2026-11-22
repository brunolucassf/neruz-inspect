import { describe, expect, it } from 'vitest';
import {
  colorToInputValue,
  formatStyleChangesCss,
  formatTextChanges,
  hasTextChanged,
  parsePxInput,
  readUniformPx,
} from './editLive';

describe('formatStyleChangesCss', () => {
  it('writes one block per selector and skips empty ones', () => {
    expect(
      formatStyleChangesCss([
        { selector: 'h1.title', declarations: { color: '#fff', 'font-size': '32px' } },
        { selector: 'p', declarations: {} },
      ]),
    ).toBe('h1.title {\n  color: #fff;\n  font-size: 32px;\n}');
  });
});

describe('formatTextChanges', () => {
  it('lists before and after per selector', () => {
    expect(formatTextChanges([{ selector: 'h1', before: ' Old ', after: 'New' }])).toBe(
      'h1\n- Old\n+ New',
    );
  });
});

describe('inputs', () => {
  it('converts computed colors for the color input', () => {
    expect(colorToInputValue('rgb(37, 99, 235)')).toBe('#2563eb');
    expect(colorToInputValue('rgba(0, 0, 0, 0)')).toBe('#000000');
    expect(colorToInputValue('garbage')).toBe('#000000');
  });

  it('parses px fields and uniform edges', () => {
    expect(parsePxInput('12')).toBe(12);
    expect(parsePxInput('')).toBeNull();
    expect(parsePxInput('-3')).toBeNull();
    expect(readUniformPx(['8px', '8px', '8px', '8px'])).toBe(8);
    expect(readUniformPx(['8px', '4px'])).toBeNull();
  });

  it('ignores whitespace-only text differences', () => {
    expect(hasTextChanged('a  b\n', 'a b')).toBe(false);
    expect(hasTextChanged('a', 'b')).toBe(true);
  });
});
