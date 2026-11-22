import { parseManifestIcons } from '../shared/favicons';
import { fileNameFromUrl } from '../shared/format';
import type { TextReader } from '../shared/readers';
import { type AssetItem, assessImage, detectFormat } from './analyzeAssets';

export const loadManifestIconItems = async (
  doc: Document,
  readText: TextReader,
  idPrefix = 'manifest',
): Promise<AssetItem[]> => {
  const link = doc.querySelector<HTMLLinkElement>('link[rel~="manifest" i][href]');
  if (!link) return [];
  const response = await readText(link.href);
  if (!response?.ok) return [];
  return parseManifestIcons(response.text, link.href).map((icon, index): AssetItem => {
    const format = detectFormat(icon.url, icon.type);
    const input = {
      category: 'favicon' as const,
      isImgElement: false,
      format,
      naturalWidth: 0,
      naturalHeight: 0,
      displayWidth: 0,
      displayHeight: 0,
      devicePixelRatio: 1,
      bytes: null,
      hasDimensionAttributes: true,
      loading: '',
      aboveFold: true,
      alt: '',
    };
    return {
      id: `${idPrefix}-${index}`,
      category: 'favicon',
      name: `${icon.sizes ? `${icon.sizes}-` : ''}${fileNameFromUrl(icon.url, 'icon')}`,
      url: icon.url,
      thumbnail: icon.url,
      format,
      input,
      alerts: assessImage(input),
      svgMarkup: null,
      srcsetCount: 0,
      element: null,
    };
  });
};
