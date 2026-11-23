import { Download, Shapes } from 'lucide-react';
import { copyText } from '../../../lib/clipboard';
import { useT } from '../../../lib/i18n';
import { Badge, Card, EmptyState, PanelSection, Thumb } from '../../../ui';
import type { ToolModule } from '../../types';
import { downloadAssetUrl, downloadInlineSvg } from '../assets/assetDownload';
import { fileNameFromUrl, toFileSlug } from '../shared/format';
import { ScanView } from '../shared/ScanView';
import { useElementFocus } from '../shared/useElementFocus';
import { useScan } from '../shared/useScan';
import { analyzeIcons, type PageIcon } from './analyzeIcons';
import '../shared/page.css';

const IconTile = ({ icon, onFocus }: { icon: PageIcon; onFocus: (icon: PageIcon) => void }) => {
  const t = useT();
  return (
    <div className="ni-pg-tile">
      <button
        type="button"
        className="ni-pg-tile__art ni-pg-tile__button"
        aria-label={t('page.common.highlight')}
        disabled={!icon.element}
        onClick={() => onFocus(icon)}
      >
        <img src={icon.preview} alt="" width={32} height={32} />
      </button>
      <span className="ni-pg-muted ni-pg-tile__name" title={icon.name}>
        {icon.name.length > 12 ? `${icon.name.slice(0, 11)}…` : icon.name}
      </span>
      <span className="ni-pg-tile__actions">
        <button
          type="button"
          className="ni-icon-button"
          onClick={() => void copyText(icon.markup, 'SVG')}
        >
          <span className="ni-visually-hidden">{t('page.icons.copySvg', { name: icon.name })}</span>
          <span aria-hidden="true">{'</>'}</span>
        </button>
        <button
          type="button"
          className="ni-icon-button"
          aria-label={t('page.assets.download', { name: icon.name })}
          onClick={() => downloadInlineSvg(icon.markup, toFileSlug(icon.name) || 'icon')}
        >
          <Download size={14} aria-hidden="true" />
        </button>
      </span>
    </div>
  );
};

const IconsPanel = () => {
  const t = useT();
  const { focus } = useElementFocus();
  const { state, rescan } = useScan(() => analyzeIcons(document));
  return (
    <ScanView state={state} onRescan={rescan}>
      {(result) => (
        <>
          <PanelSection title={t('page.icons.section.libraries')}>
            {result.libraries.length === 0 ? (
              <p className="ni-hint">{t('page.icons.noLibrary')}</p>
            ) : (
              <Card variant="rows">
                {result.libraries.map((library) => (
                  <div key={library.id} className="ni-pg-row ni-pg-row--pair">
                    <span className="ni-pg-row__main">
                      <span className="ni-pg-row__title">
                        {library.name}
                        {library.version ? ` ${library.version}` : ''}
                      </span>
                      <span className="ni-pg-row__sub">{library.evidence.join(' · ')}</span>
                    </span>
                    <Badge tone={library.confidence === 'certain' ? 'success' : 'warning'}>
                      {t(`page.icons.confidence.${library.confidence}`)}
                    </Badge>
                  </div>
                ))}
              </Card>
            )}
            {result.truncated ? <p className="ni-hint">{t('page.common.limit5000')}</p> : null}
          </PanelSection>
          <PanelSection title={t('page.icons.section.icons')} count={result.icons.length}>
            {result.icons.length === 0 ? (
              <EmptyState title={t('page.icons.empty')} hint={t('page.icons.emptyHint')} />
            ) : (
              <div className="ni-pg-grid">
                {result.icons.map((icon) => (
                  <IconTile
                    key={icon.id}
                    icon={icon}
                    onFocus={(selected) =>
                      selected.element && focus(selected.element, selected.name)
                    }
                  />
                ))}
              </div>
            )}
          </PanelSection>
          <PanelSection title={t('page.icons.section.favicons')} count={result.favicons.length}>
            <Card variant="rows">
              {result.favicons.map((favicon) => {
                const name = fileNameFromUrl(favicon.url, 'favicon');
                return (
                  <div key={favicon.url} className="ni-pg-row ni-pg-row--thumb ni-pg-row--center">
                    <Thumb src={favicon.url} hasTransparency />
                    <span className="ni-pg-row__main">
                      <span className="ni-pg-row__title">{name}</span>
                      <span className="ni-pg-row__sub">
                        {[favicon.kind, favicon.sizes].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="ni-icon-button"
                      aria-label={t('page.assets.download', { name })}
                      title={t('page.assets.download', { name })}
                      onClick={() => void downloadAssetUrl(favicon.url, name)}
                    >
                      <Download size={14} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </Card>
          </PanelSection>
        </>
      )}
    </ScanView>
  );
};

const icons: ToolModule = {
  id: 'icons',
  group: 'page',
  icon: Shapes,
  mode: 'panel',
  Panel: IconsPanel,
};

export default icons;
