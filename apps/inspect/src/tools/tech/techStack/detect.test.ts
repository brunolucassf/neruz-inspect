import { describe, expect, it } from 'vitest';
import {
  buildProbeArgs,
  confidenceFromScore,
  detectTechnologies,
  groupByCategory,
  parseVersion,
  pickVersion,
  selectorKey,
} from './detect';
import { SIGNATURES } from './signatures';
import { TECH_CATEGORIES, type TechSnapshot } from './types';

const emptySnapshot: TechSnapshot = {
  globals: {},
  selectors: {},
  meta: [],
  scripts: [],
  links: [],
  images: [],
  classTokens: [],
  domKeys: [],
  cssVars: [],
  serviceWorker: false,
};

const snapshotWith = (patch: Partial<TechSnapshot>): TechSnapshot => ({
  ...emptySnapshot,
  ...patch,
});

const find = (list: ReturnType<typeof detectTechnologies>, id: string) =>
  list.find((item) => item.id === id);

describe('signature database', () => {
  it('has unique ids and a valid category on every entry', () => {
    const ids = SIGNATURES.map((signature) => signature.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const signature of SIGNATURES) {
      expect(TECH_CATEGORIES).toContain(signature.category);
      expect(signature.website).toMatch(/^https:\/\//);
      expect(signature.signals.length).toBeGreaterThan(0);
    }
  });

  it('covers at least 120 technologies', () => {
    expect(SIGNATURES.length).toBeGreaterThanOrEqual(120);
  });

  it('compiles every pattern and resolves every implied id', () => {
    const ids = new Set(SIGNATURES.map((signature) => signature.id));
    for (const signature of SIGNATURES) {
      for (const impliedId of signature.implies ?? []) expect(ids.has(impliedId)).toBe(true);
      for (const signal of signature.signals) {
        if ('pattern' in signal && signal.pattern)
          expect(() => new RegExp(signal.pattern ?? '')).not.toThrow();
      }
    }
  });
});

describe('parseVersion', () => {
  it('extracts dotted versions', () => {
    expect(parseVersion('18.2.0')).toBe('18.2.0');
    expect(parseVersion('v6.4')).toBe('6.4');
    expect(parseVersion('three.js r160')).toBe('160');
    expect(parseVersion('3.6.0-beta.1')).toBe('3.6.0-beta.1');
  });

  it('rejects empty and absurd values', () => {
    expect(parseVersion(undefined)).toBeUndefined();
    expect(parseVersion('')).toBeUndefined();
    expect(parseVersion('no digits')).toBeUndefined();
    expect(parseVersion('1'.repeat(60))).toBeUndefined();
  });

  it('prefers the most specific version', () => {
    expect(pickVersion([undefined, '6.4', '6.4.2'])).toBe('6.4.2');
    expect(pickVersion([])).toBeUndefined();
  });
});

describe('confidenceFromScore', () => {
  it('maps score ranges', () => {
    expect(confidenceFromScore(95)).toBe('high');
    expect(confidenceFromScore(60)).toBe('medium');
    expect(confidenceFromScore(30)).toBe('low');
  });
});

describe('detectTechnologies', () => {
  it('detects WordPress with version, theme and plugins from paths', () => {
    const result = detectTechnologies(
      snapshotWith({
        meta: [{ name: 'generator', content: 'WordPress 6.4.2' }],
        links: ['https://site.com/wp-content/themes/astra/style.css?ver=4'],
        scripts: [
          'https://site.com/wp-content/plugins/elementor/assets/js/frontend.min.js',
          'https://site.com/wp-content/plugins/woocommerce/assets/js/a.js',
          'https://site.com/wp-content/plugins/elementor/assets/js/other.js',
        ],
      }),
    );
    const wordpress = find(result, 'wordpress');
    expect(wordpress?.version).toBe('6.4.2');
    expect(wordpress?.confidence).toBe('high');
    expect(wordpress?.details).toEqual([
      { label: 'theme', value: 'astra' },
      { label: 'plugin', value: 'elementor' },
      { label: 'plugin', value: 'woocommerce' },
    ]);
    expect(find(result, 'elementor')).toBeDefined();
    expect(find(result, 'woocommerce')).toBeDefined();
  });

  it('reads Next.js version from the global and implies React', () => {
    const result = detectTechnologies(
      snapshotWith({
        globals: { __NEXT_DATA__: true, 'next.version': '14.0.4' },
        scripts: ['https://x.com/_next/static/chunks/main.js'],
      }),
    );
    expect(find(result, 'nextjs')?.version).toBe('14.0.4');
    const react = find(result, 'react');
    expect(react?.implied).toBe(true);
  });

  it('does not mark React as implied when it is detected directly', () => {
    const result = detectTechnologies(
      snapshotWith({
        globals: { __NEXT_DATA__: true, React: true, 'React.version': '18.2.0' },
        domKeys: ['__reactFiber$'],
      }),
    );
    const react = find(result, 'react');
    expect(react?.implied).toBe(false);
    expect(react?.version).toBe('18.2.0');
  });

  it('reads server versions from headers regardless of header case', () => {
    const result = detectTechnologies(emptySnapshot, {
      Server: 'nginx/1.24.0',
      'X-Powered-By': 'PHP/8.2.12',
      'CF-RAY': 'abc',
    });
    expect(find(result, 'nginx')?.version).toBe('1.24.0');
    expect(find(result, 'php')?.version).toBe('8.2.12');
    expect(find(result, 'cloudflare')?.confidence).toBe('high');
  });

  it('detects Hostinger and LiteSpeed from headers', () => {
    const result = detectTechnologies(emptySnapshot, {
      platform: 'hostinger',
      server: 'LiteSpeed',
    });
    expect(find(result, 'hostinger')).toBeDefined();
    expect(find(result, 'litespeed')).toBeDefined();
  });

  it('detects Tailwind only when enough utility classes appear', () => {
    const few = detectTechnologies(snapshotWith({ classTokens: ['flex', 'px-4', 'container'] }));
    expect(find(few, 'tailwind')).toBeUndefined();
    const many = detectTechnologies(
      snapshotWith({
        classTokens: ['flex', 'px-4', 'py-2', 'md:flex', 'text-sm', 'rounded-lg', 'bg-blue-500'],
      }),
    );
    expect(find(many, 'tailwind')?.confidence).toBe('medium');
  });

  it('reads versions from script URLs and selector attributes', () => {
    const result = detectTechnologies(
      snapshotWith({
        scripts: ['https://code.jquery.com/jquery-3.7.1.min.js'],
        selectors: { [selectorKey('[ng-version]', 'ng-version')]: '17.0.8' },
      }),
    );
    expect(find(result, 'jquery')?.version).toBe('3.7.1');
    expect(find(result, 'angular')?.version).toBe('17.0.8');
  });

  it('does not confuse jquery plugins with jQuery', () => {
    const result = detectTechnologies(
      snapshotWith({ scripts: ['https://x.com/jquery-migrate-3.4.1.min.js'] }),
    );
    expect(find(result, 'jquery')).toBeUndefined();
  });

  it('formats Three.js revisions', () => {
    const result = detectTechnologies(
      snapshotWith({
        selectors: {
          [selectorKey('canvas[data-engine*="three.js"]', 'data-engine')]: 'three.js r160',
        },
      }),
    );
    expect(find(result, 'three')?.version).toBe('r160');
  });

  it('reads the Shopify theme from a global', () => {
    const result = detectTechnologies(
      snapshotWith({
        globals: { Shopify: true, 'Shopify.theme.name': 'Dawn' },
        scripts: ['https://cdn.shopify.com/s/files/1/a.js'],
      }),
    );
    expect(find(result, 'shopify')?.details).toEqual([{ label: 'theme', value: 'Dawn' }]);
  });

  it('detects Brazilian store platforms by asset hosts', () => {
    const result = detectTechnologies(
      snapshotWith({
        images: [
          'https://loja.vtexassets.com/arquivos/ids/1.jpg',
          'https://images.tcdn.com.br/img/a.png',
          'https://cdn.awsli.com.br/a.png',
          'https://dcdn-us.mitiendanube.com/a.png',
        ],
      }),
    );
    for (const id of ['vtex', 'tray', 'lojaintegrada', 'nuvemshop']) {
      expect(find(result, id)).toBeDefined();
    }
  });

  it('detects PWA from the service worker', () => {
    const result = detectTechnologies(snapshotWith({ serviceWorker: true }));
    expect(find(result, 'pwa')?.confidence).toBe('medium');
  });

  it('returns nothing for a blank page', () => {
    expect(detectTechnologies(emptySnapshot)).toEqual([]);
  });
});

describe('groupByCategory', () => {
  it('orders groups by category and skips empty ones', () => {
    const list = detectTechnologies(
      snapshotWith({ globals: { gsap: true, 'gsap.version': '3.12.5', __NUXT__: true } }),
    );
    const groups = groupByCategory(list);
    expect(groups.map((group) => group.category)).toEqual(['framework', 'library']);
  });
});

describe('buildProbeArgs', () => {
  it('collects version paths and unique selectors', () => {
    const args = buildProbeArgs();
    expect(args.globals).toContain('React.version');
    expect(args.globals).toContain('Shopify.theme.name');
    expect(args.selectors).toContainEqual({ css: '[ng-version]', attr: 'ng-version' });
    expect(new Set(args.globals).size).toBe(args.globals.length);
    expect(args.domKeys).toContain('__reactFiber$');
  });
});
