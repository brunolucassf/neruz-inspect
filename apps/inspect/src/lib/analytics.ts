import { browser } from 'wxt/browser';
import {
  type AnalyticsParams,
  type AnalyticsSession,
  buildEndpoint,
  buildPageViewParams,
  buildPayload,
  canSendAnalytics,
  resolveSession,
} from './analyticsCore';
import { parseSettings } from './settings';
import { STORAGE_KEYS } from './storage-keys';

export const FIREFOX_DATA_PERMISSION = { data_collection: ['technicalAndInteraction'] };

const API_SECRET = (import.meta.env as Record<string, string | undefined>).WXT_GA_API_SECRET;
const IS_FIREFOX = import.meta.env.FIREFOX === true;

type PermissionsApi = {
  contains: (query: unknown) => Promise<boolean>;
  request: (query: unknown) => Promise<boolean>;
  remove: (query: unknown) => Promise<boolean>;
};

const permissionsApi = (): PermissionsApi => browser.permissions as unknown as PermissionsApi;

export const hasFirefoxDataPermission = (): Promise<boolean> =>
  permissionsApi()
    .contains(FIREFOX_DATA_PERMISSION)
    .catch(() => false);

export const requestFirefoxDataPermission = (): Promise<boolean> =>
  permissionsApi()
    .request(FIREFOX_DATA_PERMISSION)
    .catch(() => false);

export const removeFirefoxDataPermission = (): Promise<boolean> =>
  permissionsApi()
    .remove(FIREFOX_DATA_PERMISSION)
    .catch(() => false);

export const isFirefoxBuild = IS_FIREFOX;

const readIsEnabled = async (): Promise<boolean> => {
  const stored = await browser.storage.local.get(STORAGE_KEYS.settings);
  return parseSettings(stored[STORAGE_KEYS.settings]).analytics;
};

const getClientId = async (): Promise<string> => {
  const stored = await browser.storage.local.get(STORAGE_KEYS.analyticsClientId);
  const existing = stored[STORAGE_KEYS.analyticsClientId];
  if (typeof existing === 'string' && existing) return existing;
  const id = crypto.randomUUID();
  await browser.storage.local.set({ [STORAGE_KEYS.analyticsClientId]: id });
  return id;
};

const getSessionId = async (): Promise<string> => {
  const stored = await browser.storage.session.get(STORAGE_KEYS.analyticsSession);
  const next = resolveSession(
    stored[STORAGE_KEYS.analyticsSession] as AnalyticsSession | undefined,
    Date.now(),
  );
  await browser.storage.session.set({ [STORAGE_KEYS.analyticsSession]: next });
  return next.sessionId;
};

export const track = async (name: string, params: AnalyticsParams = {}): Promise<void> => {
  try {
    const canSend = canSendAnalytics({
      apiSecret: API_SECRET,
      isEnabled: await readIsEnabled(),
      isFirefox: IS_FIREFOX,
      hasFirefoxPermission: IS_FIREFOX ? await hasFirefoxDataPermission() : false,
    });
    if (!canSend || !API_SECRET) return;
    const body = buildPayload({
      clientId: await getClientId(),
      sessionId: await getSessionId(),
      name,
      version: browser.runtime.getManifest().version,
      params,
    });
    await fetch(buildEndpoint(API_SECRET), {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      body: JSON.stringify(body),
    });
  } catch {
    // analytics must never affect the extension
  }
};

export const trackPageView = (pageName: string): Promise<void> =>
  track('page_view', buildPageViewParams(pageName));
