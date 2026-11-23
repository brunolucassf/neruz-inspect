import { describe, expect, it } from 'vitest';
import {
  appendPath,
  childEntries,
  collectContainerPaths,
  findMatches,
  formatJson,
  kindOf,
  minifyJson,
  pageJsonCandidate,
  parseJson,
  ROOT_PATH,
  summaryOf,
} from './json';

const sample = {
  user: { name: 'Ana', tags: ['a', 'b'], 'e-mail': 'ana@example.com' },
  count: 3,
  list: [{ id: 1 }, { id: 2 }],
};

describe('kindOf and summaryOf', () => {
  it('classifies values', () => {
    expect(kindOf(null)).toBe('null');
    expect(kindOf([])).toBe('array');
    expect(kindOf({})).toBe('object');
    expect(kindOf('x')).toBe('string');
    expect(kindOf(1)).toBe('number');
    expect(kindOf(false)).toBe('boolean');
  });

  it('summarises containers by size', () => {
    expect(summaryOf([1, 2, 3])).toBe('[3]');
    expect(summaryOf({ a: 1 })).toBe('{1}');
    expect(summaryOf('x')).toBe('');
  });
});

describe('appendPath', () => {
  it('builds dot, index and bracket paths', () => {
    expect(appendPath(ROOT_PATH, 'user')).toBe('$.user');
    expect(appendPath('$.list', 0)).toBe('$.list[0]');
    expect(appendPath('$.user', 'e-mail')).toBe('$.user["e-mail"]');
    expect(appendPath(ROOT_PATH, '1abc')).toBe('$["1abc"]');
    expect(appendPath(ROOT_PATH, 'say "hi"')).toBe('$["say \\"hi\\""]');
  });

  it('lists children of arrays and objects', () => {
    expect(childEntries([5, 6])).toEqual([
      [0, 5],
      [1, 6],
    ]);
    expect(childEntries({ a: 1 })).toEqual([['a', 1]]);
    expect(childEntries('text')).toEqual([]);
  });
});

describe('parseJson, formatJson and minifyJson', () => {
  it('parses valid input and reports errors', () => {
    expect(parseJson('{"a":[1,2]}')).toEqual({ ok: true, value: { a: [1, 2] } });
    const failure = parseJson('{oops');
    expect(failure.ok).toBe(false);
    if (!failure.ok) expect(failure.message.length).toBeGreaterThan(0);
  });

  it('round-trips between pretty and minified', () => {
    const pretty = formatJson(sample);
    expect(pretty).toContain('\n  "user": {');
    const reparsed = parseJson(pretty);
    expect(reparsed.ok && minifyJson(reparsed.value)).toBe(minifyJson(sample));
    expect(minifyJson(sample)).not.toContain('\n');
  });
});

describe('findMatches', () => {
  it('matches keys and primitive values and opens their ancestors', () => {
    const result = findMatches(sample, 'ana');
    expect([...result.matches].sort()).toEqual(['$.user.name', '$.user["e-mail"]']);
    expect([...result.open].sort()).toEqual(['$', '$.user']);
  });

  it('finds keys and array items', () => {
    expect([...findMatches(sample, 'id').matches]).toEqual(['$.list[0].id', '$.list[1].id']);
    expect(findMatches(sample, 'zzz').matches.size).toBe(0);
    expect(findMatches(sample, '   ').matches.size).toBe(0);
  });

  it('caps the number of matches', () => {
    const big = Array.from({ length: 50 }, () => 'hit');
    const result = findMatches(big, 'hit', 10);
    expect(result.matches.size).toBe(10);
    expect(result.truncated).toBe(true);
  });
});

describe('collectContainerPaths', () => {
  it('collects containers down to a depth', () => {
    expect([...collectContainerPaths(sample, 1)].sort()).toEqual(['$', '$.list', '$.user']);
    expect(collectContainerPaths(sample, 0).size).toBe(1);
    expect(collectContainerPaths(42, 3).size).toBe(0);
  });
});

describe('pageJsonCandidate', () => {
  it('trusts the content type', () => {
    expect(pageJsonCandidate('application/json', ' {"a":1} ', 50)).toBe('{"a":1}');
  });

  it('accepts a body that is only JSON', () => {
    expect(pageJsonCandidate('text/html', '[1,2]', 2)).toBe('[1,2]');
  });

  it('rejects regular pages and empty bodies', () => {
    expect(pageJsonCandidate('text/html', '{ a page with braces }', 40)).toBeNull();
    expect(pageJsonCandidate('text/html', 'hello', 1)).toBeNull();
    expect(pageJsonCandidate('application/json', '   ', 1)).toBeNull();
  });
});
