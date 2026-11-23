import type { ReactNode } from 'react';
import { Card } from '../../../ui';
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
  <div className={`ni-bm ni-bm--${name}`}>
    <span className="ni-bm__tag">{name}</span>
    <span className="ni-bm__n ni-bm__n--t">{showEdge(edges.top)}</span>
    <span className="ni-bm__n ni-bm__n--b">{showEdge(edges.bottom)}</span>
    <span className="ni-bm__n ni-bm__n--l">{showEdge(edges.left)}</span>
    <span className="ni-bm__n ni-bm__n--r">{showEdge(edges.right)}</span>
    {children}
  </div>
);

export const BoxDiagram = ({ label, margin, border, padding, children }: BoxDiagramProps) => (
  <Card className="ni-boxmodel">
    <div role="img" aria-label={label}>
      <Layer name="margin" edges={margin}>
        <Layer name="border" edges={border}>
          <Layer name="padding" edges={padding}>
            <div className="ni-bm ni-bm--content">{children}</div>
          </Layer>
        </Layer>
      </Layer>
    </div>
  </Card>
);
