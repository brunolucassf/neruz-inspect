export type StyleMap = Record<string, string>;

export const INHERITED_PROPERTIES: ReadonlySet<string> = new Set([
  'color',
  'cursor',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'letter-spacing',
  'line-height',
  'list-style-type',
  'text-align',
  'text-shadow',
  'text-transform',
  'visibility',
  'white-space',
  'word-break',
]);

export const PROPERTY_GROUPS: Readonly<Record<string, readonly string[]>> = {
  margin: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
  padding: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
  'border-radius': [
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-right-radius',
    'border-bottom-left-radius',
  ],
  'border-width': [
    'border-top-width',
    'border-right-width',
    'border-bottom-width',
    'border-left-width',
  ],
  'border-style': [
    'border-top-style',
    'border-right-style',
    'border-bottom-style',
    'border-left-style',
  ],
  'border-color': [
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
  ],
  gap: ['row-gap', 'column-gap'],
  overflow: ['overflow-x', 'overflow-y'],
};

const SIDES = ['top', 'right', 'bottom', 'left'] as const;

const groupMembers = (group: string): readonly string[] => PROPERTY_GROUPS[group] ?? [];

export const TRACKED_PROPERTIES: readonly string[] = [
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'z-index',
  'float',
  'flex-direction',
  'flex-wrap',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'justify-content',
  'align-items',
  'align-self',
  'justify-items',
  'order',
  'grid-template-columns',
  'grid-template-rows',
  'grid-auto-flow',
  'width',
  'height',
  'min-width',
  'max-width',
  'min-height',
  'max-height',
  'aspect-ratio',
  'box-sizing',
  ...groupMembers('margin'),
  ...groupMembers('padding'),
  ...groupMembers('gap'),
  ...groupMembers('overflow'),
  'color',
  'background-color',
  'background-image',
  'background-size',
  'background-position',
  'background-repeat',
  ...groupMembers('border-width'),
  ...groupMembers('border-style'),
  ...groupMembers('border-color'),
  ...groupMembers('border-radius'),
  'outline-style',
  'outline-width',
  'outline-color',
  'box-shadow',
  'opacity',
  'transform',
  'filter',
  'backdrop-filter',
  'mix-blend-mode',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-decoration-line',
  'text-transform',
  'text-shadow',
  'text-overflow',
  'white-space',
  'word-break',
  'list-style-type',
  'object-fit',
  'object-position',
  'cursor',
  'visibility',
  'pointer-events',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'animation-name',
  'animation-duration',
];

const AUTHORED_ONLY_PROPERTIES: ReadonlySet<string> = new Set([
  'width',
  'height',
  'min-width',
  'max-width',
  'min-height',
  'max-height',
  'top',
  'right',
  'bottom',
  'left',
  'flex-basis',
  'grid-template-columns',
  'grid-template-rows',
]);

const NEUTRAL_VALUES: ReadonlySet<string> = new Set(['', 'none', 'normal', 'auto', 'initial']);

export type DiffInput = {
  computed: Readonly<StyleMap>;
  defaults: Readonly<StyleMap>;
  parent: Readonly<StyleMap> | null;
  authored: ReadonlySet<string>;
};

const differsFromBaseline = (name: string, input: DiffInput): boolean => {
  const value = input.computed[name];
  if (value === undefined || value === '') return false;
  if (AUTHORED_ONLY_PROPERTIES.has(name)) {
    return input.authored.has(name) && !NEUTRAL_VALUES.has(value);
  }
  if (INHERITED_PROPERTIES.has(name) && input.parent) return value !== input.parent[name];
  return value !== input.defaults[name];
};

const findGroup = (name: string): string | null => {
  for (const [group, members] of Object.entries(PROPERTY_GROUPS)) {
    if (members.includes(name)) return group;
  }
  return null;
};

const isHiddenSide = (side: string, result: Readonly<StyleMap>): boolean => {
  const style = result[`border-${side}-style`];
  return style === undefined || style === 'none' || style === 'hidden';
};

const removeHiddenBorderSides = (result: StyleMap): void => {
  for (const side of SIDES) {
    if (!isHiddenSide(side, result)) continue;
    delete result[`border-${side}-style`];
    delete result[`border-${side}-width`];
    delete result[`border-${side}-color`];
  }
};

const removeRedundant = (result: StyleMap): void => {
  if (result['animation-name'] === undefined) delete result['animation-duration'];
  if (result['transition-duration'] === '0s') {
    delete result['transition-duration'];
    delete result['transition-property'];
    delete result['transition-timing-function'];
  }
};

export const diffComputed = (input: DiffInput): StyleMap => {
  const changedGroups = new Set<string>();
  const result: StyleMap = {};
  for (const name of TRACKED_PROPERTIES) {
    if (!differsFromBaseline(name, input)) continue;
    const group = findGroup(name);
    if (group) changedGroups.add(group);
    else result[name] = input.computed[name] ?? '';
  }
  if (changedGroups.has('border-style')) {
    changedGroups.add('border-width');
    changedGroups.add('border-color');
  }
  for (const group of changedGroups) {
    for (const member of groupMembers(group)) {
      const value = input.computed[member];
      if (value !== undefined && value !== '') result[member] = value;
    }
  }
  removeHiddenBorderSides(result);
  removeRedundant(result);
  return result;
};

const toBoxShorthand = (values: readonly string[]): string => {
  const [top = '', right = '', bottom = '', left = ''] = values;
  if (top === right && right === bottom && bottom === left) return top;
  if (top === bottom && right === left) return `${top} ${right}`;
  if (right === left) return `${top} ${right} ${bottom}`;
  return `${top} ${right} ${bottom} ${left}`;
};

const toPairShorthand = (values: readonly string[]): string => {
  const [first = '', second = ''] = values;
  return first === second ? first : `${first} ${second}`;
};

export const collapseShorthands = (styles: Readonly<StyleMap>): StyleMap => {
  const result: StyleMap = { ...styles };
  for (const [group, members] of Object.entries(PROPERTY_GROUPS)) {
    if (!members.every((member) => result[member] !== undefined)) continue;
    const values = members.map((member) => result[member] ?? '');
    for (const member of members) delete result[member];
    result[group] = members.length === 4 ? toBoxShorthand(values) : toPairShorthand(values);
  }
  const width = result['border-width'];
  const style = result['border-style'];
  const color = result['border-color'];
  const isSingle = (value: string | undefined): value is string =>
    value !== undefined && !/\s(?![^(]*\))/.test(value);
  if (isSingle(width) && isSingle(style) && isSingle(color)) {
    delete result['border-width'];
    delete result['border-style'];
    delete result['border-color'];
    result.border = `${width} ${style} ${color}`;
  }
  return result;
};

export const styleMapToCss = (
  styles: Readonly<StyleMap>,
  selector: string,
  indent = '  ',
): string => {
  const lines = Object.entries(collapseShorthands(styles)).map(
    ([name, value]) => `${indent}${name}: ${value};`,
  );
  return `${selector} {\n${lines.join('\n')}\n}`;
};

export const toCamelCase = (name: string): string =>
  name.startsWith('--')
    ? name
    : name.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());

export const hoverSubjectSelectors = (selectorText: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < selectorText.length; index += 1) {
    const char = selectorText[index];
    if (char === '(' || char === '[') depth += 1;
    else if (char === ')' || char === ']') depth -= 1;
    else if (char === ',' && depth === 0) {
      parts.push(selectorText.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(selectorText.slice(start));
  const result: string[] = [];
  for (const raw of parts) {
    const part = raw.trim();
    const lastCompound = part.split(/\s*[>+~]\s*|\s+/).pop() ?? '';
    if (!lastCompound.includes(':hover')) continue;
    const stripped = part.replace(/:hover/g, '').trim();
    if (stripped === '' || /[>+~]$/.test(stripped)) continue;
    result.push(stripped);
  }
  return result;
};
