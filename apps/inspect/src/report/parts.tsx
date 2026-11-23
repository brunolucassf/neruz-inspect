import type { ReactNode } from 'react';
import { useT } from '../lib/i18n';
import type { Finding, Light } from '../tools/page/report/reportTypes';
import { findingTitleKey, recommendationKey } from './findingText';

const LIGHT_GLYPH: Record<Light, string> = {
  good: '●',
  attention: '▲',
  critical: '■',
  unmeasured: '○',
};

export const LightBadge = ({ light }: { light: Light }) => {
  const t = useT();
  return (
    <span className="ni-doc__light" data-light={light}>
      <span aria-hidden="true">{LIGHT_GLYPH[light]}</span> {t(`page.report.doc.light.${light}`)}
    </span>
  );
};

const RING_RADIUS = 44;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export const ScoreRing = ({
  score,
  light,
  size = 'large',
}: {
  score: number | null;
  light: Light;
  size?: 'large' | 'small';
}) => {
  const filled = score === null ? 0 : (RING_LENGTH * score) / 100;
  return (
    <span className="ni-doc__ring" data-light={light} data-size={size}>
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle className="ni-doc__ring-track" cx="50" cy="50" r={RING_RADIUS} />
        <circle
          className="ni-doc__ring-fill"
          cx="50"
          cy="50"
          r={RING_RADIUS}
          strokeDasharray={`${filled} ${RING_LENGTH}`}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span className="ni-doc__ring-value">{score === null ? '–' : score}</span>
    </span>
  );
};

export const DocSection = ({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) => (
  <section className="ni-doc__section" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`} className="ni-doc__h2">
      {title}
    </h2>
    {intro ? <p className="ni-doc__intro">{intro}</p> : null}
    {children}
  </section>
);

export const SubTitle = ({ children }: { children: ReactNode }) => (
  <h3 className="ni-doc__h3">{children}</h3>
);

export const Note = ({ children }: { children: ReactNode }) => (
  <p className="ni-doc__note">{children}</p>
);

export const FailedNote = () => {
  const t = useT();
  return <p className="ni-doc__note ni-doc__note--warn">{t('page.report.doc.notMeasured')}</p>;
};

export const FindingsTable = ({ findings }: { findings: readonly Finding[] }) => {
  const t = useT();
  return (
    <table className="ni-doc__table">
      <thead>
        <tr>
          <th scope="col">{t('page.report.doc.col.severity')}</th>
          <th scope="col">{t('page.report.doc.col.problem')}</th>
          <th scope="col">{t('page.report.doc.col.fix')}</th>
        </tr>
      </thead>
      <tbody>
        {findings.map((finding) => (
          <tr key={`${finding.area}-${finding.id}-${JSON.stringify(finding.params ?? {})}`}>
            <td>
              <span className="ni-doc__severity" data-severity={finding.severity}>
                {t(`page.common.severity.${finding.severity}`)}
              </span>
            </td>
            <td>
              {t(findingTitleKey(finding), finding.params)}
              {finding.count > 1 ? (
                <span className="ni-doc__count"> · ×{finding.count}</span>
              ) : null}
            </td>
            <td>{t(recommendationKey(finding))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
