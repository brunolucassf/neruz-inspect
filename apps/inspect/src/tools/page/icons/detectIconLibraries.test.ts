import { describe, expect, it } from 'vitest';
import { cleanSvgMarkup, detectIconLibraries, type IconSignals } from './detectIconLibraries';

const signals = (overrides: Partial<IconSignals> = {}): IconSignals => ({
  classes: [],
  attributes: [],
  tags: [],
  fonts: [],
  resources: [],
  spriteRefs: [],
  ...overrides,
});

const ids = (overrides: Partial<IconSignals>) =>
  detectIconLibraries(signals(overrides)).map((library) => library.id);

describe('detectIconLibraries', () => {
  it('finds nothing on a plain page', () => {
    expect(ids({ classes: ['container', 'btn', 'title'] })).toEqual([]);
  });

  it('detects Lucide, Bootstrap Icons, Tabler and Feather by class and attribute', () => {
    expect(ids({ classes: ['lucide', 'lucide-home'] })).toEqual(['lucide']);
    expect(ids({ classes: ['bi', 'bi-alarm'] })).toEqual(['bootstrap']);
    expect(ids({ classes: ['ti', 'ti-home'] })).toEqual(['tabler']);
    expect(ids({ attributes: ['data-feather'] })).toEqual(['feather']);
  });

  it('does not treat a lone bi- or ti- class as a library', () => {
    expect(ids({ classes: ['bi-weekly', 'ti-tle'] })).toEqual([]);
  });

  it('detects Material variants and names Symbols separately', () => {
    const symbols = detectIconLibraries(signals({ classes: ['material-symbols-outlined'] }));
    expect(symbols[0]?.name).toBe('Material Symbols');
    const icons = detectIconLibraries(signals({ classes: ['material-icons-round'] }));
    expect(icons[0]?.name).toBe('Material Icons');
  });

  it('detects Ionicons by custom element and Phosphor by class pair', () => {
    expect(ids({ tags: ['ion-icon'] })).toEqual(['ionicons']);
    expect(ids({ classes: ['ph', 'ph-house'] })).toEqual(['phosphor']);
    expect(ids({ classes: ['ph-house'] })).toEqual([]);
  });

  it('marks Heroicons from data-slot as probable only', () => {
    const [library] = detectIconLibraries(signals({ attributes: ['data-slot=icon'] }));
    expect(library).toMatchObject({ id: 'heroicons', confidence: 'probable' });
  });

  it('reads the Font Awesome version from the stylesheet url, font or classes', () => {
    const fromUrl = detectIconLibraries(
      signals({
        classes: ['fa-solid', 'fa-house'],
        resources: ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'],
      }),
    );
    expect(fromUrl[0]).toMatchObject({ id: 'fontawesome', version: '6.5.1' });
    expect(detectIconLibraries(signals({ fonts: ['Font Awesome 5 Free'] }))[0]?.version).toBe('5');
    expect(detectIconLibraries(signals({ classes: ['fa', 'fa-home'] }))[0]?.version).toBe('4');
    expect(detectIconLibraries(signals({ classes: ['fas', 'fa-home'] }))[0]?.version).toBe('5');
    expect(detectIconLibraries(signals({ classes: ['fa-brands', 'fa-x'] }))[0]?.version).toBe('6+');
  });

  it('reports several libraries ordered by evidence', () => {
    expect(ids({ classes: ['lucide', 'lucide-a', 'ri-home-line'] })).toEqual(['lucide', 'remix']);
  });
});

describe('cleanSvgMarkup', () => {
  it('drops page-specific attributes and sizes when a viewBox exists', () => {
    const cleaned = cleanSvgMarkup(
      '<svg class="icon lucide" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" data-x="1" id="a"><path d="M0 0"/></svg>',
    );
    expect(cleaned).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>',
    );
  });

  it('keeps ids that are referenced and removes scripts', () => {
    const cleaned = cleanSvgMarkup(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><script>x()</script><linearGradient id="g"/><rect fill="url(#g)"/></svg>',
    );
    expect(cleaned).toContain('id="g"');
    expect(cleaned).not.toContain('script');
  });
});
