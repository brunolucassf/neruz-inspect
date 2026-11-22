import { SquareDashed } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { type HighlightItem, useHighlights, useViewportVersion } from '../../../lib/highlight';
import { useT } from '../../../lib/i18n';
import { OVERLAY_HOST_TAG } from '../../../lib/picker';
import { PanelSection } from '../../../ui';
import type { ToolModule } from '../../types';
import { collectPageElements } from '../shared/scan';
import '../shared/layout-tools.css';
import {
  buildOutlineCss,
  depthColor,
  OUTLINE_MAX_DEPTH,
  pickTagLabels,
  type TagCandidate,
} from './outlines';

const TAG_LIMIT = 250;

const useOutlineSheet = (): void => {
  useEffect(() => {
    const css = buildOutlineCss(OVERLAY_HOST_TAG);
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      return () => {
        document.adoptedStyleSheets = document.adoptedStyleSheets.filter((item) => item !== sheet);
      };
    } catch {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.append(style);
      return () => style.remove();
    }
  }, []);
};

const TagLabels = () => {
  const version = useViewportVersion();
  const elements = useMemo(() => collectPageElements().elements, []);

  const items = useMemo<HighlightItem[]>(() => {
    void version;
    const candidates: TagCandidate[] = elements
      .filter((element) => element.isConnected)
      .map((element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { tag: element.localName, rect: { x, y, width, height } };
      });
    return pickTagLabels(
      candidates,
      { width: window.innerWidth, height: window.innerHeight },
      TAG_LIMIT,
    ).map((candidate) => ({ kind: 'label', rect: candidate.rect, text: candidate.tag }));
  }, [elements, version]);

  useHighlights(items);
  return null;
};

const OutlinesPanel = () => {
  const t = useT();
  const [showTags, setShowTags] = useState(false);
  useOutlineSheet();

  const legendGradient = `linear-gradient(90deg, ${Array.from({ length: 8 }, (_, depth) =>
    depthColor(depth),
  ).join(', ')})`;

  return (
    <>
      <PanelSection title={t('layout.outlines.status.title')}>
        <p className="ni-hint">{t('layout.outlines.status.hint', { n: OUTLINE_MAX_DEPTH })}</p>
      </PanelSection>
      <label className="ni-lt-check">
        <input
          type="checkbox"
          checked={showTags}
          onChange={(event) => setShowTags(event.target.checked)}
        />
        {t('layout.outlines.showTags')}
      </label>
      {showTags ? <TagLabels /> : null}
      <div className="ni-lt-legend">
        <span>{t('layout.outlines.legend.shallow')}</span>
        <span className="ni-lt-legend__bar" style={{ background: legendGradient }} />
        <span>{t('layout.outlines.legend.deep')}</span>
      </div>
    </>
  );
};

const outlines: ToolModule = {
  id: 'outlines',
  group: 'layout',
  icon: SquareDashed,
  mode: 'action',
  Panel: OutlinesPanel,
};

export default outlines;
