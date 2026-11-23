const PRIVATE_IPV4_PATTERNS: readonly RegExp[] = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

const LOCAL_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.lan', '.home.arpa'];

const stripBrackets = (host: string): string => host.replace(/^\[|\]$/g, '').toLowerCase();

export const isPrivateHost = (hostname: string): boolean => {
  const host = stripBrackets(hostname);
  if (host === 'localhost' || LOCAL_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return true;
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(host));
  }
  if (host.includes(':')) {
    return (
      host === '::' ||
      host === '::1' ||
      host.startsWith('fc') ||
      host.startsWith('fd') ||
      host.startsWith('fe80') ||
      host.startsWith('::ffff:')
    );
  }
  return !host.includes('.');
};

const toOrigin = (value: string | undefined): string | null => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

export const isFetchAllowed = (target: string, tabUrl: string | undefined): boolean => {
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (url.username || url.password) return false;
  if (!isPrivateHost(url.hostname)) return true;
  return url.origin === toOrigin(tabUrl);
};
