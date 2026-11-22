import { toTailwindClassList } from '../../../lib/css';
import { type StyleMap, styleMapToCss } from '../shared/styleDiff';

const expandBoxValue = (value: string): [string, string, string, string] => {
  const parts = value.trim().split(/\s+(?![^(]*\))/);
  const [first = '0', second = first, third = first, fourth = second] = parts;
  return [first, second, third, fourth];
};

export const expandHoverShorthands = (declared: Readonly<StyleMap>): StyleMap => {
  const result: StyleMap = { ...declared };
  for (const property of ['margin', 'padding']) {
    const value = result[property];
    if (value === undefined) continue;
    const [top, right, bottom, left] = expandBoxValue(value);
    delete result[property];
    result[`${property}-top`] = top;
    result[`${property}-right`] = right;
    result[`${property}-bottom`] = bottom;
    result[`${property}-left`] = left;
  }
  if (result.background && !result['background-color']) {
    result['background-color'] = result.background;
  }
  return result;
};

export const prefixClasses = (classes: readonly string[], prefix: string): string[] =>
  classes.map((name) => `${prefix}:${name}`);

export const buildCssText = (
  selector: string,
  styles: Readonly<StyleMap>,
  hover: Readonly<StyleMap>,
): string => {
  const blocks = [styleMapToCss(styles, selector)];
  if (Object.keys(hover).length > 0) blocks.push(styleMapToCss(hover, `${selector}:hover`));
  return blocks.join('\n\n');
};

export const buildTailwindText = (
  styles: Readonly<StyleMap>,
  hover: Readonly<StyleMap>,
): string => {
  const base = toTailwindClassList(styles);
  const hovered = prefixClasses(toTailwindClassList(expandHoverShorthands(hover)), 'hover');
  return [...base, ...hovered].join(' ');
};
