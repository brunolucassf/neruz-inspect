import { describe, expect, it } from 'vitest';
import {
  absolutizeSrcset,
  absolutizeUrl,
  assignClassNames,
  buildCss,
  cleanTree,
  type ElementNode,
  type HtmlNode,
  limitText,
  serializeHtml,
  toJsx,
  toJsxAttributeName,
  toJsxStyleObject,
} from './htmlTree';

const element = (
  tag: string,
  attrs: Record<string, string> = {},
  children: HtmlNode[] = [],
  styles: Record<string, string> = {},
): ElementNode => ({ kind: 'element', tag, attrs, styles, children });

const text = (value: string): HtmlNode => ({ kind: 'text', text: value });

const BASE = 'https://example.com/blog/post';

describe('absolutizeUrl', () => {
  it('resolves relative urls and neutralizes javascript:', () => {
    expect(absolutizeUrl('/img/a.png', BASE)).toBe('https://example.com/img/a.png');
    expect(absolutizeUrl('b.png', BASE)).toBe('https://example.com/blog/b.png');
    expect(absolutizeUrl('javascript:alert(1)', BASE)).toBe('#');
    expect(absolutizeUrl('#top', BASE)).toBe('#top');
    expect(absolutizeUrl('data:image/png;base64,AAA', BASE)).toBe('data:image/png;base64,AAA');
  });

  it('resolves every srcset candidate', () => {
    expect(absolutizeSrcset('a.png 1x, /b.png 2x', BASE)).toBe(
      'https://example.com/blog/a.png 1x, https://example.com/b.png 2x',
    );
  });
});

describe('cleanTree', () => {
  const dirty = [
    element(
      'div',
      {
        class: 'x y',
        id: 'box',
        onclick: 'steal()',
        'data-reactid': '1',
        'data-id': '2',
        style: 'color:red',
      },
      [
        element('script', {}, [text('alert(1)')]),
        element('a', { href: '/go', 'ng-click': 'go()' }, [text('  Go   now  ')]),
        element('img', { src: 'p.png', alt: 'p', srcset: 'p.png 1x' }),
      ],
    ),
  ];

  it('removes scripts, event handlers, class, inline style and data attributes', () => {
    const [root] = cleanTree(dirty, BASE, { keepDataAttributes: false }) as ElementNode[];
    expect(root?.attrs).toEqual({ id: 'box' });
    expect(root?.children.map((child) => (child.kind === 'element' ? child.tag : 'text'))).toEqual([
      'a',
      'img',
    ]);
  });

  it('keeps data attributes on request but still drops framework ones', () => {
    const [root] = cleanTree(dirty, BASE, { keepDataAttributes: true }) as ElementNode[];
    expect(root?.attrs).toEqual({ id: 'box', 'data-id': '2' });
  });

  it('absolutizes links and images, collapsing whitespace', () => {
    const [root] = cleanTree(dirty, BASE, { keepDataAttributes: false }) as ElementNode[];
    expect(serializeHtml(root as ElementNode)).toBe(
      [
        '<div id="box">',
        '  <a href="https://example.com/go">Go now</a>',
        '  <img src="https://example.com/blog/p.png" alt="p" srcset="https://example.com/blog/p.png 1x">',
        '</div>',
      ]
        .join('\n')
        .replace('> Go now <', '>Go now<'),
    );
  });
});

describe('assignClassNames', () => {
  it('names root and roles, reusing classes for identical styles', () => {
    const root = element('section', {}, [], { display: 'grid' });
    root.children = [
      element('h2', {}, [text('Title')], { 'font-size': '24px' }),
      element('p', {}, [text('A')], { color: 'rgb(1, 2, 3)' }),
      element('p', {}, [text('B')], { color: 'rgb(1, 2, 3)' }),
      element('p', {}, [text('C')], { color: 'rgb(9, 9, 9)' }),
      element('div'),
    ];
    const rules = assignClassNames(root);
    expect(rules.map((rule) => rule.className)).toEqual([
      'component',
      'component__title',
      'component__text',
      'component__text-2',
    ]);
    const classes = root.children.map((child) => (child.kind === 'element' ? child.className : ''));
    expect(classes).toEqual([
      'component__title',
      'component__text',
      'component__text',
      'component__text-2',
      undefined,
    ]);
    expect(buildCss(rules)).toContain('.component__title {\n  font-size: 24px;\n}');
  });
});

describe('toJsx', () => {
  it('converts attributes, style objects and self-closing tags', () => {
    const root = element('label', { for: 'email', class: 'field' }, [
      element('input', { type: 'email', disabled: '', tabindex: '1' }),
      element('span', {}, [text('Use {braces} <here>')], { 'background-color': 'rgb(1, 2, 3)' }),
      element('i'),
    ]);
    const jsx = toJsx(root);
    expect(jsx).toContain('<label htmlFor="email" className="field">');
    expect(jsx).toContain('<input type="email" disabled tabIndex="1" />');
    expect(jsx).toContain("style={{ backgroundColor: 'rgb(1, 2, 3)' }}");
    expect(jsx).toContain('Use {"{"}braces{"}"} {"<"}here{">"}');
    expect(jsx).toContain('<i />');
    expect(jsx.startsWith('export function Component() {')).toBe(true);
  });

  it('maps svg and aria attribute names', () => {
    expect(toJsxAttributeName('stroke-width')).toBe('strokeWidth');
    expect(toJsxAttributeName('aria-label')).toBe('aria-label');
    expect(toJsxAttributeName('xlink:href')).toBe('xlinkHref');
    expect(toJsxStyleObject({})).toBe('');
    expect(toJsxStyleObject({ 'font-family': "Inter, 'Helvetica Neue'" })).toBe(
      "{{ fontFamily: 'Inter, \\'Helvetica Neue\\'' }}",
    );
  });
});

describe('limitText', () => {
  it('cuts on a line boundary and flags truncation', () => {
    expect(limitText('abc', 10)).toEqual({ text: 'abc', truncated: false });
    expect(limitText('line1\nline2\nline3', 12)).toEqual({ text: 'line1\nline2', truncated: true });
  });
});
