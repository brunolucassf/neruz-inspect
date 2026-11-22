const STORE_HOSTS: readonly string[] = [
  'chromewebstore.google.com',
  'microsoftedge.microsoft.com',
  'addons.mozilla.org',
];

export const isRestrictedUrl = (url: string | undefined): boolean => {
  if (!url) return true;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return true;
  }
  if (parsed.protocol === 'file:') return false;
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;
  if (STORE_HOSTS.includes(parsed.hostname)) return true;
  return parsed.hostname === 'chrome.google.com' && parsed.pathname.startsWith('/webstore');
};
