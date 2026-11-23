import { Bot } from 'lucide-react';
import { useState } from 'react';
import { useT } from '../../../lib/i18n';
import { Badge, Card, CodeChip, CopyRow, EmptyState, PanelSection, Tabs } from '../../../ui';
import type { ToolModule } from '../../types';
import { readText } from '../shared/readers';
import { ScanView } from '../shared/ScanView';
import { useScan } from '../shared/useScan';
import {
  analyzeRobotsSitemap,
  loadSitemap,
  type RobotsSitemapResult,
  type SitemapState,
} from './analyzeRobotsSitemap';
import '../shared/page.css';

type RobotsTab = 'robots' | 'sitemap';

const PAGE_SIZE = 100;

const RobotsTabContent = ({ result }: { result: RobotsSitemapResult }) => {
  const t = useT();
  const { robots } = result;
  if (!robots.found) {
    return (
      <EmptyState
        title={t('page.robotsSitemap.robots.missing')}
        hint={t('page.robotsSitemap.robots.missingHint', { url: result.robotsUrl })}
      />
    );
  }
  return (
    <>
      <PanelSection title={t('page.robotsSitemap.current')}>
        <CodeChip>{result.currentPath}</CodeChip>
        <Card variant="rows">
          {result.verdicts.map(({ agent, verdict }) => (
            <div key={agent} className="ni-pg-row ni-pg-row--verdict">
              <span className="ni-pg-mono">
                {agent === '*' ? t('page.robotsSitemap.anyBot') : agent}
              </span>
              <Badge tone={verdict.blocked ? 'danger' : 'success'}>
                {t(verdict.blocked ? 'page.robotsSitemap.blocked' : 'page.robotsSitemap.allowed')}
              </Badge>
              <span className="ni-pg-row__sub">
                {verdict.rule ? `${verdict.rule.type}: ${verdict.rule.path}` : ''}
              </span>
            </div>
          ))}
        </Card>
      </PanelSection>
      {robots.file.groups.map((group) => (
        <PanelSection
          key={`${group.agents.join(',')}-${group.rules.length}`}
          title={`${t('page.robotsSitemap.agent')}: ${group.agents.join(', ')}`}
          actions={
            group.crawlDelay !== null ? (
              <Badge>{t('page.robotsSitemap.crawlDelay', { n: group.crawlDelay })}</Badge>
            ) : undefined
          }
        >
          {group.rules.length === 0 ? (
            <p className="ni-hint">{t('page.robotsSitemap.noRules')}</p>
          ) : (
            <Card variant="rows">
              {group.rules.slice(0, PAGE_SIZE).map((rule) => (
                <div key={`${rule.type}-${rule.path}`} className="ni-pg-row ni-pg-row--rule">
                  <Badge tone={rule.type === 'allow' ? 'success' : 'danger'}>
                    {t(`page.robotsSitemap.${rule.type}`)}
                  </Badge>
                  <span className="ni-pg-mono">{rule.path || '/'}</span>
                </div>
              ))}
            </Card>
          )}
        </PanelSection>
      ))}
      <PanelSection title={t('page.robotsSitemap.raw')}>
        <CopyRow label="robots.txt" value={result.robotsUrl} copyValue={robots.raw} />
      </PanelSection>
    </>
  );
};

const isWebUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const SitemapBlock = ({ state, depth }: { state: SitemapState; depth: number }) => {
  const t = useT();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [children, setChildren] = useState<Record<string, SitemapState | 'loading'>>({});

  const openChild = async (url: string): Promise<void> => {
    setChildren((current) => ({ ...current, [url]: 'loading' }));
    const loaded = await loadSitemap(url, readText);
    setChildren((current) => ({ ...current, [url]: loaded }));
  };

  const { parsed } = state;
  const entries = (parsed?.entries ?? []).filter((entry) => isWebUrl(entry.loc));
  return (
    <PanelSection
      title={state.url}
      actions={
        parsed ? (
          <Badge tone="accent">
            {t(
              parsed.kind === 'index'
                ? 'page.robotsSitemap.indexCount'
                : 'page.robotsSitemap.urlCount',
              {
                n: entries.length,
              },
            )}
          </Badge>
        ) : undefined
      }
    >
      {state.gzipped ? <p className="ni-hint">{t('page.robotsSitemap.gzip')}</p> : null}
      {!state.gzipped && !parsed ? (
        <p className="ni-hint">
          {state.status === null
            ? t('page.robotsSitemap.unreadable')
            : t('page.robotsSitemap.notValid', { status: state.status })}
        </p>
      ) : null}
      {parsed?.kind === 'unknown' ? (
        <p className="ni-hint">{t('page.robotsSitemap.notSitemap')}</p>
      ) : null}
      <Card variant="rows">
        {entries.slice(0, visible).map((entry) => {
          const child = children[entry.loc];
          return (
            <div key={entry.loc} className="ni-pg-stack">
              <div className="ni-pg-row ni-pg-row--pair">
                <span className="ni-pg-row__main">
                  <a
                    className="ni-pg-row__title"
                    href={entry.loc}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={entry.loc}
                  >
                    {entry.loc}
                  </a>
                  {entry.lastmod ? <span className="ni-pg-row__sub">{entry.lastmod}</span> : null}
                </span>
                {parsed?.kind === 'index' && depth < 2 ? (
                  <button
                    type="button"
                    className="ni-button ni-button--sm"
                    disabled={child === 'loading'}
                    onClick={() => void openChild(entry.loc)}
                  >
                    {t(
                      child === 'loading' ? 'page.common.loading' : 'page.robotsSitemap.openChild',
                    )}
                  </button>
                ) : null}
              </div>
              {child && child !== 'loading' ? (
                <SitemapBlock state={child} depth={depth + 1} />
              ) : null}
            </div>
          );
        })}
      </Card>
      {entries.length > visible ? (
        <button
          type="button"
          className="ni-button"
          onClick={() => setVisible((n) => n + PAGE_SIZE)}
        >
          {t('page.common.showMore', { n: entries.length - visible })}
        </button>
      ) : null}
    </PanelSection>
  );
};

const RobotsSitemapPanel = () => {
  const t = useT();
  const [tab, setTab] = useState<RobotsTab>('robots');
  const { state, rescan } = useScan(() => analyzeRobotsSitemap(document, readText));
  return (
    <ScanView state={state} onRescan={rescan} loadingLabel={t('page.robotsSitemap.loading')}>
      {(result) => (
        <Tabs
          label={t('page.robotsSitemap.name')}
          value={tab}
          onChange={setTab}
          items={[
            { id: 'robots', label: 'robots.txt' },
            { id: 'sitemap', label: 'sitemap' },
          ]}
        >
          {tab === 'robots' ? <RobotsTabContent result={result} /> : null}
          {tab === 'sitemap'
            ? result.sitemaps.map((sitemap) => (
                <SitemapBlock key={sitemap.url} state={sitemap} depth={0} />
              ))
            : null}
        </Tabs>
      )}
    </ScanView>
  );
};

const robotsSitemap: ToolModule = {
  id: 'robotsSitemap',
  group: 'page',
  icon: Bot,
  mode: 'panel',
  Panel: RobotsSitemapPanel,
};

export default robotsSitemap;
