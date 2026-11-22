import { useMemo } from 'react';
import { buildCurveGeometry, parseEasing } from './easing';

type EasingCurveProps = { easing: string; label: string };

const WIDTH = 64;
const HEIGHT = 44;
const PADDING = 6;

export const EasingCurve = ({ easing, label }: EasingCurveProps) => {
  const geometry = useMemo(
    () => buildCurveGeometry(parseEasing(easing), WIDTH, HEIGHT, PADDING),
    [easing],
  );
  const { start, end } = geometry.endpoints;
  return (
    <svg
      className="ni-easing"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      role="img"
      aria-label={label}
    >
      <line className="ni-easing__axis" x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
      {geometry.handles ? (
        <>
          <line
            className="ni-easing__handle"
            x1={start.x}
            y1={start.y}
            x2={geometry.handles.first.x}
            y2={geometry.handles.first.y}
          />
          <line
            className="ni-easing__handle"
            x1={end.x}
            y1={end.y}
            x2={geometry.handles.second.x}
            y2={geometry.handles.second.y}
          />
        </>
      ) : null}
      <path className="ni-easing__curve" d={geometry.path} />
    </svg>
  );
};
