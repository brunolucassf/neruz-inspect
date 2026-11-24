export const MEASUREMENT_ID = 'G-M4TF52T81Q';
export const EXTENSION_NAME = 'neruz-inspect';
export const COLLECT_URL = 'https://www.google-analytics.com/mp/collect';
export const DEBUG_COLLECT_URL = 'https://www.google-analytics.com/debug/mp/collect';
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
export const DEFAULT_ENGAGEMENT_MS = 100;
export const MAX_EVENT_NAME_LENGTH = 40;

export type AnalyticsParams = Record<string, string | number | boolean>;

export type AnalyticsSession = { sessionId: string; timestamp: number };

export type PayloadInput = {
  clientId: string;
  sessionId: string;
  name: string;
  version: string;
  params?: AnalyticsParams;
};

export type GateInput = {
  apiSecret: string | undefined;
  isEnabled: boolean;
  isFirefox: boolean;
  hasFirefoxPermission: boolean;
};

const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export const isValidEventName = (name: string): boolean =>
  name.length <= MAX_EVENT_NAME_LENGTH && EVENT_NAME_PATTERN.test(name);

export const buildPayload = ({ clientId, sessionId, name, version, params = {} }: PayloadInput) => {
  if (!isValidEventName(name)) throw new Error(`invalid analytics event name: ${name}`);
  return {
    client_id: clientId,
    events: [
      {
        name,
        params: {
          ...params,
          session_id: sessionId,
          engagement_time_msec: DEFAULT_ENGAGEMENT_MS,
          extension_name: EXTENSION_NAME,
          extension_version: version,
        },
      },
    ],
  };
};

export const buildPageViewParams = (pageName: string): AnalyticsParams => ({
  page_title: pageName,
  page_location: `extension://${EXTENSION_NAME}/${pageName}`,
});

export const buildEndpoint = (apiSecret: string, baseUrl: string = COLLECT_URL): string =>
  `${baseUrl}?measurement_id=${MEASUREMENT_ID}&api_secret=${encodeURIComponent(apiSecret)}`;

export const canSendAnalytics = ({
  apiSecret,
  isEnabled,
  isFirefox,
  hasFirefoxPermission,
}: GateInput): boolean => {
  if (!apiSecret || !isEnabled) return false;
  return !isFirefox || hasFirefoxPermission;
};

export const resolveSession = (
  current: AnalyticsSession | undefined,
  now: number,
): AnalyticsSession =>
  current && now - current.timestamp < SESSION_TIMEOUT_MS
    ? { sessionId: current.sessionId, timestamp: now }
    : { sessionId: String(now), timestamp: now };
