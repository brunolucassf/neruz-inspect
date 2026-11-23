export type JsonKind = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export type PathSegment = string | number;

export const ROOT_PATH = '$';

const MAX_VISITED_NODES = 200_000;
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

export const kindOf = (value: unknown): JsonKind => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  return 'boolean';
};

export const isContainer = (value: unknown): value is object | unknown[] =>
  typeof value === 'object' && value !== null;

export const childEntries = (value: unknown): [PathSegment, unknown][] => {
  if (Array.isArray(value))
    return value.map((item, index): [PathSegment, unknown] => [index, item]);
  if (isContainer(value)) return Object.entries(value);
  return [];
};

export const appendPath = (path: string, segment: PathSegment): string => {
  if (typeof segment === 'number') return `${path}[${segment}]`;
  return IDENTIFIER.test(segment) ? `${path}.${segment}` : `${path}[${JSON.stringify(segment)}]`;
};

export type ParseResult = { ok: true; value: unknown } | { ok: false; message: string };

export const parseJson = (text: string): ParseResult => {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
};

export const formatJson = (value: unknown, indent = 2): string =>
  JSON.stringify(value, null, indent) ?? '';

export const minifyJson = (value: unknown): string => JSON.stringify(value) ?? '';

export const summaryOf = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.length}]`;
  if (isContainer(value)) return `{${Object.keys(value).length}}`;
  return '';
};

export type SearchResult = { matches: Set<string>; open: Set<string>; truncated: boolean };

export const findMatches = (root: unknown, query: string, maxMatches = 300): SearchResult => {
  const needle = query.trim().toLowerCase();
  const result: SearchResult = { matches: new Set(), open: new Set(), truncated: false };
  if (!needle) return result;
  let visited = 0;

  const walk = (value: unknown, path: string, ancestors: readonly string[]): void => {
    if (result.truncated) return;
    visited += 1;
    if (visited > MAX_VISITED_NODES) {
      result.truncated = true;
      return;
    }
    for (const [segment, child] of childEntries(value)) {
      const childPath = appendPath(path, segment);
      const keyMatches = typeof segment === 'string' && segment.toLowerCase().includes(needle);
      const valueMatches = !isContainer(child) && String(child).toLowerCase().includes(needle);
      if (keyMatches || valueMatches) {
        if (result.matches.size >= maxMatches) {
          result.truncated = true;
          return;
        }
        result.matches.add(childPath);
        for (const ancestor of [...ancestors, path]) result.open.add(ancestor);
      }
      if (isContainer(child)) walk(child, childPath, [...ancestors, path]);
    }
  };

  walk(root, ROOT_PATH, []);
  return result;
};

export const collectContainerPaths = (
  root: unknown,
  maxDepth: number,
  maxNodes = 2000,
): Set<string> => {
  const paths = new Set<string>();
  const walk = (value: unknown, path: string, depth: number): void => {
    if (!isContainer(value) || paths.size >= maxNodes) return;
    paths.add(path);
    if (depth >= maxDepth) return;
    for (const [segment, child] of childEntries(value))
      walk(child, appendPath(path, segment), depth + 1);
  };
  walk(root, ROOT_PATH, 0);
  return paths;
};

export const pageJsonCandidate = (
  contentType: string,
  bodyText: string,
  elementCount: number,
): string | null => {
  const text = bodyText.trim();
  if (!text) return null;
  if (/json/i.test(contentType)) return text;
  const first = text[0];
  const last = text[text.length - 1];
  const looksLikeJson = (first === '{' && last === '}') || (first === '[' && last === ']');
  return looksLikeJson && elementCount <= 3 ? text : null;
};
