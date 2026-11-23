import { describe, expect, it } from 'vitest';
import { isFetchAllowed, isPrivateHost } from './networkGuard';

describe('isPrivateHost', () => {
  it.each([
    'localhost',
    'app.localhost',
    '127.0.0.1',
    '10.0.0.5',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '[::1]',
    'fd00::1',
    'fe80::1',
    'router',
    'nas.local',
  ])('flags %s as private', (host) => {
    expect(isPrivateHost(host)).toBe(true);
  });

  it.each(['example.com', '8.8.8.8', '172.32.0.1', '100.128.0.1', '2606:4700::1111'])(
    'treats %s as public',
    (host) => {
      expect(isPrivateHost(host)).toBe(false);
    },
  );
});

describe('isFetchAllowed', () => {
  it('allows public http and https', () => {
    expect(isFetchAllowed('https://example.com/robots.txt', 'https://site.com/')).toBe(true);
  });

  it('blocks private hosts from another origin', () => {
    expect(isFetchAllowed('http://192.168.0.1/admin', 'https://site.com/')).toBe(false);
    expect(isFetchAllowed('http://169.254.169.254/latest', 'https://site.com/')).toBe(false);
  });

  it('allows the private origin the tab is already on', () => {
    expect(isFetchAllowed('http://localhost:4321/x', 'http://localhost:4321/')).toBe(true);
    expect(isFetchAllowed('http://localhost:5173/x', 'http://localhost:4321/')).toBe(false);
  });

  it('rejects other schemes and credentials', () => {
    expect(isFetchAllowed('file:///etc/passwd', undefined)).toBe(false);
    expect(isFetchAllowed('https://user:pass@example.com/', undefined)).toBe(false);
  });
});
