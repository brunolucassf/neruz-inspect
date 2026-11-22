export type FontCategory = 'sans' | 'serif' | 'mono' | 'display' | 'script';

export type CuratedFont = { name: string; category: FontCategory };

export const CURATED_FONTS: readonly CuratedFont[] = [
  { name: 'Inter', category: 'sans' },
  { name: 'Roboto', category: 'sans' },
  { name: 'Open Sans', category: 'sans' },
  { name: 'Lato', category: 'sans' },
  { name: 'Montserrat', category: 'sans' },
  { name: 'Poppins', category: 'sans' },
  { name: 'Nunito', category: 'sans' },
  { name: 'Raleway', category: 'sans' },
  { name: 'Work Sans', category: 'sans' },
  { name: 'DM Sans', category: 'sans' },
  { name: 'Manrope', category: 'sans' },
  { name: 'Source Sans 3', category: 'sans' },
  { name: 'Noto Sans', category: 'sans' },
  { name: 'Rubik', category: 'sans' },
  { name: 'Mulish', category: 'sans' },
  { name: 'Outfit', category: 'sans' },
  { name: 'Plus Jakarta Sans', category: 'sans' },
  { name: 'Sora', category: 'sans' },
  { name: 'Space Grotesk', category: 'sans' },
  { name: 'IBM Plex Sans', category: 'sans' },
  { name: 'Barlow', category: 'sans' },
  { name: 'Figtree', category: 'sans' },
  { name: 'Playfair Display', category: 'serif' },
  { name: 'Merriweather', category: 'serif' },
  { name: 'Lora', category: 'serif' },
  { name: 'PT Serif', category: 'serif' },
  { name: 'Source Serif 4', category: 'serif' },
  { name: 'EB Garamond', category: 'serif' },
  { name: 'Cormorant Garamond', category: 'serif' },
  { name: 'Libre Baskerville', category: 'serif' },
  { name: 'DM Serif Display', category: 'serif' },
  { name: 'Crimson Text', category: 'serif' },
  { name: 'JetBrains Mono', category: 'mono' },
  { name: 'Fira Code', category: 'mono' },
  { name: 'Roboto Mono', category: 'mono' },
  { name: 'Source Code Pro', category: 'mono' },
  { name: 'IBM Plex Mono', category: 'mono' },
  { name: 'Space Mono', category: 'mono' },
  { name: 'Bebas Neue', category: 'display' },
  { name: 'Anton', category: 'display' },
  { name: 'Caveat', category: 'script' },
  { name: 'Pacifico', category: 'script' },
];

export type SwapScope = 'all' | 'headings' | 'text';

export const SWAP_SCOPES: readonly SwapScope[] = ['all', 'headings', 'text'];

const GENERIC_BY_CATEGORY: Readonly<Record<FontCategory, string>> = {
  sans: 'sans-serif',
  serif: 'serif',
  mono: 'monospace',
  display: 'sans-serif',
  script: 'cursive',
};

export const FAMILY_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9 ]{1,58}$/;

export const normalizeFamilyName = (input: string): string => input.trim().replace(/\s+/g, ' ');

export const isValidFamilyName = (input: string): boolean =>
  FAMILY_NAME_PATTERN.test(normalizeFamilyName(input));

export const getFallbackGeneric = (family: string): string => {
  const curated = CURATED_FONTS.find((font) => font.name.toLowerCase() === family.toLowerCase());
  return GENERIC_BY_CATEGORY[curated?.category ?? 'sans'];
};

const encodeFamily = (family: string): string => encodeURIComponent(family).replace(/%20/g, '+');

export const buildGoogleFontsUrl = (family: string, variant: 'weights' | 'plain'): string =>
  variant === 'weights'
    ? `https://fonts.googleapis.com/css?family=${encodeFamily(family)}:300,400,500,600,700,800&display=swap`
    : `https://fonts.googleapis.com/css2?family=${encodeFamily(family)}&display=swap`;

const ICON_EXCLUSION =
  ':not([class*="icon" i], [class*="fa-" i], [class*="material" i], [class*="glyph" i], i)';

const SCOPE_SELECTORS: Readonly<Record<SwapScope, readonly string[]>> = {
  all: [
    'html',
    'body',
    `body *:not(svg, svg *, code, kbd, samp, pre, neruz-inspect)${ICON_EXCLUSION}`,
  ],
  headings: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tag) => `${tag}${ICON_EXCLUSION}`),
  text: [
    'p',
    'li',
    'a',
    'label',
    'button',
    'input',
    'textarea',
    'select',
    'td',
    'th',
    'dt',
    'dd',
    'blockquote',
    'figcaption',
    'small',
    'strong',
    'em',
    'span',
  ].map((tag) => `${tag}${ICON_EXCLUSION}`),
};

export const buildCssFontFamily = (family: string, fallback: string): string =>
  `"${family}", ${fallback}`;

export const buildSwapCss = (family: string, scope: SwapScope, fallback: string): string =>
  `${SCOPE_SELECTORS[scope].join(',\n')} {\n  font-family: ${buildCssFontFamily(family, fallback)} !important;\n}`;

export type SwapOutcome = 'applied' | 'blocked' | 'failed';

export type FontSwapHandle = { result: Promise<SwapOutcome>; remove: () => void };

const LOAD_TIMEOUT_MS = 10_000;
const FONT_READY_TIMEOUT_MS = 4000;

const isGoogleFontsViolation = (event: SecurityPolicyViolationEvent): boolean =>
  /fonts\.(?:googleapis|gstatic)\.com/i.test(event.blockedURI);

export const applyFontSwap = (
  family: string,
  scope: SwapScope,
  fallback: string,
): FontSwapHandle => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  const style = document.createElement('style');
  style.textContent = buildSwapCss(family, scope, fallback);
  const parent = document.head ?? document.documentElement;
  let settled = false;
  let retried = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let resolveResult: (outcome: SwapOutcome) => void = () => undefined;
  const result = new Promise<SwapOutcome>((resolve) => {
    resolveResult = resolve;
  });

  const handleViolation = (event: SecurityPolicyViolationEvent): void => {
    if (isGoogleFontsViolation(event)) settle('blocked');
  };

  const detach = (): void => {
    clearTimeout(timer);
    document.removeEventListener('securitypolicyviolation', handleViolation);
    link.remove();
    style.remove();
  };

  const settle = (outcome: SwapOutcome): void => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    if (outcome !== 'applied') detach();
    resolveResult(outcome);
  };

  link.onerror = () => {
    setTimeout(() => {
      if (settled) return;
      if (retried) {
        settle('failed');
        return;
      }
      retried = true;
      link.href = buildGoogleFontsUrl(family, 'plain');
    }, 0);
  };

  link.onload = () => {
    if (settled) return;
    parent.append(style);
    const fontReady = document.fonts
      ? Promise.race([
          document.fonts.load(`16px "${family}"`),
          new Promise((done) => setTimeout(done, FONT_READY_TIMEOUT_MS)),
        ])
      : Promise.resolve();
    fontReady.then(
      () => settle('applied'),
      () => settle('failed'),
    );
  };

  document.addEventListener('securitypolicyviolation', handleViolation);
  timer = setTimeout(() => settle('failed'), LOAD_TIMEOUT_MS);
  link.href = buildGoogleFontsUrl(family, 'weights');
  parent.append(link);

  return {
    result,
    remove: () => {
      settled = true;
      detach();
    },
  };
};
