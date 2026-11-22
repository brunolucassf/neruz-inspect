import { collapseShorthands, type StyleMap, styleMapToCss, toCamelCase } from '../shared/styleDiff';

export type TextNode = { kind: 'text'; text: string };

export type ElementNode = {
  kind: 'element';
  tag: string;
  attrs: Record<string, string>;
  styles: StyleMap;
  children: HtmlNode[];
  className?: string;
};

export type HtmlNode = TextNode | ElementNode;

export type CleanOptions = { keepDataAttributes: boolean };

export const VOID_TAGS: ReadonlySet<string> = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

const REMOVED_TAGS: ReadonlySet<string> = new Set([
  'script',
  'style',
  'noscript',
  'template',
  'link',
  'meta',
  'iframe',
  'object',
  'embed',
]);

const URL_ATTRIBUTES: ReadonlySet<string> = new Set(['href', 'src', 'poster', 'action']);

const BOOLEAN_ATTRIBUTES: ReadonlySet<string> = new Set([
  'disabled',
  'checked',
  'selected',
  'readonly',
  'required',
  'multiple',
  'autofocus',
  'autoplay',
  'controls',
  'loop',
  'muted',
  'playsinline',
  'hidden',
  'open',
  'async',
  'defer',
]);

const FRAMEWORK_ATTRIBUTE_PATTERN = /^(ng-|_ng|v-|x-|:|@|jsx|data-reactid|data-react|data-v-)/;

export const absolutizeUrl = (value: string, base: string): string => {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.startsWith('#')) return trimmed;
  if (/^\s*javascript:/i.test(trimmed)) return '#';
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  try {
    return new URL(trimmed, base).href;
  } catch {
    return trimmed;
  }
};

export const absolutizeSrcset = (value: string, base: string): string =>
  value
    .split(',')
    .map((candidate) => {
      const [url = '', ...descriptor] = candidate.trim().split(/\s+/);
      return [absolutizeUrl(url, base), ...descriptor].join(' ');
    })
    .join(', ');

const isEventAttribute = (name: string): boolean => /^on[a-z]/i.test(name);

export const cleanAttributes = (
  attrs: Readonly<Record<string, string>>,
  base: string,
  { keepDataAttributes }: CleanOptions,
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [rawName, value] of Object.entries(attrs)) {
    const name = rawName.toLowerCase();
    if (isEventAttribute(name)) continue;
    if (name === 'style' || name === 'class' || name === 'nonce' || name === 'integrity') continue;
    if (name.startsWith('data-') && !keepDataAttributes) continue;
    if (FRAMEWORK_ATTRIBUTE_PATTERN.test(name)) continue;
    if (name === 'srcset') result[name] = absolutizeSrcset(value, base);
    else if (URL_ATTRIBUTES.has(name)) result[name] = absolutizeUrl(value, base);
    else result[name] = value;
  }
  return result;
};

const collapseWhitespace = (text: string): string => text.replace(/\s+/g, ' ');

export const cleanTree = (
  nodes: readonly HtmlNode[],
  base: string,
  options: CleanOptions,
): HtmlNode[] => {
  const result: HtmlNode[] = [];
  for (const node of nodes) {
    if (node.kind === 'text') {
      const text = collapseWhitespace(node.text);
      if (text.trim() === '' && result.length === 0) continue;
      result.push({ kind: 'text', text });
      continue;
    }
    if (REMOVED_TAGS.has(node.tag)) continue;
    result.push({
      ...node,
      attrs: cleanAttributes(node.attrs, base, options),
      children: cleanTree(node.children, base, options),
    });
  }
  const last = result[result.length - 1];
  if (last?.kind === 'text' && last.text.trim() === '') result.pop();
  return result;
};

export const countNodes = (nodes: readonly HtmlNode[]): number =>
  nodes.reduce(
    (total, node) => total + 1 + (node.kind === 'element' ? countNodes(node.children) : 0),
    0,
  );

const ROLE_BY_TAG: Readonly<Record<string, string>> = {
  h1: 'title',
  h2: 'title',
  h3: 'title',
  h4: 'title',
  h5: 'title',
  h6: 'title',
  p: 'text',
  a: 'link',
  img: 'image',
  picture: 'image',
  button: 'button',
  ul: 'list',
  ol: 'list',
  li: 'item',
  span: 'label',
  nav: 'nav',
  header: 'header',
  footer: 'footer',
  section: 'section',
  article: 'article',
  figure: 'figure',
  figcaption: 'caption',
  form: 'form',
  input: 'field',
  label: 'label',
  svg: 'icon',
  video: 'video',
  div: 'box',
};

export const roleForTag = (tag: string): string => ROLE_BY_TAG[tag] ?? tag;

const hasStyles = (node: ElementNode): boolean => Object.keys(node.styles).length > 0;

const styleSignature = (node: ElementNode): string =>
  Object.entries(collapseShorthands(node.styles))
    .map(([name, value]) => `${name}:${value}`)
    .join(';');

export type ClassRule = { className: string; styles: StyleMap };

export const assignClassNames = (root: ElementNode, rootClass = 'component'): ClassRule[] => {
  const rules: ClassRule[] = [];
  const bySignature = new Map<string, string>();
  const roleCounts = new Map<string, number>();

  const visit = (node: ElementNode, isRoot: boolean): void => {
    if (hasStyles(node)) {
      const signature = `${node.tag}|${styleSignature(node)}`;
      const reused = bySignature.get(signature);
      if (reused) node.className = reused;
      else {
        let className = rootClass;
        if (!isRoot) {
          const role = roleForTag(node.tag);
          const count = (roleCounts.get(role) ?? 0) + 1;
          roleCounts.set(role, count);
          className = `${rootClass}__${role}${count > 1 ? `-${count}` : ''}`;
        }
        node.className = className;
        bySignature.set(signature, className);
        rules.push({ className, styles: node.styles });
      }
    }
    for (const child of node.children) if (child.kind === 'element') visit(child, false);
  };

  visit(root, true);
  return rules;
};

export const buildCss = (rules: readonly ClassRule[]): string =>
  rules.map((rule) => styleMapToCss(rule.styles, `.${rule.className}`)).join('\n\n');

const escapeText = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeAttribute = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const serializeAttributes = (
  attrs: Readonly<Record<string, string>>,
  className?: string,
): string => {
  const parts: string[] = [];
  if (className) parts.push(`class="${escapeAttribute(className)}"`);
  for (const [name, value] of Object.entries(attrs)) {
    if (name === 'class') continue;
    if (BOOLEAN_ATTRIBUTES.has(name) && (value === '' || value === name)) parts.push(name);
    else parts.push(`${name}="${escapeAttribute(value)}"`);
  }
  return parts.length ? ` ${parts.join(' ')}` : '';
};

const serializeNode = (
  node: HtmlNode,
  depth: number,
  classFor: (node: ElementNode) => string | undefined,
): string[] => {
  const indent = '  '.repeat(depth);
  if (node.kind === 'text') {
    const text = node.text.trim();
    return text ? [`${indent}${escapeText(text)}`] : [];
  }
  const open = `<${node.tag}${serializeAttributes(node.attrs, classFor(node))}`;
  if (VOID_TAGS.has(node.tag)) return [`${indent}${open}>`];
  const children = node.children;
  if (children.length === 0) return [`${indent}${open}></${node.tag}>`];
  if (children.length === 1 && children[0]?.kind === 'text') {
    const text = (children[0] as TextNode).text.trim();
    return [`${indent}${open}>${escapeText(text)}</${node.tag}>`];
  }
  return [
    `${indent}${open}>`,
    ...children.flatMap((child) => serializeNode(child, depth + 1, classFor)),
    `${indent}</${node.tag}>`,
  ];
};

export const serializeHtml = (root: ElementNode): string =>
  serializeNode(root, 0, (node) => node.className).join('\n');

export const serializeTailwindHtml = (
  root: ElementNode,
  toClasses: (styles: StyleMap) => string,
): string =>
  serializeNode(root, 0, (node) => {
    const generated = toClasses(node.styles).trim();
    return generated || undefined;
  }).join('\n');

const JSX_ATTRIBUTE_NAMES: Readonly<Record<string, string>> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  autoplay: 'autoPlay',
  crossorigin: 'crossOrigin',
  srcset: 'srcSet',
  playsinline: 'playsInline',
  contenteditable: 'contentEditable',
  spellcheck: 'spellCheck',
  enctype: 'encType',
  novalidate: 'noValidate',
  datetime: 'dateTime',
  charset: 'charSet',
  'accept-charset': 'acceptCharset',
  'xlink:href': 'xlinkHref',
  'xml:space': 'xmlSpace',
  'xmlns:xlink': 'xmlnsXlink',
};

export const toJsxAttributeName = (name: string): string => {
  const mapped = JSX_ATTRIBUTE_NAMES[name];
  if (mapped) return mapped;
  if (name.startsWith('aria-') || name.startsWith('data-')) return name;
  return name.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
};

const jsxStringLiteral = (value: string): string => {
  if (!/["\n\r\\{]/.test(value)) return `"${value}"`;
  return `{${JSON.stringify(value)}}`;
};

const jsxText = (text: string): string =>
  text.replace(/[{}<>]/g, (char) => `{${JSON.stringify(char)}}`);

const quoteJs = (value: string): string =>
  `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;

export const toJsxStyleObject = (styles: Readonly<StyleMap>): string => {
  const entries = Object.entries(collapseShorthands(styles)).map(
    ([name, value]) => `${toCamelCase(name)}: ${quoteJs(value)}`,
  );
  return entries.length ? `{{ ${entries.join(', ')} }}` : '';
};

const jsxAttributes = (node: ElementNode): string => {
  const parts: string[] = [];
  for (const [name, value] of Object.entries(node.attrs)) {
    const jsxName = toJsxAttributeName(name);
    if (BOOLEAN_ATTRIBUTES.has(name) && (value === '' || value === name)) parts.push(jsxName);
    else parts.push(`${jsxName}=${jsxStringLiteral(value)}`);
  }
  const style = toJsxStyleObject(node.styles);
  if (style) parts.push(`style=${style}`);
  return parts.length ? ` ${parts.join(' ')}` : '';
};

const jsxNode = (node: HtmlNode, depth: number): string[] => {
  const indent = '  '.repeat(depth);
  if (node.kind === 'text') {
    const text = node.text.trim();
    return text ? [`${indent}${jsxText(text)}`] : [];
  }
  const open = `<${node.tag}${jsxAttributes(node)}`;
  if (node.children.length === 0) return [`${indent}${open} />`];
  const first = node.children[0];
  if (node.children.length === 1 && first?.kind === 'text') {
    return [`${indent}${open}>${jsxText(first.text.trim())}</${node.tag}>`];
  }
  return [
    `${indent}${open}>`,
    ...node.children.flatMap((child) => jsxNode(child, depth + 1)),
    `${indent}</${node.tag}>`,
  ];
};

export const toJsx = (root: ElementNode, componentName = 'Component'): string => {
  const body = jsxNode(root, 2).join('\n');
  return `export function ${componentName}() {\n  return (\n${body}\n  );\n}`;
};

export type LimitedText = { text: string; truncated: boolean };

export const limitText = (text: string, maxChars: number): LimitedText => {
  if (text.length <= maxChars) return { text, truncated: false };
  const cut = text.lastIndexOf('\n', maxChars);
  return { text: text.slice(0, cut > 0 ? cut : maxChars), truncated: true };
};
