import { describe, expect, it } from 'vitest';
import {
  byteLength,
  cookieDeletionStrings,
  filterEntries,
  formatBytes,
  formatJsonValue,
  parseCookieString,
} from './storage';

describe('parseCookieString', () => {
  it('splits names and decoded values', () => {
    expect(parseCookieString('a=1; b=hello%20world; c=x=y')).toEqual([
      { name: 'a', value: '1' },
      { name: 'b', value: 'hello world' },
      { name: 'c', value: 'x=y' },
    ]);
  });

  it('handles empty input, nameless cookies and broken encoding', () => {
    expect(parseCookieString('')).toEqual([]);
    expect(parseCookieString('lonely')).toEqual([{ name: '', value: 'lonely' }]);
    expect(parseCookieString('bad=%E0%A4%A')).toEqual([{ name: 'bad', value: '%E0%A4%A' }]);
  });
});

describe('formatJsonValue', () => {
  it('pretty prints objects and arrays only', () => {
    expect(formatJsonValue('{"a":1,"b":[2]}')).toBe('{\n  "a": 1,\n  "b": [\n    2\n  ]\n}');
    expect(formatJsonValue('[1]')).toBe('[\n  1\n]');
    expect(formatJsonValue('42')).toBeNull();
    expect(formatJsonValue('"text"')).toBeNull();
    expect(formatJsonValue('{broken')).toBeNull();
    expect(formatJsonValue('plain text')).toBeNull();
  });
});

describe('filterEntries', () => {
  const entries = [
    { name: 'theme', value: 'dark' },
    { name: 'token', value: 'ABC' },
  ];

  it('matches names and values case-insensitively', () => {
    expect(filterEntries(entries, 'THEM')).toEqual([entries[0]]);
    expect(filterEntries(entries, 'abc')).toEqual([entries[1]]);
    expect(filterEntries(entries, '  ')).toEqual(entries);
    expect(filterEntries(entries, 'zzz')).toEqual([]);
  });
});

describe('sizes', () => {
  it('counts UTF-8 bytes and formats units', () => {
    expect(byteLength('é')).toBe(2);
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});

describe('cookieDeletionStrings', () => {
  it('covers host-only and parent domains across path prefixes', () => {
    const strings = cookieDeletionStrings('sid', 'shop.example.com', '/a/b');
    expect(strings).toContain('sid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/');
    expect(strings.some((value) => value.endsWith('path=/a/b; domain=.example.com'))).toBe(true);
    expect(strings.some((value) => value.endsWith('path=/a; domain=shop.example.com'))).toBe(true);
    expect(strings.every((value) => value.startsWith('sid=;'))).toBe(true);
  });

  it('skips domain variants for localhost and ip addresses', () => {
    for (const host of ['localhost', '127.0.0.1']) {
      const strings = cookieDeletionStrings('sid', host, '/');
      expect(strings).toHaveLength(1);
      expect(strings[0]).not.toContain('domain=');
    }
  });
});
