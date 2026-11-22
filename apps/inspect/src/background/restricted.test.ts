import { describe, expect, it } from 'vitest';
import { isRestrictedUrl } from './restricted';

describe('isRestrictedUrl', () => {
  it('blocks browser pages, store pages and missing urls', () => {
    expect(isRestrictedUrl(undefined)).toBe(true);
    expect(isRestrictedUrl('chrome://extensions')).toBe(true);
    expect(isRestrictedUrl('about:blank')).toBe(true);
    expect(isRestrictedUrl('chrome-extension://abc/page.html')).toBe(true);
    expect(isRestrictedUrl('https://chromewebstore.google.com/detail/x')).toBe(true);
    expect(isRestrictedUrl('https://chrome.google.com/webstore/detail/x')).toBe(true);
    expect(isRestrictedUrl('https://addons.mozilla.org/pt-BR/firefox/')).toBe(true);
  });

  it('allows regular pages', () => {
    expect(isRestrictedUrl('https://example.com/a')).toBe(false);
    expect(isRestrictedUrl('http://localhost:3000')).toBe(false);
    expect(isRestrictedUrl('https://chrome.google.com/other')).toBe(false);
  });
});
