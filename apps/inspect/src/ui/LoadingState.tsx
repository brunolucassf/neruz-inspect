import './ui.css';

type LoadingStateProps = {
  title: string;
  blocks?: number;
};

const DEFAULT_BLOCKS = 3;

export const LoadingState = ({ title, blocks = DEFAULT_BLOCKS }: LoadingStateProps) => (
  <div className="ni-loading" role="status" aria-busy="true">
    <div className="ni-loading__bar" aria-hidden="true" />
    <div className="ni-loading__skeleton" aria-hidden="true">
      {Array.from({ length: blocks }, (_, index) => (
        <div key={index} className="ni-loading__block" />
      ))}
    </div>
    <span className="ni-visually-hidden">{title}</span>
  </div>
);
