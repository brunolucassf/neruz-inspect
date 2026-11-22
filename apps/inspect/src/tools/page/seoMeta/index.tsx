import { FileSearch } from 'lucide-react';
import { useState } from 'react';
import { useT } from '../../../lib/i18n';
import { Badge, CopyRow, PanelSection, Tabs } from '../../../ui';
import type { ToolModule } from '../../types';
import { Alert } from '../shared/Alert';
import { ScanView } from '../shared/ScanView';
import { countBySeverity, SEVERITY_ORDER } from '../shared/severity';
import { useElementFocus } from '../shared/useElementFocus';
import { useScan } from '../shared/useScan';
import {
  analyzeSeo,
  DESCRIPTION_RANGE,
  type LengthRating,
  rateLength,
  type SeoResult,
  TITLE_RANGE,
} from './analyzeSeo';
import { SeoPreviews } from './SeoPreviews';
import '../shared/page.css';

type SeoTab = 'general' | 'previews' | 'headings';

const RATING_TONE: Record<LengthRating, 'neutral' | 'success' | 'warning' | 'danger'> = {
  empty: 'danger',
  short: 'warning',
  good: 'success',
  long: 'warning',
};

const LengthField = ({
  label,
  value,
  range,
}: {
  label: string;
  value: string;
  range: { min: number; max: number };
}) => {
  const t = useT();
  const rating = rateLength(value.length, range);
  return (
    <div className="ni-pg-pad">
      <div className="ni-pg-inline">
        <strong>{label}</strong>
        <Badge tone={RATING_TONE[rating]}>
          {t('page.seoMeta.chars', { n: value.length, min: range.min, max: range.max })}
        </Badge>
      </div>
      {value ? (
        <CopyRow label={t('page.common.copy')} value={value} />
      ) : (
        <p className="ni-pg-muted">{t('page.seoMeta.none')}</p>
      )}
    </div>
  );
};

const GeneralTab = ({ seo }: { seo: SeoResult }) => {
  const t = useT();
  const none = t('page.seoMeta.none');
  const counts = countBySeverity(seo.alerts);
  const simple: [string, string][] = [
    [t('page.seoMeta.field.canonical'), seo.canonical],
    [t('page.seoMeta.field.robots'), seo.robots],
    [t('page.seoMeta.field.lang'), seo.lang],
    [t('page.seoMeta.field.viewport'), seo.viewport],
    [t('page.seoMeta.field.charset'), seo.charset],
  ];
  return (
    <>
      <LengthField label={t('page.seoMeta.field.title')} value={seo.title} range={TITLE_RANGE} />
      <LengthField
        label={t('page.seoMeta.field.description')}
        value={seo.description}
        range={DESCRIPTION_RANGE}
      />
      <PanelSection title={t('page.seoMeta.section.tags')}>
        {simple.map(([label, value]) => (
          <CopyRow key={label} label={label} value={value || none} copyValue={value || none} />
        ))}
      </PanelSection>
      {seo.hreflangs.length > 0 ? (
        <PanelSection title={t('page.seoMeta.field.hreflang')}>
          {seo.hreflangs.map((entry) => (
            <CopyRow key={`${entry.lang}-${entry.href}`} label={entry.lang} value={entry.href} />
          ))}
        </PanelSection>
      ) : null}
      <PanelSection title={t('page.seoMeta.field.og')}>
        {Object.entries(seo.openGraph).length === 0 ? (
          <p className="ni-pg-muted">{none}</p>
        ) : (
          Object.entries(seo.openGraph).map(([key, value]) => (
            <CopyRow key={key} label={key.replace('og:', '')} value={value} />
          ))
        )}
      </PanelSection>
      <PanelSection title={t('page.seoMeta.field.twitter')}>
        {Object.entries(seo.twitter).length === 0 ? (
          <p className="ni-pg-muted">{none}</p>
        ) : (
          Object.entries(seo.twitter).map(([key, value]) => (
            <CopyRow key={key} label={key.replace('twitter:', '')} value={value} />
          ))
        )}
      </PanelSection>
      <PanelSection
        title={t('page.seoMeta.section.alerts')}
        actions={
          <span className="ni-pg-muted">
            {SEVERITY_ORDER.map(
              (severity) => `${counts[severity]} ${t(`page.common.severity.${severity}`)}`,
            ).join(' · ')}
          </span>
        }
      >
        {seo.alerts.length === 0 ? (
          <p className="ni-pg-muted">{t('page.seoMeta.noAlerts')}</p>
        ) : (
          [...seo.alerts]
            .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))
            .map((alert) => (
              <Alert
                key={`${alert.id}-${JSON.stringify(alert.params ?? {})}`}
                severity={alert.severity}
                message={t(`page.seoMeta.alert.${alert.id}`, alert.params)}
              />
            ))
        )}
      </PanelSection>
    </>
  );
};

const HeadingsTab = ({ seo }: { seo: SeoResult }) => {
  const t = useT();
  const { focus } = useElementFocus();
  const skippedIndexes = new Set(
    seo.headingIssues.flatMap((issue) => (issue.kind === 'skip' ? [issue.index] : [])),
  );
  const outlineAlerts = seo.alerts.filter((alert) => /^(h1|heading)/.test(alert.id));
  return (
    <>
      <PanelSection title={t('page.seoMeta.section.headings')}>
        {seo.headings.length === 0 ? (
          <p className="ni-pg-muted">{t('page.seoMeta.headings.none')}</p>
        ) : (
          seo.headings.map((heading, index) => (
            <button
              key={heading.id}
              type="button"
              className="ni-pg-row ni-pg-row--button"
              style={{ gridTemplateColumns: 'auto 1fr', paddingLeft: 6 + (heading.level - 1) * 12 }}
              onClick={() => focus(heading.element, `H${heading.level}`)}
            >
              <Badge tone={skippedIndexes.has(index) ? 'warning' : 'accent'}>
                H{heading.level}
              </Badge>
              <span className="ni-pg-row__title">
                {heading.text || t('page.seoMeta.headings.emptyText')}
              </span>
            </button>
          ))
        )}
      </PanelSection>
      {outlineAlerts.length > 0 ? (
        <PanelSection title={t('page.seoMeta.section.alerts')}>
          {outlineAlerts.map((alert) => (
            <Alert
              key={`${alert.id}-${JSON.stringify(alert.params ?? {})}`}
              severity={alert.severity}
              message={t(`page.seoMeta.alert.${alert.id}`, alert.params)}
            />
          ))}
        </PanelSection>
      ) : null}
      <p className="ni-hint">{t('page.seoMeta.headings.hint')}</p>
    </>
  );
};

const SeoMetaPanel = () => {
  const t = useT();
  const [tab, setTab] = useState<SeoTab>('general');
  const { state, rescan } = useScan(() => analyzeSeo(document));
  return (
    <ScanView state={state} onRescan={rescan}>
      {(seo) => (
        <div className="ni-pg-pad">
          <Tabs
            label={t('page.seoMeta.name')}
            value={tab}
            onChange={setTab}
            items={[
              { id: 'general', label: t('page.seoMeta.tab.general') },
              { id: 'previews', label: t('page.seoMeta.tab.previews') },
              { id: 'headings', label: t('page.seoMeta.tab.headings') },
            ]}
          >
            {tab === 'general' ? <GeneralTab seo={seo} /> : null}
            {tab === 'previews' ? <SeoPreviews seo={seo} /> : null}
            {tab === 'headings' ? <HeadingsTab seo={seo} /> : null}
          </Tabs>
        </div>
      )}
    </ScanView>
  );
};

const seoMeta: ToolModule = {
  id: 'seoMeta',
  group: 'page',
  icon: FileSearch,
  mode: 'panel',
  Panel: SeoMetaPanel,
};

export default seoMeta;
