import { describe, expect, it } from 'vitest';
import {
  buildCssFontFamily,
  buildGoogleFontsUrl,
  buildSwapCss,
  getFallbackGeneric,
  isValidFamilyName,
} from './fontSwap/fontSwap';
import {
  classifyFontSource,
  inferRenderedFamily,
  parseFontFamilyList,
  parseGoogleFontsHref,
} from './shared/fonts';
import { buildSizeTokens, detectScale, nameSizes } from './typeScale/typeScale';

const probe = (webfonts: string[], installed: string[]) => ({
  isWebFontLoaded: (family: string) => webfonts.includes(family.toLowerCase()),
  isInstalled: (family: string) => installed.includes(family.toLowerCase()),
});

describe('parseFontFamilyList', () => {
  it('splits and unquotes families', () => {
    expect(parseFontFamilyList('"Inter", "Segoe UI", system-ui, sans-serif')).toEqual([
      'Inter',
      'Segoe UI',
      'system-ui',
      'sans-serif',
    ]);
  });

  it('keeps commas inside quotes', () => {
    expect(parseFontFamilyList("'Weird, Name', serif")).toEqual(['Weird, Name', 'serif']);
  });
});

describe('inferRenderedFamily', () => {
  it('picks the first loaded web font', () => {
    const result = inferRenderedFamily(['Inter', 'Arial', 'sans-serif'], probe(['inter'], []));
    expect(result).toMatchObject({ family: 'Inter', kind: 'webfont', fellBack: false });
  });

  it('skips a web font that did not load and uses an installed one', () => {
    const result = inferRenderedFamily(['Inter', 'Arial', 'sans-serif'], probe([], ['arial']));
    expect(result).toMatchObject({
      family: 'Arial',
      kind: 'system',
      fellBack: true,
      declared: 'Inter',
    });
  });

  it('ends at the generic family', () => {
    const result = inferRenderedFamily(['Missing', 'sans-serif'], probe([], []));
    expect(result).toMatchObject({ family: 'sans-serif', kind: 'generic', fellBack: true });
  });

  it('reports unknown when nothing resolves', () => {
    expect(inferRenderedFamily(['Missing'], probe([], [])).kind).toBe('unknown');
  });
});

describe('font sources', () => {
  const hints = (overrides: Partial<Parameters<typeof classifyFontSource>[1]> = {}) => ({
    googleFamilies: new Set<string>(),
    faceUrls: [] as string[],
    hasAdobeLink: false,
    ...overrides,
  });

  it('recognizes Google Fonts by link family or gstatic url', () => {
    expect(
      classifyFontSource(
        { family: 'Inter', kind: 'webfont' },
        hints({ googleFamilies: new Set(['inter']) }),
      ),
    ).toBe('google');
    expect(
      classifyFontSource(
        { family: 'X', kind: 'webfont' },
        hints({ faceUrls: ['https://fonts.gstatic.com/s/x.woff2'] }),
      ),
    ).toBe('google');
  });

  it('recognizes Adobe and self-hosted fonts', () => {
    expect(
      classifyFontSource({ family: 'Proxima', kind: 'webfont' }, hints({ hasAdobeLink: true })),
    ).toBe('adobe');
    expect(
      classifyFontSource(
        { family: 'Brand', kind: 'webfont' },
        hints({ faceUrls: ['/fonts/brand.woff2'], hasAdobeLink: true }),
      ),
    ).toBe('selfHosted');
  });

  it('maps system and generic kinds', () => {
    expect(classifyFontSource({ family: 'Arial', kind: 'system' }, hints())).toBe('system');
    expect(classifyFontSource({ family: 'serif', kind: 'generic' }, hints())).toBe('generic');
  });

  it('reads family names from a Google Fonts url', () => {
    expect(
      parseGoogleFontsHref(
        'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&family=Lora',
      ),
    ).toEqual(['Open Sans', 'Lora']);
    expect(parseGoogleFontsHref('https://fonts.googleapis.com/css?family=Roboto|Lato:400')).toEqual(
      ['Roboto', 'Lato'],
    );
  });
});

describe('font swap', () => {
  it('validates family names', () => {
    expect(isValidFamilyName('Space Grotesk')).toBe(true);
    expect(isValidFamilyName('a;} body{display:none')).toBe(false);
    expect(isValidFamilyName('')).toBe(false);
  });

  it('builds the Google css url and css rule', () => {
    expect(buildGoogleFontsUrl('Open Sans', 'plain')).toBe(
      'https://fonts.googleapis.com/css2?family=Open+Sans&display=swap',
    );
    expect(buildSwapCss('Lora', 'headings', 'serif')).toContain('h1');
    expect(buildSwapCss('Lora', 'headings', 'serif')).toContain('"Lora", serif !important');
    expect(buildCssFontFamily('Lora', 'serif')).toBe('"Lora", serif');
  });

  it('picks the right generic fallback', () => {
    expect(getFallbackGeneric('Lora')).toBe('serif');
    expect(getFallbackGeneric('JetBrains Mono')).toBe('monospace');
    expect(getFallbackGeneric('Unknown Font')).toBe('sans-serif');
  });
});

describe('detectScale', () => {
  const buildScale = (ratio: number, steps: number[]) =>
    steps.map((step) => ({
      size: Math.round(16 * ratio ** step * 100) / 100,
      count: step === 0 ? 50 : 3,
    }));

  it('detects a major third scale', () => {
    const result = detectScale(buildScale(1.25, [-2, -1, 0, 1, 2, 3, 4]));
    expect(result?.ratio).toBe(1.25);
    expect(result?.fit).toBeGreaterThan(0.9);
    expect(result?.base).toBe(16);
  });

  it('detects a perfect fifth scale', () => {
    const result = detectScale(buildScale(1.5, [-1, 0, 1, 2, 3]));
    expect(result?.ratio).toBe(1.5);
  });

  it('reports a low fit for arbitrary sizes', () => {
    const result = detectScale(
      [11, 13, 14, 15, 17, 19, 22, 27, 31].map((size) => ({ size, count: size === 15 ? 20 : 2 })),
    );
    expect(result?.fit ?? 1).toBeLessThan(0.5);
  });

  it('needs at least three distinct sizes', () => {
    expect(
      detectScale([
        { size: 16, count: 1 },
        { size: 24, count: 1 },
      ]),
    ).toBeNull();
  });
});

describe('size tokens', () => {
  it('names sizes around the 16px base', () => {
    expect(nameSizes([12, 14, 16, 20, 24, 32])).toEqual(['xs', 'sm', 'base', 'lg', 'xl', '2xl']);
  });

  it('exports css and tailwind tokens in rem', () => {
    expect(buildSizeTokens([14, 16, 24], 'css', 'rem')).toBe(
      ':root {\n  --font-size-sm: 0.875rem;\n  --font-size-base: 1rem;\n  --font-size-lg: 1.5rem;\n}',
    );
    expect(buildSizeTokens([16, 24], 'tailwind', 'px')).toBe(
      "fontSize: {\n  'base': '16px',\n  'lg': '24px',\n},",
    );
  });
});
