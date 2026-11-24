import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy, collectInlineHashes } from './contentSecurityPolicy.mjs';

const sha = (text) => `'sha256-${createHash('sha256').update(text).digest('base64')}'`;

describe('collectInlineHashes', () => {
  it('hashes inline scripts and styles but not external or data scripts', () => {
    const html =
      '<script>run()</script><script src="/a.js"></script><script type="application/ld+json">{}</script><style>a{}</style>';
    const found = collectInlineHashes(html);
    expect([...found.scripts]).toEqual([sha('run()')]);
    expect([...found.styles]).toEqual([sha('a{}')]);
  });

  it('hashes style attributes after decoding entities', () => {
    const found = collectInlineHashes(
      '<i style="font-family:&quot;A&quot;"></i><b style="--i:1"></b>',
    );
    expect([...found.styleAttributes]).toEqual([sha('font-family:"A"'), sha('--i:1')]);
  });
});

describe('buildContentSecurityPolicy', () => {
  it('lists every hash once and keeps the strict base directives', () => {
    const policy = buildContentSecurityPolicy([
      '<script>x()</script>',
      '<script>x()</script><style>a{}</style>',
    ]);
    expect(policy.split(sha('x()'))).toHaveLength(2);
    expect(policy).toContain(
      `script-src 'self' ${sha('x()')} https://www.googletagmanager.com https://connect.facebook.net`,
    );
    expect(policy).toContain(
      "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com",
    );
    expect(policy).toContain(`style-src 'self' ${sha('a{}')}`);
    expect(policy).not.toContain('unsafe-inline');
    expect(policy).toContain(
      "frame-ancestors 'self' https://fontedev.com https://*.fontedev.com; base-uri 'none'; form-action 'none'; object-src 'none'",
    );
  });

  it('adds unsafe-hashes only when style attributes exist', () => {
    expect(buildContentSecurityPolicy(['<p style="--i:1"></p>'])).toContain("'unsafe-hashes'");
    expect(buildContentSecurityPolicy(['<p></p>'])).not.toContain("'unsafe-hashes'");
  });
});
