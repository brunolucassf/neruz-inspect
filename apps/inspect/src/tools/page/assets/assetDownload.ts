import { fetchViaBackground } from '../../../lib/bridge';
import { downloadBlob, downloadText } from '../../../lib/download';
import { t } from '../../../lib/i18n';
import { toast } from '../../../lib/toast';
import { fileNameFromUrl } from '../shared/format';
import { isSameOrigin } from '../shared/readers';

const SVG_MIME = 'image/svg+xml';

const downloadName = (url: string, fallback: string): string => fileNameFromUrl(url, fallback);

const fetchBlob = async (url: string): Promise<Blob | null> => {
  try {
    const response = await fetch(url, {
      credentials: isSameOrigin(url) ? 'same-origin' : 'omit',
      mode: 'cors',
    });
    return response.ok ? await response.blob() : null;
  } catch {
    return null;
  }
};

const fetchSvgViaBackground = async (url: string): Promise<Blob | null> => {
  try {
    const response = await fetchViaBackground(url);
    return response.ok && !response.truncated
      ? new Blob([response.text], { type: SVG_MIME })
      : null;
  } catch {
    return null;
  }
};

const openInNewTab = (url: string): void => {
  window.open(url, '_blank', 'noopener,noreferrer');
  toast(t('page.assets.openedTab'), 'info');
};

export const downloadAssetUrl = async (url: string, fallbackName: string): Promise<void> => {
  const name = downloadName(url, fallbackName);
  const blob =
    (await fetchBlob(url)) ?? (/\.svg(\?|$)/i.test(url) ? await fetchSvgViaBackground(url) : null);
  if (!blob) {
    openInNewTab(url);
    return;
  }
  downloadBlob(blob, name);
  toast(t('page.common.downloaded'), 'success');
};

export const downloadInlineSvg = (markup: string, name: string): void => {
  downloadText(markup, name.endsWith('.svg') ? name : `${name}.svg`, SVG_MIME);
};

const SPACING_MS = 140;

export const downloadAllInlineSvgs = async (
  svgs: readonly { markup: string; name: string }[],
): Promise<void> => {
  const used = new Set<string>();
  for (const [index, svg] of svgs.entries()) {
    let name = svg.name.replace(/[^\w.-]+/g, '-');
    if (used.has(name)) name = `${index + 1}-${name}`;
    used.add(name);
    downloadInlineSvg(svg.markup, name);
    await new Promise((resolve) => setTimeout(resolve, SPACING_MS));
  }
  toast(t('page.common.downloaded'), 'success');
};
