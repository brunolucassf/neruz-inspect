import { browser } from 'wxt/browser';
import { FONT_DIRECTORY, type FontDefinition, INSPECT_FONTS } from './fontFiles';

let registeredFaces: FontFace[] = [];

const tryRun = (action: () => void): boolean => {
  try {
    action();
    return true;
  } catch {
    return false;
  }
};

const getExtensionUrl = (path: string): string =>
  (browser.runtime.getURL as (value: string) => string)(path);

const createFace = ({ family, file, weight }: FontDefinition): FontFace | undefined => {
  try {
    const source = `url("${getExtensionUrl(`/${FONT_DIRECTORY}/${file}`)}") format("woff2")`;
    return new FontFace(family, source, { weight, style: 'normal', display: 'swap' });
  } catch {
    return undefined;
  }
};

export const registerInspectFonts = (): void => {
  if (registeredFaces.length > 0 || typeof FontFace === 'undefined') return;
  registeredFaces = INSPECT_FONTS.map(createFace).filter((face) => face !== undefined);
  for (const face of registeredFaces) {
    const isAdded = tryRun(() => document.fonts.add(face));
    if (isAdded) void face.load().catch(() => undefined);
  }
};

export const unregisterInspectFonts = (): void => {
  for (const face of registeredFaces) tryRun(() => document.fonts.delete(face));
  registeredFaces = [];
};
