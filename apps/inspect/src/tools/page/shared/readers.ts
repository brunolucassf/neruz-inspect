import { fetchViaBackground } from '../../../lib/bridge';

export type TextResponse = {
  status: number;
  ok: boolean;
  text: string;
  url: string;
  headers: Record<string, string>;
};

export type TextReader = (url: string) => Promise<TextResponse | null>;

export type StatusResult = { status: number | null; via: 'page' | 'background' };

export const isSameOrigin = (url: string, base: string = location.href): boolean => {
  try {
    return new URL(url, base).origin === new URL(base).origin;
  } catch {
    return false;
  }
};

const headersToRecord = (headers: Headers): Record<string, string> => {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key.toLowerCase()] = value;
  });
  return record;
};

export const readText: TextReader = async (url) => {
  if (isSameOrigin(url)) {
    try {
      const response = await fetch(url, { credentials: 'same-origin' });
      return {
        status: response.status,
        ok: response.ok,
        text: await response.text(),
        url: response.url,
        headers: headersToRecord(response.headers),
      };
    } catch {}
  }
  try {
    const response = await fetchViaBackground(url);
    return {
      status: response.status,
      ok: response.ok,
      text: response.text,
      url: response.url,
      headers: response.headers,
    };
  } catch {
    return null;
  }
};

const STATUS_FALLBACK = new Set([0, 400, 403, 405, 429, 501]);

export const readStatus = async (url: string): Promise<StatusResult> => {
  if (isSameOrigin(url)) {
    try {
      let response = await fetch(url, { method: 'HEAD', credentials: 'same-origin' });
      if (STATUS_FALLBACK.has(response.status)) {
        response = await fetch(url, { method: 'GET', credentials: 'same-origin' });
      }
      return { status: response.status, via: 'page' };
    } catch {}
  }
  try {
    let response = await fetchViaBackground(url, { method: 'HEAD' });
    if (STATUS_FALLBACK.has(response.status)) {
      response = await fetchViaBackground(url, { method: 'GET' });
    }
    return { status: response.status, via: 'background' };
  } catch {
    return { status: null, via: 'background' };
  }
};

const parseLength = (value: string | null | undefined): number | null => {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const readContentLength = async (url: string): Promise<number | null> => {
  if (isSameOrigin(url)) {
    try {
      const response = await fetch(url, { method: 'HEAD', credentials: 'same-origin' });
      const length = parseLength(response.headers.get('content-length'));
      if (length) return length;
    } catch {}
  }
  try {
    const response = await fetchViaBackground(url, { method: 'HEAD' });
    return parseLength(response.headers['content-length']);
  } catch {
    return null;
  }
};
