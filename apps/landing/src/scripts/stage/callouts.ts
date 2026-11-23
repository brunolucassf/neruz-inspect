const SVG_NS = 'http://www.w3.org/2000/svg';
const ELBOW = 28;

export interface CalloutsController {
  update(visibility: number, activeIndex: number): void;
}

export function createCallouts(
  svg: SVGSVGElement,
  view: HTMLElement,
  labels: HTMLElement[],
  anchors: HTMLElement[],
): CalloutsController {
  const count = Math.min(labels.length, anchors.length);
  const paths = Array.from({ length: count }, () => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('class', 'st__callout');
    svg.append(path);
    return path;
  });
  let isHidden = true;

  return {
    update(visibility, activeIndex) {
      if (visibility <= 0.01) {
        if (!isHidden) {
          svg.style.opacity = '0';
          isHidden = true;
        }
        return;
      }
      isHidden = false;
      svg.style.opacity = visibility.toFixed(3);
      const viewRect = view.getBoundingClientRect();
      const points = paths.map((_, index) => ({
        label: labels[index].getBoundingClientRect(),
        anchor: anchors[index].getBoundingClientRect(),
      }));
      points.forEach(({ label, anchor }, index) => {
        const startX = label.right - viewRect.left + 12;
        const startY = label.top + label.height / 2 - viewRect.top;
        const endX = anchor.left - viewRect.left;
        const endY = anchor.top - viewRect.top;
        paths[index].setAttribute(
          'd',
          `M${startX.toFixed(1)} ${startY.toFixed(1)}H${(startX + ELBOW).toFixed(1)}L${endX.toFixed(1)} ${endY.toFixed(1)}`,
        );
        paths[index].classList.toggle('is-active', index === activeIndex);
      });
    },
  };
}
