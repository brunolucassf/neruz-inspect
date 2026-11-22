import { Accessibility } from 'lucide-react';
import { useState } from 'react';
import { useT } from '../../../lib/i18n';
import { getElementLabel } from '../../../lib/picker';
import { Badge, EmptyState, PanelSection } from '../../../ui';
import type { ToolModule } from '../../types';
import { ChipGroup } from '../shared/ChipGroup';
import { ScanView } from '../shared/ScanView';
import { countBySeverity, SEVERITY_ORDER, type Severity, severityTone } from '../shared/severity';
import { useElementFocus } from '../shared/useElementFocus';
import { useScan } from '../shared/useScan';
import { type A11yIssue, type A11yRule, analyzeA11y } from './analyzeA11y';
import '../shared/page.css';

type SeverityFilter = 'all' | Severity;

const MAX_PER_RULE = 40;

const IssueRow = ({
  issue,
  onSelect,
}: {
  issue: A11yIssue;
  onSelect: (issue: A11yIssue) => void;
}) => {
  const t = useT();
  const label = issue.element ? getElementLabel(issue.element) : t('page.a11y.noElement');
  return (
    <button
      type="button"
      className="ni-pg-row ni-pg-row--button"
      disabled={!issue.element}
      onClick={() => onSelect(issue)}
    >
      <Badge tone={severityTone(issue.severity)}>
        {t(`page.common.severity.${issue.severity}`)}
      </Badge>
      <span className="ni-pg-row__main">
        <span className="ni-pg-row__title">{label}</span>
        {issue.detail ? <span className="ni-pg-row__sub">{issue.detail}</span> : null}
      </span>
      <span />
    </button>
  );
};

const A11yView = ({
  issues,
  scanned,
  truncated,
  focusSheetsSkipped,
}: {
  issues: A11yIssue[];
  scanned: number;
  truncated: boolean;
  focusSheetsSkipped: number;
}) => {
  const t = useT();
  const { focus } = useElementFocus();
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const counts = countBySeverity(issues);
  const filtered = issues.filter((issue) => filter === 'all' || issue.severity === filter);
  const byRule = new Map<A11yRule, A11yIssue[]>();
  for (const issue of filtered) byRule.set(issue.rule, [...(byRule.get(issue.rule) ?? []), issue]);

  return (
    <>
      <p className="ni-hint">{t('page.a11y.note')}</p>
      <div className="ni-pg-score">
        {SEVERITY_ORDER.map((severity) => (
          <div key={severity} className="ni-pg-score__item">
            <span className="ni-pg-score__number">{counts[severity]}</span>
            <Badge tone={severityTone(severity)}>{t(`page.common.severity.${severity}`)}</Badge>
          </div>
        ))}
      </div>
      <ChipGroup label={t('page.a11y.filter')}>
        {(['all', ...SEVERITY_ORDER] as const).map((entry) => (
          <button
            key={entry}
            type="button"
            className="ni-pg-chip"
            aria-pressed={filter === entry}
            onClick={() => setFilter(entry)}
          >
            {entry === 'all' ? t('page.a11y.filter.all') : t(`page.common.severity.${entry}`)}
          </button>
        ))}
      </ChipGroup>
      {truncated ? <p className="ni-hint">{t('page.common.limit5000')}</p> : null}
      {focusSheetsSkipped > 0 ? (
        <p className="ni-hint">{t('page.a11y.sheetsSkipped', { n: focusSheetsSkipped })}</p>
      ) : null}
      {issues.length === 0 ? (
        <EmptyState
          title={t('page.a11y.clean.title')}
          hint={t('page.a11y.clean.hint', { n: scanned })}
        />
      ) : (
        [...byRule.entries()].map(([rule, group]) => {
          const elements = group.flatMap((issue) => (issue.element ? [issue.element] : []));
          return (
            <PanelSection
              key={rule}
              title={`${t(`page.a11y.rule.${rule}`)} (${group.length})`}
              actions={
                elements.length > 1 ? (
                  <button
                    type="button"
                    className="ni-button"
                    onClick={() => focus(elements, t(`page.a11y.rule.${rule}`))}
                  >
                    {t('page.a11y.highlightAll')}
                  </button>
                ) : undefined
              }
            >
              <p className="ni-pg-muted">{t(`page.a11y.hint.${rule}`)}</p>
              {group.slice(0, MAX_PER_RULE).map((issue) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  onSelect={(selected) =>
                    selected.element && focus(selected.element, t(`page.a11y.rule.${rule}`))
                  }
                />
              ))}
              {group.length > MAX_PER_RULE ? (
                <p className="ni-pg-muted">
                  {t('page.a11y.moreIssues', { n: group.length - MAX_PER_RULE })}
                </p>
              ) : null}
            </PanelSection>
          );
        })
      )}
    </>
  );
};

const A11yPanel = () => {
  const { state, rescan } = useScan(() => analyzeA11y(document));
  return (
    <ScanView state={state} onRescan={rescan}>
      {(result) => <A11yView {...result} />}
    </ScanView>
  );
};

const a11y: ToolModule = {
  id: 'a11y',
  group: 'page',
  icon: Accessibility,
  mode: 'panel',
  Panel: A11yPanel,
};

export default a11y;
