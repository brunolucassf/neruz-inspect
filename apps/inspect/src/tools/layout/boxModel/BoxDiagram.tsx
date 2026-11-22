import type { ReactNode } from 'react';
import type { Edges } from './boxModel';
import './box-model.css';

type BoxDiagramProps = {
  label: string;
  margin: Edges;
  border: Edges;
  padding: Edges;
  children: ReactNode;
};

type LayerProps = { name: string; edges: Edges; children: ReactNode };

const showEdge = (value: number): string =>
  value === 0 ? '–' : String(Math.round(value * 10) / 10);

const Layer = ({ name, edges, children }: LayerProps) => (
  <div className={`ni-bd ni-bd--${name}`}>
    <span className="ni-bd__name">{name}</span>
    <span className="ni-bd__top">{showEdge(edges.top)}</span>
    <span className="ni-bd__left">{showEdge(edges.left)}</span>
    <div className="ni-bd__inner">{children}</div>
    <span className="ni-bd__right">{showEdge(edges.right)}</span>
    <span className="ni-bd__bottom">{showEdge(edges.bottom)}</span>
  </div>
);

export const BoxDiagram = ({ label, margin, border, padding, children }: BoxDiagramProps) => (
  <div className="ni-boxdiagram" role="img" aria-label={label}>
    <Layer name="margin" edges={margin}>
      <Layer name="border" edges={border}>
        <Layer name="padding" edges={padding}>
          <div className="ni-bd__content">{children}</div>
        </Layer>
      </Layer>
    </Layer>
  </div>
);
