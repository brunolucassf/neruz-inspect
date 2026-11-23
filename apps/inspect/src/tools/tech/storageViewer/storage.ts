export type StorageEntry = { name: string; value: string };

export const STORAGE_AREAS = ['cookies', 'local', 'session'] as const;

export type StorageArea = (typeof STORAGE_AREAS)[number];

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const parseCookieString = (raw: string): StorageEntry[] => {
  const entries: StorageEntry[] = [];
  for (const part of raw.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) entries.push({ name: '', value: safeDecode(trimmed) });
    else {
      entries.push({
        name: trimmed.slice(0, separator),
        value: safeDecode(trimmed.slice(separator + 1)),
      });
    }
  }
  return entries;
};

export const formatJsonValue = (value: string): string | null => {
  const trimmed = value.trim();
  const first = trimmed[0];
  if (first !== '{' && first !== '[') return null;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return typeof parsed === 'object' && parsed !== null ? JSON.stringify(parsed, null, 2) : null;
  } catch {
    return null;
  }
};

export const filterEntries = (entries: readonly StorageEntry[], query: string): StorageEntry[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...entries];
  return entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(needle) || entry.value.toLowerCase().includes(needle),
  );
};

export const byteLength = (value: string): number => new TextEncoder().encode(value).length;

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const EXPIRED = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0';

const pathCandidates = (pathname: string): string[] => {
  const segments = pathname.split('/').filter(Boolean);
  const paths = ['/'];
  let current = '';
  for (const segment of segments) {
    current += `/${segment}`;
    paths.push(current, `${current}/`);
  }
  return paths;
};

const domainCandidates = (hostname: string): (string | null)[] => {
  const isAddress = /^[\d.]+$/.test(hostname) || hostname.includes(':');
  const labels = hostname.split('.');
  if (isAddress || labels.length < 2) return [null];
  const domains: (string | null)[] = [null, hostname, `.${hostname}`];
  for (let start = 1; start < labels.length - 1; start += 1) {
    domains.push(`.${labels.slice(start).join('.')}`);
  }
  return domains;
};

export const cookieDeletionStrings = (
  name: string,
  hostname: string,
  pathname: string,
): string[] => {
  const strings: string[] = [];
  for (const path of pathCandidates(pathname)) {
    for (const domain of domainCandidates(hostname)) {
      strings.push(`${name}=; ${EXPIRED}; path=${path}${domain ? `; domain=${domain}` : ''}`);
    }
  }
  return strings;
};
