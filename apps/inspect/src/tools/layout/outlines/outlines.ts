export const OUTLINE_MAX_DEPTH = 12;

const HUE_STEP = 47;

export const depthColor = (depth: number): string => `hsl(${(depth * HUE_STEP) % 360} 85% 58%)`;

export const buildOutlineCss = (hostTag: string, maxDepth: number = OUTLINE_MAX_DEPTH): string => {
  const step = `> *:not(${hostTag})`;
  const rule = (selector: string, depth: number): string =>
    `${selector}{outline:1px solid ${depthColor(depth)} !important;outline-offset:-1px !important}`;
  const rules = [rule('body', 0)];
  let selector = 'body';
  for (let depth = 1; depth <= maxDepth; depth += 1) {
    selector = `${selector} ${step}`;
    rules.push(rule(selector, depth));
  }
  rules.push(rule(`${selector} *`, maxDepth));
  return rules.join('\n');
};

export type TagCandidate = {
  tag: string;
  rect: { x: number; y: number; width: number; height: number };
};

export const pickTagLabels = (
  candidates: readonly TagCandidate[],
  viewport: { width: number; height: number },
  limit: number,
): TagCandidate[] => {
  const visible: TagCandidate[] = [];
  for (const candidate of candidates) {
    const { x, y, width, height } = candidate.rect;
    if (width <= 0 || height <= 0) continue;
    if (x + width < 0 || y + height < 0 || x > viewport.width || y > viewport.height) continue;
    visible.push(candidate);
    if (visible.length >= limit) break;
  }
  return visible;
};
